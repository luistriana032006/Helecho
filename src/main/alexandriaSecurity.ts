import {
  app,
  desktopCapturer,
  dialog,
  session,
  shell,
  webContents,
  BrowserWindow,
  type WebContents,
} from 'electron'
import { IPC } from '../shared/ipcChannels'

/**
 * Seguridad de Alexandria (navegador embebido).
 *
 * Un navegador NO abre puertos: sus conexiones son salientes. El riesgo
 * real es el contenido web intentando escapar del webview hacia la app.
 * Defensas: el contenido invitado corre sin Node ni preload, en una
 * partición propia, con permisos bajo control y solo protocolos http/https.
 */

export const ALEXANDRIA_PARTITION = 'persist:alexandria'

// Los sitios con anti-bot (DeepSeek, Cloudflare…) niegan el servicio si el
// user agent delata "Electron". Alexandria se presenta como el Chrome
// equivalente: es el mismo motor Chromium y la misma versión — solo se
// quitan las etiquetas Electron/Helecho del saludo.
const UA_PLATFORM =
  process.platform === 'win32'
    ? 'Windows NT 10.0; Win64; x64'
    : process.platform === 'darwin'
      ? 'Macintosh; Intel Mac OS X 10_15_7'
      : 'X11; Linux x86_64'

const ALEXANDRIA_USER_AGENT =
  `Mozilla/5.0 (${UA_PLATFORM}) AppleWebKit/537.36 (KHTML, like Gecko) ` +
  `Chrome/${process.versions.chrome} Safari/537.36`

// Google rechaza el inicio de sesión de navegadores embebidos que dicen ser
// Chrome ("Es posible que no sean seguros este navegador o la app"): exige
// chequeos internos que solo el Chrome completo pasa. Solución estándar de
// las apps Electron (Ferdium, Franz): presentarse como Firefox SOLO en
// accounts.google.com — a Firefox no le exige esos chequeos.
const FF_PLATFORM =
  process.platform === 'win32'
    ? 'Windows NT 10.0; Win64; x64; rv:140.0'
    : process.platform === 'darwin'
      ? 'Macintosh; Intel Mac OS X 10.15; rv:140.0'
      : 'X11; Linux x86_64; rv:140.0'

const FIREFOX_USER_AGENT = `Mozilla/5.0 (${FF_PLATFORM}) Gecko/20100101 Firefox/140.0`

const hostnameOf = (url: string): string => {
  try {
    return new URL(url).hostname
  } catch {
    return ''
  }
}

// La identidad debe ser CONSISTENTE en todo el ecosistema Google: entrar a
// YouTube como Chrome y llegar a accounts.google.com como Firefox fue
// detectado y rechazado (signin/rejected). Firefox en todos sus dominios.
const isGoogleHost = (hostname: string): boolean =>
  hostname === 'google.com' ||
  hostname.endsWith('.google.com') ||
  hostname === 'youtube.com' ||
  hostname.endsWith('.youtube.com')

// Meet es la excepción al disfraz Firefox: su WebRTC sirve la ruta de codecs
// según el navegador que detecta, y un SDP estilo-Firefox choca contra el
// motor real (Chromium) → "codec collision" en Opus (payload 111) → la
// videollamada expulsa al usuario. Necesita identidad Chrome consistente, que
// es lo que de verdad corre por dentro. El login NO se ve afectado: sigue
// ocurriendo en accounts.google.com (Firefox), así que el bloqueo de
// "navegador no seguro" no se reintroduce.
const isMeetHost = (hostname: string): boolean => hostname === 'meet.google.com'

// El disfraz Firefox aplica a todo el ecosistema Google MENOS Meet.
const wantsFirefoxUA = (hostname: string): boolean =>
  isGoogleHost(hostname) && !isMeetHost(hostname)

const isWebUrl = (url: string) =>
  url.startsWith('https://') || url.startsWith('http://')

// Trazas de diagnóstico en la terminal, solo en desarrollo
const DEV = !!process.env['ELECTRON_RENDERER_URL']

// Decisión de cámara/micrófono por origen, recordada hasta cerrar la app
const mediaDecisions = new Map<string, boolean>()

