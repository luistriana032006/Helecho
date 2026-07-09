import { Node, mergeAttributes } from '@tiptap/core'
import type { Node as PMNode } from '@tiptap/pm/model'
import { confirmDialog } from '../../../lib/confirmDialog'

/** ¿El nodo tiene texto escrito o algún bloque (gráfica, plano, imagen…)? */
function hasContent(n: PMNode): boolean {
  if (n.textContent.trim().length > 0) return true
  let found = false
  n.descendants((child) => {
    if (found) return false
    if (child.isAtom) found = true // gráfica, plano, grafo, imagen, tarjeta…
    return !found
  })
  return found
}

/**
 * Columnas estilo Word/Docs: una sección que parte la hoja en 2 o 3 columnas
 * verticales lado a lado. Cada columna es un sub-flujo de bloques normales
 * (texto, gráficas, lo que sea); un bloque colocado en una columna vive dentro
 * de su ancho y se ajusta a él (los nodos de gráfico miden el contenedor).
 *
 * El contenedor usa un NodeView de JS PURO (no React): así el `contentDOM` es
 * el div flex que yo controlo y ProseMirror mete las columnas DENTRO de él,
 * garantizado. (El NodeView de React rompía el contentDOM por el desajuste de
 * versiones @tiptap core/react v2 + pm v3, y las columnas se apilaban.)
 *
 * La fila flex y el `flex:1` de cada columna van como estilos INLINE para que
 * sobrevivan al clon del PDF (el HTML del print no carga Tailwind/globals.css
 * — mismo motivo que post-its/tarjetas).
 */

const COLS_MIN = 2
const COLS_MAX = 3

export const Column = Node.create({
  name: 'column',
  content: 'block+',
  isolating: true,
  selectable: false,

  parseHTML() {
    return [{ tag: 'div[data-type="column"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'column',
        class: 'helecho-column',
        // flex:1 reparte el ancho por igual; min-width:0 deja que el contenido
        // (gráficas) se encoja por debajo de su tamaño natural y quepa.
        style: 'flex: 1 1 0; min-width: 0',
      }),
      0,
    ]
  },

  addNodeView() {
    return ({ editor, getPos }) => {
      const dom = document.createElement('div')
      dom.className = 'helecho-column'
      dom.setAttribute('data-type', 'column')
      dom.style.flex = '1 1 0'
      dom.style.minWidth = '0'
      dom.style.position = 'relative'

      // ✕ por columna (aparece al pasar el mouse; se excluye del PDF)
      const delBtn = document.createElement('button')
      delBtn.type = 'button'
      delBtn.className = 'column-del'
      delBtn.textContent = '✕'
      delBtn.title = 'Eliminar esta columna'
      delBtn.contentEditable = 'false'
      delBtn.addEventListener('mousedown', (e) => {
        e.preventDefault()
        e.stopPropagation()
        void onDelete()
      })

      const content = document.createElement('div')
      content.className = 'column-content'

      dom.append(delBtn, content)

      async function onDelete() {
        if (typeof getPos !== 'function') return
        const { state, view } = editor
        const pos = getPos()
        const $pos = state.doc.resolve(pos)
        const parent = $pos.parent
        if (parent.type.name !== 'columnBlock') return
        const colNode = state.doc.nodeAt(pos)
        if (!colNode) return

        // Con 2 columnas, borrar una dejaría una sola (no permitido): se elimina
        // la sección entera. Con 3, se quita solo esta columna.
        const wholeSection = parent.childCount <= 2

        // Si se va a borrar toda la sección, el aviso mira TODAS las columnas
        // (no solo la clickeada) para no perder lo que haya en la otra.
        if (hasContent(wholeSection ? parent : colNode)) {
          const ok = await confirmDialog(
            wholeSection
              ? 'Al borrar esta columna quedaría una sola, así que se elimina TODA la sección de columnas.\n\n¿Eliminar la sección y su contenido?'
              : 'Esta columna tiene contenido adentro.\n\n¿Eliminar esta columna y lo que hay dentro?'
          )
          if (!ok) return
        }

        if (wholeSection) {
          view.dispatch(state.tr.delete($pos.before($pos.depth), $pos.after($pos.depth)))
        } else {
          view.dispatch(state.tr.delete(pos, pos + colNode.nodeSize))
        }
        view.focus()
      }

      return {
        dom,
        contentDOM: content,
        ignoreMutation: (mutation) => {
          if (mutation.type === 'selection') return false
          return delBtn.contains(mutation.target as globalThis.Node)
        },
      }
    }
  },
})

