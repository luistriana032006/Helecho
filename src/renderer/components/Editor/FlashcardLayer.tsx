import { useCallback, useEffect, useRef, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { Trash2, RefreshCw, Pencil, Check } from 'lucide-react'
import { useSettingsStore } from '../../store/settingsStore'
import { flashcardColor, FLASHCARD_COLORS } from './extensions/Flashcard'

const CARD_WIDTH = 208

interface CardInfo {
  id: string
  front: string
  back: string
  color: string
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
 * Capa de tarjetas de repaso flotantes sobre la hoja. Igual que PostItLayer:
 * vive DENTRO del contenedor del editor (mismo espacio de coordenadas, hereda
 * zoom y scroll); por cada nodo `flashcard` dibuja su tarjeta en pin + (dx, dy)
 * y la línea guía hasta el pin. Voltear/editar/arrastrar/borrar actualiza los
 * atributos del nodo — la tarjeta viaja en el .md como cualquier contenido.
 */
export default function FlashcardLayer({ editor }: Props) {
  const zoom = useSettingsStore((s) => s.zoom)
  const [cards, setCards] = useState<CardInfo[]>([])
  const [drag, setDrag] = useState<{ id: string; dx: number; dy: number } | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [flipped, setFlipped] = useState<Set<string>>(new Set())
  const layerRef = useRef<HTMLDivElement>(null)
  const zoomRef = useRef(zoom)
  zoomRef.current = zoom
  // Una tarjeta NUEVA y vacía abre directo en edición (null = primer escaneo)
  const knownIds = useRef<Set<string> | null>(null)

  const recompute = useCallback(() => {
    const layer = layerRef.current
    if (!editor || editor.isDestroyed || !layer) return
    const layerRect = layer.getBoundingClientRect()
    const found: CardInfo[] = []
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name !== 'flashcard') return
      const dom = editor.view.nodeDOM(pos)
      if (!(dom instanceof HTMLElement)) return
      const r = dom.getBoundingClientRect()
      const z = zoomRef.current
      found.push({
        id: node.attrs.id as string,
        front: node.attrs.front as string,
        back: node.attrs.back as string,
        color: (node.attrs.color as string) ?? 'indigo',
        dx: node.attrs.dx as number,
        dy: node.attrs.dy as number,
        pinX: (r.left + r.width / 2 - layerRect.left) / z,
        pinY: (r.top + r.height / 2 - layerRect.top) / z,
      })
    })
    if (knownIds.current !== null) {
      const fresh = found.find(
        (c) => !knownIds.current?.has(c.id) && !c.front && !c.back
      )
      if (fresh) setEditingId(fresh.id)
    }
    knownIds.current = new Set(found.map((c) => c.id))
    setCards(found)
  }, [editor])

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
        if (node.type.name === 'flashcard' && node.attrs.id === id) {
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

  const removeCard = useCallback(
    (id: string) => {
      withNode(id, (pos) => {
        if (!editor) return
        editor.view.dispatch(editor.state.tr.delete(pos, pos + 1))
      })
    },
    [editor, withNode]
  )

  const toggleFlip = (id: string) => {
    setFlipped((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const startDrag = (e: React.MouseEvent, card: CardInfo) => {
    e.preventDefault()
    const startX = e.clientX
    const startY = e.clientY
    const move = (ev: MouseEvent) => {
      const z = zoomRef.current
      setDrag({
        id: card.id,
        dx: card.dx + (ev.clientX - startX) / z,
        dy: card.dy + (ev.clientY - startY) / z,
      })
    }
    const up = (ev: MouseEvent) => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
      const z = zoomRef.current
      updateAttrs(card.id, {
        dx: Math.round(card.dx + (ev.clientX - startX) / z),
        dy: Math.round(card.dy + (ev.clientY - startY) / z),
      })
      setDrag(null)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }

  if (!editor) return null

  return (
    <div ref={layerRef} className="pointer-events-none absolute inset-0 z-30">
      {/* Líneas guía tarjeta → pin */}
      <svg className="absolute inset-0 h-full w-full overflow-visible">
        {cards.map((card) => {
          const d = drag?.id === card.id ? drag : card
          return (
            <line
              key={card.id}
              x1={card.pinX}
              y1={card.pinY}
              x2={card.pinX + d.dx + 10}
              y2={card.pinY + d.dy + 10}
              stroke={flashcardColor(card.color).pin}
              strokeWidth={1.5}
              strokeDasharray="4 3"
            />
          )
        })}
      </svg>

      {cards.map((card) => {
        const d = drag?.id === card.id ? drag : card
        const isEditing = editingId === card.id
        const isFlipped = flipped.has(card.id)
        const cara = isFlipped ? card.back : card.front
        const caraVacia = cara.trim() === ''
        return (
          <div
            key={card.id}
            // Los eventos se quedan en la tarjeta: el contenedor de la hoja
            // enfoca el editor con cualquier clic y le robaría el foco a los
            // campos (mismo gotcha que los post-its)
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="pointer-events-auto absolute overflow-hidden rounded-md border border-zinc-200 bg-white shadow-md"
            style={{ left: card.pinX + d.dx, top: card.pinY + d.dy, width: CARD_WIDTH }}
          >
            {/* Cabecera: arrastrar, voltear, editar, borrar */}
            <div
              onMouseDown={(e) => startDrag(e, card)}
              className="flex cursor-grab items-center gap-1 px-1.5 py-1 active:cursor-grabbing"
              style={{ backgroundColor: flashcardColor(card.color).soft }}
              title="Arrastra para mover la tarjeta"
            >
              <span
                className="mr-auto text-[10px] font-semibold uppercase tracking-wide"
                style={{ color: flashcardColor(card.color).pin }}
              >
                Tarjeta
              </span>
              {!isEditing && (
                <button
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    toggleFlip(card.id)
                  }}
                  aria-label="Voltear"
                  title="Voltear (frente / dorso)"
                  className="flex size-4 items-center justify-center rounded hover:bg-black/10"
                >
                  <RefreshCw className="size-3 text-zinc-600" aria-hidden />
                </button>
              )}
              <button
                onMouseDown={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  setEditingId(isEditing ? null : card.id)
                }}
                aria-label={isEditing ? 'Listo' : 'Editar'}
                title={isEditing ? 'Listo' : 'Editar'}
                className="flex size-4 items-center justify-center rounded hover:bg-black/10"
              >
                {isEditing ? (
                  <Check className="size-3 text-emerald-600" aria-hidden />
                ) : (
                  <Pencil className="size-3 text-zinc-600" aria-hidden />
                )}
              </button>
              <button
                onMouseDown={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  removeCard(card.id)
                }}
                aria-label="Eliminar tarjeta"
                title="Eliminar tarjeta"
                className="flex size-4 items-center justify-center rounded hover:bg-black/10"
              >
                <Trash2 className="size-3 text-zinc-700" aria-hidden />
              </button>
            </div>

            {isEditing ? (
              <div className="flex flex-col gap-1 p-1.5">
                {/* Selector de categoría de color */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-zinc-500">Color</span>
                  <div className="flex gap-1">
                    {FLASHCARD_COLORS.map((c) => (
                      <button
                        key={c.id}
                        onMouseDown={(e) => {
                          e.stopPropagation()
                          e.preventDefault()
                          updateAttrs(card.id, { color: c.id })
                        }}
                        aria-label={c.label}
                        title={c.label}
                        className={`size-4 rounded-full border transition-transform hover:scale-110 ${
                          card.color === c.id ? 'border-zinc-700 ring-1 ring-zinc-400' : 'border-white/70'
                        }`}
                        style={{ backgroundColor: c.pin }}
                      />
                    ))}
                  </div>
                </div>
                <label className="text-[10px] text-zinc-500">
                  Frente
                  <textarea
                    defaultValue={card.front}
                    onBlur={(e) => updateAttrs(card.id, { front: e.target.value })}
                    rows={2}
                    placeholder="¿Qué es…?"
                    className="mt-0.5 block w-full resize-none rounded border border-zinc-200 bg-zinc-50 px-1.5 py-1 text-xs text-zinc-800 outline-none focus:border-indigo-400"
                  />
                </label>
                <label className="text-[10px] text-zinc-500">
                  Dorso
                  <textarea
                    defaultValue={card.back}
                    onBlur={(e) => updateAttrs(card.id, { back: e.target.value })}
                    rows={3}
                    placeholder="La definición o respuesta"
                    className="mt-0.5 block w-full resize-none rounded border border-zinc-200 bg-zinc-50 px-1.5 py-1 text-xs text-zinc-800 outline-none focus:border-indigo-400"
                  />
                </label>
              </div>
            ) : (
              <button
                onClick={() => toggleFlip(card.id)}
                title="Clic para voltear"
                className={`block w-full px-3 py-4 text-center transition-colors ${
                  isFlipped ? 'bg-emerald-50' : 'bg-zinc-50 hover:bg-zinc-100'
                }`}
              >
                <span className="block text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                  {isFlipped ? 'Dorso' : 'Frente'}
                </span>
                <span
                  className={`mt-1 block whitespace-pre-wrap break-words text-sm ${
                    caraVacia ? 'italic text-zinc-300' : 'text-zinc-800'
                  }`}
                >
                  {caraVacia ? (isFlipped ? '(sin definición)' : '(sin concepto)') : cara}
                </span>
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
