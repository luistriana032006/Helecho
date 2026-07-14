import { Play, Pause, RotateCcw, SkipForward, Timer } from 'lucide-react'
import { usePomodoroStore } from '../../store/pomodoroStore'
import { useT } from '../../lib/i18n'

function format(total: number): string {
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/**
 * Widget compacto del Pomodoro en la barra del editor. El conteo vive en
 * pomodoroStore (sigue corriendo aunque se cambie de cuadernillo); aquí solo
 * se leen primitivos (nunca referencias nuevas: evita el bucle infinito de
 * selectores zustand).
 */
export default function PomodoroWidget() {
  const t = useT()
  const phase = usePomodoroStore((s) => s.phase)
  const running = usePomodoroStore((s) => s.running)
  const secondsLeft = usePomodoroStore((s) => s.secondsLeft)
  const start = usePomodoroStore((s) => s.start)
  const pause = usePomodoroStore((s) => s.pause)
  const reset = usePomodoroStore((s) => s.reset)
  const skip = usePomodoroStore((s) => s.skip)

  const esTrabajo = phase === 'trabajo'
  const iconBtn =
    'flex size-5 items-center justify-center rounded hover:bg-black/10 transition-colors'

  return (
    <div
      className={`ml-auto flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs ${
        esTrabajo
          ? 'border-rose-200 bg-rose-50 text-rose-700'
          : 'border-emerald-200 bg-emerald-50 text-emerald-700'
      }`}
      title={`Pomodoro — ${esTrabajo ? 'Trabajo (25 min)' : 'Descanso (5 min)'}`}
    >
      <Timer className="size-3.5 shrink-0" aria-hidden />
      <span className="font-medium">{esTrabajo ? 'Trabajo' : 'Descanso'}</span>
      <span className="tabular-nums font-semibold">{format(secondsLeft)}</span>

      <button
        type="button"
        onClick={() => (running ? pause() : start())}
        className={iconBtn}
        aria-label={running ? t('Pausar') : t('Iniciar')}
      >
        {running ? <Pause className="size-3.5" aria-hidden /> : <Play className="size-3.5" aria-hidden />}
      </button>
      <button type="button" onClick={reset} className={iconBtn} aria-label="Reiniciar fase">
        <RotateCcw className="size-3.5" aria-hidden />
      </button>
      <button type="button" onClick={skip} className={iconBtn} aria-label="Saltar a la otra fase">
        <SkipForward className="size-3.5" aria-hidden />
      </button>
    </div>
  )
}
