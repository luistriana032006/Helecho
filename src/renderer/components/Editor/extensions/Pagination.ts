import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import type { EditorView } from '@tiptap/pm/view'
import { PAGE_HEIGHT, PAGE_MARGIN, USABLE_HEIGHT } from '../pageMetrics'
import { useSettingsStore } from '../../../store/settingsStore'

interface PageBreak {
  pos: number
  height: number
}

const paginationKey = new PluginKey<DecorationSet>('pagination')

/**
 * Simula el flujo vertical de los bloques de primer nivel y calcula
 * dónde insertar espaciadores para que ningún bloque cruce el margen
 * inferior de una hoja. Mide solo alturas naturales de los bloques
 * (los espaciadores existentes no las afectan), así el resultado es
 * estable entre pasadas.
 */
function computeBreaks(view: EditorView): PageBreak[] {
  const breaks: PageBreak[] = []
  let y = PAGE_MARGIN
  let prevMarginBottom = 0
  let page = 0

  view.state.doc.forEach((_node, offset) => {
    const dom = view.nodeDOM(offset)
    if (!(dom instanceof HTMLElement)) return

    const style = window.getComputedStyle(dom)
    const marginTop = parseFloat(style.marginTop) || 0
    const marginBottom = parseFloat(style.marginBottom) || 0
    const height = dom.offsetHeight

    // Los márgenes verticales entre bloques hermanos colapsan
    let top = y + Math.max(prevMarginBottom, marginTop)
    let bottom = top + height
    const pageBottom = (page + 1) * PAGE_HEIGHT - PAGE_MARGIN

    if (bottom > pageBottom && height <= USABLE_HEIGHT) {
      page += 1
      const nextContentTop = page * PAGE_HEIGHT + PAGE_MARGIN
      // El espaciador rompe el colapso de márgenes: en el DOM real quedan
      // prevMarginBottom + espaciador + marginTop antes del bloque
      const spacer = Math.max(0, nextContentTop - y - prevMarginBottom - marginTop)
      breaks.push({ pos: offset, height: spacer })
      top = nextContentTop
      bottom = top + height
    } else if (bottom > pageBottom && top > page * PAGE_HEIGHT + PAGE_MARGIN) {
      // Bloque más alto que una hoja (tabla gigante): no se puede partir,
      // pero al menos arranca limpio al inicio de una hoja nueva en vez
      // de empezar a mitad de hoja y desbordar peor
      page += 1
      const nextContentTop = page * PAGE_HEIGHT + PAGE_MARGIN
      const spacer = Math.max(0, nextContentTop - y - prevMarginBottom - marginTop)
      breaks.push({ pos: offset, height: spacer })
      top = nextContentTop
      bottom = top + height
    }

    y = bottom
    prevMarginBottom = marginBottom
    page = Math.max(page, Math.floor((bottom - 1) / PAGE_HEIGHT))
  })

  return breaks
}

function buildDecorations(view: EditorView, breaks: PageBreak[]): DecorationSet {
  const decorations = breaks.map((b) =>
    Decoration.widget(
      b.pos,
      () => {
        const el = document.createElement('div')
        el.className = 'page-break-spacer'
        el.style.height = `${b.height}px`
        el.contentEditable = 'false'
        return el
      },
      { side: -1, key: `break-${b.pos}-${b.height}` }
    )
  )
  return DecorationSet.create(view.state.doc, decorations)
}

export const Pagination = Extension.create({
  name: 'pagination',

  addProseMirrorPlugins() {
    let rafId = 0
    let lastBreaks = ''

    return [
      new Plugin({
        key: paginationKey,
        state: {
          init: () => DecorationSet.empty,
          apply(tr, old) {
            const meta = tr.getMeta(paginationKey) as DecorationSet | undefined
            if (meta) return meta
            return tr.docChanged ? old.map(tr.mapping, tr.doc) : old
          },
        },
        props: {
          decorations(state) {
            return paginationKey.getState(state) ?? DecorationSet.empty
          },
        },
        view(view) {
          const measure = () => {
            if (view.isDestroyed) return
            const strict = useSettingsStore.getState().pageMode === 'estricta'
            const breaks = strict ? computeBreaks(view) : []
            const signature = JSON.stringify(breaks)
            if (signature === lastBreaks) return
            lastBreaks = signature
            const tr = view.state.tr
              .setMeta(paginationKey, buildDecorations(view, breaks))
              .setMeta('addToHistory', false)
            view.dispatch(tr)
          }

          const schedule = () => {
            cancelAnimationFrame(rafId)
            rafId = requestAnimationFrame(measure)
          }

          schedule()
          // Reacciona a cambios de altura por carga de fuentes (KaTeX) o imágenes
          const observer = new ResizeObserver(schedule)
          observer.observe(view.dom)
          // Recalcula al cambiar entre modo fluido y página estricta
          const unsubscribe = useSettingsStore.subscribe(schedule)

          return {
            update: (v, prevState) => {
              if (!prevState.doc.eq(v.state.doc)) schedule()
            },
            destroy: () => {
              cancelAnimationFrame(rafId)
              observer.disconnect()
              unsubscribe()
            },
          }
        },
      }),
    ]
  },
})
