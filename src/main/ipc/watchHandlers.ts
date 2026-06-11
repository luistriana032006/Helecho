import { ipcMain } from 'electron'
import { watch } from 'fs'
import type { FSWatcher } from 'fs'
import { readFile } from 'fs/promises'
import { basename, dirname } from 'path'
import { IPC } from '../../shared/ipcChannels'

/**
 * Vigila el archivo abierto en el editor y avisa al renderer cuando
 * cambia en disco (p. ej. editado por Claude Code). Se vigila el
 * directorio padre filtrando por nombre: así sobreviven los guardados
 * atómicos (escribir temporal + renombrar) que rompen el watch directo.
 */
let watcher: FSWatcher | null = null
let debounce: NodeJS.Timeout | null = null

function stopWatching() {
  if (debounce) clearTimeout(debounce)
  debounce = null
  watcher?.close()
  watcher = null
}

export function registerWatchHandlers() {
  ipcMain.handle(IPC.FILE_WATCH, (e, filePath: string) => {
    stopWatching()
    try {
      const dir = dirname(filePath)
      const name = basename(filePath)
      watcher = watch(dir, (_eventType, changedName) => {
        if (changedName !== name) return
        // Los editores disparan varios eventos por guardado: se agrupan
        if (debounce) clearTimeout(debounce)
        debounce = setTimeout(async () => {
          try {
            const content = await readFile(filePath, 'utf-8')
            if (!e.sender.isDestroyed()) {
              e.sender.send(IPC.FILE_CHANGED, { filePath, content })
            }
          } catch {
            // archivo borrado o renombrado: no hay nada que recargar
          }
        }, 150)
      })
    } catch (err) {
      console.error('file:watch error', err)
    }
  })

  ipcMain.handle(IPC.FILE_UNWATCH, () => stopWatching())
}
