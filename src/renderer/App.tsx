import { useEffect, useRef, useState } from 'react'
import { useEditor } from './hooks/useEditor'
import { useFileOps } from './hooks/useFileOps'
import { useNotebookStore } from './store/notebookStore'
import { useSettingsStore } from './store/settingsStore'
import { applyTheme } from './lib/theme'
import HelechoEditor from './components/Editor/HelechoEditor'
import SymbolMenu from './components/SymbolMenu/SymbolMenu'
import SettingsDialog from './components/Settings/SettingsDialog'
import NotebookSidebar from './components/Notebook/NotebookSidebar'
import LibraryView from './components/Library/LibraryView'
import ReferencePanel from './components/Reference/ReferencePanel'
import AlexandriaPanel from './components/Alexandria/AlexandriaPanel'
import AlexandriaView from './components/Alexandria/AlexandriaView'

type View = 'library' | 'editor' | 'alexandria'

export default function App() {
  const editor = useEditor()
  const { save, open, openPath, newFile, exportPdf, applyExternalChange } = useFileOps(editor)
  const isDirty = useNotebookStore((s) => s.isDirty)
  const fileName = useNotebookStore((s) => s.fileName())
  const [showSettings, setShowSettings] = useState(false)
  const [view, setView] = useState<View>('library')
  // Modo enfoque (solo editor): oculta sidebar de cuadernillos y menú de
  // símbolos para leer en Alexandria y apuntar sin estorbos. No se persiste.
  const [focusMode, setFocusMode] = useState(false)
  // Cambia con cada cambio de bóveda: remonta la biblioteca para que liste
  // la carpeta nueva aunque ya estuviera visible
  const [vaultEpoch, setVaultEpoch] = useState(0)

  // Colores personalizados de la UI: se aplican al arrancar y en vivo
  // mientras se arrastra la ruedita en Configuración
  const uiColor = useSettingsStore((s) => s.uiColor)
  const textColor = useSettingsStore((s) => s.textColor)
  useEffect(() => {
    applyTheme(uiColor, textColor)
  }, [uiColor, textColor])

  const openFromLibrary = async (path: string) => {
    await openPath(path)
    setView('editor')
  }

  // Si se renombró el cuadernillo abierto (o su materia), la ruta del
  // editor se actualiza para que guardar/watcher sigan funcionando
  const handleRenamed = (oldPath: string, newPath: string) => {
    const current = useNotebookStore.getState().filePath
    if (!current) return
    if (current === oldPath) {
      useNotebookStore.getState().setFilePath(newPath)
    } else if (current.startsWith(oldPath + '/')) {
      useNotebookStore.getState().setFilePath(newPath + current.slice(oldPath.length))
    }
  }

  // Cambió la bóveda de cuadernillos: el archivo abierto (de la bóveda
  // anterior) ya no es válido — editor limpio y de vuelta a la biblioteca,
  // que al montarse lista la bóveda nueva
  const handleVaultChanged = () => {
    editor?.commands.setContent('<p></p>')
    useNotebookStore.getState().setFilePath(null)
    useNotebookStore.getState().setDirty(false)
    setVaultEpoch((n) => n + 1)
    setView('library')
  }

  // Si se eliminó el cuadernillo abierto (o su materia), el editor
  // vuelve a documento vacío para no seguir apuntando a un archivo muerto
  const handleDeleted = (deletedPath: string) => {
    const current = useNotebookStore.getState().filePath
    if (!current) return
    if (current === deletedPath || current.startsWith(deletedPath + '/')) {
      editor?.commands.setContent('<p></p>')
      useNotebookStore.getState().setFilePath(null)
    }
  }

  // Espeja el estado de cambios sin guardar hacia el main, que es quien
  // decide el cierre. Si el renderer falla, la ventana nunca queda bloqueada.
  useEffect(() => {
    const sync = () => {
      const s = useNotebookStore.getState()
      window.helecho.setDirtyState(s.isDirty, s.fileName())
    }
    sync()
    return useNotebookStore.subscribe(sync)
  }, [])

  // File watcher: vigila el archivo activo y recarga el editor cuando
  // cambia en disco (p. ej. editado por Claude Code).
  useEffect(() => {
    let watched: string | null = null
    const sync = () => {
      const path = useNotebookStore.getState().filePath
      if (path === watched) return
      watched = path
      if (path) window.helecho.watchFile(path)
      else window.helecho.unwatchFile()
    }
    sync()
    return useNotebookStore.subscribe(sync)
  }, [])

  const applyExternalChangeRef = useRef(applyExternalChange)
  applyExternalChangeRef.current = applyExternalChange
  useEffect(() => {
    window.helecho.onFileChanged(({ filePath, content }) => {
      applyExternalChangeRef.current(filePath, content)
    })
  }, [])

  // Cuando el usuario elige "Guardar" en el diálogo de cierre,
  // el main pide guardar y espera la respuesta.
  const saveRef = useRef(save)
  saveRef.current = save
  useEffect(() => {
    window.helecho.onSaveRequest(async () => {
      await saveRef.current()
      window.helecho.saveReply(!useNotebookStore.getState().isDirty)
    })
  }, [])

  // Modo enfoque: F9 siempre; "f" suelta solo si no se está escribiendo
  // (estilo YouTube — en un campo de texto la letra se escribe normal)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (view !== 'editor') return
      if (e.key === 'F9') {
        e.preventDefault()
        setFocusMode((f) => !f)
        return
      }
      if (e.key.toLowerCase() === 'f' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement | null
        const typing =
          target?.isContentEditable ||
          target?.closest('input, textarea, [contenteditable="true"]')
        if (typing) return
        e.preventDefault()
        setFocusMode((f) => !f)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [view])

  // F9 con el foco DENTRO de una página de Alexandria: el keydown no llega
  // al renderer — el main lo captura (before-input-event) y avisa por IPC
  const viewRef = useRef(view)
  viewRef.current = view
  useEffect(() => {
    window.helecho.onAlexandriaToggleFocus(() => {
      if (viewRef.current === 'editor') setFocusMode((f) => !f)
    })
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (view !== 'editor') return
      if (!(e.ctrlKey || e.metaKey)) return
      const { zoom, setZoom } = useSettingsStore.getState()
      switch (e.key.toLowerCase()) {
        case 's': e.preventDefault(); save(); break
        case 'o': e.preventDefault(); open(); break
        case 'n': e.preventDefault(); newFile(); break
        case 'p': e.preventDefault(); exportPdf(); break
        case '+': case '=': e.preventDefault(); setZoom(zoom + 0.1); break
        case '-': e.preventDefault(); setZoom(zoom - 0.1); break
        case '0': e.preventDefault(); setZoom(1); break
      }
    }
    window.addEventListener('keydown', handler, true)
    return () => window.removeEventListener('keydown', handler, true)
  }, [save, open, newFile, exportPdf, view])

  if (view === 'alexandria') {
    return <AlexandriaView onBack={() => setView('library')} />
  }

  if (view === 'library') {
    return (
      <div className="h-screen w-screen">
        <LibraryView
          key={vaultEpoch}
          onOpenCuadernillo={openFromLibrary}
          onDeleted={handleDeleted}
          onRenamed={handleRenamed}
          onSettings={() => setShowSettings(true)}
          onAlexandria={() => setView('alexandria')}
        />
        <SettingsDialog
          open={showSettings}
          onClose={() => setShowSettings(false)}
          onVaultChanged={handleVaultChanged}
        />
      </div>
    )
  }

  return (
    <div className="flex h-screen w-screen bg-background">
      <AlexandriaPanel />
      {!focusMode && <NotebookSidebar onOpenFile={openPath} />}
      <HelechoEditor
        editor={editor}
        fileName={fileName}
        isDirty={isDirty}
        onHome={() => {
          setFocusMode(false)
          setView('library')
        }}
        onNew={newFile}
        onOpen={open}
        onSave={save}
        onExportPdf={exportPdf}
        onSettings={() => setShowSettings(true)}
      />
      <ReferencePanel />
      {!focusMode && <SymbolMenu editor={editor} />}
      {focusMode && (
        <div className="pointer-events-none fixed bottom-4 right-4 z-50 rounded-full bg-foreground/80 px-3 py-1.5 text-xs text-background shadow-lg">
          Modo enfoque — F9 para salir
        </div>
      )}
      <SettingsDialog
        open={showSettings}
        onClose={() => setShowSettings(false)}
        onVaultChanged={handleVaultChanged}
      />
    </div>
  )
}
