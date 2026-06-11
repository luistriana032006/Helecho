interface TextMark {
  type: string
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
    return text
  }
  if (node.type === 'mathInline') {
    return `$${(node.attrs?.latex as string) ?? ''}$`
  }
  return ''
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
  const regex = /\$([^$]+)\$|\*\*([^*]+)\*\*|~~([^~]+)~~|<u>([^<]+)<\/u>/g

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
    }

    lastIndex = regex.lastIndex
  }

  if (lastIndex < text.length) {
    nodes.push({ type: 'text', text: text.slice(lastIndex) })
  }

  return nodes
}
