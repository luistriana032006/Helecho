import { ipcMain, dialog, BrowserWindow, app } from 'electron'
import { writeFile, readFile, unlink } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { pathToFileURL } from 'url'
import { IPC } from '../../shared/ipcChannels'

async function getKatexCss(): Promise<string> {
  try {
    const appPath = app.getAppPath()
    const cssPath = join(appPath, 'node_modules', 'katex', 'dist', 'katex.min.css')
    const fontsDir = join(appPath, 'node_modules', 'katex', 'dist', 'fonts', '')
    const fontsUrl = pathToFileURL(fontsDir).href
    let css = await readFile(cssPath, 'utf-8')
    css = css.replace(/url\(fonts\//g, `url(${fontsUrl}`)
    return css
  } catch {
    return ''
  }
}

function buildHtml(content: string, katexCss: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    ${katexCss}

    @page { size: A4; margin: 20mm; }

    * { box-sizing: border-box; }

    body {
      font-family: 'Times New Roman', serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #000;
      margin: 0;
      padding: 0;
    }

    h1 { font-size: 22pt; margin: 0 0 12pt; }
    h2 { font-size: 16pt; margin: 14pt 0 8pt; }
    h3 { font-size: 13pt; margin: 12pt 0 6pt; }

    p { margin: 0 0 8pt; }

    ul, ol { margin: 0 0 8pt; padding-left: 20pt; }
    li { margin-bottom: 3pt; }

    strong { font-weight: bold; }
    s  { text-decoration: line-through; }
    u  { text-decoration: underline; }

    table { border-collapse: collapse; width: 100%; margin: 8pt 0; }
    th, td { border: 1px solid #999; padding: 4pt 8pt; text-align: left; }
    th { background: #f0f0f0; font-weight: bold; }

    .katex { font-size: 1em; }
    .math-inline { display: inline; }
  </style>
</head>
<body>${content}</body>
</html>`
}

export function registerExportHandlers() {
  ipcMain.handle(IPC.EXPORT_MD, async (_e, markdownContent: string) => {
    try {
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'Exportar Markdown',
        filters: [
          { name: 'Markdown', extensions: ['md'] },
          { name: 'Todos los archivos', extensions: ['*'] },
        ],
        defaultPath: 'apunte.md',
      })
      if (canceled || !filePath) return { success: false }
      await writeFile(filePath, markdownContent, 'utf-8')
      return { success: true, filePath }
    } catch (err) {
      console.error('export:md error', err)
      return { success: false }
    }
  })

  ipcMain.handle(IPC.EXPORT_PDF, async (_e, htmlContent: string) => {
    let pdfWin: BrowserWindow | null = null
    let tmpPath: string | null = null

    try {
      const katexCss = await getKatexCss()
      const html = buildHtml(htmlContent, katexCss)

      tmpPath = join(tmpdir(), `helecho-${Date.now()}.html`)
      await writeFile(tmpPath, html, 'utf-8')

      pdfWin = new BrowserWindow({
        show: false,
        webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: false },
      })
      await pdfWin.loadFile(tmpPath)

      const pdfBuffer = await pdfWin.webContents.printToPDF({
        pageSize: 'A4',
        printBackground: true,
      })

      const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'Exportar PDF',
        filters: [{ name: 'PDF', extensions: ['pdf'] }],
        defaultPath: 'apunte.pdf',
      })
      if (canceled || !filePath) return { success: false }

      await writeFile(filePath, pdfBuffer)
      return { success: true, filePath }

    } catch (err) {
      console.error('export:pdf error', err)
      return { success: false }
    } finally {
      pdfWin?.close()
      if (tmpPath) await unlink(tmpPath).catch(() => {})
    }
  })
}
