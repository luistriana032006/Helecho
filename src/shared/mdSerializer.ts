import { fontById, fontByStack } from './fonts'

interface TextMark {
  type: string
  attrs?: Record<string, unknown>
}

interface TipTapNode {
  type?: string
  text?: string
  attrs?: Record<string, unknown>
  content?: TipTapNode[]
  marks?: TextMark[]
}

export function serialize(doc: TipTapNode): string {
  const blocks = (doc.content ?? []).map(serializeBlock)
  return blocks.filter(Boolean).join('\n\n').trimEnd() + '\n'
}

function serializeBlock(node: TipTapNode): string {
  switch (node.type) {
    case 'heading': {
      const level = (node.attrs?.level as number) ?? 1
      return '#'.repeat(level) + ' ' + serializeInline(node.content ?? [])
    }
    case 'paragraph':
      return serializeInline(node.content ?? [])
    case 'bulletList':
      return (node.content ?? [])
        .map((item) => '- ' + serializeListItemContent(item))
        .join('\n')
    case 'orderedList':
      return (node.content ?? [])
        .map((item, i) => `${i + 1}. ` + serializeListItemContent(item))
        .join('\n')
    case 'table':
      return serializeTable(node)
    case 'image': {
      const src = (node.attrs?.src as string) ?? ''
      const alt = (node.attrs?.alt as string) ?? ''
      return `![${alt}](${src})`
    }
    case 'mermaidBlock':
      return '```mermaid\n' + ((node.attrs?.code as string) ?? '').trimEnd() + '\n```'
    case 'cartesianPlane':
      return (
        '```helecho-plano\n' +
        JSON.stringify({
          range: (node.attrs?.range as number) ?? 10,
          lines: (node.attrs?.lines as unknown[]) ?? [],
          curves: (node.attrs?.curves as unknown[]) ?? [],
        }) +
        '\n```'
      )
    case 'discreteGraph':
      return (
        '```helecho-grafo\n' +
        JSON.stringify({
          directed: (node.attrs?.directed as boolean) ?? false,
          weighted: (node.attrs?.weighted as boolean) ?? false,
          nodes: (node.attrs?.nodes as unknown[]) ?? [],
          edges: (node.attrs?.edges as unknown[]) ?? [],
        }) +
        '\n```'
      )
    case 'columnBlock':
      // Sección de columnas: nivel de anidación nuevo (columnas → columna →
      // bloques). El contenido de cada columna se serializa recursivamente.
      return (
        '<columnas>\n' +
        (node.content ?? [])
          .map(
            (col) =>
              '<columna>\n' +
              (col.content ?? []).map(serializeBlock).filter(Boolean).join('\n\n') +
              '\n</columna>'
          )
          .join('\n') +
        '\n</columnas>'
      )
    case 'plotlyChart':
      // Se guarda el modelo editable (tipo/título/series) + el snapshot PNG,
      // así el PDF y la vista previa de carga no dependen de re-renderizar Plotly
      return (
        '```helecho-plotly\n' +
        JSON.stringify({
          chartType: (node.attrs?.chartType as string) ?? 'bar',
          title: (node.attrs?.title as string) ?? '',
          series: (node.attrs?.series as unknown[]) ?? [],
          png: (node.attrs?.png as string) ?? '',
        }) +
        '\n```'
      )
    default:
      return ''
  }
}

function serializeListItemContent(item: TipTapNode): string {
  return (item.content ?? [])
    .map((child) =>
      child.type === 'paragraph'
        ? serializeInline(child.content ?? [])
        : serializeBlock(child)
    )
    .join(' ')
}

function serializeTable(node: TipTapNode): string {
  const rows = node.content ?? []
  if (rows.length === 0) return ''

  const serializedRows = rows.map((row) =>
    (row.content ?? []).map((cell) =>
      (cell.content ?? [])
        .map((p) => serializeInline(p.content ?? []))
        .join(' ')
        .trim()
    )
  )

  const lines: string[] = []
  serializedRows.forEach((cells, rowIndex) => {
    lines.push('| ' + cells.join(' | ') + ' |')
    if (rowIndex === 0) {
      lines.push('| ' + cells.map(() => '---').join(' | ') + ' |')
    }
  })
  return lines.join('\n')
}

function serializeInline(nodes: TipTapNode[]): string {
  return nodes.map(serializeInlineNode).join('')
}

