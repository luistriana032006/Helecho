# Helecho — CLAUDE.md
> Lee este archivo antes de tocar cualquier cosa.
> claude en cada peticion que te diga que hagas 
---

## ¿Qué es Helecho?

Editor de escritorio nativo para apuntes matemáticos. Sin LaTeX, sin comandos. El usuario hace clic en un símbolo y se inserta. Se guarda como Markdown enriquecido y se exporta a PDF limpio.

**Versión activa: V2 (13 jun 2026) — Alexandria y herramientas completas**
> V1.5 completada (10 jun 2026)
> Estado detallado, extras y deuda conocida: `apuntes/apuntesV1/v1.md`
> Índice de toda la documentación: `apuntes/apuntesV1/README.md`

---

## Stack

- **Shell:** Electron + **electron-vite** como build tool
- **Frontend:** React + TypeScript (strict)
- **Editor:** TipTap
- **Math:** KaTeX
- **Estilos:** Tailwind CSS
- **Guardado:** Markdown enriquecido (.md)
- **Export PDF:** MD → HTML → PDF (Electron print API)

---

## Estructura

```
helecho/
├── src/
│   ├── main/
│   │   ├── index.ts
│   │   ├── alexandriaSecurity.ts
│   │   ├── vaultConfig.ts
│   │   ├── adblocker.ts
│   │   └── ipc/
│   │       ├── fileHandlers.ts
│   │       ├── exportHandlers.ts
│   │       ├── notebookHandlers.ts
│   │       ├── watchHandlers.ts
│   │       └── referenceConvert.ts
│   ├── preload/
│   │   └── index.ts
│   ├── renderer/
│   │   ├── index.html
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── Editor/
│   │   │   │   ├── HelechoEditor.tsx
│   │   │   │   ├── Toolbar.tsx
│   │   │   │   ├── CalculatorButton.tsx
│   │   │   │   ├── FlashcardLayer.tsx
│   │   │   │   ├── PomodoroWidget.tsx
│   │   │   │   ├── ReviewMode.tsx
│   │   │   │   ├── PostItLayer.tsx
│   │   │   │   ├── TablePicker.tsx
│   │   │   │   ├── TableControls.tsx
│   │   │   │   ├── pageMetrics.ts
│   │   │   │   └── extensions/
│   │   │   │       ├── MathInline.tsx
│   │   │   │       ├── CartesianPlane.tsx
│   │   │   │       ├── MermaidBlock.tsx
│   │   │   │       ├── DiscreteGraph.tsx
│   │   │   │       ├── Flashcard.tsx
│   │   │   │       ├── PlotlyChart.tsx
│   │   │   │       ├── MathTemplate.tsx
│   │   │   │       ├── mathTemplates.ts
│   │   │   │       ├── Columns.ts
│   │   │   │       ├── Gapcursor.ts
│   │   │   │       ├── DragHandle.ts
│   │   │   │       ├── FontSize.ts
│   │   │   │       ├── ImageExtension.ts
│   │   │   │       ├── Pagination.ts
│   │   │   │       └── PostIt.ts
│   │   │   ├── SymbolMenu/
│   │   │   │   ├── SymbolMenu.tsx
│   │   │   │   ├── SymbolSearch.tsx
│   │   │   │   └── symbols/
│   │   │   │       ├── algebraLineal.ts
│   │   │   │       ├── algebraBasica.ts
│   │   │   │       ├── calculo.ts
│   │   │   │       ├── discreta.ts
│   │   │   │       ├── espaciosVectoriales.ts
│   │   │   │       └── estadistica.ts
│   │   │   ├── Notebook/
│   │   │   │   └── NotebookSidebar.tsx
│   │   │   ├── Alexandria/
│   │   │   │   ├── AlexandriaPanel.tsx
│   │   │   │   ├── AlexandriaView.tsx
│   │   │   │   ├── AlexandriaBrowser.tsx
│   │   │   │   └── ConnectionIndicator.tsx
│   │   │   ├── Reference/
│   │   │   │   └── ReferencePanel.tsx
│   │   │   ├── Library/
│   │   │   │   ├── LibraryView.tsx
│   │   │   │   └── ParticlesBackground.tsx
│   │   │   ├── Layout/
│   │   │   │   └── FileMenu.tsx
│   │   │   ├── Settings/
│   │   │   │   └── SettingsDialog.tsx
│   │   │   └── common/
│   │   │       ├── ResizeHandle.tsx
│   │   │       └── InlineCreate.tsx
│   │   ├── hooks/
│   │   │   ├── useEditor.ts
│   │   │   ├── useFileOps.ts
│   │   │   └── useAvailableWidth.ts
│   │   ├── lib/
│   │   │   ├── confirmDialog.ts
│   │   │   └── pomodoroAlert.ts
│   │   ├── store/
│   │   │   ├── notebookStore.ts
│   │   │   ├── alexandriaStore.ts
│   │   │   ├── settingsStore.ts
│   │   │   └── pomodoroStore.ts
│   │   ├── types/
│   │   │   ├── symbols.ts
│   │   │   ├── electron.d.ts
│   │   │   └── plotly.d.ts
│   │   └── styles/
│   │       └── globals.css
│   └── shared/
│       ├── ipcChannels.ts
│       ├── mdSerializer.ts
│       ├── notebookTypes.ts
│       └── fonts.ts
├── CLAUDE.md
├── CLAUDE.dev.md
├── V1_PASOS.md
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.ts
├── electron-builder.json
└── .gitignore
```


