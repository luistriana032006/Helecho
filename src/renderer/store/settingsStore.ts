import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_UI_COLOR, DEFAULT_TEXT_COLOR } from '../lib/theme'

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
  /** Incluir los post-its al exportar el PDF del apunte */
  postitsInPdf: boolean
  zoom: number
  /** Color base de la interfaz (hex) — toda la paleta rota hacia su matiz */
  uiColor: string
  /** Color de los textos de la interfaz (hex) — blanco por defecto */
  textColor: string
  setPageMode: (mode: PageMode) => void
  setSidebarWidth: (width: number) => void
  setSymbolsWidth: (width: number) => void
  setReferenceWidth: (width: number) => void
  setAlexandriaWidth: (width: number) => void
  setReferenceLastPath: (path: string | null) => void
  setPostitsInPdf: (value: boolean) => void
  setZoom: (zoom: number) => void
  setUiColor: (hex: string) => void
  setTextColor: (hex: string) => void
  resetColors: () => void
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
      postitsInPdf: true,
      zoom: 1,
      uiColor: DEFAULT_UI_COLOR,
      textColor: DEFAULT_TEXT_COLOR,
      setPageMode: (mode) => set({ pageMode: mode }),
      setSidebarWidth: (width) => set({ sidebarWidth: clamp(width, SIDEBAR_MIN, SIDEBAR_MAX) }),
      setSymbolsWidth: (width) => set({ symbolsWidth: clamp(width, SYMBOLS_MIN, SYMBOLS_MAX) }),
      setReferenceWidth: (width) => set({ referenceWidth: clamp(width, REFERENCE_MIN, REFERENCE_MAX) }),
      setAlexandriaWidth: (width) => set({ alexandriaWidth: clamp(width, ALEXANDRIA_MIN, ALEXANDRIA_MAX) }),
      setReferenceLastPath: (path) => set({ referenceLastPath: path }),
      setPostitsInPdf: (value) => set({ postitsInPdf: value }),
      // Redondea a pasos de 10% para evitar valores como 0.7000000000000001
      setZoom: (zoom) => set({ zoom: Math.round(clamp(zoom, ZOOM_MIN, ZOOM_MAX) * 10) / 10 }),
      setUiColor: (hex) => set({ uiColor: hex }),
      setTextColor: (hex) => set({ textColor: hex }),
      resetColors: () => set({ uiColor: DEFAULT_UI_COLOR, textColor: DEFAULT_TEXT_COLOR }),
    }),
    { name: 'helecho-settings' }
  )
)
