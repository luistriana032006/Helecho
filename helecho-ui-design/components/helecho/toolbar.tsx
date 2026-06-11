"use client"

import { ArrowLeft, List, ListOrdered, X, LineChart, Minus, Plus } from "lucide-react"
import { FileMenu } from "./file-menu"
import { TableGridPicker } from "./table-grid-picker"

interface ToolbarProps {
  fileName: string
  dirty: boolean
  zoom: number
  inTable: boolean
  onHome: () => void
  onNew: () => void
  onOpen: () => void
  onSave: () => void
  onExportPdf: () => void
  onSettings: () => void
  onFormat: (cmd: string) => void
  onInsertTable: (rows: number, cols: number) => void
  onTableOp: (op: string) => void
  onInsertPlane: () => void
  onZoomChange: (zoom: number) => void
}

const btn = "flex h-7 min-w-7 items-center justify-center rounded px-1.5 text-sm hover:bg-muted"
const sep = <span className="mx-1 h-5 w-px bg-border" />

export function Toolbar(props: ToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border bg-sidebar px-2 py-1.5">
      <button type="button" onClick={props.onHome} className="flex h-7 items-center gap-1 rounded px-2 text-sm hover:bg-muted">
        <ArrowLeft className="size-4" aria-hidden /> Inicio
      </button>
      <FileMenu
        onHome={props.onHome}
        onNew={props.onNew}
        onOpen={props.onOpen}
        onSave={props.onSave}
        onExportPdf={props.onExportPdf}
        onSettings={props.onSettings}
      />

      <div className="flex items-center gap-1.5 px-2 text-sm">
        <span className="truncate text-muted-foreground">{props.fileName}</span>
        {props.dirty && <span className="size-1.5 rounded-full bg-primary" aria-label="Cambios sin guardar" />}
      </div>

      {sep}

      <button type="button" className={btn} onClick={() => props.onFormat("h1")}>H1</button>
      <button type="button" className={btn} onClick={() => props.onFormat("h2")}>H2</button>
      <button type="button" className={btn} onClick={() => props.onFormat("h3")}>H3</button>

      {sep}

      <button type="button" className={`${btn} font-bold`} onClick={() => props.onFormat("bold")}>B</button>
      <button type="button" className={`${btn} underline`} onClick={() => props.onFormat("underline")}>U</button>
      <button type="button" className={`${btn} line-through`} onClick={() => props.onFormat("strike")}>S</button>

      {sep}

      <button type="button" className={btn} onClick={() => props.onFormat("bullet")} aria-label="Lista de viñetas"><List className="size-4" aria-hidden /></button>
      <button type="button" className={btn} onClick={() => props.onFormat("numbered")} aria-label="Lista numerada"><ListOrdered className="size-4" aria-hidden /></button>

      {sep}

      <TableGridPicker onPick={props.onInsertTable} />
      {props.inTable && (
        <div className="flex items-center gap-1">
          <button type="button" className={btn} onClick={() => props.onTableOp("addRow")}>+ Fila</button>
          <button type="button" className={btn} onClick={() => props.onTableOp("addCol")}>+ Col</button>
          <button type="button" className={btn} onClick={() => props.onTableOp("delRow")}>− Fila</button>
          <button type="button" className={btn} onClick={() => props.onTableOp("delCol")}>− Col</button>
          <button
            type="button"
            className="flex h-7 items-center gap-1 rounded px-1.5 text-sm text-destructive hover:bg-destructive/10"
            onClick={() => props.onTableOp("delTable")}
          >
            <X className="size-4" aria-hidden /> Tabla
          </button>
        </div>
      )}

      {sep}

      <button type="button" className={`${btn} gap-1 px-2`} onClick={props.onInsertPlane}>
        <LineChart className="size-4" aria-hidden /> Plano
      </button>

      {/* Zoom control */}
      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          className={btn}
          onClick={() => props.onZoomChange(Math.max(50, props.zoom - 10))}
          aria-label="Reducir zoom"
        >
          <Minus className="size-4" aria-hidden />
        </button>
        <input
          type="range"
          min={50}
          max={200}
          step={5}
          value={props.zoom}
          onChange={(e) => props.onZoomChange(Number(e.target.value))}
          className="h-1 w-28 accent-primary"
          aria-label="Zoom"
        />
        <button
          type="button"
          className={btn}
          onClick={() => props.onZoomChange(Math.min(200, props.zoom + 10))}
          aria-label="Aumentar zoom"
        >
          <Plus className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => props.onZoomChange(100)}
          className="w-12 rounded px-1 text-right text-xs tabular-nums text-muted-foreground hover:text-foreground"
        >
          {props.zoom}%
        </button>
      </div>
    </div>
  )
}
