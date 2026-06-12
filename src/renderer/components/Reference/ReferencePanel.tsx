import { useRef, useState } from 'react'
import { BookOpen, X, ChevronsRight, ChevronsLeft } from 'lucide-react'
import * as XLSX from 'xlsx'
import { useSettingsStore } from '../../store/settingsStore'
import ResizeHandle from '../common/ResizeHandle'

const MAX_ROWS = 500

interface ExcelSheet {
  name: string
  rows: string[][]
  truncated: boolean
}

type RefDoc =
  | { kind: 'pdf'; name: string; url: string }
  | { kind: 'excel'; name: string; sheets: ExcelSheet[] }

function parseExcel(name: string, data: Uint8Array): RefDoc {
  const workbook = XLSX.read(data, { type: 'array' })
  const sheets: ExcelSheet[] = workbook.SheetNames.map((sheetName) => {
    const raw = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], {
      header: 1,
    }) as unknown[][]
    return {
      name: sheetName,
      rows: raw.slice(0, MAX_ROWS).map((row) => row.map((c) => (c == null ? '' : String(c)))),
      truncated: raw.length > MAX_ROWS,
    }
  })
  return { kind: 'excel', name, sheets }
}

export default function ReferencePanel() {
  const [collapsed, setCollapsed] = useState(true)
  const [doc, setDoc] = useState<RefDoc | null>(null)
  const [busy, setBusy] = useState(false)
  const [activeSheet, setActiveSheet] = useState(0)
  const panelRef = useRef<HTMLElement>(null)
  const width = useSettingsStore((s) => s.referenceWidth)
  const setWidth = useSettingsStore((s) => s.setReferenceWidth)
  const lastPath = useSettingsStore((s) => s.referenceLastPath)
  const setLastPath = useSettingsStore((s) => s.setReferenceLastPath)

  const releaseDoc = (d: RefDoc | null) => {
    if (d?.kind === 'pdf') URL.revokeObjectURL(d.url)
  }

  // El formato lo decide el main (Word/PPT llegan YA convertidos a PDF por
  // LibreOffice): aquí solo se muestra según `format`, nunca según extensión
  const loadDoc = (result: { name: string; path: string; data: Uint8Array; format: 'pdf' | 'sheet' }) => {
    releaseDoc(doc)
    if (result.format === 'pdf') {
      const blob = new Blob([new Uint8Array(result.data)], { type: 'application/pdf' })
      setDoc({ kind: 'pdf', name: result.name, url: URL.createObjectURL(blob) })
    } else {
      setDoc(parseExcel(result.name, new Uint8Array(result.data)))
      setActiveSheet(0)
    }
    setLastPath(result.path)
  }

  const openDoc = async () => {
    setBusy(true)
    try {
      const result = await window.helecho.openReferenceDoc()
      if (!result) return
      if ('error' in result) {
        window.alert(result.error)
        return
      }
      loadDoc(result)
      setCollapsed(false)
    } catch (err) {
      console.error('Error al abrir el documento de referencia', err)
      window.alert('No se pudo abrir el documento. ¿El archivo está dañado?')
    } finally {
      setBusy(false)
    }
  }

  const expand = async () => {
    setCollapsed(false)
    if (doc || !lastPath) return
    setBusy(true)
    try {
      const result = await window.helecho.readReferenceDoc(lastPath)
      if (result) loadDoc(result)
      else setLastPath(null)
    } catch {
      setLastPath(null)
    } finally {
      setBusy(false)
    }
  }

  const closeDoc = () => {
    releaseDoc(doc)
    setDoc(null)
    setLastPath(null)
  }

  if (collapsed) {
    return (
      <aside className="flex w-10 shrink-0 flex-col items-center gap-2 bg-sidebar border-l border-sidebar-border py-3 text-muted-foreground">
        <button
          onMouseDown={(e) => { e.preventDefault(); void expand() }}
          aria-label="Expandir panel de referencia"
          className="flex flex-col items-center gap-2 rounded p-1 hover:bg-muted hover:text-foreground transition-colors"
        >
          <ChevronsLeft className="size-3.5" aria-hidden />
        </button>
      </aside>
    )
  }

  const sheet = doc?.kind === 'excel' ? doc.sheets[activeSheet] : null

  return (
    <aside
      ref={panelRef}
      className="relative flex shrink-0 flex-col bg-sidebar border-l border-sidebar-border overflow-hidden"
      style={{ width }}
    >
      <ResizeHandle
        side="left"
        onDrag={(x) => {
          const rect = panelRef.current?.getBoundingClientRect()
          if (rect) setWidth(rect.right - x)
        }}
      />

      <div className="flex items-center gap-2 border-b border-sidebar-border px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground shrink-0">
          Referencia
        </span>
        {doc && (
          <span className="min-w-0 flex-1 truncate text-xs text-foreground/80" title={doc.name}>
            {doc.name}
          </span>
        )}
        <div className="ml-auto flex items-center gap-1 shrink-0">
          <button
            onClick={openDoc}
            disabled={busy}
            className="rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            {busy ? 'Abriendo…' : 'Abrir…'}
          </button>
          {doc && (
            <button
              onClick={closeDoc}
              aria-label="Cerrar documento"
              className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" aria-hidden />
            </button>
          )}
          <button
            onMouseDown={(e) => { e.preventDefault(); setCollapsed(true) }}
            aria-label="Plegar panel"
            className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ChevronsRight className="size-4" aria-hidden />
          </button>
        </div>
      </div>

      {doc?.kind === 'excel' && doc.sheets.length > 1 && (
        <div className="flex border-b border-border">
          {doc.sheets.map((s, i) => (
            <button
              key={s.name}
              onClick={() => setActiveSheet(i)}
              className={`px-3 py-1.5 text-xs transition-colors ${
                i === activeSheet
                  ? 'border-b-2 border-primary text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      {doc === null && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <BookOpen className="size-8 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">
            Abre un PDF, un Word, un PowerPoint o una hoja de cálculo para
            tenerlo al lado mientras tomas apuntes.
          </p>
          <p className="text-xs text-muted-foreground/70">
            Selecciona texto o celdas, copia con Ctrl+C y pega directo en tu cuadernillo.
            Word y PowerPoint se muestran como PDF (vía LibreOffice).
          </p>
          <button
            onClick={openDoc}
            disabled={busy}
            className="h-8 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {busy ? 'Convirtiendo…' : 'Abrir…'}
          </button>
        </div>
      )}

      {doc?.kind === 'pdf' && (
        <iframe src={doc.url} title={doc.name} className="h-full w-full flex-1 border-0" />
      )}

      {sheet && (
        <div className="flex-1 overflow-auto bg-white">
          <table className="border-collapse text-xs text-zinc-800">
            <tbody>
              {sheet.rows.map((row, ri) => (
                <tr key={ri}>
                  <td className="sticky left-0 select-none border border-zinc-200 bg-zinc-100 px-1.5 text-center text-zinc-400">
                    {ri + 1}
                  </td>
                  {row.map((cell, ci) => (
                    <td key={ci} className="whitespace-nowrap border border-zinc-200 px-2 py-0.5">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {sheet.truncated && (
            <p className="px-2 py-1 text-xs text-zinc-500">
              Mostrando las primeras {MAX_ROWS} filas.
            </p>
          )}
          {sheet.rows.length === 0 && (
            <p className="px-2 py-2 text-xs text-zinc-500">Hoja vacía.</p>
          )}
        </div>
      )}
    </aside>
  )
}
