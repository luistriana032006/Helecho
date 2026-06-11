import type { SymbolCategory } from '../../../types/symbols'

export const algebraBasica: SymbolCategory[] = [
  {
    id: 'bas-operaciones',
    name: 'Operaciones',
    symbols: [
      { id: 'fraccion',     name: 'fracción',                latex: '\\frac{a}{b}' },
      { id: 'potencia',     name: 'potencia exponente',      latex: 'x^n' },
      { id: 'raiz',         name: 'raíz cuadrada',           latex: '\\sqrt{x}' },
      { id: 'raiz-n',       name: 'raíz n-ésima',            latex: '\\sqrt[n]{x}' },
      { id: 'valor-abs',    name: 'valor absoluto',          latex: '|x|' },
      { id: 'mas-menos',    name: 'más menos',               latex: '\\pm' },
      { id: 'por',          name: 'multiplicación por',      latex: '\\cdot' },
      { id: 'division',     name: 'división',                latex: 'a \\div b' },
    ],
  },
  {
    id: 'bas-ecuaciones',
    name: 'Ecuaciones',
    symbols: [
      { id: 'cuadratica',   name: 'fórmula cuadrática general', latex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}' },
      { id: 'ec-cuadratica', name: 'ecuación cuadrática',    latex: 'ax^2 + bx + c = 0' },
      { id: 'sub-1',        name: 'x sub 1',                 latex: 'x_1' },
      { id: 'sub-2',        name: 'x sub 2',                 latex: 'x_2' },
      { id: 'binomio-cuad', name: 'binomio al cuadrado',     latex: '(a + b)^2 = a^2 + 2ab + b^2' },
      { id: 'dif-cuadrados', name: 'diferencia de cuadrados', latex: 'a^2 - b^2 = (a+b)(a-b)' },
      { id: 'recta',        name: 'ecuación de la recta',    latex: 'y = mx + b' },
      { id: 'pendiente',    name: 'pendiente',               latex: 'm = \\frac{y_2 - y_1}{x_2 - x_1}' },
    ],
  },
  {
    id: 'bas-funciones',
    name: 'Funciones',
    symbols: [
      { id: 'funcion',      name: 'función de x',            latex: 'f(x)' },
      { id: 'fun-flecha',   name: 'función de A en B',       latex: 'f: A \\to B' },
      { id: 'fun-inversa',  name: 'función inversa',         latex: 'f^{-1}(x)' },
      { id: 'logaritmo',    name: 'logaritmo base b',        latex: '\\log_b(x)' },
      { id: 'log-natural',  name: 'logaritmo natural',       latex: '\\ln(x)' },
      { id: 'exponencial',  name: 'exponencial',             latex: 'e^x' },
      { id: 'dominio',      name: 'dominio de f',            latex: '\\text{Dom}(f)' },
      { id: 'rango-f',      name: 'rango recorrido de f',    latex: '\\text{Ran}(f)' },
    ],
  },
  {
    id: 'bas-numeros',
    name: 'Conjuntos numéricos e intervalos',
    symbols: [
      { id: 'naturales',    name: 'números naturales',       latex: '\\mathbb{N}' },
      { id: 'enteros',      name: 'números enteros',         latex: '\\mathbb{Z}' },
      { id: 'racionales',   name: 'números racionales',      latex: '\\mathbb{Q}' },
      { id: 'reales',       name: 'números reales',          latex: '\\mathbb{R}' },
      { id: 'int-cerrado',  name: 'intervalo cerrado',       latex: '[a, b]' },
      { id: 'int-abierto',  name: 'intervalo abierto',       latex: '(a, b)' },
      { id: 'int-infinito', name: 'intervalo al infinito',   latex: '[a, \\infty)' },
    ],
  },
]
