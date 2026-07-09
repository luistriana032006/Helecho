import { useMemo } from 'react'

/**
 * Escena nocturna para el fondo vacío del panel de Alexandria: recreación
 * en la paleta de Helecho de la foto de referencia (vía láctea en arco,
 * campo de estrellas, estrellas fugaces y mesas en silueta). Todo por capas
 * animables — el cielo y el glow van por CSS (.night-* en globals.css); la
 * vía láctea y las montañas en SVG; las estrellas se generan aquí.
 */

interface Star {
  x: number
  y: number
  size: number
  delay: number
  color: string
  bright: boolean
}

// Estrellas de varios colores (no solo amarillo): mayoría hueso, y una mezcla
// de amarillo, azul, verde y naranja para dar variedad al cielo.
function starColor(): string {
  const r = Math.random()
  if (r < 0.55) return '#eef3e8' // hueso
  if (r < 0.71) return '#f5e6a8' // amarillo
  if (r < 0.85) return '#bcd0f0' // azul
  if (r < 0.93) return '#cfe9d2' // verde
  return '#f3c98a' // naranja
}

function makeStars(): Star[] {
  const stars: Star[] = []
  const push = (x: number, y: number, biasBright = 0) => {
    const bright = Math.random() < 0.05 + biasBright
    stars.push({
      x,
      y,
      size: bright ? 2 : Math.random() < 0.8 ? 1 : 1.5,
      delay: Math.random() * 4,
      color: starColor(),
      bright,
    })
  }
  // Campo general por todo el cielo (0–66 %; debajo van las montañas)
  for (let i = 0; i < 90; i++) push(Math.random() * 100, 2 + Math.random() * 64)
  // Cúmulo más denso A LO LARGO del arco de la vía láctea (parábola: alto en
  // el centro, baja hacia los lados) — refuerza visualmente el arco
  for (let i = 0; i < 44; i++) {
    const x = Math.random() * 100
    const archY = 15 + 15 * Math.pow((x - 50) / 50, 2)
    push(x, archY + (Math.random() - 0.5) * 10, 0.04)
  }
  return stars
}

// Estrellas fugaces: pocas y desfasadas → una cruza de vez en cuando.
const SHOOTING = [
  { top: '14%', left: '6%', delay: '0s' },
  { top: '24%', left: '48%', delay: '4.5s' },
  { top: '9%', left: '68%', delay: '8.5s' },
]

// Pinito en silueta (2 niveles). (cx, base, alto) en coords del viewBox de las
// montañas (0–750 × 0–200); la base se pone en los valles del filo (y=150).
function pine(cx: number, base: number, h: number): string {
  const w = h * 0.42
  const top = base - h
  const tier = base - h * 0.5
  return `M${cx},${top} L${cx - w * 0.6},${tier} L${cx - w * 0.32},${tier} L${cx - w},${base} L${cx + w},${base} L${cx + w * 0.32},${tier} L${cx + w * 0.6},${tier} Z`
}
const TREES = [
  { x: 118, h: 15 },
  { x: 250, h: 12 },
  { x: 384, h: 17 },
  { x: 540, h: 12 },
  { x: 626, h: 14 },
  { x: 730, h: 11 },
]

