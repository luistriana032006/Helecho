import { useId, useRef, useState } from 'react'
import { Node } from '@tiptap/core'
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react'

export interface PlaneLine {
  x1: number
  y1: number
  x2: number
  y2: number
}

export type CurveType =
  | 'recta' | 'parabola' | 'cubica' | 'raiz'
  | 'inversa' | 'seno' | 'coseno' | 'exponencial'

export interface PlaneCurve {
  type: CurveType
  a: number
  b: number
  c: number
  from: number
  to: number
  openFrom?: boolean
  openTo?: boolean
}

interface PlanePoint {
  x: number
  y: number
}

type Instrument = 'none' | 'transportador' | 'esc45' | 'esc60'

const SIZE = 440
const PAD = 24

// ── Catálogo de funciones (UI visual, sin fórmulas escritas) ───────

interface CurveTypeDef {
  label: string
  formula: string
  coefs: ('a' | 'b' | 'c')[]
  evalFn: (c: PlaneCurve, x: number) => number
}

const CURVE_TYPES: Record<CurveType, CurveTypeDef> = {
  recta:       { label: 'Recta',       formula: 'y = a·x + b',         coefs: ['a', 'b'],
                 evalFn: (c, x) => c.a * x + c.b },
  parabola:    { label: 'Parábola',    formula: 'y = a·x² + b·x + c',  coefs: ['a', 'b', 'c'],
                 evalFn: (c, x) => c.a * x * x + c.b * x + c.c },
  cubica:      { label: 'Cúbica',      formula: 'y = a·x³ + b·x + c',  coefs: ['a', 'b', 'c'],
                 evalFn: (c, x) => c.a * x * x * x + c.b * x + c.c },
  raiz:        { label: 'Raíz',        formula: 'y = a·√(x−b) + c',    coefs: ['a', 'b', 'c'],
                 evalFn: (c, x) => c.a * Math.sqrt(x - c.b) + c.c },
  inversa:     { label: '1/x',         formula: 'y = a/(x−b) + c',     coefs: ['a', 'b', 'c'],
                 evalFn: (c, x) => c.a / (x - c.b) + c.c },
  seno:        { label: 'Seno',        formula: 'y = a·sen(b·x) + c',  coefs: ['a', 'b', 'c'],
                 evalFn: (c, x) => c.a * Math.sin(c.b * x) + c.c },
  coseno:      { label: 'Coseno',      formula: 'y = a·cos(b·x) + c',  coefs: ['a', 'b', 'c'],
                 evalFn: (c, x) => c.a * Math.cos(c.b * x) + c.c },
  exponencial: { label: 'Exponencial', formula: 'y = a·e^(b·x) + c',   coefs: ['a', 'b', 'c'],
                 evalFn: (c, x) => c.a * Math.exp(c.b * x) + c.c },
}

const PALETTE = ['#dc2626', '#16a34a', '#9333ea', '#ea580c', '#0891b2', '#db2777']

/**
 * Muestrea la curva en ~240 puntos dentro de su dominio y devuelve
 * tramos de polilínea. Se corta el tramo en discontinuidades (NaN,
 * asíntotas de 1/x) o cuando se dispara fuera del área visible.
 */
function curveSegments(curve: PlaneCurve, range: number): PlanePoint[][] {
  const from = Math.max(curve.from, -range)
  const to = Math.min(curve.to, range)
  if (to <= from) return []

  const SAMPLES = 240
  const bound = range * 3
  const evalFn = CURVE_TYPES[curve.type].evalFn
  const segments: PlanePoint[][] = []
  let current: PlanePoint[] = []

  for (let i = 0; i <= SAMPLES; i++) {
    const x = from + ((to - from) * i) / SAMPLES
    const y = evalFn(curve, x)
    if (Number.isFinite(y) && Math.abs(y) <= bound) {
      current.push({ x, y })
    } else if (current.length > 0) {
      segments.push(current)
      current = []
    }
  }
  if (current.length > 0) segments.push(current)
  return segments
}

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2))

