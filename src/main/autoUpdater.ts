import { app, BrowserWindow, ipcMain } from 'electron'
import electronUpdater from 'electron-updater'
import { IPC } from '../shared/ipcChannels'

const { autoUpdater } = electronUpdater

// Auto-update contra GitHub Releases. Comportamiento: descarga sola en segundo
// plano y, cuando el instalador ya está listo, avisa al renderer para que
// muestre el banner "Reiniciar para actualizar". El usuario decide cuándo
// reiniciar (nunca se cierra la app por su cuenta).
//
// OJO: en desarrollo (app sin empaquetar) no hay app-update.yml y autoUpdater
// lanzaría un error. Por eso todo se activa SOLO cuando la app está empaquetada.
export function initAutoUpdater() {
  // El renderer pide instalar: reinicia y aplica la actualización descargada.
  ipcMain.on(IPC.UPDATE_INSTALL, () => {
    autoUpdater.quitAndInstall()
  })

  if (!app.isPackaged) return // en dev no hay feed de actualizaciones

  autoUpdater.autoDownload = true            // baja la versión nueva sola
  autoUpdater.autoInstallOnAppQuit = true    // si no reinician, se instala al salir

  let downloadedUpdate: { version: string } | undefined

  const send = (channel: string, payload?: unknown) => {
    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.isDestroyed()) win.webContents.send(channel, payload)
    }
  }

  // En macOS cerrar todas las ventanas no cierra la aplicación. Si una
  // actualización terminó mientras no había ventanas, se avisa al reabrir.
  app.on('browser-window-created', (_event, win) => {
    win.webContents.once('did-finish-load', () => {
      if (downloadedUpdate) win.webContents.send(IPC.UPDATE_DOWNLOADED, downloadedUpdate)
    })
  })

  autoUpdater.on('update-available', (info) => {
    send(IPC.UPDATE_AVAILABLE, { version: info.version })
  })

  autoUpdater.on('update-downloaded', (info) => {
    downloadedUpdate = { version: info.version }
    send(IPC.UPDATE_DOWNLOADED, downloadedUpdate)
  })

  autoUpdater.on('error', (err) => {
    // Un fallo de red no debe romper nada: se registra y la app sigue igual.
    console.error('[autoUpdater]', err instanceof Error ? err.message : err)
    send(IPC.UPDATE_ERROR)
  })

  // Revisa al arrancar y luego cada 6 horas (por si dejan la app abierta días).
  void autoUpdater.checkForUpdates().catch(() => {})
  setInterval(() => {
    void autoUpdater.checkForUpdates().catch(() => {})
  }, 6 * 60 * 60 * 1000)
}
