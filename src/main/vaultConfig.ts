import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

/**
 * Bóveda de cuadernillos configurable: la ruta vive en
 * userData/helecho-config.json — NUNCA dentro de la carpeta del proyecto,
 * para que clonar el repositorio no mezcle código con apuntes personales.
 */

interface HelechoConfig {
  cuadernillosRoot?: string
  /** Bloqueo de anuncios de Alexandria (apagado por defecto) */
  alexandriaAdblock?: boolean
}

const configPath = () => join(app.getPath('userData'), 'helecho-config.json')

let cachedRoot: string | null = null

function readConfig(): HelechoConfig {
  try {
    return JSON.parse(readFileSync(configPath(), 'utf-8')) as HelechoConfig
  } catch {
    return {}
  }
}

function writeConfig(config: HelechoConfig) {
  mkdirSync(app.getPath('userData'), { recursive: true })
  writeFileSync(configPath(), JSON.stringify(config, null, 2), 'utf-8')
}

export function vaultRoot(): string {
  if (cachedRoot) return cachedRoot
  const config = readConfig()
  if (config.cuadernillosRoot) {
    cachedRoot = config.cuadernillosRoot
    return cachedRoot
  }
  // Primera ejecución sin config. Las instalaciones previas a la bóveda
  // configurable conservan su carpeta (legacy); las nuevas usan la RAÍZ
  // personal del usuario (~/Helecho). Se usa app.getPath('home') porque
  // siempre existe y no depende del nombre traducido de "Documentos"/"Documents"
  // ni de carpetas del sistema: Linux /home/<user>, Windows C:\Users\<user>,
  // macOS /Users/<user>.
  const legacy = join(app.getPath('documents'), 'Helecho', 'cuadernillos')
  const chosen = existsSync(legacy) ? legacy : join(app.getPath('home'), 'Helecho')
  writeConfig({ ...config, cuadernillosRoot: chosen })
  cachedRoot = chosen
  return chosen
}

export function setVaultRoot(path: string) {
  writeConfig({ ...readConfig(), cuadernillosRoot: path })
  cachedRoot = path
}

export function adblockEnabled(): boolean {
  return readConfig().alexandriaAdblock ?? false
}

export function setAdblockEnabled(enabled: boolean) {
  writeConfig({ ...readConfig(), alexandriaAdblock: enabled })
}
