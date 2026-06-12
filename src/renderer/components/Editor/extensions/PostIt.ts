import { Node, mergeAttributes } from '@tiptap/core'

/**
 * Post-it: nodo INLINE atómico que marca el origen de la nota en el texto
 * (un pin pequeño de color). La nota flotante en sí NO vive en el documento
 * ProseMirror: la dibuja PostItLayer leyendo estos nodos — así no pelea con
 * la paginación ni con el flujo del texto.
 *
 * Atributos: id (estable, para editar/borrar desde la capa), color
 * (categoría), text (contenido) y dx/dy (desplazamiento de la nota respecto
 * al pin, en px de hoja sin zoom — el usuario la arrastra donde quiera).
 */

export const POSTIT_COLORS: { id: string; bg: string; pin: string; label: string }[] = [
  { id: 'amarillo', bg: '#fef08a', pin: '#eab308', label: 'Amarillo' },
  { id: 'verde', bg: '#bbf7d0', pin: '#22c55e', label: 'Verde' },
  { id: 'azul', bg: '#bfdbfe', pin: '#3b82f6', label: 'Azul' },
  { id: 'rosa', bg: '#fbcfe8', pin: '#ec4899', label: 'Rosa' },
]

export const postitColor = (id: string) =>
  POSTIT_COLORS.find((c) => c.id === id) ?? POSTIT_COLORS[0]

/** Desplazamiento por defecto: la nota nace a la derecha del pin, arriba */
export const POSTIT_DEFAULT_DX = 28
export const POSTIT_DEFAULT_DY = -12

const intAttr = (el: Element, name: string, fallback: number): number => {
  const value = Number(el.getAttribute(name))
  return Number.isFinite(value) ? value : fallback
}

export const PostIt = Node.create({
  name: 'postit',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      id: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-id') ?? '',
        renderHTML: (attrs) => ({ 'data-id': attrs.id }),
      },
      color: {
        default: 'amarillo',
        parseHTML: (el) => el.getAttribute('data-color') ?? 'amarillo',
        renderHTML: (attrs) => ({ 'data-color': attrs.color }),
      },
      text: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-text') ?? '',
        renderHTML: (attrs) => ({ 'data-text': attrs.text }),
      },
      dx: {
        default: POSTIT_DEFAULT_DX,
        parseHTML: (el) => intAttr(el, 'data-dx', POSTIT_DEFAULT_DX),
        renderHTML: (attrs) => ({ 'data-dx': String(attrs.dx) }),
      },
      dy: {
        default: POSTIT_DEFAULT_DY,
        parseHTML: (el) => intAttr(el, 'data-dy', POSTIT_DEFAULT_DY),
        renderHTML: (attrs) => ({ 'data-dy': String(attrs.dy) }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-type="postit"]' }]
  },

  renderHTML({ node, HTMLAttributes }) {
    // El pin: color inline para que el clon del export PDF lo conserve
    // sin depender del CSS de la app
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'postit',
        class: 'postit-pin',
        title: 'Origen del post-it',
        style: `background:${postitColor(node.attrs.color as string).pin}`,
      }),
    ]
  },
})
