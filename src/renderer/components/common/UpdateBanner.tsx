import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

// Banner de auto-update. Aparece SOLO cuando el proceso principal ya descargó
// una versión nueva (evento update:downloaded). El usuario decide cuándo
// reiniciar; puede cerrar el aviso y la actualización se aplicará igual la
// próxima vez que salga de la app (autoInstallOnAppQuit).
export default function UpdateBanner() {
  const [version, setVersion] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    window.helecho.onUpdateDownloaded((info) => {
      setVersion(info.version)
      setDismissed(false)
    })
  }, [])

  if (!version || dismissed) return null

  return (
    <div className="pointer-events-auto fixed bottom-4 right-4 z-[100] flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 shadow-2xl">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Download size={18} />
      </div>
      <div className="mr-1">
        <p className="text-sm font-medium text-foreground">Actualización lista</p>
        <p className="text-xs text-muted-foreground">Helecho {version} se instalará al reiniciar</p>
      </div>
      <button
        onClick={() => window.helecho.installUpdate()}
        className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
      >
        Reiniciar
      </button>
      <button
        onClick={() => setDismissed(true)}
        className="rounded-lg p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
        title="Más tarde"
      >
        <X size={16} />
      </button>
    </div>
  )
}
