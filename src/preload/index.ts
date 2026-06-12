import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/ipcChannels'

contextBridge.exposeInMainWorld('helecho', {
  saveFile: (content: string, filePath?: string) =>
    ipcRenderer.invoke(IPC.FILE_SAVE, content, filePath),

  openFile: () =>
    ipcRenderer.invoke(IPC.FILE_OPEN),

  newFile: () =>
    ipcRenderer.invoke(IPC.FILE_NEW),

  exportPdf: (content: string) =>
    ipcRenderer.invoke(IPC.EXPORT_PDF, content),

  exportMd: (content: string) =>
    ipcRenderer.invoke(IPC.EXPORT_MD, content),

  getVersion: () =>
    ipcRenderer.invoke(IPC.APP_GET_VERSION),

  readFile: (filePath: string) =>
    ipcRenderer.invoke(IPC.FILE_READ, filePath),

  listNotebooks: () =>
    ipcRenderer.invoke(IPC.NOTEBOOK_LIST),

  createSubject: (name: string) =>
    ipcRenderer.invoke(IPC.NOTEBOOK_CREATE_SUBJECT, name),

  createNotebook: (materiaPath: string, name: string) =>
    ipcRenderer.invoke(IPC.NOTEBOOK_CREATE, materiaPath, name),

  searchNotebooks: (query: string) =>
    ipcRenderer.invoke(IPC.SEARCH_GLOBAL, query),

  setMateriaCollection: (materiaName: string, coleccion: string | null) =>
    ipcRenderer.invoke(IPC.NOTEBOOK_SET_COLLECTION, materiaName, coleccion),

  deleteNotebookItem: (path: string, label: string) =>
    ipcRenderer.invoke(IPC.NOTEBOOK_DELETE, path, label),

  confirmUnsaved: (fileName: string) =>
    ipcRenderer.invoke(IPC.DIALOG_CONFIRM_UNSAVED, fileName),

  openReferenceDoc: () =>
    ipcRenderer.invoke(IPC.REFERENCE_OPEN_DOC),

  readReferenceDoc: (filePath: string) =>
    ipcRenderer.invoke(IPC.REFERENCE_READ, filePath),

  renameNotebookItem: (path: string, newName: string) =>
    ipcRenderer.invoke(IPC.NOTEBOOK_RENAME, path, newName),

  watchFile: (filePath: string) =>
    ipcRenderer.invoke(IPC.FILE_WATCH, filePath),

  unwatchFile: () =>
    ipcRenderer.invoke(IPC.FILE_UNWATCH),

  onFileChanged: (callback: (payload: { filePath: string; content: string }) => void) => {
    ipcRenderer.on(IPC.FILE_CHANGED, (_e, payload) => callback(payload))
  },

  setDirtyState: (dirty: boolean, fileName: string) =>
    ipcRenderer.send(IPC.APP_SET_DIRTY, dirty, fileName),

  onSaveRequest: (callback: () => void) => {
    ipcRenderer.on(IPC.APP_SAVE_REQUEST, () => callback())
  },

  saveReply: (success: boolean) =>
    ipcRenderer.send(IPC.APP_SAVE_REPLY, success),

  onAlexandriaOpenTab: (callback: (url: string) => void) => {
    ipcRenderer.on(IPC.ALEXANDRIA_OPEN_TAB, (_e, url: string) => callback(url))
  },

  onAlexandriaToggleFocus: (callback: () => void) => {
    ipcRenderer.on(IPC.ALEXANDRIA_TOGGLE_FOCUS, () => callback())
  },

  getAdblockEnabled: () =>
    ipcRenderer.invoke(IPC.ALEXANDRIA_ADBLOCK_GET),

  setAdblockEnabled: (enabled: boolean) =>
    ipcRenderer.invoke(IPC.ALEXANDRIA_ADBLOCK_SET, enabled),

  getVaultRoot: () =>
    ipcRenderer.invoke(IPC.VAULT_GET),

  selectVaultRoot: () =>
    ipcRenderer.invoke(IPC.VAULT_SELECT),
})
