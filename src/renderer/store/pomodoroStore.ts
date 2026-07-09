import { create } from 'zustand'
import { pomodoroPhaseEnded, primePomodoroAudio } from '../lib/pomodoroAlert'

export type PomodoroPhase = 'trabajo' | 'descanso'

/** Duración de cada fase en segundos (Pomodoro clásico 25/5). */
export const POMODORO_DURATIONS: Record<PomodoroPhase, number> = {
  trabajo: 25 * 60,
  descanso: 5 * 60,
}

interface PomodoroState {
  phase: PomodoroPhase
  running: boolean
  secondsLeft: number
  start: () => void
  pause: () => void
  /** Reinicia la fase actual a su duración completa. */
  reset: () => void
  /** Salta manualmente a la otra fase (la deja detenida). */
  skip: () => void
}

// El intervalo y el timestamp de fin viven a nivel de módulo (no en un
// componente): así el conteo sigue aunque el widget se desmonte al cambiar
// de cuadernillo o de vista. Un único setInterval en toda la app.
let intervalId: ReturnType<typeof setInterval> | null = null
let endAt = 0

function clearTick() {
  if (intervalId !== null) {
    clearInterval(intervalId)
    intervalId = null
  }
}

export const usePomodoroStore = create<PomodoroState>((set, get) => {
  // Se recalcula por diferencia de timestamp (no "resto 1 por tick"): así no
  // hay deriva si el navegador ralentiza los timers en segundo plano.
  const tick = () => {
    const remaining = Math.max(0, Math.round((endAt - Date.now()) / 1000))
    if (remaining <= 0) {
      clearTick()
      // Aviso al terminar la fase: chime (Web Audio) + notificación del sistema.
      pomodoroPhaseEnded(get().phase)
      set((s) => {
        const next: PomodoroPhase = s.phase === 'trabajo' ? 'descanso' : 'trabajo'
        return { phase: next, running: false, secondsLeft: POMODORO_DURATIONS[next] }
      })
      return
    }
    set({ secondsLeft: remaining })
  }

  return {
    phase: 'trabajo',
    running: false,
    secondsLeft: POMODORO_DURATIONS.trabajo,

    start: () => {
      if (get().running) return
      primePomodoroAudio() // habilita el audio dentro del gesto del usuario
      endAt = Date.now() + get().secondsLeft * 1000
      clearTick()
      intervalId = setInterval(tick, 250)
      set({ running: true })
    },

    pause: () => {
      const remaining = Math.max(0, Math.round((endAt - Date.now()) / 1000))
      clearTick()
      set({ running: false, secondsLeft: remaining })
    },

    reset: () => {
      clearTick()
      set((s) => ({ running: false, secondsLeft: POMODORO_DURATIONS[s.phase] }))
    },

    skip: () => {
      clearTick()
      set((s) => {
        const next: PomodoroPhase = s.phase === 'trabajo' ? 'descanso' : 'trabajo'
        return { phase: next, running: false, secondsLeft: POMODORO_DURATIONS[next] }
      })
    },
  }
})
