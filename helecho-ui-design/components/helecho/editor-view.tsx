"use client"

import { useState } from "react"
import { FolderOpen, BookOpen, Sigma } from "lucide-react"
import type { Subject, SheetMode } from "@/lib/helecho/types"
import { NotebookSidebar } from "./notebook-sidebar"
import { ResizablePanel } from "./resizable-panel"
import { Toolbar } from "./toolbar"
import { Sheet } from "./sheet"
import { ReferencePanel } from "./reference-panel"
import { SymbolMenu } from "./symbol-menu"
import { SettingsDialog } from "./dialogs"

interface EditorViewProps {
  subjects: Subject[]
  activeNotebookId: string | null
  onSelectNotebook: (subjectId: string, notebookId: string) => void
  onCreateNotebook?: (subjectId: string, name: string) => void
  onCreateSubject?: (name: string) => void
  onHome: () => void
}

export function EditorView(props: EditorViewProps) {
  const { subjects, activeNotebookId } = props

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [referenceCollapsed, setReferenceCollapsed] = useState(true)
  const [symbolsCollapsed, setSymbolsCollapsed] = useState(false)

  const [sidebarWidth, setSidebarWidth] = useState(240)
  const [referenceWidth, setReferenceWidth] = useState(380)
  const [symbolsWidth, setSymbolsWidth] = useState(256)

  const [zoom, setZoom] = useState(100)
  const [dirty, setDirty] = useState(true)
  const [inTable, setInTable] = useState(false)
  const [sheetMode, setSheetMode] = useState<SheetMode>("strict")
  const [showSettings, setShowSettings] = useState(false)

  const activeNotebook =
    subjects.flatMap((s) => s.notebooks).find((n) => n.id === activeNotebookId) ?? null
  const fileName = activeNotebook ? `${activeNotebook.name}.md` : "apunte.md"

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <Toolbar
        fileName={fileName}
        dirty={dirty}
        zoom={zoom}
        inTable={inTable}
        onHome={props.onHome}
        onNew={() => {}}
        onOpen={() => {}}
        onSave={() => setDirty(false)}
        onExportPdf={() => {}}
        onSettings={() => setShowSettings(true)}
        onFormat={() => setDirty(true)}
        onInsertTable={() => {
          setInTable(true)
          setDirty(true)
        }}
        onTableOp={(op) => {
          if (op === "delTable") setInTable(false)
          setDirty(true)
        }}
        onInsertPlane={() => setDirty(true)}
        onZoomChange={setZoom}
      />

      <div className="flex flex-1 overflow-hidden">
        <ResizablePanel
          side="left"
          collapsed={sidebarCollapsed}
          width={sidebarWidth}
          minWidth={180}
          maxWidth={360}
          collapsedIcon={<FolderOpen className="size-5" aria-hidden />}
          collapsedLabel="cuadernillos"
          onExpand={() => setSidebarCollapsed(false)}
          onResize={setSidebarWidth}
        >
          <NotebookSidebar
            subjects={subjects}
            activeNotebookId={activeNotebookId}
            onSelectNotebook={props.onSelectNotebook}
            onCreateNotebook={props.onCreateNotebook}
            onCreateSubject={props.onCreateSubject}
            onCollapse={() => setSidebarCollapsed(true)}
          />
        </ResizablePanel>

        <div className="min-w-0 flex-1">
          <Sheet zoom={zoom} mode={sheetMode} />
        </div>

        <ResizablePanel
          side="right"
          collapsed={referenceCollapsed}
          width={referenceWidth}
          minWidth={280}
          maxWidth={560}
          collapsedIcon={<BookOpen className="size-5" aria-hidden />}
          collapsedLabel="referencia"
          onExpand={() => setReferenceCollapsed(false)}
          onResize={setReferenceWidth}
        >
          <ReferencePanel onCollapse={() => setReferenceCollapsed(true)} />
        </ResizablePanel>

        <ResizablePanel
          side="right"
          collapsed={symbolsCollapsed}
          width={symbolsWidth}
          minWidth={200}
          maxWidth={360}
          collapsedIcon={<Sigma className="size-5" aria-hidden />}
          collapsedLabel="símbolos"
          onExpand={() => setSymbolsCollapsed(false)}
          onResize={setSymbolsWidth}
        >
          <SymbolMenu onInsertSymbol={() => setDirty(true)} onCollapse={() => setSymbolsCollapsed(true)} />
        </ResizablePanel>
      </div>

      {showSettings && (
        <SettingsDialog mode={sheetMode} onChangeMode={setSheetMode} onClose={() => setShowSettings(false)} />
      )}
    </div>
  )
}
