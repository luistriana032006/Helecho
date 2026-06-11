"use client"

import { useEffect, useRef, useState } from "react"

interface FileMenuProps {
  onHome: () => void
  onNew: () => void
  onOpen: () => void
  onSave: () => void
  onExportPdf: () => void
  onSettings: () => void
}

const ITEM = "flex w-full items-center justify-between gap-6 rounded px-2.5 py-1.5 text-left text-sm hover:bg-muted"

export function FileMenu(props: FileMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  function run(fn: () => void) {
    setOpen(false)
    fn()
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="h-7 rounded px-2 text-sm text-foreground hover:bg-muted"
      >
        Archivo
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-56 rounded-md border border-border bg-popover p-1 shadow-lg">
          <button type="button" className={ITEM} onClick={() => run(props.onHome)}>
            Volver al inicio
          </button>
          <button type="button" className={ITEM} onClick={() => run(props.onNew)}>
            Nuevo cuadernillo <span className="text-xs text-muted-foreground">Ctrl+N</span>
          </button>
          <button type="button" className={ITEM} onClick={() => run(props.onOpen)}>
            Abrir… <span className="text-xs text-muted-foreground">Ctrl+O</span>
          </button>
          <button type="button" className={ITEM} onClick={() => run(props.onSave)}>
            Guardar <span className="text-xs text-muted-foreground">Ctrl+S</span>
          </button>
          <button type="button" className={ITEM} onClick={() => run(props.onExportPdf)}>
            Exportar PDF… <span className="text-xs text-muted-foreground">Ctrl+P</span>
          </button>
          <div className="my-1 h-px bg-border" />
          <button type="button" className={ITEM} onClick={() => run(props.onSettings)}>
            Configuración
          </button>
        </div>
      )}
    </div>
  )
}
