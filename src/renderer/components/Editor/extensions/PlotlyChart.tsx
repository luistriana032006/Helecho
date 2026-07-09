import { useEffect, useRef } from 'react'
import { Node } from '@tiptap/core'
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react'
import Plotly from 'plotly.js-basic-dist-min'
import type { Data, Layout } from 'plotly.js'

// ── Modelo editable (fuente de verdad; de aquí se construyen los traces) ──
export type ChartType = 'bar' | 'line' | 'scatter' | 'pie'

export interface ChartPoint {
  x: string
  y: number
}

export interface ChartSeries {
  name: string
  points: ChartPoint[]
}

// Tamaño fijo. (El responsivo se quitó: re-renderizar + toImage al medir el
// ancho disparaba un bucle render→updateAttributes→re-medir, sobre todo dentro
// de columnas. Por eso, por ahora, las gráficas no se permiten en columnas.)
const WIDTH = 520
const HEIGHT = 360

const CHART_LABELS: Record<ChartType, string> = {
  bar: 'Barras',
  line: 'Líneas',
  scatter: 'Dispersión',
  pie: 'Pastel',
}

const PALETTE = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

function defaultSeries(): ChartSeries {
  return {
    name: 'Serie 1',
    points: [
      { x: 'A', y: 3 },
      { x: 'B', y: 7 },
      { x: 'C', y: 5 },
    ],
  }
}

/** Construye la figura de Plotly (data + layout) desde el modelo editable. */
function buildFigure(type: ChartType, title: string, series: ChartSeries[]): {
  data: Data[]
  layout: Partial<Layout>
} {
  let data: Data[]
  if (type === 'pie') {
    const s = series[0] ?? { name: '', points: [] }
    data = [
      {
        type: 'pie',
        labels: s.points.map((p) => p.x),
        values: s.points.map((p) => p.y),
        marker: { colors: PALETTE },
        textinfo: 'label+percent',
      } as Data,
    ]
  } else {
    data = series.map((s, i) => ({
      type: type === 'bar' ? 'bar' : 'scatter',
      mode: type === 'scatter' ? 'markers' : type === 'line' ? 'lines+markers' : undefined,
      name: s.name,
      x: s.points.map((p) => p.x),
      y: s.points.map((p) => p.y),
      marker: { color: PALETTE[i % PALETTE.length] },
      line: { color: PALETTE[i % PALETTE.length] },
    } as Data))
  }
  const layout: Partial<Layout> = {
    // Tamaño EXPLÍCITO: sin esto, Plotly deduce el tamaño del contenedor y en un
    // layout flex/columna lo mide mal y dibuja la gráfica gigante (desbordando
    // el recuadro). Fijándolo aquí, siempre se renderiza igual.
    width: WIDTH,
    height: HEIGHT,
    autosize: false,
    title: title ? { text: title } : undefined,
    margin: { t: title ? 44 : 16, r: 16, b: 40, l: 48 },
    showlegend: type !== 'pie' && series.length > 1,
    legend: { orientation: 'h', y: -0.18 },
    font: { family: 'inherit', size: 12 },
    paper_bgcolor: '#ffffff',
    plot_bgcolor: '#ffffff',
  }
  return { data, layout }
}

