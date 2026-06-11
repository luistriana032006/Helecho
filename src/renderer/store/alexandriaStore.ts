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

interface AlexandriaState {
  history: HistoryEntry[]
  addVisit: (url: string) => void
  setTitle: (url: string, title: string) => void
  clearHistory: () => void
}

export const useAlexandriaStore = create<AlexandriaState>()(
  persist(
    (set) => ({
      history: [],

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
