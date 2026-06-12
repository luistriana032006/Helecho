/**
 * Tipografías del editor (por selección, estilo Word). Compartido entre el
 * renderer (toolbar) y el serializador: el .md guarda el ID estable
 * (`<font face="serif">…</font>`), nunca la pila CSS — así la pila puede
 * mejorar sin romper apuntes viejos.
 *
 * Las pilas llevan fallbacks por plataforma (Linux: Liberation/DejaVu;
 * Windows/macOS: las clásicas) y cierran con la familia genérica.
 * Solo comillas simples dentro de la pila (viaja en face="…").
 */

export interface EditorFont {
  id: string
  label: string
  stack: string
}

export const EDITOR_FONTS: EditorFont[] = [
  { id: 'serif', label: 'Serif (Georgia)', stack: "Georgia, 'Liberation Serif', 'Times New Roman', serif" },
  { id: 'clasica', label: 'Clásica (Times)', stack: "'Times New Roman', 'Liberation Serif', serif" },
  { id: 'moderna', label: 'Moderna (Verdana)', stack: "Verdana, 'DejaVu Sans', sans-serif" },
  { id: 'manuscrita', label: 'Manuscrita', stack: "'Segoe Script', 'Comic Sans MS', 'Comic Neue', cursive" },
  { id: 'maquina', label: 'Máquina (mono)', stack: "'Courier New', 'Liberation Mono', monospace" },
]

export const fontById = (id: string): EditorFont | undefined =>
  EDITOR_FONTS.find((f) => f.id === id)

export const fontByStack = (stack: string): EditorFont | undefined =>
  EDITOR_FONTS.find((f) => f.stack === stack)
