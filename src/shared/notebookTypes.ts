export interface CuadernilloInfo {
  name: string
  path: string
  /** Fecha de creación (ms) — los cuadernillos se ordenan cronológicamente */
  createdMs: number
}

export interface MateriaInfo {
  name: string
  path: string
  /** Colección/semestre a la que pertenece (null = sin colección) */
  coleccion: string | null
  cuadernillos: CuadernilloInfo[]
}

export interface NotebookList {
  root: string
  materias: MateriaInfo[]
}

export interface SearchMatch {
  line: number
  text: string
}

export interface SearchResult {
  materia: string
  name: string
  path: string
  nameMatch: boolean
  matches: SearchMatch[]
}
