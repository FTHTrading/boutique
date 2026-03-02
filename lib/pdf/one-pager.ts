/**
 * FTH One-Page Professional Brochure
 * Dark theme, gold accent. Conference-ready. Email-forwardable.
 */
import {
  createDoc, drawDarkCoverOnePager, flowDiagram,
  renderToBuffer, ensureSpace,
} from './components'
import { colors, fonts, sizes, layout, docMeta } from './theme'

export async function generateOnePager(): Promise<Buffer> {
  const doc = createDoc(
    'FTH Prop Sharing — One Pager',
    'Quick introduction to the FTH Prop Sharing programme'
  )

  // ── Full dark-theme single page ─────────────────────
  drawDarkCoverOnePager(doc, {
    title: 'Prop Sharing Programme',
    subtitle: 'Funded Trading · Profit Sharing · Institutional Risk Controls',
    tagline: docMeta.companyTagline,
  })

  const x = sizes.marginLeft
  const cw = layout.contentWidth
  let y = doc.y + 20

  // ── What It Is ──────────────────────────────────────
  doc
    .font(fonts.bold)
    .fontSize(10)
    .fillColor(colors.gold)
    .text('WHAT IT IS', x, y)
  y = doc.y + 4
  doc
    .font(fonts.body)
    .fontSize(sizes.bodySmall)
    .fillColor(colors.gray300)
    .text(
      'FTH Prop Sharing provides skilled traders with funded trading capital under a contractual profit-sharing model. ' +
      'Traders are evaluated through a simulated challenge, then receive access to firm capital with institutional-grade risk controls. ' +
      'The firm retains capital at risk; traders earn a share of net profits.',
      x, y, { width: cw, lineGap: 2.5 }
    )

  y = doc.y + 14

  // ── How It Works ────────────────────────────────────
  doc
    .font(fonts.bold)
    .fontSize(10)
    .fillColor(colors.gold)
    .text('HOW IT WORKS', x, y)
  y = doc.y + 6

  // 3-step flow — inline
  const steps = [
    { num: '01', title: 'EVALUATE', desc: 'Pass a simulated trading challenge with strict risk parameters.' },
    { num: '02', title: 'VERIFY', desc: 'Demonstrate consistency in a second verification phase.' },
    { num: '03', title: 'TRADE & EARN', desc: 'Receive funded capital. Keep 80% of net profits.' },
  ]

  const stepWidth = cw / 3
  steps.forEach((step, i) => {
    const sx = x + i * stepWidth
    doc
      .font(fonts.bold)
      .fontSize(18)
      .fillColor(colors.gold)
      .text(step.num, sx, y, { width: stepWidth - 10 })
    doc
      .font(fonts.bold)
      .fontSize(sizes.bodySmall)
      .fillColor(colors.white)
      .text(step.title, sx, y + 22, { width: stepWidth - 10 })
    doc
      .font(fonts.body)
      .fontSize(sizes.caption)
      .fillColor(colors.gray400)
      .text(step.desc, sx, y + 34, { width: stepWidth - 15, lineGap: 1.5 })
  })

  y = y + 68

  // ── Divider ─────────────────────────────────────────
  doc.rect(x, y, cw, 1).fill(colors.gray700)
  y += 12

  // ── Risk Controls ───────────────────────────────────
  doc
    .font(fonts.bold)
    .fontSize(10)
    .fillColor(colors.gold)
    .text('RISK CONTROLS', x, y)
  y = doc.y + 4

  const controls = [
    ['Maximum Drawdown Limits', 'Real-time enforcement, no override'],
    ['Daily Loss Limits', 'Automatic position freeze on breach'],
    ['Behavioural Scoring', 'Composite stability monitoring'],
    ['Treasury Guard', 'Automated reserve management'],
    ['Kill Switches', 'Firm, trader, instrument scope'],
    ['Stress Simulation', 'Verified before capital compounding'],
  ]

  const colW = cw / 2
  controls.forEach((ctrl, i) => {
    const cx2 = x + (i % 2) * colW
    const cy = y + Math.floor(i / 2) * 16
    doc
      .font(fonts.bold)
      .fontSize(sizes.caption)
      .fillColor(colors.white)
      .text('●', cx2, cy, { continued: true })
      .font(fonts.body)
      .fillColor(colors.gray300)
      .text(`  ${ctrl[0]}`, { continued: true })
      .font(fonts.body)
      .fillColor(colors.gray500)
      .text(` — ${ctrl[1]}`, { width: colW - 20 })
  })

  y = y + Math.ceil(controls.length / 2) * 16 + 12

  // ── Divider ─────────────────────────────────────────
  doc.rect(x, y, cw, 1).fill(colors.gray700)
  y += 12

  // ── Scaling Ladder ──────────────────────────────────
  doc
    .font(fonts.bold)
    .fontSize(10)
    .fillColor(colors.gold)
    .text('SCALING LADDER', x, y)
  y = doc.y + 6

  const tiers = [
    { level: 'Entry', capital: '$10K – $50K', split: '80/20', req: 'Pass challenge' },
    { level: 'Growth', capital: '$50K – $100K', split: '80/20', req: '60 days, score ≥ 70' },
    { level: 'Senior', capital: '$100K – $200K', split: '85/15', req: '120 days, score ≥ 75' },
    { level: 'Elite', capital: '$200K+', split: '90/10', req: '180 days, score ≥ 80' },
  ]

  // Table header
  const cols = [0, 0.15, 0.4, 0.6, 0.78]
  doc.rect(x, y, cw, 14).fill('#1a1410')
  const headers = ['TIER', 'CAPITAL', 'SPLIT', 'REQUIREMENT']
  headers.forEach((h, hi) => {
    doc
      .font(fonts.bold)
      .fontSize(sizes.footnote)
      .fillColor(colors.gold)
      .text(h, x + cols[hi] * cw + 4, y + 4, { width: (cols[hi + 1] || 1) * cw - cols[hi] * cw - 8 })
  })
  y += 15

  tiers.forEach((tier, i) => {
    if (i % 2 === 0) doc.rect(x, y, cw, 13).fill('#0f0c08')
    const vals = [tier.level, tier.capital, tier.split, tier.req]
    vals.forEach((v, vi) => {
      doc
        .font(vi === 0 ? fonts.bold : fonts.body)
        .fontSize(sizes.caption)
        .fillColor(vi === 0 ? colors.gold : colors.gray300)
        .text(v, x + cols[vi] * cw + 4, y + 3, { width: (cols[vi + 1] || 1) * cw - cols[vi] * cw - 8 })
    })
    y += 13
  })

  y += 14

  // ── Bottom bar ──────────────────────────────────────
  doc.rect(x, y, cw, 1).fill(colors.gold)
  y += 14

  // Contact block
  doc
    .font(fonts.bold)
    .fontSize(9)
    .fillColor(colors.gold)
    .text(docMeta.companyName, x, y, { continued: true })
    .font(fonts.body)
    .fillColor(colors.gray400)
    .text(`   ·   ${docMeta.website}   ·   ${docMeta.contactEmail}`, { width: cw })

  doc
    .font(fonts.body)
    .fontSize(sizes.footnote)
    .fillColor(colors.gray600)
    .text(
      `Policy v${docMeta.policyVersion} · Engine v${docMeta.engineVersion} · ${new Date().toISOString().split('T')[0]}`,
      x,
      sizes.pageHeight - 40,
      { width: cw, align: 'center' }
    )

  // Gold bar bottom
  doc.rect(0, sizes.pageHeight - 4, sizes.pageWidth, 4).fill(colors.gold)

  return renderToBuffer(doc)
}
