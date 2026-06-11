import { useRef } from 'react'

interface Props {
  side: 'left' | 'right'
  onDrag: (clientX: number) => void
}

export default function ResizeHandle({ side, onDrag }: Props) {
  const dragging = useRef(false)

  const start = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    dragging.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return
    onDrag(e.clientX)
  }

  const end = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return
    dragging.current = false
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }

  return (
    <div
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      title="Arrastrar para redimensionar"
      className={`absolute top-0 z-30 h-full w-1.5 cursor-col-resize transition-colors
        hover:bg-primary/40 active:bg-primary/60
        ${side === 'left' ? 'left-0' : 'right-0'}`}
    />
  )
}