function PlotlyView({ node, updateAttributes, selected }: NodeViewProps) {
  const type = (node.attrs.chartType as ChartType) ?? 'bar'
  const title = (node.attrs.title as string) ?? ''
  const series = (node.attrs.series as ChartSeries[]) ?? []
  const png = (node.attrs.png as string) ?? ''

  const liveRef = useRef<HTMLDivElement>(null)
  // png más reciente sin re-disparar el efecto al guardarlo
  const pngRef = useRef(png)
  pngRef.current = png

  // ── Render + snapshot PNG (el PNG es lo único que sobrevive al PDF) ──
  useEffect(() => {
    const gd = liveRef.current
    if (!gd) return
    let cancelled = false
    const { data, layout } = buildFigure(type, title, series)
    // staticPlot: el gráfico NO es interactivo (sin hover/zoom/arrastre). Solo se
    // editan los datos arriba y la gráfica se genera; queda como imagen estática.
    Plotly.react(gd, data, layout, { staticPlot: true, displaylogo: false, responsive: false, displayModeBar: false })
      .then(() => Plotly.toImage(gd, { format: 'png', width: WIDTH, height: HEIGHT }))
      .then((uri) => {
        if (!cancelled && uri && uri !== pngRef.current) updateAttributes({ png: uri })
      })
      .catch(() => {
        /* render fallido (datos vacíos/inválidos): se conserva el PNG previo */
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, title, JSON.stringify(series)])

  // Limpia el gráfico de Plotly al desmontar (evita fugas de memoria)
  useEffect(() => {
    const gd = liveRef.current
    return () => {
      if (gd) Plotly.purge(gd)
    }
  }, [])

  // ── Mutaciones del modelo ───────────────────────────────────────
  const setSeries = (next: ChartSeries[]) => updateAttributes({ series: next })

  const addSeries = () =>
    setSeries([
      ...series,
      { name: `Serie ${series.length + 1}`, points: [{ x: 'A', y: 1 }] },
    ])

  const removeSeries = (si: number) => setSeries(series.filter((_, i) => i !== si))

  const setSeriesName = (si: number, name: string) =>
    setSeries(series.map((s, i) => (i === si ? { ...s, name } : s)))

  const addPoint = (si: number) =>
    setSeries(series.map((s, i) => (i === si ? { ...s, points: [...s.points, { x: '', y: 0 }] } : s)))

  const removePoint = (si: number, pi: number) =>
    setSeries(
      series.map((s, i) => (i === si ? { ...s, points: s.points.filter((_, p) => p !== pi) } : s))
    )

  const setPoint = (si: number, pi: number, patch: Partial<ChartPoint>) =>
    setSeries(
      series.map((s, i) =>
        i === si
          ? { ...s, points: s.points.map((p, j) => (j === pi ? { ...p, ...patch } : p)) }
          : s
      )
    )

  const isPie = type === 'pie'
  const editableSeries = isPie ? series.slice(0, 1) : series

  return (
    <NodeViewWrapper
      as="div"
      contentEditable={false}
      className={`plotly-chart my-3 inline-block rounded-lg border bg-white p-2 align-top select-none ${
        selected ? 'border-blue-400 ring-2 ring-blue-200' : 'border-zinc-200'
      }`}
    >
      {/* Controles — se excluyen del PDF (.plotly-toolbar) */}
      <div className="plotly-toolbar mb-1 flex flex-col gap-1.5" onPointerDown={(e) => e.stopPropagation()}>
        <div className="flex flex-wrap items-center gap-1.5">
          <select
            value={type}
            onChange={(e) => updateAttributes({ chartType: e.target.value as ChartType })}
            className="h-7 rounded border border-zinc-300 bg-white px-1 text-xs outline-none"
            title="Tipo de gráfica"
          >
            {(Object.keys(CHART_LABELS) as ChartType[]).map((t) => (
              <option key={t} value={t}>
                {CHART_LABELS[t]}
              </option>
            ))}
          </select>
          <input
            value={title}
            onChange={(e) => updateAttributes({ title: e.target.value })}
            placeholder="Título de la gráfica"
            className="h-7 flex-1 min-w-32 rounded border border-zinc-300 bg-white px-2 text-xs outline-none"
          />
          {!isPie && (
            <button
              onClick={addSeries}
              className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 hover:bg-zinc-200"
              title="Agregar otra serie de datos"
            >
              + Serie
            </button>
          )}
        </div>

        {isPie && (
          <span className="text-xs text-zinc-400">El pastel usa la primera serie (etiqueta = x, valor = y).</span>
        )}

        {/* Tabla de datos por serie */}
        <div className="flex flex-wrap gap-2">
          {editableSeries.map((s, si) => (
            <div key={si} className="rounded border border-zinc-200 bg-zinc-50 p-1.5">
              <div className="mb-1 flex items-center gap-1">
                {!isPie && (
                  <input
                    value={s.name}
                    onChange={(e) => setSeriesName(si, e.target.value)}
                    className="h-6 w-24 rounded border border-zinc-300 bg-white px-1 text-xs outline-none"
                    title="Nombre de la serie"
                  />
                )}
                {!isPie && series.length > 1 && (
                  <button
                    onClick={() => removeSeries(si)}
                    className="rounded px-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700"
                    title="Quitar serie"
                  >
                    ✕
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="flex gap-1 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                  <span className="w-20 pl-1">{isPie ? 'Etiqueta' : 'x'}</span>
                  <span className="w-16 pl-1">{isPie ? 'Valor' : 'y'}</span>
                </div>
                {s.points.map((p, pi) => (
                  <div key={pi} className="flex items-center gap-1">
                    <input
                      value={p.x}
                      onChange={(e) => setPoint(si, pi, { x: e.target.value })}
                      className="h-6 w-20 rounded border border-zinc-300 bg-white px-1 text-xs outline-none"
                    />
                    <input
                      type="number"
                      value={p.y}
                      onChange={(e) => {
                        const v = e.target.value === '' ? 0 : Number(e.target.value)
                        if (!Number.isNaN(v)) setPoint(si, pi, { y: v })
                      }}
                      className="h-6 w-16 rounded border border-zinc-300 bg-white px-1 text-xs outline-none tabular-nums"
                    />
                    <button
                      onClick={() => removePoint(si, pi)}
                      className="rounded px-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700"
                      title="Quitar fila"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addPoint(si)}
                  className="mt-0.5 rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500 hover:bg-zinc-200"
                >
                  + fila
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gráfico vivo (interactivo) — se excluye del PDF (.plotly-live) */}
      <div ref={liveRef} className="plotly-live" style={{ width: WIDTH, height: HEIGHT }} />

      {/* Snapshot para PDF/recarga: oculto en pantalla (globals.css), visible en
          el HTML del print (que no carga el CSS de la app). */}
      {png && (
        <img className="plotly-static" src={png} width={WIDTH} height={HEIGHT} alt={title || 'Gráfica'} />
      )}
    </NodeViewWrapper>
  )
}

export const PlotlyChart = Node.create({
  name: 'plotlyChart',
  group: 'block',
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      chartType: { default: 'bar' as ChartType },
      title: { default: '' },
      series: { default: [defaultSeries()] as ChartSeries[] },
      png: { default: '' },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="plotly-chart"]',
        getAttrs: (el) => {
          const element = el as HTMLElement
          try {
            return {
              chartType: (element.getAttribute('data-chart-type') as ChartType) ?? 'bar',
              title: element.getAttribute('data-title') ?? '',
              series: JSON.parse(element.getAttribute('data-series') ?? '[]') as ChartSeries[],
              png: element.getAttribute('data-png') ?? '',
            }
          } catch {
            return { chartType: 'bar', title: '', series: [defaultSeries()], png: '' }
          }
        },
      },
    ]
  },

  renderHTML({ node }) {
    return [
      'div',
      {
        'data-type': 'plotly-chart',
        'data-chart-type': String(node.attrs.chartType),
        'data-title': String(node.attrs.title),
        'data-series': JSON.stringify(node.attrs.series),
        'data-png': String(node.attrs.png),
      },
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(PlotlyView)
  },
})
