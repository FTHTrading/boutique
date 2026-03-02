/**
 * FTH Terms & Definitions PDF
 * Comprehensive glossary covering all terminology used across the
 * FTH Trading platform — commodity trading, prop sharing, risk,
 * compliance, settlement, and technology terms.
 */
import {
  createDoc, drawCoverPage, sectionHeading, subHeading,
  paragraph, boldParagraph, bulletList, keyValueBlock,
  calloutBox, horizontalRule, addPageHeaders, renderToBuffer,
  ensureSpace,
} from './components'
import { colors, fonts, sizes, layout, docMeta } from './theme'

/* ────────────────── Term Data ───────────────────── */

interface Term {
  term: string
  definition: string
}

const SECTIONS: { title: string; terms: Term[] }[] = [
  {
    title: 'Commodity Trading Terms',
    terms: [
      { term: 'Commodity', definition: 'A raw material or primary agricultural product that can be bought, sold, and traded. Examples: coffee, cocoa, gold, copper, crude oil.' },
      { term: 'Physical Trading', definition: 'Trading that involves the actual delivery of a physical good, as opposed to derivatives or paper contracts settled in cash.' },
      { term: 'Spot Price', definition: 'The current market price for immediate delivery of a commodity. Contrast with futures price (delivery at a future date).' },
      { term: 'Futures Contract', definition: 'A standardised agreement to buy or sell a commodity at a predetermined price on a specific future date. Traded on exchanges like ICE and NYMEX.' },
      { term: 'OTC (Over-the-Counter)', definition: 'Trades negotiated directly between two parties rather than on a public exchange. Most physical commodity deals are OTC.' },
      { term: 'HS Code (Harmonized System)', definition: 'An international standard for classifying traded products. A 6-digit code maintained by the World Customs Organization (WCO). Used globally for customs, duties, and trade statistics.' },
      { term: 'Bill of Lading (B/L)', definition: 'A legal document issued by a carrier to a shipper that details the type, quantity, and destination of goods being carried. Acts as a receipt, evidence of contract, and document of title.' },
      { term: 'Certificate of Origin (COO)', definition: 'A document certifying the country in which a commodity was produced. Required for customs clearance and may determine applicable tariff rates.' },
      { term: 'Phytosanitary Certificate', definition: 'An official document certifying that plant products (e.g. coffee, cocoa, sugar) meet health and safety standards for import. Issued by the exporting country\'s plant protection authority.' },
      { term: 'Grade', definition: 'A quality classification for a commodity. Each commodity has its own grading system (e.g. SCA score for coffee, API gravity for crude oil, fineness for gold).' },
      { term: 'Lot / Contract Size', definition: 'The standard unit of trading. For example, 1 lot of coffee on ICE is 37,500 lbs; 1 LME copper lot is 25 metric tonnes.' },
      { term: 'Basis', definition: 'The difference between the spot price and the futures price of a commodity. Also used to describe price differentials between locations or grades.' },
      { term: 'Premium / Differential', definition: 'The price adjustment above or below a benchmark for a specific origin, grade, or delivery location.' },
    ],
  },
  {
    title: 'Incoterms & Logistics',
    terms: [
      { term: 'Incoterms', definition: 'International Commercial Terms published by the International Chamber of Commerce (ICC). They define buyer/seller responsibilities for transport, insurance, risk transfer, and customs. Current version: Incoterms® 2020.' },
      { term: 'EXW (Ex-Works)', definition: 'Seller makes goods available at their premises. Buyer arranges and pays for all transport, insurance, and customs. Lowest obligation for seller.' },
      { term: 'FOB (Free On Board)', definition: 'Seller delivers goods loaded on the vessel at the named port of shipment. Risk transfers to buyer once goods are on board. Most common for bulk commodities.' },
      { term: 'CIF (Cost, Insurance & Freight)', definition: 'Seller pays for transport and insurance to the named port of destination. Risk transfers when goods are loaded at origin, but seller covers cost to destination.' },
      { term: 'CFR (Cost & Freight)', definition: 'Like CIF but without insurance. Seller arranges transport to destination; risk transfers at origin port loading.' },
      { term: 'DAP (Delivered At Place)', definition: 'Seller delivers goods to a named destination, ready for unloading. Often used for delivery to inland warehouses.' },
      { term: 'DDP (Delivered Duty Paid)', definition: 'Seller delivers goods cleared for import at the named destination. Seller bears all costs including import duties. Highest obligation for seller.' },
      { term: 'DES (Delivered Ex-Ship)', definition: 'Seller delivers goods on the vessel at the named port of destination. Common in crude oil trades.' },
      { term: 'Demurrage', definition: 'A charge payable when a vessel is detained at a port beyond the allowed time (laytime) for loading or unloading.' },
      { term: 'Laytime', definition: 'The agreed period of time for loading or unloading a vessel, after which demurrage charges begin.' },
    ],
  },
  {
    title: 'Trade Finance Terms',
    terms: [
      { term: 'Letter of Credit (LC)', definition: 'A bank-issued guarantee of payment to the seller, contingent on the presentation of specified documents (bill of lading, inspection certificate, etc.). The primary payment instrument in international trade.' },
      { term: 'Standby Letter of Credit (SBLC)', definition: 'A bank guarantee that only pays out if the buyer defaults on their obligations. Acts as a safety net rather than a primary payment method.' },
      { term: 'Bank Guarantee (BG)', definition: 'A commitment by a bank to cover a financial obligation if the applicant fails to perform. Types include performance bonds, advance payment guarantees, and tender bonds.' },
      { term: 'At Sight', definition: 'A payment term meaning the seller is paid immediately upon presentation of correct documents. Contrast with usance (deferred payment).' },
      { term: 'Usance', definition: 'A deferred payment period (e.g. 30, 60, 90 days after document presentation). Gives the buyer time to receive and sell goods before paying.' },
      { term: 'Confirmed LC', definition: 'A letter of credit where a second bank (usually in the seller\'s country) adds its guarantee. Reduces country and bank risk for the seller.' },
      { term: 'Discounting', definition: 'Selling a future receivable (e.g. a usance LC that pays in 90 days) to a bank at a discount for immediate cash.' },
      { term: 'Documentary Collection', definition: 'A payment method where the seller\'s bank sends shipping documents to the buyer\'s bank, releasing them only upon payment (D/P) or acceptance of a draft (D/A).' },
    ],
  },
  {
    title: 'Prop Sharing Terms',
    terms: [
      { term: 'Prop Sharing', definition: 'FTH\'s structured programme that funds qualified traders with firm capital and shares the resulting profits. Traders do not risk their own capital.' },
      { term: 'Evaluation / Challenge', definition: 'A simulated trading period where prospective traders demonstrate consistent profitability, risk discipline, and strategy edge. Must hit profit targets without breaching drawdown limits.' },
      { term: 'Funded Account', definition: 'A live trading account funded with real firm capital, granted after successful evaluation. Account sizes range from $25K to $500K.' },
      { term: 'Profit Split', definition: 'The percentage division of net profits between the trader and the firm. Up to 90/10 (trader/firm) on FTH, based on performance tier.' },
      { term: 'Drawdown Limit', definition: 'The maximum permitted loss from peak equity. Breaching the drawdown limit results in account review, throttling, or closure.' },
      { term: 'Daily Loss Limit', definition: 'The maximum loss allowed in a single trading day. An automatic circuit breaker that prevents catastrophic single-day losses.' },
      { term: 'Scaling', definition: 'The automatic increase of a funded account\'s capital allocation based on sustained profitability and risk discipline.' },
      { term: 'Payout', definition: 'The periodic distribution of the trader\'s profit share. FTH pays bi-weekly or monthly, with a minimum payout threshold.' },
      { term: 'Consistency Score', definition: 'A metric measuring how evenly distributed a trader\'s profits are across sessions. High consistency (no single outsized win) is required.' },
      { term: 'Kill Switch', definition: 'An automated mechanism that halts trading at the firm, instrument, or individual trader level when risk thresholds are breached.' },
    ],
  },
  {
    title: 'Risk & Compliance Terms',
    terms: [
      { term: 'KYC (Know Your Customer)', definition: 'The process of verifying a customer\'s identity, including personal information, corporate structure, and beneficial ownership. Required for all traders and counterparties.' },
      { term: 'AML (Anti-Money Laundering)', definition: 'Procedures and controls to prevent the use of the financial system for money laundering. Includes transaction monitoring, suspicious activity reporting, and due diligence.' },
      { term: 'Sanctions Screening', definition: 'Checking all parties against official sanctions lists (OFAC, EU, UN) to ensure the platform does not facilitate transactions involving sanctioned entities or countries.' },
      { term: 'Enhanced Due Diligence (EDD)', definition: 'Additional verification steps applied to higher-risk transactions, counterparties, or commodities (e.g. precious metals, crude oil, politically exposed persons).' },
      { term: 'PEP (Politically Exposed Person)', definition: 'An individual who holds or has held a prominent public function. PEPs require enhanced due diligence due to higher corruption risk.' },
      { term: 'Conflict Minerals', definition: 'Minerals (tin, tantalum, tungsten, gold — "3TG") sourced from conflict-affected areas. Subject to EU and US reporting requirements.' },
      { term: 'Audit Trail', definition: 'A complete, immutable record of all actions, decisions, and transactions on the platform. Used for compliance, dispute resolution, and regulatory reporting.' },
      { term: 'Drawdown', definition: 'The decline from peak equity to a subsequent trough. Used to measure risk and trigger protection mechanisms.' },
      { term: 'Martingale', definition: 'A position-sizing strategy where size increases after losses. Detected by FTH\'s behavioural monitors as a high-risk pattern.' },
      { term: 'Revenge Trading', definition: 'Emotionally-driven trading immediately after a loss, typically with increased size and reduced discipline. Flagged by behavioural AI.' },
      { term: 'Slippage', definition: 'The difference between the expected price of a trade and the actual execution price. Can occur during high volatility or low liquidity.' },
      { term: 'Spread Widening', definition: 'An increase in the bid-ask spread, typically during volatile or illiquid market conditions. FTH simulates this in evaluations.' },
    ],
  },
  {
    title: 'Treasury & Capital Terms',
    terms: [
      { term: 'Treasury Capital', definition: 'The total pool of firm capital available for deployment across funded accounts, operations, and reserves.' },
      { term: 'Prop Reserve Buffer', definition: 'A percentage of treasury capital held in reserve and not deployed to funded accounts. Ensures the firm can absorb unexpected losses.' },
      { term: 'Health Gauge', definition: 'A real-time measure of treasury health. States: Normal (full capacity), Caution (reduced deployment), Throttled (new funding paused), Frozen (all activity halted).' },
      { term: 'Retained Earnings', definition: 'The portion of trading profits that the firm reinvests into treasury capital rather than distributing. Drives organic capital growth.' },
      { term: 'Compounding', definition: 'The process of reinvesting retained earnings to grow the capital base over time. FTH models aggressive, moderate, and conservative compounding policies.' },
      { term: 'Gate Enforcement', definition: 'Minimum criteria (e.g. capital thresholds, time requirements) that must be met before capital is redeplyed, scaled, or distributed.' },
      { term: 'Stress Test', definition: 'A simulation that models how the system performs under adverse conditions (e.g. 40% drawdown, correlated failures). Used to validate capital adequacy.' },
    ],
  },
  {
    title: 'Settlement & Technology Terms',
    terms: [
      { term: 'Settlement', definition: 'The final exchange of funds and delivery of goods or title, completing a trade. The point at which a transaction is considered done.' },
      { term: 'SWIFT', definition: 'Society for Worldwide Interbank Financial Telecommunication. The primary messaging network for international bank transfers.' },
      { term: 'SEPA', definition: 'Single Euro Payments Area. A payment integration initiative of the European Union for EUR bank transfers.' },
      { term: 'XRPL', definition: 'XRP Ledger — a decentralised blockchain designed for fast, low-cost cross-border payments. Used by FTH as an alternative settlement rail.' },
      { term: 'Stellar', definition: 'A decentralised payment network optimised for cross-border transactions, particularly in emerging markets. Used by FTH for settlement in specific corridors.' },
      { term: 'Proof Anchoring', definition: 'The practice of recording a cryptographic hash of a transaction on a blockchain, providing tamper-proof evidence of execution. Used for audit and dispute resolution.' },
      { term: 'RWA (Real-World Assets)', definition: 'Physical or traditional financial assets (commodities, property, bonds) represented on a blockchain. Enables fractional ownership and on-chain settlement.' },
      { term: 'API (Application Programming Interface)', definition: 'A set of rules and protocols that allows different software systems to communicate. FTH\'s API routes handle PDF generation, data retrieval, and integrations.' },
      { term: 'pgvector', definition: 'A PostgreSQL extension that enables vector similarity search. Used by FTH for AI-powered search, matching, and anomaly detection.' },
      { term: 'AI Agent', definition: 'An autonomous software component that performs specific tasks (compliance screening, risk monitoring, behavioural analysis) without human intervention.' },
    ],
  },
]

