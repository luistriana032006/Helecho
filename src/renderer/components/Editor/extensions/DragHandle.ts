import { Extension } from '@tiptap/core'
import { NodeSelection, Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import type { EditorView } from '@tiptap/pm/view'
import type { Node as PMNode } from '@tiptap/pm/model'

const dragHandleKey = new PluginKey<DecorationSet>('dragHandle')

/**
 * Agarre de arrastre fijo: cada bloque de primer nivel
 * tiene un grip (⠿) siempre visible en el margen izquierdo de la hoja.
 * Arrastrarlo mueve el bloque completo; ProseMirror gestiona el soltado
 * y Dropcursor dibuja la línea indicadora.
 */

function createHandle(
  view: EditorView,
  getPos: () => number | undefined,
  extraClass?: string
): HTMLElement {
  const el = document.createElement('div')
  el.className = extraClass ? `drag-handle ${extraClass}` : 'drag-handle'
  el.draggable = true
  el.contentEditable = 'false'
  el.textContent = '⠿'
  el.title = 'Arrastrar bloque'

  el.addEventListener('dragstart', (e: DragEvent) => {
    // Evita que el manejador de dragstart de ProseMirror pise esta lógica
    e.stopPropagation()
    if (!e.dataTransfer) return

    const pos = getPos()
    if (pos === undefined) return
    const node = view.state.doc.nodeAt(pos)
    if (!node) return

    const selection = NodeSelection.create(view.state.doc, pos)
    view.dispatch(view.state.tr.setSelection(selection))

    const dom = view.nodeDOM(pos)
    if (dom instanceof HTMLElement) {
      e.dataTransfer.setDragImage(dom, 0, 0)
    }
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', '⠿')
    view.dragging = { slice: selection.content(), move: true }
  })

  return el
}

function buildDecorations(doc: PMNode): DecorationSet {
  const decorations: Decoration[] = []
  doc.forEach((node, offset) => {
    const isList = node.type.name === 'bulletList' || node.type.name === 'orderedList'
    decorations.push(
      Decoration.widget(
        offset,
        // Las listas llevan su grip más afuera para no chocar con los
        // grips individuales de sus ítems
        (view, getPos) => createHandle(view, getPos, isList ? 'drag-handle-list' : undefined),
        {
          // side 0: queda después del espaciador de paginación (side -1),
          // así el grip se alinea con el bloque y no con el hueco entre hojas
          side: 0,
          key: `drag-handle-${offset}`,
        }
      )
    )

    // Grips individuales por ítem de lista: arrastran solo ese ítem
    if (isList) {
      node.forEach((_item, itemOffset) => {
        const pos = offset + 1 + itemOffset
        decorations.push(
          Decoration.widget(
            pos,
            (view, getPos) => createHandle(view, getPos, 'drag-handle-item'),
            { side: 0, key: `drag-handle-item-${pos}` }
          )
        )
      })
    }
  })
  return DecorationSet.create(doc, decorations)
}

export const DragHandle = Extension.create({
  name: 'dragHandle',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: dragHandleKey,
        state: {
          init: (_config, state) => buildDecorations(state.doc),
          apply: (tr, old) => (tr.docChanged ? buildDecorations(tr.doc) : old),
        },
        props: {
          decorations(state) {
            return dragHandleKey.getState(state) ?? DecorationSet.empty
          },
        },
      }),
    ]
  },
})
