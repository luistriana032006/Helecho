import { ipcMain, dialog, shell, BrowserWindow } from 'electron'
import { mkdir, readdir, readFile, rename, stat, writeFile } from 'fs/promises'
import { basename, dirname, join, resolve, sep } from 'path'
import { IPC } from '../../shared/ipcChannels'
import { vaultRoot, setVaultRoot } from '../vaultConfig'
import type { MateriaInfo, NotebookList, SearchMatch, SearchResult } from '../../shared/notebookTypes'

// Bóveda configurable — ver vaultConfig.ts
export function notebooksRoot(): string {
  return vaultRoot()
}

export function isInsideRoot(target: string): boolean {
  const root = resolve(notebooksRoot())
  const path = resolve(target)
  return path === root || path.startsWith(root + sep)
}

// Evita nombres con separadores de ruta o que escapen del directorio
function sanitizeName(name: string): string {
  return name.replace(/[/\\]/g, '').replace(/^\.+/, '').trim()
}

// Mapeo materia → colección/semestre, guardado junto a los cuadernillos
const COLLECTIONS_FILE = 'colecciones.json'

async function loadCollections(root: string): Promise<Record<string, string>> {
  try {
    return JSON.parse(await readFile(join(root, COLLECTIONS_FILE), 'utf-8')) as Record<string, string>
  } catch {
    return {}
  }
}

