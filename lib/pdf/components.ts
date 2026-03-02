/**
 * FTH Trading — PDF Builder Components
 * Reusable PDFKit helpers for institutional document generation.
 */
import PDFDocument from 'pdfkit'
import { colors, fonts, sizes, layout, docMeta, getVersionFooter } from './theme'

// ── Types ─────────────────────────────────────────────

export interface TableRow {
  [key: string]: string | number
}

export interface TableColumn {
  key: string
  label: string
  width: number        // fraction of contentWidth (0–1)
  align?: 'left' | 'center' | 'right'
}

// ── Document Factory ──────────────────────────────────

export function createDoc(title: string, subject?: string): typeof PDFDocument.prototype {
  const doc = new PDFDocument({
    size: 'A4',
    margins: {
      top: sizes.marginTop,
      bottom: sizes.marginBottom,
      left: sizes.marginLeft,
      right: sizes.marginRight,
    },
    info: {
      Title: title,
      Author: docMeta.author,
      Subject: subject || docMeta.subject,
      Creator: `${docMeta.companyName} Document Engine v${docMeta.engineVersion}`,
      Producer: 'PDFKit',
    },
    bufferPages: true,
  })

  return doc
}

// ── Cover Page ────────────────────────────────────────

export function drawCoverPage(
  doc: typeof PDFDocument.prototype,
  opts: {
    title: string
    subtitle?: string
    classification?: string
    date?: string
    version?: string
  }
): void {
  const { title, subtitle, classification, date, version } = opts
  const cx = sizes.pageWidth / 2
  const cw = layout.contentWidth

  // Dark background
  doc
    .rect(0, 0, sizes.pageWidth, sizes.pageHeight)
    .fill(colors.darkBg)

  // Gold accent bar — top
  doc
    .rect(sizes.marginLeft, 120, cw, 3)
    .fill(colors.gold)

  // Company name
  doc
    .font(fonts.bold)
    .fontSize(12)
    .fillColor(colors.gold)
    .text(docMeta.companyName.toUpperCase(), sizes.marginLeft, 85, {
      width: cw,
      align: 'left',
      characterSpacing: 4,
    })

  // Title
  doc
    .font(fonts.bold)
    .fontSize(sizes.titleLarge)
    .fillColor(colors.white)
    .text(title, sizes.marginLeft, 160, {
      width: cw,
      align: 'left',
      lineGap: 6,
    })

  // Subtitle
  if (subtitle) {
    doc
      .font(fonts.oblique)
      .fontSize(sizes.heading2)
      .fillColor(colors.gray400)
      .text(subtitle, sizes.marginLeft, doc.y + 16, {
        width: cw,
        align: 'left',
      })
  }

  // Gold accent bar — lower
  doc
    .rect(sizes.marginLeft, 340, cw, 1)
    .fill(colors.gold)

  // Classification badge
  if (classification) {
    doc
      .font(fonts.bold)
      .fontSize(sizes.caption)
      .fillColor(colors.gold)
      .text(classification.toUpperCase(), sizes.marginLeft, 365, {
        width: cw,
        align: 'left',
        characterSpacing: 2,
      })
  }

  // Metadata block
  const metaY = sizes.pageHeight - 180
  doc
    .rect(sizes.marginLeft, metaY, cw, 1)
    .fill(colors.gray700)

  const metaItems = [
    { label: 'Date', value: date || new Date().toISOString().split('T')[0] },
    { label: 'Policy', value: `v${version || docMeta.policyVersion}` },
    { label: 'Engine', value: `v${docMeta.engineVersion}` },
    { label: 'Build', value: getVersionFooter().split(' · ').slice(-1)[0] },
  ]

  let metaX = sizes.marginLeft
  metaItems.forEach((item) => {
    doc
      .font(fonts.bold)
      .fontSize(sizes.footnote)
      .fillColor(colors.gray500)
      .text(item.label.toUpperCase(), metaX, metaY + 14, { continued: false })
    doc
      .font(fonts.body)
      .fontSize(sizes.bodySmall)
      .fillColor(colors.gray300)
      .text(item.value, metaX, metaY + 26, { continued: false })
    metaX += cw / 4
  })

  // Footer — company info
  doc
    .font(fonts.body)
    .fontSize(sizes.footnote)
    .fillColor(colors.gray600)
    .text(
      `${docMeta.companyName} · ${docMeta.website} · ${docMeta.contactEmail}`,
      sizes.marginLeft,
      sizes.pageHeight - 50,
      { width: cw, align: 'center' }
    )
}

