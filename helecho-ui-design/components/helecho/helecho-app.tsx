"use client"

import { useState } from "react"
import type { Subject } from "@/lib/helecho/types"
import { SUBJECTS } from "@/lib/helecho/data"
import { LibraryView } from "./library-view"
import { EditorView } from "./editor-view"
import { ConfirmDeleteDialog } from "./dialogs"

let idCounter = 1000
const nextId = () => `id${idCounter++}`

export function HelechoApp() {
  const [subjects, setSubjects] = useState<Subject[]>(SUBJECTS)
  const [view, setView] = useState<"library" | "editor">("library")
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<{ kind: "subject" | "notebook"; name: string; ids: string[] } | null>(
    null,
  )

  function openNotebook(_subjectId: string, notebookId: string) {
    setActiveNotebookId(notebookId)
    setView("editor")
  }

  function createSubject(name: string) {
    setSubjects((prev) => [...prev, { id: nextId(), name, semester: undefined, notebooks: [] }])
  }

  function createNotebook(subjectId: string, name: string) {
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId
          ? {
              ...s,
              notebooks: [
                ...s.notebooks,
                { id: nextId(), name, createdAt: new Date().toISOString().slice(0, 10), lines: [] },
              ],
            }
          : s,
      ),
    )
  }

  function assignSemester(subjectId: string) {
    const value = window.prompt("Semestre (ej. 2026-1)")
    if (value)
      setSubjects((prev) => prev.map((s) => (s.id === subjectId ? { ...s, semester: value.trim() } : s)))
  }

  function removeSemester(subjectId: string) {
    setSubjects((prev) => prev.map((s) => (s.id === subjectId ? { ...s, semester: undefined } : s)))
  }

  function confirmDelete() {
    if (!pendingDelete) return
    if (pendingDelete.kind === "subject") {
      setSubjects((prev) => prev.filter((s) => s.id !== pendingDelete.ids[0]))
    } else {
      const [subjectId, notebookId] = pendingDelete.ids
      setSubjects((prev) =>
        prev.map((s) =>
          s.id === subjectId ? { ...s, notebooks: s.notebooks.filter((n) => n.id !== notebookId) } : s,
        ),
      )
    }
    setPendingDelete(null)
  }

  return (
    <>
      {view === "library" ? (
        <LibraryView
          subjects={subjects}
          onOpenNotebook={openNotebook}
          onCreateSubject={createSubject}
          onCreateNotebook={createNotebook}
          onAssignSemester={assignSemester}
          onRemoveSemester={removeSemester}
          onDeleteSubject={(id) => {
            const subj = subjects.find((s) => s.id === id)
            if (subj) setPendingDelete({ kind: "subject", name: subj.name, ids: [id] })
          }}
          onDeleteNotebook={(subjectId, notebookId) => {
            const nb = subjects.find((s) => s.id === subjectId)?.notebooks.find((n) => n.id === notebookId)
            if (nb) setPendingDelete({ kind: "notebook", name: nb.name, ids: [subjectId, notebookId] })
          }}
        />
      ) : (
        <EditorView
          subjects={subjects}
          activeNotebookId={activeNotebookId}
          onSelectNotebook={openNotebook}
          onCreateNotebook={createNotebook}
          onCreateSubject={createSubject}
          onHome={() => setView("library")}
        />
      )}

      {pendingDelete && (
        <ConfirmDeleteDialog
          name={pendingDelete.name}
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </>
  )
}