export function registerNotebookHandlers() {
  ipcMain.handle(IPC.VAULT_GET, () => notebooksRoot())

  // Selector de bóveda: el usuario elige (o crea) la carpeta de cuadernillos
  ipcMain.handle(IPC.VAULT_SELECT, async (e) => {
    try {
      const win = BrowserWindow.fromWebContents(e.sender)
      if (!win) return { success: false }
      const { canceled, filePaths } = await dialog.showOpenDialog(win, {
        title: 'Selecciona la carpeta de cuadernillos',
        buttonLabel: 'Usar esta carpeta',
        defaultPath: notebooksRoot(),
        properties: ['openDirectory', 'createDirectory'],
      })
      if (canceled || filePaths.length === 0) return { success: false, canceled: true }
      const root = filePaths[0]
      setVaultRoot(root)
      await mkdir(root, { recursive: true })
      return { success: true, root }
    } catch (err) {
      console.error('vault:select error', err)
      return { success: false }
    }
  })

  ipcMain.handle(IPC.NOTEBOOK_LIST, async (): Promise<NotebookList> => {
    const root = notebooksRoot()
    await mkdir(root, { recursive: true })

    const collections = await loadCollections(root)
    const entries = await readdir(root, { withFileTypes: true })
    const materias: MateriaInfo[] = []

    const dirs = entries
      .filter((e) => e.isDirectory())
      .sort((a, b) => a.name.localeCompare(b.name, 'es'))

    for (const dir of dirs) {
      const dirPath = join(root, dir.name)
      const files = await readdir(dirPath, { withFileTypes: true })
      const cuadernillos = await Promise.all(
        files
          .filter((f) => f.isFile() && f.name.endsWith('.md'))
          .map(async (f) => {
            const path = join(dirPath, f.name)
            let createdMs = 0
            try {
              const s = await stat(path)
              createdMs = s.birthtimeMs || s.mtimeMs
            } catch { /* sin fecha: queda al inicio */ }
            return { name: f.name.replace(/\.md$/, ''), path, createdMs }
          })
      )
      // Orden cronológico: el cuadernillo más antiguo primero
      cuadernillos.sort((a, b) => a.createdMs - b.createdMs)
      materias.push({
        name: dir.name,
        path: dirPath,
        coleccion: collections[dir.name] ?? null,
        cuadernillos,
      })
    }

    return { root, materias }
  })

  ipcMain.handle(IPC.NOTEBOOK_SET_COLLECTION, async (_e, materiaName: string, coleccion: string | null) => {
    try {
      const root = notebooksRoot()
      await mkdir(root, { recursive: true })
      const map = await loadCollections(root)
      const clean = coleccion ? sanitizeName(coleccion) : null
      if (clean) map[materiaName] = clean
      else delete map[materiaName]
      await writeFile(join(root, COLLECTIONS_FILE), JSON.stringify(map, null, 2), 'utf-8')
      return { success: true }
    } catch (err) {
      console.error('notebook:setCollection error', err)
      return { success: false }
    }
  })

  ipcMain.handle(IPC.NOTEBOOK_CREATE_SUBJECT, async (_e, name: string) => {
    try {
      const clean = sanitizeName(name)
      if (!clean) return { success: false }
      await mkdir(join(notebooksRoot(), clean), { recursive: true })
      return { success: true }
    } catch (err) {
      console.error('notebook:createSubject error', err)
      return { success: false }
    }
  })

  ipcMain.handle(IPC.NOTEBOOK_CREATE, async (_e, materiaPath: string, name: string) => {
    try {
      const clean = sanitizeName(name)
      if (!clean || !isInsideRoot(materiaPath)) return { success: false }
      const fileName = clean.endsWith('.md') ? clean : `${clean}.md`
      const filePath = join(materiaPath, fileName)
      // 'wx' falla si el archivo ya existe — no pisa cuadernillos
      await writeFile(filePath, '', { flag: 'wx' })
      return { success: true, filePath }
    } catch (err) {
      console.error('notebook:create error', err)
      return { success: false, error: 'exists' }
    }
  })

  // Renombra una materia (carpeta) o un cuadernillo (archivo .md).
  // Para materias, migra también su entrada en colecciones.json.
  ipcMain.handle(IPC.NOTEBOOK_RENAME, async (_e, path: string, newName: string) => {
    try {
      const clean = sanitizeName(newName)
      if (!clean || !isInsideRoot(path)) return { success: false }

      const info = await stat(path)
      const isDir = info.isDirectory()
      const newPath = isDir
        ? join(dirname(path), clean)
        : join(dirname(path), clean.endsWith('.md') ? clean : `${clean}.md`)

      if (newPath === path) return { success: true, newPath }
      if (!isInsideRoot(newPath)) return { success: false }

      // No pisar algo existente
      try {
        await stat(newPath)
        return { success: false, error: 'exists' }
      } catch { /* no existe: perfecto */ }

      await rename(path, newPath)

      if (isDir) {
        const root = notebooksRoot()
        const map = await loadCollections(root)
        const oldName = basename(path)
        if (map[oldName]) {
          map[clean] = map[oldName]
          delete map[oldName]
          await writeFile(join(root, COLLECTIONS_FILE), JSON.stringify(map, null, 2), 'utf-8')
        }
      }

      return { success: true, newPath }
    } catch (err) {
      console.error('notebook:rename error', err)
      return { success: false }
    }
  })

  // Elimina una materia (carpeta) o un cuadernillo (archivo): confirma
  // con diálogo nativo y mueve a la papelera del sistema (recuperable)
  ipcMain.handle(IPC.NOTEBOOK_DELETE, async (e, path: string, label: string) => {
    try {
      if (!isInsideRoot(path)) return { success: false }
      const win = BrowserWindow.fromWebContents(e.sender)
      if (!win) return { success: false }

      const { response } = await dialog.showMessageBox(win, {
        type: 'warning',
        buttons: ['Mover a la papelera', 'Cancelar'],
        defaultId: 1,
        cancelId: 1,
        title: 'Eliminar',
        message: `¿Eliminar "${label}"?`,
        detail: 'Se moverá a la papelera del sistema; podrás recuperarlo desde ahí.',
      })
      if (response !== 0) return { success: false, canceled: true }

      await shell.trashItem(path)

      // Si era una materia, se quita del mapeo de colecciones
      const root = notebooksRoot()
      const map = await loadCollections(root)
      if (map[basename(path)]) {
        delete map[basename(path)]
        await writeFile(join(root, COLLECTIONS_FILE), JSON.stringify(map, null, 2), 'utf-8')
      }

      return { success: true }
    } catch (err) {
      console.error('notebook:delete error', err)
      return { success: false }
    }
  })

  // Búsqueda global: recorre todos los .md de todas las materias.
  // Devuelve hasta 5 líneas coincidentes por cuadernillo y 50 cuadernillos.
  ipcMain.handle(IPC.SEARCH_GLOBAL, async (_e, query: string): Promise<SearchResult[]> => {
    try {
      const q = query.trim().toLowerCase()
      if (q.length < 2) return []

      const root = notebooksRoot()
      await mkdir(root, { recursive: true })
      const results: SearchResult[] = []

      const dirs = (await readdir(root, { withFileTypes: true }))
        .filter((e) => e.isDirectory())
        .sort((a, b) => a.name.localeCompare(b.name, 'es'))

      for (const dir of dirs) {
        const dirPath = join(root, dir.name)
        const files = (await readdir(dirPath, { withFileTypes: true }))
          .filter((f) => f.isFile() && f.name.endsWith('.md'))
          .sort((a, b) => a.name.localeCompare(b.name, 'es'))

        for (const f of files) {
          const filePath = join(dirPath, f.name)
          let content: string
          try {
            content = await readFile(filePath, 'utf-8')
          } catch {
            continue
          }

          const name = f.name.replace(/\.md$/, '')
          const nameMatch = name.toLowerCase().includes(q)
          const matches: SearchMatch[] = []
          const lines = content.split('\n')
          for (let i = 0; i < lines.length && matches.length < 5; i++) {
            if (lines[i].toLowerCase().includes(q)) {
              matches.push({ line: i + 1, text: lines[i].trim().slice(0, 160) })
            }
          }

          if (nameMatch || matches.length > 0) {
            results.push({ materia: dir.name, name, path: filePath, nameMatch, matches })
            if (results.length >= 50) return results
          }
        }
      }
      return results
    } catch (err) {
      console.error('search:global error', err)
      return []
    }
  })

  ipcMain.handle(IPC.FILE_READ, async (_e, filePath: string) => {
    try {
      if (!isInsideRoot(filePath)) return null
      const content = await readFile(filePath, 'utf-8')
      return { content, filePath }
    } catch (err) {
      console.error('file:read error', err)
      return null
    }
  })
}