// ── Dark Cover Page (One-Pager variant) ───────────────

export function drawDarkCoverOnePager(
  doc: typeof PDFDocument.prototype,
  opts: {
    title: string
    subtitle: string
    tagline: string
  }
): void {
  doc
    .rect(0, 0, sizes.pageWidth, sizes.pageHeight)
    .fill(colors.darkBg)

  // Gold bar top
  doc.rect(0, 0, sizes.pageWidth, 4).fill(colors.gold)

  // Company
  doc
    .font(fonts.bold)
    .fontSize(14)
    .fillColor(colors.gold)
    .text(docMeta.companyName.toUpperCase(), sizes.marginLeft, 50, {
      characterSpacing: 5,
    })

  // Tagline
  doc
    .font(fonts.oblique)
    .fontSize(sizes.bodySmall)
    .fillColor(colors.gray400)
    .text(opts.tagline, sizes.marginLeft, doc.y + 6)

  doc.rect(sizes.marginLeft, 95, layout.contentWidth, 2).fill(colors.gold)

  // Title
  doc
    .font(fonts.bold)
    .fontSize(24)
    .fillColor(colors.white)
    .text(opts.title, sizes.marginLeft, 115, { width: layout.contentWidth })

  // Subtitle
  doc
    .font(fonts.oblique)
    .fontSize(11)
    .fillColor(colors.gray400)
    .text(opts.subtitle, sizes.marginLeft, doc.y + 8)
}

// ── Page Header + Footer ──────────────────────────────

export function addPageHeaders(
  doc: typeof PDFDocument.prototype,
  title: string
): void {
  const pages = doc.bufferedPageRange()
  for (let i = 1; i < pages.count; i++) {
    doc.switchToPage(i)

    // Header line
    doc
      .rect(sizes.marginLeft, 30, layout.contentWidth, 0.5)
      .fill(colors.gray200)

    // Header text
    doc
      .font(fonts.body)
      .fontSize(sizes.footnote)
      .fillColor(colors.gray400)
      .text(docMeta.companyName, sizes.marginLeft, 20, { continued: false })
      .text(title, sizes.marginLeft + layout.contentWidth / 2, 20, {
        width: layout.contentWidth / 2,
        align: 'right',
      })

    // Footer
    doc
      .rect(sizes.marginLeft, sizes.pageHeight - 44, layout.contentWidth, 0.5)
      .fill(colors.gray200)

    // Version footer line
    doc
      .font(fonts.mono)
      .fontSize(5.5)
      .fillColor(colors.gray300)
      .text(
        getVersionFooter(),
        sizes.marginLeft,
        sizes.pageHeight - 38,
        { width: layout.contentWidth, align: 'center' }
      )

    // Confidentiality + page number
    doc
      .font(fonts.body)
      .fontSize(sizes.footnote)
      .fillColor(colors.gray400)
      .text(
        `Confidential — ${docMeta.companyName}`,
        sizes.marginLeft,
        sizes.pageHeight - 28
      )
      .text(
        `Page ${i + 1}`,
        sizes.marginLeft,
        sizes.pageHeight - 28,
        { width: layout.contentWidth, align: 'right' }
      )
  }
}

// ── Section Heading ───────────────────────────────────

export function sectionHeading(
  doc: typeof PDFDocument.prototype,
  number: string | number,
  title: string,
  opts?: { topPad?: number }
): void {
  ensureSpace(doc, 60)

  const y = doc.y + (opts?.topPad ?? sizes.sectionGap)
  doc
    .rect(sizes.marginLeft, y, 3, 18)
    .fill(colors.gold)

  doc
    .font(fonts.bold)
    .fontSize(sizes.heading1)
    .fillColor(colors.gray900)
    .text(`${number}. ${title}`, sizes.marginLeft + 12, y + 1, {
      width: layout.contentWidth - 12,
    })

  doc.moveDown(0.6)
}

