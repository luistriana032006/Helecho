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
export function initAutoUpdater(win: BrowserWindow) {
  // El renderer pide instalar: reinicia y aplica la actualización descargada.
  ipcMain.on(IPC.UPDATE_INSTALL, () => {
    autoUpdater.quitAndInstall()
  })

  if (!app.isPackaged) return // en dev no hay feed de actualizaciones

  autoUpdater.autoDownload = true            // baja la versión nueva sola
  autoUpdater.autoInstallOnAppQuit = true    // si no reinician, se instala al salir

  const send = (channel: string, payload?: unknown) => {
    if (!win.isDestroyed()) win.webContents.send(channel, payload)
  }

  autoUpdater.on('update-available', (info) => {
    send(IPC.UPDATE_AVAILABLE, { version: info.version })
  })

  autoUpdater.on('update-downloaded', (info) => {
    send(IPC.UPDATE_DOWNLOADED, { version: info.version })
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