function serializeInlineNode(node: TipTapNode): string {
  if (node.type === 'text') {
    let text = node.text ?? ''
    const marks = node.marks ?? []
    if (marks.some((m) => m.type === 'bold')) text = `**${text}**`
    if (marks.some((m) => m.type === 'strike')) text = `~~${text}~~`
    if (marks.some((m) => m.type === 'underline')) text = `<u>${text}</u>`
    // Tipografía y tamaño por selección (misma marca textStyle): la
    // etiqueta va POR FUERA de las demás marcas (el parse procesa su
    // contenido recursivamente). La fuente se guarda con el ID estable
    // del catálogo; una pila desconocida viaja tal cual.
    const styleMark = marks.find((m) => m.type === 'textStyle')
    const stack = styleMark?.attrs?.fontFamily as string | undefined
    const size = parseInt((styleMark?.attrs?.fontSize as string | undefined) ?? '', 10)
    const fontAttrs = [
      ...(stack ? [`face="${fontByStack(stack)?.id ?? stack}"`] : []),
      ...(Number.isFinite(size) ? [`size="${size}"`] : []),
    ]
    if (fontAttrs.length > 0) text = `<font ${fontAttrs.join(' ')}>${text}</font>`
    return text
  }
  if (node.type === 'mathInline') {
    return `$${(node.attrs?.latex as string) ?? ''}$`
  }
  if (node.type === 'postit') {
    const a = node.attrs ?? {}
    return (
      `<postit id="${(a.id as string) ?? ''}" color="${(a.color as string) ?? 'amarillo'}" ` +
      `dx="${(a.dx as number) ?? 0}" dy="${(a.dy as number) ?? 0}">` +
      escapePostitText((a.text as string) ?? '') +
      '</postit>'
    )
  }
  if (node.type === 'flashcard') {
    // Tarjeta inline (frente/dorso van como atributos escapados, no como
    // contenido, porque son dos textos): un solo tag autocontenido en el .md
    const a = node.attrs ?? {}
    return (
      `<tarjeta id="${(a.id as string) ?? ''}" color="${(a.color as string) ?? 'indigo'}" ` +
      `dx="${(a.dx as number) ?? 28}" dy="${(a.dy as number) ?? 8}" ` +
      `front="${escapeTarjeta((a.front as string) ?? '')}" back="${escapeTarjeta((a.back as string) ?? '')}"></tarjeta>`
    )
  }
  if (node.type === 'mathTemplate') {
    // Bloque de función editable: id de plantilla + valores, como JSON
    // escapado en un solo atributo (los valores pueden traer LaTeX)
    const a = node.attrs ?? {}
    const data = JSON.stringify({
      t: (a.template as string) ?? '',
      v: (a.values as Record<string, string>) ?? {},
    })
    return `<fmath data="${escapeTarjeta(data)}"></fmath>`
  }
  return ''
}

// El frente/dorso viajan como atributos del tag <tarjeta>: se escapan también
// las comillas (los valores de atributo van entre comillas) y los saltos de
// línea (el parser va por líneas)
function escapeTarjeta(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '&#10;')
}

function unescapeTarjeta(text: string): string {
  return text
    .replace(/&#10;/g, '\n')
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&')
}

// El texto del post-it viaja inline en el .md: se escapan los caracteres
// que romperían la etiqueta y los saltos de línea (el parser va por líneas)
function escapePostitText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '&#10;')
}

