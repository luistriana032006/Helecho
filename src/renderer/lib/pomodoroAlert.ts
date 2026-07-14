/**
 * Aviso al terminar una fase del Pomodoro: un chime corto (Web Audio, sin
 * archivo de sonido) + una notificación del sistema (best-effort).
 *
 * El AudioContext se "prepara" en el clic de iniciar (gesto del usuario) para
 * que el navegador permita reproducir; al terminar la fase ya está activo.
 */

import { useNotificationStore } from '../store/notificationStore'
import { t } from './i18n'

let audioCtx: AudioContext | null = null

function getCtx(): AudioContext | null {
  try {
    if (!audioCtx) audioCtx = new AudioContext()
    return audioCtx
  } catch {
    return null // entorno sin Web Audio
  }
}

/** Llamar desde un gesto del usuario (clic en iniciar) para habilitar el audio. */
export function primePomodoroAudio(): void {
  const ctx = getCtx()
  if (ctx && ctx.state === 'suspended') void ctx.resume()
}

function playChime(): void {
  const ctx = getCtx()
  if (!ctx) return
  if (ctx.state === 'suspended') void ctx.resume()
  const now = ctx.currentTime
  // Dos tonos ascendentes (A5 → C#6), suaves
  ;[880, 1108.73].forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    const t = now + i * 0.18
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35)
    osc.connect(gain).connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.36)
  })
}

function notify(message: string): void {
  try {
    if (typeof Notification === 'undefined') return
    if (Notification.permission === 'granted') {
      new Notification('Helecho — Pomodoro', { body: message })
    } else if (Notification.permission !== 'denied') {
      void Notification.requestPermission().then((perm) => {
        if (perm === 'granted') new Notification('Helecho — Pomodoro', { body: message })
      })
    }
  } catch {
    /* notificaciones no disponibles: el chime ya avisó */
  }
}

/** Suena + notifica al terminar una fase. `endedPhase` es la que acaba de cerrar. */
export function pomodoroPhaseEnded(endedPhase: 'trabajo' | 'descanso'): void {
  const message =
    endedPhase === 'trabajo'
      ? t('¡Tiempo! Toca un descanso de 5 min.')
      : t('Fin del descanso. De vuelta al trabajo (25 min).')
  playChime()
  notify(message)
  // También al centro de notificaciones de la app, por si la notificación
  // del sistema no se vio (permiso denegado, no molestar, etc.)
  useNotificationStore.getState().push({ id: 'pomodoro', title: 'Pomodoro', body: message })
}
