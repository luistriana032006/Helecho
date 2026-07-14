import { useEffect } from 'react'
import { Bell, Trash2, X } from 'lucide-react'
import { useNotificationStore } from '../../store/notificationStore'
import { useT } from '../../lib/i18n'

function timeAgo(time: number): string {
  const min = Math.round((Date.now() - time) / 60000)
  if (min < 1) return 'ahora'
  if (min < 60) return `hace ${min} min`
  const h = Math.round(min / 60)
  return h === 1 ? 'hace 1 h' : `hace ${h} h`
}

// Centro de notificaciones de la app (sustituye al UpdateBanner). Una
// campanita flotante que solo existe mientras haya notificaciones; el badge
// cuenta las no leídas y el panel las lista con su acción (p. ej. "Reiniciar"
// para aplicar una actualización descargada). Va montado en main.tsx, fuera
// de App, para estar presente en todas las vistas.
export default function NotificationCenter() {
  const t = useT()
  const { notifications, open, push, dismiss, clearAll, setOpen } = useNotificationStore()

  // Fuente: auto-update. El main avisa cuando ya descargó una versión nueva;
  // cerrar la notificación no pierde nada (autoInstallOnAppQuit la aplica
  // igual al salir de la app).
  useEffect(() => {
    window.helecho.onUpdateDownloaded((info) => {
      push({
        id: 'update',
        title: 'Actualización lista',
        body: `Helecho ${info.version} se instalará al reiniciar`,
        action: { label: 'Reiniciar', run: () => window.helecho.installUpdate() },
      })
    })
  }, [push])

  if (notifications.length === 0) return null

  const unread = notifications.filter((n) => !n.read).length

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col items-end gap-2">
      {open && (
        <div className="w-80 overflow-hidden rounded-xl border border-border bg-background shadow-2xl">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <p className="text-sm font-medium text-foreground">{t('Notificaciones')}</p>
            <button
              type="button"
              onClick={clearAll}
              title={t('Limpiar')}
              aria-label={t('Limpiar')}
              className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {notifications.map((n) => (
              <li key={n.id} className="group flex items-start gap-2 border-b border-border px-3 py-2.5 last:border-b-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{n.title}</p>
                  {n.body && <p className="text-xs text-muted-foreground">{n.body}</p>}
                  <p className="mt-0.5 text-[11px] text-muted-foreground/70">{timeAgo(n.time)}</p>
                </div>
                {n.action && (
                  <button
                    type="button"
                    onClick={n.action.run}
                    className="shrink-0 rounded-lg bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground transition hover:opacity-90"
                  >
                    {n.action.label}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => dismiss(n.id)}
                  title={t('Descartar')}
                  aria-label={t('Descartar')}
                  className="shrink-0 rounded-md p-1 text-muted-foreground opacity-0 transition hover:bg-muted hover:text-foreground group-hover:opacity-100"
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        title="Notificaciones"
        aria-label={t('Notificaciones')}
        className="relative flex size-11 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-2xl transition hover:text-foreground"
      >
        <Bell className="size-5" aria-hidden />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-5 animate-pulse items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
            {unread}
          </span>
        )}
      </button>
    </div>
  )
}
