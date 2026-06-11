import { useRef } from 'react'
import { ArrowLeft, List, ListOrdered, LineChart, Minus, Plus, ImageIcon, GitBranch } from 'lucide-react'
import type { Editor } from '@tiptap/react'
import TablePicker from './TablePicker'
import TableControls from './TableControls'
import FileMenu from '../Layout/FileMenu'
import { useSettingsStore } from '../../store/settingsStore'

const btn = 'flex h-7 min-w-7 items-center justify-center rounded px-1.5 text-sm hover:bg-muted'
const btnActive = `${btn} bg-muted text-foreground`
const sep = <span className="mx-1 h-5 w-px bg-border" />

function ZoomControl() {
  const zoom = useSettingsStore((s) => s.zoom)
  const setZoom = useSettingsStore((s) => s.setZoom)
  return (
    <div className="ml-auto flex items-center gap-1.5">
      <button type="button" className={btn} onClick={() => setZoom(zoom - 0.1)} aria-label="Alejar (Ctrl+−)">
        <Minus className="size-4" aria-hidden />
      </button>
      <input
        type="range"
        min={50}
        max={200}
        step={10}
        value={Math.round(zoom * 100)}
        onChange={(e) => setZoom(Number(e.target.value) / 100)}
        className="h-1 w-28 accent-primary"
        aria-label="Zoom"
      />
      <button type="button" className={btn} onClick={() => setZoom(zoom + 0.1)} aria-label="Acercar (Ctrl++)">
        <Plus className="size-4" aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => setZoom(1)}
        className="w-12 rounded px-1 text-right text-xs tabular-nums text-muted-foreground hover:text-foreground"
      >
        {Math.round(zoom * 100)}%
      </button>
    </div>
  )
}

interface ToolbarProps {
  editor: Editor | null
  fileName: string
  isDirty: boolean
  onHome: () => void
  onNew: () => void
  onOpen: () => void
  onSave: () => void
  onExportPdf: () => void
  onSettings: () => void
}

export default function Toolbar({ editor, fileName, isDirty, onHome, onNew, onOpen, onSave, onExportPdf, onSettings }: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  function insertImageFromFile(file: File) {
    if (!editor) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const src = e.target?.result as string
      if (src) editor.chain().focus().setImage({ src }).run()
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border bg-sidebar px-2 py-1.5">
      <button
        type="button"
        onClick={onHome}
        className="flex h-7 items-center gap-1 rounded px-2 text-sm hover:bg-muted"
      >
        <ArrowLeft className="size-4" aria-hidden /> Inicio
      </button>

      <FileMenu
        onHome={onHome}
        onNew={onNew}
        onOpen={onOpen}
        onSave={onSave}
        onExportPdf={onExportPdf}
        onSettings={onSettings}
      />

      <div className="flex items-center gap-1.5 px-2 text-sm">
        <span className="truncate text-muted-foreground">{fileName}</span>
        {isDirty && <span className="size-1.5 rounded-full bg-primary" aria-label="Cambios sin guardar" />}
      </div>

      {sep}

      {editor && (
        <>
          <button
            type="button"
            className={editor.isActive('heading', { level: 1 }) ? btnActive : btn}
            onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 1 }).run() }}
          >H1</button>
          <button
            type="button"
            className={editor.isActive('heading', { level: 2 }) ? btnActive : btn}
            onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 2 }).run() }}
          >H2</button>
          <button
            type="button"
            className={editor.isActive('heading', { level: 3 }) ? btnActive : btn}
            onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 3 }).run() }}
          >H3</button>

          {sep}

          <button
            type="button"
            className={`${editor.isActive('bold') ? btnActive : btn} font-bold`}
            onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run() }}
          >B</button>
          <button
            type="button"
            className={`${editor.isActive('underline') ? btnActive : btn} underline`}
            onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleUnderline().run() }}
          >U</button>
          <button
            type="button"
            className={`${editor.isActive('strike') ? btnActive : btn} line-through`}
            onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleStrike().run() }}
          >S</button>

          {sep}

          <button
            type="button"
            className={editor.isActive('bulletList') ? btnActive : btn}
            onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run() }}
            aria-label="Lista de viñetas"
          >
            <List className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            className={editor.isActive('orderedList') ? btnActive : btn}
            onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run() }}
            aria-label="Lista numerada"
          >
            <ListOrdered className="size-4" aria-hidden />
          </button>

          {sep}

          <TablePicker editor={editor} />
          <TableControls editor={editor} />

          <button
            type="button"
            className={`${btn} gap-1 px-2`}
            onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().insertContent({ type: 'cartesianPlane' }).run() }}
          >
            <LineChart className="size-4" aria-hidden /> Plano
          </button>

          <button
            type="button"
            className={`${btn} gap-1 px-2`}
            onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().insertContent({ type: 'mermaidBlock' }).run() }}
            title="Insertar diagrama Mermaid (flujo, secuencia, estados)"
          >
            <GitBranch className="size-4" aria-hidden /> Diagrama
          </button>

          <button
            type="button"
            className={`${btn} gap-1 px-2`}
            onMouseDown={(e) => { e.preventDefault(); fileInputRef.current?.click() }}
            title="Insertar imagen desde archivo"
          >
            <ImageIcon className="size-4" aria-hidden /> Imagen
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) insertImageFromFile(file)
              e.target.value = ''
            }}
          />
        </>
      )}

      <ZoomControl />
    </div>
  )
}
