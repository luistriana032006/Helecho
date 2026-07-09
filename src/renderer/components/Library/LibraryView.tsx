import { useCallback, useEffect, useMemo, useState } from 'react'
import { Globe, Leaf, Plus, Search, Settings, X, CalendarPlus } from 'lucide-react'
import type { MateriaInfo, CuadernilloInfo, SearchResult } from '../../../shared/notebookTypes'
import InlineCreate from '../common/InlineCreate'
import { ParticlesBackground } from '../common/ParticlesBackground'

interface Props {
  onOpenCuadernillo: (path: string) => void
  onDeleted?: (path: string) => void
  onRenamed?: (oldPath: string, newPath: string) => void
  onSettings?: () => void
  /** Abre Alexandria en modo general (pantalla completa, sin cuadernillo) */
  onAlexandria?: () => void
}

function fmtMs(ms: number) {
  if (!ms) return '—'
  return new Date(ms).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

/* ── Notebook card ─────────────────────────────────────────────── */

interface NotebookCardProps {
  cuadernillo: CuadernilloInfo
  onOpen: () => void
  onDelete: () => void
  onRename: () => void
}

function NotebookCard({ cuadernillo, onOpen, onDelete, onRename }: NotebookCardProps) {
  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Abrir ${cuadernillo.name}`}
        className="block w-full text-left transition-transform duration-200 hover:-translate-y-1"
      >
        {/* Notebook body */}
        <div className="relative flex aspect-[3/4] overflow-hidden rounded-r-lg rounded-l-sm bg-forest shadow-md transition-shadow group-hover:shadow-xl">
          {/* Spine */}
          <div className="relative w-4 shrink-0 bg-sacramento">
            <div className="absolute inset-y-3 left-1/2 flex -translate-x-1/2 flex-col items-center justify-between">
              {Array.from({ length: 7 }).map((_, i) => (
                <span key={i} className="block h-2 w-0.5 rounded-full bg-off-white/40" />
              ))}
            </div>
          </div>
          {/* Cover */}
          <div className="relative flex flex-1 flex-col p-3 text-off-white">
            <Leaf className="size-4 text-off-white/70" aria-hidden />
            <div className="mt-3 rounded-sm bg-off-white px-2.5 py-2 shadow-sm">
              <span className="line-clamp-3 text-[13px] font-semibold leading-tight text-sacramento">
                {cuadernillo.name}
              </span>
            </div>
            <div className="mt-auto flex flex-col gap-0.5 pt-3 text-[10px] leading-tight text-off-white/85">
              <span>Creado: {fmtMs(cuadernillo.createdMs)}</span>
            </div>
          </div>
          {/* Elastic band */}
          <div className="pointer-events-none absolute inset-y-0 right-3 w-1 bg-sacramento/70" />
        </div>
      </button>

      {/* Hover actions */}
      <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={onRename}
          aria-label={`Renombrar ${cuadernillo.name}`}
          className="flex size-6 items-center justify-center rounded bg-background/85 text-muted-foreground shadow text-xs hover:text-foreground"
          title="Renombrar"
        >
          ✎
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Eliminar ${cuadernillo.name}`}
          className="flex size-6 items-center justify-center rounded bg-background/85 text-muted-foreground shadow hover:text-destructive"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      </div>
    </div>
  )
}

/* ── Subject section ───────────────────────────────────────────── */

interface SubjectSectionProps {
  materia: MateriaInfo
  addingIn: string | null
  renaming: string | null
  onOpenCuadernillo: (path: string) => void
  onStartCreate: () => void
  onCancelCreate: () => void
  onCreateCuadernillo: (name: string) => void
  onDeleteCuadernillo: (path: string, name: string) => void
  onStartRename: (path: string) => void
  onCancelRename: () => void
  onRenameCuadernillo: (path: string, newName: string) => void
  onDeleteMateria: (path: string, name: string) => void
  onStartRenameMateria: () => void
  onAssignSemester: () => void
  onRemoveSemester: () => void
}

