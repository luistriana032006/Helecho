import { Extension } from '@tiptap/core'

/**
 * Tamaño de texto por selección (estilo Word). TipTap v2 no trae extensión
 * oficial: este es el patrón estándar — un atributo `fontSize` más sobre la
 * marca `textStyle` (la misma de FontFamily; un solo span con ambos estilos).
 */

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: {
      /** p. ej. setFontSize('18px') */
      setFontSize: (size: string) => ReturnType
      unsetFontSize: () => ReturnType
    }
  }
}

export const FontSize = Extension.create({
  name: 'fontSize',

  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (el) => el.style.fontSize || null,
            renderHTML: (attrs) =>
              attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {},
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setFontSize:
        (size) =>
        ({ chain }) =>
          chain().setMark('textStyle', { fontSize: size }).run(),
      unsetFontSize:
        () =>
        ({ chain }) =>
          // null limpia el atributo; si la marca queda vacía, se elimina
          chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run(),
    }
  },
})
