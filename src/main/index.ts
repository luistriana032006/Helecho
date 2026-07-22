import { app, BrowserWindow, Menu, dialog, ipcMain, type MenuItemConstructorOptions } from 'electron'
import { existsSync } from 'fs'
import { join } from 'path'
import { IPC } from '../shared/ipcChannels'
import { registerFileHandlers } from './ipc/fileHandlers'
import { registerExportHandlers } from './ipc/exportHandlers'
import { registerNotebookHandlers } from './ipc/notebookHandlers'
import { registerWatchHandlers } from './ipc/watchHandlers'
import { registerAlexandriaSecurity, hardenWebviews } from './alexandriaSecurity'
import { registerAdblockHandlers, initAdblock } from './adblocker'
import { initAutoUpdater } from './autoUpdater'
import { integrateAppImage } from './appImageIntegration'

// Linux: identidad estable de la ventana para que GNOME le ASOCIE el icono.
// En Linux el icono NO sale del BrowserWindow (se ignora en Wayland/X11) —
// GNOME cruza el WM_CLASS/app_id de la ventana contra un archivo .desktop
// instalado. Se fijan ambos a "Helecho" para que casen con el StartupWMClass
// del .desktop que instala iniciar.sh. En el AppImage empaquetado esto lo
// resuelve electron-builder; este bloque es para el modo desarrollo.
if (process.platform === 'linux') {
  app.setName('Helecho')
  app.commandLine.appendSwitch('class', 'Helecho')
  // OJO: app.setName mueve userData a ~/.config/Helecho (mayúscula). En Linux
  // eso es OTRA carpeta y orfana el perfil entero — sesión de Google de
  // Alexandria, config de bóveda, ajustes. Se fija userData de vuelta a
  // ~/.config/helecho (el name del package.json), independiente del nombre
  // visible que necesita el WM_CLASS del icono.
  app.setPath('userData', join(app.getPath('appData'), 'helecho'))
}

// Electron 32 (Chromium 128) lanza esta excepción interna cuando una página
// crea y destruye iframes a gran velocidad — el cliente web de Zoom lo hace al
// montar una videollamada. Para cuando un handler interno de WebContents
// accede al frame, este ya fue destruido. Es benigno (la llamada entra igual),
// pero sin guard salta el diálogo nativo de error del main y lo interrumpe.
// Se silencia SOLO ese error conocido; cualquier otro conserva el diálogo de
// antes para no ocultar fallos reales.
const DISPOSED_FRAME = 'Render frame was disposed before WebFrameMain could be accessed'
process.on('uncaughtException', (err) => {
  const message = err instanceof Error ? err.message : String(err)
  if (message.includes(DISPOSED_FRAME)) return
  console.error('Uncaught Exception:', err)
  dialog.showErrorBox('Uncaught Exception', message)
})

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
    // macOS necesita una barra nativa movible y espacio para los semáforos.
    // hiddenInset se conserva en las demás plataformas, donde ya era usado.
    ...(process.platform === 'darwin' ? {} : { titleBarStyle: 'hiddenInset' as const }),
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

  return win
}

function configureApplicationMenu() {
  if (process.platform !== 'darwin') {
    // En Linux/Windows los atajos nativos de zoom pisan los propios de Helecho.
    Menu.setApplicationMenu(null)
    return
  }

  const template: MenuItemConstructorOptions[] = [
    { role: 'appMenu' },
    {
      role: 'viewMenu',
      submenu: [
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    { role: 'windowMenu' },
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

app.whenReady().then(() => {
  configureApplicationMenu()

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
  // Auto-update contra GitHub Releases (solo en la app empaquetada)
  initAutoUpdater()
  // AppImage: registra icono y entrada de menú en ~/.local/share (solo Linux
  // corriendo como AppImage; en dev y .deb no hace nada)
  integrateAppImage()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
