"use client"

import { useMemo, useState } from "react"
import { Leaf, Plus, Search, X, CalendarPlus } from "lucide-react"
import type { Subject, SearchHit, Notebook } from "@/lib/helecho/types"
import { InlineCreate } from "./inline-create"
import { ParticlesBackground } from "./particles-background"

interface LibraryViewProps {
  subjects: Subject[]
  onOpenNotebook: (subjectId: string, notebookId: string) => void
  onCreateSubject?: (name: string) => void
  onCreateNotebook?: (subjectId: string, name: string) => void
  onDeleteSubject?: (subjectId: string) => void
  onDeleteNotebook?: (subjectId: string, notebookId: string) => void
  onAssignSemester?: (subjectId: string) => void
  onRemoveSemester?: (subjectId: string) => void
}

function highlight(text: string, term: string) {
  if (!term) return text
  const parts = text.split(new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"))
  return parts.map((part, i) =>
    part.toLowerCase() === term.toLowerCase() ? <mark key={i}>{part}</mark> : <span key={i}>{part}</span>,
  )
}

function buildSearch(subjects: Subject[], term: string): SearchHit[] {
  const t = term.toLowerCase()
  const hits: SearchHit[] = []
  for (const subject of subjects) {
    for (const nb of subject.notebooks) {
      const matches: { line: number; text: string }[] = []
      ;(nb.lines ?? []).forEach((line, idx) => {
        if (matches.length < 5 && line.toLowerCase().includes(t)) {
          matches.push({ line: idx + 1, text: line })
        }
      })
      if (matches.length > 0 || nb.name.toLowerCase().includes(t)) {
        hits.push({ notebookId: nb.id, notebookName: nb.name, subjectName: subject.name, matches })
      }
    }
  }
  return hits
}

export function LibraryView(props: LibraryViewProps) {
  const { subjects, onOpenNotebook } = props
  const [query, setQuery] = useState("")
  const [creatingSubject, setCreatingSubject] = useState(false)
  const [creatingNotebookFor, setCreatingNotebookFor] = useState<string | null>(null)

  const searchResults = useMemo(() => (query.trim() ? buildSearch(subjects, query.trim()) : null), [subjects, query])

  // Group by semester, most recent first; "Sin colección" last.
  const collections = useMemo(() => {
    const map = new Map<string, Subject[]>()
    for (const s of subjects) {
      const key = s.semester ?? "__none__"
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(s)
    }
    const keys = Array.from(map.keys())
      .filter((k) => k !== "__none__")
      .sort((a, b) => b.localeCompare(a))
    if (map.has("__none__")) keys.push("__none__")
    return keys.map((k) => ({ key: k, label: k === "__none__" ? "Sin colección" : k, subjects: map.get(k)! }))
  }, [subjects])

  const isEmpty = subjects.length === 0

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <ParticlesBackground />
      <div className="relative mx-auto max-w-6xl px-6 py-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-balance">
              <Leaf className="size-6 text-primary" aria-hidden /> Helecho
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Tus cuadernillos de apuntes</p>
          </div>
          <button
            type="button"
            onClick={() => setCreatingSubject(true)}
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-md bg-primary px-3.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="size-4" aria-hidden /> Nueva materia
          </button>
        </header>

        {/* Global search */}
        <div className="relative mt-6">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar en todos los cuadernillos…"
            className="h-11 w-full rounded-lg border border-input bg-card px-4 pl-10 pr-10 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Limpiar búsqueda"
              className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" aria-hidden />
            </button>
          )}
        </div>

        {creatingSubject && (
          <div className="mt-4 rounded-lg border border-border bg-card p-3">
            <InlineCreate
              placeholder="Nombre de la materia"
              onCreate={(name) => {
                props.onCreateSubject?.(name)
                setCreatingSubject(false)
              }}
              onCancel={() => setCreatingSubject(false)}
            />
          </div>
        )}

        {/* Search results */}
        {searchResults !== null ? (
          <section className="mt-6 flex flex-col gap-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {searchResults.length} resultado{searchResults.length === 1 ? "" : "s"}
            </p>
            {searchResults.length === 0 && (
              <p className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
                Sin coincidencias para “{query}”.
              </p>
            )}
            {searchResults.map((hit) => (
              <button
                key={hit.notebookId}
                type="button"
                onClick={() => {
                  const subj = subjects.find((s) => s.notebooks.some((n) => n.id === hit.notebookId))
                  if (subj) onOpenNotebook(subj.id, hit.notebookId)
                }}
                className="rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-ring"
              >
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-muted-foreground">{hit.subjectName}</span>
                  <span className="text-muted-foreground">/</span>
                  <span className="text-sm font-medium">{hit.notebookName}</span>
                </div>
                <ul className="mt-2 flex flex-col gap-1">
                  {hit.matches.map((m) => (
                    <li key={m.line} className="flex gap-2 text-sm text-muted-foreground">
                      <span className="w-7 shrink-0 text-right tabular-nums text-xs text-muted-foreground/70">
                        {m.line}
                      </span>
                      <span className="text-foreground/90">{highlight(m.text, query.trim())}</span>
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </section>
        ) : isEmpty ? (
          <div className="mt-16 flex flex-col items-center gap-3 text-center">
            <Leaf className="size-10 text-primary/60" aria-hidden />
            <p className="text-sm text-muted-foreground">
              Aún no tienes materias. Crea la primera para empezar a tomar apuntes.
            </p>
            <button
              type="button"
              onClick={() => setCreatingSubject(true)}
              className="flex h-9 items-center gap-1.5 rounded-md bg-primary px-3.5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <Plus className="size-4" aria-hidden /> Nueva materia
            </button>
          </div>
        ) : (
          <div className="mt-8 flex flex-col gap-10">
            {collections.map((col) => (
              <section key={col.key}>
                <h2 className="mb-4 text-lg font-semibold tracking-tight text-primary">{col.label}</h2>
                <div className="flex flex-col gap-8">
                  {col.subjects.map((subject) => (
                    <SubjectSection
                      key={subject.id}
                      subject={subject}
                      creatingNotebook={creatingNotebookFor === subject.id}
                      onStartCreateNotebook={() => setCreatingNotebookFor(subject.id)}
                      onCancelCreateNotebook={() => setCreatingNotebookFor(null)}
                      onCreateNotebook={(name) => {
                        props.onCreateNotebook?.(subject.id, name)
                        setCreatingNotebookFor(null)
                      }}
                      onOpenNotebook={(nbId) => onOpenNotebook(subject.id, nbId)}
                      onDeleteNotebook={(nbId) => props.onDeleteNotebook?.(subject.id, nbId)}
                      onDeleteSubject={() => props.onDeleteSubject?.(subject.id)}
                      onAssignSemester={() => props.onAssignSemester?.(subject.id)}
                      onRemoveSemester={() => props.onRemoveSemester?.(subject.id)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

interface SubjectSectionProps {
  subject: Subject
  creatingNotebook: boolean
  onStartCreateNotebook: () => void
  onCancelCreateNotebook: () => void
  onCreateNotebook: (name: string) => void
  onOpenNotebook: (notebookId: string) => void
  onDeleteNotebook: (notebookId: string) => void
  onDeleteSubject: () => void
  onAssignSemester: () => void
  onRemoveSemester: () => void
}

function SubjectSection(props: SubjectSectionProps) {
  const { subject } = props
  const count = subject.notebooks.length

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h3 className="text-base font-medium">{subject.name}</h3>
        <span className="text-xs text-muted-foreground">
          {count} cuadernillo{count === 1 ? "" : "s"}
        </span>
        <div className="flex items-center gap-3 text-xs">
          <button type="button" onClick={props.onAssignSemester} className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
            <CalendarPlus className="size-3.5" aria-hidden /> {subject.semester ? "cambiar semestre" : "asignar semestre"}
          </button>
          {subject.semester && (
            <button type="button" onClick={props.onRemoveSemester} className="text-muted-foreground hover:text-foreground">
              quitar
            </button>
          )}
          <button type="button" onClick={props.onDeleteSubject} className="text-muted-foreground hover:text-destructive">
            eliminar
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
        {subject.notebooks.map((nb) => (
          <NotebookCard
            key={nb.id}
            notebook={nb}
            onOpen={() => props.onOpenNotebook(nb.id)}
            onDelete={() => props.onDeleteNotebook(nb.id)}
          />
        ))}

        {props.creatingNotebook ? (
          <div className="col-span-2 rounded-lg border border-dashed border-border bg-card p-3 sm:col-span-3 md:col-span-4 xl:col-span-5">
            <InlineCreate
              placeholder="Nombre del cuadernillo"
              onCreate={props.onCreateNotebook}
              onCancel={props.onCancelCreateNotebook}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={props.onStartCreateNotebook}
            className="flex aspect-[3/4] flex-col items-center justify-center gap-1 rounded-r-lg rounded-l-sm border-2 border-dashed border-border text-sm text-muted-foreground transition-colors hover:border-ring hover:text-foreground"
          >
            <Plus className="size-6" aria-hidden /> Nuevo cuadernillo
          </button>
        )}
      </div>
    </div>
  )
}

function NotebookCard({ notebook, onOpen, onDelete }: { notebook: Notebook; onOpen: () => void; onDelete: () => void }) {
  const fmt = (iso?: string) => {
    if (!iso) return "—"
    const d = new Date(`${iso}T00:00:00`)
    if (Number.isNaN(d.getTime())) return iso
    return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })
  }

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Abrir ${notebook.name}`}
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
            {/* Top: leaf emblem */}
            <Leaf className="size-4 text-off-white/70" aria-hidden />

            {/* Title label, like a taped paper label */}
            <div className="mt-3 rounded-sm bg-off-white px-2.5 py-2 shadow-sm">
              <span className="line-clamp-3 text-[13px] font-semibold leading-tight text-sacramento">
                {notebook.name}
              </span>
            </div>

            {/* Footer dates */}
            <div className="mt-auto flex flex-col gap-0.5 pt-3 text-[10px] leading-tight text-off-white/85">
              <span>Creado: {fmt(notebook.createdAt)}</span>
              <span>Editado: {fmt(notebook.updatedAt ?? notebook.createdAt)}</span>
            </div>
          </div>

          {/* Elastic band */}
          <div className="pointer-events-none absolute inset-y-0 right-3 w-1 bg-sacramento/70" />
        </div>
      </button>

      <button
        type="button"
        onClick={onDelete}
        aria-label={`Eliminar ${notebook.name}`}
        className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-md bg-background/85 text-muted-foreground opacity-0 shadow transition-opacity hover:text-destructive group-hover:opacity-100"
      >
        <X className="size-3.5" aria-hidden />
      </button>
    </div>
  )
}