async function askMediaPermission(wc: WebContents, requestingUrl: string): Promise<boolean> {
  let origin: string
  try {
    origin = new URL(requestingUrl).origin
  } catch {
    return false
  }
  const cached = mediaDecisions.get(origin)
  if (cached !== undefined) return cached

  const parent = BrowserWindow.fromWebContents(wc) ?? BrowserWindow.getAllWindows()[0]
  if (!parent) return false
  const { response } = await dialog.showMessageBox(parent, {
    type: 'question',
    buttons: ['Permitir', 'Denegar'],
    defaultId: 1,
    cancelId: 1,
    title: 'Cámara y micrófono',
    message: `${origin} quiere usar la cámara y el micrófono`,
    detail: 'Necesario para videollamadas. La decisión se recuerda hasta cerrar Helecho.',
  })
  const allowed = response === 0
  mediaDecisions.set(origin, allowed)
  return allowed
}

// En Wayland el selector de "qué compartir" lo pone el sistema (portal de
// PipeWire): aparece su diálogo al enumerar las fuentes y devuelve solo lo
// que el usuario eligió. En X11 no existe ese diálogo.
const IS_WAYLAND = process.platform === 'linux' && !!process.env['WAYLAND_DISPLAY']

// Sin portal no hay selector del sistema: se ofrece la pantalla completa
// previa confirmación. Se pregunta SIEMPRE (sin recordar la decisión):
// compartir pantalla expone todo lo visible, cada llamada merece su "sí".
async function confirmFullScreenShare(requestingOrigin: string, parent?: BrowserWindow): Promise<boolean> {
  const owner = parent ?? BrowserWindow.getAllWindows()[0]
  if (!owner) return false
  const { response } = await dialog.showMessageBox(owner, {
    type: 'question',
    buttons: ['Compartir', 'Cancelar'],
    defaultId: 1,
    cancelId: 1,
    title: 'Compartir pantalla',
    message: `${requestingOrigin} quiere ver tu pantalla`,
    detail: 'Se compartirá la pantalla completa mientras dure la llamada.',
  })
  return response === 0
}