// ── Sub-Heading ───────────────────────────────────────

export function subHeading(
  doc: typeof PDFDocument.prototype,
  title: string
): void {
  ensureSpace(doc, 40)
  doc.moveDown(0.4)
  doc
    .font(fonts.bold)
    .fontSize(sizes.heading2)
    .fillColor(colors.gray800)
    .text(title, sizes.marginLeft, doc.y, { width: layout.contentWidth })
  doc.moveDown(0.3)
}

// ── Paragraph ─────────────────────────────────────────

export function paragraph(
  doc: typeof PDFDocument.prototype,
  text: string,
  opts?: { indent?: number; color?: string }
): void {
  const indent = opts?.indent ?? 0
  doc
    .font(fonts.body)
    .fontSize(sizes.body)
    .fillColor(opts?.color || colors.gray700)
    .text(text, sizes.marginLeft + indent, doc.y, {
      width: layout.contentWidth - indent,
      lineGap: 3.5,
      paragraphGap: 2,
    })
  doc.moveDown(0.5)
}

// ── Bold Paragraph ────────────────────────────────────

export function boldParagraph(
  doc: typeof PDFDocument.prototype,
  text: string
): void {
  doc
    .font(fonts.bold)
    .fontSize(sizes.body)
    .fillColor(colors.gray800)
    .text(text, sizes.marginLeft, doc.y, {
      width: layout.contentWidth,
      lineGap: 3.5,
    })
  doc.moveDown(0.5)
}

// ── Bullet List ───────────────────────────────────────

export function bulletList(
  doc: typeof PDFDocument.prototype,
  items: string[],
  opts?: { indent?: number }
): void {
  const indent = opts?.indent ?? 14
  items.forEach((item) => {
    ensureSpace(doc, 20)
    doc
      .font(fonts.body)
      .fontSize(sizes.body)
      .fillColor(colors.gold)
      .text('●', sizes.marginLeft + indent - 10, doc.y, { continued: true })
      .fillColor(colors.gray700)
      .font(fonts.body)
      .text(`  ${item}`, { width: layout.contentWidth - indent - 10, lineGap: 2 })
    doc.moveDown(0.15)
  })
  doc.moveDown(0.3)
}

// ── Key-Value Table (compact) ─────────────────────────

export function keyValueBlock(
  doc: typeof PDFDocument.prototype,
  items: { label: string; value: string }[],
  opts?: { labelWidth?: number }
): void {
  const lw = opts?.labelWidth ?? 160
  items.forEach(({ label, value }) => {
    ensureSpace(doc, 18)
    const y = doc.y
    doc
      .font(fonts.bold)
      .fontSize(sizes.bodySmall)
      .fillColor(colors.gray600)
      .text(label, sizes.marginLeft + 8, y, { width: lw })
    doc
      .font(fonts.body)
      .fontSize(sizes.bodySmall)
      .fillColor(colors.gray800)
      .text(value, sizes.marginLeft + lw + 8, y, {
        width: layout.contentWidth - lw - 16,
      })
    // Use whichever advanced the y more
    doc.y = Math.max(doc.y, y + 14)
  })
  doc.moveDown(0.4)
}

// ── Data Table ────────────────────────────────────────

export function dataTable(
  doc: typeof PDFDocument.prototype,
  columns: TableColumn[],
  rows: TableRow[]
): void {
  ensureSpace(doc, 40 + rows.length * 18)

  const startX = sizes.marginLeft
  const cw = layout.contentWidth

  // Header row
  const headerY = doc.y
  doc.rect(startX, headerY, cw, 18).fill(colors.gray100)
  let xPos = startX + 4
  columns.forEach((col) => {
    const colWidth = cw * col.width
    doc
      .font(fonts.bold)
      .fontSize(sizes.caption)
      .fillColor(colors.gray600)
      .text(col.label.toUpperCase(), xPos, headerY + 5, {
        width: colWidth - 8,
        align: col.align || 'left',
      })
    xPos += colWidth
  })
  doc.y = headerY + 20

  // Data rows
  rows.forEach((row, idx) => {
    const rowY = doc.y
    if (idx % 2 === 1) {
      doc.rect(startX, rowY, cw, 16).fill('#FAFAFA')
    }
    let x = startX + 4
    columns.forEach((col) => {
      const colWidth = cw * col.width
      doc
        .font(fonts.body)
        .fontSize(sizes.bodySmall)
        .fillColor(colors.gray700)
        .text(String(row[col.key] ?? ''), x, rowY + 4, {
          width: colWidth - 8,
          align: col.align || 'left',
        })
      x += colWidth
    })
    doc.y = rowY + 16
  })

  // Bottom border
  doc.rect(startX, doc.y, cw, 0.5).fill(colors.gray200)
  doc.moveDown(0.6)
}

