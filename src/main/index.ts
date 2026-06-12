import { app, BrowserWindow, Menu, dialog, ipcMain } from 'electron'
import { existsSync } from 'fs'
import { join } from 'path'
import { IPC } from '../shared/ipcChannels'
import { registerFileHandlers } from './ipc/fileHandlers'
import { registerExportHandlers } from './ipc/exportHandlers'
import { registerNotebookHandlers } from './ipc/notebookHandlers'
import { registerWatchHandlers } from './ipc/watchHandlers'
import { notebooksRoot } from './ipc/notebookHandlers'
import { runBackup } from './gitBackup'
import { registerAlexandriaSecurity, hardenWebviews } from './alexandriaSecurity'
import { registerAdblockHandlers, initAdblock } from './adblocker'

// Estado de cambios sin guardar, espejado desde el renderer.
// El main decide el cierre por sí solo: si el renderer no reporta
// nada, la ventana siempre puede cerrarse (nunca queda bloqueada).
let isDirty = false
let dirtyFileName = 'Sin título'

// Ventanas autorizadas a cerrarse (ya pasaron el chequeo)
const closableWindows = new WeakSet<BrowserWindow>()

async function handleDirtyClose(win: BrowserWindow) {
  const { response } = await dialog.showMessageBox(win, {
    type: 'warning',
    buttons: ['Guardar', 'No guardar', 'Cancelar'],
    defaultId: 0,
    cancelId: 2,
    title: 'Cambios sin guardar',
    message: `¿Quieres guardar los cambios de "${dirtyFileName}"?`,
    detail: 'Si no los guardas, se perderán.',
  })

  if (response === 2) return // Cancelar

  if (response === 1) {      // No guardar
    closableWindows.add(win)
    win.close()
    return
  }

  // Guardar: pide al renderer que guarde y espera su respuesta
  win.webContents.send(IPC.APP_SAVE_REQUEST)
  const saved = await new Promise<boolean>((resolve) => {
    const timer = setTimeout(() => resolve(false), 15000)
    ipcMain.once(IPC.APP_SAVE_REPLY, (_e, success: boolean) => {
      clearTimeout(timer)
      resolve(success)
    })
  })

  if (saved) {
    closableWindows.add(win)
    win.close()
    return
  }

  // El guardado falló o se canceló: nunca dejar la ventana bloqueada
  const { response: fallback } = await dialog.showMessageBox(win, {
    type: 'warning',
    buttons: ['Cerrar de todas formas', 'Cancelar'],
    defaultId: 1,
    cancelId: 1,
    title: 'No se pudo guardar',
    message: 'El guardado no se completó.',
    detail: 'Puedes cerrar perdiendo los cambios, o cancelar y volver al editor.',
  })
  if (fallback === 0) {
    closableWindows.add(win)
    win.close()
  }
}

function createWindow() {
  // Icono de la ventana (Linux y desarrollo; en Windows/macOS empaquetados
  // lo pone electron-builder desde build/icon.png)
  const iconPath = join(__dirname, '../../build/icon.png')

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    ...(existsSync(iconPath) ? { icon: iconPath } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true, // Alexandria — ver alexandriaSecurity.ts
    },
    titleBarStyle: 'hiddenInset',
    title: 'Helecho',
  })

  hardenWebviews(win)

  win.on('close', (e) => {
    if (closableWindows.has(win)) return
    if (!isDirty) return // sin cambios: cierre normal, sin preguntar
    e.preventDefault()
    void handleDirtyClose(win)
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
    win.webContents.openDevTools()
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  // Sin menú nativo: los atajos por defecto de Electron (Ctrl+= zoom
  // del navegador, etc.) pisarían los atajos propios de Helecho
  Menu.setApplicationMenu(null)

  registerFileHandlers()
  registerExportHandlers()
  registerNotebookHandlers()
  registerWatchHandlers()
  registerAlexandriaSecurity()
  registerAdblockHandlers()
  // Si el usuario dejó el bloqueo de anuncios activado, se reengancha solo
  // (asíncrono: no retrasa la creación de la ventana)
  void initAdblock()

  ipcMain.on(IPC.APP_SET_DIRTY, (_e, dirty: boolean, fileName: string) => {
    isDirty = dirty
    dirtyFileName = fileName
  })

  createWindow()

  // Backup de arranque: captura cambios externos (Claude Code, otros
  // editores) hechos desde la última sesión
  void runBackup(notebooksRoot())
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
