/* ── Tema personalizable ─────────────────────────────────────────────
   La paleta vive en variables CSS con canales RGB (globals.css). Aquí se
   re-derivan todas a partir del color de interfaz elegido: a cada token se
   le rota el matiz y se le escala la saturación respecto al verde original,
   conservando su luminosidad — así los fondos siguen oscuros, los bordes
   sutiles, etc., pero en el matiz nuevo. Los textos de alto contraste se
   pintan directamente con el color de texto elegido (blanco por defecto). */

import { hexToRgb, rgbToHsl, hslToRgb, type Rgb } from './color'

export const DEFAULT_UI_COLOR = '#2dc653'
export const DEFAULT_TEXT_COLOR = '#ffffff'

/* Tokens que rotan con el color de interfaz (valores de globals.css).
   --destructive queda fuera: el rojo de peligro es semántico. */
const ROTATE_TOKENS: Record<string, Rgb> = {
  background: [12, 44, 28],
  card: [21, 71, 52],
  popover: [16, 55, 38],
  primary: [45, 198, 83],
  'primary-foreground': [6, 24, 14],
  secondary: [16, 55, 38],
  muted: [16, 55, 38],
  'muted-foreground': [143, 191, 161],
  accent: [30, 128, 73],
  border: [29, 76, 54],
  input: [29, 76, 54],
  ring: [45, 198, 83],
  sidebar: [10, 36, 23],
  'sidebar-primary': [45, 198, 83],
  'sidebar-primary-foreground': [6, 24, 14],
  'sidebar-accent': [16, 55, 38],
  'sidebar-border': [29, 76, 54],
  forest: [30, 128, 73],
  sacramento: [21, 71, 52],
  onyx: [12, 44, 28],
}

/* Tokens de texto de alto contraste: toman el color de texto elegido.
   (--muted-foreground no está: es texto atenuado y rota con la interfaz
   para conservar la jerarquía visual.) */
const TEXT_TOKENS: Record<string, Rgb> = {
  foreground: [244, 242, 228],
  'card-foreground': [244, 242, 228],
  'popover-foreground': [244, 242, 228],
  'secondary-foreground': [244, 242, 228],
  'accent-foreground': [244, 242, 228],
  'sidebar-foreground': [244, 242, 228],
  'sidebar-accent-foreground': [244, 242, 228],
  'off-white': [244, 242, 228],
}

const setVar = (name: string, [r, g, b]: Rgb) =>
  document.documentElement.style.setProperty(`--${name}`, `${r} ${g} ${b}`)

export function applyTheme(uiColor: string, textColor: string): void {
  const [baseH, baseS, baseL] = rgbToHsl(hexToRgb(DEFAULT_UI_COLOR))
  const [uiH, uiS, uiL] = rgbToHsl(hexToRgb(uiColor))
  const deltaH = uiH - baseH
  const satRatio = uiS / baseS
  // El brillo también escala: elegir negro oscurece toda la paleta hasta
  // el negro puro; un tono pastel la aclara. Proporcional al verde base.
  const lightRatio = uiL / baseL

  for (const [name, rgb] of Object.entries(ROTATE_TOKENS)) {
    const [h, s, l] = rgbToHsl(rgb)
    setVar(
      name,
      hslToRgb(h + deltaH, Math.min(s * satRatio, 1), Math.min(l * lightRatio, 1))
    )
  }

  const text = hexToRgb(textColor)
  for (const name of Object.keys(TEXT_TOKENS)) {
    setVar(name, text)
  }
}
