"use client"

import { useMemo, useState } from "react"
import { Spline, Undo2, Eraser, FunctionSquare, Triangle, Ruler, X } from "lucide-react"
import type { PlotFunction, PlotType } from "@/lib/helecho/types"
import { PLOT_TYPE_FORMULAS, PLOT_TYPE_LABELS, PLOT_COLORS } from "@/lib/helecho/data"

const SIZE = 440

function evalFn(fn: PlotFunction, x: number): number {
  const { a, b, c, type } = fn
  switch (type) {
    case "recta":
      return a * x + b
    case "parabola":
      return a * x * x + b * x + c
    case "cubica":
      return a * x * x * x + b * x + c
    case "raiz":
      return x < 0 ? NaN : a * Math.sqrt(x) + b
    case "inversa":
      return x === 0 ? NaN : a / x + b
    case "seno":
      return a * Math.sin(b * x) + c
    case "coseno":
      return a * Math.cos(b * x) + c
    case "exponencial":
      return a * Math.exp(b * x) + c
  }
}

interface CartesianPlaneProps {
  functions: PlotFunction[]
  range: number
  onRangeChange: (r: number) => void
  onAddFunction: (fn: Omit<PlotFunction, "id" | "color" | "label">) => void
  onRemoveFunction: (id: string) => void
  onClear: () => void
}

