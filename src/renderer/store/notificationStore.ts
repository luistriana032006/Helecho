import { create } from 'zustand'

export interface AppNotification {
  /** Estable por origen (p. ej. "update"): re-notificar reemplaza, no duplica. */
  id: string
  title: string
  body?: string
  /** Timestamp de llegada (Date.now()), para mostrar "hace X min". */
  time: number
  read: boolean
  /** Botón opcional dentro de la notificación (p. ej. "Reiniciar"). */
  action?: { label: string; run: () => void }
}

interface NotificationState {
  notifications: AppNotification[]
  open: boolean
  push: (n: Omit<AppNotification, 'time' | 'read'>) => void
  dismiss: (id: string) => void
  clearAll: () => void
  /** Abrir el panel marca todo como leído (apaga el badge). */
  setOpen: (open: boolean) => void
}

// Store a nivel de módulo (no estado de componente): cualquier parte de la
// app puede empujar notificaciones sin estar montada en React —
// useNotificationStore.getState().push(...)
export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  open: false,

  push: (n) =>
    set((s) => ({
      notifications: [
        { ...n, time: Date.now(), read: false },
        ...s.notifications.filter((x) => x.id !== n.id),
      ],
    })),

  dismiss: (id) =>
    set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),

  clearAll: () => set({ notifications: [], open: false }),

  setOpen: (open) =>
    set((s) => ({
      open,
      notifications: open ? s.notifications.map((n) => ({ ...n, read: true })) : s.notifications,
    })),
}))