function curveLabel(curve: PlaneCurve): string {
  const def = CURVE_TYPES[curve.type]
  const coefs = def.coefs.map((k) => `${k}=${fmt(curve[k])}`).join(', ')
  const open = (o: boolean | undefined, br: [string, string]) => (o ? br[0] : br[1])
  return `${def.label} (${coefs}) en ${open(curve.openFrom, ['(', '['])}${fmt(curve.from)}, ${fmt(curve.to)}${open(curve.openTo, [')', ']'])}`
}

// ── Instrumentos de geometría (overlays no persistentes) ──────────

function ProtractorShape() {
  const R = 110
  const marks: React.ReactNode[] = []
  for (let a = 0; a <= 180; a += 10) {
    const rad = (a * Math.PI) / 180
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)
    const inner = a % 30 === 0 ? R - 14 : R - 8
    marks.push(
      <line key={`t-${a}`} x1={inner * cos} y1={-inner * sin} x2={(R - 2) * cos} y2={-(R - 2) * sin}
        stroke="#b45309" strokeWidth={1} />
    )
    if (a % 30 === 0) {
      marks.push(
        <text key={`l-${a}`} x={(R - 26) * cos} y={-(R - 26) * sin + 3}
          fill="#92400e" fontSize="9" textAnchor="middle">{a}°</text>
      )
    }
  }
  return (
    <>
      <path d={`M ${-R} 0 A ${R} ${R} 0 0 1 ${R} 0 Z`}
        fill="rgba(253, 230, 138, 0.45)" stroke="#d97706" strokeWidth={1.5} className="cursor-move" />
      {marks}
      <line x1={-R} y1={0} x2={R} y2={0} stroke="#d97706" strokeWidth={1} />
      <circle r={2.5} fill="#b45309" />
    </>
  )
}

function SquareShape({ kind }: { kind: 'esc45' | 'esc60' }) {
  // esc45: triángulo 45-45-90 · esc60: triángulo 30-60-90
  const points = kind === 'esc45' ? '0,0 150,0 0,-150' : '0,0 170,0 0,-98'
  const labels = kind === 'esc45'
    ? [
        { x: 10, y: -10, t: '90°' },
        { x: 116, y: -8, t: '45°' },
        { x: 9, y: -118, t: '45°' },
      ]
    : [
        { x: 10, y: -8, t: '90°' },
        { x: 132, y: -7, t: '30°' },
        { x: 9, y: -72, t: '60°' },
      ]
  return (
    <>
      <polygon points={points}
        fill="rgba(191, 219, 254, 0.45)" stroke="#2563eb" strokeWidth={1.5} className="cursor-move" />
      {labels.map((l) => (
        <text key={l.t + l.x} x={l.x} y={l.y} fill="#1d4ed8" fontSize="10">{l.t}</text>
      ))}
    </>
  )
}

// ── Vista del plano ────────────────────────────────────────────────

