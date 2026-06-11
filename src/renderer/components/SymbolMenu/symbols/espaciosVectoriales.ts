import type { SymbolCategory } from '../../../types/symbols'

export const espaciosVectoriales: SymbolCategory[] = [
  {
    id: 'espacios',
    name: 'Espacios vectoriales',
    symbols: [
      { id: 'Rn',         name: 'espacio n-dimensional',  latex: '\\mathbb{R}^n' },
      { id: 'Rm',         name: 'espacio m-dimensional',  latex: '\\mathbb{R}^m' },
      { id: 'Rmn',        name: 'matrices m por n',       latex: '\\mathbb{R}^{m \\times n}' },
      { id: 'subespacio', name: 'subespacio W en V',      latex: 'W \\subseteq V' },
      { id: 'span',       name: 'espacio generado span',  latex: '\\text{span}\\{v_1,\\ldots,v_n\\}' },
      { id: 'base',       name: 'base',                   latex: '\\mathcal{B}' },
      { id: 'dim',        name: 'dimensión',              latex: '\\dim(V)' },
      { id: 'nulidad',    name: 'nulidad',                latex: '\\text{nul}(A)' },
    ],
  },
  {
    id: 'transformaciones',
    name: 'Transformaciones lineales',
    symbols: [
      { id: 'transf',   name: 'transformación lineal T',  latex: 'T: V \\to W' },
      { id: 'imagen',   name: 'imagen de T',              latex: '\\text{Im}(T)' },
      { id: 'nucleo',   name: 'núcleo kernel de T',       latex: '\\ker(T)' },
      { id: 'transf-v', name: 'imagen de vector',         latex: 'T(\\vec{v})' },
      { id: 'comp',     name: 'composición T con S',      latex: 'T \\circ S' },
    ],
  },
  {
    id: 'eigens',
    name: 'Valores y vectores propios',
    symbols: [
      { id: 'lambda',   name: 'valor propio lambda',       latex: '\\lambda' },
      { id: 'eigenvec', name: 'vector propio',             latex: '\\vec{v}_\\lambda' },
      { id: 'ec-car',   name: 'ecuación característica',   latex: '\\det(A - \\lambda I) = 0' },
      { id: 'pol-car',  name: 'polinomio característico',  latex: 'p(\\lambda)' },
      { id: 'diag',     name: 'diagonalizable A=PDP inv',  latex: 'A = PDP^{-1}' },
    ],
  },
]
