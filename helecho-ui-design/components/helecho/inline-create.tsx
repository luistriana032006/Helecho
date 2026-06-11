"use client"

import { useState } from "react"
import { X } from "lucide-react"

interface InlineCreateProps {
  placeholder: string
  onCreate: (name: string) => void
  onCancel: () => void
}

export function InlineCreate({ placeholder, onCreate, onCancel }: InlineCreateProps) {
  const [value, setValue] = useState("")
  const trimmed = value.trim()

  return (
    <div className="flex items-center gap-2">
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && trimmed) onCreate(trimmed)
          if (e.key === "Escape") onCancel()
        }}
        placeholder={placeholder}
        className="h-8 flex-1 rounded-md border border-input bg-background px-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring"
      />
      <button
        type="button"
        disabled={!trimmed}
        onClick={() => onCreate(trimmed)}
        className="h-8 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
      >
        Crear
      </button>
      <button
        type="button"
        onClick={onCancel}
        aria-label="Cancelar"
        className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  )
}
