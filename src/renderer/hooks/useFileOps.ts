import type { Editor } from '@tiptap/react'
import { useNotebookStore } from '../store/notebookStore'
import { useSettingsStore } from '../store/settingsStore'
import { serialize, parse } from '../../shared/mdSerializer'
import { postitColor } from '../components/Editor/extensions/PostIt'
import { flashcardColor } from '../components/Editor/extensions/Flashcard'
import { t } from '../lib/i18n'

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
    // Plotly: se quita el gráfico vivo (canvas/WebGL no sobrevive al clonado por
    // innerHTML) y su barra; queda el <img> PNG (data-URI) que sí sobrevive.
    clone.querySelectorAll('.drag-handle, .page-break-spacer, .plane-toolbar, .plane-instruments, .mermaid-toolbar, .grafo-toolbar, .math-template-editor, .plotly-live, .plotly-toolbar, .columns-toolbar, .column-del').forEach((n) => n.remove())

    // Tarjetas de repaso: igual que los post-its, la tarjeta se reconstruye
    // junto a su pin con el mismo desplazamiento (dx, dy) y muestra AMBAS
    // caras (frente + dorso). Estilos inline porque el print no carga Tailwind.
    clone.querySelectorAll('[data-type="flashcard"]').forEach((pin) => {
      const front = pin.getAttribute('data-front') ?? ''
      const back = pin.getAttribute('data-back') ?? ''
      const dx = Number(pin.getAttribute('data-dx')) || 0
      const dy = Number(pin.getAttribute('data-dy')) || 0
      const col = flashcardColor(pin.getAttribute('data-color') ?? 'indigo')
      pin.setAttribute(
        'style',
        `${pin.getAttribute('style') ?? ''};position:relative;display:inline-block;` +
          `width:16px;height:11px;border-radius:2px;background:${col.pin};`
      )
      const card = document.createElement('span')
      card.setAttribute(
        'style',
        `position:absolute;left:${dx}px;top:${dy}px;width:208px;display:block;` +
          'border:1px solid #999;border-radius:6px;overflow:hidden;background:#fff;' +
          'box-shadow:0 1px 3px rgba(0,0,0,0.25);z-index:40;'
      )
      const cara = (etiqueta: string, texto: string, fondo: string) => {
        const wrap = document.createElement('span')
        wrap.setAttribute('style', `display:block;padding:5px 8px;background:${fondo};`)
        const lbl = document.createElement('span')
        lbl.textContent = etiqueta
        lbl.setAttribute('style', 'display:block;font-size:8px;text-transform:uppercase;letter-spacing:.04em;color:#777;')
        const txt = document.createElement('span')
        txt.textContent = texto
        txt.setAttribute('style', 'display:block;font-size:11px;color:#27272a;white-space:pre-wrap;word-break:break-word;')
        wrap.appendChild(lbl)
        wrap.appendChild(txt)
        return wrap
      }
      card.appendChild(cara(t('Frente'), front, col.soft))
      card.appendChild(cara(t('Dorso'), back, '#ffffff'))
      pin.appendChild(card)
    })

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
