/**
 * Plantillas de "bloques de función" editables: una fórmula en LaTeX con
 * CAMPOS que el usuario llena (sin escribir LaTeX). Cada plantilla define sus
 * campos y cómo arma el LaTeX final con los valores. El nodo `mathTemplate`
 * guarda el id de la plantilla + los valores; el render usa `toLatex`.
 *
 * Cubre los símbolos PARAMÉTRICOS de cada materia (los que al escribirlos a
 * mano hay que darles un valor). Los símbolos puramente estáticos (∞, ∈, letras
 * griegas, ℝ/ℤ/ℕ, operadores…) siguen en el menú normal como mathInline.
 * Agregar una plantilla/materia = unas líneas aquí.
 */

export interface TemplateField {
  key: string
  label: string
  default: string
}

export interface MathTemplate {
  id: string
  name: string
  /** Materia para agrupar en el menú */
  group: string
  fields: TemplateField[]
  toLatex: (v: Record<string, string>) => string
}

// Valor del campo o un placeholder visible (□) si está vacío
const f = (v: Record<string, string>, key: string, ph = '\\square') =>
  v[key] && v[key].trim() !== '' ? v[key] : ph

const AB = 'Álgebra Básica'
const AL = 'Álgebra Lineal'
const EV = 'Espacios Vectoriales'
const CAL = 'Cálculo'
const EST = 'Estadística'
const DIS = 'Discreta'

