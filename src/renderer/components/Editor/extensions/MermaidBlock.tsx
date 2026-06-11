import { useEffect, useRef, useState } from 'react'
import { Node } from '@tiptap/core'
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react'
import mermaid from 'mermaid'

mermaid.initialize({
  startOnLoad: false,
  theme: 'neutral',
  fontFamily: 'inherit',
})

const DEFAULT_CODE = `flowchart TD
    A[Inicio] --> B{¿Condición?}
    B -- Sí --> C[Hacer algo]
    B -- No --> D[Hacer otra cosa]
    C --> E[Fin]
    D --> E`

// Plantillas de los tres tipos de diagrama soportados en V2
const TEMPLATES: { label: string; code: string }[] = [
  { label: 'Flujo', code: DEFAULT_CODE },
  {
    label: 'Secuencia',
    code: `sequenceDiagram
    participant A as Cliente
    participant B as Servidor
    A->>B: Petición
    B-->>A: Respuesta`,
  },
  {
    label: 'Estados',
    code: `stateDiagram-v2
    [*] --> Inactivo
    Inactivo --> Activo : iniciar
    Activo --> Inactivo : detener
    Activo --> [*] : terminar`,
  },
]

let renderSeq = 0

function MermaidView({ node, updateAttributes, selected }: NodeViewProps) {
  const code = (node.attrs.code as string) ?? ''
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(code)
  const [error, setError] = useState<string | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  // Renderiza el código actual (o el borrador mientras se edita) a SVG.
  // mermaid.render es async y deja un nodo huérfano si el código falla:
  // se limpia por id en el catch.
  useEffect(() => {
    const source = editing ? draft : code
    const target = previewRef.current
    if (!target) return
    if (!source.trim()) {
      target.innerHTML = ''
      setError(null)
      return
    }
    let cancelled = false
    const id = `mermaid-${++renderSeq}`
    mermaid
      .render(id, source)
      .then(({ svg }) => {
        if (cancelled) return
        target.innerHTML = svg
        setError(null)
      })
      .catch((err: unknown) => {
        document.getElementById(`d${id}`)?.remove()
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Diagrama inválido')
      })
    return () => {
      cancelled = true
    }
  }, [code, draft, editing])

  const startEditing = () => {
    setDraft(code)
    setEditing(true)
  }

  const confirm = () => {
    updateAttributes({ code: draft })
    setEditing(false)
  }

  const cancel = () => {
    setDraft(code)
    setEditing(false)
    setError(null)
  }

  return (
    <NodeViewWrapper
      as="div"
      contentEditable={false}
      className={`mermaid-block my-3 rounded-lg border bg-white p-2 select-none ${
        selected ? 'border-blue-400 ring-2 ring-blue-200' : 'border-zinc-200'
      }`}
    >
      {/* Controles del diagrama — se excluyen del PDF (.mermaid-toolbar) */}
      <div className="mermaid-toolbar mb-1 flex flex-wrap items-center gap-1.5">
        {!editing ? (
          <button
            onClick={startEditing}
            className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 hover:bg-zinc-200"
          >
            ✎ Editar diagrama
          </button>
        ) : (
          <>
            {TEMPLATES.map((t) => (
              <button
                key={t.label}
                onClick={() => setDraft(t.code)}
                title={`Plantilla: diagrama de ${t.label.toLowerCase()}`}
                className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 hover:bg-zinc-200"
              >
                {t.label}
              </button>
            ))}
            <button
              onClick={confirm}
              disabled={error !== null}
              className="ml-auto rounded bg-blue-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-40"
            >
              Listo
            </button>
            <button
              onClick={cancel}
              className="rounded px-1.5 py-0.5 text-xs text-zinc-500 hover:bg-zinc-200"
            >
              Cancelar
            </button>
          </>
        )}
      </div>

      {editing && (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          spellCheck={false}
          rows={Math.max(4, draft.split('\n').length)}
          className="mermaid-toolbar mb-1 w-full resize-y rounded border border-zinc-300 bg-zinc-50 p-2 font-mono text-xs text-zinc-800 outline-none focus:border-blue-400"
        />
      )}

      {error && (
        <p className="mermaid-toolbar mb-1 rounded bg-red-50 px-2 py-1 text-xs text-red-600">
          {error}
        </p>
      )}

      {/* Vista previa: el SVG vive en el DOM y se clona tal cual al PDF */}
      <div ref={previewRef} className="mermaid-preview flex justify-center overflow-x-auto" />
    </NodeViewWrapper>
  )
}

export const MermaidBlock = Node.create({
  name: 'mermaidBlock',
  group: 'block',
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      code: { default: DEFAULT_CODE },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="mermaid-block"]',
        getAttrs: (el) => ({
          code: (el as HTMLElement).getAttribute('data-code') ?? DEFAULT_CODE,
        }),
      },
    ]
  },

  renderHTML({ node }) {
    return [
      'div',
      {
        'data-type': 'mermaid-block',
        'data-code': String(node.attrs.code),
      },
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(MermaidView)
  },
})
