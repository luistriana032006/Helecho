import { app } from 'electron'
import { execFile } from 'child_process'
import { createHash } from 'crypto'
import { promises as fsp } from 'fs'
import { homedir } from 'os'
import { basename, join } from 'path'
import { pathToFileURL } from 'url'

/**
 * Word/PowerPoint al panel de referencia: se convierten a PDF con LibreOffice
 * headless (decisión de v2.md) y el panel los muestra con su visor de PDF de
 * siempre — se conserva el layout real del documento, cosa que una conversión
 * a HTML no garantiza.
 */

/** Extensiones que pasan por LibreOffice → PDF */
export const OFFICE_EXTENSIONS = ['doc', 'docx', 'odt', 'rtf', 'ppt', 'pptx', 'odp']

const CONVERT_TIMEOUT_MS = 60_000

const cacheDir = () => join(app.getPath('userData'), 'reference-cache')

// Candidatos por plataforma; se recuerda el que funcione
const SOFFICE_CANDIDATES =
  process.platform === 'win32'
    ? [
        'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
        'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
      ]
    : process.platform === 'darwin'
      ? [
          '/Applications/LibreOffice.app/Contents/MacOS/soffice',
          join(homedir(), 'Applications/LibreOffice.app/Contents/MacOS/soffice'),
          '/opt/homebrew/bin/soffice',
          '/usr/local/bin/soffice',
          'soffice',
        ]
      : ['soffice', 'libreoffice']

let sofficeBin: string | null | undefined

const run = (bin: string, args: string[]) =>
  new Promise<void>((resolve, reject) => {
    execFile(bin, args, { timeout: CONVERT_TIMEOUT_MS }, (err, _stdout, stderr) => {
      if (err) reject(new Error(stderr?.trim() || err.message))
      else resolve()
    })
  })

async function findSoffice(): Promise<string | null> {
  if (sofficeBin !== undefined) return sofficeBin
  for (const candidate of SOFFICE_CANDIDATES) {
    try {
      await run(candidate, ['--version'])
      sofficeBin = candidate
      return candidate
    } catch {
      // siguiente candidato
    }
  }
  sofficeBin = null
  return null
}

/**
 * Convierte un documento de oficina a PDF y devuelve los bytes.
 * Cachea por ruta+fecha de modificación: reabrir el mismo documento (o
 * restaurarlo al arrancar) es instantáneo; si el archivo cambió, reconvierte.
 *
 * Las conversiones van en COLA: dos soffice simultáneos sobre el mismo
 * perfil fallan en silencio (exit 0 sin producir el PDF — verificado).
 */
let conversionQueue: Promise<unknown> = Promise.resolve()

export function convertToPdf(filePath: string): Promise<Buffer> {
  const task = conversionQueue.then(() => doConvert(filePath))
  conversionQueue = task.catch(() => undefined)
  return task
}

async function doConvert(filePath: string): Promise<Buffer> {
  const stat = await fsp.stat(filePath)
  const hash = createHash('sha1').update(`${filePath}|${stat.mtimeMs}|${stat.size}`).digest('hex')
  const cached = join(cacheDir(), `${hash}.pdf`)
  try {
    return await fsp.readFile(cached)
  } catch {
    // no está en caché: convertir
  }

  const soffice = await findSoffice()
  if (!soffice) {
    throw new Error(
      'Para ver Word o PowerPoint se necesita LibreOffice (gratis, libreoffice.org): ' +
        'Helecho lo usa para convertir el documento a PDF.'
    )
  }

  // Carpeta de salida única por conversión (los nombres de LibreOffice
  // chocan entre archivos homónimos) y perfil propio: si el LibreOffice
  // de escritorio está abierto, el perfil por defecto está bloqueado y
  // la conversión headless fallaría en silencio
  const outDir = join(cacheDir(), `${hash}.tmp`)
  await fsp.mkdir(outDir, { recursive: true })
  const profileUrl = pathToFileURL(join(cacheDir(), 'lo-profile')).href
  try {
    await run(soffice, [
      `-env:UserInstallation=${profileUrl}`,
      '--headless',
      '--norestore',
      '--convert-to',
      'pdf',
      '--outdir',
      outDir,
      filePath,
    ])
    const produced = join(outDir, basename(filePath).replace(/\.[^.]+$/, '') + '.pdf')
    const data = await fsp.readFile(produced).catch(() => {
      throw new Error('LibreOffice no produjo el PDF. ¿El documento está dañado o protegido?')
    })
    await fsp.rename(produced, cached)
    return data
  } finally {
    await fsp.rm(outDir, { recursive: true, force: true })
  }
}
