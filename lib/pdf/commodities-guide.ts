/**
 * FTH Commodities Trading Guide PDF
 * Educational guide — explains commodity trading on the FTH platform,
 * covering all 6 commodities, HS codes, incoterms, compliance, and sourcing.
 */
import {
  createDoc, drawCoverPage, sectionHeading, subHeading,
  paragraph, boldParagraph, bulletList, keyValueBlock,
  calloutBox, dataTable, flowDiagram, horizontalRule,
  addPageHeaders, renderToBuffer, ensureSpace,
} from './components'
import type { TableColumn, TableRow } from './components'
import { colors, fonts, sizes, layout, docMeta } from './theme'

/* ────────────────────────── Data ─────────────────────────── */

interface CommodityProfile {
  name: string
  hsCodes: string
  description: string
  origins: string[]
  grades: string[]
  incoterms: string[]
  notes: string
}

const COMMODITIES: CommodityProfile[] = [
  {
    name: 'Coffee (Green Bean)',
    hsCodes: '0901.11 / 0901.12',
    description:
      'Arabica and Robusta green coffee beans, the most widely traded soft commodity globally. Coffee is graded by origin, altitude, screen size, and defect count. FTH sources from established cooperatives and certified estates.',
    origins: ['Brazil (Santos, Cerrado)', 'Colombia (Supremo, Excelso)', 'Ethiopia (Yirgacheffe, Sidamo)', 'Vietnam (Robusta)', 'Guatemala, Honduras, Kenya'],
    grades: ['Specialty (80+ SCA score)', 'Commercial', 'Exchange-grade (ICE eligible)'],
    incoterms: ['EXW — Ex-Works, buyer arranges all transport', 'FOB — Free On Board, seller loads at origin port', 'CIF — Cost, Insurance & Freight, seller arranges to destination'],
    notes: 'Coffee is not a restricted commodity but may require phytosanitary certificates and origin documentation.',
  },
  {
    name: 'Cocoa (Raw Beans)',
    hsCodes: '1801.00',
    description:
      'Raw cocoa beans are the primary input for chocolate manufacturing. Quality depends on fermentation, drying method, and bean size. FTH operates in bulk and specialty-grade segments.',
    origins: ['Côte d\'Ivoire (world leader)', 'Ghana', 'Ecuador (Nacional variety, fine flavour)', 'Cameroon', 'Nigeria'],
    grades: ['Bulk/Ordinary', 'Fine/Flavour (distinct aroma, <5% slate)', 'Certified organic'],
    incoterms: ['FOB — Free On Board', 'CIF — Cost, Insurance & Freight', 'DDP — Delivered Duty Paid'],
    notes: 'Due diligence on child labour and deforestation is mandatory per EU regulation.',
  },
  {
    name: 'Precious Metals (Gold & Silver)',
    hsCodes: '7108.13 / 7106.92',
    description:
      'Investment-grade and industrial-grade gold and silver. Precious metals are traded by troy ounce, with purity measured in fineness (e.g., 999.9 for gold). FTH deals in LBMA-accredited bars and coins.',
    origins: ['Switzerland (refining hub)', 'United Kingdom (LBMA)', 'South Africa', 'Australia', 'Canada'],
    grades: ['LBMA Good Delivery (400oz bars, 995+ fineness)', 'Kilobars (999.9)', 'Comex eligible (100oz)'],
    incoterms: ['EXW — Ex-Works, vault to vault', 'FOB — Free On Board', 'DDP — Delivered Duty Paid (insured)'],
    notes: 'RESTRICTED: Enhanced compliance required. Origin provenance, conflict mineral checks, and export licensing mandatory in many jurisdictions.',
  },
  {
    name: 'Base Metals (Copper & Aluminium)',
    hsCodes: '7403.11 / 7601.10',
    description:
      'Industrial-grade copper cathodes and aluminium ingots. Base metals are priced on the London Metal Exchange (LME) and traded in standard lot sizes. Demand is driven by construction, electronics, and manufacturing.',
    origins: ['Chile (Codelco, world\'s largest)', 'Peru', 'Australia', 'China', 'Russia (sanctions sensitivity)'],
    grades: ['LME Grade A cathode (Cu 99.99%)', 'Grade A aluminium (Al 99.7%)', 'Off-grade / blend'],
    incoterms: ['FOB — Free On Board', 'CIF — Cost, Insurance & Freight', 'DAP — Delivered At Place'],
    notes: 'Russian-origin base metals may be subject to sanctions or premiums/discounts. Always verify current sanctions lists.',
  },
  {
    name: 'Sugar (Raw Cane)',
    hsCodes: '1701.14',
    description:
      'Raw cane sugar (VHP — Very High Polarisation) is the most traded form. Sugar is priced on ICE NY#11 (raw) and ICE London #5 (white). FTH handles bulk raw sugar for refining and direct consumption.',
    origins: ['Brazil (Centre-South, world leader)', 'Thailand', 'India', 'Australia (Queensland)'],
    grades: ['VHP (Very High Polarisation, 99.3° pol)', 'VVHP (99.5° pol)', 'IC 45 (refined, white)'],
    incoterms: ['FOB — Free On Board (Santos, Paranaguá)', 'CFR — Cost & Freight', 'CIF — Cost, Insurance & Freight'],
    notes: 'Sugar is not restricted but volume quotas may apply in certain destination countries (EU, US tariff rate quotas).',
  },
  {
    name: 'Crude Oil (Petroleum)',
    hsCodes: '2709.00',
    description:
      'Crude oil is the world\'s most traded commodity by value. FTH structures deals in benchmark grades (Brent, WTI, Dubai) for mid-stream buyers. Pricing follows ICE Brent or NYMEX WTI.',
    origins: ['Middle East (Saudi Arabia, UAE, Iraq)', 'North Sea (Brent blend)', 'Americas (US, Brazil, Canada)', 'West Africa (Nigeria, Angola)'],
    grades: ['Brent Blend (38° API, 0.37% sulphur)', 'WTI (39.6° API, 0.24% sulphur)', 'Dubai/Oman (sour, Asian benchmark)'],
    incoterms: ['FOB — Free On Board (tanker nominated)', 'CIF — Cost, Insurance & Freight', 'DES — Delivered Ex-Ship'],
    notes: 'RESTRICTED: Subject to international sanctions, OPEC quotas, end-use declarations, and environmental regulations. Enhanced due diligence mandatory.',
  },
]