// ── Callout Box ───────────────────────────────────────

export function calloutBox(
  doc: typeof PDFDocument.prototype,
  text: string,
  opts?: { color?: string; bgColor?: string }
): void {
  ensureSpace(doc, 45)
  const boxY = doc.y
  const boxH = 36
  doc
    .rect(sizes.marginLeft, boxY, layout.contentWidth, boxH)
    .fill(opts?.bgColor || '#FFF7ED')
  doc
    .rect(sizes.marginLeft, boxY, 3, boxH)
    .fill(opts?.color || colors.gold)
  doc
    .font(fonts.oblique)
    .fontSize(sizes.bodySmall)
    .fillColor(opts?.color || colors.amber)
    .text(text, sizes.marginLeft + 14, boxY + 12, {
      width: layout.contentWidth - 28,
    })
  doc.y = boxY + boxH + 8
}

// ── Flow Diagram ──────────────────────────────────────

export function flowDiagram(
  doc: typeof PDFDocument.prototype,
  steps: string[],
  opts?: { darkMode?: boolean }
): void {
  const dark = opts?.darkMode ?? false
  const boxWidth = 220
  const boxHeight = 28
  const arrowGap = 14
  const cx = sizes.pageWidth / 2

  ensureSpace(doc, steps.length * (boxHeight + arrowGap) + 20)
  doc.moveDown(0.3)

  steps.forEach((step, i) => {
    const y = doc.y
    const x = cx - boxWidth / 2

    // Box
    doc
      .roundedRect(x, y, boxWidth, boxHeight, 4)
      .lineWidth(1)
      .strokeColor(dark ? colors.gold : colors.gray300)
      .fillAndStroke(dark ? colors.warmBlack : colors.white, dark ? colors.gold : colors.gray300)

    // Text
    doc
      .font(fonts.bold)
      .fontSize(sizes.bodySmall)
      .fillColor(dark ? colors.gold : colors.gray800)
      .text(step, x + 10, y + 9, {
        width: boxWidth - 20,
        align: 'center',
      })

    doc.y = y + boxHeight

    // Arrow
    if (i < steps.length - 1) {
      const arrowX = cx
      const arrowTop = doc.y + 2
      const arrowBot = arrowTop + arrowGap - 4
      doc
        .moveTo(arrowX, arrowTop)
        .lineTo(arrowX, arrowBot)
        .strokeColor(dark ? colors.gold : colors.gray400)
        .lineWidth(1)
        .stroke()
      // Arrowhead
      doc
        .moveTo(arrowX - 3, arrowBot - 4)
        .lineTo(arrowX, arrowBot)
        .lineTo(arrowX + 3, arrowBot - 4)
        .strokeColor(dark ? colors.gold : colors.gray400)
        .stroke()

      doc.y = doc.y + arrowGap
    }
  })
  doc.moveDown(0.5)
}

// ── Horizontal Rule ───────────────────────────────────

export function horizontalRule(doc: typeof PDFDocument.prototype): void {
  doc.moveDown(0.3)
  doc
    .rect(sizes.marginLeft, doc.y, layout.contentWidth, 0.5)
    .fill(colors.gray200)
  doc.moveDown(0.6)
}

// ── Ensure Space (avoid orphans) ──────────────────────

export function ensureSpace(doc: typeof PDFDocument.prototype, needed: number): void {
  if (doc.y + needed > sizes.pageHeight - sizes.marginBottom) {
    doc.addPage()
  }
}

// ── Render to Buffer ──────────────────────────────────

export function renderToBuffer(doc: typeof PDFDocument.prototype): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
    doc.end()
  })
}