/* ─────────────────── Generator ──────────────────── */

export async function generateTermsDefinitions(): Promise<Buffer> {
  const doc = createDoc(
    'FTH Trading — Terms & Definitions',
    'Comprehensive glossary of all terms used across the FTH platform'
  )

  // ── Cover ──────────────────────────────────────────
  drawCoverPage(doc, {
    title: 'Terms &\nDefinitions',
    subtitle: 'Platform-Wide Glossary — Commodities, Prop Sharing, Risk, Settlement & Technology',
    classification: 'General Distribution',
    version: docMeta.policyVersion,
  })

  // ── How to Use ─────────────────────────────────────
  doc.addPage()
  sectionHeading(doc, 0, 'How to Use This Document', { topPad: 10 })

  paragraph(doc,
    'This glossary covers every significant term used across the FTH Trading platform. Terms are organised into seven thematic sections so you can quickly find relevant definitions:'
  )

  bulletList(doc, SECTIONS.map((s, i) => `Section ${i + 1}: ${s.title}`))

  calloutBox(doc,
    'Within each section, terms are listed in logical order — foundational concepts first, then more specific or advanced terms. Use the section headings and page numbers in the header to navigate.'
  )

  horizontalRule(doc)

  // ── Sections ───────────────────────────────────────
  SECTIONS.forEach((section, sIdx) => {
    doc.addPage()
    sectionHeading(doc, sIdx + 1, section.title, { topPad: 10 })

    section.terms.forEach((t, tIdx) => {
      ensureSpace(doc, 60)

      // Term name in bold amber
      doc
        .font(fonts.bold)
        .fontSize(10.5)
        .fillColor(colors.amber)
        .text(t.term, layout.marginLeft, doc.y + (tIdx === 0 ? 2 : 8), {
          width: layout.contentWidth,
        })

      // Definition in body text
      doc
        .font(fonts.body)
        .fontSize(9.5)
        .fillColor(colors.gray700)
        .text(t.definition, layout.marginLeft, doc.y + 2, {
          width: layout.contentWidth,
          lineGap: 2,
        })
    })
  })

  // ── Revision note ──────────────────────────────────
  doc.addPage()
  sectionHeading(doc, SECTIONS.length + 1, 'Revision & Updates', { topPad: 10 })

  paragraph(doc,
    'This glossary is updated with each policy version release. New terms are added as the platform evolves, and existing definitions are refined for clarity.'
  )

  keyValueBlock(doc, [
    { label: 'Current Policy Version', value: docMeta.policyVersion },
    { label: 'Engine Version', value: `v${docMeta.engineVersion}` },
    { label: 'Total Terms Defined', value: String(SECTIONS.reduce((sum, s) => sum + s.terms.length, 0)) },
    { label: 'Sections', value: String(SECTIONS.length) },
  ])

  calloutBox(doc,
    'If you encounter a term on the platform not listed here, contact us at ' + docMeta.contactEmail + ' and we will add it in the next revision.'
  )

  // ── Back page ──────────────────────────────────────
  doc.addPage()
  doc.rect(0, 0, sizes.pageWidth, sizes.pageHeight).fill(colors.darkBg)
  doc
    .font(fonts.bold)
    .fontSize(20)
    .fillColor(colors.gold)
    .text('TERMS & DEFINITIONS', 0, sizes.pageHeight / 2 - 40, {
      width: sizes.pageWidth,
      align: 'center',
      characterSpacing: 5,
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

  addPageHeaders(doc, 'Terms & Definitions')
  return renderToBuffer(doc)
}
