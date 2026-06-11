"use client"

import { useMemo, useState } from "react"
import { ChevronsRight } from "lucide-react"
import { SYMBOL_TABS } from "@/lib/helecho/data"

interface SymbolMenuProps {
  onInsertSymbol: (symbol: string) => void
  onCollapse: () => void
}

export function SymbolMenu({ onInsertSymbol, onCollapse }: SymbolMenuProps) {
  const [activeTab, setActiveTab] = useState(SYMBOL_TABS[0].id)
  const [query, setQuery] = useState("")

  const tab = SYMBOL_TABS.find((t) => t.id === activeTab) ?? SYMBOL_TABS[0]

  const categories = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return tab.categories
    return tab.categories
      .map((cat) => ({
        ...cat,
        symbols: cat.symbols.filter((s) => s.name.toLowerCase().includes(q) || s.symbol.includes(q)),
      }))
      .filter((cat) => cat.symbols.length > 0)
  }, [tab, query])

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Símbolos</span>
        <button
          type="button"
          onClick={onCollapse}
          aria-label="Plegar panel"
          className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ChevronsRight className="size-4" aria-hidden />
        </button>
      </div>

      <div className="flex border-b border-border">
        {SYMBOL_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 px-2 py-2 text-xs ${
              t.id === activeTab ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="border-b border-border p-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar símbolo…"
          className="h-7 w-full rounded border border-input bg-background px-2 text-xs outline-none placeholder:text-muted-foreground focus:border-ring"
        />
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {categories.map((cat) => (
          <div key={cat.category} className="mb-2">
            <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {cat.category}
            </p>
            {cat.symbols.map((s) => (
              <button
                key={s.symbol + s.name}
                type="button"
                onClick={() => onInsertSymbol(s.symbol)}
                className="flex w-full items-center gap-3 px-3 py-1.5 text-left hover:bg-muted"
              >
                <span className="w-8 shrink-0 font-mono text-base text-primary">{s.symbol}</span>
                <span className="text-xs text-foreground/80">{s.name}</span>
              </button>
            ))}
          </div>
        ))}
        {categories.length === 0 && (
          <p className="px-3 py-4 text-center text-xs text-muted-foreground">Sin resultados.</p>
        )}
      </div>
    </div>
  )
}
