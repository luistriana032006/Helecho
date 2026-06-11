"use client"

import { useState } from "react"
import { GripVertical } from "lucide-react"
import type { PlotFunction, SheetMode } from "@/lib/helecho/types"
import { CartesianPlane } from "./cartesian-plane"
import { PLOT_COLORS } from "@/lib/helecho/data"
import { PLOT_TYPE_LABELS } from "@/lib/helecho/data"

interface SheetProps {
  zoom: number
  mode: SheetMode
}

interface Block {
  id: string
  kind: "h1" | "h2" | "p" | "bullet" | "table" | "plane"
  content?: string
  items?: string[]
}

const INITIAL_BLOCKS: Block[] = [
  { id: "b1", kind: "h1", content: "Espacios vectoriales" },
  {
    id: "b2",
    kind: "p",
    content:
      "Un espacio vectorial V sobre un campo K es un conjunto cerrado bajo la suma de vectores y el producto por un escalar, cumpliendo los ocho axiomas fundamentales.",
  },
  { id: "b3", kind: "h2", content: "Axiomas principales" },
  {
    id: "b4",
    kind: "bullet",
    items: ["Conmutatividad de la suma", "Existencia del vector cero", "Distributividad del escalar"],
  },
  { id: "b5", kind: "h2", content: "Ejemplo gráfico" },
  { id: "b6", kind: "plane" },
]

function BlockGrip() {
  return (
    <span
      className="absolute -left-7 top-1 cursor-grab select-none text-black/15 transition-colors hover:text-black/50"
      aria-hidden
    >
      <GripVertical className="size-4" />
    </span>
  )
}

export function Sheet({ zoom, mode }: SheetProps) {
  const [functions, setFunctions] = useState<PlotFunction[]>([
    {
      id: "f1",
      type: "recta",
      a: 1,
      b: 0,
      c: 0,
      domainFrom: -10,
      domainTo: 10,
      openLeft: false,
      openRight: false,
      color: PLOT_COLORS[0],
      label: "Recta · y = x",
    },
    {
      id: "f2",
      type: "parabola",
      a: 0.4,
      b: 0,
      c: -2,
      domainFrom: -10,
      domainTo: 10,
      openLeft: false,
      openRight: false,
      color: PLOT_COLORS[1],
      label: "Parábola · y = 0.4x² − 2",
    },
  ])
  const [range, setRange] = useState(10)

  function addFunction(fn: Omit<PlotFunction, "id" | "color" | "label">) {
    setFunctions((prev) => {
      const color = PLOT_COLORS[prev.length % PLOT_COLORS.length]
      const label = `${PLOT_TYPE_LABELS[fn.type]} · a=${fn.a} b=${fn.b} c=${fn.c}`
      return [...prev, { ...fn, id: crypto.randomUUID(), color, label }]
    })
  }

  return (
    <div className="flex justify-center overflow-auto bg-[#e7e9e6] p-8">
      <div
        className="origin-top"
        style={{ transform: `scale(${zoom / 100})` }}
      >
        <article
          className={`relative bg-white text-[#1a1a1a] shadow-xl ${
            mode === "strict" ? "min-h-[1123px]" : ""
          }`}
          style={{ width: 794, padding: 96 }}
        >
          <div className="flex flex-col gap-4">
            {INITIAL_BLOCKS.map((block) => (
              <div key={block.id} className="relative">
                <BlockGrip />
                {block.kind === "h1" && (
                  <h1 className="text-3xl font-bold tracking-tight">{block.content}</h1>
                )}
                {block.kind === "h2" && <h2 className="text-xl font-semibold">{block.content}</h2>}
                {block.kind === "p" && (
                  <p className="text-[15px] leading-relaxed text-[#333]">{block.content}</p>
                )}
                {block.kind === "bullet" && (
                  <ul className="list-disc pl-5 text-[15px] leading-relaxed text-[#333]">
                    {block.items?.map((it, i) => <li key={i}>{it}</li>)}
                  </ul>
                )}
                {block.kind === "plane" && (
                  <CartesianPlane
                    functions={functions}
                    range={range}
                    onRangeChange={setRange}
                    onAddFunction={addFunction}
                    onRemoveFunction={(id) => setFunctions((p) => p.filter((f) => f.id !== id))}
                    onClear={() => setFunctions([])}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-8 text-center text-xs text-black/40">1</div>
        </article>

        {mode === "strict" && (
          <>
            <div className="h-3 bg-[#e7e9e6]" />
            <div className="h-px bg-black/15" />
            <article
              className="relative min-h-[1123px] bg-white text-[#1a1a1a] shadow-xl"
              style={{ width: 794, padding: 96 }}
            >
              <p className="text-[15px] leading-relaxed text-black/30">Página siguiente…</p>
              <div className="pointer-events-none absolute inset-x-0 bottom-8 text-center text-xs text-black/40">2</div>
            </article>
          </>
        )}
      </div>
    </div>
  )
}
