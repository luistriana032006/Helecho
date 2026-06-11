"use client"

import type { ReactNode } from "react"
import type { SheetMode } from "@/lib/helecho/types"

function ModalShell({ children, onClose }: { children: ReactNode; onClose?: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-xl border border-border bg-popover p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
      <button type="button" aria-label="Cerrar" className="absolute inset-0 -z-0 cursor-default" onClick={onClose} />
    </div>
  )
}

export function SettingsDialog({
  mode,
  onChangeMode,
  onClose,
}: {
  mode: SheetMode
  onChangeMode: (m: SheetMode) => void
  onClose: () => void
}) {
  const cards: { id: SheetMode; title: string; desc: string }[] = [
    {
      id: "strict",
      title: "Página estricta",
      desc: "El texto respeta los márgenes y salta a la siguiente hoja, como en Word.",
    },
    { id: "fluid", title: "Fluido", desc: "Una sola hoja continua que crece con el contenido." },
  ]
  return (
    <ModalShell onClose={onClose}>
      <h2 className="text-lg font-semibold">Configuración</h2>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Modo de hoja</p>
      <div className="mt-2 flex flex-col gap-2">
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => onChangeMode(card.id)}
            className={`rounded-lg border p-3 text-left transition-colors ${
              mode === card.id ? "border-primary bg-primary/10" : "border-border hover:border-ring"
            }`}
          >
            <p className="text-sm font-medium">{card.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{card.desc}</p>
          </button>
        ))}
      </div>
      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Cerrar
        </button>
      </div>
    </ModalShell>
  )
}

export function UnsavedChangesDialog({
  fileName,
  onSave,
  onDiscard,
  onCancel,
}: {
  fileName: string
  onSave: () => void
  onDiscard: () => void
  onCancel: () => void
}) {
  return (
    <ModalShell onClose={onCancel}>
      <h2 className="text-base font-semibold">¿Quieres guardar los cambios de “{fileName}”?</h2>
      <p className="mt-2 text-sm text-muted-foreground">Si no los guardas, se perderán.</p>
      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onSave}
          className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Guardar
        </button>
        <button type="button" onClick={onDiscard} className="h-9 rounded-md border border-border px-4 text-sm hover:bg-muted">
          No guardar
        </button>
        <button type="button" onClick={onCancel} className="h-9 rounded-md px-4 text-sm text-muted-foreground hover:bg-muted">
          Cancelar
        </button>
      </div>
    </ModalShell>
  )
}

export function ConfirmDeleteDialog({
  name,
  onConfirm,
  onCancel,
}: {
  name: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <ModalShell onClose={onCancel}>
      <h2 className="text-base font-semibold">¿Eliminar “{name}”?</h2>
      <p className="mt-2 text-sm text-muted-foreground">Se moverá a la papelera del sistema.</p>
      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onConfirm}
          className="h-9 rounded-md bg-destructive px-4 text-sm font-medium text-white hover:opacity-90"
        >
          Mover a la papelera
        </button>
        <button type="button" onClick={onCancel} className="h-9 rounded-md px-4 text-sm text-muted-foreground hover:bg-muted">
          Cancelar
        </button>
      </div>
    </ModalShell>
  )
}
