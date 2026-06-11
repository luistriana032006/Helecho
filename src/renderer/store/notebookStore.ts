import { create } from 'zustand'

interface NotebookState {
  filePath: string | null
  isDirty: boolean
  setFilePath: (path: string | null) => void
  setDirty: (dirty: boolean) => void
  fileName: () => string
}

export const useNotebookStore = create<NotebookState>((set, get) => ({
  filePath: null,
  isDirty: false,

  setFilePath: (path) => set({ filePath: path, isDirty: false }),
  setDirty: (dirty) => set({ isDirty: dirty }),

  fileName: () => {
    const path = get().filePath
    if (!path) return 'Sin título'
    return path.split('/').pop() ?? path
  },
}))