/* ─────────────────────── Generator ──────────────────────── */

export async function generateCommoditiesGuide(): Promise<Buffer> {
  const doc = createDoc(
    'FTH Trading — Commodities Guide',
    'Educational guide to commodity trading on the FTH platform'
  )

  // ── Cover ───────────────────────────────────────────
  drawCoverPage(doc, {
    title: 'Commodities\nTrading Guide',
    subtitle: 'An Educational Reference for Traders, Partners & Sourcing Teams',
    classification: 'General Distribution',
    version: docMeta.policyVersion,
  })

  // ── 1. Introduction ────────────────────────────────
  doc.addPage()
  sectionHeading(doc, 1, 'Introduction to Commodity Trading', { topPad: 10 })

  paragraph(doc,
    'Commodity trading involves the buying and selling of raw materials — physical goods that are standardised, graded, and traded on global exchanges or over-the-counter (OTC) markets. Unlike financial instruments, commodities are tangible: they must be sourced, transported, stored, and delivered.'
  )

  paragraph(doc,
    'FTH Trading operates in the physical commodity space. This means every deal involves real goods moving from origin to destination. Understanding the fundamentals — classifications, pricing conventions, transport terms, and compliance requirements — is essential to operating on the platform.'
  )

  calloutBox(doc,
    'This guide is designed to educate. Whether you\'re a new trader, a potential partner, or a sourcing team member, this document will help you understand how commodity trading works on FTH.'
  )

  // ── 2. Understanding HS Codes ──────────────────────
  sectionHeading(doc, 2, 'Understanding HS Codes')

  paragraph(doc,
    'The Harmonized System (HS) is a standardised numerical method of classifying traded products. Developed by the World Customs Organization (WCO), it is used by over 200 countries to classify goods at the 6-digit level.'
  )

  subHeading(doc, 'How HS Codes Work')

  bulletList(doc, [
    'First 2 digits — Chapter: broad category (e.g. 09 = Coffee, tea, mate)',
    'Next 2 digits — Heading: more specific (e.g. 0901 = Coffee)',
    'Next 2 digits — Subheading: precise product (e.g. 0901.11 = not roasted, not decaf)',
    'Beyond 6 digits — national extensions vary by country',
  ])

  paragraph(doc,
    'On FTH, every commodity has its HS code displayed. This ensures clarity in contracts, customs documentation, and compliance checks. When structuring a deal, the HS code determines applicable duties, taxes, and any restrictions or licensing requirements.'
  )

  const hsCols: TableColumn[] = [
    { key: 'commodity', label: 'Commodity', width: 0.25 },
    { key: 'hs', label: 'HS Code', width: 0.20 },
    { key: 'meaning', label: 'Classification', width: 0.55 },
  ]

  const hsRows: TableRow[] = [
    { commodity: 'Coffee', hs: '0901.11', meaning: 'Coffee, not roasted, not decaffeinated' },
    { commodity: 'Cocoa', hs: '1801.00', meaning: 'Cocoa beans, whole or broken, raw or roasted' },
    { commodity: 'Gold', hs: '7108.13', meaning: 'Gold in semi-manufactured forms' },
    { commodity: 'Copper', hs: '7403.11', meaning: 'Refined copper cathodes' },
    { commodity: 'Sugar', hs: '1701.14', meaning: 'Raw cane sugar, in solid form' },
    { commodity: 'Crude Oil', hs: '2709.00', meaning: 'Petroleum oils, crude' },
  ]

  dataTable(doc, hsCols, hsRows)

  // ── 3. Incoterms Explained ─────────────────────────
  doc.addPage()
  sectionHeading(doc, 3, 'Incoterms Explained', { topPad: 10 })

  paragraph(doc,
    'Incoterms (International Commercial Terms) are published by the International Chamber of Commerce (ICC). They define the responsibilities of buyers and sellers for the delivery of goods in international trade. The current version is Incoterms® 2020.'
  )

  paragraph(doc,
    'Each incoterm specifies: who arranges transport, who pays for insurance, where risk transfers from seller to buyer, and who handles customs clearance.'
  )

  subHeading(doc, 'Common Incoterms on FTH')

  const incoCols: TableColumn[] = [
    { key: 'term', label: 'Term', width: 0.10 },
    { key: 'name', label: 'Full Name', width: 0.25 },
    { key: 'risk', label: 'Risk Transfers', width: 0.25 },
    { key: 'use', label: 'Typical Use', width: 0.40 },
  ]

  const incoRows: TableRow[] = [
    { term: 'EXW', name: 'Ex-Works', risk: 'At seller\'s premises', use: 'Buyer arranges everything. Lowest cost for seller, highest responsibility for buyer.' },
    { term: 'FOB', name: 'Free On Board', risk: 'When loaded on vessel', use: 'Most common for bulk commodities. Seller loads at origin port, buyer takes risk once on board.' },
    { term: 'CIF', name: 'Cost, Insurance & Freight', risk: 'At destination port', use: 'Seller arranges transport + insurance. Buyer receives at destination. Very common in coffee, cocoa, sugar.' },
    { term: 'CFR', name: 'Cost & Freight', risk: 'When loaded on vessel', use: 'Like CIF but without insurance. Risk transfers at loading, not destination.' },
    { term: 'DAP', name: 'Delivered At Place', risk: 'At named destination', use: 'Seller delivers to agreed location. Often used for metals to warehouse.' },
    { term: 'DDP', name: 'Delivered Duty Paid', risk: 'At buyer\'s premises', use: 'Seller handles everything including import duties. Highest cost for seller.' },
    { term: 'DES', name: 'Delivered Ex-Ship', risk: 'At destination port', use: 'Used in crude oil. Seller delivers on vessel at named port of destination.' },
  ]

  dataTable(doc, incoCols, incoRows)

  calloutBox(doc,
    'Tip: For your first deal, FOB or CIF are the safest choices. FOB gives you control over shipping; CIF means the seller handles transport and insurance to your port.'
  )

  // ── 4. Commodity Profiles ──────────────────────────
  doc.addPage()
  sectionHeading(doc, 4, 'Commodity Profiles', { topPad: 10 })

  paragraph(doc,
    'Each commodity traded on FTH has unique characteristics, grading standards, origin considerations, and compliance requirements. The following profiles provide a comprehensive overview of each.'
  )

  COMMODITIES.forEach((comm, idx) => {
    if (idx > 0) {
      ensureSpace(doc, 200)
    }

    subHeading(doc, `${comm.name}`)

    keyValueBlock(doc, [
      { label: 'HS Code(s)', value: comm.hsCodes },
      { label: 'Key Origins', value: comm.origins.join(', ') },
    ])

    paragraph(doc, comm.description)

    boldParagraph(doc, 'Grades Available')
    bulletList(doc, comm.grades)

    boldParagraph(doc, 'Common Incoterms')
    bulletList(doc, comm.incoterms)

    calloutBox(doc, comm.notes)

    if (idx < COMMODITIES.length - 1) {
      horizontalRule(doc)
    }
  })

  // ── 5. Trade Finance ───────────────────────────────
  doc.addPage()
  sectionHeading(doc, 5, 'Trade Finance & Payment', { topPad: 10 })

  paragraph(doc,
    'Commodity deals often involve trade finance instruments to manage credit risk between buyer and seller. FTH supports the following instruments:'
  )

  subHeading(doc, 'Documentary Letter of Credit (LC)')
  paragraph(doc,
    'An LC is a commitment by a bank to pay the seller once specified documents (bill of lading, certificate of origin, inspection certificate) are presented. It is the most common payment method in international commodity trade.'
  )
  bulletList(doc, [
    'Irrevocable — cannot be cancelled without all parties\' consent',
    'Confirmed — a second bank guarantees payment (reduces country risk)',
    'At Sight — payable immediately upon document presentation',
    'Usance — payable after a deferred period (30, 60, 90 days)',
  ])

  subHeading(doc, 'Standby Letter of Credit (SBLC)')
  paragraph(doc,
    'An SBLC is a guarantee rather than a payment method. It only pays out if the buyer defaults. It provides confidence to the seller without tying up cash.'
  )

  subHeading(doc, 'Bank Guarantee (BG)')
  paragraph(doc,
    'A BG is a promise by a bank to cover a loss if the buyer fails to perform. Used for performance bonds, advance payment guarantees, and bid bonds.'
  )

  subHeading(doc, 'Settlement Rails')
  paragraph(doc,
    'Once a deal completes, settlement — the actual transfer of funds — occurs through one of three rails:'
  )

  bulletList(doc, [
    'FIAT — Traditional bank transfer (SWIFT, ACH, SEPA). Standard for most deals.',
    'XRPL — Ripple Ledger. Fast cross-border settlement with proof anchoring.',
    'Stellar — Stellar network. Optimised for emerging market corridors.',
  ])

  calloutBox(doc,
    'All settlements are proof-anchored. This means a cryptographic hash of the transaction is recorded on-chain, providing tamper-proof evidence of payment.'
  )

  // ── 6. Compliance & Due Diligence ──────────────────
  sectionHeading(doc, 6, 'Compliance & Due Diligence')

  paragraph(doc,
    'Every commodity deal on FTH goes through automated compliance checks before execution. This section explains what these checks involve and why they matter.'
  )

  subHeading(doc, 'Sanctions Screening')
  paragraph(doc,
    'All counterparties and jurisdictions are screened against OFAC (US), EU Consolidated List, and UN Security Council sanctions lists. Deals involving sanctioned entities or countries are automatically blocked.'
  )

  subHeading(doc, 'Origin & End-Use')
  paragraph(doc,
    'For restricted commodities (precious metals, crude oil), the platform verifies the origin of goods and may require end-use declarations. This ensures compliance with export control regulations and conflict mineral rules.'
  )

  subHeading(doc, 'KYC / AML')
  paragraph(doc,
    'Know Your Customer (KYC) and Anti-Money Laundering (AML) checks are performed on all trading counterparties. Documentation includes identity verification, proof of address, source of funds, and beneficial ownership.'
  )

  // ── 7. Getting Started ─────────────────────────────
  doc.addPage()
  sectionHeading(doc, 7, 'Getting Started on FTH', { topPad: 10 })

  paragraph(doc,
    'Ready to trade? Here\'s the typical path:'
  )

  flowDiagram(doc, [
    '1. Register — Create your account at fthtrading.com',
    '2. KYC — Submit identity and corporate documents',
    '3. Request Terms — Specify commodity, volume, and terms',
    '4. Review — FTH team structures the deal',
    '5. Contract — Sign the purchase/sale agreement',
    '6. Execute — Shipment, documentation, settlement',
  ])

  keyValueBlock(doc, [
    { label: 'Website', value: docMeta.website },
    { label: 'Contact', value: docMeta.contactEmail },
    { label: 'Request Terms', value: 'fthtrading.com/request-terms' },
  ])

  // ── Back page ──────────────────────────────────────
  doc.addPage()
  doc.rect(0, 0, sizes.pageWidth, sizes.pageHeight).fill(colors.darkBg)
  doc
    .font(fonts.bold)
    .fontSize(20)
    .fillColor(colors.gold)
    .text('COMMODITIES TRADING GUIDE', 0, sizes.pageHeight / 2 - 40, {
      width: sizes.pageWidth,
      align: 'center',
      characterSpacing: 4,
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

  addPageHeaders(doc, 'Commodities Guide')
  return renderToBuffer(doc)
}