export function registerAlexandriaSecurity() {
  const ses = session.fromPartition(ALEXANDRIA_PARTITION)

  // Peticiones de red de la partición (incluye service workers)
  ses.setUserAgent(ALEXANDRIA_USER_AGENT)

  // Capa de red del truco Firefox: cambia el User-Agent hacia
  // accounts.google.com y quita los client hints de Chromium (Firefox no
  // los envía; la mezcla delataría el disfraz)
  ses.webRequest.onBeforeSendHeaders((details, callback) => {
    if (wantsFirefoxUA(hostnameOf(details.url))) {
      details.requestHeaders['User-Agent'] = FIREFOX_USER_AGENT
      for (const header of Object.keys(details.requestHeaders)) {
        if (header.toLowerCase().startsWith('sec-ch-ua')) delete details.requestHeaders[header]
      }
    }
    callback({ requestHeaders: details.requestHeaders })
  })

  // Cámara/micrófono: diálogo por sitio (videollamadas). El resto
  // (ubicación, notificaciones, etc.): denegado.
  ses.setPermissionRequestHandler((wc, permission, callback, details) => {
    if (permission === 'media') {
      void askMediaPermission(wc, details.requestingUrl).then(callback)
      return
    }
    // Compartir pantalla: el consentimiento real lo da el selector de
    // fuentes (setDisplayMediaRequestHandler) — aquí solo se deja pasar.
    if (permission === 'display-capture') {
      callback(true)
      return
    }
    callback(false)
  })

  // getDisplayMedia() — compartir pantalla en videollamadas. Electron no
  // trae el selector de Chrome: sin este handler la petición se rechaza
  // siempre. Solo video: el audio 'loopback' no existe en Linux.
  ses.setDisplayMediaRequestHandler((request, callback) => {
    void (async () => {
      try {
        if (IS_WAYLAND) {
          // El portal muestra su diálogo durante getSources; el usuario
          // elige ahí pantalla o ventana (Helecho incluida) o cancela
          const sources = await desktopCapturer.getSources({ types: ['screen', 'window'] })
          const chosen = sources[0]
          callback(chosen ? { video: chosen } : {})
          return
        }
        const wc = webContents.fromFrame(request.frame)
        const parent = (wc && BrowserWindow.fromWebContents(wc)) ?? undefined
        const allowed = await confirmFullScreenShare(request.securityOrigin, parent)
        if (!allowed) {
          callback({})
          return
        }
        // En macOS enumerar fuentes puede activar el permiso del sistema;
        // primero se explica y confirma la petición dentro de Helecho.
        const sources = await desktopCapturer.getSources({ types: ['screen'] })
        const screen = sources[0]
        callback(screen ? { video: screen } : {})
      } catch (err) {
        // Portal cancelado o captura no disponible: se deniega sin romper
        if (DEV) console.log('[alexandria] compartir pantalla falló:', err)
        callback({})
      }
    })()
  })

  // Descargas permitidas: sin savePath fijado, Electron muestra el diálogo
  // nativo de "Guardar como…" — el usuario siempre decide qué entra al disco.

  app.on('web-contents-created', (_e, contents) => {
    // Aplica al webview del panel Y a las ventanas que éste abra
    // (mismo session = misma partición de Alexandria)
    const isAlexandria = contents.getType() === 'webview' || contents.session === ses
    if (!isAlexandria) return

    // navigator.userAgent que ve el JavaScript de la página: debe coincidir
    // con el de red (los anti-bot comparan ambos)
    contents.setUserAgent(ALEXANDRIA_USER_AGENT)

    // Capa JS del truco Firefox: en los dominios de Google el
    // navigator.userAgent también debe decir Firefox; fuera de ellos se
    // restaura el de Chrome
    contents.on('did-start-navigation', (event) => {
      if (!event.isMainFrame || event.isSameDocument) return
      contents.setUserAgent(
        wantsFirefoxUA(hostnameOf(event.url)) ? FIREFOX_USER_AGENT : ALEXANDRIA_USER_AGENT
      )
    })

    // Política (ciberseguridad_v2.md): pestañas múltiples SÍ, ventanas NO.
    // Única excepción: window.open de los flujos de login (OAuth) necesita
    // window.opener para devolver la sesión, y eso solo lo da una ventana
    // real — se abre aislada (sandbox, sin Node).
    contents.setWindowOpenHandler(({ url, disposition, features }) => {
      if (DEV) console.log(`[alexandria] abrir: ${disposition} | features="${features}" | ${url}`)

      // Pestaña nueva: target=_blank, y también window.open SIN tamaño —
      // así lo hacen los navegadores reales (window.open simple = pestaña;
      // solo con width/height = ventana emergente)
      const wantsTab =
        disposition === 'foreground-tab' ||
        disposition === 'background-tab' ||
        (disposition === 'new-window' && features === '')
      if (wantsTab) {
        if (isWebUrl(url)) {
          const host = contents.hostWebContents ?? BrowserWindow.getAllWindows()[0]?.webContents
          host?.send(IPC.ALEXANDRIA_OPEN_TAB, url)
        }
        return { action: 'deny' }
      }
      if (isWebUrl(url) || url === 'about:blank' || url === '') {
        return {
          action: 'allow',
          overrideBrowserWindowOptions: {
            width: 1000,
            height: 720,
            autoHideMenuBar: true,
            webPreferences: {
              sandbox: true,
              contextIsolation: true,
              nodeIntegration: false,
            },
          },
        }
      }
      return { action: 'deny' }
    })

    // Solo web: file:// leería el disco, otros esquemas lanzan apps externas.
    // Excepción: mailto se delega al cliente de correo del sistema (no puede
    // ejecutar nada, solo abre un borrador).
    contents.on('will-navigate', (event, url) => {
      if (isWebUrl(url) || url === 'about:blank') return
      event.preventDefault()
      if (url.startsWith('mailto:')) {
        void shell.openExternal(url)
      } else if (DEV) {
        console.log(`[alexandria] navegación bloqueada: ${url}`)
      }
    })

    // Atajos que funcionan aunque el foco esté DENTRO de la página
    // (los keydown del invitado no llegan al renderer de Helecho):
    // F5/Ctrl+R/Cmd+R recarga, F12 abre las DevTools de la página,
    // F9 alterna el modo enfoque (solo el webview embebido tiene
    // hostWebContents; las ventanas de login no participan)
    contents.on('before-input-event', (_event, input) => {
      if (input.type !== 'keyDown') return
      if (input.key === 'F5' || ((input.control || input.meta) && input.key.toLowerCase() === 'r')) {
        contents.reload()
      } else if (input.key === 'F12') {
        contents.openDevTools({ mode: 'detach' })
      } else if (input.key === 'F9') {
        contents.hostWebContents?.send(IPC.ALEXANDRIA_TOGGLE_FOCUS)
      }
    })
  })
}

/** Nadie más que Alexandria puede adjuntar webviews a la ventana. */
export function hardenWebviews(win: BrowserWindow) {
  win.webContents.on('will-attach-webview', (event, webPreferences, params) => {
    // Pase lo que pase, el contenido invitado corre aislado y sin Node
    delete webPreferences.preload
    webPreferences.nodeIntegration = false
    webPreferences.contextIsolation = true

    const src = params.src ?? 'about:blank'
    if (params.partition !== ALEXANDRIA_PARTITION || (src !== 'about:blank' && !isWebUrl(src))) {
      event.preventDefault()
    }
  })
}