function unescapePostitText(text: string): string {
  return text
    .replace(/&#10;/g, '\n')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&')
}

export function parse(md: string): TipTapNode {
  const lines = md.split('\n')
  const content: TipTapNode[] = []

  let i = 0
  while (i < lines.length) {
    const line = lines[i]

    if (line.trim() === '') { i++; continue }

    if (line.trim() === '```mermaid') {
      i++
      const codeLines: string[] = []
      while (i < lines.length && lines[i].trim() !== '```') {
        codeLines.push(lines[i])
        i++
      }
      i++ // salta el ``` de cierre
      content.push({
        type: 'mermaidBlock',
        attrs: { code: codeLines.join('\n') },
      })
      continue
    }

    if (line.trim() === '```helecho-plano') {
      i++
      const jsonLines: string[] = []
      while (i < lines.length && lines[i].trim() !== '```') {
        jsonLines.push(lines[i])
        i++
      }
      i++ // salta el ``` de cierre
      try {
        const data = JSON.parse(jsonLines.join('\n')) as {
          range?: number
          lines?: unknown[]
          curves?: unknown[]
        }
        content.push({
          type: 'cartesianPlane',
          attrs: { range: data.range ?? 10, lines: data.lines ?? [], curves: data.curves ?? [] },
        })
      } catch {
        // bloque corrupto: se omite en lugar de romper la carga
      }
      continue
    }

    if (line.trim() === '```helecho-grafo') {
      i++
      const jsonLines: string[] = []
      while (i < lines.length && lines[i].trim() !== '```') {
        jsonLines.push(lines[i])
        i++
      }
      i++ // salta el ``` de cierre
      try {
        const data = JSON.parse(jsonLines.join('\n')) as {
          directed?: boolean
          weighted?: boolean
          nodes?: unknown[]
          edges?: unknown[]
        }
        content.push({
          type: 'discreteGraph',
          attrs: {
            directed: data.directed ?? false,
            weighted: data.weighted ?? false,
            nodes: data.nodes ?? [],
            edges: data.edges ?? [],
          },
        })
      } catch {
        // bloque corrupto: se omite en lugar de romper la carga
      }
      continue
    }

    if (line.trim() === '<columnas>') {
      i++
      // Junta todo lo que hay hasta el </columnas> que cierra (con contador de
      // profundidad por si hubiera columnas anidadas).
      const inner: string[] = []
      let depth = 1
      while (i < lines.length) {
        const t = lines[i].trim()
        if (t === '<columnas>') depth++
        else if (t === '</columnas>') {
          depth--
          if (depth === 0) { i++; break }
        }
        inner.push(lines[i])
        i++
      }
      // Parte el bloque interno en columnas y parsea cada una recursivamente
      const columns: TipTapNode[] = []
      let j = 0
      while (j < inner.length) {
        if (inner[j].trim() === '<columna>') {
          j++
          const colLines: string[] = []
          let nested = 0 // columnas anidadas, para no cerrar de más
          while (j < inner.length) {
            const t = inner[j].trim()
            if (t === '<columnas>') nested++
            else if (t === '</columnas>') nested--
            else if (t === '</columna>' && nested === 0) { j++; break }
            colLines.push(inner[j])
            j++
          }
          const colContent = parse(colLines.join('\n')).content ?? []
          columns.push({
            type: 'column',
            content: colContent.length ? colContent : [{ type: 'paragraph' }],
          })
        } else {
          j++
        }
      }
      if (columns.length >= 2) {
        content.push({ type: 'columnBlock', content: columns.slice(0, 3) })
      }
      continue
    }

    if (line.trim() === '```helecho-plotly') {
      i++
      const jsonLines: string[] = []
      while (i < lines.length && lines[i].trim() !== '```') {
        jsonLines.push(lines[i])
        i++
      }
      i++ // salta el ``` de cierre
      try {
        const data = JSON.parse(jsonLines.join('\n')) as {
          chartType?: string
          title?: string
          series?: unknown[]
          png?: string
        }
        content.push({
          type: 'plotlyChart',
          attrs: {
            chartType: data.chartType ?? 'bar',
            title: data.title ?? '',
            series: data.series ?? [],
            png: data.png ?? '',
          },
        })
      } catch {
        // bloque corrupto: se omite en lugar de romper la carga
      }
      continue
    }

    const headingMatch = line.match(/^(#{1,3}) (.*)$/)
    if (headingMatch) {
      content.push({
        type: 'heading',
        attrs: { level: headingMatch[1].length },
        content: parseInline(headingMatch[2]),
      })
      i++
      continue
    }

    if (line.startsWith('- ')) {
      const items: TipTapNode[] = []
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push({
          type: 'listItem',
          content: [{ type: 'paragraph', content: parseInline(lines[i].slice(2)) }],
        })
        i++
      }
      content.push({ type: 'bulletList', content: items })
      continue
    }

    if (/^\d+\. /.test(line)) {
      const items: TipTapNode[] = []
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        const text = lines[i].replace(/^\d+\. /, '')
        items.push({
          type: 'listItem',
          content: [{ type: 'paragraph', content: parseInline(text) }],
        })
        i++
      }
      content.push({ type: 'orderedList', content: items })
      continue
    }

    // Image: ![alt](src) — handles data URIs and regular URLs
    const imageMatch = line.match(/^!\[([^\]]*)\]\((.+)\)$/)
    if (imageMatch) {
      content.push({
        type: 'image',
        attrs: { src: imageMatch[2], alt: imageMatch[1] },
      })
      i++
      continue
    }

    if (line.startsWith('|')) {
      const tableLines: string[] = []
      while (i < lines.length && lines[i].startsWith('|')) {
        tableLines.push(lines[i])
        i++
      }
      const table = parseTable(tableLines)
      if (table) content.push(table)
      continue
    }

    content.push({ type: 'paragraph', content: parseInline(line) })
    i++
  }

  if (content.length === 0) {
    content.push({ type: 'paragraph', content: [] })
  }

  return { type: 'doc', content }
}

function parseTable(lines: string[]): TipTapNode | null {
  const isSeparator = (l: string) => /^\|[\s:-|]+\|$/.test(l)
  const dataLines = lines.filter((l) => !isSeparator(l))
  if (dataLines.length === 0) return null

  const rows: TipTapNode[] = dataLines.map((line, rowIndex) => {
    const cells = line
      .replace(/^\||\|$/g, '')
      .split('|')
      .map((c) => c.trim())

    return {
      type: 'tableRow',
      content: cells.map((cellText) => ({
        type: rowIndex === 0 ? 'tableHeader' : 'tableCell',
        attrs: { colspan: 1, rowspan: 1, colwidth: null },
        content: [{ type: 'paragraph', content: parseInline(cellText) }],
      })),
    }
  })

  return { type: 'table', attrs: { style: null }, content: rows }
}

