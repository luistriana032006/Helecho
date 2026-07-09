import { Extension } from '@tiptap/core'
import { gapCursor } from '@tiptap/pm/gapcursor'

/**
 * Cursor de hueco (gap cursor): permite colocar el cursor ANTES o DESPUÉS de
 * bloques de los que normalmente no se puede salir (columnas, tablas, gráficas
 * aislantes). Sin esto, una sección de columnas al final del documento atrapa
 * el cursor y no se puede seguir escribiendo afuera.
 *
 * Se usa el plugin de `@tiptap/pm` directo (ya instalado) en vez de sumar la
 * dependencia `@tiptap/extension-gapcursor`. El plugin permite el hueco en
 * todos los nodos salvo los que declaren `allowGapCursor: false`. El CSS
 * `.ProseMirror-gapcursor` vive en globals.css.
 */
export const Gapcursor = Extension.create({
  name: 'gapcursor',

  addProseMirrorPlugins() {
    return [gapCursor()]
  },
})
