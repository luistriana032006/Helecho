import { useEffect, useRef, useState } from 'react'
import { useT } from '../../lib/i18n'

interface Props {
  onHome: () => void
  onNew: () => void
  onOpen: () => void
  onSave: () => void
  onExportPdf: () => void
  onSettings: () => void
}

const ITEM = 'flex w-full items-center justify-between gap-6 rounded px-2.5 py-1.5 text-left text-sm hover:bg-muted'

export default function FileMenu({ onHome, onNew, onOpen, onSave, onExportPdf, onSettings }: Props) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    window.addEventListener('mousedown', close)
    return () => window.removeEventListener('mousedown', close)
  }, [open])

  const run = (fn: () => void) => () => {
    setOpen(false)
    fn()
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onMouseDown={(e) => { e.preventDefault(); setOpen((v) => !v) }}
        className="h-7 rounded px-2 text-sm text-foreground hover:bg-muted"
      >
        {t('Archivo')}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-56 rounded-md border border-border bg-popover p-1 shadow-lg">
          <button type="button" className={ITEM} onClick={run(onHome)}>
            {t('Volver al inicio')}
          </button>
          <div className="my-1 h-px bg-border" />
          <button type="button" className={ITEM} onClick={run(onNew)}>
            {t('Nuevo cuadernillo')} <span className="text-xs text-muted-foreground">Ctrl/Cmd+N</span>
          </button>
          <button type="button" className={ITEM} onClick={run(onOpen)}>
            {t('Abrir…')} <span className="text-xs text-muted-foreground">Ctrl/Cmd+O</span>
          </button>
          <button type="button" className={ITEM} onClick={run(onSave)}>
            {t('Guardar')} <span className="text-xs text-muted-foreground">Ctrl/Cmd+S</span>
          </button>
          <button type="button" className={ITEM} onClick={run(onExportPdf)}>
            {t('Exportar PDF…')} <span className="text-xs text-muted-foreground">Ctrl/Cmd+P</span>
          </button>
          <div className="my-1 h-px bg-border" />
          <button type="button" className={ITEM} onClick={run(onSettings)}>
            {t('Configuración')}
          </button>
        </div>
      )}
    </div>
  )
}
