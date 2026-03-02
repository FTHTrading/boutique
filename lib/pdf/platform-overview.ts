/**
 * FTH Platform Overview PDF
 * Educational overview of the entire FTH Trading platform —
 * commodities, prop sharing, funding, settlement, compliance, and technology stack.
 */
import {
  createDoc, drawCoverPage, sectionHeading, subHeading,
  paragraph, boldParagraph, bulletList, keyValueBlock,
  calloutBox, dataTable, flowDiagram, horizontalRule,
  addPageHeaders, renderToBuffer, ensureSpace,
} from './components'
import type { TableColumn, TableRow } from './components'
import { colors, fonts, sizes, layout, docMeta } from './theme'

export async function generatePlatformOverview(): Promise<Buffer> {
  const doc = createDoc(
    'FTH Trading — Platform Overview',
    'Complete guide to the FTH Trading ecosystem'
  )

  // ── Cover ───────────────────────────────────────────
  drawCoverPage(doc, {
    title: 'FTH Trading\nPlatform Overview',
    subtitle: 'The Complete System — Commodities, Prop Sharing, Risk & Infrastructure',
    classification: 'General Distribution',
    version: docMeta.policyVersion,
  })

  // ── 1. What Is FTH Trading ──────────────────────────
  doc.addPage()
  sectionHeading(doc, 1, 'What Is FTH Trading', { topPad: 10 })

  paragraph(doc,
    'FTH Trading is an AI-native commodity trading and capital management platform. It operates across two complementary business lines: physical commodity sourcing and structured trading capital (Prop Sharing). The platform is built on institutional-grade technology with multi-layer risk controls, real-time governance, and full audit trails.'
  )

  boldParagraph(doc, 'Two Core Business Lines')

  bulletList(doc, [
    'Commodity Trading — Source, structure, and execute physical commodity deals (coffee, cocoa, precious metals, base metals, sugar, crude oil) with integrated compliance, trade finance, and settlement.',
    'Prop Sharing — Fund qualified traders with institutional capital, share profits, and manage risk through a structured evaluation-to-funded pipeline with behavioural monitoring, execution simulation, and capital compounding.',
  ])

  calloutBox(doc,
    'FTH operates as a structured principal — not a broker. All capital is deployed from the firm\'s treasury with governance controls at every layer.'
  )

  paragraph(doc,
    'The platform integrates AI-driven agents for compliance screening, risk monitoring, behavioural analysis, and operational automation. Every action is logged, traced, and auditable.'
  )

  // ── 2. Commodity Trading ────────────────────────────
  sectionHeading(doc, 2, 'Commodity Trading')

  paragraph(doc,
    'FTH sources and structures supply for select commodities globally. All transactions are subject to applicable laws and compliance review. The platform handles sourcing, pricing, logistics, trade finance, and settlement.'
  )

  subHeading(doc, 'Commodities Traded')

  const commodityCols: TableColumn[] = [
    { key: 'commodity', label: 'Commodity', width: 0.18 },
    { key: 'hsCode', label: 'HS Code', width: 0.22 },
    { key: 'origins', label: 'Key Origins', width: 0.35 },
    { key: 'incoterms', label: 'Incoterms', width: 0.15 },
    { key: 'restricted', label: 'Status', width: 0.10 },
  ]

  const commodityRows: TableRow[] = [
    { commodity: 'Coffee', hsCode: '0901.11 / 0901.12', origins: 'Brazil, Colombia, Ethiopia, Vietnam', incoterms: 'EXW, FOB, CIF', restricted: 'Open' },
    { commodity: 'Cocoa', hsCode: '1801.00', origins: 'Côte d\'Ivoire, Ghana, Ecuador', incoterms: 'FOB, CIF, DDP', restricted: 'Open' },
    { commodity: 'Precious Metals', hsCode: '7108.13 / 7106.92', origins: 'Switzerland, UK, South Africa', incoterms: 'EXW, FOB, DDP', restricted: 'Restricted' },
    { commodity: 'Base Metals', hsCode: '7403.11 / 7601.10', origins: 'Chile, Peru, Australia, China', incoterms: 'FOB, CIF, DAP', restricted: 'Open' },
    { commodity: 'Sugar', hsCode: '1701.14', origins: 'Brazil, Thailand, India', incoterms: 'FOB, CFR, CIF', restricted: 'Open' },
    { commodity: 'Crude Oil', hsCode: '2709.00', origins: 'Middle East, North Sea, Americas', incoterms: 'FOB, CIF, DES', restricted: 'Restricted' },
  ]

  dataTable(doc, commodityCols, commodityRows)

  calloutBox(doc,
    'Restricted commodities (precious metals, crude oil) may require export controls, licensing, or enhanced compliance review depending on jurisdiction and end-use.'
  )

  subHeading(doc, 'Deal Lifecycle')

  flowDiagram(doc, [
    '1. Sourcing — Identify origin, grade, quantity',
    '2. Compliance — Jurisdiction + sanctions screening',
    '3. Structuring — Pricing, incoterms, trade finance',
    '4. Documentation — Contracts, LCs, insurance',
    '5. Settlement — FIAT / XRPL / Stellar rails',
    '6. Proof Anchoring — Blockchain audit',
  ])

  // ── 3. Prop Sharing Programme ───────────────────────
  doc.addPage()
  sectionHeading(doc, 3, 'Prop Sharing Programme', { topPad: 10 })

  paragraph(doc,
    'The Prop Sharing programme funds qualified traders with institutional capital and shares the resulting profits. Traders prove their edge through a structured evaluation, then receive a funded account with real capital in real markets.'
  )

  subHeading(doc, 'How It Works')

  flowDiagram(doc, [
    '1. Apply — Submit application + KYC',
    '2. Evaluate — Trade simulated capital, hit targets',
    '3. Verify — Human review, consistency checks',
    '4. Fund — Receive live capital (up to $500K)',
    '5. Trade — Real markets, real P&L',
    '6. Earn — Up to 90% profit split, bi-weekly payouts',
  ])

  subHeading(doc, 'Key Parameters')

  keyValueBlock(doc, [
    { label: 'Max Funding', value: '$500,000' },
    { label: 'Profit Split', value: 'Up to 90/10 (trader/firm)' },
    { label: 'Payout Frequency', value: 'Bi-weekly or monthly' },
    { label: 'Markets', value: 'Commodities (4+ markets)' },
    { label: 'Scaling', value: 'Automatic based on performance' },
    { label: 'Capital at Risk', value: 'Firm capital only — no trader capital at risk' },
  ])

  // ── 4. Risk Architecture ───────────────────────────
  sectionHeading(doc, 4, 'Risk Architecture')

  paragraph(doc,
    'FTH employs a multi-layer risk framework that operates at every level of the system. Risk controls are not advisory — they are enforced automatically through code with human oversight.'
  )

  subHeading(doc, 'Defence Layers')

  const riskCols: TableColumn[] = [
    { key: 'layer', label: 'Layer', width: 0.25 },
    { key: 'scope', label: 'Scope', width: 0.25 },
    { key: 'controls', label: 'Key Controls', width: 0.50 },
  ]

  const riskRows: TableRow[] = [
    { layer: 'Execution', scope: 'Per-trade', controls: 'Spread widening, slippage simulation, latency monitoring, kill switches' },
    { layer: 'Behavioural', scope: 'Per-trader', controls: 'Revenge trading detection, martingale patterns, stability scoring, auto-freeze' },
    { layer: 'Treasury', scope: 'Firm-wide', controls: 'Reserve buffer policy, health gauge (normal/caution/throttled/frozen), stress testing' },
    { layer: 'Compliance', scope: 'Regulatory', controls: 'KYC/AML screening, jurisdiction rules, sanctions checks, audit trail' },
    { layer: 'Fraud', scope: 'Platform', controls: 'Gaming detection (latency arb, overfit, news straddle), anomaly scoring' },
    { layer: 'Capital', scope: 'Compounding', controls: 'Retained earnings policies, gate enforcement, readiness scoring, dry-run planner' },
  ]

  dataTable(doc, riskCols, riskRows)

  calloutBox(doc,
    'All risk controls are enforced programmatically. Kill switches can halt trading at firm, instrument, or trader level within milliseconds. No manual override is required.'
  )

  // ── 5. Technology Stack ─────────────────────────────
  sectionHeading(doc, 5, 'Technology & Infrastructure')

  paragraph(doc,
    'The FTH platform is built on modern, scalable infrastructure designed for institutional-grade operations.'
  )

  const techCols: TableColumn[] = [
    { key: 'component', label: 'Component', width: 0.25 },
    { key: 'technology', label: 'Technology', width: 0.35 },
    { key: 'purpose', label: 'Purpose', width: 0.40 },
  ]

  const techRows: TableRow[] = [
    { component: 'Application', technology: 'Next.js 14 (App Router)', purpose: 'Dashboard, public pages, API routes' },
    { component: 'Database', technology: 'PostgreSQL 15+ (pgvector)', purpose: 'All structured data, vector search, audit logs' },
    { component: 'AI Agents', technology: 'Custom TypeScript agents', purpose: 'Compliance, risk, behavioural analysis, automation' },
    { component: 'Auth', technology: 'Clerk', purpose: 'Identity, SSO, team management' },
    { component: 'Settlement', technology: 'FIAT + XRPL + Stellar', purpose: 'Multi-rail settlement with proof anchoring' },
    { component: 'Documents', technology: 'PDFKit', purpose: 'On-demand institutional PDF generation' },
    { component: 'Deployment', technology: 'Vercel / Node.js', purpose: 'Edge-optimised, auto-scaling' },
  ]

  dataTable(doc, techCols, techRows)

  // ── 6. Funding & Settlement ─────────────────────────
  doc.addPage()
  sectionHeading(doc, 6, 'Funding & Settlement', { topPad: 10 })

  paragraph(doc,
    'FTH supports multiple funding instruments and settlement rails to accommodate diverse counterparty requirements.'
  )

  subHeading(doc, 'Banking Instruments')

  bulletList(doc, [
    'Standby Letters of Credit (SBLC) — Guarantees backed by banking relationships',
    'Letters of Credit (LC) — Documentary credits for trade finance',
    'Bank Guarantees (BG) — Performance and payment guarantees',
  ])

  subHeading(doc, 'Settlement Rails')

  bulletList(doc, [
    'FIAT — Traditional banking rails (SWIFT, ACH, SEPA)',
    'XRPL — Ripple Ledger for cross-border settlement',
    'Stellar — Stellar network for emerging market settlement',
  ])

  subHeading(doc, 'Proof Anchoring')
  paragraph(doc,
    'Every significant transaction is anchored to a blockchain audit trail. This provides tamper-proof proof of execution, compliance decisions, and settlement finality. Proof anchors can be independently verified by any counterparty.'
  )

  // ── 7. Compliance Framework ─────────────────────────
  sectionHeading(doc, 7, 'Compliance Framework')

  paragraph(doc,
    'Compliance is embedded in the platform at every level — not bolted on afterward. The system flags potential issues for human review and maintains a complete audit trail.'
  )

  bulletList(doc, [
    'KYC / AML — Identity verification, sanctions screening, and ongoing monitoring for all traders and counterparties',
    'Jurisdiction Rules — Automated compliance checks based on origin/destination jurisdiction pairs',
    'Export Controls — Flagging of restricted commodities requiring licensing or enhanced due diligence',
    'Audit Trail — Complete, immutable record of all compliance decisions, risk events, and operational actions',
    'Privacy & Data — GDPR-aligned data handling with documented retention and deletion policies',
  ])

  // ── 8. Governance & Documentation ───────────────────
  sectionHeading(doc, 8, 'Governance & Documentation')

  paragraph(doc,
    'FTH generates institutional-grade documentation on demand. Every document includes version footers, commit hashes, and policy references — providing a verifiable audit trail of system state at generation time.'
  )

  subHeading(doc, 'Available Documents')

  const docsCols: TableColumn[] = [
    { key: 'document', label: 'Document', width: 0.35 },
    { key: 'type', label: 'Type', width: 0.15 },
    { key: 'audience', label: 'Audience', width: 0.50 },
  ]

  const docsRows: TableRow[] = [
    { document: 'Platform Overview', type: 'Static', audience: 'General — anyone evaluating the platform' },
    { document: 'Commodities Guide', type: 'Static', audience: 'Traders, partners, sourcing teams' },
    { document: 'Architecture Overview', type: 'Static', audience: 'Executives, partners, allocators' },
    { document: 'Governance Report', type: 'Live Data', audience: 'Risk committee, compliance, auditors' },
    { document: 'Risk Whitepaper', type: 'Static', audience: 'Risk officers, engineers, due diligence' },
    { document: 'Challenge Rulebook', type: 'Static', audience: 'Traders, legal, compliance' },
    { document: 'Terms & Definitions', type: 'Static', audience: 'All users — reference glossary' },
    { document: 'One-Page Brochure', type: 'Static', audience: 'General — email & conference ready' },
  ]

  dataTable(doc, docsCols, docsRows)

  // ── 9. Contact ──────────────────────────────────────
  sectionHeading(doc, 9, 'Contact & Next Steps')

  keyValueBlock(doc, [
    { label: 'Company', value: docMeta.companyName },
    { label: 'Website', value: docMeta.website },
    { label: 'Capital Enquiries', value: docMeta.contactEmail },
    { label: 'Engine Version', value: `v${docMeta.engineVersion}` },
    { label: 'Policy Version', value: docMeta.policyVersion },
  ])

  calloutBox(doc,
    'To request terms, visit fthtrading.com/request-terms. For prop sharing applications, visit fthtrading.com/prop-sharing.'
  )

  // ── Back Page ───────────────────────────────────────
  doc.addPage()
  doc.rect(0, 0, sizes.pageWidth, sizes.pageHeight).fill(colors.darkBg)
  doc
    .font(fonts.bold)
    .fontSize(20)
    .fillColor(colors.gold)
    .text(docMeta.companyName.toUpperCase(), 0, sizes.pageHeight / 2 - 40, {
      width: sizes.pageWidth,
      align: 'center',
      characterSpacing: 6,
    })
  doc
    .font(fonts.oblique)
    .fontSize(11)
    .fillColor(colors.gray400)
    .text(docMeta.companyTagline, 0, doc.y + 10, {
      width: sizes.pageWidth,
      align: 'center',
    })
  doc
    .font(fonts.body)
    .fontSize(9)
    .fillColor(colors.gray500)
    .text(`${docMeta.website}  ·  ${docMeta.contactEmail}`, 0, doc.y + 30, {
      width: sizes.pageWidth,
      align: 'center',
    })

  addPageHeaders(doc, 'Platform Overview')
  return renderToBuffer(doc)
}
