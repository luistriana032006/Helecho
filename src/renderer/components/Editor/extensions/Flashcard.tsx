import { Node, mergeAttributes } from '@tiptap/core'

/**
 * Tarjeta de repaso: nodo INLINE atómico que marca el ancla en el texto (un
 * pin tipo tarjeta). La tarjeta flotante en sí NO vive en el documento
 * ProseMirror: la dibuja FlashcardLayer leyendo estos nodos — igual que los
 * post-its. Así se arrastra libre por la hoja sin pelear con la paginación, y
 * el PDF la reconstruye junto a su pin con el mismo desplazamiento.
 *
 * Atributos: id (estable), front (concepto), back (definición) y dx/dy
 * (desplazamiento de la tarjeta respecto al pin, en px de hoja sin zoom).
 *
 * Atributo `color`: categoría de color por tarjeta (como los post-its). Tiñe
 * la cabecera, el pin y la línea guía; se elige en el panel de edición de
 * FlashcardLayer y se persiste en el .md. Default 'indigo' (compatibilidad).
 */

/** Paleta de categorías. `pin` es el color sólido; `soft` el tinte claro. */
export const FLASHCARD_COLORS: { id: string; pin: string; soft: string; label: string }[] = [
  { id: 'indigo', pin: '#6366f1', soft: '#eef2ff', label: 'Índigo' },
  { id: 'verde', pin: '#22c55e', soft: '#dcfce7', label: 'Verde' },
  { id: 'ambar', pin: '#f59e0b', soft: '#fef3c7', label: 'Ámbar' },
  { id: 'rosa', pin: '#ec4899', soft: '#fce7f3', label: 'Rosa' },
  { id: 'cian', pin: '#06b6d4', soft: '#cffafe', label: 'Cian' },
]

export const flashcardColor = (id: string) =>
  FLASHCARD_COLORS.find((c) => c.id === id) ?? FLASHCARD_COLORS[0]

export const FLASHCARD_DEFAULT_DX = 28
export const FLASHCARD_DEFAULT_DY = 8

const intAttr = (el: Element, name: string, fallback: number): number => {
  const value = Number(el.getAttribute(name))
  return Number.isFinite(value) ? value : fallback
}

export const Flashcard = Node.create({
  name: 'flashcard',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      id: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-id') ?? '',
        renderHTML: (attrs) => ({ 'data-id': attrs.id as string }),
      },
      color: {
        default: 'indigo',
        parseHTML: (el) => el.getAttribute('data-color') ?? 'indigo',
        renderHTML: (attrs) => ({ 'data-color': attrs.color as string }),
      },
      front: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-front') ?? '',
        renderHTML: (attrs) => ({ 'data-front': attrs.front as string }),
      },
      back: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-back') ?? '',
        renderHTML: (attrs) => ({ 'data-back': attrs.back as string }),
      },
      dx: {
        default: FLASHCARD_DEFAULT_DX,
        parseHTML: (el) => intAttr(el, 'data-dx', FLASHCARD_DEFAULT_DX),
        renderHTML: (attrs) => ({ 'data-dx': String(attrs.dx) }),
      },
      dy: {
        default: FLASHCARD_DEFAULT_DY,
        parseHTML: (el) => intAttr(el, 'data-dy', FLASHCARD_DEFAULT_DY),
        renderHTML: (attrs) => ({ 'data-dy': String(attrs.dy) }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-type="flashcard"]' }]
  },

  renderHTML({ node, HTMLAttributes }) {
    // El pin: lleva front/back/dx/dy como data-* para que el clon del export
    // PDF reconstruya la tarjeta sin depender del CSS de la app
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'flashcard',
        'data-front': (node.attrs.front as string) ?? '',
        'data-back': (node.attrs.back as string) ?? '',
        'data-dx': String(node.attrs.dx),
        'data-dy': String(node.attrs.dy),
        'data-color': (node.attrs.color as string) ?? 'indigo',
        class: 'flashcard-pin',
        title: 'Tarjeta de repaso',
        // color inline para que el clon del PDF lo conserve sin el CSS de la app
        style: `background:${flashcardColor(node.attrs.color as string).pin}`,
      }),
    ]
  },
})
