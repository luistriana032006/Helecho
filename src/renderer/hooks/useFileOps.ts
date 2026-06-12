import type { Editor } from '@tiptap/react'
import { useNotebookStore } from '../store/notebookStore'
import { useSettingsStore } from '../store/settingsStore'
import { serialize, parse } from '../../shared/mdSerializer'
import { postitColor } from '../components/Editor/extensions/PostIt'

export function useFileOps(editor: Editor | null) {
  const { filePath, setFilePath, setDirty } = useNotebookStore()

  const save = async () => {
    if (!editor) return
    const content = serialize(editor.getJSON())
    const result = await window.helecho.saveFile(content, filePath ?? undefined)
    if (result.success && result.filePath) {
      setFilePath(result.filePath)
    }
  }

  /**
   * Si hay cambios sin guardar, pregunta estilo Word:
   * Guardar / No guardar / Cancelar.
   * Devuelve true si se puede continuar (guardó o descartó),
   * false si el usuario canceló o el guardado no se completó.
   */
  const ensureSaved = async (): Promise<boolean> => {
    const { isDirty, fileName } = useNotebookStore.getState()
    if (!isDirty) return true
    const choice = await window.helecho.confirmUnsaved(fileName())
    if (choice === 2) return false
    if (choice === 0) {
      await save()
      // Si el diálogo de guardar se canceló, sigue sucio: no continuar
      return !useNotebookStore.getState().isDirty
    }
    return true
  }

  const open = async () => {
    if (!editor) return
    if (!(await ensureSaved())) return
    const result = await window.helecho.openFile()
    if (!result) return
    try {
      const fromJson = tryParseJson(result.content)
      editor.commands.setContent(fromJson ?? parse(result.content))
      setFilePath(result.filePath)
      setDirty(false)
    } catch {
      console.error('Error al leer el archivo')
    }
  }

  const openPath = async (path: string) => {
    if (!editor) return
    if (!(await ensureSaved())) return
    const result = await window.helecho.readFile(path)
    if (!result) return
    try {
      const fromJson = tryParseJson(result.content)
      editor.commands.setContent(
        result.content.trim() === '' ? '<p></p>' : fromJson ?? parse(result.content)
      )
      setFilePath(result.filePath)
      setDirty(false)
    } catch {
      console.error('Error al leer el cuadernillo')
    }
  }

  const newFile = async () => {
    if (!editor) return
    if (!(await ensureSaved())) return
    editor.commands.setContent('<p></p>')
    setFilePath(null)
    setDirty(false)
  }

  /**
   * Aplica un cambio externo del archivo abierto (file watcher).
   * No pisa trabajo sin guardar y descarta el eco del propio guardado.
   */
  const applyExternalChange = (path: string, content: string) => {
    if (!editor) return
    const state = useNotebookStore.getState()
    if (state.filePath !== path) return
    if (state.isDirty) return
    const current = serialize(editor.getJSON())
    if (current === content) return
    const fromJson = tryParseJson(content)
    editor.commands.setContent(
      content.trim() === '' ? '<p></p>' : fromJson ?? parse(content)
    )
    setDirty(false)
  }

  const exportPdf = async () => {
    const el = document.querySelector('.ProseMirror')
    if (!el) return
    // Quita los elementos de UI (grips de arrastre, espaciadores de
    // paginación) que viven dentro del editor pero no son contenido
    const clone = el.cloneNode(true) as HTMLElement
    clone.querySelectorAll('.drag-handle, .page-break-spacer, .plane-toolbar, .plane-instruments, .mermaid-toolbar').forEach((n) => n.remove())

    // Post-its: opcionales en el PDF (Configuración). Si van, la nota se
    // reconstruye junto a su pin con el mismo desplazamiento que en pantalla
    // (estilos inline: el HTML del print no carga el CSS de la app)
    const includePostits = useSettingsStore.getState().postitsInPdf
    clone.querySelectorAll('[data-type="postit"]').forEach((pin) => {
      if (!includePostits) {
        pin.remove()
        return
      }
      const text = pin.getAttribute('data-text') ?? ''
      const palette = postitColor(pin.getAttribute('data-color') ?? 'amarillo')
      const dx = Number(pin.getAttribute('data-dx')) || 0
      const dy = Number(pin.getAttribute('data-dy')) || 0
      pin.setAttribute(
        'style',
        `${pin.getAttribute('style') ?? ''};position:relative;display:inline-block;width:10px;height:10px;border-radius:3px;`
      )
      const note = document.createElement('span')
      note.textContent = text
      note.setAttribute(
        'style',
        `position:absolute;left:${dx}px;top:${dy}px;width:176px;display:block;` +
          `background:${palette.bg};border-radius:3px;padding:6px 8px;` +
          'font-size:11px;line-height:1.35;color:#27272a;white-space:pre-wrap;' +
          'word-break:break-word;box-shadow:0 1px 3px rgba(0,0,0,0.25);z-index:40;'
      )
      pin.appendChild(note)
    })

    await window.helecho.exportPdf(clone.innerHTML)
  }

  const exportMd = async () => {
    if (!editor) return
    const content = serialize(editor.getJSON())
    await window.helecho.exportMd(content)
  }

  return { save, open, openPath, newFile, exportPdf, exportMd, ensureSaved, applyExternalChange }
}

function tryParseJson(content: string): object | null {
  try {
    const parsed: unknown = JSON.parse(content)
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'type' in parsed &&
      (parsed as Record<string, unknown>)['type'] === 'doc'
    ) {
      return parsed as object
    }
    return null
  } catch {
    return null
  }
}
