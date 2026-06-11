"use client"

import { useEffect, useRef, useState } from "react"
import { Table2 } from "lucide-react"

interface TableGridPickerProps {
  onPick: (rows: number, cols: number) => void
}

export function TableGridPicker({ onPick }: TableGridPickerProps) {
  const [open, setOpen] = useState(false)
  const [hover, setHover] = useState({ r: 0, c: 0 })
  const ref = useRef<HTMLDivElement>(null)
  const size = 8

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-7 items-center gap-1.5 rounded px-2 text-sm hover:bg-muted"
      >
        <Table2 className="size-4" aria-hidden /> Tabla
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 rounded-md border border-border bg-popover p-2 shadow-lg">
          <div
            className="grid gap-0.5"
            style={{ gridTemplateColumns: `repeat(${size}, 1rem)` }}
            onMouseLeave={() => setHover({ r: 0, c: 0 })}
          >
            {Array.from({ length: size * size }).map((_, i) => {
              const r = Math.floor(i / size) + 1
              const c = (i % size) + 1
              const active = r <= hover.r && c <= hover.c
              return (
                <button
                  key={i}
                  type="button"
                  onMouseEnter={() => setHover({ r, c })}
                  onClick={() => {
                    onPick(r, c)
                    setOpen(false)
                  }}
                  className={`size-4 rounded-[2px] border ${
                    active ? "border-primary bg-primary/40" : "border-border bg-background"
                  }`}
                />
              )
            })}
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            {hover.r || 0} filas × {hover.c || 0} columnas
          </p>
        </div>
      )}
    </div>
  )
}
