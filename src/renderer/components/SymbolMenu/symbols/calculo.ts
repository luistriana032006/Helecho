import type { SymbolCategory } from '../../../types/symbols'

export const calculo: SymbolCategory[] = [
  {
    id: 'calc-limites',
    name: 'Límites',
    symbols: [
      { id: 'limite',      name: 'límite',                  latex: '\\lim_{x \\to a} f(x)' },
      { id: 'lim-izq',     name: 'límite lateral izquierdo', latex: '\\lim_{x \\to a^-} f(x)' },
      { id: 'lim-der',     name: 'límite lateral derecho',   latex: '\\lim_{x \\to a^+} f(x)' },
      { id: 'lim-inf',     name: 'límite al infinito',       latex: '\\lim_{x \\to \\infty} f(x)' },
      { id: 'infinito',    name: 'infinito',                 latex: '\\infty' },
      { id: 'tiende',      name: 'tiende a',                 latex: 'x \\to a' },
      { id: 'continuidad', name: 'continuidad en a',         latex: '\\lim_{x \\to a} f(x) = f(a)' },
    ],
  },
  {
    id: 'calc-derivadas',
    name: 'Derivadas',
    symbols: [
      { id: 'der-prima',    name: 'derivada f prima',        latex: "f'(x)" },
      { id: 'der-leibniz',  name: 'derivada dy dx leibniz',  latex: '\\frac{dy}{dx}' },
      { id: 'der-segunda',  name: 'segunda derivada',        latex: "f''(x)" },
      { id: 'der-n',        name: 'derivada n-ésima',        latex: '\\frac{d^n y}{dx^n}' },
      { id: 'der-parcial',  name: 'derivada parcial',        latex: '\\frac{\\partial f}{\\partial x}' },
      { id: 'gradiente',    name: 'gradiente nabla',         latex: '\\nabla f' },
      { id: 'diferencial',  name: 'diferencial dx',          latex: 'dx' },
      { id: 'incremento',   name: 'incremento delta x',      latex: '\\Delta x' },
    ],
  },
  {
    id: 'calc-integrales',
    name: 'Integrales',
    symbols: [
      { id: 'int-indef',   name: 'integral indefinida',      latex: '\\int f(x)\\,dx' },
      { id: 'int-def',     name: 'integral definida',        latex: '\\int_a^b f(x)\\,dx' },
      { id: 'int-doble',   name: 'integral doble',           latex: '\\iint_D f\\,dA' },
      { id: 'int-triple',  name: 'integral triple',          latex: '\\iiint_E f\\,dV' },
      { id: 'int-linea',   name: 'integral de línea cerrada', latex: '\\oint_C f\\,ds' },
      { id: 'eval-barra',  name: 'evaluación entre a y b',   latex: '\\Big[ F(x) \\Big]_a^b' },
      { id: 'tfc',         name: 'teorema fundamental',      latex: '\\int_a^b f(x)\\,dx = F(b) - F(a)' },
    ],
  },
  {
    id: 'calc-series',
    name: 'Sucesiones y series',
    symbols: [
      { id: 'sumatoria',   name: 'sumatoria',                latex: '\\sum_{n=1}^{\\infty} a_n' },
      { id: 'sum-finita',  name: 'sumatoria finita',         latex: '\\sum_{i=1}^{n} a_i' },
      { id: 'productoria', name: 'productoria producto',     latex: '\\prod_{i=1}^{n} a_i' },
      { id: 'sucesion',    name: 'sucesión',                 latex: '\\{a_n\\}_{n=1}^{\\infty}' },
      { id: 'taylor',      name: 'serie de taylor',          latex: '\\sum_{n=0}^{\\infty} \\frac{f^{(n)}(a)}{n!}(x-a)^n' },
      { id: 'geometrica',  name: 'serie geométrica',         latex: '\\sum_{n=0}^{\\infty} ar^n' },
      { id: 'euler',       name: 'número e euler',           latex: 'e' },
    ],
  },
]
