import type { Subject, SymbolTab, PlotType } from "./types"

export const PLOT_TYPE_LABELS: Record<PlotType, string> = {
  recta: "Recta",
  parabola: "Parábola",
  cubica: "Cúbica",
  raiz: "Raíz",
  inversa: "1/x",
  seno: "Seno",
  coseno: "Coseno",
  exponencial: "Exponencial",
}

export const PLOT_TYPE_FORMULAS: Record<PlotType, string> = {
  recta: "y = a·x + b",
  parabola: "y = a·x² + b·x + c",
  cubica: "y = a·x³ + b·x + c",
  raiz: "y = a·√x + b",
  inversa: "y = a / x + b",
  seno: "y = a·sen(b·x) + c",
  coseno: "y = a·cos(b·x) + c",
  exponencial: "y = a·e^(b·x) + c",
}

export const SUBJECTS: Subject[] = [
  {
    id: "s1",
    name: "Álgebra Lineal",
    semester: "2026-1",
    notebooks: [
      {
        id: "n1",
        name: "Espacios vectoriales",
        createdAt: "2026-02-12",
        updatedAt: "2026-03-08",
        lines: [
          "Un espacio vectorial V sobre un campo K",
          "cumple los axiomas de suma y producto escalar.",
          "El conjunto de vectores debe ser cerrado bajo combinación lineal.",
          "Subespacio: subconjunto que es a su vez espacio vectorial.",
          "Base: conjunto linealmente independiente que genera V.",
        ],
      },
      {
        id: "n2",
        name: "Transformaciones lineales",
        createdAt: "2026-02-20",
        updatedAt: "2026-02-25",
        lines: [
          "Una transformación lineal T preserva la suma y el escalar.",
          "El núcleo de T es el conjunto de vectores que van al cero.",
          "La imagen de T es el conjunto de salidas posibles.",
        ],
      },
      {
        id: "n3",
        name: "Determinantes",
        createdAt: "2026-03-01",
        updatedAt: "2026-03-10",
        lines: ["El determinante mide el cambio de volumen.", "det(AB) = det(A)·det(B)."],
      },
    ],
  },
  {
    id: "s2",
    name: "Cálculo Diferencial",
    semester: "2026-1",
    notebooks: [
      {
        id: "n4",
        name: "Límites",
        createdAt: "2026-02-15",
        updatedAt: "2026-02-18",
        lines: [
          "El límite describe el comportamiento de una función cerca de un punto.",
          "Límites laterales: por la izquierda y por la derecha.",
          "Una función es continua si el límite coincide con su valor.",
        ],
      },
      {
        id: "n5",
        name: "Derivadas",
        createdAt: "2026-02-28",
        updatedAt: "2026-03-05",
        lines: ["La derivada es la pendiente de la recta tangente.", "Regla de la cadena para composición de funciones."],
      },
    ],
  },
  {
    id: "s3",
    name: "Física General",
    semester: "2025-2",
    notebooks: [
      {
        id: "n6",
        name: "Cinemática",
        createdAt: "2025-09-10",
        updatedAt: "2025-10-02",
        lines: ["El movimiento rectilíneo uniforme tiene velocidad constante.", "Aceleración: cambio de velocidad en el tiempo."],
      },
    ],
  },
  {
    id: "s4",
    name: "Notas sueltas",
    semester: undefined,
    notebooks: [
      {
        id: "n7",
        name: "Ideas de proyecto",
        createdAt: "2026-01-05",
        updatedAt: "2026-01-22",
        lines: ["Un editor de apuntes matemáticos sin LaTeX.", "Plano cartesiano interactivo para graficar funciones."],
      },
    ],
  },
]

export const SYMBOL_TABS: SymbolTab[] = [
  {
    id: "lineal",
    label: "Álgebra Lineal",
    categories: [
      {
        category: "Conjuntos y espacios",
        symbols: [
          { symbol: "ℝⁿ", name: "Espacio real n-dimensional" },
          { symbol: "ℂ", name: "Números complejos" },
          { symbol: "∈", name: "Pertenece a" },
          { symbol: "⊆", name: "Subconjunto de" },
        ],
      },
      {
        category: "Operadores",
        symbols: [
          { symbol: "∑", name: "Sumatoria" },
          { symbol: "⟨·,·⟩", name: "Producto interno" },
          { symbol: "×", name: "Producto cruz" },
          { symbol: "·", name: "Producto punto" },
        ],
      },
      {
        category: "Matrices",
        symbols: [
          { symbol: "Aᵀ", name: "Matriz transpuesta" },
          { symbol: "A⁻¹", name: "Matriz inversa" },
          { symbol: "det", name: "Determinante" },
          { symbol: "λ", name: "Valor propio" },
        ],
      },
    ],
  },
  {
    id: "vectoriales",
    label: "Espacios Vectoriales",
    categories: [
      {
        category: "Vectores",
        symbols: [
          { symbol: "v⃗", name: "Vector" },
          { symbol: "‖v‖", name: "Norma de un vector" },
          { symbol: "0⃗", name: "Vector cero" },
          { symbol: "ê", name: "Vector unitario" },
        ],
      },
      {
        category: "Relaciones",
        symbols: [
          { symbol: "⊥", name: "Ortogonal a" },
          { symbol: "∥", name: "Paralelo a" },
          { symbol: "⊕", name: "Suma directa" },
          { symbol: "span", name: "Espacio generado" },
        ],
      },
    ],
  },
]

export const PLOT_COLORS = ["#2dc653", "#1e8049", "#6ee7a0", "#b7e4c7", "#0c8a4a"]
