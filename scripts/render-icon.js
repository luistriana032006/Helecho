/**
 * Genera build/icon.png (1024×1024) dibujando el icono de Helecho con el
 * canvas de Chromium — sin depender de ImageMagick/Inkscape.
 *
 * electron-builder convierte ese PNG a .ico (Windows) y .icns (macOS)
 * automáticamente al empaquetar, por estar en build/ (buildResources).
 *
 * Regenerar:  env -u ELECTRON_RUN_AS_NODE DISPLAY=:0 npx electron --no-sandbox scripts/render-icon.js
 */
const { app, BrowserWindow } = require('electron')
const { writeFileSync, mkdirSync } = require('fs')
const { join } = require('path')

function draw() {
  const S = 1024
  const canvas = document.getElementById('c')
  const ctx = canvas.getContext('2d')

  // ── Fondo: cuadrado redondeado con degradado verde profundo ──
  const inset = 52 // margen transparente (respiro estilo macOS)
  const r = 190
  const bg = ctx.createLinearGradient(inset, inset, S - inset, S - inset)
  bg.addColorStop(0, '#1d7a46')
  bg.addColorStop(0.55, '#14582f')
  bg.addColorStop(1, '#0a3d20')
  ctx.beginPath()
  ctx.roundRect(inset, inset, S - 2 * inset, S - 2 * inset, r)
  ctx.fillStyle = bg
  ctx.fill()

  // Brillo sutil arriba-izquierda
  const shine = ctx.createRadialGradient(S * 0.3, S * 0.22, 60, S * 0.3, S * 0.22, S * 0.75)
  shine.addColorStop(0, 'rgba(255,255,255,0.14)')
  shine.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.beginPath()
  ctx.roundRect(inset, inset, S - 2 * inset, S - 2 * inset, r)
  ctx.fillStyle = shine
  ctx.fill()

  // ── Fronda de helecho ──
  // Raquis (tallo): bézier cúbica, de la base a la punta
  const P0 = { x: 480, y: 868 }
  const P1 = { x: 470, y: 640 }
  const P2 = { x: 560, y: 420 }
  const P3 = { x: 545, y: 180 }
  const bez = (t) => {
    const u = 1 - t
    return {
      x: u * u * u * P0.x + 3 * u * u * t * P1.x + 3 * u * t * t * P2.x + t * t * t * P3.x,
      y: u * u * u * P0.y + 3 * u * u * t * P1.y + 3 * u * t * t * P2.y + t * t * t * P3.y,
    }
  }
  const tangent = (t) => {
    const u = 1 - t
    const dx = 3 * u * u * (P1.x - P0.x) + 6 * u * t * (P2.x - P1.x) + 3 * t * t * (P3.x - P2.x)
    const dy = 3 * u * u * (P1.y - P0.y) + 6 * u * t * (P2.y - P1.y) + 3 * t * t * (P3.y - P2.y)
    return Math.atan2(dy, dx)
  }

  const leaf = '#d3f8c8'

  // Tallo: trazos cortos con grosor decreciente (canvas no afila líneas)
  ctx.strokeStyle = leaf
  ctx.lineCap = 'round'
  const STEPS = 60
  for (let i = 0; i < STEPS; i++) {
    const t0 = i / STEPS
    const t1 = (i + 1) / STEPS
    const a = bez(t0)
    const b = bez(t1)
    ctx.lineWidth = 26 * (1 - t0) + 6
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
  }

  // Pinnas (hojuelas): pares a lo largo del tallo, decrecientes hacia la punta
  const teardrop = (len, width) => {
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.quadraticCurveTo(len * 0.42, -width, len, -width * 0.1)
    ctx.quadraticCurveTo(len * 0.46, width * 0.55, 0, 0)
    ctx.closePath()
    ctx.fill()
  }

  ctx.fillStyle = leaf
  const PAIRS = 9
  for (let i = 0; i < PAIRS; i++) {
    const t = 0.1 + (i / (PAIRS - 1)) * 0.76
    const p = bez(t)
    const ang = tangent(t) // apunta "hacia arriba" del tallo (dy negativo)
    const len = 215 * Math.pow(1 - t, 1.25) + 42
    const width = len * 0.27

    for (const side of [-1, 1]) {
      ctx.save()
      ctx.translate(p.x, p.y)
      // ±58° respecto del tallo, inclinadas hacia la punta
      ctx.rotate(ang + side * (Math.PI / 180) * 58)
      teardrop(len, width * side)
      ctx.restore()
    }
  }

  // Báculo: la punta enrollada característica del helecho joven
  const tip = bez(1)
  ctx.strokeStyle = leaf
  ctx.lineWidth = 13
  ctx.beginPath()
  ctx.arc(tip.x + 26, tip.y - 6, 30, Math.PI * 0.9, Math.PI * 2.25)
  ctx.stroke()

  return canvas.toDataURL('image/png')
}

app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, width: 100, height: 100 })
  await win.loadURL('data:text/html,<canvas id="c" width="1024" height="1024"></canvas>')
  const dataUrl = await win.webContents.executeJavaScript(`(${draw.toString()})()`)
  const out = join(__dirname, '..', 'build')
  mkdirSync(out, { recursive: true })
  writeFileSync(join(out, 'icon.png'), Buffer.from(dataUrl.split(',')[1], 'base64'))
  console.log('✓ build/icon.png generado (1024×1024)')
  app.quit()
})
