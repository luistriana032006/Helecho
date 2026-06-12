import { ArrowLeft, Globe } from 'lucide-react'
import AlexandriaBrowser from './AlexandriaBrowser'

interface Props {
  onBack: () => void
}

/**
 * Modo general: Alexandria a pantalla completa, abierto desde la biblioteca
 * (sin cuadernillo de por medio). Mismas pestañas e historial que el panel
 * del editor — todo vive en alexandriaStore.
 */
export default function AlexandriaView({ onBack }: Props) {
  return (
    <div className="flex h-screen w-screen flex-col bg-background text-foreground">
      <header className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2">
        <button
          onClick={onBack}
          title="Volver a la biblioteca"
          className="flex h-7 items-center gap-1.5 rounded px-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden /> Biblioteca
        </button>
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Globe className="size-3.5" aria-hidden /> Alexandria
        </span>
      </header>
      <AlexandriaBrowser active />
    </div>
  )
}
