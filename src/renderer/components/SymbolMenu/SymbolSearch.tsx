interface Props {
  value: string
  onChange: (v: string) => void
}

export default function SymbolSearch({ value, onChange }: Props) {
  return (
    <div className="border-b border-border p-2">
      <input
        type="text"
        placeholder="Buscar símbolo…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 w-full rounded border border-input bg-background px-2 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-ring"
      />
    </div>
  )
}