---

---

## Funcionalidades Core

### Editor Principal (HelechoEditor.tsx)
- Editor de contenido basado en **TipTap** con soporte para estilos básicos (bold, italic, underline, strike)
- **Listas** (bullet, numbered)
- **Tablas** completas (crear, editar, eliminar filas/columnas)
- **Imágenes** embebidas
- Sistema de **paginación** (modo página estricta vs. fluido) con contador
- **Zoom** configurable (Ctrl±)
- **Historial** undo/redo
- Keymap: Ctrl+S (guardar), Ctrl+O (abrir), Ctrl+N (nuevo), Ctrl+P (PDF)
- **Modo enfoque** (F9 o 'f'): oculta paneles laterales para lectura limpia

### Herramientas Matemáticas (Extensions)

#### MathInline.tsx
- Inserción de notación matemática **inline** (ej: E=mc²)
- Renderizado con **KaTeX**
- Click-to-edit: doble-click abre editor visual

#### MathTemplate.tsx + mathTemplates.ts
- **Plantillas predefinidas** para ecuaciones complejas (matrices, derivadas, integrales, etc.)
- Editor visual con campos pre-rellenos
- Conversor LATEX → KaTeX automático

#### CartesianPlane.tsx
- Gráfica de funciones interactiva (f(x), f(x,y))
- Entrada: ecuación matemática (ej: `x^2 + y^2 = 25`)
- Renderizado: **D3 force** + canvas
- Editable: click abre editor para cambiar función

#### DiscreteGraph.tsx
- Gráficas de puntos discretos / funciones a trozos
- Entrada: JSON con {x, y} points
- Exportable a imagen

#### PlotlyChart.tsx
- Gráficas avanzadas: scatter, box, line, surface, heatmap
- Editor JSON integrado
- Interactivo: pan, zoom, hover

#### MermaidBlock.tsx
- Diagramas: flowchart, sequence, class, state, ER, Gantt
- Sintaxis Mermaid nativa
- Exportable a SVG/PNG

### Menú de Símbolos (SymbolMenu.tsx)
- **6 categorías** de símbolos matemáticos (pestañas):
  - Álgebra básica
  - Álgebra lineal
  - Espacios vectoriales
  - Cálculo
  - Estadística
  - Matemática discreta
- **Búsqueda** por nombre (SymbolSearch.tsx)
- Click-to-insert: inserta símbolo en editor
- Renderizado: vista previa con KaTeX