function SubjectSection(props: SubjectSectionProps) {
  const { materia } = props
  const count = materia.cuadernillos.length

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3">
        {props.renaming === materia.path ? (
          <div className="w-64">
            <InlineCreate
              size="sm"
              placeholder="Nuevo nombre…"
              initialValue={materia.name}
              submitLabel="OK"
              onSubmit={(value) => props.onRenameCuadernillo(materia.path, value)}
              onCancel={props.onCancelRename}
            />
          </div>
        ) : (
          <>
            <h3 className="text-base font-medium">{materia.name}</h3>
            <span className="text-xs text-muted-foreground">
              {count} cuadernillo{count === 1 ? '' : 's'}
            </span>
            <div className="flex items-center gap-3 text-xs">
              <button
                type="button"
                onClick={props.onAssignSemester}
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
              >
                <CalendarPlus className="size-3.5" aria-hidden />
                {materia.coleccion ? 'cambiar semestre' : 'asignar semestre'}
              </button>
              {materia.coleccion && (
                <button
                  type="button"
                  onClick={props.onRemoveSemester}
                  className="text-muted-foreground hover:text-foreground"
                >
                  quitar
                </button>
              )}
              <button
                type="button"
                onClick={props.onStartRenameMateria}
                className="text-muted-foreground hover:text-foreground"
              >
                renombrar
              </button>
              <button
                type="button"
                onClick={() => props.onDeleteMateria(materia.path, materia.name)}
                className="text-muted-foreground hover:text-destructive"
              >
                eliminar
              </button>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
        {materia.cuadernillos.map((c) =>
          props.renaming === c.path ? (
            <div key={c.path} className="flex aspect-[3/4] items-center justify-center rounded-lg border border-border bg-card p-3">
              <InlineCreate
                size="sm"
                placeholder="Nuevo nombre…"
                initialValue={c.name}
                submitLabel="OK"
                onSubmit={(value) => props.onRenameCuadernillo(c.path, value)}
                onCancel={props.onCancelRename}
              />
            </div>
          ) : (
            <NotebookCard
              key={c.path}
              cuadernillo={c}
              onOpen={() => props.onOpenCuadernillo(c.path)}
              onDelete={() => props.onDeleteCuadernillo(c.path, c.name)}
              onRename={() => props.onStartRename(c.path)}
            />
          )
        )}

        {props.addingIn === materia.path ? (
          <div className="col-span-2 rounded-lg border border-dashed border-border bg-card p-3 sm:col-span-3 md:col-span-4 xl:col-span-5">
            <InlineCreate
              placeholder="Nombre del cuadernillo"
              onSubmit={props.onCreateCuadernillo}
              onCancel={props.onCancelCreate}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={props.onStartCreate}
            className="flex aspect-[3/4] flex-col items-center justify-center gap-1 rounded-r-lg rounded-l-sm border-2 border-dashed border-border text-sm text-muted-foreground transition-colors hover:border-ring hover:text-foreground"
          >
            <Plus className="size-6" aria-hidden /> Nuevo cuadernillo
          </button>
        )}
      </div>
    </div>
  )
}

/* ── Library view ──────────────────────────────────────────────── */

export default function LibraryView({ onOpenCuadernillo, onDeleted, onRenamed, onSettings, onAlexandria }: Props) {
  const [materias, setMaterias] = useState<MateriaInfo[]>([])
  const [loaded, setLoaded] = useState(false)
  const [addingMateria, setAddingMateria] = useState(false)
  const [addingIn, setAddingIn] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[] | null>(null)
  const [assigning, setAssigning] = useState<string | null>(null)
  const [renaming, setRenaming] = useState<string | null>(null)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) { setResults(null); return }
    const timer = setTimeout(async () => {
      try { setResults(await window.helecho.searchNotebooks(q)) }
      catch (err) { console.error('Error en la búsqueda global', err) }
    }, 250)
    return () => clearTimeout(timer)
  }, [query])

  const refresh = useCallback(async () => {
    try {
      const list = await window.helecho.listNotebooks()
      setMaterias(list.materias)
    } catch (err) {
      console.error('Error al listar cuadernillos', err)
      window.alert('No se pudo leer la carpeta de cuadernillos. Reinicia la aplicación.')
    }
    setLoaded(true)
  }, [])

  useEffect(() => { refresh() }, [refresh])

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
        onOpenCuadernillo(res.filePath)
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

  const assignCollection = async (materiaName: string, coleccion: string | null) => {
    setAssigning(null)
    try {
      const res = await window.helecho.setMateriaCollection(materiaName, coleccion)
      if (res.success) await refresh()
      else window.alert('No se pudo guardar la colección.')
    } catch (err) {
      console.error('Error al asignar colección', err)
      window.alert('No se pudo guardar la colección.')
    }
  }

  const renameItem = async (path: string, newName: string) => {
    setRenaming(null)
    try {
      const res = await window.helecho.renameNotebookItem(path, newName)
      if (res.success && res.newPath) {
        if (res.newPath !== path) onRenamed?.(path, res.newPath)
        await refresh()
      } else if (res.error === 'exists') {
        window.alert('Ya existe algo con ese nombre.')
      } else {
        window.alert('No se pudo renombrar.')
      }
    } catch (err) {
      console.error('Error al renombrar', err)
      window.alert('No se pudo renombrar.')
    }
  }

  const deleteItem = async (path: string, label: string) => {
    try {
      const res = await window.helecho.deleteNotebookItem(path, label)
      if (res.success) {
        onDeleted?.(path)
        await refresh()
      } else if (!res.canceled) {
        window.alert('No se pudo eliminar.')
      }
    } catch (err) {
      console.error('Error al eliminar', err)
      window.alert('No se pudo eliminar.')
    }
  }

  const grouped = useMemo(() => {
    const map = new Map<string, MateriaInfo[]>()
    for (const m of materias) {
      const key = m.coleccion ?? ''
      const list = map.get(key) ?? []
      list.push(m)
      map.set(key, list)
    }
    const named = [...map.entries()]
      .filter(([k]) => k !== '')
      .sort((a, b) => b[0].localeCompare(a[0], 'es'))
    return { named, sin: map.get('') ?? [] }
  }, [materias])

  const isEmpty = loaded && materias.length === 0

  const renderMateria = (materia: MateriaInfo) => (
    <SubjectSection
      key={materia.path}
      materia={materia}
      addingIn={addingIn}
      renaming={renaming}
      onOpenCuadernillo={onOpenCuadernillo}
      onStartCreate={() => setAddingIn(materia.path)}
      onCancelCreate={() => setAddingIn(null)}
      onCreateCuadernillo={(name) => createCuadernillo(materia.path, name)}
      onDeleteCuadernillo={deleteItem}
      onStartRename={setRenaming}
      onCancelRename={() => setRenaming(null)}
      onRenameCuadernillo={renameItem}
      onDeleteMateria={deleteItem}
      onStartRenameMateria={() => setRenaming(materia.path)}
      onAssignSemester={() => setAssigning(materia.name)}
      onRemoveSemester={() => assignCollection(materia.name, null)}
    />
  )

  return (
    <main className="relative flex h-full flex-col overflow-y-auto bg-background text-foreground">
      <ParticlesBackground />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-8">

        {/* Header */}
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
              <Leaf className="size-6 text-primary" aria-hidden /> Helecho
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Tus cuadernillos de apuntes</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {addingMateria ? (
              <div className="w-80">
                <InlineCreate
                  placeholder="Nombre de la materia…"
                  onSubmit={createMateria}
                  onCancel={() => setAddingMateria(false)}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAddingMateria(true)}
                className="flex h-9 shrink-0 items-center gap-1.5 rounded-md bg-primary px-3.5 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                <Plus className="size-4" aria-hidden /> Nueva materia
              </button>
            )}
            {onAlexandria && (
              <button
                type="button"
                onClick={onAlexandria}
                title="Alexandria — navegador"
                aria-label="Alexandria — navegador"
                className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Globe className="size-4" aria-hidden />
              </button>
            )}
            {onSettings && (
              <button
                type="button"
                onClick={onSettings}
                title="Configuración"
                aria-label="Configuración"
                className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Settings className="size-4" aria-hidden />
              </button>
            )}
          </div>
        </header>

        {/* Search */}
        <div className="relative mt-6">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') setQuery('') }}
            placeholder="Buscar en todos los cuadernillos…"
            className="h-11 w-full rounded-lg border border-input bg-card px-4 pl-10 pr-10 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Limpiar búsqueda"
              className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" aria-hidden />
            </button>
          )}
        </div>

        {/* Inline assign semester */}
        {assigning && (
          <div className="mt-4 rounded-lg border border-border bg-card p-3">
            <InlineCreate
              size="sm"
              placeholder="Semestre… (ej. 2026-1)"
              onSubmit={(value) => assignCollection(assigning, value)}
              onCancel={() => setAssigning(null)}
            />
          </div>
        )}

        {/* Search results */}
        {results !== null ? (
          <section className="mt-6 flex flex-col gap-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {results.length} resultado{results.length === 1 ? '' : 's'}
            </p>
            {results.length === 0 && (
              <p className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
                Sin coincidencias para &ldquo;{query.trim()}&rdquo;.
              </p>
            )}
            {results.map((r) => (
              <button
                key={r.path}
                type="button"
                onClick={() => onOpenCuadernillo(r.path)}
                className="rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-ring"
              >
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-muted-foreground">{r.materia}</span>
                  <span className="text-muted-foreground">/</span>
                  <span className="text-sm font-medium">
                    {r.nameMatch ? <mark>{r.name}</mark> : r.name}
                  </span>
                </div>
                <ul className="mt-2 flex flex-col gap-1">
                  {r.matches.map((m) => (
                    <li key={m.line} className="flex gap-2 text-sm text-muted-foreground">
                      <span className="w-7 shrink-0 text-right tabular-nums text-xs text-muted-foreground/70">
                        {m.line}
                      </span>
                      <span className="text-foreground/90">{m.text}</span>
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </section>

        /* Empty state */
        ) : isEmpty ? (
          <div className="mt-16 flex flex-col items-center gap-3 text-center">
            <Leaf className="size-10 text-primary/60" aria-hidden />
            <p className="text-sm text-muted-foreground">
              Aún no tienes materias. Crea la primera para empezar a tomar apuntes.
            </p>
            <button
              type="button"
              onClick={() => setAddingMateria(true)}
              className="flex h-9 items-center gap-1.5 rounded-md bg-primary px-3.5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <Plus className="size-4" aria-hidden /> Nueva materia
            </button>
          </div>

        /* Main content */
        ) : (
          <div className="mt-8 flex flex-col gap-10">
            {grouped.named.map(([coleccion, ms]) => (
              <div key={coleccion}>
                <h2 className="mb-4 text-lg font-semibold tracking-tight text-primary">
                  {coleccion}
                </h2>
                <div className="flex flex-col gap-8">
                  {ms.map(renderMateria)}
                </div>
              </div>
            ))}

            {grouped.sin.length > 0 && grouped.named.length > 0 && (
              <div>
                <h2 className="mb-4 text-lg font-semibold tracking-tight text-muted-foreground">
                  Sin colección
                </h2>
                <div className="flex flex-col gap-8">
                  {grouped.sin.map(renderMateria)}
                </div>
              </div>
            )}
            {grouped.sin.length > 0 && grouped.named.length === 0 && (
              <div className="flex flex-col gap-8">
                {grouped.sin.map(renderMateria)}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
