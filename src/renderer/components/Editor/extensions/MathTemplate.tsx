import { useEffect, useRef, useState } from 'react'
import { Node as TiptapNode, mergeAttributes } from '@tiptap/core'
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react'
import katex from 'katex'
import { templateById } from './mathTemplates'

/**
 * Bloque de función editable: nodo inline atómico que guarda el id de una
 * plantilla (mathTemplates) y los valores de sus campos. Se renderiza con
 * KaTeX y, al hacer clic, abre un popover con un input por campo — el usuario
 * le da valor a las letras de adentro SIN escribir LaTeX.
 */
function MathTemplateView({ node, updateAttributes, selected }: NodeViewProps) {
  const templateId = (node.attrs.template as string) ?? ''
  const values = (node.attrs.values as Record<string, string>) ?? {}
  const def = templateById(templateId)

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Record<string, string>>(values)
  const wrapRef = useRef<HTMLSpanElement>(null)

  const latex = def ? def.toLatex(editing ? draft : values) : templateId
  const html = katex.renderToString(latex, { throwOnError: false, displayMode: false })

  // Confirmar y cerrar al hacer clic fuera del popover
  useEffect(() => {
    if (!editing) return
    const close = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        updateAttributes({ values: draft })
        setEditing(false)
      }
    }
    window.addEventListener('mousedown', close)
    return () => window.removeEventListener('mousedown', close)
  }, [editing, draft, updateAttributes])

  const open = () => {
    setDraft(values)
    setEditing(true)
  }

  const confirm = () => {
    updateAttributes({ values: draft })
    setEditing(false)
  }

  return (
    <NodeViewWrapper
      ref={wrapRef}
      as="span"
      data-type="math-template"
      // Los eventos se quedan aquí o el "clic enfoca el editor" del contenedor
      // roba el foco a los inputs (gotcha de overlays interactivos)
      onMouseDown={(e: React.MouseEvent) => { if (editing) e.stopPropagation() }}
      className={`math-template relative inline-block cursor-pointer rounded px-0.5 align-middle ${
        selected || editing ? 'bg-blue-50 ring-2 ring-blue-300' : 'hover:bg-blue-50'
      }`}
      title="Bloque editable — clic para dar valores"
    >
      <span onClick={open} dangerouslySetInnerHTML={{ __html: html }} />

      {editing && def && (
        <span
          contentEditable={false}
          onMouseDown={(e) => e.stopPropagation()}
          className="math-template-editor absolute left-0 top-full z-50 mt-1 flex w-56 flex-col gap-1.5 rounded-lg border border-zinc-200 bg-white p-2 text-left shadow-xl"
        >
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
            {def.name}
          </span>
          {def.fields.map((field) => (
            <label key={field.key} className="flex items-center gap-2 text-xs text-zinc-500">
              <span className="w-20 shrink-0 text-right">{field.label}</span>
              <input
                value={draft[field.key] ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, [field.key]: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); confirm() }
                  else if (e.key === 'Escape') setEditing(false)
                }}
                className="min-w-0 flex-1 rounded border border-zinc-300 bg-zinc-50 px-1.5 py-1 text-sm text-zinc-800 outline-none focus:border-blue-400"
              />
            </label>
          ))}
          <button
            onClick={confirm}
            className="mt-0.5 self-end rounded bg-blue-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-blue-500"
          >
            Listo
          </button>
        </span>
      )}
    </NodeViewWrapper>
  )
}

export const MathTemplate = TiptapNode.create({
  name: 'mathTemplate',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      template: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-template') ?? '',
        renderHTML: (attrs) => ({ 'data-template': attrs.template as string }),
      },
      values: {
        default: {} as Record<string, string>,
        parseHTML: (el) => {
          try {
            return JSON.parse(el.getAttribute('data-values') ?? '{}') as Record<string, string>
          } catch {
            return {}
          }
        },
        renderHTML: (attrs) => ({ 'data-values': JSON.stringify(attrs.values) }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-type="math-template"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-type': 'math-template' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathTemplateView)
  },
})