function PlaneView({ node, updateAttributes, selected }: NodeViewProps) {
  const lines = (node.attrs.lines as PlaneLine[]) ?? []
  const curves = (node.attrs.curves as PlaneCurve[]) ?? []
  const range = (node.attrs.range as number) ?? 10
  const [draft, setDraft] = useState<PlaneCurve | null>(null)
  const clipId = useId().replace(/[^a-zA-Z0-9]/g, '')
  const [drawing, setDrawing] = useState(false)
  const [start, setStart] = useState<PlanePoint | null>(null)
  const [hover, setHover] = useState<PlanePoint | null>(null)
  const [instrument, setInstrument] = useState<Instrument>('none')
  const [instPos, setInstPos] = useState<PlanePoint>({ x: SIZE / 2, y: SIZE / 2 })
  const [instRot, setInstRot] = useState(0)
  const dragState = useRef<{ mode: 'move' | 'rotate'; dx: number; dy: number } | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const scale = (SIZE - 2 * PAD) / (2 * range)
  const px = (x: number) => PAD + (x + range) * scale
  const py = (y: number) => SIZE - PAD - (y + range) * scale

  // Posición del mouse en unidades del viewBox, correcta bajo zoom
  const pixelFromEvent = (e: { clientX: number; clientY: number }): PlanePoint => {
    const rect = svgRef.current!.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * SIZE,
      y: ((e.clientY - rect.top) / rect.height) * SIZE,
    }
  }

  // Coordenadas del plano con snap a la cuadrícula
  const pointFromEvent = (e: React.MouseEvent): PlanePoint | null => {
    if (!svgRef.current) return null
    const p = pixelFromEvent(e)
    const clamp = (v: number) => Math.max(-range, Math.min(range, v))
    return {
      x: clamp(Math.round((p.x - PAD) / scale - range)),
      y: clamp(Math.round((SIZE - PAD - p.y) / scale - range)),
    }
  }

  const onSvgClick = (e: React.MouseEvent) => {
    if (!drawing) return
    e.stopPropagation()
    const p = pointFromEvent(e)
    if (!p) return
    if (!start) {
      setStart(p)
      return
    }
    if (p.x !== start.x || p.y !== start.y) {
      updateAttributes({ lines: [...lines, { x1: start.x, y1: start.y, x2: p.x, y2: p.y }] })
    }
    setStart(null)
  }

  // ── Arrastre y rotación de instrumentos (con captura de puntero) ──

  const startMove = (e: React.PointerEvent) => {
    e.stopPropagation()
    ;(e.target as Element).setPointerCapture(e.pointerId)
    const p = pixelFromEvent(e)
    dragState.current = { mode: 'move', dx: p.x - instPos.x, dy: p.y - instPos.y }
  }

  const startRotate = (e: React.PointerEvent) => {
    e.stopPropagation()
    ;(e.target as Element).setPointerCapture(e.pointerId)
    dragState.current = { mode: 'rotate', dx: 0, dy: 0 }
  }

  const onInstrumentMove = (e: React.PointerEvent) => {
    if (!dragState.current) return
    const p = pixelFromEvent(e)
    if (dragState.current.mode === 'move') {
      setInstPos({ x: p.x - dragState.current.dx, y: p.y - dragState.current.dy })
    } else {
      setInstRot((Math.atan2(p.y - instPos.y, p.x - instPos.x) * 180) / Math.PI)
    }
  }

  const endInstrumentDrag = () => { dragState.current = null }

  const toggleInstrument = (inst: Instrument) => {
    setInstrument((prev) => (prev === inst ? 'none' : inst))
    setInstPos({ x: SIZE / 2, y: SIZE / 2 })
    setInstRot(0)
  }

  const handleRadius = instrument === 'transportador' ? 110 : instrument === 'esc45' ? 150 : 170

  const labelStep = range > 10 ? 5 : 2
  const ticks: number[] = []
  for (let i = -range; i <= range; i++) ticks.push(i)

  const toolBtn = (active: boolean) =>
    `rounded px-2 py-0.5 text-xs font-medium transition-colors ${
      active
        ? 'bg-blue-600 text-white'
        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
    }`

  return (
    <NodeViewWrapper
      as="div"
      contentEditable={false}
      className={`cartesian-plane my-3 inline-block rounded-lg border bg-white p-2 select-none ${
        selected ? 'border-blue-400 ring-2 ring-blue-200' : 'border-zinc-200'
      }`}
    >
      {/* Controles del plano — se excluyen del PDF */}
      <div className="plane-toolbar mb-1 flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => { setDrawing(!drawing); setStart(null) }}
          title="Dibujar línea: clic en dos puntos de la cuadrícula"
          className={toolBtn(drawing)}
        >
          ╱ Línea
        </button>
        <button
          onClick={() => updateAttributes({ lines: lines.slice(0, -1) })}
          disabled={lines.length === 0}
          title="Quitar la última línea"
          className={`${toolBtn(false)} disabled:opacity-40`}
        >
          Deshacer
        </button>
        <button
          onClick={() => updateAttributes({ lines: [] })}
          disabled={lines.length === 0}
          title="Quitar todas las líneas"
          className={`${toolBtn(false)} disabled:opacity-40`}
        >
          Limpiar
        </button>

        <div className="mx-0.5 h-4 w-px bg-zinc-200" />

        <button
          onClick={() =>
            setDraft(draft ? null : { type: 'parabola', a: 1, b: 0, c: 0, from: -range, to: range })
          }
          title="Agregar una función al plano (con dominio, para gráficas a trozos)"
          className={toolBtn(draft !== null)}
        >
          ƒ Función
        </button>

        <div className="mx-0.5 h-4 w-px bg-zinc-200" />

        <button
          onClick={() => toggleInstrument('transportador')}
          title="Transportador: arrastra para mover, perilla para rotar"
          className={toolBtn(instrument === 'transportador')}
        >
          Transportador
        </button>
        <button
          onClick={() => toggleInstrument('esc45')}
          title="Escuadra de 45°"
          className={toolBtn(instrument === 'esc45')}
        >
          Esc. 45°
        </button>
        <button
          onClick={() => toggleInstrument('esc60')}
          title="Escuadra de 60° (30-60-90)"
          className={toolBtn(instrument === 'esc60')}
        >
          Esc. 60°
        </button>

        <select
          value={range}
          onChange={(e) => updateAttributes({ range: Number(e.target.value) })}
          title="Rango de los ejes"
          className="ml-auto rounded border border-zinc-300 bg-white px-1 py-0.5 text-xs text-zinc-600"
        >
          <option value={5}>±5</option>
          <option value={10}>±10</option>
          <option value={20}>±20</option>
        </select>
        {drawing && (
          <span className="w-full text-xs text-blue-600">
            {start ? 'clic en el punto final' : 'clic en el punto inicial'}
          </span>
        )}
      </div>

      {/* Formulario visual de función — la vista previa se dibuja punteada */}
      {draft && (
        <div className="plane-toolbar mb-1 flex flex-wrap items-center gap-1.5 rounded border border-zinc-200 bg-zinc-50 p-2 text-xs text-zinc-700">
          <select
            value={draft.type}
            onChange={(e) => setDraft({ ...draft, type: e.target.value as CurveType })}
            className="rounded border border-zinc-300 bg-white px-1 py-0.5"
          >
            {(Object.keys(CURVE_TYPES) as CurveType[]).map((t) => (
              <option key={t} value={t}>{CURVE_TYPES[t].label}</option>
            ))}
          </select>
          <span className="text-zinc-500">{CURVE_TYPES[draft.type].formula}</span>

          {CURVE_TYPES[draft.type].coefs.map((k) => (
            <label key={k} className="flex items-center gap-0.5">
              {k}=
              <input
                type="number"
                step={0.5}
                value={draft[k]}
                onChange={(e) => {
                  const v = e.target.value === '' ? 0 : Number(e.target.value)
                  if (!Number.isNaN(v)) setDraft({ ...draft, [k]: v })
                }}
                className="w-14 rounded border border-zinc-300 bg-white px-1 py-0.5"
              />
            </label>
          ))}

          <span className="ml-1">de x=</span>
          <input
            type="number" step={0.5} value={draft.from}
            onChange={(e) => {
              const v = e.target.value === '' ? -range : Number(e.target.value)
              if (!Number.isNaN(v)) setDraft({ ...draft, from: v })
            }}
            className="w-14 rounded border border-zinc-300 bg-white px-1 py-0.5"
          />
          <span>a</span>
          <input
            type="number" step={0.5} value={draft.to}
            onChange={(e) => {
              const v = e.target.value === '' ? range : Number(e.target.value)
              if (!Number.isNaN(v)) setDraft({ ...draft, to: v })
            }}
            className="w-14 rounded border border-zinc-300 bg-white px-1 py-0.5"
          />
          <label className="flex items-center gap-0.5" title="Extremo izquierdo abierto: punto sin rellenar">
            <input type="checkbox" checked={draft.openFrom ?? false}
              onChange={(e) => setDraft({ ...draft, openFrom: e.target.checked })} />
            ( izq
          </label>
          <label className="flex items-center gap-0.5" title="Extremo derecho abierto: punto sin rellenar">
            <input type="checkbox" checked={draft.openTo ?? false}
              onChange={(e) => setDraft({ ...draft, openTo: e.target.checked })} />
            ) der
          </label>

          <button
            onClick={() => {
              if (draft.to > draft.from) {
                updateAttributes({ curves: [...curves, draft] })
                setDraft(null)
              }
            }}
            disabled={draft.to <= draft.from}
            className="rounded bg-blue-600 px-2 py-0.5 font-medium text-white hover:bg-blue-500 disabled:opacity-40"
          >
            Agregar
          </button>
          <button
            onClick={() => setDraft(null)}
            className="rounded px-1.5 py-0.5 text-zinc-500 hover:bg-zinc-200"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Lista de funciones agregadas */}
      {curves.length > 0 && (
        <div className="plane-toolbar mb-1 flex flex-col gap-0.5">
          {curves.map((c, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs text-zinc-600">
              <span
                className="h-2 w-2 flex-shrink-0 rounded-full"
                style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
              />
              <span className="truncate">{curveLabel(c)}</span>
              <button
                onClick={() => updateAttributes({ curves: curves.filter((_, j) => j !== i) })}
                title="Quitar esta función"
                className="rounded px-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <svg
        ref={svgRef}
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        onClick={onSvgClick}
        onMouseMove={(e) => { if (drawing) setHover(pointFromEvent(e)) }}
        onMouseLeave={() => setHover(null)}
        className={drawing ? 'cursor-crosshair' : ''}
      >
        {/* Cuadrícula */}
        {ticks.map((i) => (
          <g key={i}>
            <line x1={px(i)} y1={py(-range)} x2={px(i)} y2={py(range)}
              stroke={i === 0 ? '#374151' : '#e5e7eb'} strokeWidth={i === 0 ? 1.5 : 1} />
            <line x1={px(-range)} y1={py(i)} x2={px(range)} y2={py(i)}
              stroke={i === 0 ? '#374151' : '#e5e7eb'} strokeWidth={i === 0 ? 1.5 : 1} />
          </g>
        ))}

        {/* Números de los ejes */}
        {ticks.filter((i) => i !== 0 && i % labelStep === 0).map((i) => (
          <g key={`lbl-${i}`} fill="#6b7280" fontSize="10">
            <text x={px(i)} y={py(0) + 12} textAnchor="middle">{i}</text>
            <text x={px(0) - 5} y={py(i) + 3} textAnchor="end">{i}</text>
          </g>
        ))}
        <text x={px(range) - 4} y={py(0) - 6} fill="#374151" fontSize="11" textAnchor="end" fontStyle="italic">x</text>
        <text x={px(0) + 6} y={py(range) + 10} fill="#374151" fontSize="11" fontStyle="italic">y</text>

        {/* Curvas de funciones, recortadas al área del plano */}
        <defs>
          <clipPath id={clipId}>
            <rect x={PAD} y={PAD} width={SIZE - 2 * PAD} height={SIZE - 2 * PAD} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          {[...curves, ...(draft ? [draft] : [])].map((curve, idx) => {
            const isDraft = draft !== null && idx === curves.length
            const color = PALETTE[idx % PALETTE.length]
            const segments = curveSegments(curve, range)
            const evalFn = CURVE_TYPES[curve.type].evalFn

            const endDot = (xVal: number, open: boolean | undefined, key: string) => {
              if (xVal < -range || xVal > range) return null
              const y = evalFn(curve, xVal)
              if (!Number.isFinite(y) || Math.abs(y) > range) return null
              return (
                <circle key={key} cx={px(xVal)} cy={py(y)} r={3.5}
                  fill={open ? '#ffffff' : color} stroke={color} strokeWidth={1.5} />
              )
            }

            return (
              <g key={`curve-${idx}`}>
                {segments.map((points, s) => (
                  <polyline
                    key={s}
                    points={points.map((p) => `${px(p.x)},${py(p.y)}`).join(' ')}
                    fill="none"
                    stroke={color}
                    strokeWidth={2}
                    strokeDasharray={isDraft ? '6 4' : undefined}
                  />
                ))}
                {!isDraft && endDot(curve.from, curve.openFrom, 'from')}
                {!isDraft && endDot(curve.to, curve.openTo, 'to')}
              </g>
            )
          })}
        </g>

        {/* Líneas dibujadas */}
        {lines.map((l, i) => (
          <g key={`line-${i}`}>
            <line x1={px(l.x1)} y1={py(l.y1)} x2={px(l.x2)} y2={py(l.y2)}
              stroke="#2563eb" strokeWidth={2} />
            <circle cx={px(l.x1)} cy={py(l.y1)} r={3} fill="#2563eb" />
            <circle cx={px(l.x2)} cy={py(l.y2)} r={3} fill="#2563eb" />
          </g>
        ))}

        {/* Vista previa mientras se dibuja */}
        {drawing && start && hover && (
          <line x1={px(start.x)} y1={py(start.y)} x2={px(hover.x)} y2={py(hover.y)}
            stroke="#93c5fd" strokeWidth={2} strokeDasharray="5 4" />
        )}
        {drawing && start && (
          <circle cx={px(start.x)} cy={py(start.y)} r={4} fill="#2563eb" />
        )}
        {drawing && hover && (
          <circle cx={px(hover.x)} cy={py(hover.y)} r={4} fill="none" stroke="#2563eb" strokeWidth={1.5} />
        )}

        {/* Instrumento activo — no persiste ni sale en el PDF */}
        {instrument !== 'none' && (
          <g
            className="plane-instruments"
            transform={`translate(${instPos.x} ${instPos.y}) rotate(${instRot})`}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={startMove}
            onPointerMove={onInstrumentMove}
            onPointerUp={endInstrumentDrag}
            onPointerCancel={endInstrumentDrag}
          >
            {instrument === 'transportador'
              ? <ProtractorShape />
              : <SquareShape kind={instrument} />}

            {/* Perilla de rotación */}
            <g onPointerDown={startRotate} className="cursor-alias">
              <line x1={handleRadius} y1={0} x2={handleRadius + 14} y2={0} stroke="#9ca3af" strokeWidth={1.5} />
              <circle cx={handleRadius + 20} cy={0} r={6}
                fill="#ffffff" stroke="#6b7280" strokeWidth={1.5} />
            </g>
          </g>
        )}
      </svg>
    </NodeViewWrapper>
  )
}

export const CartesianPlane = Node.create({
  name: 'cartesianPlane',
  group: 'block',
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      range: { default: 10 },
      lines: { default: [] as PlaneLine[] },
      curves: { default: [] as PlaneCurve[] },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="cartesian-plane"]',
        getAttrs: (el) => {
          const element = el as HTMLElement
          try {
            return {
              range: Number(element.getAttribute('data-range')) || 10,
              lines: JSON.parse(element.getAttribute('data-lines') ?? '[]') as PlaneLine[],
              curves: JSON.parse(element.getAttribute('data-curves') ?? '[]') as PlaneCurve[],
            }
          } catch {
            return { range: 10, lines: [], curves: [] }
          }
        },
      },
    ]
  },

  renderHTML({ node }) {
    return [
      'div',
      {
        'data-type': 'cartesian-plane',
        'data-range': String(node.attrs.range),
        'data-lines': JSON.stringify(node.attrs.lines),
        'data-curves': JSON.stringify(node.attrs.curves),
      },
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(PlaneView)
  },
})
