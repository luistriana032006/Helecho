import { useRef } from 'react'
import { ArrowLeft, List, ListOrdered, LineChart, Minus, Plus, ImageIcon, GitBranch, StickyNote, Layers, GraduationCap, Share2, BarChart3, Columns3 } from 'lucide-react'
import type { Editor } from '@tiptap/react'
import TablePicker from './TablePicker'
import TableControls from './TableControls'
import PomodoroWidget from './PomodoroWidget'
import CalculatorButton from './CalculatorButton'
import FileMenu from '../Layout/FileMenu'
import { useSettingsStore } from '../../store/settingsStore'
import { EDITOR_FONTS, fontByStack, fontById } from '../../../shared/fonts'
import { alertDialog } from '../../lib/confirmDialog'
import { useT } from '../../lib/i18n'

/** ¿El cursor está dentro de una sección de columnas? */
function isInColumn(editor: Editor): boolean {
  const { $from } = editor.state.selection
  for (let d = $from.depth; d > 0; d--) {
    const name = $from.node(d).type.name
    if (name === 'column' || name === 'columnBlock') return true
  }
  return false
}

/** Selector de tipografía por selección (estilo Word). Vacío = la fuente
 *  por defecto del editor; cada opción se previsualiza con su propia pila. */
function FontSelect({ editor }: { editor: Editor }) {
  const t = useT()
  const currentStack = (editor.getAttributes('textStyle').fontFamily as string | undefined) ?? ''
  const currentId = currentStack ? fontByStack(currentStack)?.id ?? '' : ''
  return (
    <select
      value={currentId}
      onMouseDown={(e) => e.stopPropagation()}
      onChange={(e) => {
        const font = fontById(e.target.value)
        if (font) editor.chain().focus().setFontFamily(font.stack).run()
        else editor.chain().focus().unsetFontFamily().run()
      }}
      title={t('Tipografía del texto seleccionado')}
      aria-label={t('Tipografía')}
      className="h-7 max-w-36 rounded border border-border bg-background px-1 text-xs outline-none hover:bg-muted"
    >
      <option value="">{t('Predeterminada')}</option>
      {EDITOR_FONTS.map((f) => (
        <option key={f.id} value={f.id} style={{ fontFamily: f.stack }}>
          {f.label}
        </option>
      ))}
    </select>
  )
}

const FONT_SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32, 40]