function parseInline(text: string): TipTapNode[] {
  const nodes: TipTapNode[] = []
  const regex =
    /\$([^$]+)\$|\*\*([^*]+)\*\*|~~([^~]+)~~|<u>([^<]+)<\/u>|<postit ([^>]*)>(.*?)<\/postit>|<font ([^>]*)>(.*?)<\/font>|<tarjeta ([^>]*)><\/tarjeta>|<fmath ([^>]*)><\/fmath>/g

  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push({ type: 'text', text: text.slice(lastIndex, match.index) })
    }

    if (match[1] !== undefined) {
      nodes.push({ type: 'mathInline', attrs: { latex: match[1] } })
    } else if (match[2] !== undefined) {
      nodes.push({ type: 'text', text: match[2], marks: [{ type: 'bold' }] })
    } else if (match[3] !== undefined) {
      nodes.push({ type: 'text', text: match[3], marks: [{ type: 'strike' }] })
    } else if (match[4] !== undefined) {
      nodes.push({ type: 'text', text: match[4], marks: [{ type: 'underline' }] })
    } else if (match[5] !== undefined) {
      nodes.push(parsePostit(match[5], match[6] ?? ''))
    } else if (match[7] !== undefined) {
      // El contenido se parsea recursivamente (negrita, fórmulas, etc.) y
      // los nodos de texto reciben la marca de tipografía/tamaño
      const attr = (name: string) => {
        const m = match![7].match(new RegExp(`${name}="([^"]*)"`))
        return m ? m[1] : undefined
      }
      const face = attr('face')
      const size = parseInt(attr('size') ?? '', 10)
      const attrs: Record<string, unknown> = {}
      if (face) attrs.fontFamily = fontById(face)?.stack ?? face
      if (Number.isFinite(size)) attrs.fontSize = `${size}px`
      for (const inner of parseInline(match[8] ?? '')) {
        nodes.push(
          inner.type === 'text' && Object.keys(attrs).length > 0
            ? { ...inner, marks: [...(inner.marks ?? []), { type: 'textStyle', attrs }] }
            : inner
        )
      }
    } else if (match[9] !== undefined) {
      nodes.push(parseTarjeta(match[9]))
    } else if (match[10] !== undefined) {
      nodes.push(parseFmath(match[10]))
    }

    lastIndex = regex.lastIndex
  }

  if (lastIndex < text.length) {
    nodes.push({ type: 'text', text: text.slice(lastIndex) })
  }

  return nodes
}

function parsePostit(attrText: string, content: string): TipTapNode {
  const attr = (name: string) => {
    const m = attrText.match(new RegExp(`${name}="([^"]*)"`))
    return m ? m[1] : undefined
  }
  const num = (value: string | undefined, fallback: number) => {
    const n = Number(value)
    return Number.isFinite(n) ? n : fallback
  }
  return {
    type: 'postit',
    attrs: {
      id: attr('id') ?? '',
      color: attr('color') ?? 'amarillo',
      dx: num(attr('dx'), 28),
      dy: num(attr('dy'), -12),
      text: unescapePostitText(content),
    },
  }
}

function parseTarjeta(attrText: string): TipTapNode {
  const attr = (name: string) => {
    const m = attrText.match(new RegExp(`${name}="([^"]*)"`))
    return m ? m[1] : undefined
  }
  const num = (value: string | undefined, fallback: number) => {
    const n = Number(value)
    return Number.isFinite(n) ? n : fallback
  }
  return {
    type: 'flashcard',
    attrs: {
      id: attr('id') ?? '',
      color: attr('color') ?? 'indigo',
      front: unescapeTarjeta(attr('front') ?? ''),
      back: unescapeTarjeta(attr('back') ?? ''),
      dx: num(attr('dx'), 28),
      dy: num(attr('dy'), 8),
    },
  }
}

function parseFmath(attrText: string): TipTapNode {
  const m = attrText.match(/data="([^"]*)"/)
  let template = ''
  let values: Record<string, string> = {}
  if (m) {
    try {
      const data = JSON.parse(unescapeTarjeta(m[1])) as { t?: string; v?: Record<string, string> }
      template = data.t ?? ''
      values = data.v ?? {}
    } catch {
      // bloque corrupto: se omite el contenido pero no rompe la carga
    }
  }
  return { type: 'mathTemplate', attrs: { template, values } }
}
