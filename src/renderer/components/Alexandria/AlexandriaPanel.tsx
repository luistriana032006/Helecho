import { useRef, useState } from 'react'
import { ChevronsLeft, Globe } from 'lucide-react'
import { useSettingsStore } from '../../store/settingsStore'
import { useAlexandriaStore } from '../../store/alexandriaStore'
import ResizeHandle from '../common/ResizeHandle'
import AlexandriaBrowser from './AlexandriaBrowser'
import { useT } from '../../lib/i18n'

/**
 * Modo enriquecido: el navegador como panel plegable a la izquierda del
 * editor (leer y apuntar a la vez). El navegador en sí vive en
 * AlexandriaBrowser, compartido con el modo general de la biblioteca.
 */
export default function AlexandriaPanel() {
  const t = useT()
  const [collapsed, setCollapsed] = useState(true)
  const panelRef = useRef<HTMLElement>(null)
  const width = useSettingsStore((s) => s.alexandriaWidth)
  const setWidth = useSettingsStore((s) => s.setAlexandriaWidth)
  const title = useAlexandriaStore(
    (s) => s.tabs.find((t) => t.id === s.activeTabId)?.title ?? ''
  )

  return (
    <>
      {collapsed && (
        <aside className="flex w-10 shrink-0 flex-col items-center gap-2 bg-sidebar border-r border-sidebar-border py-3 text-muted-foreground">
          <button
            onClick={() => setCollapsed(false)}
            aria-label={t('Expandir Alexandria')}
            title={t('Alexandria — navegador')}
            className="flex flex-col items-center gap-2 rounded p-1 hover:bg-muted hover:text-foreground transition-colors"
          >
            <Globe className="size-4" aria-hidden />
          </button>
        </aside>
      )}

      {/* Al plegar NO se desmonta: las páginas siguen cargadas al volver.
          visibility + width 0 (display:none rompe los webviews en Electron) */}
      <aside
        ref={panelRef}
        className="relative flex shrink-0 flex-col bg-sidebar border-r border-sidebar-border overflow-hidden"
        style={collapsed ? { width: 0, visibility: 'hidden', borderWidth: 0 } : { width }}
      >
        <ResizeHandle
          side="right"
          onDrag={(x) => setWidth(x - (panelRef.current?.getBoundingClientRect().left ?? 0))}
        />

        <div className="flex items-center gap-2 px-3 py-2 border-b border-sidebar-border">
          <Globe className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
          <span className="flex-1 truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {title || 'Alexandria'}
          </span>
          <button
            onClick={() => setCollapsed(true)}
            aria-label={t('Plegar Alexandria')}
            className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ChevronsLeft className="size-4" aria-hidden />
          </button>
        </div>

        <AlexandriaBrowser active={!collapsed} />
      </aside>
    </>
  )
}
