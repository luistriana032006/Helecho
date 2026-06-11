"use client"

import { useState } from "react"
import { BookOpen, X, ChevronsRight } from "lucide-react"

type RefMode = "empty" | "pdf" | "excel"

interface ReferencePanelProps {
  onCollapse: () => void
}

const EXCEL_SHEETS = {
  "Hoja 1": [
    ["x", "f(x)", "f'(x)"],
    ["-2", "4", "-4"],
    ["-1", "1", "-2"],
    ["0", "0", "0"],
    ["1", "1", "2"],
    ["2", "4", "4"],
  ],
  "Hoja 2": [
    ["t", "v", "a"],
    ["0", "0", "9.8"],
    ["1", "9.8", "9.8"],
    ["2", "19.6", "9.8"],
  ],
}

export function ReferencePanel({ onCollapse }: ReferencePanelProps) {
  const [mode, setMode] = useState<RefMode>("empty")
  const [docName, setDocName] = useState("")
  const [activeSheet, setActiveSheet] = useState<keyof typeof EXCEL_SHEETS>("Hoja 1")

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Referencia</span>
        {docName && <span className="flex-1 truncate text-xs text-foreground/80">{docName}</span>}
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setMode(Math.random() > 0.5 ? "pdf" : "excel")
              setDocName(mode === "excel" ? "apuntes.pdf" : "tabla-datos.xlsx")
            }}
            className="rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Abrir…
          </button>
          {mode !== "empty" && (
            <button
              type="button"
              onClick={() => {
                setMode("empty")
                setDocName("")
              }}
              aria-label="Cerrar documento"
              className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" aria-hidden />
            </button>
          )}
          <button
            type="button"
            onClick={onCollapse}
            aria-label="Plegar panel"
            className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ChevronsRight className="size-4" aria-hidden />
          </button>
        </div>
      </div>

      {mode === "empty" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <BookOpen className="size-8 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">
            Abre un PDF o un Excel para consultarlo junto a tus apuntes y copiar texto directamente al cuadernillo.
          </p>
          <button
            type="button"
            onClick={() => {
              setMode("excel")
              setDocName("tabla-datos.xlsx")
            }}
            className="h-8 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:opacity-90"
          >
            Abrir…
          </button>
        </div>
      )}

      {mode === "pdf" && (
        <div className="flex-1 bg-muted p-2">
          <div className="flex h-full items-center justify-center rounded border border-border bg-background text-sm text-muted-foreground">
            Vista previa del PDF
          </div>
        </div>
      )}

      {mode === "excel" && (
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex border-b border-border">
            {(Object.keys(EXCEL_SHEETS) as (keyof typeof EXCEL_SHEETS)[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setActiveSheet(s)}
                className={`px-3 py-1.5 text-xs ${
                  s === activeSheet ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-auto">
            <table className="border-collapse text-xs">
              <tbody>
                {EXCEL_SHEETS[activeSheet].map((row, r) => (
                  <tr key={r}>
                    <td className="sticky left-0 z-10 border border-border bg-muted px-2 py-1 text-center text-muted-foreground">
                      {r + 1}
                    </td>
                    {row.map((cell, c) => (
                      <td key={c} className="min-w-[64px] border border-border px-2 py-1 text-foreground/90">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
