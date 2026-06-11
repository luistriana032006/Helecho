import { useEffect, useRef, useState } from 'react'
import type { Editor } from '@tiptap/react'

const MAX_ROWS = 8
const MAX_COLS = 8

interface Props {
  editor: Editor
}

export default function TablePicker({ editor }: Props) {
  const [open, setOpen] = useState(false)
  const [hover, setHover] = useState({ rows: 0, cols: 0 })
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

  const insert = (rows: number, cols: number) => {
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run()
    setOpen(false)
    setHover({ rows: 0, cols: 0 })
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onMouseDown={(e) => { e.preventDefault(); setOpen((v) => !v) }}
        title="Insertar tabla"
        className={`flex h-7 items-center rounded px-2 text-sm transition-colors
          ${open ? 'bg-muted text-foreground' : 'hover:bg-muted text-foreground/70'}`}
      >
        ⊞ Tabla
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 rounded-lg border border-border bg-popover p-3 shadow-xl">
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${MAX_COLS}, 1fr)` }}
            onMouseLeave={() => setHover({ rows: 0, cols: 0 })}
          >
            {Array.from({ length: MAX_ROWS * MAX_COLS }).map((_, i) => {
              const row = Math.floor(i / MAX_COLS) + 1
              const col = (i % MAX_COLS) + 1
              const active = row <= hover.rows && col <= hover.cols
              return (
                <button
                  key={i}
                  onMouseEnter={() => setHover({ rows: row, cols: col })}
                  onMouseDown={(e) => { e.preventDefault(); insert(row, col) }}
                  className={`h-4 w-4 rounded-sm border transition-colors
                    ${active ? 'border-primary bg-primary/50' : 'border-border bg-card'}`}
                />
              )
            })}
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            {hover.rows > 0
              ? `${hover.rows} fila${hover.rows > 1 ? 's' : ''} × ${hover.cols} columna${hover.cols > 1 ? 's' : ''}`
              : 'Elige el tamaño'}
          </p>
        </div>
      )}
    </div>
  )
}
