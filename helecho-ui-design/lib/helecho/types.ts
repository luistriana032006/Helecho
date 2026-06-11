export type Semester = string // e.g. "2026-1"

export interface Notebook {
  id: string
  name: string
  createdAt: string // ISO
  updatedAt?: string // ISO, last edited
  /** Lines of plain text content, used for mock search */
  lines?: string[]
}

export interface Subject {
  id: string
  name: string
  semester?: Semester // undefined => "Sin colección"
  notebooks: Notebook[]
}

export interface SearchHit {
  notebookId: string
  notebookName: string
  subjectName: string
  matches: { line: number; text: string }[]
}

export interface MathSymbol {
  symbol: string
  name: string
}

export interface SymbolCategory {
  category: string
  symbols: MathSymbol[]
}

export interface SymbolTab {
  id: string
  label: string
  categories: SymbolCategory[]
}

export type SheetMode = "strict" | "fluid"

export type PlotType =
  | "recta"
  | "parabola"
  | "cubica"
  | "raiz"
  | "inversa"
  | "seno"
  | "coseno"
  | "exponencial"

export interface PlotFunction {
  id: string
  type: PlotType
  a: number
  b: number
  c: number
  domainFrom: number
  domainTo: number
  openLeft: boolean
  openRight: boolean
  color: string
  label: string
}
