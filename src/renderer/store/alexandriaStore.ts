import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** Tope del historial: las visitas más viejas se descartan solas */
const HISTORY_MAX = 500

export interface HistoryEntry {
  url: string
  title: string
  /** epoch ms de la última visita */
  lastVisit: number
  visits: number
}

/** Pestaña compartida entre el panel del editor y el modo general
 *  (lo que se persiste; loading/error/conn son runtime del webview montado) */
export interface TabEntry {
  id: number
  url: string
  title: string
}

// Ids monotónicos dentro de la sesión (no se reusa el id de una pestaña
// cerrada: el estado runtime del navegador está indexado por id). Arranca
// después del mayor id persistido.
let nextTabId: number | null = null
const newTabId = (tabs: TabEntry[]): number => {
  if (nextTabId === null) nextTabId = tabs.reduce((max, t) => Math.max(max, t.id), 0) + 1
  return nextTabId++
}

interface AlexandriaState {
  history: HistoryEntry[]
  tabs: TabEntry[]
  activeTabId: number
  addVisit: (url: string) => void
  setTitle: (url: string, title: string) => void
  clearHistory: () => void
  addTab: (url?: string) => void
  closeTab: (id: number) => void
  setActiveTab: (id: number) => void
  updateTab: (id: number, patch: Partial<Omit<TabEntry, 'id'>>) => void
}

export const useAlexandriaStore = create<AlexandriaState>()(
  persist(
    (set) => ({
      history: [],
      tabs: [{ id: 1, url: '', title: '' }],
      activeTabId: 1,

      addVisit: (url) =>
        set((state) => {
          const existing = state.history.find((h) => h.url === url)
          const entry: HistoryEntry = existing
            ? { ...existing, visits: existing.visits + 1, lastVisit: Date.now() }
            : { url, title: '', lastVisit: Date.now(), visits: 1 }
          return {
            history: [entry, ...state.history.filter((h) => h.url !== url)].slice(0, HISTORY_MAX),
          }
        }),

      setTitle: (url, title) =>
        set((state) => ({
          history: state.history.map((h) => (h.url === url ? { ...h, title } : h)),
        })),

      clearHistory: () => set({ history: [] }),

      addTab: (url) =>
        set((state) => {
          const tab: TabEntry = { id: newTabId(state.tabs), url: url ?? '', title: '' }
          return { tabs: [...state.tabs, tab], activeTabId: tab.id }
        }),

      closeTab: (id) =>
        set((state) => {
          const idx = state.tabs.findIndex((t) => t.id === id)
          const remaining = state.tabs.filter((t) => t.id !== id)
          // Nunca quedan cero pestañas: la última se reemplaza por una vacía
          if (remaining.length === 0) {
            const tab: TabEntry = { id: newTabId(state.tabs), url: '', title: '' }
            return { tabs: [tab], activeTabId: tab.id }
          }
          if (state.activeTabId !== id) return { tabs: remaining }
          return { tabs: remaining, activeTabId: remaining[Math.max(0, idx - 1)].id }
        }),

      setActiveTab: (id) => set({ activeTabId: id }),

      updateTab: (id, patch) =>
        set((state) => ({
          tabs: state.tabs.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),
    }),
    { name: 'helecho-alexandria' }
  )
)

/** Mejores coincidencias del historial para lo escrito en la barra. */
export function searchHistory(history: HistoryEntry[], query: string, limit = 6): HistoryEntry[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return history
    .filter((h) => h.url.toLowerCase().includes(q) || h.title.toLowerCase().includes(q))
    .sort((a, b) => b.visits - a.visits || b.lastVisit - a.lastVisit)
    .slice(0, limit)
}
