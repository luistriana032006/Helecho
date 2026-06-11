import { useCallback, useEffect, useState } from 'react'
import { ChevronsLeft, ChevronsRight, ChevronRight, ChevronDown, Plus, FileText } from 'lucide-react'
import { useNotebookStore } from '../../store/notebookStore'
import { useSettingsStore } from '../../store/settingsStore'
import type { MateriaInfo } from '../../../shared/notebookTypes'
import InlineCreate from '../common/InlineCreate'
import ResizeHandle from '../common/ResizeHandle'

interface Props {
  onOpenFile: (path: string) => void
}

export default function NotebookSidebar({ onOpenFile }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const [materias, setMaterias] = useState<MateriaInfo[]>([])
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [addingMateria, setAddingMateria] = useState(false)
  const [addingIn, setAddingIn] = useState<string | null>(null)
  const activePath = useNotebookStore((s) => s.filePath)
  const width = useSettingsStore((s) => s.sidebarWidth)
  const setWidth = useSettingsStore((s) => s.setSidebarWidth)

  const refresh = useCallback(async () => {
    try {
      const list = await window.helecho.listNotebooks()
      setMaterias(list.materias)
      setExpanded((prev) =>
        prev.size > 0 ? prev : new Set(list.materias.map((m) => m.path))
      )
    } catch (err) {
      console.error('Error al listar cuadernillos', err)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh, activePath])

  const toggleMateria = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  const createMateria = async (name: string) => {
    setAddingMateria(false)
    try {
      const res = await window.helecho.createSubject(name)
      if (res.success) await refresh()
      else window.alert('No se pudo crear la materia.')
    } catch (err) {
      console.error('Error al crear materia', err)
      window.alert('No se pudo crear la materia. Reinicia la aplicación.')
    }
  }

  const createCuadernillo = async (materiaPath: string, name: string) => {
    setAddingIn(null)
    try {
      const res = await window.helecho.createNotebook(materiaPath, name)
      if (res.success && res.filePath) {
        await refresh()
        setExpanded((prev) => new Set(prev).add(materiaPath))
        onOpenFile(res.filePath)
      } else if (res.error === 'exists') {
        window.alert('Ya existe un cuadernillo con ese nombre en la materia.')
      } else {
        window.alert('No se pudo crear el cuadernillo.')
      }
    } catch (err) {
      console.error('Error al crear cuadernillo', err)
      window.alert('No se pudo crear el cuadernillo. Reinicia la aplicación.')
    }
  }

  if (collapsed) {
    return (
      <aside className="flex w-10 shrink-0 flex-col items-center gap-2 bg-sidebar border-r border-sidebar-border py-3 text-muted-foreground">
        <button
          onMouseDown={(e) => { e.preventDefault(); setCollapsed(false) }}
          aria-label="Expandir panel de cuadernillos"
          className="flex flex-col items-center gap-2 rounded p-1 hover:bg-muted hover:text-foreground transition-colors"
        >
          <ChevronsRight className="size-3.5" aria-hidden />
        </button>
      </aside>
    )
  }

  return (
    <aside
      className="relative flex shrink-0 flex-col bg-sidebar border-r border-sidebar-border overflow-hidden"
      style={{ width }}
    >
      <ResizeHandle side="right" onDrag={(x) => setWidth(x)} />

      <div className="flex items-center justify-between px-3 py-2 border-b border-sidebar-border">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Cuadernillos
        </span>
        <button
          onMouseDown={(e) => { e.preventDefault(); setCollapsed(true) }}
          aria-label="Plegar panel"
          className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ChevronsLeft className="size-4" aria-hidden />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {materias.map((materia) => {
          const open = expanded.has(materia.path)
          return (
            <div key={materia.path} className="group/subject">
              <div className="flex items-center gap-1 px-2">
                <button
                  onClick={() => toggleMateria(materia.path)}
                  className="flex flex-1 items-center gap-1 rounded px-1 py-1.5 text-left text-sm hover:bg-muted"
                >
                  <span className="text-muted-foreground" aria-hidden>
                    {open
                      ? <ChevronDown className="size-3.5" />
                      : <ChevronRight className="size-3.5" />}
                  </span>
                  <span className="truncate">{materia.name}</span>
                </button>
                <button
                  onClick={() => {
                    setExpanded((p) => new Set(p).add(materia.path))
                    setAddingIn(materia.path)
                  }}
                  title={`Nuevo cuadernillo en ${materia.name}`}
                  aria-label={`Nuevo cuadernillo en ${materia.name}`}
                  className="flex size-6 items-center justify-center rounded text-muted-foreground opacity-0 hover:bg-muted hover:text-foreground group-hover/subject:opacity-100"
                >
                  <Plus className="size-4" aria-hidden />
                </button>
              </div>

              {open && (
                <div className="flex flex-col">
                  {materia.cuadernillos.map((c) => (
                    <button
                      key={c.path}
                      onClick={() => onOpenFile(c.path)}
                      className={`flex items-center gap-2 py-1.5 pl-7 pr-2 text-left text-sm transition-colors ${
                        activePath === c.path
                          ? 'bg-primary/15 text-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <FileText className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                      <span className="truncate">{c.name}</span>
                    </button>
                  ))}
                  {materia.cuadernillos.length === 0 && addingIn !== materia.path && (
                    <p className="py-1 pl-7 pr-2 text-xs italic text-muted-foreground">Vacía</p>
                  )}
                  {addingIn === materia.path && (
                    <div className="px-2 py-1.5 pl-7">
                      <InlineCreate
                        size="sm"
                        placeholder="Cuadernillo"
                        onSubmit={(name) => createCuadernillo(materia.path, name)}
                        onCancel={() => setAddingIn(null)}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {materias.length === 0 && !addingMateria && (
          <p className="px-3 py-3 text-xs text-muted-foreground">
            Sin materias aún. Crea la primera abajo.
          </p>
        )}

        {addingMateria && (
          <div className="px-2 py-1">
            <InlineCreate
              size="sm"
              placeholder="Nombre de la materia…"
              onSubmit={createMateria}
              onCancel={() => setAddingMateria(false)}
            />
          </div>
        )}
      </div>

      <div className="border-t border-sidebar-border p-2">
        <button
          onClick={() => setAddingMateria(true)}
          className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-border py-1.5 text-xs text-muted-foreground hover:border-ring hover:text-foreground"
        >
          <Plus className="size-3.5" aria-hidden /> Nueva materia
        </button>
      </div>
    </aside>
  )
}
