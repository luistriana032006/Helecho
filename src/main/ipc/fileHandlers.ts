import { ipcMain, dialog, app, BrowserWindow } from 'electron'
import { readFile, writeFile } from 'fs/promises'
import { basename } from 'path'
import { IPC } from '../../shared/ipcChannels'
import { scheduleBackup } from '../gitBackup'
import { isInsideRoot, notebooksRoot } from './notebookHandlers'

const FILTERS = [
  { name: 'Apuntes Helecho', extensions: ['md', 'helecho'] },
  { name: 'Todos los archivos', extensions: ['*'] },
]

export function registerFileHandlers() {
  ipcMain.handle(IPC.FILE_SAVE, async (_e, content: string, filePath?: string) => {
    try {
      let target = filePath
      if (!target) {
        const { canceled, filePath: chosen } = await dialog.showSaveDialog({
          title: 'Guardar apunte',
          filters: FILTERS,
          defaultPath: 'apunte.md',
        })
        if (canceled || !chosen) return { success: false }
        target = chosen
      }
      await writeFile(target, content, 'utf-8')
      // Backup Git invisible para los guardados dentro de los cuadernillos
      if (isInsideRoot(target)) scheduleBackup(notebooksRoot())
      return { success: true, filePath: target }
    } catch (err) {
      console.error('file:save error', err)
      return { success: false }
    }
  })

  ipcMain.handle(IPC.FILE_OPEN, async () => {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        title: 'Abrir apunte',
        filters: FILTERS,
        properties: ['openFile'],
      })
      if (canceled || !filePaths.length) return null
      const content = await readFile(filePaths[0], 'utf-8')
      return { content, filePath: filePaths[0] }
    } catch (err) {
      console.error('file:open error', err)
      return null
    }
  })

  ipcMain.handle(IPC.FILE_NEW, async () => ({ success: true }))

  ipcMain.handle(IPC.APP_GET_VERSION, () => app.getVersion())

  // Documento de referencia (PDF u hoja de cálculo): el usuario lo
  // elige con diálogo y se envían los bytes al renderer
  ipcMain.handle(IPC.REFERENCE_OPEN_DOC, async () => {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        title: 'Abrir documento de referencia',
        filters: [
          { name: 'PDF y hojas de cálculo', extensions: ['pdf', 'xlsx', 'xls', 'csv', 'ods'] },
          { name: 'PDF', extensions: ['pdf'] },
          { name: 'Hojas de cálculo', extensions: ['xlsx', 'xls', 'csv', 'ods'] },
        ],
        properties: ['openFile'],
      })
      if (canceled || !filePaths.length) return null
      const data = await readFile(filePaths[0])
      return { name: basename(filePaths[0]), path: filePaths[0], data }
    } catch (err) {
      console.error('reference:openDoc error', err)
      return null
    }
  })

  // Relee un documento de referencia por ruta (para restaurarlo entre
  // sesiones). Solo extensiones de referencia válidas.
  ipcMain.handle(IPC.REFERENCE_READ, async (_e, filePath: string) => {
    try {
      const ext = filePath.split('.').pop()?.toLowerCase() ?? ''
      if (!['pdf', 'xlsx', 'xls', 'csv', 'ods'].includes(ext)) return null
      const data = await readFile(filePath)
      return { name: basename(filePath), path: filePath, data }
    } catch {
      // archivo movido o eliminado: el renderer lo olvida en silencio
      return null
    }
  })

  // Diálogo estilo Word: 0 = Guardar, 1 = No guardar, 2 = Cancelar
  ipcMain.handle(IPC.DIALOG_CONFIRM_UNSAVED, async (e, fileName: string) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    if (!win) return 2
    const { response } = await dialog.showMessageBox(win, {
      type: 'warning',
      buttons: ['Guardar', 'No guardar', 'Cancelar'],
      defaultId: 0,
      cancelId: 2,
      title: 'Cambios sin guardar',
      message: `¿Quieres guardar los cambios de "${fileName}"?`,
      detail: 'Si no los guardas, se perderán.',
    })
    return response
  })
}
