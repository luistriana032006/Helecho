"use client"

import { useState } from "react"
import { ChevronsLeft, ChevronRight, ChevronDown, Plus, FileText } from "lucide-react"
import type { Subject } from "@/lib/helecho/types"
import { InlineCreate } from "./inline-create"

interface NotebookSidebarProps {
  subjects: Subject[]
  activeNotebookId: string | null
  onSelectNotebook: (subjectId: string, notebookId: string) => void
  onCreateNotebook?: (subjectId: string, name: string) => void
  onCreateSubject?: (name: string) => void
  onCollapse: () => void
}

export function NotebookSidebar(props: NotebookSidebarProps) {
  const { subjects, activeNotebookId } = props
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(subjects.filter((s) => s.notebooks.some((n) => n.id === activeNotebookId)).map((s) => s.id)),
  )
  const [creatingFor, setCreatingFor] = useState<string | null>(null)
  const [creatingSubject, setCreatingSubject] = useState(false)

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cuadernillos</span>
        <button
          type="button"
          onClick={props.onCollapse}
          aria-label="Plegar panel"
          className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ChevronsLeft className="size-4" aria-hidden />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {subjects.map((subject) => {
          const open = expanded.has(subject.id)
          return (
            <div key={subject.id} className="group/subject">
              <div className="flex items-center gap-1 px-2">
                <button
                  type="button"
                  onClick={() => toggle(subject.id)}
                  className="flex flex-1 items-center gap-1 rounded px-1 py-1.5 text-left text-sm hover:bg-muted"
                >
                  <span className="text-muted-foreground" aria-hidden>
                    {open ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                  </span>
                  <span className="truncate">{subject.name}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExpanded((p) => new Set(p).add(subject.id))
                    setCreatingFor(subject.id)
                  }}
                  aria-label={`Nuevo cuadernillo en ${subject.name}`}
                  className="flex size-6 items-center justify-center rounded text-muted-foreground opacity-0 hover:bg-muted hover:text-foreground group-hover/subject:opacity-100"
                >
                  <Plus className="size-4" aria-hidden />
                </button>
              </div>

              {open && (
                <div className="flex flex-col">
                  {subject.notebooks.map((nb) => (
                    <button
                      key={nb.id}
                      type="button"
                      onClick={() => props.onSelectNotebook(subject.id, nb.id)}
                      className={`flex items-center gap-2 py-1.5 pl-7 pr-2 text-left text-sm transition-colors ${
                        nb.id === activeNotebookId
                          ? "bg-primary/15 text-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <FileText className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                      <span className="truncate">{nb.name}</span>
                    </button>
                  ))}
                  {creatingFor === subject.id && (
                    <div className="px-2 py-1.5 pl-7">
                      <InlineCreate
                        placeholder="Cuadernillo"
                        onCreate={(name) => {
                          props.onCreateNotebook?.(subject.id, name)
                          setCreatingFor(null)
                        }}
                        onCancel={() => setCreatingFor(null)}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="border-t border-border p-2">
        {creatingSubject ? (
          <InlineCreate
            placeholder="Nueva materia"
            onCreate={(name) => {
              props.onCreateSubject?.(name)
              setCreatingSubject(false)
            }}
            onCancel={() => setCreatingSubject(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setCreatingSubject(true)}
            className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-border py-1.5 text-xs text-muted-foreground hover:border-ring hover:text-foreground"
          >
            <Plus className="size-3.5" aria-hidden /> Nueva materia
          </button>
        )}
      </div>
    </div>
  )
}
