import type { Editor } from '@tiptap/react'
import { X } from 'lucide-react'

interface Props {
  editor: Editor
}

interface CtrlBtnProps {
  onClick: () => void
  title: string
  danger?: boolean
  children: React.ReactNode
}

function CtrlBtn({ onClick, title, danger, children }: CtrlBtnProps) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      title={title}
      className={`flex h-7 items-center rounded px-1.5 text-sm transition-colors
        ${danger
          ? 'text-destructive hover:bg-destructive/10'
          : 'hover:bg-muted text-foreground/70'
        }`}
    >
      {children}
    </button>
  )
}

export default function TableControls({ editor }: Props) {
  if (!editor.isActive('table')) return null

  return (
    <>
      <span className="mx-1 h-5 w-px bg-border" />
      <CtrlBtn onClick={() => editor.chain().focus().addRowAfter().run()} title="Agregar fila debajo">+ Fila</CtrlBtn>
      <CtrlBtn onClick={() => editor.chain().focus().addColumnAfter().run()} title="Agregar columna a la derecha">+ Col</CtrlBtn>
      <CtrlBtn onClick={() => editor.chain().focus().deleteRow().run()} title="Eliminar fila actual">− Fila</CtrlBtn>
      <CtrlBtn onClick={() => editor.chain().focus().deleteColumn().run()} title="Eliminar columna actual">− Col</CtrlBtn>
      <CtrlBtn onClick={() => editor.chain().focus().deleteTable().run()} title="Eliminar tabla completa" danger>
        <X className="size-4 mr-0.5" aria-hidden /> Tabla
      </CtrlBtn>
    </>
  )
}
