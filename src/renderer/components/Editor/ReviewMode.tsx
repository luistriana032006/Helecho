import { useEffect, useMemo, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { X, ChevronLeft, ChevronRight, Shuffle, GraduationCap } from 'lucide-react'
import { flashcardColor } from './extensions/Flashcard'
import { useT } from '../../lib/i18n'

interface Card {
  front: string
  back: string
  color: string
}

/** Recolecta todas las tarjetas del documento abierto (en orden de aparición). */
function collectCards(editor: Editor): Card[] {
  const cards: Card[] = []
  editor.state.doc.descendants((node) => {
    if (node.type.name === 'flashcard') {
      cards.push({
        front: (node.attrs.front as string) ?? '',
        back: (node.attrs.back as string) ?? '',
        color: (node.attrs.color as string) ?? 'indigo',
      })
    }
  })
  return cards
}

/** Fisher–Yates: baraja una copia, no muta el original. */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Modo Repasar: overlay de estudio sobre el editor. Toma las tarjetas del
 * cuadernillo abierto, las baraja al azar y las muestra de una en una
 * (voltear con clic/espacio, ◀ ▶ o flechas, 🔀 para rebarajar, Esc cierra).
 */
export default function ReviewMode({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const t = useT()
  // Se recolectan y barajan una sola vez al abrir (editor es estable)
  const initial = useMemo(() => shuffle(collectCards(editor)), [editor])
  const [order, setOrder] = useState<Card[]>(initial)
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const total = order.length

  const go = (delta: number) => {
    if (total === 0) return
    setFlipped(false)
    setIndex((i) => (i + delta + total) % total)
  }

  const reshuffle = () => {
    setOrder((o) => shuffle(o))
    setIndex(0)
    setFlipped(false)
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
      else if (e.key === ' ') {
        e.preventDefault()
        setFlipped((f) => !f)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
    // total es estable durante la vida del overlay (rebarajar no cambia el número)
  }, [total, onClose])

  const current = order[index]
  const cara = current ? (flipped ? current.back : current.front) : ''
  const caraVacia = cara.trim() === ''

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="relative flex w-[30rem] max-w-[92vw] flex-col gap-3 rounded-xl bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <GraduationCap className="size-4 text-zinc-500" aria-hidden />
          <span className="text-sm font-semibold text-zinc-700">{t('Repasar')}</span>
          <button
            onClick={onClose}
            aria-label={t('Cerrar repaso')}
            className="ml-auto flex size-7 items-center justify-center rounded text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        {total === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-500">
            {t('Este cuadernillo no tiene tarjetas todavía.')}
            <br />
            {t('Insértalas con el botón')} <span className="font-medium">"{t('Tarjeta')}"</span> {t('de la barra.')}
          </p>
        ) : (
          <>
            {/* La tarjeta: clic o espacio para voltear */}
            <button
              type="button"
              onClick={() => setFlipped((f) => !f)}
              className={`flex min-h-48 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 px-5 py-8 text-center transition-colors ${
                flipped ? 'border-emerald-300 bg-emerald-50' : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100'
              }`}
            >
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                {current && (
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: flashcardColor(current.color).pin }}
                    aria-hidden
                  />
                )}
                {t(flipped ? 'Dorso' : 'Frente')}
              </span>
              <span className={`text-lg ${caraVacia ? 'italic text-zinc-300' : 'text-zinc-800'}`}>
                {caraVacia ? t('(vacío)') : cara}
              </span>
              <span className="mt-2 text-[11px] text-zinc-300">{t('clic o espacio para voltear')}</span>
            </button>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => go(-1)}
                aria-label={t('Anterior')}
                className="flex size-8 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 hover:bg-zinc-100"
              >
                <ChevronLeft className="size-4" aria-hidden />
              </button>
              <span className="min-w-16 text-center text-sm tabular-nums text-zinc-600">
                {index + 1} / {total}
              </span>
              <button
                onClick={() => go(1)}
                aria-label={t('Siguiente')}
                className="flex size-8 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 hover:bg-zinc-100"
              >
                <ChevronRight className="size-4" aria-hidden />
              </button>
              <button
                onClick={reshuffle}
                className="ml-2 flex items-center gap-1 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100"
              >
                <Shuffle className="size-3.5" aria-hidden /> {t('Barajar')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
