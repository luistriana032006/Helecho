/**
 * Diálogo de confirmación propio (sí/no) que se monta en `document.body`.
 *
 * Reemplaza a `window.confirm`, que en Electron muestra el cuadro pero a veces
 * no deja pulsar los botones (el diálogo nativo bloquea el hilo y compite con
 * los manejadores de la ventana). Este es DOM normal: los botones se pulsan sin
 * problema. Se usa desde los NodeView de JS puro (columnas).
 *
 * Devuelve una promesa: `true` si se confirma, `false` si se cancela.
 */
export function confirmDialog(message: string, confirmLabel = 'Eliminar'): Promise<boolean> {
  return new Promise((resolve) => {
    const backdrop = document.createElement('div')
    backdrop.className = 'helecho-confirm-backdrop'

    const box = document.createElement('div')
    box.className = 'helecho-confirm-box'

    const text = document.createElement('p')
    text.className = 'helecho-confirm-text'
    text.textContent = message

    const actions = document.createElement('div')
    actions.className = 'helecho-confirm-actions'

    const no = document.createElement('button')
    no.type = 'button'
    no.className = 'helecho-confirm-no'
    no.textContent = 'Cancelar'

    const yes = document.createElement('button')
    yes.type = 'button'
    yes.className = 'helecho-confirm-yes'
    yes.textContent = confirmLabel

    actions.append(no, yes)
    box.append(text, actions)
    backdrop.appendChild(box)
    document.body.appendChild(backdrop)

    const close = (result: boolean) => {
      document.removeEventListener('keydown', onKey)
      if (backdrop.parentNode) document.body.removeChild(backdrop)
      resolve(result)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); close(false) }
      if (e.key === 'Enter') { e.preventDefault(); close(true) }
    }

    no.addEventListener('click', () => close(false))
    yes.addEventListener('click', () => close(true))
    backdrop.addEventListener('mousedown', (e) => {
      if (e.target === backdrop) close(false)
    })
    document.addEventListener('keydown', onKey)
    yes.focus()
  })
}

/** Aviso informativo con un solo botón "Entendido". */
export function alertDialog(message: string): Promise<void> {
  return new Promise((resolve) => {
    const backdrop = document.createElement('div')
    backdrop.className = 'helecho-confirm-backdrop'

    const box = document.createElement('div')
    box.className = 'helecho-confirm-box'

    const text = document.createElement('p')
    text.className = 'helecho-confirm-text'
    text.textContent = message

    const actions = document.createElement('div')
    actions.className = 'helecho-confirm-actions'

    const ok = document.createElement('button')
    ok.type = 'button'
    ok.className = 'helecho-confirm-no'
    ok.textContent = 'Entendido'

    actions.appendChild(ok)
    box.append(text, actions)
    backdrop.appendChild(box)
    document.body.appendChild(backdrop)

    const close = () => {
      document.removeEventListener('keydown', onKey)
      if (backdrop.parentNode) document.body.removeChild(backdrop)
      resolve()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') { e.preventDefault(); close() }
    }

    ok.addEventListener('click', () => close())
    backdrop.addEventListener('mousedown', (e) => {
      if (e.target === backdrop) close()
    })
    document.addEventListener('keydown', onKey)
    ok.focus()
  })
}
