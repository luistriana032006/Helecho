"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { ChevronsLeft, ChevronsRight } from "lucide-react"

interface ResizablePanelProps {
  side: "left" | "right"
  collapsed: boolean
  width: number
  minWidth?: number
  maxWidth?: number
  /** Icon shown on the collapsed rail */
  collapsedIcon: ReactNode
  collapsedLabel?: string
  onExpand: () => void
  onResize: (width: number) => void
  children: ReactNode
}

export function ResizablePanel(props: ResizablePanelProps) {
  const { side, collapsed, width, minWidth = 180, maxWidth = 560, onResize } = props
  const dragging = useRef(false)

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [])

  useEffect(() => {
    function handleMove(e: PointerEvent) {
      if (!dragging.current) return
      const panel = panelRef.current
      if (!panel) return
      const rect = panel.getBoundingClientRect()
      const next = side === "left" ? e.clientX - rect.left : rect.right - e.clientX
      onResize(Math.min(maxWidth, Math.max(minWidth, next)))
    }
    function handleUp() {
      dragging.current = false
    }
    window.addEventListener("pointermove", handleMove)
    window.addEventListener("pointerup", handleUp)
    return () => {
      window.removeEventListener("pointermove", handleMove)
      window.removeEventListener("pointerup", handleUp)
    }
  }, [side, minWidth, maxWidth, onResize])

  const panelRef = useRef<HTMLDivElement>(null)

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={props.onExpand}
        aria-label={`Expandir ${props.collapsedLabel ?? "panel"}`}
        className="flex w-10 shrink-0 flex-col items-center gap-2 border-border bg-sidebar py-3 text-muted-foreground transition-colors hover:text-foreground"
        style={{ borderLeftWidth: side === "right" ? 1 : 0, borderRightWidth: side === "left" ? 1 : 0 }}
      >
        <span className="text-base">{props.collapsedIcon}</span>
        <span aria-hidden>
          {side === "left" ? <ChevronsRight className="size-3.5" /> : <ChevronsLeft className="size-3.5" />}
        </span>
      </button>
    )
  }

  const handle = (
    <div
      onPointerDown={onPointerDown}
      role="separator"
      aria-orientation="vertical"
      className="group/handle relative w-1 shrink-0 cursor-col-resize bg-transparent hover:bg-primary/40"
    >
      <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border group-hover/handle:bg-primary" />
    </div>
  )

  return (
    <>
      {side === "right" && handle}
      <div
        ref={panelRef}
        style={{ width }}
        className="flex shrink-0 flex-col overflow-hidden bg-sidebar"
      >
        {props.children}
      </div>
      {side === "left" && handle}
    </>
  )
}
