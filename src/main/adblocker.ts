import { app, ipcMain, session } from 'electron'
import { promises as fsp } from 'fs'
import { join } from 'path'
import { ElectronBlocker, NetworkFilter, adsAndTrackingLists } from '@ghostery/adblocker-electron'
import { IPC } from '../shared/ipcChannels'
import { ALEXANDRIA_PARTITION } from './alexandriaSecurity'
import { adblockEnabled, setAdblockEnabled } from './vaultConfig'

/**
 * Bloqueo de anuncios de Alexandria — @ghostery/adblocker-electron.
 *
 * Por qué no uBlock Origin como extensión: Manifest V2 + session.loadExtension
 * con soporte parcial que se rompe entre versiones de Electron. Ghostery usa
 * las mismas listas (EasyList) y se engancha limpio a la partición.
 *
 * Solo bloqueo de RED (loadCosmeticFilters: false): el filtrado cosmético de
 * la librería necesita session.registerPreloadScript, que es de Electron 35+
 * (este proyecto congela Electron 32 por los webviews). Lo cosmético solo
 * esconde los huecos que dejan los anuncios — el bloqueo real es el de red.
 * Al subir de Electron, reevaluar.
 *
 * El bloqueador registra onBeforeRequest/onHeadersReceived en la sesión —
 * NO toca onBeforeSendHeaders, así que convive con el truco Firefox/Google
 * de alexandriaSecurity.ts (Electron solo permite un listener por evento).
 */

// YouTube excluido del bloqueo por sus condiciones de servicio (decisión de
// v2.md). Filtros de excepción de sintaxis EasyList (@@ = nunca bloquear).
const EXCEPTION_FILTERS = [
  '@@||youtube.com^',
  '@@||googlevideo.com^',
  '@@||ytimg.com^',
]

let blocker: ElectronBlocker | null = null

async function getBlocker(): Promise<ElectronBlocker> {
  if (blocker) return blocker
  // Las listas se descargan UNA vez y quedan cacheadas (motor serializado);
  // los arranques siguientes leen el binario y funcionan sin red
  const created = await ElectronBlocker.fromLists(
    fetch,
    adsAndTrackingLists,
    { loadCosmeticFilters: false },
    {
      path: join(app.getPath('userData'), 'alexandria-adblock.bin'),
      read: fsp.readFile,
      write: fsp.writeFile,
    }
  )
  // Las excepciones van DESPUÉS de cargar: el binario cacheado no las trae
  created.update({
    newNetworkFilters: EXCEPTION_FILTERS
      .map((f) => NetworkFilter.parse(f))
      .filter((f): f is NetworkFilter => f !== null),
  })
  blocker = created
  return blocker
}

async function setAdblock(enabled: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    const ses = session.fromPartition(ALEXANDRIA_PARTITION)
    if (enabled) {
      const b = await getBlocker()
      if (!b.isBlockingEnabled(ses)) b.enableBlockingInSession(ses)
    } else if (blocker?.isBlockingEnabled(ses)) {
      blocker.disableBlockingInSession(ses)
    }
    setAdblockEnabled(enabled)
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export function registerAdblockHandlers() {
  ipcMain.handle(IPC.ALEXANDRIA_ADBLOCK_GET, () => adblockEnabled())
  ipcMain.handle(IPC.ALEXANDRIA_ADBLOCK_SET, (_e, enabled: boolean) => setAdblock(enabled))
}

/** Arranque: si el usuario lo dejó activado, se reengancha solo. */
export async function initAdblock() {
  if (!adblockEnabled()) return
  const result = await setAdblock(true)
  if (!result.success) {
    // Sin red y sin caché en el primer arranque: no se bloquea el arranque
    // de la app — el usuario verá el error si entra a Configuración
    console.error('[alexandria] el bloqueo de anuncios no pudo iniciarse:', result.error)
  }
}
