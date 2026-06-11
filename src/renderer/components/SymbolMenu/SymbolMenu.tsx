import { useState, useMemo } from 'react'
import { ChevronsLeft, ChevronsRight } from 'lucide-react'
import type { Editor } from '@tiptap/react'
import katex from 'katex'
import { algebraLineal } from './symbols/algebraLineal'
import { espaciosVectoriales } from './symbols/espaciosVectoriales'
import { algebraBasica } from './symbols/algebraBasica'
import { calculo } from './symbols/calculo'
import { estadistica } from './symbols/estadistica'
import { discreta } from './symbols/discreta'
import SymbolSearch from './SymbolSearch'
import ResizeHandle from '../common/ResizeHandle'
import { useSettingsStore } from '../../store/settingsStore'
import type { MathSymbol, SymbolCategory } from '../../types/symbols'

type Tab = 'basica' | 'algebra' | 'espacios' | 'calculo' | 'estadistica' | 'discreta'

const TABS: { id: Tab; label: string; categories: SymbolCategory[] }[] = [
  { id: 'basica',      label: 'Álg. Básica',  categories: algebraBasica },
  { id: 'algebra',     label: 'Álg. Lineal',  categories: algebraLineal },
  { id: 'espacios',    label: 'Esp. Vect.',   categories: espaciosVectoriales },
  { id: 'calculo',     label: 'Cálculo',      categories: calculo },
  { id: 'estadistica', label: 'Estadística',  categories: estadistica },
  { id: 'discreta',    label: 'Discreta',     categories: discreta },
]

const ALL_CATEGORIES = TABS.flatMap((t) => t.categories)

interface Props {
  editor: Editor | null
}

function SymbolRow({ symbol, onInsert }: { symbol: MathSymbol; onInsert: (latex: string) => void }) {
  const html = katex.renderToString(symbol.latex, { throwOnError: false, displayMode: false })
  return (
    <button
      title={symbol.name}
      onMouseDown={(e) => {
        e.preventDefault()
        onInsert(symbol.latex)
      }}
      className="flex w-full items-center gap-3 px-3 py-1.5 text-left hover:bg-muted"
    >
      <span
        className="w-8 shrink-0 overflow-hidden text-center text-base text-primary"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <span className="flex-1 truncate text-xs text-foreground/80">{symbol.name}</span>
    </button>
  )
}

export default function SymbolMenu({ editor }: Props) {
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('algebra')
  const [collapsed, setCollapsed] = useState(false)
  const width = useSettingsStore((s) => s.symbolsWidth)
  const setWidth = useSettingsStore((s) => s.setSymbolsWidth)

  const insertSymbol = (latex: string) => {
    if (!editor) return
    editor.chain().focus().insertContent({ type: 'mathInline', attrs: { latex } }).run()
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    const source = q ? ALL_CATEGORIES : TABS.find((t) => t.id === activeTab)?.categories ?? []
    if (!q) return source
    return source
      .map((cat) => ({
        ...cat,
        symbols: cat.symbols.filter((s) => s.name.toLowerCase().includes(q)),
      }))
      .filter((cat) => cat.symbols.length > 0)
  }, [query, activeTab])

  if (collapsed) {
    return (
      <aside className="flex w-10 shrink-0 flex-col items-center gap-2 bg-sidebar border-l border-sidebar-border py-3 text-muted-foreground">
        <button
          onMouseDown={(e) => { e.preventDefault(); setCollapsed(false) }}
          aria-label="Expandir panel de símbolos"
          className="flex flex-col items-center gap-2 rounded p-1 hover:bg-muted hover:text-foreground transition-colors"
        >
          <ChevronsLeft className="size-3.5" aria-hidden />
        </button>
      </aside>
    )
  }

  return (
    <aside
      className="relative flex shrink-0 flex-col bg-sidebar border-l border-sidebar-border overflow-hidden"
      style={{ width }}
    >
      <ResizeHandle side="left" onDrag={(x) => setWidth(window.innerWidth - x)} />

      <div className="flex items-center justify-between px-3 py-2 border-b border-sidebar-border">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Símbolos
        </span>
        <button
          onMouseDown={(e) => { e.preventDefault(); setCollapsed(true) }}
          aria-label="Plegar panel"
          className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ChevronsRight className="size-4" aria-hidden />
        </button>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-border px-2 py-1.5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onMouseDown={(e) => { e.preventDefault(); setActiveTab(tab.id) }}
            className={`rounded-full px-2.5 py-0.5 text-xs transition-colors ${
              activeTab === tab.id
                ? 'bg-primary/15 text-primary font-medium'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <SymbolSearch value={query} onChange={setQuery} />

      <div className="flex-1 overflow-y-auto">
        {filtered.map((category) => (
          <div key={category.id} className="py-1">
            <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {category.name}
            </p>
            {category.symbols.map((symbol) => (
              <SymbolRow key={symbol.id} symbol={symbol} onInsert={insertSymbol} />
            ))}
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="px-3 py-4 text-center text-xs text-muted-foreground">
            Sin resultados para &ldquo;{query}&rdquo;
          </p>
        )}
      </div>
    </aside>
  )
}
