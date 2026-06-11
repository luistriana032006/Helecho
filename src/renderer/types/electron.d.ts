import type { NotebookList, SearchResult } from '../../shared/notebookTypes'

export {}

declare global {
  /**
   * @types/react ya declara <webview> en JSX y deja HTMLWebViewElement
   * vacío (global.d.ts); aquí se completa con la API mínima que usa
   * Alexandria. Tipado propio: el renderer no importa tipos de electron
   * (regla del proyecto). Los métodos solo son válidos después de que
   * el webview se adjunta al DOM.
   */
  interface HTMLWebViewElement {
    src: string
    loadURL(url: string): Promise<void>
    getURL(): string
    reload(): void
    stop(): void
    goBack(): void
    goForward(): void
    canGoBack(): boolean
    canGoForward(): boolean
  }
}

declare global {
  interface Window {
    helecho: {
      saveFile: (content: string, filePath?: string) => Promise<{ success: boolean; filePath?: string }>
      openFile: () => Promise<{ content: string; filePath: string } | null>
      newFile: () => Promise<void>
      exportPdf: (content: string) => Promise<{ success: boolean }>
      exportMd: (content: string) => Promise<{ success: boolean; filePath?: string }>
      getVersion: () => Promise<string>
      readFile: (filePath: string) => Promise<{ content: string; filePath: string } | null>
      listNotebooks: () => Promise<NotebookList>
      createSubject: (name: string) => Promise<{ success: boolean }>
      createNotebook: (materiaPath: string, name: string) => Promise<{ success: boolean; filePath?: string; error?: string }>
      searchNotebooks: (query: string) => Promise<SearchResult[]>
      setMateriaCollection: (materiaName: string, coleccion: string | null) => Promise<{ success: boolean }>
      deleteNotebookItem: (path: string, label: string) => Promise<{ success: boolean; canceled?: boolean }>
      confirmUnsaved: (fileName: string) => Promise<number>
      openReferenceDoc: () => Promise<{ name: string; path: string; data: Uint8Array } | null>
      readReferenceDoc: (filePath: string) => Promise<{ name: string; path: string; data: Uint8Array } | null>
      renameNotebookItem: (path: string, newName: string) => Promise<{ success: boolean; newPath?: string; error?: string }>
      watchFile: (filePath: string) => Promise<void>
      unwatchFile: () => Promise<void>
      onFileChanged: (callback: (payload: { filePath: string; content: string }) => void) => void
      setDirtyState: (dirty: boolean, fileName: string) => void
      onSaveRequest: (callback: () => void) => void
      saveReply: (success: boolean) => void
      onAlexandriaOpenTab: (callback: (url: string) => void) => void
      getVaultRoot: () => Promise<string>
      selectVaultRoot: () => Promise<{ success: boolean; root?: string; canceled?: boolean }>
    }
  }
}
