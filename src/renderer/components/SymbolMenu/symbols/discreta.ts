import type { SymbolCategory } from '../../../types/symbols'

export const discreta: SymbolCategory[] = [
  {
    id: 'disc-logica',
    name: 'Lógica proposicional',
    symbols: [
      { id: 'negacion',      name: 'negación no',            latex: '\\neg p' },
      { id: 'conjuncion',    name: 'conjunción y',           latex: 'p \\land q' },
      { id: 'disyuncion',    name: 'disyunción o',           latex: 'p \\lor q' },
      { id: 'implicacion',   name: 'implicación entonces',   latex: 'p \\Rightarrow q' },
      { id: 'bicondicional', name: 'bicondicional si y solo si', latex: 'p \\Leftrightarrow q' },
      { id: 'xor',           name: 'o exclusivo xor',        latex: 'p \\oplus q' },
      { id: 'por-tanto',     name: 'por lo tanto',           latex: '\\therefore' },
      { id: 'tautologia',    name: 'tautología verdadero',   latex: '\\top' },
      { id: 'contradiccion', name: 'contradicción falso',    latex: '\\bot' },
    ],
  },
  {
    id: 'disc-conjuntos',
    name: 'Conjuntos',
    symbols: [
      { id: 'union',        name: 'unión',                   latex: 'A \\cup B' },
      { id: 'interseccion', name: 'intersección',            latex: 'A \\cap B' },
      { id: 'diferencia',   name: 'diferencia de conjuntos', latex: 'A \\setminus B' },
      { id: 'complemento',  name: 'complemento',             latex: 'A^c' },
      { id: 'vacio',        name: 'conjunto vacío',          latex: '\\emptyset' },
      { id: 'cardinal',     name: 'cardinalidad',            latex: '|A|' },
      { id: 'potencia',     name: 'conjunto potencia',       latex: '\\mathcal{P}(A)' },
      { id: 'cartesiano',   name: 'producto cartesiano',     latex: 'A \\times B' },
      { id: 'por-extension', name: 'conjunto por comprensión', latex: '\\{x \\mid x \\in A\\}' },
    ],
  },
  {
    id: 'disc-combinatoria',
    name: 'Combinatoria',
    symbols: [
      { id: 'factorial',    name: 'factorial',               latex: 'n!' },
      { id: 'combinacion',  name: 'combinación coeficiente binomial', latex: '\\binom{n}{k}' },
      { id: 'permutacion',  name: 'permutación',             latex: 'P(n, k) = \\frac{n!}{(n-k)!}' },
      { id: 'comb-formula', name: 'fórmula de combinación',  latex: 'C(n, k) = \\frac{n!}{k!(n-k)!}' },
      { id: 'piso',         name: 'función piso',            latex: '\\lfloor x \\rfloor' },
      { id: 'techo',        name: 'función techo',           latex: '\\lceil x \\rceil' },
    ],
  },
  {
    id: 'disc-numeros',
    name: 'Teoría de números',
    symbols: [
      { id: 'naturales',    name: 'números naturales',       latex: '\\mathbb{N}' },
      { id: 'enteros',      name: 'números enteros',         latex: '\\mathbb{Z}' },
      { id: 'congruencia',  name: 'congruencia módulo n',    latex: 'a \\equiv b \\pmod{n}' },
      { id: 'divide',       name: 'divide a',                latex: 'a \\mid b' },
      { id: 'no-divide',    name: 'no divide a',             latex: 'a \\nmid b' },
      { id: 'mcd',          name: 'máximo común divisor',    latex: '\\gcd(a, b)' },
      { id: 'mod',          name: 'módulo residuo',          latex: 'a \\bmod n' },
    ],
  },
  {
    id: 'disc-grafos',
    name: 'Grafos y relaciones',
    symbols: [
      { id: 'grafo',        name: 'grafo G',                 latex: 'G = (V, E)' },
      { id: 'grado',        name: 'grado de vértice',        latex: '\\deg(v)' },
      { id: 'arista',       name: 'arista entre u y v',      latex: '\\{u, v\\} \\in E' },
      { id: 'relacion',     name: 'relación R',              latex: 'a \\, R \\, b' },
      { id: 'funcion-iny',  name: 'función inyectiva',       latex: 'f: A \\hookrightarrow B' },
      { id: 'funcion-sobre', name: 'función sobreyectiva',   latex: 'f: A \\twoheadrightarrow B' },
      { id: 'composicion',  name: 'composición de funciones', latex: 'g \\circ f' },
    ],
  },
]
