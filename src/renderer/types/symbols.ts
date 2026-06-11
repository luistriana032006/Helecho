export interface MathSymbol {
  id: string
  name: string   // nombre en español — usado para búsqueda
  latex: string  // notación KaTeX que se inserta
}

export interface SymbolCategory {
  id: string
  name: string
  symbols: MathSymbol[]
}
