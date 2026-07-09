import { useLayoutEffect, useRef, useState } from 'react'

/**
 * Mide el ancho disponible del contenedor (la columna o el ancho de la hoja)
 * para que los bloques de gráfico se ajusten a él: angostos dentro de una
 * columna, topados a su tamaño normal en el flujo de la página.
 *
 * Uso: poner `sentinelRef` en un div de altura 0 que sea PRIMER hijo del
 * recuadro del bloque (NodeViewWrapper). Se mide el contenedor del recuadro
 * (sentinel → recuadro → contenedor), no el recuadro mismo, para evitar el
 * bucle de medición (el recuadro es `inline-block` y se encoge a su contenido).
 *
 * Devuelve el ancho del contenedor (clamp al valor inicial `max`). El consumidor
 * resta su propio "chrome" (padding/borde) y aplica sus mínimos.
 */
export function useAvailableWidth(max: number) {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [availW, setAvailW] = useState(max)

  useLayoutEffect(() => {
    const container = sentinelRef.current?.parentElement?.parentElement
    if (!container) return
    let raf = 0
    const measure = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const w = container.clientWidth
        if (w > 0) setAvailW(w)
      })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(container)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  return { sentinelRef, availW }
}
