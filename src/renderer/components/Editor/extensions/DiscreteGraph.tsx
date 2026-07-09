import { useId, useRef, useState } from 'react'
import { Node } from '@tiptap/core'
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react'
import { useAvailableWidth } from '../../../hooks/useAvailableWidth'
import {
  forceSimulation,
  forceManyBody,
  forceLink,
  forceCenter,
  forceCollide,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force'

export interface GraphNode {
  id: string
  label: string
  x: number
  y: number
}

export interface GraphEdge {
  from: string
  to: string
  weight: number
}

type Mode = 'mover' | 'agregar' | 'conectar' | 'borrar'

interface SimNode extends SimulationNodeDatum {
  id: string
}

const WIDTH = 460
const HEIGHT = 340
const PAD = 26
const NODE_R = 18

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

/** Siguiente etiqueta libre: A..Z y luego N1, N2… */
function nextLabel(nodes: GraphNode[]): string {
  for (const ch of ALPHA) if (!nodes.some((n) => n.label === ch)) return ch
  let i = 1
  while (nodes.some((n) => n.label === `N${i}`)) i++
  return `N${i}`
}

function GraphView({ node, updateAttributes, selected }: NodeViewProps) {
  const nodes = (node.attrs.nodes as GraphNode[]) ?? []
  const edges = (node.attrs.edges as GraphEdge[]) ?? []
  const directed = (node.attrs.directed as boolean) ?? false
  const weighted = (node.attrs.weighted as boolean) ?? false

  const [mode, setMode] = useState<Mode>(nodes.length === 0 ? 'agregar' : 'mover')
  const [pendingFrom, setPendingFrom] = useState<string | null>(null)
  const [live, setLive] = useState<{ id: string; x: number; y: number } | null>(null)
  const dragRef = useRef<{ id: string; offX: number; offY: number } | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const arrowId = useId().replace(/[^a-zA-Z0-9]/g, '')

  // El grafo se ajusta al ancho de su contenedor (columna u hoja). El viewBox
  // sigue en WIDTH×HEIGHT, así que el mapeo del clic (proporción de rect) y el
  // auto-layout no cambian; solo cambia el tamaño renderizado.
  const { sentinelRef, availW } = useAvailableWidth(WIDTH)
  // Mínimo bajo (120) para que quepa incluso en 3 columnas (~190px c/u); en
  // flujo normal queda topado a WIDTH.
  const renderW = Math.max(120, Math.min(WIDTH, Math.round(availW - 20)))
  const renderH = Math.round(renderW * (HEIGHT / WIDTH))

  const nodeById = (id: string) => nodes.find((n) => n.id === id)
  const posOf = (n: GraphNode) => (live && live.id === n.id ? live : n)

  // Posición del puntero en unidades del viewBox (correcta bajo zoom)
  const pointFromEvent = (e: { clientX: number; clientY: number }) => {
    const rect = svgRef.current!.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) / rect.width * WIDTH,
      y: (e.clientY - rect.top) / rect.height * HEIGHT,
    }
  }

  // ── Mutaciones de atributos ─────────────────────────────────────
  const addNode = (x: number, y: number) => {
    const newNode: GraphNode = {
      id: crypto.randomUUID(),
      label: nextLabel(nodes),
      x: clamp(x, PAD, WIDTH - PAD),
      y: clamp(y, PAD, HEIGHT - PAD),
    }
    updateAttributes({ nodes: [...nodes, newNode] })
  }

  const removeNode = (id: string) => {
    updateAttributes({
      nodes: nodes.filter((n) => n.id !== id),
      edges: edges.filter((e) => e.from !== id && e.to !== id),
    })
    if (pendingFrom === id) setPendingFrom(null)
  }

  const connect = (id: string) => {
    if (!pendingFrom) {
      setPendingFrom(id)
      return
    }
    if (pendingFrom === id) {
      setPendingFrom(null)
      return
    }
    const exists = edges.some(
      (e) =>
        (e.from === pendingFrom && e.to === id) ||
        (!directed && e.from === id && e.to === pendingFrom)
    )
    if (!exists) {
      updateAttributes({ edges: [...edges, { from: pendingFrom, to: id, weight: 1 }] })
    }
    setPendingFrom(null)
  }

  const removeEdgeAt = (idx: number) =>
    updateAttributes({ edges: edges.filter((_, i) => i !== idx) })

  const setWeightAt = (idx: number, weight: number) =>
    updateAttributes({ edges: edges.map((e, i) => (i === idx ? { ...e, weight } : e)) })

  // ── Auto-organizar con d3-force, luego CONGELAR posiciones ──────
  const reorganize = () => {
    if (nodes.length === 0) return
    const sim: SimNode[] = nodes.map((n) => ({ id: n.id, x: n.x, y: n.y }))
    const links: SimulationLinkDatum<SimNode>[] = edges.map((e) => ({ source: e.from, target: e.to }))
    const simulation = forceSimulation<SimNode>(sim)
      .force('charge', forceManyBody().strength(-260))
      .force('link', forceLink<SimNode, SimulationLinkDatum<SimNode>>(links).id((d) => d.id).distance(90))
      .force('center', forceCenter(WIDTH / 2, HEIGHT / 2))
      .force('collide', forceCollide(NODE_R + 12))
      .stop()
    for (let i = 0; i < 300; i++) simulation.tick()
    const byId = new Map(sim.map((s) => [s.id, s]))
    updateAttributes({
      nodes: nodes.map((n) => {
        const s = byId.get(n.id)
        return {
          ...n,
          x: clamp(Math.round(s?.x ?? n.x), PAD, WIDTH - PAD),
          y: clamp(Math.round(s?.y ?? n.y), PAD, HEIGHT - PAD),
        }
      }),
    })
  }

  // ── Eventos de nodo (arrastrar / conectar / borrar) ─────────────
  const onNodePointerDown = (e: React.PointerEvent, n: GraphNode) => {
    e.stopPropagation()
    if (mode === 'conectar') {
      connect(n.id)
    } else if (mode === 'borrar') {
      removeNode(n.id)
    } else if (mode === 'mover') {
      ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
      const p = pointFromEvent(e)
      dragRef.current = { id: n.id, offX: p.x - n.x, offY: p.y - n.y }
      setLive({ id: n.id, x: n.x, y: n.y })
    }
  }

  const onNodePointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current
    if (!d) return
    const p = pointFromEvent(e)
    setLive({
      id: d.id,
      x: clamp(p.x - d.offX, PAD, WIDTH - PAD),
      y: clamp(p.y - d.offY, PAD, HEIGHT - PAD),
    })
  }

  const onNodePointerUp = () => {
    const d = dragRef.current
    if (d && live && live.id === d.id) {
      updateAttributes({
        nodes: nodes.map((n) => (n.id === d.id ? { ...n, x: Math.round(live.x), y: Math.round(live.y) } : n)),
      })
    }
    dragRef.current = null
    setLive(null)
  }

  const onCanvasPointerDown = (e: React.PointerEvent) => {
    if (mode !== 'agregar') return
    const p = pointFromEvent(e)
    addNode(p.x, p.y)
  }

  const toolBtn = (active: boolean) =>
    `rounded px-2 py-0.5 text-xs font-medium transition-colors ${
      active ? 'bg-blue-600 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
    }`

  return (
    <NodeViewWrapper
      as="div"
      contentEditable={false}
      style={{ maxWidth: availW }}
      className={`discrete-graph my-3 inline-block max-w-full rounded-lg border bg-white p-2 align-top select-none ${
        selected ? 'border-blue-400 ring-2 ring-blue-200' : 'border-zinc-200'
      }`}
    >
      {/* Sentinel para medir el ancho del contenedor (columna u hoja) */}
      <div ref={sentinelRef} style={{ height: 0 }} />
      {/* Controles — se excluyen del PDF (.grafo-toolbar) */}
      <div className="grafo-toolbar mb-1 flex flex-wrap items-center gap-1.5">
        <button onClick={() => { setMode('agregar'); setPendingFrom(null) }} className={toolBtn(mode === 'agregar')} title="Clic en el lienzo para agregar un nodo">
          + Nodo
        </button>
        <button onClick={() => { setMode('conectar'); setPendingFrom(null) }} className={toolBtn(mode === 'conectar')} title="Clic en dos nodos para unirlos">
          Conectar
        </button>
        <button onClick={() => { setMode('mover'); setPendingFrom(null) }} className={toolBtn(mode === 'mover')} title="Arrastrar nodos">
          Mover
        </button>
        <button onClick={() => { setMode('borrar'); setPendingFrom(null) }} className={toolBtn(mode === 'borrar')} title="Clic en un nodo para borrarlo (y sus aristas)">
          Borrar
        </button>

        <div className="mx-0.5 h-4 w-px bg-zinc-200" />

        <button onClick={() => updateAttributes({ directed: !directed })} className={toolBtn(directed)} title="Aristas con flecha (dígrafo)">
          Dirigido
        </button>
        <button onClick={() => updateAttributes({ weighted: !weighted })} className={toolBtn(weighted)} title="Mostrar y editar pesos en las aristas">
          Con peso
        </button>

        <div className="mx-0.5 h-4 w-px bg-zinc-200" />

        <button onClick={reorganize} disabled={nodes.length === 0} className={`${toolBtn(false)} disabled:opacity-40`} title="Auto-organizar (layout de fuerza)">
          Reorganizar
        </button>
        <button onClick={() => updateAttributes({ nodes: [], edges: [] })} disabled={nodes.length === 0} className={`${toolBtn(false)} disabled:opacity-40`} title="Quitar todo">
          Limpiar
        </button>

        {mode === 'conectar' && (
          <span className="w-full text-xs text-blue-600">
            {pendingFrom ? 'clic en el segundo nodo' : 'clic en el primer nodo'}
          </span>
        )}
        {mode === 'agregar' && (
          <span className="w-full text-xs text-blue-600">clic en el lienzo para agregar un nodo</span>
        )}
      </div>

      <svg
        ref={svgRef}
        width={renderW}
        height={renderH}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        onPointerDown={onCanvasPointerDown}
        className={mode === 'agregar' ? 'cursor-copy' : ''}
        style={{ touchAction: 'none' }}
      >
        <defs>
          <marker id={arrowId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" />
          </marker>
        </defs>

        {/* Aristas */}
        {edges.map((edge, i) => {
          const a = nodeById(edge.from)
          const b = nodeById(edge.to)
          if (!a || !b) return null
          const pa = posOf(a)
          const pb = posOf(b)
          const dx = pb.x - pa.x
          const dy = pb.y - pa.y
          const len = Math.hypot(dx, dy) || 1
          const ux = dx / len
          const uy = dy / len
          const x1 = pa.x + ux * NODE_R
          const y1 = pa.y + uy * NODE_R
          const x2 = pb.x - ux * NODE_R
          const y2 = pb.y - uy * NODE_R
          const mx = (x1 + x2) / 2
          const my = (y1 + y2) / 2
          return (
            <g key={i} onPointerDown={(e) => { if (mode === 'borrar') { e.stopPropagation(); removeEdgeAt(i) } }}>
              {/* zona de clic ancha (invisible) para poder borrar la arista */}
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth={12}
                className={mode === 'borrar' ? 'cursor-pointer' : ''} />
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#475569" strokeWidth={1.8}
                markerEnd={directed ? `url(#${arrowId})` : undefined} />
              {weighted && (
                <g>
                  <rect x={mx - 11} y={my - 9} width={22} height={16} rx={3} fill="#ffffff" stroke="#e5e7eb" />
                  <text x={mx} y={my + 3} textAnchor="middle" fontSize="11" fill="#1e293b">{edge.weight}</text>
                </g>
              )}
            </g>
          )
        })}

        {/* Nodos */}
        {nodes.map((n) => {
          const p = posOf(n)
          const isPending = pendingFrom === n.id
          return (
            <g
              key={n.id}
              onPointerDown={(e) => onNodePointerDown(e, n)}
              onPointerMove={onNodePointerMove}
              onPointerUp={onNodePointerUp}
              className={mode === 'mover' ? 'cursor-grab active:cursor-grabbing' : mode === 'borrar' ? 'cursor-pointer' : ''}
            >
              <circle cx={p.x} cy={p.y} r={NODE_R}
                fill={isPending ? '#bfdbfe' : '#eef2ff'}
                stroke={isPending ? '#2563eb' : '#6366f1'} strokeWidth={2} />
              <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize="13" fontWeight={600} fill="#1e293b">
                {n.label}
              </text>
            </g>
          )
        })}

        {nodes.length === 0 && (
          <text x={WIDTH / 2} y={HEIGHT / 2} textAnchor="middle" fontSize="13" fill="#9ca3af">
            "+ Nodo" y haz clic aquí para empezar
          </text>
        )}
      </svg>

      {/* Lista de aristas para editar pesos (solo con peso) */}
      {weighted && edges.length > 0 && (
        <div className="grafo-toolbar mt-1 flex flex-col gap-0.5">
          {edges.map((edge, i) => {
            const a = nodeById(edge.from)
            const b = nodeById(edge.to)
            return (
              <div key={i} className="flex items-center gap-1.5 text-xs text-zinc-600">
                <span className="tabular-nums">{a?.label ?? '?'} {directed ? '→' : '—'} {b?.label ?? '?'}</span>
                <span>peso</span>
                <input
                  type="number"
                  value={edge.weight}
                  onChange={(e) => {
                    const v = e.target.value === '' ? 0 : Number(e.target.value)
                    if (!Number.isNaN(v)) setWeightAt(i, v)
                  }}
                  className="w-16 rounded border border-zinc-300 bg-white px-1 py-0.5"
                />
                <button onClick={() => removeEdgeAt(i)} title="Quitar arista"
                  className="rounded px-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700">
                  ✕
                </button>
              </div>
            )
          })}
        </div>
      )}
    </NodeViewWrapper>
  )
}

export const DiscreteGraph = Node.create({
  name: 'discreteGraph',
  group: 'block',
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      directed: { default: false },
      weighted: { default: false },
      nodes: { default: [] as GraphNode[] },
      edges: { default: [] as GraphEdge[] },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="discrete-graph"]',
        getAttrs: (el) => {
          const element = el as HTMLElement
          try {
            return {
              directed: element.getAttribute('data-directed') === 'true',
              weighted: element.getAttribute('data-weighted') === 'true',
              nodes: JSON.parse(element.getAttribute('data-nodes') ?? '[]') as GraphNode[],
              edges: JSON.parse(element.getAttribute('data-edges') ?? '[]') as GraphEdge[],
            }
          } catch {
            return { directed: false, weighted: false, nodes: [], edges: [] }
          }
        },
      },
    ]
  },

  renderHTML({ node }) {
    return [
      'div',
      {
        'data-type': 'discrete-graph',
        'data-directed': String(node.attrs.directed),
        'data-weighted': String(node.attrs.weighted),
        'data-nodes': JSON.stringify(node.attrs.nodes),
        'data-edges': JSON.stringify(node.attrs.edges),
      },
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(GraphView)
  },
})
