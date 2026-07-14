import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Globe, Lock, LockOpen, Plus, RotateCw, X } from 'lucide-react'
import { useAlexandriaStore, searchHistory, type TabEntry } from '../../store/alexandriaStore'
import ConnectionIndicator, { SLOW_LOAD_MS, type ConnState } from './ConnectionIndicator'
import { NightSky } from '../common/NightSky'
import { t, useT } from '../../lib/i18n'

const SEARCH_URL = 'https://www.google.com/search?q='

// target=_blank dentro de las páginas → el main pide abrir pestaña aquí.
// Registro ÚNICO a nivel de módulo: el preload no expone des-suscripción y
// este componente se monta/desmonta al cambiar de vista — registrarlo en un
// useEffect duplicaría pestañas con cada remontaje.
window.helecho.onAlexandriaOpenTab((url) =>
  useAlexandriaStore.getState().addTab(url || undefined)
)

/** URL directa si lo parece; si no, búsqueda. */
function normalizeInput(raw: string): string | null {
  const text = raw.trim()
  if (!text) return null
  if (/^https?:\/\//i.test(text)) return text
  if (!text.includes(' ') && text.includes('.')) return `https://${text}`
  return SEARCH_URL + encodeURIComponent(text)
}

/** Estado vivo del webview montado — NO se persiste (pestañas en el store) */
interface TabRuntime {
  loading: boolean
  canBack: boolean
  canForward: boolean
  error: string | null
  conn: ConnState
}

const EMPTY_RUNTIME: TabRuntime = {
  loading: false,
  canBack: false,
  canForward: false,
  error: null,
  conn: null,
}

interface TabViewProps {
  tab: TabEntry
  active: boolean
  onRuntime: (id: number, patch: Partial<TabRuntime>) => void
  registerWebview: (id: number, el: HTMLWebViewElement | null) => void
}

/** Webview de una pestaña. Vive siempre montado (cambiar de pestaña no
 *  recarga la página); las inactivas se ocultan con visibility, nunca
 *  con display:none (rompe los webviews en Electron). */
function TabView({ tab, active, onRuntime, registerWebview }: TabViewProps) {
  const ref = useRef<HTMLWebViewElement | null>(null)
  // Estado del indicador de conexión: si la carga en curso ya falló y el
  // temporizador de "carga lenta" (eventos del webview, no renders)
  const failedRef = useRef(false)
  const slowTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const id = tab.id

  // src inicial del webview, capturado UNA vez al montar: la navegación
  // posterior va por loadURL y los cambios de url del store no lo tocan.
  // Si la pestaña viene de una sesión anterior, restaura su última página.
  const srcRef = useRef<string | null>(null)
  if (srcRef.current === null) srcRef.current = tab.url || 'about:blank'

  useEffect(() => {
    const wv = ref.current
    if (!wv) return
    registerWebview(id, wv)
    const store = () => useAlexandriaStore.getState()
    const syncNav = () => onRuntime(id, { canBack: wv.canGoBack(), canForward: wv.canGoForward() })
    const onNavigate = (e: Event) => {
      const url = (e as Event & { url: string }).url
      if (url !== 'about:blank') {
        // Solo cuenta como visita si la url cambió: la restauración de la
        // pestaña (y recargar) no inflan el historial
        const current = store().tabs.find((t) => t.id === id)
        if (current && current.url !== url) store().addVisit(url)
        store().updateTab(id, { url })
      }
      syncNav()
    }
    const onTitle = (e: Event) => {
      const title = (e as Event & { title: string }).title
      store().updateTab(id, { title })
      store().setTitle(wv.getURL(), title)
    }
    const onStart = () => {
      failedRef.current = false
      if (slowTimer.current) clearTimeout(slowTimer.current)
      // Amarillo: sigue cargando pasado el umbral (did-stop-loading lo cancela)
      slowTimer.current = setTimeout(() => onRuntime(id, { conn: 'slow' }), SLOW_LOAD_MS)
      onRuntime(id, { loading: true, error: null, conn: null })
    }
    const onStop = () => {
      if (slowTimer.current) clearTimeout(slowTimer.current)
      // about:blank no cuenta como carga: la pestaña vacía queda sin estado
      const realPage = wv.getURL() !== '' && wv.getURL() !== 'about:blank'
      onRuntime(id, {
        loading: false,
        conn: failedRef.current ? 'failed' : realPage ? 'ok' : null,
      })
      syncNav()
    }
    const onFail = (e: Event) => {
      const ev = e as Event & { errorCode: number; errorDescription: string; isMainFrame: boolean }
      // -3 = navegación cancelada por otra navegación: no es un error real
      if (!ev.isMainFrame || ev.errorCode === -3) return
      failedRef.current = true
      onRuntime(id, { error: t('No se pudo cargar la página ({error})', { error: ev.errorDescription }), conn: 'failed' })
    }
    wv.addEventListener('did-navigate', onNavigate)
    wv.addEventListener('did-navigate-in-page', onNavigate)
    wv.addEventListener('page-title-updated', onTitle)
    wv.addEventListener('did-start-loading', onStart)
    wv.addEventListener('did-stop-loading', onStop)
    wv.addEventListener('did-fail-load', onFail)
    return () => {
      registerWebview(id, null)
      if (slowTimer.current) clearTimeout(slowTimer.current)
      wv.removeEventListener('did-navigate', onNavigate)
      wv.removeEventListener('did-navigate-in-page', onNavigate)
      wv.removeEventListener('page-title-updated', onTitle)
      wv.removeEventListener('did-start-loading', onStart)
      wv.removeEventListener('did-stop-loading', onStop)
      wv.removeEventListener('did-fail-load', onFail)
    }
  }, [id, onRuntime, registerWebview])

  return (
    <webview
      ref={ref}
      src={srcRef.current}
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

interface BrowserProps {
  /** Atajos F5 / Ctrl+T / Ctrl+W activos (el panel los apaga al plegarse) */
  active: boolean
}

/**
 * El navegador completo: pestañas, barra de dirección con sugerencias,
 * webviews e indicador de conexión. Las pestañas viven en alexandriaStore
 * (compartidas entre el panel del editor y el modo general, y persistentes
 * entre sesiones); el estado vivo de cada webview es local de este montaje.
 */
export default function AlexandriaBrowser({ active }: BrowserProps) {
  const tr = useT()
  const tabs = useAlexandriaStore((s) => s.tabs)
  const activeTabId = useAlexandriaStore((s) => s.activeTabId)
  const setActiveTab = useAlexandriaStore((s) => s.setActiveTab)
  const storeAddTab = useAlexandriaStore((s) => s.addTab)
  const storeCloseTab = useAlexandriaStore((s) => s.closeTab)
  const history = useAlexandriaStore((s) => s.history)
  const clearHistory = useAlexandriaStore((s) => s.clearHistory)

  const [runtime, setRuntime] = useState<Record<number, TabRuntime>>({})
  const [input, setInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selIndex, setSelIndex] = useState(-1)
  const rootRef = useRef<HTMLDivElement>(null)
  const webviews = useRef(new Map<number, HTMLWebViewElement>())

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0]
  const activeRuntime = runtime[activeTab.id] ?? EMPTY_RUNTIME
  const activeWebview = () => webviews.current.get(activeTab.id)

  const onRuntime = useCallback((id: number, patch: Partial<TabRuntime>) => {
    setRuntime((prev) => ({ ...prev, [id]: { ...(prev[id] ?? EMPTY_RUNTIME), ...patch } }))
  }, [])

  const registerWebview = useCallback((id: number, el: HTMLWebViewElement | null) => {
    if (el) webviews.current.set(id, el)
    else webviews.current.delete(id)
  }, [])

  const closeTab = (id: number) => {
    storeCloseTab(id)
    setRuntime(({ [id]: _gone, ...rest }) => rest)
  }

  // La barra de dirección refleja la pestaña activa
  useEffect(() => {
    setInput(activeTab.url)
  }, [activeTab.id, activeTab.url])

  // Atajos con el foco fuera de la página (dentro de ella los cubre el main
  // con before-input-event, ver alexandriaSecurity.ts)
  useEffect(() => {
    if (!active) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F5') {
        e.preventDefault()
        webviews.current.get(activeTab.id)?.reload()
        return
      }
      // Ctrl+T / Ctrl+W solo con el foco dentro del navegador: no robarle
      // atajos al editor
      if (!rootRef.current?.contains(document.activeElement)) return
      if (e.ctrlKey && e.key.toLowerCase() === 't') {
        e.preventDefault()
        storeAddTab()
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
    onRuntime(activeTab.id, { error: null })
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
    <div ref={rootRef} className="flex min-h-0 flex-1 flex-col">
      {/* Pestañas */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-border px-1.5 py-1">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            title={tab.title || tab.url || tr('Nueva pestaña')}
            className={`flex h-6 min-w-0 max-w-36 shrink-0 cursor-pointer items-center gap-1 rounded px-2 text-xs transition-colors ${
              tab.id === activeTab.id
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:bg-muted/60'
            }`}
          >
            <span className="truncate">{tab.title || tab.url || tr('Nueva pestaña')}</span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                closeTab(tab.id)
              }}
              aria-label={tr('Cerrar pestaña (Ctrl+W)')}
              className="flex size-3.5 shrink-0 items-center justify-center rounded-full hover:bg-foreground/10"
            >
              <X className="size-3" aria-hidden />
            </button>
          </div>
        ))}
        <button
          onClick={() => storeAddTab()}
          aria-label={tr('Nueva pestaña (Ctrl+T)')}
          title={tr('Nueva pestaña (Ctrl+T)')}
          className="flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Plus className="size-3.5" aria-hidden />
        </button>
      </div>

      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border">
        <button
          onClick={() => activeWebview()?.goBack()}
          disabled={!activeRuntime.canBack}
          aria-label={tr('Atrás')}
          className={navBtn}
        >
          <ArrowLeft className="size-4" aria-hidden />
        </button>
        <button
          onClick={() => activeWebview()?.goForward()}
          disabled={!activeRuntime.canForward}
          aria-label={tr('Adelante')}
          className={navBtn}
        >
          <ArrowRight className="size-4" aria-hidden />
        </button>
        <button
          onClick={() => (activeRuntime.loading ? activeWebview()?.stop() : activeWebview()?.reload())}
          disabled={!activeTab.url}
          aria-label={tr(activeRuntime.loading ? 'Detener' : 'Recargar (F5)')}
          title={tr(activeRuntime.loading ? 'Detener' : 'Recargar (F5)')}
          className={navBtn}
        >
          {activeRuntime.loading ? <X className="size-4" aria-hidden /> : <RotateCw className="size-4" aria-hidden />}
        </button>
        <div className="relative min-w-0 flex-1">
          <div className="flex h-7 items-center gap-1.5 rounded border border-border bg-background px-2 focus-within:border-primary">
            {/* Candado: estado de cifrado de la página actual (los certificados
                inválidos los bloquea Chromium solo y la carga falla) */}
            {activeTab.url && (
              activeTab.url.startsWith('https://') ? (
                <span title={tr('Conexión segura (HTTPS, cifrada)')}>
                  <Lock className="size-3 shrink-0 text-emerald-600" aria-label={tr('Conexión segura')} />
                </span>
              ) : (
                <span title={tr('No seguro: la conexión no está cifrada (HTTP)')}>
                  <LockOpen className="size-3 shrink-0 text-amber-600" aria-label={tr('Conexión no segura')} />
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
              placeholder={tr('Dirección o búsqueda…')}
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
                {tr('Borrar historial')}
              </button>
            </div>
          )}
        </div>
        <ConnectionIndicator conn={activeRuntime.conn} />
      </div>

      {activeRuntime.error && (
        <p className="border-b border-border bg-red-50 px-3 py-1.5 text-xs text-red-600">
          {activeRuntime.error}
        </p>
      )}

      <div className="relative flex-1 bg-white">
        {tabs.map((tab) => (
          <TabView
            key={tab.id}
            tab={tab}
            active={tab.id === activeTab.id}
            onRuntime={onRuntime}
            registerWebview={registerWebview}
          />
        ))}
        {!activeTab.url && !activeRuntime.loading && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {/* Escena nocturna: vía láctea + estrellas + fugaces + montañas */}
            <NightSky />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-foreground/70" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.6)' }}>
              <Globe className="size-8 opacity-60" aria-hidden />
              <p className="px-6 text-center text-xs">
                {tr('Escribe una dirección o un término de búsqueda arriba')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