### Flashcards (FlashcardLayer.tsx + Flashcard.tsx)
- Sistema de tarjetas de estudio flotantes sobre el contenido
- Anverso/reverso con color customizable (6 colores)
- **Pin visual** ancla la tarjeta a una sección del contenido
- Editor inline: haz clic para editar frente/dorso
- ReviewMode.tsx: modo lectura de flashcards (oculta editor)
- Persistencia: guardadas en la nota como nodos especiales

### Post-Its (PostItLayer.tsx + PostIt.ts)
- Notas adhesivas flotantes (estilo papel amarillo)
- Colores customizables
- Pinned a coordenadas específicas del contenido
- Editor inline
- No interfieren con edición del texto principal

### Pomodoro (PomodoroWidget.tsx + pomodoroStore.ts)
- Timer compacto en la barra del editor
- Ciclos: 25 min trabajo / 5 min descanso
- Controles: play/pause, skip, reset
- Audio + notificación al terminar fase
- **Persiste entre cambios de cuadernillo** (estado en módulo)
- Almacenamiento global con Zustand

### Calculator Button (CalculatorButton.tsx)
- Botón rápido en toolbar
- Abre evaluador de expresiones matemáticas
- Parseo con **math.js**
- Inserta resultado en editor

### Modo Review (ReviewMode.tsx)
- Vista de sólo lectura para repasar apuntes
- Oculta toolbar, flashcards en modal
- Navegación limpia

---

## Gestor de Cuadernillos (Notebook)

### LibraryView.tsx
- **Pantalla principal**: catálogo de materias y cuadernillos
- Estructura: **materias** (carpetas) → **cuadernillos** (archivos .md)
- Tarjetas visuales con:
  - Nombre + fecha última edición
  - Acciones: abrir, renombrar, duplicar, eliminar
  - Búsqueda por nombre
- **Crear nuevo** (materia/cuadernillo) con diálogos inline
- Fondo de partículas (ParticlesBackground.tsx)
- Cambio de bóveda (vault) en settings

### NotebookSidebar.tsx
- Árbol de materias/cuadernillos abiertos
- Navegación rápida
- Sincronización con archivo actual

### Guardado & Sincronización
- **File watcher**: detecta cambios en disco (editados por Claude Code, etc.)
- **Auto-guardado**: escritura incremental en .md
- **Markdown enriquecido**: guarda estructuras especiales (Math, Gráficas, Flashcards, PostIts) como metadatos YAML/comentarios

---

## Alexandria: Navegador de Referencias

### AlexandriaPanel.tsx
- Panel plegable izquierdo en el editor principal
- Muestra referencias (PDFs, hojas de cálculo) mientras se toma apunte
- Ancho configurable (ResizeHandle)
- Comparte AlexandriaBrowser con vista general

### AlexandriaView.tsx
- Pantalla completa del navegador (sin editor)
- Accesible desde biblioteca
- Búsqueda de referencias disponibles

### AlexandriaBrowser.tsx
- Listado de referencias por materia
- Soporte: **PDF** (visor integrado) + **Excel** (XLSX: muestra hojas/tablas)
- Parser Excel: limita a 500 filas (truncation warning)
- Historial de pestaña (activa/inactiva)

### ConnectionIndicator.tsx
- Indicador visual de conexión al vault
- (Para futuro: Google Drive / OneDrive)

---

## Referencia Rápida (ReferencePanel.tsx)
- Panel derecho compacto del editor
- Muestra PDF/Excel de la materia actual
- Redimensionable
- Integración con Alexandria

---

## Configuración (SettingsDialog.tsx + settingsStore.ts)

**Opciones:**
- **Modo página**: estricta (saltos de página tipo Word) vs. fluido (scroll continuo)
- **Zoom**: nivel de escala global
- **Post-its en PDF**: incluir/excluir notas adhesivas en exportación
- **Post-its en Review**: visibles en modo repaso
- **Bóveda de cuadernillos**: carpeta raíz (file picker)
- **Ancho panel Alexandria**: persistido

