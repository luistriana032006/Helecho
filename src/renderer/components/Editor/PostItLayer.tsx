import { useCallback, useEffect, useRef, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { Trash2 } from 'lucide-react'
import { POSTIT_COLORS, postitColor } from './extensions/PostIt'
import { useSettingsStore } from '../../store/settingsStore'

const NOTE_WIDTH = 176

interface NoteInfo {
  id: string
  color: string
  text: string
  dx: number
  dy: number
  /** Centro del pin, en coordenadas locales de la capa (sin zoom) */
  pinX: number
  pinY: number
}

interface Props {
  editor: Editor | null
}

/**
 * Capa de post-its flotantes sobre la hoja. Vive DENTRO del contenedor del
 * editor (mismo espacio de coordenadas, hereda el zoom y el scroll): por
 * cada nodo postit del documento dibuja su nota en pin + (dx, dy) y la
 * línea guía SVG hasta el pin. Editar/arrastrar/borrar actualiza los
 * atributos del nodo — el post-it viaja en el .md como cualquier contenido.
 */
export default function PostItLayer({ editor }: Props) {
  const zoom = useSettingsStore((s) => s.zoom)
  const [notes, setNotes] = useState<NoteInfo[]>([])
  // Durante el arrastre el desplazamiento es visual; se confirma al soltar
  const [drag, setDrag] = useState<{ id: string; dx: number; dy: number } | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const layerRef = useRef<HTMLDivElement>(null)
  const zoomRef = useRef(zoom)
  zoomRef.current = zoom
  // Ids ya vistos: un postit NUEVO y vacío abre directo en edición
  // (null = primer escaneo, p. ej. al abrir un cuadernillo — esos no)
  const knownIds = useRef<Set<string> | null>(null)

  const recompute = useCallback(() => {
    const layer = layerRef.current
    if (!editor || editor.isDestroyed || !layer) return
    const layerRect = layer.getBoundingClientRect()
    const found: NoteInfo[] = []
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name !== 'postit') return
      const dom = editor.view.nodeDOM(pos)
      if (!(dom instanceof HTMLElement)) return
      const r = dom.getBoundingClientRect()
      // Las medidas de pantalla vienen escaladas por el zoom; las
      // coordenadas locales de la capa no
      const z = zoomRef.current
      found.push({
        id: node.attrs.id as string,
        color: node.attrs.color as string,
        text: node.attrs.text as string,
        dx: node.attrs.dx as number,
        dy: node.attrs.dy as number,
        pinX: (r.left + r.width / 2 - layerRect.left) / z,
        pinY: (r.top + r.height / 2 - layerRect.top) / z,
      })
    })
    if (knownIds.current !== null) {
      const fresh = found.find((n) => !knownIds.current?.has(n.id) && !n.text)
      if (fresh) setEditingId(fresh.id)
    }
    knownIds.current = new Set(found.map((n) => n.id))
    setNotes(found)
  }, [editor])

  // Recalcular con cada cambio del documento y con los re-layouts que no
  // pasan por ProseMirror (paginación re-mide con rAF, fuentes KaTeX):
  // el ResizeObserver del contenedor los captura por el cambio de alto
  useEffect(() => {
    if (!editor) return
    recompute()
    editor.on('update', recompute)
    return () => {
      editor.off('update', recompute)
    }
  }, [editor, recompute])

  useEffect(() => {
    const parent = layerRef.current?.parentElement
    if (!parent) return
    const observer = new ResizeObserver(recompute)
    observer.observe(parent)
    return () => observer.disconnect()
  }, [recompute])

  /** Localiza el nodo por id AHORA (las posiciones cambian con cada edición) */
  const withNode = useCallback(
    (id: string, fn: (pos: number, attrs: Record<string, unknown>) => void) => {
      if (!editor || editor.isDestroyed) return
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'postit' && node.attrs.id === id) {
          fn(pos, node.attrs)
          return false
        }
        return undefined
      })
    },
    [editor]
  )

  const updateAttrs = useCallback(
    (id: string, patch: Record<string, unknown>) => {
      withNode(id, (pos, attrs) => {
        if (!editor) return
        editor.view.dispatch(
          editor.state.tr.setNodeMarkup(pos, undefined, { ...attrs, ...patch })
        )
      })
    },
    [editor, withNode]
  )

  const removeNote = useCallback(
    (id: string) => {
      withNode(id, (pos) => {
        if (!editor) return
        editor.view.dispatch(editor.state.tr.delete(pos, pos + 1))
      })
    },
    [editor, withNode]
  )

  const startDrag = (e: React.MouseEvent, note: NoteInfo) => {
    e.preventDefault()
    const startX = e.clientX
    const startY = e.clientY
    const move = (ev: MouseEvent) => {
      const z = zoomRef.current
      setDrag({
        id: note.id,
        dx: note.dx + (ev.clientX - startX) / z,
        dy: note.dy + (ev.clientY - startY) / z,
      })
    }
    const up = (ev: MouseEvent) => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
      const z = zoomRef.current
      updateAttrs(note.id, {
        dx: Math.round(note.dx + (ev.clientX - startX) / z),
        dy: Math.round(note.dy + (ev.clientY - startY) / z),
      })
      setDrag(null)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }

  if (!editor) return null

  return (
    <div ref={layerRef} className="pointer-events-none absolute inset-0 z-30">
      {/* Líneas guía nota → pin */}
      <svg className="absolute inset-0 h-full w-full overflow-visible">
        {notes.map((note) => {
          const d = drag?.id === note.id ? drag : note
          const noteX = note.pinX + d.dx
          const noteY = note.pinY + d.dy
          return (
            <line
              key={note.id}
              x1={note.pinX}
              y1={note.pinY}
              x2={noteX + 10}
              y2={noteY + 10}
              stroke={postitColor(note.color).pin}
              strokeWidth={1.5}
              strokeDasharray="4 3"
            />
          )
        })}
      </svg>

      {notes.map((note) => {
        const d = drag?.id === note.id ? drag : note
        const palette = postitColor(note.color)
        return (
          <div
            key={note.id}
            // El contenedor de la hoja enfoca el editor con CUALQUIER clic
            // (clic-para-escribir): los eventos del post-it se quedan aquí
            // o ProseMirror roba el foco del textarea y no se puede editar
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="pointer-events-auto absolute rounded-sm shadow-md"
            style={{
              left: note.pinX + d.dx,
              top: note.pinY + d.dy,
              width: NOTE_WIDTH,
              backgroundColor: palette.bg,
            }}
          >
            {/* Cabecera: arrastrar, cambiar color, borrar */}
            <div
              onMouseDown={(e) => startDrag(e, note)}
              className="flex cursor-grab items-center gap-1 rounded-t-sm px-1.5 py-1 active:cursor-grabbing"
              style={{ backgroundColor: 'rgba(0,0,0,0.06)' }}
              title="Arrastra para mover el post-it"
            >
              {POSTIT_COLORS.map((c) => (
                <button
                  key={c.id}
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    updateAttrs(note.id, { color: c.id })
                  }}
                  title={c.label}
                  aria-label={`Categoría ${c.label.toLowerCase()}`}
                  className={`size-3 rounded-full border ${
                    c.id === note.color ? 'border-black/50' : 'border-black/10'
                  }`}
                  style={{ backgroundColor: c.pin }}
                />
              ))}
              <button
                onMouseDown={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  removeNote(note.id)
                }}
                aria-label="Eliminar post-it"
                title="Eliminar post-it"
                className="ml-auto flex size-4 items-center justify-center rounded hover:bg-black/10"
              >
                <Trash2 className="size-3 text-zinc-700" aria-hidden />
              </button>
            </div>

            {/* Texto: editable en sitio; se confirma al salir del campo */}
            {editingId === note.id ? (
              <textarea
                autoFocus
                defaultValue={note.text}
                onBlur={(e) => {
                  updateAttrs(note.id, { text: e.target.value })
                  setEditingId(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') (e.target as HTMLTextAreaElement).blur()
                }}
                rows={3}
                placeholder="Escribe la nota…"
                className="block w-full resize-none bg-transparent px-2 py-1.5 text-xs text-zinc-800 outline-none placeholder:text-zinc-500"
              />
            ) : (
              <button
                onClick={() => setEditingId(note.id)}
                title="Clic para editar"
                className="block w-full whitespace-pre-wrap break-words px-2 py-1.5 text-left text-xs text-zinc-800"
              >
                {note.text || <span className="text-zinc-500">Escribe la nota…</span>}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
