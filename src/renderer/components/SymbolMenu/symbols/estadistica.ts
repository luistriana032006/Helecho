import type { SymbolCategory } from '../../../types/symbols'

export const estadistica: SymbolCategory[] = [
  {
    id: 'est-descriptiva',
    name: 'Estadística descriptiva',
    symbols: [
      { id: 'media-muestral',    name: 'media muestral x barra',     latex: '\\bar{x}' },
      { id: 'media-poblacional', name: 'media poblacional mu',       latex: '\\mu' },
      { id: 'varianza-pob',      name: 'varianza poblacional',       latex: '\\sigma^2' },
      { id: 'varianza-muestral', name: 'varianza muestral',          latex: 's^2' },
      { id: 'desviacion',        name: 'desviación estándar',        latex: '\\sigma' },
      { id: 'mediana',           name: 'mediana',                    latex: '\\tilde{x}' },
      { id: 'tamano-muestra',    name: 'tamaño de muestra n',        latex: 'n' },
      { id: 'frecuencia',        name: 'frecuencia relativa',        latex: 'f_i = \\frac{n_i}{n}' },
    ],
  },
  {
    id: 'est-probabilidad',
    name: 'Probabilidad',
    symbols: [
      { id: 'prob',          name: 'probabilidad de A',           latex: 'P(A)' },
      { id: 'prob-cond',     name: 'probabilidad condicional',    latex: 'P(A \\mid B)' },
      { id: 'prob-union',    name: 'probabilidad de unión',       latex: 'P(A \\cup B)' },
      { id: 'prob-inter',    name: 'probabilidad de intersección', latex: 'P(A \\cap B)' },
      { id: 'complemento',   name: 'complemento de A',            latex: 'P(A^c)' },
      { id: 'bayes',         name: 'teorema de bayes',            latex: 'P(A \\mid B) = \\frac{P(B \\mid A)\\,P(A)}{P(B)}' },
      { id: 'esperanza',     name: 'esperanza valor esperado',    latex: 'E[X]' },
      { id: 'var-x',         name: 'varianza de X',               latex: '\\text{Var}(X)' },
      { id: 'covarianza',    name: 'covarianza',                  latex: '\\text{Cov}(X, Y)' },
    ],
  },
  {
    id: 'est-distribuciones',
    name: 'Distribuciones',
    symbols: [
      { id: 'distribuye',  name: 'se distribuye como',        latex: 'X \\sim' },
      { id: 'normal',      name: 'distribución normal',       latex: 'X \\sim N(\\mu, \\sigma^2)' },
      { id: 'binomial',    name: 'distribución binomial',     latex: 'X \\sim B(n, p)' },
      { id: 'poisson',     name: 'distribución de poisson',   latex: 'X \\sim \\text{Poisson}(\\lambda)' },
      { id: 'uniforme',    name: 'distribución uniforme',     latex: 'X \\sim U(a, b)' },
      { id: 'exponencial', name: 'distribución exponencial',  latex: 'X \\sim \\text{Exp}(\\lambda)' },
      { id: 'chi2',        name: 'chi cuadrado',              latex: '\\chi^2' },
      { id: 't-student',   name: 't de student',              latex: 't_{n-1}' },
    ],
  },
  {
    id: 'est-inferencia',
    name: 'Inferencia',
    symbols: [
      { id: 'h0',           name: 'hipótesis nula',            latex: 'H_0' },
      { id: 'h1',           name: 'hipótesis alternativa',     latex: 'H_1' },
      { id: 'significancia', name: 'nivel de significancia',   latex: '\\alpha' },
      { id: 'z-score',      name: 'puntaje z estandarizado',   latex: 'z = \\frac{x - \\mu}{\\sigma}' },
      { id: 'intervalo',    name: 'intervalo de confianza',    latex: '\\bar{x} \\pm z_{\\alpha/2} \\frac{\\sigma}{\\sqrt{n}}' },
      { id: 'correlacion',  name: 'correlación de pearson',    latex: 'r' },
      { id: 'estimador',    name: 'estimador theta gorro',     latex: '\\hat{\\theta}' },
      { id: 'regresion',    name: 'recta de regresión',        latex: '\\hat{y} = \\beta_0 + \\beta_1 x' },
    ],
  },
]
