/* ── Internacionalización (estilo gettext) ───────────────────────────
   El texto en español ES la clave: `t('Guardar')` devuelve 'Save' cuando
   el idioma es inglés y 'Guardar' tal cual en español. Si una cadena no
   está en el diccionario, cae al español — la UI nunca se rompe por una
   traducción faltante.

   Cadenas con variables usan {placeholders}: t('Eliminar "{name}"', { name }).

   En componentes React usar `const t = useT()` para que el componente se
   re-renderice al cambiar el idioma; `t` a secas es para código fuera de
   React (NodeViews, diálogos imperativos) que se re-crea solo. */

import { useSettingsStore } from '../store/settingsStore'

const EN: Record<string, string> = {
  // ── Configuración ──
  'Configuración': 'Settings',
  'Idioma': 'Language',
  'Modo de hoja': 'Page mode',
  'Página estricta': 'Strict page',
  'El texto respeta los márgenes y salta a la siguiente hoja, como en Word.':
    'Text respects the margins and flows onto the next page, like in Word.',
  'Fluido': 'Fluid',
  'Una sola hoja continua que crece con el contenido, sin saltos de página.':
    'A single continuous page that grows with the content, without page breaks.',
  'Apariencia': 'Appearance',
  'Restablecer': 'Reset',
  'Elige el color de toda la interfaz y el de sus textos. La barra bajo cada rueda controla el brillo — llévala a la izquierda para tonos oscuros o negro. Los cambios se ven al instante.':
    'Pick a color for the whole interface and one for its text. The bar under each wheel controls brightness — drag it left for dark tones or black. Changes apply instantly.',
  'Color de la interfaz': 'Interface color',
  'Color de los textos': 'Text color',
  'Interfaz': 'Interface',
  'Textos': 'Text',
  'Carpeta de cuadernillos': 'Notebooks folder',
  'Tus apuntes viven aquí, fuera del programa, en tu propia carpeta. Cambiarla no mueve los archivos existentes.':
    'Your notes live here, outside the app, in your own folder. Changing it does not move existing files.',
  'Cambiar…': 'Change…',
  'Post-its en el PDF': 'Post-its in the PDF',
  'Incluye los post-its del apunte al exportar a PDF, junto a su punto de origen.':
    'Includes the note’s post-its when exporting to PDF, next to their anchor point.',
  'Bloqueo de anuncios': 'Ad blocking',
  'Bloquea anuncios y rastreadores en el navegador (listas EasyList). La primera activación descarga las listas — necesita internet. YouTube queda excluido por sus condiciones de uso.':
    'Blocks ads and trackers in the browser (EasyList lists). The first activation downloads the lists — it needs internet. YouTube is excluded due to its terms of use.',
  'Aplicando…': 'Applying…',
  'No se pudo cambiar el bloqueo de anuncios': 'Could not change ad blocking',
  'Cerrar': 'Close',

  // ── Biblioteca ──
  'Abrir {name}': 'Open {name}',
  'Creado:': 'Created:',
  'Renombrar {name}': 'Rename {name}',
  'Renombrar': 'Rename',
  'Eliminar {name}': 'Delete {name}',
  'Nuevo nombre…': 'New name…',
  '{n} cuadernillo': '{n} notebook',
  '{n} cuadernillos': '{n} notebooks',
  'cambiar semestre': 'change semester',
  'asignar semestre': 'assign semester',
  'quitar': 'remove',
  'renombrar': 'rename',
  'eliminar': 'delete',
  'Nombre del cuadernillo': 'Notebook name',
  'Nuevo cuadernillo': 'New notebook',
  'No se pudo leer la carpeta de cuadernillos. Reinicia la aplicación.':
    'Could not read the notebooks folder. Restart the application.',
  'No se pudo crear la materia.': 'Could not create the subject.',
  'No se pudo crear la materia. Reinicia la aplicación.':
    'Could not create the subject. Restart the application.',
  'Ya existe un cuadernillo con ese nombre en la materia.':
    'A notebook with that name already exists in the subject.',
  'No se pudo crear el cuadernillo.': 'Could not create the notebook.',
  'No se pudo crear el cuadernillo. Reinicia la aplicación.':
    'Could not create the notebook. Restart the application.',
  'No se pudo guardar la colección.': 'Could not save the collection.',
  'Ya existe algo con ese nombre.': 'Something with that name already exists.',
  'No se pudo renombrar.': 'Could not rename.',
  'No se pudo eliminar.': 'Could not delete.',
  'Tus cuadernillos de apuntes': 'Your note notebooks',
  'Nombre de la materia…': 'Subject name…',
  'Nueva materia': 'New subject',
  'Alexandria — navegador': 'Alexandria — browser',
  'Buscar en todos los cuadernillos…': 'Search all notebooks…',
  'Limpiar búsqueda': 'Clear search',
  'Semestre… (ej. 2026-1)': 'Semester… (e.g. 2026-1)',
  '{n} resultado': '{n} result',
  '{n} resultados': '{n} results',
  'Sin coincidencias para “{query}”.': 'No matches for “{query}”.',
  'Aún no tienes materias. Crea la primera para empezar a tomar apuntes.':
    'You have no subjects yet. Create your first one to start taking notes.',
  'Sin colección': 'No collection',

  // ── Sidebar de cuadernillos / creación inline ──
  'Expandir panel de cuadernillos': 'Expand notebooks panel',
  'Cuadernillos': 'Notebooks',
  'Plegar panel': 'Collapse panel',
  'Nuevo cuadernillo en {name}': 'New notebook in {name}',
  'Vacía': 'Empty',
  'Cuadernillo': 'Notebook',
  'Sin materias aún. Crea la primera abajo.': 'No subjects yet. Create the first one below.',
  'Crear': 'Create',
  'Cancelar (Esc)': 'Cancel (Esc)',

  // ── Toolbar del editor / menú Archivo ──
  'Tipografía del texto seleccionado': 'Font of the selected text',
  'Tipografía': 'Font',
  'Predeterminada': 'Default',
  'Tamaño del texto seleccionado': 'Size of the selected text',
  'Tamaño de texto': 'Text size',
  'Tamaño': 'Size',
  'Alejar (Ctrl/Cmd+−)': 'Zoom out (Ctrl/Cmd+−)',
  'Acercar (Ctrl/Cmd++)': 'Zoom in (Ctrl/Cmd++)',
  'Inicio': 'Home',
  'Cambios sin guardar': 'Unsaved changes',
  'Lista de viñetas': 'Bullet list',
  'Lista numerada': 'Numbered list',
  'Plano': 'Plane',
  'Insertar diagrama Mermaid (flujo, secuencia, estados)':
    'Insert Mermaid diagram (flowchart, sequence, states)',
  'Diagrama': 'Diagram',
  'Insertar grafo de Discreta (nodos y aristas, 2D)':
    'Insert Discrete Math graph (nodes and edges, 2D)',
  'Grafo': 'Graph',
  'Por ahora las gráficas no se pueden colocar dentro de columnas.\n\nInsértala fuera de la sección de columnas.':
    'For now, charts cannot be placed inside columns.\n\nInsert it outside the columns section.',
  'Insertar gráfica de datos editable (barras, líneas, dispersión, pastel)':
    'Insert editable data chart (bar, line, scatter, pie)',
  'Gráfica': 'Chart',
  'Insertar columnas (2 o 3) — el texto y las gráficas se acomodan dentro de cada columna':
    'Insert columns (2 or 3) — text and charts flow inside each column',
  'Columnas': 'Columns',
  'Post-it anclado al punto del texto donde está el cursor':
    'Post-it anchored to the text where the cursor is',
  'Tarjeta de repaso anclada al texto, arrastrable sobre la hoja':
    'Flashcard anchored to the text, draggable over the page',
  'Tarjeta': 'Card',
  'Repasar todas las tarjetas del cuadernillo (barajadas)':
    'Review all the notebook’s flashcards (shuffled)',
  'Repasar': 'Review',
  'Insertar imagen desde archivo': 'Insert image from file',
  'Imagen': 'Image',
  'Archivo': 'File',
  'Volver al inicio': 'Back to home',
  'Abrir…': 'Open…',
  'Guardar': 'Save',
  'Exportar PDF…': 'Export PDF…',
  'Frente': 'Front',
  'Dorso': 'Back',

  // ── Alexandria ──
  'No se pudo cargar la página ({error})': 'The page could not be loaded ({error})',
  'Nueva pestaña': 'New tab',
  'Cerrar pestaña (Ctrl/Cmd+W)': 'Close tab (Ctrl/Cmd+W)',
  'Nueva pestaña (Ctrl/Cmd+T)': 'New tab (Ctrl/Cmd+T)',
  'Atrás': 'Back',
  'Adelante': 'Forward',
  'Detener': 'Stop',
  'Recargar (F5)': 'Reload (F5)',
  'Conexión segura (HTTPS, cifrada)': 'Secure connection (HTTPS, encrypted)',
  'Conexión segura': 'Secure connection',
  'No seguro: la conexión no está cifrada (HTTP)': 'Not secure: the connection is not encrypted (HTTP)',
  'Conexión no segura': 'Insecure connection',
  'Dirección o búsqueda…': 'Address or search…',
  'Borrar historial': 'Clear history',
  'Escribe una dirección o un término de búsqueda arriba': 'Type an address or a search term above',
  'Sin conexión a internet': 'No internet connection',
  'La página no se pudo cargar': 'The page could not be loaded',
  'La página está tardando en cargar': 'The page is taking long to load',
  'Conexión correcta': 'Connection OK',
  'Sin actividad': 'No activity',
  'Expandir Alexandria': 'Expand Alexandria',
  'Plegar Alexandria': 'Collapse Alexandria',
  'Volver a la biblioteca': 'Back to the library',
  'Biblioteca': 'Library',

  // ── Flashcards y Review ──
  'Voltear': 'Flip',
  'Voltear (frente / dorso)': 'Flip (front / back)',
  'Listo': 'Done',
  'Editar': 'Edit',
  'Eliminar tarjeta': 'Delete card',
  '(sin definición)': '(no definition)',
  '(sin concepto)': '(no concept)',
  'Este cuadernillo no tiene tarjetas todavía.': 'This notebook has no flashcards yet.',
  'Insértalas con el botón': 'Insert them with the',
  'de la barra.': 'button on the toolbar.',
  'Cerrar repaso': 'Close review',
  '(vacío)': '(empty)',
  'clic o espacio para voltear': 'click or spacebar to flip',
  'Anterior': 'Previous',
  'Siguiente': 'Next',
  'Barajar': 'Shuffle',
  'Color': 'Color',
  '¿Qué es…?': 'What is…?',
  'La definición o respuesta': 'The definition or answer',
  'Clic para voltear': 'Click to flip',
  'Arrastra para mover la tarjeta': 'Drag to move the card',

  // ── Post-its ──
  'Arrastra para mover el post-it': 'Drag to move the post-it',
  'Categoría {label}': 'Category {label}',
  'Eliminar post-it': 'Delete post-it',
  'Escribe la nota…': 'Write the note…',
  'Clic para editar': 'Click to edit',

  // ── Colores ──
  'Amarillo': 'Yellow',
  'Verde': 'Green',
  'Azul': 'Blue',
  'Rosa': 'Pink',
  'Índigo': 'Indigo',
  'Ámbar': 'Amber',
  'Cian': 'Cyan',

  // ── Editor: Calculadora y Pomodoro ──
  'Calculadora': 'Calculator',
  'Ingresa un número': 'Enter a number',
  'Borrar': 'Clear',
  'Borrar todo': 'Clear all',
  'Pomodoro': 'Pomodoro',
  'Iniciar': 'Start',
  'Pausar': 'Pause',
  'Reanudar': 'Resume',
  'Reiniciar': 'Reset',

  // ── Tablas ──
  'Insertar tabla': 'Insert table',
  'Filas': 'Rows',
  'Agregar fila arriba': 'Add row above',
  'Agregar fila abajo': 'Add row below',
  'Agregar columna': 'Add column',
  'Eliminar fila': 'Delete row',
  'Eliminar columna': 'Delete column',
  'Eliminar tabla': 'Delete table',
  'OK': 'OK',

  // ── Notificaciones y diálogos ──
  'Notificaciones': 'Notifications',
  'Sin notificaciones': 'No notifications',
  'Limpiar': 'Clear',
  'No guardar': 'Don\'t save',
  'Pomodoro completado': 'Pomodoro completed',
  '¡Toma un descanso!': 'Take a break!',
  'Cancelar': 'Cancel',
  'Entendido': 'Got it',
  '¡Tiempo! Toca un descanso de 5 min.': 'Time\'s up! Take a 5 min break.',
  'Fin del descanso. De vuelta al trabajo (25 min).': 'Break is over. Back to work (25 min).',
  'Descartar': 'Dismiss',
}

export function t(text: string, vars?: Record<string, string | number>): string {
  const lang = useSettingsStore.getState().language
  let out = lang === 'en' ? (EN[text] ?? text) : text
  if (vars) {
    for (const [key, value] of Object.entries(vars)) {
      out = out.replaceAll(`{${key}}`, String(value))
    }
  }
  return out
}

/** Hook: igual que t(), pero suscribe el componente al cambio de idioma */
export function useT(): typeof t {
  useSettingsStore((s) => s.language)
  return t
}

/** Locale para formatear fechas según el idioma de la UI */
export function dateLocale(): string {
  return useSettingsStore.getState().language === 'en' ? 'en-US' : 'es-CO'
}

/** Registra traducciones (los módulos de datos grandes aportan las suyas) */
export function addTranslations(entries: Record<string, string>): void {
  Object.assign(EN, entries)
}