---

## Persistencia & Estado

### Zustand Stores
- **notebookStore**: ruta archivo actual, dirty flag, nombre
- **pomodoroStore**: fase/segundos/estado del pomodoro (global, no por cuadernillo)
- **settingsStore**: zoom, modo página, anchos de paneles, ruta vault
- **alexandriaStore**: tabs activos, referencias cargadas

### Serialización Markdown (mdSerializer.ts)
- Convierte contenido TipTap ↔ Markdown con metadatos
- Nodos especiales (Math, Gráficas, Flashcards, PostIts) como comentarios HTML
- YAML frontmatter para metadata (título, materia, etc.)

---

## IPC (Electron ↔ Renderer)

### Canales principales (shared/ipcChannels.ts)
- **FILE_SAVE**: guardar archivo
- **FILE_OPEN**: abrir picker, leer archivo
- **FILE_NEW**: crear archivo
- **EXPORT_PDF**: convertir a PDF (MD → HTML → print)
- **WATCH_FILE**: vigilar cambios externos
- **CONVERT_REFERENCE**: PDF/Excel → HTML para visor
- **SET_DIRTY_STATE**: sincronizar dirty flag con main (para close handler)
- **SAVE_REQUEST**: main pide guardar antes de cerrar

### Handlers (src/main/ipc/)
- **fileHandlers.ts**: lectura/escritura archivos
- **exportHandlers.ts**: generación PDF
- **notebookHandlers.ts**: gestión materias/cuadernillos
- **watchHandlers.ts**: file system watcher
- **referenceConvert.ts**: conversión de referencias (PDF → PDF, Excel → HTML)

---

## Características de Seguridad & Mantenimiento

### Ad-blocker
- **adblocker.ts**: integra Ghostery para bloquear trackers
- Aplica a navegador de referencias (PDFs, páginas)

### Alexandria Security
- **alexandriaSecurity.ts**: valida referencias (PDF, Excel)
- Aislamiento de contenido dentro del sandbox

---

## Compilación & Build

**Electron-Vite**
- Preload aislado (preload/index.ts)
- Main process (src/main/index.ts)
- Renderer (React + TypeScript)
- Output: `out/main`, `out/preload`, `out/renderer`

**Distribución**
- Linux: AppImage
- Windows: NSIS
- macOS: DMG

---

## Reglas críticas

- El renderer **nunca** importa módulos de Node.js (`fs`, `path`, `electron`). Todo va por IPC.
- **No usar** `vite-plugin-electron` — solo `electron-vite`.
- **Sin `"type": "module"`** en package.json.
- Sin `any` explícitos en TypeScript.
- Los canales IPC van en `shared/ipcChannels.ts` como constantes — nunca strings literales dispersos.

---

## V2 — Implementado ✓

- Panel Alexandria (navegador de referencias con búsqueda)
- Flashcards y Review Mode
- Pomodoro Widget
- Calculator Button
- Post-it Layer
- Gráficas discretas, Cartesian planes, Mermaid, Plotly
- Math templates
- Múltiples menús de símbolos (álgebra básica, cálculo, discreta, espacios vectoriales, estadística)
- Settings Dialog
- Library View con fondo de partículas
- Ad-blocker en vault
- Tipos adicionales (fonts, notebookTypes)

## Lo que NO está hecho aún

- Export a Word .docx (investigado: `markdown-docx` — plan en apuntes/apuntesV1/investigacion-word-export.md)
- Integración Google Drive / OneDrive (sincronización en la nube)
- Versionado/backup de cuadernillos (se quitó el backup Git automático — invadía terreno que asume que el usuario sabe Git; si lo quiere, crea su propio repo)
- Lista completa de deuda: sección "Pendiente" en `apuntes/apuntesV1/v1.md`

---

## Arranque en desarrollo

```bash
env -u ELECTRON_RUN_AS_NODE DISPLAY=:0 npm run dev -- --no-sandbox
```

---

*Helecho — Socorro, Santander 🇨🇴*