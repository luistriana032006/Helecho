import { app } from 'electron'
import { existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { homedir } from 'os'
import { execFile } from 'child_process'

// Un AppImage es portable por diseño: NUNCA aparece en el menú de aplicaciones
// ni registra su icono, porque nada lo "instala" en el sistema. Este módulo lo
// integra solo: al arrancar como AppImage (el runtime inyecta APPIMAGE=ruta al
// .AppImage y APPDIR=punto de montaje del squashfs), copia el icono a
// ~/.local/share/icons y escribe un .desktop en ~/.local/share/applications
// apuntando a la ruta actual del AppImage. Es idempotente (solo escribe si
// algo cambió) y se auto-repara: si el usuario mueve/renombra el AppImage o
// el auto-updater instala una versión con otro nombre de archivo, el próximo
// arranque reescribe el Exec del .desktop con la ruta nueva.
export function integrateAppImage(): void {
  const appImagePath = process.env['APPIMAGE']
  const appDir = process.env['APPDIR']
  // Fuera de un AppImage (dev, .deb, etc.) no hay nada que integrar
  if (process.platform !== 'linux' || !appImagePath || !appDir) return
  if (!existsSync(appImagePath)) return

  try {
    const dataHome = process.env['XDG_DATA_HOME'] || join(homedir(), '.local', 'share')

    // ── Icono ─────────────────────────────────────────────────────────────
    // electron-builder lo empaqueta dentro del AppImage en hicolor/1024x1024,
    // pero el index.theme de hicolor solo llega hasta 512x512: un icono en
    // 1024x1024 es invisible para GNOME (pinta el engrane genérico). Se copia
    // a 512x512 del usuario — GTK reescala el PNG al cargarlo, no importa que
    // el archivo mida 1024px — para que el tema lo resuelva por nombre
    // ("helecho") desde el .desktop.
    const bundledIcon = join(appDir, 'usr', 'share', 'icons', 'hicolor', '1024x1024', 'apps', 'helecho.png')
    const userIcon = join(dataHome, 'icons', 'hicolor', '512x512', 'apps', 'helecho.png')
    if (existsSync(bundledIcon) && !existsSync(userIcon)) {
      mkdirSync(dirname(userIcon), { recursive: true })
      copyFileSync(bundledIcon, userIcon)
      // Refresca la caché de iconos para que GNOME/KDE lo vean sin re-login.
      // Best-effort: si la herramienta no existe, el icono aparece igual al
      // siguiente inicio de sesión.
      execFile('gtk-update-icon-cache', ['-f', '-t', join(dataHome, 'icons', 'hicolor')], () => {})
    }

    // ── Entrada del menú (.desktop) ───────────────────────────────────────
    // StartupWMClass debe casar con el WM_CLASS de la ventana ("Helecho",
    // fijado en index.ts) para que GNOME asocie la ventana abierta con esta
    // entrada y le pinte el icono en el dock.
    const desktopDir = join(dataHome, 'applications')
    const desktopFile = join(desktopDir, 'helecho.desktop')
    const desktopContent = `[Desktop Entry]
Name=Helecho
Comment=Espacio de estudio: notas, mapas y bóveda de conocimiento
Exec="${appImagePath}" %U
Icon=helecho
Type=Application
Terminal=false
Categories=Education;Office;
StartupWMClass=Helecho
X-AppImage-Version=${app.getVersion()}
`
    const current = existsSync(desktopFile) ? readFileSync(desktopFile, 'utf-8') : ''
    if (current !== desktopContent) {
      mkdirSync(desktopDir, { recursive: true })
      writeFileSync(desktopFile, desktopContent, { mode: 0o755 })
      // Best-effort igual que el icono: sin esto también funciona, solo tarda
      execFile('update-desktop-database', [desktopDir], () => {})
    }
  } catch (err) {
    // La integración es un extra de comodidad: si falla (p. ej. $HOME de solo
    // lectura en un live-USB) la app debe arrancar normal, sin diálogos.
    console.error('AppImage: fallo al integrar con el escritorio:', err)
  }
}
