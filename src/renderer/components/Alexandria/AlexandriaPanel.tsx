import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ChevronsLeft, Globe, Lock, LockOpen, Plus, RotateCw, X } from 'lucide-react'
import { useSettingsStore } from '../../store/settingsStore'
import { useAlexandriaStore, searchHistory } from '../../store/alexandriaStore'
import ResizeHandle from '../common/ResizeHandle'

const SEARCH_URL = 'https://www.google.com/search?q='

/** URL directa si lo parece; si no, búsqueda. */
function normalizeInput(raw: string): string | null {
  const text = raw.trim()
  if (!text) return null
  if (/^https?:\/\//i.test(text)) return text
  if (!text.includes(' ') && text.includes('.')) return `https://${text}`
  return SEARCH_URL + encodeURIComponent(text)
}

interface TabState {
  id: number
  /** src inicial del webview — NO cambia; la navegación posterior va por loadURL */
  src: string
  url: string
  title: string
  loading: boolean
  canBack: boolean
  canForward: boolean
  error: string | null
}

let nextTabId = 1

function createTab(src = 'about:blank'): TabState {
  return {
    id: nextTabId++,
    src,
    url: src === 'about:blank' ? '' : src,
    title: '',
    loading: false,
    canBack: false,
    canForward: false,
    error: null,
  }
}

interface TabViewProps {
  tab: TabState
  active: boolean
  onUpdate: (id: number, patch: Partial<TabState>) => void
  registerWebview: (id: number, el: HTMLWebViewElement | null) => void
}

/** Webview de una pestaña. Vive siempre montado (cambiar de pestaña no
 *  recarga la página); las inactivas se ocultan con visibility, nunca
 *  con display:none (rompe los webviews en Electron). */
function TabView({ tab, active, onUpdate, registerWebview }: TabViewProps) {
  const ref = useRef<HTMLWebViewElement | null>(null)
  const id = tab.id

  useEffect(() => {
    const wv = ref.current
    if (!wv) return
    registerWebview(id, wv)
    const syncNav = () => onUpdate(id, { canBack: wv.canGoBack(), canForward: wv.canGoForward() })
    const onNavigate = (e: Event) => {
      const url = (e as Event & { url: string }).url
      if (url !== 'about:blank') {
        onUpdate(id, { url })
        useAlexandriaStore.getState().addVisit(url)
      }
      syncNav()
    }
    const onTitle = (e: Event) => {
      const title = (e as Event & { title: string }).title
      onUpdate(id, { title })
      useAlexandriaStore.getState().setTitle(wv.getURL(), title)
    }
    const onStart = () => onUpdate(id, { loading: true, error: null })
    const onStop = () => {
      onUpdate(id, { loading: false })
      syncNav()
    }
    const onFail = (e: Event) => {
      const ev = e as Event & { errorCode: number; errorDescription: string; isMainFrame: boolean }
      // -3 = navegación cancelada por otra navegación: no es un error real
      if (!ev.isMainFrame || ev.errorCode === -3) return
      onUpdate(id, { error: `No se pudo cargar la página (${ev.errorDescription})` })
    }
    wv.addEventListener('did-navigate', onNavigate)
    wv.addEventListener('did-navigate-in-page', onNavigate)
    wv.addEventListener('page-title-updated', onTitle)
    wv.addEventListener('did-start-loading', onStart)
    wv.addEventListener('did-stop-loading', onStop)
    wv.addEventListener('did-fail-load', onFail)
    return () => {
      registerWebview(id, null)
      wv.removeEventListener('did-navigate', onNavigate)
      wv.removeEventListener('did-navigate-in-page', onNavigate)
      wv.removeEventListener('page-title-updated', onTitle)
      wv.removeEventListener('did-start-loading', onStart)
      wv.removeEventListener('did-stop-loading', onStop)
      wv.removeEventListener('did-fail-load', onFail)
    }
  }, [id, onUpdate, registerWebview])

  return (
    <webview
      ref={ref}
      src={tab.src}
      partition="persist:alexandria"
      // react-dom no conoce 'allowpopups' y OMITE atributos desconocidos con
      // valor booleano: debe ir como string o el webview bloquea todos los
      // popups en silencio (sin allowpopups, target=_blank no hace nada)
      allowpopups={'true' as unknown as boolean}
      className="absolute inset-0 h-full w-full"
      style={active ? undefined : { visibility: 'hidden' }}
    />
  )
}

const navBtn =
  'flex size-7 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent'

export default function AlexandriaPanel() {
  const [collapsed, setCollapsed] = useState(true)
  const [tabs, setTabs] = useState<TabState[]>(() => [createTab()])
  const [activeId, setActiveId] = useState<number | null>(null)
  const [input, setInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selIndex, setSelIndex] = useState(-1)
  const history = useAlexandriaStore((s) => s.history)
  const clearHistory = useAlexandriaStore((s) => s.clearHistory)
  const panelRef = useRef<HTMLElement>(null)
  const webviews = useRef(new Map<number, HTMLWebViewElement>())
  const width = useSettingsStore((s) => s.alexandriaWidth)
  const setWidth = useSettingsStore((s) => s.setAlexandriaWidth)

  const activeTab = tabs.find((t) => t.id === activeId) ?? tabs[0]
  const activeWebview = () => webviews.current.get(activeTab.id)

  const onUpdate = useCallback((id: number, patch: Partial<TabState>) => {
    setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  }, [])

  const registerWebview = useCallback((id: number, el: HTMLWebViewElement | null) => {
    if (el) webviews.current.set(id, el)
    else webviews.current.delete(id)
  }, [])

  const addTab = useCallback((url?: string) => {
    const tab = createTab(url ?? 'about:blank')
    setTabs((prev) => [...prev, tab])
    setActiveId(tab.id)
    setCollapsed(false)
  }, [])

  const closeTab = (id: number) => {
    const idx = tabs.findIndex((t) => t.id === id)
    const remaining = tabs.filter((t) => t.id !== id)
    if (remaining.length === 0) {
      const tab = createTab()
      setTabs([tab])
      setActiveId(tab.id)
      return
    }
    setTabs(remaining)
    if (activeTab.id === id) setActiveId(remaining[Math.max(0, idx - 1)].id)
  }

  // La barra de dirección refleja la pestaña activa
  useEffect(() => {
    setInput(activeTab.url)
  }, [activeTab.id, activeTab.url])

  // target=_blank dentro de las páginas → el main pide abrir pestaña aquí
  const addTabRef = useRef(addTab)
  addTabRef.current = addTab
  useEffect(() => {
    window.helecho.onAlexandriaOpenTab((url) => addTabRef.current(url || undefined))
  }, [])

  // Atajos con el foco fuera de la página (dentro de ella los cubre el main
  // con before-input-event, ver alexandriaSecurity.ts)
  useEffect(() => {
    if (collapsed) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F5') {
        e.preventDefault()
        webviews.current.get(activeTab.id)?.reload()
        return
      }
      // Ctrl+T / Ctrl+W solo con el foco dentro del panel: no robarle
      // atajos al editor
      if (!panelRef.current?.contains(document.activeElement)) return
      if (e.ctrlKey && e.key.toLowerCase() === 't') {
        e.preventDefault()
        addTab()
      } else if (e.ctrlKey && e.key.toLowerCase() === 'w') {
        e.preventDefault()
        closeTab(activeTab.id)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })

  const suggestions = showSuggestions ? searchHistory(history, input) : []

  const navigateTo = (url: string) => {
    const wv = activeWebview()
    if (!wv) return
    setShowSuggestions(false)
    setSelIndex(-1)
    setInput(url)
    onUpdate(activeTab.id, { error: null })
    // El fallo lo reporta did-fail-load; el catch evita el rechazo sin manejar
    wv.loadURL(url).catch(() => undefined)
  }

  const go = () => {
    const chosen = selIndex >= 0 ? suggestions[selIndex] : undefined
    const url = chosen ? chosen.url : normalizeInput(input)
    if (url) navigateTo(url)
  }

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      go()
    } else if (e.key === 'ArrowDown' && suggestions.length > 0) {
      e.preventDefault()
      setSelIndex((i) => (i + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp' && suggestions.length > 0) {
      e.preventDefault()
      setSelIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1))
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setSelIndex(-1)
    }
  }

  return (
    <>
      {collapsed && (
        <aside className="flex w-10 shrink-0 flex-col items-center gap-2 bg-sidebar border-r border-sidebar-border py-3 text-muted-foreground">
          <button
            onClick={() => setCollapsed(false)}
            aria-label="Expandir Alexandria"
            title="Alexandria — navegador"
            className="flex flex-col items-center gap-2 rounded p-1 hover:bg-muted hover:text-foreground transition-colors"
          >
            <Globe className="size-4" aria-hidden />
          </button>
        </aside>
      )}

      {/* Al plegar NO se desmonta: las páginas siguen cargadas al volver.
          visibility + width 0 (display:none rompe los webviews en Electron) */}
      <aside
        ref={panelRef}
        className="relative flex shrink-0 flex-col bg-sidebar border-r border-sidebar-border overflow-hidden"
        style={collapsed ? { width: 0, visibility: 'hidden', borderWidth: 0 } : { width }}
      >
        <ResizeHandle
          side="right"
          onDrag={(x) => setWidth(x - (panelRef.current?.getBoundingClientRect().left ?? 0))}
        />

        <div className="flex items-center gap-2 px-3 py-2 border-b border-sidebar-border">
          <Globe className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
          <span className="flex-1 truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {activeTab.title || 'Alexandria'}
          </span>
          <button
            onClick={() => setCollapsed(true)}
            aria-label="Plegar Alexandria"
            className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ChevronsLeft className="size-4" aria-hidden />
          </button>
        </div>

        {/* Pestañas */}
        <div className="flex items-center gap-1 overflow-x-auto border-b border-border px-1.5 py-1">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => setActiveId(tab.id)}
              title={tab.title || tab.url || 'Nueva pestaña'}
              className={`flex h-6 min-w-0 max-w-36 shrink-0 cursor-pointer items-center gap-1 rounded px-2 text-xs transition-colors ${
                tab.id === activeTab.id
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:bg-muted/60'
              }`}
            >
              <span className="truncate">{tab.title || tab.url || 'Nueva pestaña'}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  closeTab(tab.id)
                }}
                aria-label="Cerrar pestaña (Ctrl+W)"
                className="flex size-3.5 shrink-0 items-center justify-center rounded-full hover:bg-foreground/10"
              >
                <X className="size-3" aria-hidden />
              </button>
            </div>
          ))}
          <button
            onClick={() => addTab()}
            aria-label="Nueva pestaña (Ctrl+T)"
            title="Nueva pestaña (Ctrl+T)"
            className="flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Plus className="size-3.5" aria-hidden />
          </button>
        </div>

        <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border">
          <button
            onClick={() => activeWebview()?.goBack()}
            disabled={!activeTab.canBack}
            aria-label="Atrás"
            className={navBtn}
          >
            <ArrowLeft className="size-4" aria-hidden />
          </button>
          <button
            onClick={() => activeWebview()?.goForward()}
            disabled={!activeTab.canForward}
            aria-label="Adelante"
            className={navBtn}
          >
            <ArrowRight className="size-4" aria-hidden />
          </button>
          <button
            onClick={() => (activeTab.loading ? activeWebview()?.stop() : activeWebview()?.reload())}
            disabled={!activeTab.url}
            aria-label={activeTab.loading ? 'Detener' : 'Recargar (F5)'}
            title={activeTab.loading ? 'Detener' : 'Recargar (F5)'}
            className={navBtn}
          >
            {activeTab.loading ? <X className="size-4" aria-hidden /> : <RotateCw className="size-4" aria-hidden />}
          </button>
          <div className="relative min-w-0 flex-1">
            <div className="flex h-7 items-center gap-1.5 rounded border border-border bg-background px-2 focus-within:border-primary">
              {/* Candado: estado de cifrado de la página actual (los certificados
                  inválidos los bloquea Chromium solo y la carga falla) */}
              {activeTab.url && (
                activeTab.url.startsWith('https://') ? (
                  <span title="Conexión segura (HTTPS, cifrada)">
                    <Lock className="size-3 shrink-0 text-emerald-600" aria-label="Conexión segura" />
                  </span>
                ) : (
                  <span title="No seguro: la conexión no está cifrada (HTTP)">
                    <LockOpen className="size-3 shrink-0 text-amber-600" aria-label="Conexión no segura" />
                  </span>
                )
              )}
              <input
                value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                  setShowSuggestions(true)
                  setSelIndex(-1)
                }}
                onKeyDown={onInputKeyDown}
                onFocus={(e) => e.target.select()}
                onBlur={() => {
                  setShowSuggestions(false)
                  setSelIndex(-1)
                }}
                placeholder="Dirección o búsqueda…"
                spellCheck={false}
                className="h-full min-w-0 flex-1 bg-transparent text-xs outline-none"
              />
            </div>

            {/* Sugerencias del historial — onMouseDown y no onClick: el blur
                del input cerraría la lista antes de que llegue el click */}
            {suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded border border-border bg-background shadow-lg">
                {suggestions.map((s, i) => (
                  <button
                    key={s.url}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      navigateTo(s.url)
                    }}
                    onMouseEnter={() => setSelIndex(i)}
                    className={`flex w-full flex-col items-start gap-0 px-2.5 py-1.5 text-left ${
                      i === selIndex ? 'bg-muted' : ''
                    }`}
                  >
                    {s.title && <span className="w-full truncate text-xs text-foreground">{s.title}</span>}
                    <span className="w-full truncate text-[11px] text-muted-foreground">{s.url}</span>
                  </button>
                ))}
                <button
                  onMouseDown={(e) => {
                    e.preventDefault()
                    clearHistory()
                    setShowSuggestions(false)
                  }}
                  className="w-full border-t border-border px-2.5 py-1 text-left text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  Borrar historial
                </button>
              </div>
            )}
          </div>
        </div>

        {activeTab.error && (
          <p className="border-b border-border bg-red-50 px-3 py-1.5 text-xs text-red-600">
            {activeTab.error}
          </p>
        )}

        <div className="relative flex-1 bg-white">
          {tabs.map((tab) => (
            <TabView
              key={tab.id}
              tab={tab}
              active={tab.id === activeTab.id}
              onUpdate={onUpdate}
              registerWebview={registerWebview}
            />
          ))}
          {!activeTab.url && !activeTab.loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-sidebar text-muted-foreground pointer-events-none">
              <Globe className="size-8 opacity-40" aria-hidden />
              <p className="px-6 text-center text-xs">
                Escribe una dirección o un término de búsqueda arriba
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
