import { useState } from 'react'
import { X } from 'lucide-react'
import { useT } from '../../lib/i18n'

interface Props {
  placeholder: string
  onSubmit: (value: string) => void
  onCancel: () => void
  size?: 'sm' | 'md'
  initialValue?: string
  submitLabel?: string
}

export default function InlineCreate({ placeholder, onSubmit, onCancel, size = 'md', initialValue = '', submitLabel }: Props) {
  const t = useT()
  const label = submitLabel ?? t('Crear')
  const [value, setValue] = useState(initialValue)
  const trimmed = value.trim()

  const submit = () => {
    if (trimmed) onSubmit(trimmed)
  }

  const sm = size === 'sm'

  return (
    <div className="flex w-full items-center gap-1.5">
      <input
        autoFocus
        value={value}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit()
          if (e.key === 'Escape') onCancel()
        }}
        onBlur={onCancel}
        className={`min-w-0 flex-1 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground outline-none focus:border-ring
          ${sm ? 'px-2 py-1 text-xs' : 'px-2.5 py-1.5 text-sm'}`}
      />
      <button
        onMouseDown={(e) => { e.preventDefault(); submit() }}
        disabled={!trimmed}
        title={`${label} (Enter)`}
        className={`rounded-md bg-primary font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40
          ${sm ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-xs'}`}
      >
        {label}
      </button>
      <button
        onMouseDown={(e) => { e.preventDefault(); onCancel() }}
        title={t('Cancelar (Esc)')}
        className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <X className="size-3.5" aria-hidden />
      </button>
    </div>
  )
}
