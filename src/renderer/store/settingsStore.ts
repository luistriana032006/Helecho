import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type PageMode = 'estricta' | 'fluido'

// Límites de los paneles redimensionables
export const SIDEBAR_MIN = 180
export const SIDEBAR_MAX = 420
export const SYMBOLS_MIN = 208
export const SYMBOLS_MAX = 480

// Límites de zoom del previsualizador
export const ZOOM_MIN = 0.5
export const ZOOM_MAX = 2

// Límites del panel de referencia
export const REFERENCE_MIN = 280
export const REFERENCE_MAX = 800

// Límites del panel Alexandria (navegador)
export const ALEXANDRIA_MIN = 300
export const ALEXANDRIA_MAX = 800

interface SettingsState {
  pageMode: PageMode
  sidebarWidth: number
  symbolsWidth: number
  referenceWidth: number
  alexandriaWidth: number
  /** Última ruta abierta en el panel de referencia (se restaura al expandir) */
  referenceLastPath: string | null
  zoom: number
  setPageMode: (mode: PageMode) => void
  setSidebarWidth: (width: number) => void
  setSymbolsWidth: (width: number) => void
  setReferenceWidth: (width: number) => void
  setAlexandriaWidth: (width: number) => void
  setReferenceLastPath: (path: string | null) => void
  setZoom: (zoom: number) => void
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      pageMode: 'estricta',
      sidebarWidth: 240,
      symbolsWidth: 256,
      referenceWidth: 380,
      alexandriaWidth: 420,
      referenceLastPath: null,
      zoom: 1,
      setPageMode: (mode) => set({ pageMode: mode }),
      setSidebarWidth: (width) => set({ sidebarWidth: clamp(width, SIDEBAR_MIN, SIDEBAR_MAX) }),
      setSymbolsWidth: (width) => set({ symbolsWidth: clamp(width, SYMBOLS_MIN, SYMBOLS_MAX) }),
      setReferenceWidth: (width) => set({ referenceWidth: clamp(width, REFERENCE_MIN, REFERENCE_MAX) }),
      setAlexandriaWidth: (width) => set({ alexandriaWidth: clamp(width, ALEXANDRIA_MIN, ALEXANDRIA_MAX) }),
      setReferenceLastPath: (path) => set({ referenceLastPath: path }),
      // Redondea a pasos de 10% para evitar valores como 0.7000000000000001
      setZoom: (zoom) => set({ zoom: Math.round(clamp(zoom, ZOOM_MIN, ZOOM_MAX) * 10) / 10 }),
    }),
    { name: 'helecho-settings' }
  )
)