export function CartesianPlane(props: CartesianPlaneProps) {
  const { functions, range } = props
  const [showForm, setShowForm] = useState(false)

  const scale = SIZE / (2 * range)
  const toPx = (x: number, y: number) => ({ px: SIZE / 2 + x * scale, py: SIZE / 2 - y * scale })

  const ticks = useMemo(() => {
    const step = range <= 5 ? 1 : range <= 10 ? 2 : 5
    const arr: number[] = []
    for (let i = -range; i <= range; i += step) if (i !== 0) arr.push(i)
    return arr
  }, [range])

  function pathFor(fn: PlotFunction): string {
    const steps = 240
    const from = Math.max(-range, fn.domainFrom)
    const to = Math.min(range, fn.domainTo)
    let d = ""
    let started = false
    for (let i = 0; i <= steps; i++) {
      const x = from + ((to - from) * i) / steps
      const y = evalFn(fn, x)
      if (!Number.isFinite(y) || y < -range * 1.5 || y > range * 1.5) {
        started = false
        continue
      }
      const { px, py } = toPx(x, y)
      d += `${started ? "L" : "M"}${px.toFixed(1)},${py.toFixed(1)} `
      started = true
    }
    return d
  }

  return (
    <div className="rounded-lg border border-border bg-white text-[#0c2c1c]">
      {/* mini toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-black/10 px-2 py-1.5 text-xs">
        <button type="button" className="flex items-center gap-1 rounded px-2 py-1 hover:bg-black/5"><Spline className="size-3.5" aria-hidden /> Línea</button>
        <button type="button" className="flex items-center gap-1 rounded px-2 py-1 hover:bg-black/5"><Undo2 className="size-3.5" aria-hidden /> Deshacer</button>
        <button type="button" onClick={props.onClear} className="flex items-center gap-1 rounded px-2 py-1 hover:bg-black/5"><Eraser className="size-3.5" aria-hidden /> Limpiar</button>
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-1 rounded bg-[#1e8049] px-2 py-1 text-white hover:bg-[#176239]"
        >
          <FunctionSquare className="size-3.5" aria-hidden /> Función
        </button>
        <button type="button" className="flex items-center gap-1 rounded px-2 py-1 hover:bg-black/5"><Ruler className="size-3.5" aria-hidden /> Transportador</button>
        <button type="button" className="flex items-center gap-1 rounded px-2 py-1 hover:bg-black/5"><Triangle className="size-3.5" aria-hidden /> Esc. 45°</button>
        <button type="button" className="flex items-center gap-1 rounded px-2 py-1 hover:bg-black/5"><Triangle className="size-3.5" aria-hidden /> Esc. 60°</button>
        <select
          value={range}
          onChange={(e) => props.onRangeChange(Number(e.target.value))}
          className="ml-auto rounded border border-black/15 bg-white px-1.5 py-1"
          aria-label="Rango"
        >
          <option value={5}>±5</option>
          <option value={10}>±10</option>
          <option value={20}>±20</option>
        </select>
      </div>

      {showForm && (
        <FunctionForm
          onCancel={() => setShowForm(false)}
          onAdd={(fn) => {
            props.onAddFunction(fn)
            setShowForm(false)
          }}
        />
      )}

      {/* function list */}
      {functions.length > 0 && (
        <ul className="flex flex-col gap-1 border-b border-black/10 px-2 py-2 text-xs">
          {functions.map((fn) => (
            <li key={fn.id} className="flex items-center gap-2">
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: fn.color }} />
              <span className="flex-1 truncate">{fn.label}</span>
              <button
                type="button"
                onClick={() => props.onRemoveFunction(fn.id)}
                aria-label="Quitar función"
                className="text-black/40 hover:text-red-600"
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* plot */}
      <div className="flex justify-center p-3">
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="max-w-full">
          {/* grid */}
          {ticks.map((t) => {
            const { px } = toPx(t, 0)
            const { py } = toPx(0, t)
            return (
              <g key={t}>
                <line x1={px} y1={0} x2={px} y2={SIZE} stroke="#e2e8e4" />
                <line x1={0} y1={py} x2={SIZE} y2={py} stroke="#e2e8e4" />
              </g>
            )
          })}
          {/* axes */}
          <line x1={SIZE / 2} y1={0} x2={SIZE / 2} y2={SIZE} stroke="#0c2c1c" strokeWidth={1.5} />
          <line x1={0} y1={SIZE / 2} x2={SIZE} y2={SIZE / 2} stroke="#0c2c1c" strokeWidth={1.5} />
          {/* tick labels */}
          {ticks.map((t) => {
            const { px } = toPx(t, 0)
            const { py } = toPx(0, t)
            return (
              <g key={`l${t}`} fontSize={9} fill="#557">
                <text x={px} y={SIZE / 2 + 12} textAnchor="middle">{t}</text>
                <text x={SIZE / 2 - 6} y={py + 3} textAnchor="end">{t}</text>
              </g>
            )
          })}
          {/* functions */}
          {functions.map((fn) => (
            <path key={fn.id} d={pathFor(fn)} fill="none" stroke={fn.color} strokeWidth={2} />
          ))}
        </svg>
      </div>
    </div>
  )
}

function FunctionForm({
  onAdd,
  onCancel,
}: {
  onAdd: (fn: Omit<PlotFunction, "id" | "color" | "label">) => void
  onCancel: () => void
}) {
  const [type, setType] = useState<PlotType>("recta")
  const [a, setA] = useState(1)
  const [b, setB] = useState(0)
  const [c, setC] = useState(0)
  const [from, setFrom] = useState(-10)
  const [to, setTo] = useState(10)
  const [openLeft, setOpenLeft] = useState(false)
  const [openRight, setOpenRight] = useState(false)

  const numInput =
    "h-7 w-14 rounded border border-black/15 bg-white px-1.5 text-center text-xs outline-none focus:border-[#1e8049]"

  return (
    <div className="flex flex-col gap-2 border-b border-black/10 bg-black/[0.02] px-3 py-3 text-xs">
      <div className="flex items-center gap-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as PlotType)}
          className="h-7 rounded border border-black/15 bg-white px-1.5 outline-none focus:border-[#1e8049]"
        >
          {(Object.keys(PLOT_TYPE_LABELS) as PlotType[]).map((t) => (
            <option key={t} value={t}>
              {PLOT_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        <span className="font-mono text-black/60">{PLOT_TYPE_FORMULAS[type]}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1">a <input type="number" value={a} onChange={(e) => setA(Number(e.target.value))} className={numInput} /></label>
        <label className="flex items-center gap-1">b <input type="number" value={b} onChange={(e) => setB(Number(e.target.value))} className={numInput} /></label>
        <label className="flex items-center gap-1">c <input type="number" value={c} onChange={(e) => setC(Number(e.target.value))} className={numInput} /></label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span>de x=</span>
        <input type="number" value={from} onChange={(e) => setFrom(Number(e.target.value))} className={numInput} />
        <span>a</span>
        <input type="number" value={to} onChange={(e) => setTo(Number(e.target.value))} className={numInput} />
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={openLeft} onChange={(e) => setOpenLeft(e.target.checked)} /> ( izq
        </label>
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={openRight} onChange={(e) => setOpenRight(e.target.checked)} /> ) der
        </label>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onAdd({ type, a, b, c, domainFrom: from, domainTo: to, openLeft, openRight })}
          className="rounded bg-[#1e8049] px-3 py-1 text-white hover:bg-[#176239]"
        >
          Agregar
        </button>
        <button type="button" onClick={onCancel} className="rounded px-3 py-1 hover:bg-black/5">
          Cancelar
        </button>
      </div>
    </div>
  )
}

export { PLOT_COLORS }
