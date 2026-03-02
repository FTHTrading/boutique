/**
 * FTH Prop Risk & Controls Whitepaper
 * Technical deep-dive for legal, compliance, and engineering audiences.
 * 15–20 pages of methodology, formulas, and enforcement logic.
 */
import {
  createDoc, drawCoverPage, sectionHeading, subHeading,
  paragraph, boldParagraph, bulletList, keyValueBlock,
  calloutBox, dataTable, horizontalRule, flowDiagram,
  addPageHeaders, renderToBuffer, ensureSpace,
} from './components'
import { colors, fonts, sizes, layout, docMeta } from './theme'

export async function generateWhitepaper(): Promise<Buffer> {
  const doc = createDoc(
    'FTH Prop Risk & Controls Whitepaper',
    'Technical risk methodology and enforcement architecture'
  )

  // ── Cover ───────────────────────────────────────────
  drawCoverPage(doc, {
    title: 'Risk & Controls\nWhitepaper',
    subtitle: 'Technical Methodology, Enforcement Logic & Audit Architecture',
    classification: 'Confidential — Technical',
    version: docMeta.policyVersion,
  })

  // ── Abstract ────────────────────────────────────────
  doc.addPage()

  doc
    .font(fonts.bold)
    .fontSize(sizes.heading2)
    .fillColor(colors.gray800)
    .text('Abstract', sizes.marginLeft, sizes.marginTop + 10)
  doc.moveDown(0.6)

  paragraph(doc,
    'This whitepaper describes the risk management methodology, enforcement architecture, and audit controls of the FTH Trading Prop Sharing programme. It is intended for technical, legal, and compliance audiences who require detailed understanding of how the system identifies, measures, and mitigates risk across trade execution, behavioural assessment, capital management, and programme governance.'
  )

  paragraph(doc,
    'The document covers: execution quality modelling including slippage and spread simulation; behavioural detection methodology with composite scoring formulas; treasury stress testing and reserve management; enforcement gate architecture with fail-closed design principles; and the audit logging system that provides immutable accountability throughout.'
  )

  horizontalRule(doc)

  // ── 1. Introduction ─────────────────────────────────
  sectionHeading(doc, 1, 'Introduction')

  paragraph(doc,
    'Proprietary trading programmes face a unique set of risks that differ from traditional asset management. The firm bears capital risk while relying on contracted traders whose incentives, skill levels, and behavioural patterns vary widely. Effective risk management must operate at multiple layers simultaneously — from individual trade execution through to aggregate firm-level exposure.'
  )

  paragraph(doc,
    'FTH Trading\'s risk architecture is designed around four principles: deterministic enforcement (no discretionary overrides), fail-closed design (ambiguity results in restriction), full audit trail (every state change is logged), and progressive layering (each control layer operates independently of the others).'
  )

  // ── 2. Execution Modelling ──────────────────────────
  sectionHeading(doc, 2, 'Execution Modelling Methodology')

  paragraph(doc,
    'The execution layer ensures that simulated trading environments present realistic market conditions. This section describes the mathematical models used to simulate spread dynamics, slippage behaviour, and fill probability.'
  )

  subHeading(doc, '2.1 Spread Widening Model')
  paragraph(doc,
    'Spreads in the simulation environment are dynamically adjusted based on three factors: time-of-day liquidity profiles, proximity to scheduled news events, and instrument-specific volatility regimes. The effective spread for any given trade is calculated as:'
  )

  calloutBox(doc,
    'Effective Spread = Base Spread × ToD Multiplier × News Proximity Factor × Volatility Regime Factor'
  )

  keyValueBlock(doc, [
    { label: 'Base Spread', value: 'The median observed spread for the instrument over the trailing 30-day window.' },
    { label: 'ToD Multiplier', value: 'A time-of-day curve derived from historical tick data. Ranges from 1.0 (peak liquidity) to 3.0 (off-hours).' },
    { label: 'News Proximity Factor', value: 'Exponential decay function: max(1.0, 2.5 × e^(-minutes_to_event/15)). Peak at event time.' },
    { label: 'Volatility Regime', value: 'ATR percentile rank over 20 periods. Above 80th → 1.5× multiplier; above 95th → 2.5×.' },
  ])

  paragraph(doc,
    'Trades are rejected outright when the effective spread exceeds the instrument\'s configured ceiling. The ceiling is set per instrument by operations and cannot be overridden at the trader level.'
  )

  subHeading(doc, '2.2 Slippage Model')
  paragraph(doc,
    'Slippage is modelled as a probabilistic function of order size relative to available depth. The model uses a log-normal distribution calibrated against historical fill data:'
  )

  calloutBox(doc,
    'Slippage(bps) = ln(1 + OrderSize / AvailableDepth) × σ_instrument × DirectionalBias'
  )

  keyValueBlock(doc, [
    { label: 'OrderSize / Depth Ratio', value: 'Orders consuming > 50% of visible depth receive proportionally higher slippage.' },
    { label: 'σ_instrument', value: 'Instrument-specific volatility parameter derived from 60-day historical tick data.' },
    { label: 'Directional Bias', value: '1.0 for contrarian fills, 1.2–1.5 for momentum-chasing fills (asymmetric slippage).' },
  ])

  paragraph(doc,
    'The slippage model is recalibrated weekly using the most recent tick data. Calibration results are stored in the execution configuration table with version tracking.'
  )

  // ── 3. Spread Widening Rules ────────────────────────
  doc.addPage()
  sectionHeading(doc, 3, 'Spread Widening Rules & Limits', { topPad: 10 })

  paragraph(doc,
    'Each instrument in the execution configuration defines maximum allowable spread widths. When the effective spread exceeds these ceilings, the system responds according to a tiered enforcement model:'
  )

  dataTable(doc,
    [
      { key: 'tier', label: 'Tier', width: 0.1, align: 'center' },
      { key: 'condition', label: 'Condition', width: 0.35 },
      { key: 'response', label: 'System Response', width: 0.55 },
    ],
    [
      { tier: '1', condition: 'Spread within normal range', response: 'Trade processes normally with standard fill logic.' },
      { tier: '2', condition: 'Spread 1.0–1.5× ceiling', response: 'Warning logged. Trade proceeds with slippage surcharge.' },
      { tier: '3', condition: 'Spread 1.5–2.0× ceiling', response: 'Trade held for manual review. Notification sent to operations.' },
      { tier: '4', condition: 'Spread > 2.0× ceiling', response: 'Trade rejected automatically. Kill switch evaluation triggered.' },
    ]
  )

  paragraph(doc,
    'Spread ceiling values are configurable per instrument and are reviewed monthly. Historical ceiling breach data is retained for trend analysis and model recalibration.'
  )

  // ── 4. Kill Switch Architecture ─────────────────────
  sectionHeading(doc, 4, 'Kill Switch Architecture')

  paragraph(doc,
    'The kill switch system provides emergency trading suspension capability at three hierarchical scopes. Each scope operates independently — activating a trader-level switch does not affect other traders, and activating a firm-level switch immediately blocks all trading activity.'
  )

  dataTable(doc,
    [
      { key: 'scope', label: 'Scope', width: 0.15 },
      { key: 'affect', label: 'Affected Population', width: 0.3 },
      { key: 'triggers', label: 'Trigger Sources', width: 0.55 },
    ],
    [
      { scope: 'Firm', affect: 'All funded accounts', triggers: 'Treasury freeze, aggregate loss threshold, manual operations trigger.' },
      { scope: 'Trader', affect: 'Single trader account', triggers: 'Drawdown breach, behavioural freeze, compliance hold.' },
      { scope: 'Instrument', affect: 'All accounts for instrument', triggers: 'Spread ceiling breach, liquidity event, news blackout enforcement.' },
    ]
  )

  subHeading(doc, 'Kill Switch State Machine')
  paragraph(doc,
    'Kill switches have three states: inactive (normal operations), active (all new positions blocked), and pending_review (activated with manual confirmation required before deactivation). Deactivation of firm-level switches requires explicit principal authorisation and produces an audit log entry with justification.'
  )

  // ── 5. Behavioural Detection ────────────────────────
  sectionHeading(doc, 5, 'Behavioural Detection Methodology')

  paragraph(doc,
    'The behavioural detection system monitors traders for patterns that indicate gaming, manipulation, or unsustainable trading practices. Detection is passive and continuous — traders are not aware of their specific scores or intervention thresholds.'
  )

  subHeading(doc, '5.1 Composite Score Calculation')
  paragraph(doc,
    'The composite stability score aggregates five weighted dimensions into a single value from 0 to 100. Each dimension produces a sub-score using dimension-specific formulas:'
  )

  calloutBox(doc,
    'CompositeScore = Σ(dimension_weight × dimension_score) for all 5 dimensions'
  )

  subHeading(doc, '5.2 Gaming Pattern Detection')
  paragraph(doc,
    'The system monitors for specific gaming behaviours that violate the spirit of the evaluation process:'
  )

  dataTable(doc,
    [
      { key: 'pattern', label: 'Pattern', width: 0.22 },
      { key: 'signal', label: 'Detection Signal', width: 0.38 },
      { key: 'response', label: 'Automated Response', width: 0.4 },
    ],
    [
      { pattern: 'Martingale', signal: 'Position size doubles after consecutive losses', response: 'Score penalty, scaling freeze' },
      { pattern: 'EOD Cramming', signal: '> 60% of daily volume in final 30 minutes', response: 'Session discipline penalty' },
      { pattern: 'Copy Trading', signal: 'High correlation (> 0.85) with another account', response: 'Investigation referral' },
      { pattern: 'Evaluation Arbitrage', signal: 'Strategy shift between evaluation phases', response: 'Consistency score reduction' },
      { pattern: 'Max Lot Abuse', signal: 'Consistent maximum position sizing', response: 'Risk discipline penalty' },
    ]
  )

  // ── 6. Treasury Stress Scenarios ────────────────────
  doc.addPage()
  sectionHeading(doc, 6, 'Treasury Stress Scenarios', { topPad: 10 })

  paragraph(doc,
    'The treasury is stress-tested under three standardised scenarios that model progressively severe capital depletion events. These scenarios inform the reserve buffer policy thresholds and are run as part of the V5-D simulation suite.'
  )

  subHeading(doc, '6.1 Moderate Drawdown Scenario')
  paragraph(doc,
    'Models a period where 30% of funded traders experience simultaneous drawdowns of 50% of their maximum allowed loss. This represents a correlated market event affecting a significant minority of the trader population.'
  )

  keyValueBlock(doc, [
    { label: 'Affected Population', value: '30% of funded accounts' },
    { label: 'Loss Severity', value: '50% of max daily loss per account' },
    { label: 'Duration', value: '5 consecutive trading days' },
    { label: 'Expected Buffer Impact', value: '15–25% buffer depletion' },
  ])

  subHeading(doc, '6.2 Severe Correlation Event')
  paragraph(doc,
    'Models a black swan scenario where 60% of funded traders experience maximum drawdown simultaneously due to a systemic market event. This tests the firm\'s ability to survive extreme correlation without external capital injection.'
  )

  keyValueBlock(doc, [
    { label: 'Affected Population', value: '60% of funded accounts' },
    { label: 'Loss Severity', value: '100% of max daily loss per account' },
    { label: 'Duration', value: '3 consecutive trading days' },
    { label: 'Expected Buffer Impact', value: '40–60% buffer depletion' },
  ])

  subHeading(doc, '6.3 Existential Threat')
  paragraph(doc,
    'Models a scenario where 90% of funded traders breach maximum drawdown within a single trading day. This scenario is designed to test the kill switch response time and the treasury freeze mechanism.'
  )

  keyValueBlock(doc, [
    { label: 'Affected Population', value: '90% of funded accounts' },
    { label: 'Loss Severity', value: '100% of max drawdown per account' },
    { label: 'Duration', value: '1 trading day' },
    { label: 'Expected Response', value: 'Firm-level kill switch + treasury freeze within seconds' },
  ])

  // ── 7. Enforcement Verification ─────────────────────
  sectionHeading(doc, 7, 'Enforcement Verification Logic')

  paragraph(doc,
    'Enforcement verification is the process of proving that controls that should fire under specific conditions do, in fact, fire. This is distinct from testing (which discovers defects) — verification confirms that the system behaves as designed under known conditions.'
  )

  subHeading(doc, '7.1 Gate Verification Protocol')
  paragraph(doc,
    'The V5-D simulation framework verifies three enforcement gates by probing them with controlled inputs:'
  )

  bulletList(doc, [
    'Treasury Gate: Verified by querying current treasury state and confirming the gate returns the correct allow/deny decision based on buffer health.',
    'Kill Switch Gate: Verified by checking for active switches across all three scopes and confirming the gate correctly aggregates scope-level decisions.',
    'Readiness Gate: Verified by comparing the latest simulation readiness score against the configured minimum threshold and confirming the gate blocks when the score is insufficient.',
  ])

  subHeading(doc, '7.2 Assertion Categories')
  paragraph(doc,
    'Each simulation run produces typed assertions that are categorised by severity and enforcement domain:'
  )

  dataTable(doc,
    [
      { key: 'severity', label: 'Severity', width: 0.15, align: 'center' },
      { key: 'meaning', label: 'Meaning', width: 0.35 },
      { key: 'impact', label: 'Impact on Readiness Score', width: 0.5 },
    ],
    [
      { severity: 'Critical', meaning: 'Core enforcement failure', impact: 'Score → 0.0 for affected component. Suite fails.' },
      { severity: 'Major', meaning: 'Significant control gap', impact: 'Component score reduced by 0.25 per major failure.' },
      { severity: 'Minor', meaning: 'Non-critical deviation', impact: 'Component score reduced by 0.05 per minor failure.' },
      { severity: 'Info', meaning: 'Observation, no action', impact: 'No impact on score. Logged for analysis.' },
    ]
  )

  // ── 8. Guard Middleware ─────────────────────────────
  doc.addPage()
  sectionHeading(doc, 8, 'Guard Middleware Structure', { topPad: 10 })

  paragraph(doc,
    'The guard middleware layer provides a centralised enforcement API that all sensitive operations must pass through before execution. Guards are implemented as pure functions that query system state and return a deterministic allow/deny decision with structured reasoning.'
  )

  subHeading(doc, '8.1 Guard Function Signatures')

  keyValueBlock(doc, [
    { label: 'checkTreasuryGate()', value: 'Queries treasury status and buffer health. Returns { allowed, reason, details }.' },
    { label: 'checkKillSwitchGate()', value: 'Checks active kill switches by scope. Fails closed on query error.' },
    { label: 'checkCompoundingReadiness()', value: 'Queries latest simulation readiness score against minimum threshold.' },
    { label: 'checkAllGates()', value: 'Composite gate — runs all three in parallel, returns combined result.' },
  ])

  subHeading(doc, '8.2 Fail-Closed Design')
  paragraph(doc,
    'Every guard function is designed to deny access if any error occurs during evaluation. This includes database connection failures, query timeouts, and unexpected data formats. The system never infers permission from the absence of a denial — permission must be explicitly granted by a successful gate evaluation.'
  )

  calloutBox(doc,
    'Implementation Rule: If a gate function throws an exception, catches the error, or receives unexpected data, the return value is always { allowed: false }. No exceptions.'
  )

  // ── 9. Audit Logging ────────────────────────────────
  sectionHeading(doc, 9, 'Audit Logging Design')

  paragraph(doc,
    'The audit logging system records every state change in the prop-sharing engine. Logs are append-only — the application layer has no mechanism to update or delete existing log entries. The logging schema captures sufficient context for complete state reconstruction.'
  )

  subHeading(doc, '9.1 Log Entry Structure')
  keyValueBlock(doc, [
    { label: 'Action Type', value: 'Enumerated action identifier (e.g., createAccount, executeTrade, toggleKillSwitch).' },
    { label: 'Input Data', value: 'JSON snapshot of the data provided to the operation before execution.' },
    { label: 'Output Data', value: 'JSON snapshot of the operation result or state change produced.' },
    { label: 'Principal', value: 'The user, system process, or agent that initiated the action.' },
    { label: 'Timestamp', value: 'Server-time timestamp with timezone. Not settable by the caller.' },
  ])

  subHeading(doc, '9.2 Retention & Access')
  paragraph(doc,
    'Audit logs are retained indefinitely. Access to raw logs is restricted to authorised compliance personnel through the dashboard interface. Bulk export is available for regulatory submissions. Log integrity can be verified by comparing sequential entry IDs — gaps indicate potential data loss events that require investigation.'
  )

  // ── 10. Simulation Framework ────────────────────────
  doc.addPage()
  sectionHeading(doc, 10, 'Stress Simulation Framework', { topPad: 10 })

  paragraph(doc,
    'The V5-D stress simulation framework provides systematic verification of all enforcement layers. It runs five predefined scenarios, each targeting a specific subsystem. The framework is designed to answer one question: "Do the controls that should fire actually fire?"'
  )

  subHeading(doc, '10.1 Scenario Architecture')
  paragraph(doc,
    'Each scenario consists of a sequence of probe events that exercise specific enforcement paths. Probes are non-destructive — they query system state and verify responses without modifying production data.'
  )

  flowDiagram(doc, [
    'Scenario Initialisation',
    'Sequential Probe Execution',
    'Assertion Collection',
    'Component Score Calculation',
    'Readiness Score Aggregation',
  ])

  subHeading(doc, '10.2 Scenario Inventory')
  bulletList(doc, [
    'Full Lifecycle: Probes account, programme, trade, and payout tables for structural integrity and referential consistency.',
    'Treasury Throttle: Verifies treasury gate enforcement including state transitions from active through throttled to frozen.',
    'Behaviour Seams: Checks that behavioural scores connect correctly to intervention triggers with no enforcement gaps.',
    'Funnel Suppression: Verifies that channel quality metrics correctly trigger suppression rules and CLV/CAC cliff detection.',
    'Execution Blackout: Tests kill switch activation at all three scopes and news blackout scheduling enforcement.',
  ])

  // ── 11. Compounding Controls ────────────────────────
  sectionHeading(doc, 11, 'Compounding Controls')

  paragraph(doc,
    'The Capital Compounding Engine is the most tightly controlled subsystem in the architecture. Every compounding action requires triple-gate clearance, policy-defined conditions, cooldown compliance, and quarterly budget adherence.'
  )

  subHeading(doc, '11.1 Execution Prerequisites')
  bulletList(doc, [
    'Treasury gate must return PASS (buffer health above throttle threshold).',
    'No active kill switches at firm scope.',
    'Compounding Readiness Score must meet the policy\'s minimum CRS threshold.',
    'Policy-specific conditions must be satisfied (minimum retained earnings, buffer health, buffer days).',
    'Cooldown period since last execution of the same policy must have elapsed.',
    'Quarterly allocation budget for the policy must not be exhausted.',
  ])

  subHeading(doc, '11.2 Proof Layer')
  paragraph(doc,
    'Every compounding action records a proof layer that captures the complete decision context at execution time. The proof layer includes: the input state snapshot (retained earnings, buffer health, readiness score), the policy that triggered the action, the gate results at execution time, and the computed allocation amount. This enables post-hoc audit of any compounding decision.'
  )

  // ── 12. Conclusion ──────────────────────────────────
  doc.addPage()
  sectionHeading(doc, 12, 'Conclusion', { topPad: 10 })

  paragraph(doc,
    'The FTH Prop Sharing programme\'s risk and control infrastructure is designed to be deterministic, auditable, and fail-safe. Every enforcement decision is automated, logged, and verifiable. The system is architected so that the absence of an explicit permission signal results in denial — not the reverse.'
  )

  paragraph(doc,
    'The five-layer progressive architecture ensures that failures at one level do not cascade to compromise the entire system. Account-level controls protect individual traders. Firm-level controls protect aggregate exposure. The Treasury Guard protects capital reserves. Behavioural scoring protects against gaming. And the Stress Simulation Framework verifies that all of these layers function correctly before any capital is compounded.'
  )

  calloutBox(doc,
    'The north star of this architecture is capital preservation. Growth is a consequence of disciplined compounding — not its objective. The system is designed to never blow up, and to compound quietly.'
  )

  horizontalRule(doc)

  // ── Risk Disclosures ────────────────────────────────
  sectionHeading(doc, 13, 'Risk Disclosures')

  paragraph(doc,
    'This whitepaper describes the technical architecture and methodology of the FTH Prop Sharing system. It does not constitute financial advice, an offer of securities, or a guarantee of performance. The risk controls described herein are designed to reduce — not eliminate — the probability of capital loss. All trading involves risk, and past system behaviour does not predict future outcomes.'
  )

  paragraph(doc,
    'The models, formulas, and enforcement logic described in this document are subject to change as the system evolves. Material changes are tracked through policy versioning and recorded in the audit log. Recipients of this document should verify the current policy version with FTH Trading before relying on specific technical details.'
  )

  doc
    .font(fonts.body)
    .fontSize(sizes.footnote)
    .fillColor(colors.gray500)
    .text(`\nPolicy Version: ${docMeta.policyVersion} · Engine v${docMeta.engineVersion} · Generated: ${new Date().toISOString().split('T')[0]}`, sizes.marginLeft, doc.y + 10)

  // ── Headers/Footers ─────────────────────────────────
  addPageHeaders(doc, 'Risk & Controls Whitepaper')

  return renderToBuffer(doc)
}
