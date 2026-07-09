import { useEffect, useRef, useState } from 'react'
import { EditorContent } from '@tiptap/react'
import type { Editor } from '@tiptap/react'
import Toolbar from './Toolbar'
import PostItLayer from './PostItLayer'
import FlashcardLayer from './FlashcardLayer'
import ReviewMode from './ReviewMode'
import { PAGE_HEIGHT, PAGE_WIDTH, PAGE_MARGIN } from './pageMetrics'
import { useSettingsStore } from '../../store/settingsStore'

interface Props {
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

export default function HelechoEditor({ editor, fileName, isDirty, onHome, onNew, onOpen, onSave, onExportPdf, onSettings }: Props) {
  const [pageCount, setPageCount] = useState(1)
  const [contentHeight, setContentHeight] = useState(PAGE_HEIGHT)
  const [reviewOpen, setReviewOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const strict = useSettingsStore((s) => s.pageMode) === 'estricta'
  const zoom = useSettingsStore((s) => s.zoom)

  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    const observer = new ResizeObserver(() => {
      // offsetHeight incluye el padding (los márgenes de la hoja) y no
      // se ve afectado por el transform del zoom. Se descuenta el margen
      // inferior para no contar una hoja extra cuando el texto termina
      // justo en el límite.
      setContentHeight(el.offsetHeight)
      const h = el.offsetHeight - PAGE_MARGIN
      setPageCount(Math.max(1, Math.ceil(h / PAGE_HEIGHT)))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [strict])

  const totalHeight = pageCount * PAGE_HEIGHT
  // Alto real de la hoja según el modo, para dimensionar el área con zoom
  const sheetHeight = strict ? totalHeight : Math.max(contentHeight, PAGE_HEIGHT)

  const editorContent = (
    <div
      ref={contentRef}
      className="relative z-10 text-zinc-900"
      style={{ padding: PAGE_MARGIN }}
    >
      <EditorContent editor={editor} />
      {/* Post-its y tarjetas flotantes: dentro del contenedor del contenido
          para compartir coordenadas, zoom y scroll con el texto */}
      <PostItLayer editor={editor} />
      <FlashcardLayer editor={editor} />
    </div>
  )

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Toolbar
        editor={editor}
        fileName={fileName}
        isDirty={isDirty}
        onHome={onHome}
        onNew={onNew}
        onOpen={onOpen}
        onSave={onSave}
        onExportPdf={onExportPdf}
        onSettings={onSettings}
        onReview={() => setReviewOpen(true)}
      />

      {reviewOpen && editor && (
        <ReviewMode editor={editor} onClose={() => setReviewOpen(false)} />
      )}
      <div className="flex-1 overflow-auto py-8 bg-[#e7e9e6]">
        {/* Caja exterior con el tamaño YA escalado: así el scroll y el
            centrado funcionan bien a cualquier nivel de zoom */}
        <div
          className="mx-auto"
          style={{ width: PAGE_WIDTH * zoom, height: sheetHeight * zoom }}
        >
        <div style={{ width: PAGE_WIDTH, transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
        {strict ? (
          <div
            className="relative cursor-text"
            style={{ width: PAGE_WIDTH, minHeight: totalHeight }}
            onClick={() => editor?.commands.focus()}
          >
            {/* Hojas de fondo, una por página */}
            {Array.from({ length: pageCount }).map((_, i) => (
              <div
                key={i}
                className="absolute w-full bg-white shadow-md"
                style={{ top: i * PAGE_HEIGHT, height: PAGE_HEIGHT }}
              />
            ))}

            {/* Línea separadora entre hojas */}
            {Array.from({ length: pageCount - 1 }).map((_, i) => (
              <div
                key={`sep-${i}`}
                className="absolute w-full pointer-events-none"
                style={{
                  top: (i + 1) * PAGE_HEIGHT - 1,
                  height: 2,
                  backgroundColor: '#a1a1aa',
                  zIndex: 20,
                }}
              />
            ))}

            {/* Número de página */}
            {Array.from({ length: pageCount }).map((_, i) => (
              <div
                key={`num-${i}`}
                className="absolute w-full text-center text-xs text-zinc-400 pointer-events-none select-none"
                style={{ top: (i + 1) * PAGE_HEIGHT - PAGE_MARGIN / 2 - 8, zIndex: 15 }}
              >
                {i + 1}
              </div>
            ))}

            {editorContent}
          </div>
        ) : (
          /* Modo fluido: una sola hoja continua que crece con el contenido */
          <div
            className="relative cursor-text bg-white shadow-md h-fit"
            style={{ width: PAGE_WIDTH, minHeight: PAGE_HEIGHT }}
            onClick={() => editor?.commands.focus()}
          >
            {editorContent}
          </div>
        )}
        </div>
        </div>
      </div>
    </div>
  )
}
