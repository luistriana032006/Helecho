import Image from '@tiptap/extension-image'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import type { EditorView } from '@tiptap/pm/view'

function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function insertAt(view: EditorView, src: string, pos?: number) {
  const node = view.state.schema.nodes.image.create({ src, alt: '' })
  const tr = pos !== undefined
    ? view.state.tr.insert(pos, node)
    : view.state.tr.replaceSelectionWith(node)
  view.dispatch(tr)
  view.focus()
}

export const ImageExtension = Image.configure({
  inline: false,
  allowBase64: true,
}).extend({
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('helecho-image'),
        props: {
          handlePaste(view, event) {
            const items = Array.from(event.clipboardData?.items ?? [])
            const img = items.find((i) => i.type.startsWith('image/'))
            if (!img) return false
            event.preventDefault()
            const file = img.getAsFile()
            if (!file) return false
            fileToDataURL(file).then((src) => insertAt(view, src))
            return true
          },
          handleDrop(view, event, _slice, moved) {
            if (moved) return false
            const files = Array.from(event.dataTransfer?.files ?? [])
            const img = files.find((f) => f.type.startsWith('image/'))
            if (!img) return false
            event.preventDefault()
            fileToDataURL(img).then((src) => {
              const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos
              insertAt(view, src, pos)
            })
            return true
          },
        },
      }),
    ]
  },
})
