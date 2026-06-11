import { InputRule, Node, mergeAttributes } from '@tiptap/core'
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react'
import katex from 'katex'

function MathInlineView({ node, selected }: NodeViewProps) {
  const latex = (node.attrs.latex as string) ?? ''
  const html = katex.renderToString(latex, {
    throwOnError: false,
    displayMode: false,
  })
  return (
    <NodeViewWrapper
      as="span"
      className={`math-inline select-none rounded px-0.5 ${
        selected ? 'ring-2 ring-blue-400 bg-blue-50' : ''
      }`}
      title="Fórmula matemática — click para seleccionar, Supr para eliminar"
    >
      <span dangerouslySetInnerHTML={{ __html: html }} />
    </NodeViewWrapper>
  )
}

export const MathInline = Node.create({
  name: 'mathInline',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      latex: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-latex') ?? '',
        renderHTML: (attrs) => ({ 'data-latex': attrs.latex }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-type="math-inline"]' }]
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'math-inline',
        'data-latex': node.attrs.latex,
      }),
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathInlineView)
  },

  addInputRules() {
    return [
      // Fracción automática: escribir "7/8" (o "x/2", "3.5/4") seguido de
      // espacio la convierte en fracción visual apilada (\frac).
      // El lookbehind evita romper fechas tipo 10/06/2026 (el segundo
      // tramo viene precedido de "/" y no se convierte).
      // Backspace inmediato deshace la conversión (comportamiento estándar
      // de las input rules de TipTap).
      new InputRule({
        find: /(?<![\w/])(\d+(?:\.\d+)?|[a-zA-Z])\/(\d+(?:\.\d+)?|[a-zA-Z]) $/,
        handler: ({ range, match, chain }) => {
          const [, numerador, denominador] = match
          chain()
            .deleteRange(range)
            .insertContent([
              {
                type: this.name,
                attrs: { latex: `\\frac{${numerador}}{${denominador}}` },
              },
              { type: 'text', text: ' ' },
            ])
            .run()
        },
      }),
    ]
  },
})