/** Tamaño del texto seleccionado, en px. Vacío = tamaño por defecto. */
function FontSizeSelect({ editor }: { editor: Editor }) {
  const t = useT()
  const raw = (editor.getAttributes('textStyle').fontSize as string | undefined) ?? ''
  const current = raw ? String(parseInt(raw, 10)) : ''
  return (
    <select
      value={current}
      onMouseDown={(e) => e.stopPropagation()}
      onChange={(e) => {
        if (e.target.value) editor.chain().focus().setFontSize(`${e.target.value}px`).run()
        else editor.chain().focus().unsetFontSize().run()
      }}
      title={t('Tamaño del texto seleccionado')}
      aria-label={t('Tamaño de texto')}
      className="h-7 rounded border border-border bg-background px-1 text-xs outline-none hover:bg-muted"
    >
      <option value="">{t('Tamaño')}</option>
      {FONT_SIZES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  )
}

const btn = 'flex h-7 min-w-7 items-center justify-center rounded px-1.5 text-sm hover:bg-muted'
const btnActive = `${btn} bg-muted text-foreground`
const sep = <span className="mx-1 h-5 w-px bg-border" />

function ZoomControl() {
  const t = useT()
  const zoom = useSettingsStore((s) => s.zoom)
  const setZoom = useSettingsStore((s) => s.setZoom)
  return (
    <div className="ml-auto flex items-center gap-1.5">
      <button type="button" className={btn} onClick={() => setZoom(zoom - 0.1)} aria-label={t('Alejar (Ctrl+−)')}>
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
      <button type="button" className={btn} onClick={() => setZoom(zoom + 0.1)} aria-label={t('Acercar (Ctrl++)')}>
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
  onReview: () => void
}

export default function Toolbar({ editor, fileName, isDirty, onHome, onNew, onOpen, onSave, onExportPdf, onSettings, onReview }: ToolbarProps) {
  const t = useT()
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
        <ArrowLeft className="size-4" aria-hidden /> {t('Inicio')}
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
        {isDirty && <span className="size-1.5 rounded-full bg-primary" aria-label={t('Cambios sin guardar')} />}
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

          <FontSelect editor={editor} />
          <FontSizeSelect editor={editor} />

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
            aria-label={t('Lista de viñetas')}
          >
            <List className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            className={editor.isActive('orderedList') ? btnActive : btn}
            onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run() }}
            aria-label={t('Lista numerada')}
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
            <LineChart className="size-4" aria-hidden /> {t('Plano')}
          </button>

          <button
            type="button"
            className={`${btn} gap-1 px-2`}
            onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().insertContent({ type: 'mermaidBlock' }).run() }}
            title={t('Insertar diagrama Mermaid (flujo, secuencia, estados)')}
          >
            <GitBranch className="size-4" aria-hidden /> {t('Diagrama')}
          </button>

          <button
            type="button"
            className={`${btn} gap-1 px-2`}
            onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().insertContent({ type: 'discreteGraph' }).run() }}
            title={t('Insertar grafo de Discreta (nodos y aristas, 2D)')}
          >
            <Share2 className="size-4" aria-hidden /> {t('Grafo')}
          </button>

          <button
            type="button"
            className={`${btn} gap-1 px-2`}
            onMouseDown={(e) => {
              e.preventDefault()
              // Por ahora las gráficas no se permiten dentro de columnas (su
              // render disparaba un bucle de medición). Aviso y no se inserta.
              if (isInColumn(editor)) {
                void alertDialog(
                  t('Por ahora las gráficas no se pueden colocar dentro de columnas.\n\nInsértala fuera de la sección de columnas.')
                )
                return
              }
              editor.chain().focus().insertContent({ type: 'plotlyChart' }).run()
            }}
            title={t('Insertar gráfica de datos editable (barras, líneas, dispersión, pastel)')}
          >
            <BarChart3 className="size-4" aria-hidden /> {t('Gráfica')}
          </button>

          <button
            type="button"
            className={`${btn} gap-1 px-2`}
            onMouseDown={(e) => {
              e.preventDefault()
              // Se inserta la sección + un párrafo vacío después, para que
              // siempre quede un renglón donde seguir escribiendo fuera de las
              // columnas (junto con el Gapcursor evita que el cursor se atasque).
              editor.chain().focus().insertContent([
                {
                  type: 'columnBlock',
                  content: [
                    { type: 'column', content: [{ type: 'paragraph' }] },
                    { type: 'column', content: [{ type: 'paragraph' }] },
                  ],
                },
                { type: 'paragraph' },
              ]).run()
            }}
            title={t('Insertar columnas (2 o 3) — el texto y las gráficas se acomodan dentro de cada columna')}
          >
            <Columns3 className="size-4" aria-hidden /> {t('Columnas')}
          </button>

          <button
            type="button"
            className={`${btn} gap-1 px-2`}
            onMouseDown={(e) => {
              e.preventDefault()
              editor.chain().focus().insertContent([
                { type: 'postit', attrs: { id: crypto.randomUUID() } },
                { type: 'text', text: ' ' },
              ]).run()
            }}
            title={t('Post-it anclado al punto del texto donde está el cursor')}
          >
            <StickyNote className="size-4" aria-hidden /> Post-it
          </button>

          <button
            type="button"
            className={`${btn} gap-1 px-2`}
            onMouseDown={(e) => {
              e.preventDefault()
              editor.chain().focus().insertContent([
                { type: 'flashcard', attrs: { id: crypto.randomUUID() } },
                { type: 'text', text: ' ' },
              ]).run()
            }}
            title={t('Tarjeta de repaso anclada al texto, arrastrable sobre la hoja')}
          >
            <Layers className="size-4" aria-hidden /> {t('Tarjeta')}
          </button>

          <button
            type="button"
            className={`${btn} gap-1 px-2`}
            onMouseDown={(e) => { e.preventDefault(); onReview() }}
            title={t('Repasar todas las tarjetas del cuadernillo (barajadas)')}
          >
            <GraduationCap className="size-4" aria-hidden /> {t('Repasar')}
          </button>

          <button
            type="button"
            className={`${btn} gap-1 px-2`}
            onMouseDown={(e) => { e.preventDefault(); fileInputRef.current?.click() }}
            title={t('Insertar imagen desde archivo')}
          >
            <ImageIcon className="size-4" aria-hidden /> {t('Imagen')}
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

          <CalculatorButton editor={editor} />
        </>
      )}

      <PomodoroWidget />
      <ZoomControl />
    </div>
  )
}
