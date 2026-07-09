import { useEffect, useState } from 'react'
import { FolderOpen } from 'lucide-react'
import { useSettingsStore } from '../../store/settingsStore'
import type { PageMode } from '../../store/settingsStore'

interface Props {
  open: boolean
  onClose: () => void
  /** La bóveda de cuadernillos cambió: la app debe recargar biblioteca/editor */
  onVaultChanged?: (root: string) => void
}

const MODES: { id: PageMode; label: string; description: string }[] = [
  {
    id: 'estricta',
    label: 'Página estricta',
    description: 'El texto respeta los márgenes y salta a la siguiente hoja, como en Word.',
  },
  {
    id: 'fluido',
    label: 'Fluido',
    description: 'Una sola hoja continua que crece con el contenido, sin saltos de página.',
  },
]

export default function SettingsDialog({ open, onClose, onVaultChanged }: Props) {
  const pageMode = useSettingsStore((s) => s.pageMode)
  const setPageMode = useSettingsStore((s) => s.setPageMode)
  const postitsInPdf = useSettingsStore((s) => s.postitsInPdf)
  const setPostitsInPdf = useSettingsStore((s) => s.setPostitsInPdf)
  const [vaultRoot, setVaultRoot] = useState('')
  const [adblock, setAdblock] = useState(false)
  const [adblockBusy, setAdblockBusy] = useState(false)
  const [adblockError, setAdblockError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    void window.helecho.getVaultRoot().then(setVaultRoot)
    void window.helecho.getAdblockEnabled().then(setAdblock)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const changeVault = async () => {
    const result = await window.helecho.selectVaultRoot()
    if (result.success && result.root) {
      setVaultRoot(result.root)
      onVaultChanged?.(result.root)
    }
  }

  const toggleAdblock = async () => {
    if (adblockBusy) return
    setAdblockBusy(true)
    setAdblockError(null)
    const result = await window.helecho.setAdblockEnabled(!adblock)
    if (result.success) setAdblock(!adblock)
    else setAdblockError(result.error ?? 'No se pudo cambiar el bloqueo de anuncios')
    setAdblockBusy(false)
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-border bg-popover p-5 shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold">Configuración</h2>
        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Modo de hoja
        </p>
        <div className="mt-2 flex flex-col gap-2">
          {MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setPageMode(mode.id)}
              className={`rounded-lg border p-3 text-left transition-colors ${
                pageMode === mode.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-ring'
              }`}
            >
              <p className="text-sm font-medium">{mode.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{mode.description}</p>
            </button>
          ))}
        </div>
        <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Carpeta de cuadernillos
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Tus apuntes viven aquí, fuera del programa, en tu propia carpeta.
          Cambiarla no mueve los archivos existentes.
        </p>
        <div className="mt-2 flex items-center gap-2">
          <code
            title={vaultRoot}
            className="min-w-0 flex-1 truncate rounded border border-border bg-muted/40 px-2 py-1.5 text-xs"
          >
            {vaultRoot || '…'}
          </code>
          <button
            type="button"
            onClick={changeVault}
            className="flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs hover:bg-muted"
          >
            <FolderOpen className="size-3.5" aria-hidden /> Cambiar…
          </button>
        </div>

        <div className="mt-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium">Post-its en el PDF</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Incluye los post-its del apunte al exportar a PDF, junto a su punto de origen.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={postitsInPdf}
            aria-label="Post-its en el PDF"
            onClick={() => setPostitsInPdf(!postitsInPdf)}
            className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors ${
              postitsInPdf ? 'bg-primary' : 'bg-muted-foreground/30'
            }`}
          >
            <span
              className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-all ${
                postitsInPdf ? 'left-[18px]' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Alexandria
        </p>
        <div className="mt-2 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium">Bloqueo de anuncios</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Bloquea anuncios y rastreadores en el navegador (listas EasyList).
              La primera activación descarga las listas — necesita internet.
              YouTube queda excluido por sus condiciones de uso.
            </p>
            {adblockBusy && (
              <p className="mt-1 text-xs text-muted-foreground">Aplicando…</p>
            )}
            {adblockError && (
              <p className="mt-1 text-xs text-red-600">{adblockError}</p>
            )}
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={adblock}
            aria-label="Bloqueo de anuncios"
            onClick={toggleAdblock}
            disabled={adblockBusy}
            className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
              adblock ? 'bg-primary' : 'bg-muted-foreground/30'
            }`}
          >
            <span
              className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-all ${
                adblock ? 'left-[18px]' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
