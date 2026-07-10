const fs = require('fs')
const path = require('path')

// Arregla el "FATAL setuid_sandbox_host.cc" del AppImage en Ubuntu 23.10+/24.04
// y derivados: el kernel restringe los user namespaces sin privilegios por
// defecto, y el AppImage se extrae a una carpeta temporal distinta en cada
// arranque, así que no hay una ruta fija donde dejar chrome-sandbox con
// root:root + 4755 (a diferencia del .deb, que sí lo arregla en la instalación
// vía build/deb/after-install.sh y mantiene el sandbox real activo).
//
// Ni `app.commandLine.appendSwitch('no-sandbox')` ni poner
// `process.env.ELECTRON_DISABLE_SANDBOX` DENTRO del main de la app funcionan:
// el chequeo del sandbox SUID ocurre en la inicialización nativa de Chromium,
// antes de que el main script de Electron llegue a ejecutarse. La única forma
// que funciona es que la variable de entorno ya esté puesta ANTES de que el
// proceso arranque — por eso se envuelve el binario real en un wrapper de shell.
//
// Se aplica SOLO cuando el target que se está empaquetando es AppImage.
exports.default = async function (context) {
  if (context.electronPlatformName !== 'linux') return
  const isAppImage = context.targets.some((t) => t.name === 'appImage')
  if (!isAppImage) return

  const binName = 'helecho' // productName en minúsculas (electron-builder)
  const dir = context.appOutDir
  const wrapper = path.join(dir, binName)
  const realBin = path.join(dir, `${binName}-bin`)

  fs.renameSync(wrapper, realBin)
  fs.writeFileSync(
    wrapper,
    `#!/bin/sh\nexport ELECTRON_DISABLE_SANDBOX=true\nexec "$(dirname "$(readlink -f "$0")")/${binName}-bin" "$@"\n`
  )
  fs.chmodSync(wrapper, 0o755)
}
