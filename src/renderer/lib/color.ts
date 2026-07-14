/* ── Utilidades de color ─────────────────────────────────────────────
   Conversiones entre hex, RGB, HSL y HSV. Se usan para el círculo
   cromático (HSV: ángulo = matiz, radio = saturación) y para re-derivar
   la paleta de la UI rotando el matiz (HSL conserva la luminosidad de
   cada token, así los fondos oscuros siguen oscuros). */

export type Rgb = [number, number, number]

const clamp01 = (n: number) => Math.min(Math.max(n, 0), 1)

export function hexToRgb(hex: string): Rgb {
  const clean = hex.replace('#', '')
  const full =
    clean.length === 3
      ? clean.split('').map((c) => c + c).join('')
      : clean
  const n = parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function rgbToHex([r, g, b]: Rgb): string {
  const to2 = (n: number) => Math.round(n).toString(16).padStart(2, '0')
  return `#${to2(r)}${to2(g)}${to2(b)}`
}

/** RGB (0-255) → HSL con h en grados, s y l en 0-1 */
export function rgbToHsl([r, g, b]: Rgb): [number, number, number] {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  const d = max - min
  if (d === 0) return [0, 0, l]
  const s = d / (1 - Math.abs(2 * l - 1))
  let h: number
  if (max === rn) h = 60 * (((gn - bn) / d) % 6)
  else if (max === gn) h = 60 * ((bn - rn) / d + 2)
  else h = 60 * ((rn - gn) / d + 4)
  return [(h + 360) % 360, clamp01(s), l]
}

/** HSL (h en grados, s y l en 0-1) → RGB (0-255) */
export function hslToRgb(h: number, s: number, l: number): Rgb {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const hp = ((h % 360) + 360) % 360 / 60
  const x = c * (1 - Math.abs((hp % 2) - 1))
  let rgb: Rgb
  if (hp < 1) rgb = [c, x, 0]
  else if (hp < 2) rgb = [x, c, 0]
  else if (hp < 3) rgb = [0, c, x]
  else if (hp < 4) rgb = [0, x, c]
  else if (hp < 5) rgb = [x, 0, c]
  else rgb = [c, 0, x]
  const m = l - c / 2
  return [
    Math.round((rgb[0] + m) * 255),
    Math.round((rgb[1] + m) * 255),
    Math.round((rgb[2] + m) * 255),
  ]
}

/** hex → HSV con h en grados, s y v en 0-1 (para posicionar la ruedita) */
export function hexToHsv(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex)
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const d = max - min
  const v = max
  const s = max === 0 ? 0 : d / max
  let h = 0
  if (d !== 0) {
    if (max === rn) h = 60 * (((gn - bn) / d) % 6)
    else if (max === gn) h = 60 * ((bn - rn) / d + 2)
    else h = 60 * ((rn - gn) / d + 4)
  }
  return [(h + 360) % 360, clamp01(s), v]
}

/** HSV (h en grados, s y v en 0-1) → hex */
export function hsvToHex(h: number, s: number, v: number): string {
  const c = v * s
  const hp = ((h % 360) + 360) % 360 / 60
  const x = c * (1 - Math.abs((hp % 2) - 1))
  let rgb: Rgb
  if (hp < 1) rgb = [c, x, 0]
  else if (hp < 2) rgb = [x, c, 0]
  else if (hp < 3) rgb = [0, c, x]
  else if (hp < 4) rgb = [0, x, c]
  else if (hp < 5) rgb = [x, 0, c]
  else rgb = [c, 0, x]
  const m = v - c
  return rgbToHex([
    (rgb[0] + m) * 255,
    (rgb[1] + m) * 255,
    (rgb[2] + m) * 255,
  ])
}
