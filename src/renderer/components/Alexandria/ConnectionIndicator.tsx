import { useEffect, useState } from 'react'
import { Wifi, WifiOff } from 'lucide-react'

/** Resultado de la última carga de la pestaña activa (null = nada cargado aún) */
export type ConnState = 'ok' | 'failed' | 'slow' | null

/** Sin did-stop-loading pasado este umbral, la carga se considera lenta */
export const SLOW_LOAD_MS = 5000

function useOnline(): boolean {
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])
  return online
}

/**
 * Indicador de conexión de 4 estados:
 * gris = sin red · rojo = la página falló · amarillo = carga lenta · verde = OK.
 * Sin red manda sobre el estado de la pestaña (nada va a cargar de todas formas).
 */
export default function ConnectionIndicator({ conn }: { conn: ConnState }) {
  const online = useOnline()

  if (!online) {
    return (
      <span title="Sin conexión a internet" className="flex size-7 shrink-0 items-center justify-center">
        <WifiOff className="size-4 text-muted-foreground" aria-label="Sin conexión a internet" />
      </span>
    )
  }

  const { className, label } =
    conn === 'failed'
      ? { className: 'text-red-500', label: 'La página no se pudo cargar' }
      : conn === 'slow'
        ? { className: 'text-amber-500', label: 'La página está tardando en cargar' }
        : conn === 'ok'
          ? { className: 'text-emerald-600', label: 'Conexión correcta' }
          : { className: 'text-muted-foreground/40', label: 'Sin actividad' }

  return (
    <span title={label} className="flex size-7 shrink-0 items-center justify-center">
      <Wifi className={`size-4 ${className}`} aria-label={label} />
    </span>
  )
}
