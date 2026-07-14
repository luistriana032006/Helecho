import { useRef } from 'react'
import { hexToHsv, hsvToHex } from '../../lib/color'

interface Props {
  /** Color actual en hex (#rrggbb) */
  value: string
  onChange: (hex: string) => void
  /** Diámetro de la rueda en px */
  size?: number
  'aria-label': string
}

/* ── Círculo cromático + barra de brillo ─────────────────────────────
   Rueda HSV dibujada con CSS puro: un conic-gradient recorre los matices
   en sentido horario desde arriba y un radial-gradient blanco desvanece
   la saturación hacia el centro (centro = blanco). El ángulo del puntero
   da el matiz (H) y la distancia al centro la saturación (S). Debajo, una
   barra de brillo (V) va del negro al color pleno — sin ella el negro y
   los tonos oscuros serían inalcanzables. */
export default function ColorWheel({ value, onChange, size = 140, ...aria }: Props) {
  const wheelRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const radius = size / 2

  const [h, s, v] = hexToHsv(value)

  const pickWheel = (e: React.PointerEvent) => {
    const el = wheelRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const dx = e.clientX - (rect.left + rect.width / 2)
    const dy = e.clientY - (rect.top + rect.height / 2)
    // Ángulo horario desde arriba (coincide con el conic-gradient)
    const hue = (Math.atan2(dx, -dy) * (180 / Math.PI) + 360) % 360
    const sat = Math.min(Math.hypot(dx, dy) / radius, 1)
    // Si el color estaba en negro puro, arrancar con brillo pleno para
    // que se vea el matiz recién elegido
    onChange(hsvToHex(hue, sat, v === 0 ? 1 : v))
  }

  const pickBar = (e: React.PointerEvent) => {
    const el = barRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const frac = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1)
    onChange(hsvToHex(h, s, frac))
  }

  const dragHandlers = (pick: (e: React.PointerEvent) => void) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.currentTarget.setPointerCapture(e.pointerId)
      pick(e)
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (e.buttons & 1) pick(e)
    },
  })

  // Posición del pulgar en la rueda a partir del matiz/saturación actuales
  const angle = (h * Math.PI) / 180
  const thumbX = radius + Math.sin(angle) * s * radius
  const thumbY = radius - Math.cos(angle) * s * radius
  // Color pleno (V=1) para el degradado de la barra de brillo
  const fullColor = hsvToHex(h, s, 1)

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        ref={wheelRef}
        role="slider"
        aria-valuetext={value}
        {...aria}
        {...dragHandlers(pickWheel)}
        className="relative shrink-0 cursor-crosshair touch-none rounded-full border border-border shadow-inner"
        style={{
          width: size,
          height: size,
          background: [
            'radial-gradient(closest-side, #fff, rgba(255,255,255,0) 100%)',
            'conic-gradient(from 0deg, hsl(0 100% 50%), hsl(60 100% 50%), hsl(120 100% 50%), hsl(180 100% 50%), hsl(240 100% 50%), hsl(300 100% 50%), hsl(360 100% 50%))',
          ].join(', '),
        }}
      >
        <span
          className="pointer-events-none absolute size-4 rounded-full border-2 border-white shadow-md"
          style={{
            left: thumbX - 8,
            top: thumbY - 8,
            backgroundColor: value,
            boxShadow: '0 1px 4px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(0,0,0,0.25)',
          }}
        />
      </div>
      <div
        ref={barRef}
        role="slider"
        aria-label={`${aria['aria-label']} — brillo`}
        aria-valuetext={`${Math.round(v * 100)}%`}
        {...dragHandlers(pickBar)}
        className="relative h-3.5 cursor-pointer touch-none rounded-full border border-border"
        style={{
          width: size,
          background: `linear-gradient(to right, #000, ${fullColor})`,
        }}
      >
        <span
          className="pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 rounded-full border-2 border-white"
          style={{
            left: `calc(${v * 100}% - 8px)`,
            backgroundColor: value,
            boxShadow: '0 1px 4px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(0,0,0,0.25)',
          }}
        />
      </div>
    </div>
  )
}
