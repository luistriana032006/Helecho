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
  const [vaultRoot, setVaultRoot] = useState('')

  useEffect(() => {
    if (!open) return
    void window.helecho.getVaultRoot().then(setVaultRoot)
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
          Tus apuntes viven aquí, fuera del programa (como la bóveda de Obsidian).
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
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 -z-0 cursor-default"
        onClick={onClose}
      />
    </div>
  )
}