export const MATH_TEMPLATES: MathTemplate[] = [
  // ── Álgebra Básica ──────────────────────────────────────────────
  {
    id: 'ab-fraccion', name: 'Fracción', group: AB,
    fields: [{ key: 'a', label: 'numerador', default: 'a' }, { key: 'b', label: 'denominador', default: 'b' }],
    toLatex: (v) => `\\frac{${f(v, 'a')}}{${f(v, 'b')}}`,
  },
  {
    id: 'ab-potencia', name: 'Potencia', group: AB,
    fields: [{ key: 'base', label: 'base', default: 'x' }, { key: 'exp', label: 'exponente', default: 'n' }],
    toLatex: (v) => `${f(v, 'base')}^{${f(v, 'exp')}}`,
  },
  {
    id: 'ab-raiz', name: 'Raíz cuadrada', group: AB,
    fields: [{ key: 'x', label: 'radicando', default: 'x' }],
    toLatex: (v) => `\\sqrt{${f(v, 'x')}}`,
  },
  {
    id: 'ab-raiz-n', name: 'Raíz n-ésima', group: AB,
    fields: [{ key: 'n', label: 'índice', default: 'n' }, { key: 'x', label: 'radicando', default: 'x' }],
    toLatex: (v) => `\\sqrt[${f(v, 'n')}]{${f(v, 'x')}}`,
  },
  {
    id: 'ab-abs', name: 'Valor absoluto', group: AB,
    fields: [{ key: 'x', label: 'expresión', default: 'x' }],
    toLatex: (v) => `\\left| ${f(v, 'x')} \\right|`,
  },
  {
    id: 'ab-subindice', name: 'Subíndice', group: AB,
    fields: [{ key: 'var', label: 'variable', default: 'x' }, { key: 'sub', label: 'subíndice', default: '1' }],
    toLatex: (v) => `${f(v, 'var')}_{${f(v, 'sub')}}`,
  },
  {
    id: 'ab-funcion', name: 'Función f(x)', group: AB,
    fields: [{ key: 'f', label: 'nombre', default: 'f' }, { key: 'var', label: 'variable', default: 'x' }],
    toLatex: (v) => `${f(v, 'f')}(${f(v, 'var')})`,
  },
  {
    id: 'ab-logaritmo', name: 'Logaritmo base b', group: AB,
    fields: [{ key: 'base', label: 'base', default: 'b' }, { key: 'x', label: 'argumento', default: 'x' }],
    toLatex: (v) => `\\log_{${f(v, 'base')}}(${f(v, 'x')})`,
  },
  {
    id: 'ab-recta', name: 'Recta y = mx + b', group: AB,
    fields: [{ key: 'm', label: 'pendiente', default: 'm' }, { key: 'b', label: 'corte', default: 'b' }],
    toLatex: (v) => `y = ${f(v, 'm')}x + ${f(v, 'b')}`,
  },
  {
    id: 'ab-int-cerrado', name: 'Intervalo cerrado', group: AB,
    fields: [{ key: 'a', label: 'desde', default: 'a' }, { key: 'b', label: 'hasta', default: 'b' }],
    toLatex: (v) => `\\left[ ${f(v, 'a')}, ${f(v, 'b')} \\right]`,
  },
  {
    id: 'ab-int-abierto', name: 'Intervalo abierto', group: AB,
    fields: [{ key: 'a', label: 'desde', default: 'a' }, { key: 'b', label: 'hasta', default: 'b' }],
    toLatex: (v) => `\\left( ${f(v, 'a')}, ${f(v, 'b')} \\right)`,
  },

  // ── Álgebra Lineal ──────────────────────────────────────────────
  {
    id: 'al-vector', name: 'Vector', group: AL,
    fields: [{ key: 'v', label: 'nombre', default: 'v' }],
    toLatex: (v) => `\\vec{${f(v, 'v')}}`,
  },
  {
    id: 'al-norma', name: 'Norma', group: AL,
    fields: [{ key: 'v', label: 'vector', default: '\\vec{v}' }],
    toLatex: (v) => `\\left\\| ${f(v, 'v')} \\right\\|`,
  },
  {
    id: 'al-prod-punto', name: 'Producto punto', group: AL,
    fields: [{ key: 'u', label: 'vector 1', default: '\\vec{u}' }, { key: 'v', label: 'vector 2', default: '\\vec{v}' }],
    toLatex: (v) => `${f(v, 'u')} \\cdot ${f(v, 'v')}`,
  },
  {
    id: 'al-prod-cruz', name: 'Producto cruz', group: AL,
    fields: [{ key: 'u', label: 'vector 1', default: '\\vec{u}' }, { key: 'v', label: 'vector 2', default: '\\vec{v}' }],
    toLatex: (v) => `${f(v, 'u')} \\times ${f(v, 'v')}`,
  },
  {
    id: 'al-matriz-mn', name: 'Matriz m×n', group: AL,
    fields: [{ key: 'A', label: 'nombre', default: 'A' }, { key: 'm', label: 'filas', default: 'm' }, { key: 'n', label: 'columnas', default: 'n' }],
    toLatex: (v) => `${f(v, 'A')}_{${f(v, 'm')} \\times ${f(v, 'n')}}`,
  },
  {
    id: 'al-identidad', name: 'Matriz identidad', group: AL,
    fields: [{ key: 'n', label: 'orden', default: 'n' }],
    toLatex: (v) => `I_{${f(v, 'n')}}`,
  },

  // ── Espacios Vectoriales ────────────────────────────────────────
  {
    id: 'ev-rn', name: 'Espacio ℝⁿ', group: EV,
    fields: [{ key: 'n', label: 'dimensión', default: 'n' }],
    toLatex: (v) => `\\mathbb{R}^{${f(v, 'n')}}`,
  },
  {
    id: 'ev-subespacio', name: 'Subespacio W ⊆ V', group: EV,
    fields: [{ key: 'W', label: 'subespacio', default: 'W' }, { key: 'V', label: 'espacio', default: 'V' }],
    toLatex: (v) => `${f(v, 'W')} \\subseteq ${f(v, 'V')}`,
  },
  {
    id: 'ev-dim', name: 'Dimensión', group: EV,
    fields: [{ key: 'V', label: 'espacio', default: 'V' }],
    toLatex: (v) => `\\dim(${f(v, 'V')})`,
  },
  {
    id: 'ev-transf', name: 'Transformación T: V→W', group: EV,
    fields: [{ key: 'T', label: 'nombre', default: 'T' }, { key: 'V', label: 'dominio', default: 'V' }, { key: 'W', label: 'codominio', default: 'W' }],
    toLatex: (v) => `${f(v, 'T')}: ${f(v, 'V')} \\to ${f(v, 'W')}`,
  },
  {
    id: 'ev-imagen', name: 'Imagen de T', group: EV,
    fields: [{ key: 'T', label: 'transformación', default: 'T' }],
    toLatex: (v) => `\\text{Im}(${f(v, 'T')})`,
  },
  {
    id: 'ev-nucleo', name: 'Núcleo de T', group: EV,
    fields: [{ key: 'T', label: 'transformación', default: 'T' }],
    toLatex: (v) => `\\ker(${f(v, 'T')})`,
  },

  // ── Cálculo ─────────────────────────────────────────────────────
  {
    id: 'limite', name: 'Límite', group: CAL,
    fields: [{ key: 'var', label: 'variable', default: 'x' }, { key: 'to', label: 'tiende a', default: 'a' }, { key: 'expr', label: 'expresión', default: 'f(x)' }],
    toLatex: (v) => `\\lim_{${f(v, 'var')} \\to ${f(v, 'to')}} ${f(v, 'expr')}`,
  },
  {
    id: 'limite-infinito', name: 'Límite al infinito', group: CAL,
    fields: [{ key: 'var', label: 'variable', default: 'x' }, { key: 'expr', label: 'expresión', default: 'f(x)' }],
    toLatex: (v) => `\\lim_{${f(v, 'var')} \\to \\infty} ${f(v, 'expr')}`,
  },
  {
    id: 'derivada', name: 'Derivada (d/dx)', group: CAL,
    fields: [{ key: 'var', label: 'respecto a', default: 'x' }, { key: 'expr', label: 'expresión', default: 'f(x)' }],
    toLatex: (v) => `\\frac{d}{d${f(v, 'var')}}\\,${f(v, 'expr')}`,
  },
  {
    id: 'derivada-parcial', name: 'Derivada parcial', group: CAL,
    fields: [{ key: 'var', label: 'respecto a', default: 'x' }, { key: 'expr', label: 'función', default: 'f' }],
    toLatex: (v) => `\\frac{\\partial ${f(v, 'expr')}}{\\partial ${f(v, 'var')}}`,
  },
  {
    id: 'integral-definida', name: 'Integral definida', group: CAL,
    fields: [{ key: 'a', label: 'desde', default: 'a' }, { key: 'b', label: 'hasta', default: 'b' }, { key: 'expr', label: 'integrando', default: 'f(x)' }, { key: 'var', label: 'variable', default: 'x' }],
    toLatex: (v) => `\\int_{${f(v, 'a')}}^{${f(v, 'b')}} ${f(v, 'expr')}\\,d${f(v, 'var')}`,
  },
  {
    id: 'integral-indefinida', name: 'Integral indefinida', group: CAL,
    fields: [{ key: 'expr', label: 'integrando', default: 'f(x)' }, { key: 'var', label: 'variable', default: 'x' }],
    toLatex: (v) => `\\int ${f(v, 'expr')}\\,d${f(v, 'var')}`,
  },
  {
    id: 'sumatoria', name: 'Sumatoria', group: CAL,
    fields: [{ key: 'idx', label: 'índice', default: 'n' }, { key: 'from', label: 'desde', default: '1' }, { key: 'to', label: 'hasta', default: '\\infty' }, { key: 'term', label: 'término', default: 'a_n' }],
    toLatex: (v) => `\\sum_{${f(v, 'idx')}=${f(v, 'from')}}^{${f(v, 'to')}} ${f(v, 'term')}`,
  },
  {
    id: 'productoria', name: 'Productoria', group: CAL,
    fields: [{ key: 'idx', label: 'índice', default: 'i' }, { key: 'from', label: 'desde', default: '1' }, { key: 'to', label: 'hasta', default: 'n' }, { key: 'term', label: 'término', default: 'a_i' }],
    toLatex: (v) => `\\prod_{${f(v, 'idx')}=${f(v, 'from')}}^{${f(v, 'to')}} ${f(v, 'term')}`,
  },
  {
    id: 'evaluacion', name: 'Evaluación [ ]ᵃᵇ', group: CAL,
    fields: [{ key: 'expr', label: 'expresión', default: 'F(x)' }, { key: 'a', label: 'desde', default: 'a' }, { key: 'b', label: 'hasta', default: 'b' }],
    toLatex: (v) => `\\left[ ${f(v, 'expr')} \\right]_{${f(v, 'a')}}^{${f(v, 'b')}}`,
  },

  // ── Estadística ─────────────────────────────────────────────────
  {
    id: 'est-prob', name: 'Probabilidad P(A)', group: EST,
    fields: [{ key: 'A', label: 'evento', default: 'A' }],
    toLatex: (v) => `P(${f(v, 'A')})`,
  },
  {
    id: 'est-prob-cond', name: 'Prob. condicional', group: EST,
    fields: [{ key: 'A', label: 'evento', default: 'A' }, { key: 'B', label: 'dado', default: 'B' }],
    toLatex: (v) => `P(${f(v, 'A')} \\mid ${f(v, 'B')})`,
  },
  {
    id: 'est-prob-union', name: 'Prob. de unión', group: EST,
    fields: [{ key: 'A', label: 'evento 1', default: 'A' }, { key: 'B', label: 'evento 2', default: 'B' }],
    toLatex: (v) => `P(${f(v, 'A')} \\cup ${f(v, 'B')})`,
  },
  {
    id: 'est-prob-inter', name: 'Prob. de intersección', group: EST,
    fields: [{ key: 'A', label: 'evento 1', default: 'A' }, { key: 'B', label: 'evento 2', default: 'B' }],
    toLatex: (v) => `P(${f(v, 'A')} \\cap ${f(v, 'B')})`,
  },
  {
    id: 'est-esperanza', name: 'Esperanza E[X]', group: EST,
    fields: [{ key: 'X', label: 'variable', default: 'X' }],
    toLatex: (v) => `E[${f(v, 'X')}]`,
  },
  {
    id: 'est-varianza', name: 'Varianza Var(X)', group: EST,
    fields: [{ key: 'X', label: 'variable', default: 'X' }],
    toLatex: (v) => `\\text{Var}(${f(v, 'X')})`,
  },
  {
    id: 'est-normal', name: 'Distribución normal', group: EST,
    fields: [{ key: 'X', label: 'variable', default: 'X' }, { key: 'mu', label: 'media', default: '\\mu' }, { key: 'sigma2', label: 'varianza', default: '\\sigma^2' }],
    toLatex: (v) => `${f(v, 'X')} \\sim N(${f(v, 'mu')}, ${f(v, 'sigma2')})`,
  },
  {
    id: 'est-binomial', name: 'Distribución binomial', group: EST,
    fields: [{ key: 'X', label: 'variable', default: 'X' }, { key: 'n', label: 'ensayos', default: 'n' }, { key: 'p', label: 'prob.', default: 'p' }],
    toLatex: (v) => `${f(v, 'X')} \\sim B(${f(v, 'n')}, ${f(v, 'p')})`,
  },
  {
    id: 'est-poisson', name: 'Distribución Poisson', group: EST,
    fields: [{ key: 'X', label: 'variable', default: 'X' }, { key: 'lambda', label: 'tasa λ', default: '\\lambda' }],
    toLatex: (v) => `${f(v, 'X')} \\sim \\text{Poisson}(${f(v, 'lambda')})`,
  },
  {
    id: 'est-zscore', name: 'Puntaje z', group: EST,
    fields: [{ key: 'x', label: 'valor', default: 'x' }, { key: 'mu', label: 'media', default: '\\mu' }, { key: 'sigma', label: 'desv.', default: '\\sigma' }],
    toLatex: (v) => `z = \\frac{${f(v, 'x')} - ${f(v, 'mu')}}{${f(v, 'sigma')}}`,
  },

  // ── Discreta ────────────────────────────────────────────────────
  {
    id: 'disc-factorial', name: 'Factorial n!', group: DIS,
    fields: [{ key: 'n', label: 'número', default: 'n' }],
    toLatex: (v) => `${f(v, 'n')}!`,
  },
  {
    id: 'disc-combinacion', name: 'Combinación C(n,k)', group: DIS,
    fields: [{ key: 'n', label: 'total', default: 'n' }, { key: 'k', label: 'elegidos', default: 'k' }],
    toLatex: (v) => `\\binom{${f(v, 'n')}}{${f(v, 'k')}}`,
  },
  {
    id: 'disc-piso', name: 'Función piso', group: DIS,
    fields: [{ key: 'x', label: 'expresión', default: 'x' }],
    toLatex: (v) => `\\left\\lfloor ${f(v, 'x')} \\right\\rfloor`,
  },
  {
    id: 'disc-techo', name: 'Función techo', group: DIS,
    fields: [{ key: 'x', label: 'expresión', default: 'x' }],
    toLatex: (v) => `\\left\\lceil ${f(v, 'x')} \\right\\rceil`,
  },
  {
    id: 'disc-congruencia', name: 'Congruencia mód n', group: DIS,
    fields: [{ key: 'a', label: 'a', default: 'a' }, { key: 'b', label: 'b', default: 'b' }, { key: 'n', label: 'módulo', default: 'n' }],
    toLatex: (v) => `${f(v, 'a')} \\equiv ${f(v, 'b')} \\pmod{${f(v, 'n')}}`,
  },
  {
    id: 'disc-mcd', name: 'Máximo común divisor', group: DIS,
    fields: [{ key: 'a', label: 'a', default: 'a' }, { key: 'b', label: 'b', default: 'b' }],
    toLatex: (v) => `\\gcd(${f(v, 'a')}, ${f(v, 'b')})`,
  },
  {
    id: 'disc-mod', name: 'Módulo (residuo)', group: DIS,
    fields: [{ key: 'a', label: 'dividendo', default: 'a' }, { key: 'n', label: 'módulo', default: 'n' }],
    toLatex: (v) => `${f(v, 'a')} \\bmod ${f(v, 'n')}`,
  },
  {
    id: 'disc-cardinal', name: 'Cardinalidad |A|', group: DIS,
    fields: [{ key: 'A', label: 'conjunto', default: 'A' }],
    toLatex: (v) => `\\left| ${f(v, 'A')} \\right|`,
  },
  {
    id: 'disc-grado', name: 'Grado de vértice', group: DIS,
    fields: [{ key: 'v', label: 'vértice', default: 'v' }],
    toLatex: (v) => `\\deg(${f(v, 'v')})`,
  },
  {
    id: 'disc-union', name: 'Unión A ∪ B', group: DIS,
    fields: [{ key: 'A', label: 'conjunto 1', default: 'A' }, { key: 'B', label: 'conjunto 2', default: 'B' }],
    toLatex: (v) => `${f(v, 'A')} \\cup ${f(v, 'B')}`,
  },
  {
    id: 'disc-interseccion', name: 'Intersección A ∩ B', group: DIS,
    fields: [{ key: 'A', label: 'conjunto 1', default: 'A' }, { key: 'B', label: 'conjunto 2', default: 'B' }],
    toLatex: (v) => `${f(v, 'A')} \\cap ${f(v, 'B')}`,
  },
]

export const templateById = (id: string): MathTemplate | undefined =>
  MATH_TEMPLATES.find((t) => t.id === id)

/** Valores por defecto de una plantilla (para insertarla nueva). */
export function defaultValues(t: MathTemplate): Record<string, string> {
  const values: Record<string, string> = {}
  for (const field of t.fields) values[field.key] = field.default
  return values
}