export function NightSky() {
  const stars = useMemo(() => makeStars(), [])

  return (
    <div className="night-sky pointer-events-none absolute inset-0 overflow-hidden">
      {/* Vía láctea: banda en media luna (gruesa al centro, fina en el
          horizonte) + núcleo brillante a la izquierda del arco */}
      <svg className="night-milkyway" viewBox="0 0 1000 420" preserveAspectRatio="none" aria-hidden>
        <defs>
          {/* Azules SOLO en los costados (transparente en el centro, donde va
              el cálido) → desacoplados del núcleo. Capa ancha y muy difusa. */}
          <linearGradient id="mwBlue" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#5b86c9" stopOpacity="0" />
            <stop offset="14%" stopColor="#6f9bd6" stopOpacity="0.24" />
            <stop offset="30%" stopColor="#6f9bd6" stopOpacity="0.06" />
            <stop offset="50%" stopColor="#6f9bd6" stopOpacity="0" />
            <stop offset="70%" stopColor="#6f9bd6" stopOpacity="0.06" />
            <stop offset="86%" stopColor="#6f9bd6" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#5b86c9" stopOpacity="0" />
          </linearGradient>
          {/* Banda principal: cálido al centro-izquierda + verde de la paleta */}
          <linearGradient id="mwBand" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#9fb8e0" stopOpacity="0" />
            <stop offset="18%" stopColor="#9fb8e0" stopOpacity="0.10" />
            <stop offset="40%" stopColor="#ecd187" stopOpacity="0.36" />
            <stop offset="50%" stopColor="#e7a85d" stopOpacity="0.42" />
            <stop offset="60%" stopColor="#e0c879" stopOpacity="0.32" />
            <stop offset="74%" stopColor="#6fc29a" stopOpacity="0.26" />
            <stop offset="90%" stopColor="#6f98d4" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#6f98d4" stopOpacity="0" />
          </linearGradient>
          <filter id="mwBlur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="13" />
          </filter>
          <filter id="mwBlurWide" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="30" />
          </filter>
          <radialGradient id="mwCore">
            <stop offset="0%" stopColor="#f3e0a0" stopOpacity="0.40" />
            <stop offset="45%" stopColor="#e7a85d" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#e7a85d" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* halo azul ancho y muy difuso (en los costados, alargado) */}
        <path filter="url(#mwBlurWide)" fill="url(#mwBlue)"
          d="M-100,258 Q500,-55 1100,258 Q500,150 -100,258 Z" />
        {/* banda principal (media luna) */}
        <path filter="url(#mwBlur)" fill="url(#mwBand)"
          d="M-60,255 Q500,-30 1060,255 Q500,120 -60,255 Z" />
        {/* núcleo cálido: bajado y aplanado para que NO se asome arriba */}
        <ellipse filter="url(#mwBlur)" cx="470" cy="150" rx="135" ry="34" fill="url(#mwCore)" />
      </svg>

      {stars.map((s, i) => (
        <span
          key={i}
          className="night-star"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            background: s.color,
            animationDelay: `${s.delay}s`,
            boxShadow: s.bright ? `0 0 3px 0.5px ${s.color}` : undefined,
          }}
        />
      ))}

      {SHOOTING.map((s, i) => (
        <span
          key={i}
          className="night-shooting"
          style={{ top: s.top, left: s.left, animationDelay: s.delay }}
        />
      ))}

      {/* Montañas/badlands: 3 capas orgánicas e irregulares (lejana clara →
          cercana oscura) para dar profundidad, no trapecios planos */}
      <svg className="night-mountains" viewBox="0 0 750 200" preserveAspectRatio="none" aria-hidden>
        <path
          fill="#0a2417"
          d="M0,200 L0,176 C90,172 150,182 230,176 C300,171 360,180 430,175 C520,169 600,181 690,176 C720,174 740,178 750,176 L750,200 Z"
        />
        <path
          fill="#071b0f"
          d="M0,200 L0,158 C50,158 70,146 104,152 C140,158 156,170 196,164 C246,156 268,140 312,148 C360,157 384,168 430,160 C486,150 512,140 556,150 C604,161 628,170 676,162 C712,156 732,166 750,160 L750,200 Z"
        />
        <path
          fill="#03100a"
          d="M0,200 L0,150 C22,150 36,128 56,134 C78,141 90,150 118,150 C150,150 166,98 192,110 C210,119 222,150 250,150 C286,150 298,134 318,140 C342,147 354,150 384,150 C420,150 432,116 466,126 C492,134 506,150 540,150 C582,150 596,150 626,150 C652,150 664,120 692,130 C716,138 730,150 750,148 L750,200 Z"
        />
        {/* Pinitos sobre el filo (mismo tono que la capa cercana) */}
        {TREES.map((t, i) => (
          <path key={i} fill="#03100a" d={pine(t.x, 150, t.h)} />
        ))}
      </svg>
    </div>
  )
}
