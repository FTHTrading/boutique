/**
 * FTH Prop Architecture Overview — Executive Brochure
 * 10-page institutional summary for partners, leadership, and allocators.
 */
import {
  createDoc, drawCoverPage, sectionHeading, subHeading,
  paragraph, boldParagraph, bulletList, keyValueBlock,
  calloutBox, flowDiagram, dataTable, horizontalRule,
  addPageHeaders, renderToBuffer, ensureSpace,
} from './components'
import { colors, fonts, sizes, layout, docMeta } from './theme'

export async function generateArchitectureOverview(): Promise<Buffer> {
  const doc = createDoc(
    'FTH Prop Architecture Overview',
    'Executive summary of the FTH Prop Sharing programme architecture'
  )

  // ── Cover ───────────────────────────────────────────
  drawCoverPage(doc, {
    title: 'Prop Sharing\nArchitecture Overview',
    subtitle: 'Institutional Programme Design & Risk Infrastructure',
    classification: 'Confidential — Partner Distribution',
    version: docMeta.policyVersion,
  })

  // ── Page 2: Executive Summary ───────────────────────
  doc.addPage()

  sectionHeading(doc, 1, 'Executive Summary', { topPad: 10 })

  paragraph(doc,
    'FTH Trading operates a Model A proprietary trading programme in which the firm provides simulated evaluation environments, contractual funding arrangements, and profit-sharing agreements to qualified traders. The programme is designed as a retained-earnings subsystem within FTH\'s broader capital structure — not a standalone product, but an integrated component of the firm\'s capital organism.'
  )

  paragraph(doc,
    'This document describes the technical architecture, risk controls, governance mechanisms, and capital flow logic that underpin the programme. Every component described herein is implemented in production software with deterministic enforcement, audit logging, and policy-gated state transitions.'
  )

  calloutBox(doc,
    'Design Principle: "Don\'t blow up, compound quietly." Every architectural decision optimises for capital preservation over growth acceleration.'
  )

  paragraph(doc,
    'The architecture is organised into five progressive layers, each building upon the governance guarantees of the layer below:'
  )

  dataTable(doc,
    [
      { key: 'layer', label: 'Layer', width: 0.12, align: 'center' },
      { key: 'name', label: 'Name', width: 0.28 },
      { key: 'purpose', label: 'Purpose', width: 0.6 },
    ],
    [
      { layer: 'V1', name: 'Core Platform', purpose: 'Accounts, evaluations, funded programmes, profit-share payouts' },
      { layer: 'V2', name: 'Treasury & Compliance', purpose: 'Capital accounting, reserve buffers, KYC/AML, audit trails' },
      { layer: 'V3', name: 'Firm Risk & Scaling', purpose: 'Firm-wide exposure limits, fraud detection, dynamic scaling engine' },
      { layer: 'V4', name: 'Reflex Arcs', purpose: 'Execution quality, behavioural scoring, treasury guard, funnel quality' },
      { layer: 'V5', name: 'Simulation & Compounding', purpose: 'Stress testing, enforcement verification, capital compounding' },
    ]
  )

  // ── Page 3: Model A Structure ───────────────────────
  sectionHeading(doc, 2, 'Model A Structure')

  paragraph(doc,
    'FTH operates exclusively under a "Model A" structure as defined by industry classification. This means:'
  )

  bulletList(doc, [
    'Evaluations occur in fully simulated environments — no live capital is at risk during assessment phases.',
    'Funding is contractual — traders operate under a services agreement, not as employees or capital allocators.',
    'The firm retains all capital at risk — traders receive a contractual share of net profits, not direct market access.',
    'Revenue is service-based — evaluation fees constitute service revenue, not investment returns.',
  ])

  subHeading(doc, 'Trader Lifecycle')
  paragraph(doc,
    'Each trader progresses through a deterministic lifecycle with policy-enforced state transitions:'
  )

  flowDiagram(doc, [
    'Application & KYC Verification',
    'Evaluation Phase (Simulated)',
    'Verification Phase (Consistency Check)',
    'Funded Account (Contractual)',
    'Profit Sharing (Net P&L Split)',
  ])

  paragraph(doc,
    'State transitions are gated by rule-based evaluation. No manual override can bypass drawdown limits, daily loss limits, or minimum trading day requirements. Every transition is recorded in an immutable audit log with the triggering rule, timestamp, and pre/post state snapshot.'
  )

  // ── Page 4: Risk Architecture ───────────────────────
  doc.addPage()
  sectionHeading(doc, 3, 'Risk Architecture Overview', { topPad: 10 })

  paragraph(doc,
    'Risk management is implemented as a multi-layer defence system. Each layer operates independently so that a failure in one layer does not compromise the others. The system is designed to fail closed — any ambiguity results in restriction, not permission.'
  )

  subHeading(doc, 'Layer 1: Account-Level Risk')
  bulletList(doc, [
    'Maximum drawdown limits (absolute and trailing) enforced per account.',
    'Daily loss limits with automatic position freeze on breach.',
    'Minimum trading day requirements before payout eligibility.',
    'Consistency scoring to detect strategy manipulation across evaluation phases.',
  ])

  subHeading(doc, 'Layer 2: Firm-Level Risk')
  bulletList(doc, [
    'Aggregate exposure limits across all funded accounts.',
    'Concentration limits by instrument, sector, and directional bias.',
    'Correlation monitoring across the funded trader population.',
    'Automatic scaling throttle when firm-wide exposure exceeds policy thresholds.',
  ])

  subHeading(doc, 'Layer 3: Execution Quality')
  bulletList(doc, [
    'Spread widening detection with automatic trade rejection above thresholds.',
    'Slippage monitoring against historical tick data distributions.',
    'Latency anomaly detection and circuit-breaker integration.',
    'News-event blackout enforcement during high-volatility windows.',
  ])

  subHeading(doc, 'Layer 4: Behavioural Risk')
  bulletList(doc, [
    'Composite stability scoring across multiple behavioural dimensions.',
    'Automated interventions (warnings, throttles, freezes) based on score thresholds.',
    'Pattern detection for gaming behaviours (martingale, end-of-day cramming, correlated accounts).',
    'Score decay and recovery mechanics to reward sustained good behaviour.',
  ])

  // ── Page 5: Execution Simulation ────────────────────
  sectionHeading(doc, 4, 'Execution Simulation Engine')

  paragraph(doc,
    'The execution layer ensures that simulated trading environments accurately reflect real-market conditions. This prevents traders from developing strategies that succeed only in idealised environments.'
  )

  keyValueBlock(doc, [
    { label: 'Spread Model', value: 'Dynamic widening based on time-of-day, liquidity depth, and news proximity.' },
    { label: 'Slippage Model', value: 'Probabilistic fill simulation calibrated against historical tick data.' },
    { label: 'Latency Simulation', value: 'Configurable latency injection to model real infrastructure conditions.' },
    { label: 'Fill Probability', value: 'Order size vs. available depth modelling for limit order fills.' },
    { label: 'Kill Switches', value: 'Firm, trader, and instrument-level circuit breakers with manual and automated triggers.' },
  ])

  calloutBox(doc,
    'All execution parameters are audited. No configuration change takes effect without a logged entry that captures the old value, new value, changing principal, and justification.'
  )

  // ── Page 6: Behavioural Scoring ─────────────────────
  doc.addPage()
  sectionHeading(doc, 5, 'Behavioural Risk & Stability Scoring', { topPad: 10 })

  paragraph(doc,
    'The behavioural layer assigns each trader a composite stability score derived from multiple observable dimensions. This score governs intervention thresholds and scaling eligibility.'
  )

  dataTable(doc,
    [
      { key: 'dimension', label: 'Dimension', width: 0.25 },
      { key: 'weight', label: 'Weight', width: 0.1, align: 'center' },
      { key: 'description', label: 'What It Measures', width: 0.65 },
    ],
    [
      { dimension: 'Consistency', weight: '25%', description: 'Variance in daily P&L relative to historical mean' },
      { dimension: 'Risk Discipline', weight: '25%', description: 'Adherence to position sizing and stop-loss rules' },
      { dimension: 'Drawdown Recovery', weight: '20%', description: 'Speed and discipline of recovery after loss events' },
      { dimension: 'Session Discipline', weight: '15%', description: 'Adherence to planned trading hours and break patterns' },
      { dimension: 'Scaling Readiness', weight: '15%', description: 'Track record stability at current and proposed allocation levels' },
    ]
  )

  paragraph(doc,
    'Intervention levels are deterministic and policy-bound:'
  )

  dataTable(doc,
    [
      { key: 'score', label: 'Score Range', width: 0.2, align: 'center' },
      { key: 'status', label: 'Status', width: 0.2 },
      { key: 'action', label: 'Automated Action', width: 0.6 },
    ],
    [
      { score: '80–100', status: 'Healthy', action: 'No intervention. Eligible for scaling consideration.' },
      { score: '60–79', status: 'Watch', action: 'Notification issued. Increased monitoring frequency.' },
      { score: '40–59', status: 'Warning', action: 'Trading volume throttled. Mandatory review scheduled.' },
      { score: '20–39', status: 'Restricted', action: 'Position sizing reduced. Scaling suspended.' },
      { score: '0–19', status: 'Frozen', action: 'All new positions blocked. Manual review required.' },
    ]
  )

  // ── Page 7: Treasury Guard ──────────────────────────
  sectionHeading(doc, 6, 'Treasury Guard & Reserve Policy')

  paragraph(doc,
    'The Treasury Guard manages the firm\'s capital reserves with three operating states. State transitions are automated based on configurable buffer health thresholds.'
  )

  dataTable(doc,
    [
      { key: 'state', label: 'State', width: 0.2 },
      { key: 'trigger', label: 'Trigger Condition', width: 0.4 },
      { key: 'effect', label: 'Enforcement Effect', width: 0.4 },
    ],
    [
      { state: 'Active', trigger: 'Buffer health ≥ 60%', effect: 'Normal operations. All programmes open.' },
      { state: 'Throttled', trigger: 'Buffer health 30–59%', effect: 'New account creation suspended. Payouts delayed.' },
      { state: 'Frozen', trigger: 'Buffer health < 30%', effect: 'All funding halted. Emergency reserve protocol.' },
    ]
  )

  paragraph(doc,
    'Buffer health is calculated as the ratio of current unallocated reserves to the policy-defined minimum buffer. The minimum buffer is itself a function of total funded capital, expected loss rates, and a safety margin.'
  )

  // ── Page 8: Stress Simulation (V5-D) ────────────────
  doc.addPage()
  sectionHeading(doc, 7, 'Stress Simulation Framework', { topPad: 10 })

  paragraph(doc,
    'Before any capital is compounded or reallocated, the system runs a five-scenario stress simulation suite that probes every enforcement layer. The goal is verification, not discovery — proving that controls that should fire, do fire.'
  )

  dataTable(doc,
    [
      { key: 'scenario', label: 'Scenario', width: 0.28 },
      { key: 'probes', label: 'What It Probes', width: 0.72 },
    ],
    [
      { scenario: 'Full Lifecycle', probes: 'Account creation, evaluation, funding, trade execution, payout — end-to-end trace integrity.' },
      { scenario: 'Treasury Throttle', probes: 'Reserve buffer policy enforcement, state transition from active → throttled → frozen.' },
      { scenario: 'Behaviour Seams', probes: 'Score → intervention joins, composite score consistency, threshold boundary behaviour.' },
      { scenario: 'Funnel Suppression', probes: 'Channel quality → suppression logic, CLV/CAC cliff detection, cohort survival rates.' },
      { scenario: 'Execution Blackout', probes: 'Kill switch scope enforcement, news blackout timing, spread ceiling activation.' },
    ]
  )

  subHeading(doc, 'Compounding Readiness Score')
  paragraph(doc,
    'Each simulation run produces four component scores that are aggregated into a single Compounding Readiness Score (CRS). The CRS must meet a minimum threshold before the Capital Compounding Engine may execute any policy.'
  )

  keyValueBlock(doc, [
    { label: 'Enforcement Score', value: 'Gates respond correctly under adversarial conditions.' },
    { label: 'Trace Integrity Score', value: 'All state transitions have complete, consistent audit trails.' },
    { label: 'Behaviour Seam Score', value: 'No gaps between behavioural scoring and intervention enforcement.' },
    { label: 'Funnel Cliff Score', value: 'Acquisition economics remain sound under stress assumptions.' },
  ])

  calloutBox(doc,
    'The Compounding Readiness Score is the bridge between stress testing (V5-D) and capital compounding (V5-B). No compounding policy may execute unless the CRS meets its minimum threshold.'
  )

  // ── Page 9: Capital Compounding (V5-B) ──────────────
  sectionHeading(doc, 8, 'Capital Compounding Engine')

  paragraph(doc,
    'The Capital Compounding Engine manages autonomous reinvestment of retained earnings. It is policy-driven, simulation-verified, and gate-protected. Every action is recorded with a full proof layer including the input state, policy that triggered it, and gate results at execution time.'
  )

  subHeading(doc, 'Default Compounding Policies')
  dataTable(doc,
    [
      { key: 'policy', label: 'Policy', width: 0.28 },
      { key: 'allocation', label: 'Allocation', width: 0.18 },
      { key: 'conditions', label: 'Activation Conditions', width: 0.54 },
    ],
    [
      { policy: 'Capacity Growth', allocation: '10% retained', conditions: 'Buffer ≥ 70%, readiness ≥ 0.8, retained ≥ $10,000' },
      { policy: 'Organic Marketing', allocation: '5% retained', conditions: 'Buffer ≥ 60%, readiness ≥ 0.7, retained ≥ $5,000' },
      { policy: 'Vertical Allocation', allocation: '8% retained', conditions: 'Buffer ≥ 75%, readiness ≥ 0.85, retained ≥ $25,000' },
      { policy: 'Quarterly Dividend', allocation: '3% retained', conditions: 'Buffer ≥ 80%, readiness ≥ 0.9, 90+ buffer days' },
      { policy: 'Emergency Lock', allocation: 'All frozen', conditions: 'Buffer < 30% — halts all compounding immediately' },
    ]
  )

  // ── Page 10: Governance & Audit ─────────────────────
  doc.addPage()
  sectionHeading(doc, 9, 'Governance & Audit Controls', { topPad: 10 })

  paragraph(doc,
    'Every state change in the prop-sharing system is recorded in an immutable audit log. The logging architecture captures the action type, input data, output data, acting principal, and timestamp. Logs cannot be modified or deleted through the application layer.'
  )

  subHeading(doc, 'Governance Principles')
  bulletList(doc, [
    'Fail closed: Any ambiguity in gate evaluation results in denial, never permission.',
    'No manual override: Drawdown limits, kill switches, and treasury freezes cannot be bypassed.',
    'Deterministic enforcement: Every rule is evaluated programmatically — no discretionary exceptions.',
    'Full audit trail: Every trade, payout, scaling decision, and policy execution is logged with context.',
    'Policy versioning: Every compounding policy, reserve buffer rule, and intervention threshold is versioned.',
  ])

  subHeading(doc, 'Kill Switch Architecture')
  paragraph(doc,
    'Three-scope kill switch system provides emergency controls at firm, trader, and instrument levels. Kill switches can be triggered automatically by enforcement gates or manually by authorised principals. Activation immediately blocks the affected scope from new position entry.'
  )

  horizontalRule(doc)

  // ── Retained Earnings Flywheel ──────────────────────
  sectionHeading(doc, 10, 'Retained Earnings Flywheel')

  paragraph(doc,
    'The following diagram illustrates the complete capital flow through the FTH Prop Sharing organism. Each node represents a policy-gated transition — capital cannot flow to the next stage without satisfying the governance requirements of the current stage.'
  )

  flowDiagram(doc, [
    'Evaluation Fees → Service Revenue',
    'Operating Costs Deducted',
    'Retained Earnings Pool',
    'Reserve Buffer (Policy-Gated)',
    'Funded Trader Capital',
    'Net P&L Reported',
    'Compounding Engine (Simulation-Verified)',
    'Vertical Allocations / Dividends',
  ])

  calloutBox(doc,
    'This flywheel is deterministic. No capital moves without policy authorisation, and no policy executes without a passing Compounding Readiness Score from the most recent stress simulation suite.'
  )

  // ── Back matter ─────────────────────────────────────
  doc.addPage()
  ensureSpace(doc, 200)

  doc
    .rect(0, 0, sizes.pageWidth, sizes.pageHeight)
    .fill(colors.darkBg)

  const cx = sizes.pageWidth / 2
  doc
    .font(fonts.bold)
    .fontSize(14)
    .fillColor(colors.gold)
    .text(docMeta.companyName.toUpperCase(), 0, sizes.pageHeight / 2 - 60, {
      width: sizes.pageWidth,
      align: 'center',
      characterSpacing: 5,
    })

  doc
    .font(fonts.oblique)
    .fontSize(sizes.body)
    .fillColor(colors.gray400)
    .text(docMeta.companyTagline, 0, doc.y + 10, {
      width: sizes.pageWidth,
      align: 'center',
    })

  doc.rect(cx - 60, doc.y + 20, 120, 1).fill(colors.gold)

  const contactY = doc.y + 40
  doc
    .font(fonts.body)
    .fontSize(sizes.bodySmall)
    .fillColor(colors.gray400)
    .text(docMeta.website, 0, contactY, { width: sizes.pageWidth, align: 'center' })
    .text(docMeta.contactEmail, 0, contactY + 16, { width: sizes.pageWidth, align: 'center' })

  doc
    .font(fonts.body)
    .fontSize(sizes.footnote)
    .fillColor(colors.gray600)
    .text(
      `Policy Version ${docMeta.policyVersion} · Engine v${docMeta.engineVersion} · Generated ${new Date().toISOString().split('T')[0]}`,
      0,
      sizes.pageHeight - 60,
      { width: sizes.pageWidth, align: 'center' }
    )

  // ── Headers/Footers ─────────────────────────────────
  addPageHeaders(doc, 'Architecture Overview')

  return renderToBuffer(doc)
}