export const ColumnBlock = Node.create({
  name: 'columnBlock',
  group: 'block',
  content: 'column{2,3}',
  isolating: true,
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-type="columns"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'columns',
        class: 'columns-row',
        style: 'display: flex; gap: 16px; align-items: flex-start',
      }),
      0,
    ]
  },

  addNodeView() {
    return ({ node, editor, getPos }) => {
      let current = node

      const dom = document.createElement('div')
      dom.className = 'helecho-columns'

      // ── Barra de controles (no es contenido; se excluye del PDF) ──
      const toolbar = document.createElement('div')
      toolbar.className = 'columns-toolbar'
      toolbar.contentEditable = 'false'
      toolbar.addEventListener('pointerdown', (e) => e.stopPropagation())

      const label = document.createElement('span')
      label.className = 'columns-toolbar-label'
      label.textContent = 'Columnas:'
      toolbar.appendChild(label)

      const buttons = new Map<number, HTMLButtonElement>()
      for (let n = COLS_MIN; n <= COLS_MAX; n++) {
        const b = document.createElement('button')
        b.type = 'button'
        b.className = 'columns-btn'
        b.textContent = String(n)
        b.title = `${n} columnas`
        b.addEventListener('mousedown', (e) => {
          e.preventDefault()
          setCount(n)
        })
        toolbar.appendChild(b)
        buttons.set(n, b)
      }

      // Separador + botón eliminar la sección completa
      const sep = document.createElement('span')
      sep.className = 'columns-sep'
      toolbar.appendChild(sep)

      const del = document.createElement('button')
      del.type = 'button'
      del.className = 'columns-btn columns-btn-danger'
      del.textContent = '✕ Eliminar'
      del.title = 'Eliminar la sección de columnas'
      del.addEventListener('mousedown', (e) => {
        e.preventDefault()
        void removeSection()
      })
      toolbar.appendChild(del)

      // ── Fila flex: ESTE es el contentDOM (las columnas van aquí dentro) ──
      const row = document.createElement('div')
      row.className = 'columns-row'
      row.style.display = 'flex'
      row.style.gap = '16px'
      row.style.alignItems = 'flex-start'

      dom.append(toolbar, row)

      const refresh = (count: number) => {
        buttons.forEach((b, n) => {
          b.className = n === count ? 'columns-btn columns-btn-active' : 'columns-btn'
        })
      }
      refresh(current.childCount)

      /** Reemplaza el nodo por uno con `target` columnas, preservando contenido. */
      function setCount(target: number) {
        if (target < COLS_MIN || target > COLS_MAX) return
        if (typeof getPos !== 'function') return
        const count = current.childCount
        if (target === count) return

        const { state, view } = editor
        const colType = state.schema.nodes.column
        const cols: PMNode[] = []
        for (let k = 0; k < current.childCount; k++) cols.push(current.child(k))

        let next: PMNode[]
        if (target > count) {
          // Agregar columnas vacías al final
          next = [...cols]
          for (let k = count; k < target; k++) {
            const empty = colType.createAndFill()
            if (empty) next.push(empty)
          }
        } else {
          // Quitar columnas: el contenido sobrante se funde en la última que se
          // conserva, para no perder nada de lo escrito.
          const kept = cols.slice(0, target)
          const dropped = cols.slice(target)
          const last = kept[target - 1]
          const merged: PMNode[] = []
          last.content.forEach((n) => merged.push(n))
          dropped.forEach((col) => col.content.forEach((n) => merged.push(n)))
          kept[target - 1] = colType.create(last.attrs, merged)
          next = kept
        }

        const pos = getPos()
        const newNode = current.type.create(current.attrs, next)
        view.dispatch(state.tr.replaceWith(pos, pos + current.nodeSize, newNode))
      }

      /** Elimina la sección entera; avisa antes si hay contenido dentro. */
      async function removeSection() {
        if (typeof getPos !== 'function') return
        if (hasContent(current)) {
          const ok = await confirmDialog(
            'Esta sección de columnas tiene contenido adentro.\n\n¿Eliminar las columnas y todo lo que hay dentro?'
          )
          if (!ok) return
        }
        const pos = getPos()
        const { state, view } = editor
        view.dispatch(state.tr.delete(pos, pos + current.nodeSize))
        view.focus()
      }

      return {
        dom,
        contentDOM: row,
        update: (updated) => {
          if (updated.type.name !== 'columnBlock') return false
          current = updated
          refresh(updated.childCount)
          return true
        },
        ignoreMutation: (mutation) => {
          // Las mutaciones del contenido (la fila) las maneja ProseMirror; las
          // de la barra de controles se ignoran (no son contenido).
          if (mutation.type === 'selection') return false
          return toolbar.contains(mutation.target as globalThis.Node)
        },
      }
    }
  },
})
