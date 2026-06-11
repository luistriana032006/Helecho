import { useEffect, useRef, useState } from 'react'
import { useEditor } from './hooks/useEditor'
import { useFileOps } from './hooks/useFileOps'
import { useNotebookStore } from './store/notebookStore'
import { useSettingsStore } from './store/settingsStore'
import HelechoEditor from './components/Editor/HelechoEditor'
import SymbolMenu from './components/SymbolMenu/SymbolMenu'
import SettingsDialog from './components/Settings/SettingsDialog'
import NotebookSidebar from './components/Notebook/NotebookSidebar'
import LibraryView from './components/Library/LibraryView'
import ReferencePanel from './components/Reference/ReferencePanel'
import AlexandriaPanel from './components/Alexandria/AlexandriaPanel'

type View = 'library' | 'editor'

export default function App() {
  const editor = useEditor()
  const { save, open, openPath, newFile, exportPdf, applyExternalChange } = useFileOps(editor)
  const isDirty = useNotebookStore((s) => s.isDirty)
  const fileName = useNotebookStore((s) => s.fileName())
  const [showSettings, setShowSettings] = useState(false)
  const [view, setView] = useState<View>('library')
  // Cambia con cada cambio de bóveda: remonta la biblioteca para que liste
  // la carpeta nueva aunque ya estuviera visible
  const [vaultEpoch, setVaultEpoch] = useState(0)

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

  if (view === 'library') {
    return (
      <div className="h-screen w-screen">
        <LibraryView
          key={vaultEpoch}
          onOpenCuadernillo={openFromLibrary}
          onDeleted={handleDeleted}
          onRenamed={handleRenamed}
          onSettings={() => setShowSettings(true)}
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
      <NotebookSidebar onOpenFile={openPath} />
      <HelechoEditor
        editor={editor}
        fileName={fileName}
        isDirty={isDirty}
        onHome={() => setView('library')}
        onNew={newFile}
        onOpen={open}
        onSave={save}
        onExportPdf={exportPdf}
        onSettings={() => setShowSettings(true)}
      />
      <ReferencePanel />
      <SymbolMenu editor={editor} />
      <SettingsDialog
        open={showSettings}
        onClose={() => setShowSettings(false)}
        onVaultChanged={handleVaultChanged}
      />
    </div>
  )
}
