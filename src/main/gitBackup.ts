import { exec } from 'child_process'
import { promisify } from 'util'
import { mkdir } from 'fs/promises'

const execAsync = promisify(exec)

/**
 * Backup Git invisible de la carpeta de cuadernillos.
 * - Inicializa el repo y la identidad local la primera vez.
 * - Cada guardado/cambio agenda un commit (debounce de 3 s para agrupar).
 * - Si git no está instalado, se desactiva en silencio (solo un aviso en log).
 */

let timer: NodeJS.Timeout | null = null
let gitAvailable: boolean | null = null

function git(args: string, cwd: string) {
  return execAsync(`git ${args}`, { cwd })
}

async function ensureRepo(root: string): Promise<boolean> {
  if (gitAvailable === false) return false

  if (gitAvailable === null) {
    try {
      await execAsync('git --version')
      gitAvailable = true
    } catch {
      gitAvailable = false
      console.warn('Backup Git: git no está instalado — backups desactivados')
      return false
    }
  }

  await mkdir(root, { recursive: true })

  // Repo nuevo si la carpeta aún no es uno
  try {
    await git('rev-parse --git-dir', root)
  } catch {
    await git('init', root)
  }

  // Identidad local para poder commitear aunque git no esté configurado
  try {
    const { stdout } = await git('config user.name', root)
    if (!stdout.trim()) throw new Error('sin identidad')
  } catch {
    await git('config user.name "Helecho Backup"', root)
    await git('config user.email "backup@helecho.local"', root)
  }

  return true
}

export async function runBackup(root: string): Promise<void> {
  try {
    if (!(await ensureRepo(root))) return
    const { stdout } = await git('status --porcelain', root)
    if (!stdout.trim()) return
    await git('add -A', root)
    const fecha = new Date().toLocaleString('es-CO')
    await git(`commit -m "Backup automático — ${fecha}"`, root)
  } catch (err) {
    console.error('Backup Git falló', err)
  }
}

export function scheduleBackup(root: string, delayMs = 3000): void {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    timer = null
    void runBackup(root)
  }, delayMs)
}
