import { useEffect, useRef, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { Calculator } from 'lucide-react'
import { evaluate, format, parse } from 'mathjs'

interface Props {
  editor: Editor
}

interface HistItem {
  expr: string
  result: string
}

type Key =
  | { label: string; token: string }
  | { label: string; action: 'eval' | 'clear' | 'back'; span?: boolean }

// Teclado científico. Las funciones se mapean a la sintaxis de math.js:
// ln → log (logaritmo natural), log → log10, √ → sqrt, π → pi.
const KEYS: Key[][] = [
  [
    { label: 'sin', token: 'sin(' },
    { label: 'cos', token: 'cos(' },
    { label: 'tan', token: 'tan(' },
    { label: '√', token: 'sqrt(' },
    { label: '⌫', action: 'back' },
  ],
  [
    { label: 'ln', token: 'log(' },
    { label: 'log', token: 'log10(' },
    { label: '^', token: '^' },
    { label: '(', token: '(' },
    { label: ')', token: ')' },
  ],
  [
    { label: '7', token: '7' },
    { label: '8', token: '8' },
    { label: '9', token: '9' },
    { label: '÷', token: '/' },
    { label: 'C', action: 'clear' },
  ],
  [
    { label: '4', token: '4' },
    { label: '5', token: '5' },
    { label: '6', token: '6' },
    { label: '×', token: '*' },
    { label: 'π', token: 'pi' },
  ],
  [
    { label: '1', token: '1' },
    { label: '2', token: '2' },
    { label: '3', token: '3' },
    { label: '−', token: '-' },
    { label: 'e', token: 'e' },
  ],
  [
    { label: '0', token: '0' },
    { label: '.', token: '.' },
    { label: '+', token: '+' },
    { label: '=', action: 'eval', span: true },
  ],
]

/** Evalúa con math.js; precisión 12 limpia el ruido de coma flotante. */
function compute(expr: string): { result: string } | { error: string } {
  try {
    const value: unknown = evaluate(expr)
    if (value === undefined || typeof value === 'function') {
      return { error: 'Expresión incompleta' }
    }
    return { result: format(value, { precision: 12 }) }
  } catch {
    return { error: 'Expresión inválida' }
  }
}

/** LaTeX "expr = resultado" para insertar como fórmula (cae a texto si falla). */
function toTex(expr: string, result: string): string {
  try {
    return `${parse(expr).toTex()} = ${result}`
  } catch {
    return `${expr} = ${result}`
  }
}

/**
 * Calculadora científica como botón + popover en la barra del editor (no es
 * panel). Evalúa con math.js e inserta el resultado al apunte como fórmula
 * KaTeX (nodo mathInline) — coherente con "matemáticas sin escribir LaTeX".
 */
export default function CalculatorButton({ editor }: Props) {
  const [open, setOpen] = useState(false)
  const [expr, setExpr] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<HistItem[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    window.addEventListener('mousedown', close)
    return () => window.removeEventListener('mousedown', close)
  }, [open])

  const doEval = () => {
    if (!expr.trim()) return
    const r = compute(expr)
    if ('error' in r) {
      setError(r.error)
      setResult(null)
    } else {
      setError(null)
      setResult(r.result)
      setHistory((h) => [{ expr, result: r.result }, ...h].slice(0, 5))
    }
  }

  const press = (key: Key) => {
    if ('token' in key) {
      setExpr((e) => e + key.token)
      setError(null)
    } else if (key.action === 'clear') {
      setExpr('')
      setResult(null)
      setError(null)
    } else if (key.action === 'back') {
      setExpr((e) => e.slice(0, -1))
    } else {
      doEval()
    }
    inputRef.current?.focus()
  }

  const insertResult = () => {
    if (result === null) return
    editor.chain().focus().insertContent({ type: 'mathInline', attrs: { latex: toTex(expr, result) } }).run()
    setOpen(false)
  }

  const keyBtn =
    'flex h-7 items-center justify-center rounded text-sm text-foreground/80 hover:bg-muted'

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); setOpen((v) => !v) }}
        title="Calculadora científica"
        className={`flex h-7 min-w-7 items-center justify-center gap-1 rounded px-2 text-sm transition-colors ${
          open ? 'bg-muted text-foreground' : 'hover:bg-muted'
        }`}
      >
        <Calculator className="size-4" aria-hidden /> Calc
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-60 rounded-lg border border-border bg-popover p-2 shadow-xl">
          <input
            ref={inputRef}
            autoFocus
            value={expr}
            onChange={(e) => { setExpr(e.target.value); setError(null) }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); doEval() }
              else if (e.key === 'Escape') setOpen(false)
            }}
            placeholder="2 + 2 · sin(pi/2)"
            spellCheck={false}
            className="w-full rounded border border-border bg-background px-2 py-1 text-sm outline-none focus:border-primary"
          />

          <div className="mt-1 min-h-6 px-1 text-right text-sm">
            {error ? (
              <span className="text-destructive">{error}</span>
            ) : result !== null ? (
              <span className="font-semibold text-foreground">= {result}</span>
            ) : (
              <span className="text-muted-foreground/50">…</span>
            )}
          </div>

          <div className="mt-1 grid grid-cols-5 gap-1">
            {KEYS.flat().map((key, i) => (
              <button
                key={i}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); press(key) }}
                className={`${keyBtn} ${'action' in key && key.span ? 'col-span-2' : ''} ${
                  'action' in key && key.action === 'eval' ? 'bg-primary/80 text-primary-foreground hover:bg-primary' : 'bg-card'
                }`}
              >
                {key.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled={result === null}
            onMouseDown={(e) => { e.preventDefault(); insertResult() }}
            className="mt-2 w-full rounded bg-primary px-2 py-1 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
          >
            Insertar al apunte
          </button>

          {history.length > 0 && (
            <div className="mt-2 border-t border-border pt-1">
              {history.map((h, i) => (
                <button
                  key={i}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); setExpr(h.expr); setResult(h.result); setError(null) }}
                  title="Volver a usar"
                  className="flex w-full items-center justify-between gap-2 rounded px-1 py-0.5 text-xs text-muted-foreground hover:bg-muted"
                >
                  <span className="truncate">{h.expr}</span>
                  <span className="shrink-0 font-medium text-foreground/70">= {h.result}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
