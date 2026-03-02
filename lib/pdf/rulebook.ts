/**
 * FTH Prop Challenge Rulebook
 * Formatted PDF download of programme rules, risk tables, and payout structure.
 */
import {
  createDoc, drawCoverPage, sectionHeading, subHeading,
  paragraph, boldParagraph, bulletList, keyValueBlock,
  calloutBox, dataTable, horizontalRule, flowDiagram,
  addPageHeaders, renderToBuffer, ensureSpace,
} from './components'
import { colors, fonts, sizes, layout, docMeta } from './theme'

export async function generateRulebook(): Promise<Buffer> {
  const doc = createDoc(
    'FTH Prop Challenge Rulebook',
    'Complete programme rules, risk parameters, and payout structure'
  )

  // ── Cover ───────────────────────────────────────────
  drawCoverPage(doc, {
    title: 'Prop Challenge\nRulebook',
    subtitle: 'Programme Rules, Risk Parameters & Payout Structure',
    classification: 'Public Distribution',
    version: docMeta.policyVersion,
  })

  // ── 1. Programme Overview ───────────────────────────
  doc.addPage()
  sectionHeading(doc, 1, 'Programme Overview', { topPad: 10 })

  paragraph(doc,
    'The FTH Prop Challenge is a structured evaluation programme that identifies skilled traders for contractual funded trading arrangements. Traders who demonstrate consistent profitability, disciplined risk management, and stable trading behaviour progress through a multi-phase assessment before receiving access to a funded account.'
  )

  paragraph(doc,
    'This rulebook defines the complete set of rules governing programme participation, including evaluation criteria, risk parameters, payout structures, and conditions under which accounts may be suspended or terminated.'
  )

  calloutBox(doc,
    'All rules are enforced programmatically. There are no discretionary exceptions, manual overrides, or case-by-case evaluations of drawdown breaches.'
  )

  subHeading(doc, 'Programme Structure')
  flowDiagram(doc, [
    'Application & KYC Verification',
    'Phase 1 — Evaluation (Simulated)',
    'Phase 2 — Verification (Simulated)',
    'Funded Account (Contractual)',
    'Ongoing Performance Review',
  ])

  // ── 2. Evaluation Phase ─────────────────────────────
  sectionHeading(doc, 2, 'Phase 1 — Evaluation Rules')

  paragraph(doc,
    'The evaluation phase tests a trader\'s ability to meet a profit target while respecting strict risk parameters. All trading occurs in a simulated environment with realistic execution conditions including dynamic spreads, slippage modelling, and latency simulation.'
  )

  subHeading(doc, 'Evaluation Parameters')
  dataTable(doc,
    [
      { key: 'parameter', label: 'Parameter', width: 0.35 },
      { key: 'standard', label: 'Standard', width: 0.22, align: 'center' },
      { key: 'aggressive', label: 'Aggressive', width: 0.22, align: 'center' },
      { key: 'note', label: 'Note', width: 0.21 },
    ],
    [
      { parameter: 'Profit Target', standard: '8%', aggressive: '10%', note: 'Of initial balance' },
      { parameter: 'Maximum Drawdown', standard: '10%', aggressive: '8%', note: 'From peak equity' },
      { parameter: 'Daily Loss Limit', standard: '5%', aggressive: '4%', note: 'Per calendar day' },
      { parameter: 'Minimum Trading Days', standard: '10 days', aggressive: '10 days', note: 'Active days only' },
      { parameter: 'Maximum Duration', standard: '30 days', aggressive: '30 days', note: 'Calendar days' },
      { parameter: 'Leverage', standard: '1:100', aggressive: '1:100', note: 'Instrument-dependent' },
    ]
  )

  subHeading(doc, 'Pass Criteria')
  bulletList(doc, [
    'Achieve the profit target within the maximum duration.',
    'Never breach the maximum drawdown limit at any point during the evaluation.',
    'Never breach the daily loss limit on any single trading day.',
    'Complete the minimum number of active trading days.',
    'Pass consistency checks (no single day may account for >40% of total profit).',
  ])

  subHeading(doc, 'Fail Criteria')
  bulletList(doc, [
    'Breach of maximum drawdown — account immediately terminated, no appeal.',
    'Breach of daily loss limit — account immediately frozen for the day; second breach terminates.',
    'Duration expiry without meeting profit target — account terminated.',
    'Detection of prohibited trading behaviour (see Section 6) — account terminated.',
  ])

  // ── 3. Verification Phase ──────────────────────────
  doc.addPage()
  sectionHeading(doc, 3, 'Phase 2 — Verification Rules', { topPad: 10 })

  paragraph(doc,
    'Traders who pass Phase 1 enter a verification phase that tests consistency and discipline over a longer period with a reduced profit target. The verification phase uses the same risk parameters as the evaluation phase.'
  )

  dataTable(doc,
    [
      { key: 'parameter', label: 'Parameter', width: 0.4 },
      { key: 'value', label: 'Value', width: 0.25, align: 'center' },
      { key: 'note', label: 'Note', width: 0.35 },
    ],
    [
      { parameter: 'Profit Target', value: '5%', note: 'Reduced from evaluation' },
      { parameter: 'Maximum Drawdown', value: 'Same as Phase 1', note: 'Carried forward' },
      { parameter: 'Daily Loss Limit', value: 'Same as Phase 1', note: 'Carried forward' },
      { parameter: 'Minimum Trading Days', value: '10 days', note: 'Active days only' },
      { parameter: 'Maximum Duration', value: '60 days', note: 'Extended window' },
      { parameter: 'Consistency Requirement', value: 'Enhanced', note: 'No day > 30% of total' },
    ]
  )

  calloutBox(doc,
    'The verification phase exists to filter traders who passed evaluation through luck, aggressive risk-taking, or short-term strategy manipulation.'
  )

  // ── 4. Funded Account Rules ─────────────────────────
  sectionHeading(doc, 4, 'Funded Account Rules')

  paragraph(doc,
    'Traders who pass both phases receive a funded account. The funded account is a contractual arrangement — the trader operates under a services agreement and receives a share of net profits. The firm retains all capital at risk.'
  )

  subHeading(doc, 'Funded Account Parameters')
  dataTable(doc,
    [
      { key: 'parameter', label: 'Parameter', width: 0.4 },
      { key: 'value', label: 'Value', width: 0.25, align: 'center' },
      { key: 'note', label: 'Note', width: 0.35 },
    ],
    [
      { parameter: 'Maximum Drawdown', value: '10%', note: 'From initial capital' },
      { parameter: 'Daily Loss Limit', value: '5%', note: 'Per calendar day' },
      { parameter: 'Profit Split', value: '80 / 20', note: 'Trader / Firm' },
      { parameter: 'Payout Frequency', value: 'Bi-weekly', note: 'After minimum period' },
      { parameter: 'Minimum Payout', value: '$100', note: 'Per payout request' },
      { parameter: 'First Payout Eligibility', value: '14 days', note: 'After funding date' },
    ]
  )

  subHeading(doc, 'Scaling Programme')
  paragraph(doc,
    'Funded accounts are eligible for capital increases based on sustained performance. Scaling decisions are automated and based on behavioural stability scores, account age, and cumulative profitability.'
  )

  dataTable(doc,
    [
      { key: 'milestone', label: 'Milestone', width: 0.3 },
      { key: 'requirement', label: 'Requirement', width: 0.4 },
      { key: 'increase', label: 'Capital Increase', width: 0.3, align: 'center' },
    ],
    [
      { milestone: 'Level 1 → Level 2', requirement: '60 days funded, 5% net profit, score ≥ 70', increase: '+25%' },
      { milestone: 'Level 2 → Level 3', requirement: '120 days funded, 10% cumulative, score ≥ 75', increase: '+50%' },
      { milestone: 'Level 3 → Level 4', requirement: '180 days funded, 15% cumulative, score ≥ 80', increase: '+100%' },
    ]
  )

  // ── 5. Example Scenarios ────────────────────────────
  doc.addPage()
  sectionHeading(doc, 5, 'Example Pass / Fail Scenarios', { topPad: 10 })

  paragraph(doc,
    'The following examples illustrate how the rules apply in practice. All scenarios assume a $100,000 evaluation account with standard parameters.'
  )

  subHeading(doc, 'Scenario A — Clean Pass')
  keyValueBlock(doc, [
    { label: 'Result', value: 'PASS' },
    { label: 'Action', value: 'Trader achieves 8.5% profit over 18 trading days.' },
    { label: 'Peak Drawdown', value: '4.2% (within 10% limit).' },
    { label: 'Worst Day', value: '-1.8% (within 5% daily limit).' },
    { label: 'Consistency', value: 'Best day = 1.9%, well under 40% threshold.' },
  ])

  subHeading(doc, 'Scenario B — Drawdown Breach')
  keyValueBlock(doc, [
    { label: 'Result', value: 'FAIL — Immediate termination' },
    { label: 'Action', value: 'Trader reaches 7% profit, then suffers a series of losses.' },
    { label: 'Breach Point', value: 'Equity drops to $89,500 (-10.5% from peak of $107,000).' },
    { label: 'Outcome', value: 'Account terminated at the moment drawdown exceeds 10%. No appeal.' },
  ])

  subHeading(doc, 'Scenario C — Daily Loss Breach')
  keyValueBlock(doc, [
    { label: 'Result', value: 'FROZEN → Second breach = FAIL' },
    { label: 'Action', value: 'Trader loses $5,200 in a single day (5.2% of initial balance).' },
    { label: 'First Breach', value: 'Account frozen for remainder of the day. Warning issued.' },
    { label: 'Second Breach', value: 'Any subsequent daily loss breach results in termination.' },
  ])

  subHeading(doc, 'Scenario D — Consistency Failure')
  keyValueBlock(doc, [
    { label: 'Result', value: 'FAIL — Consistency check' },
    { label: 'Action', value: 'Trader achieves 8% target, but $6,400 (80%) came from one trade.' },
    { label: 'Rule Violated', value: 'Single-day profits > 40% of total ($3,200 threshold).' },
    { label: 'Outcome', value: 'Account requires re-evaluation despite meeting profit target.' },
  ])

  // ── 6. Payout Structure ─────────────────────────────
  sectionHeading(doc, 6, 'Payout Structure')

  paragraph(doc,
    'Funded traders are entitled to request profit-share payouts on a bi-weekly basis, subject to the following conditions:'
  )

  bulletList(doc, [
    'Minimum 14 days since funding date (first payout only).',
    'Minimum payout amount of $100.',
    'Account must be in good standing (no active freezes or suspensions).',
    'Behavioural stability score must be ≥ 40 (above "restricted" threshold).',
    'No pending compliance review or fraud investigation.',
  ])

  subHeading(doc, 'Payout Calculation')
  calloutBox(doc,
    'Payout = (Account Equity − High Water Mark at Last Payout) × Trader Split (80%)'
  )

  paragraph(doc,
    'The high water mark resets after each payout. Losses incurred after a payout must be recovered before the next payout becomes eligible. This ensures the firm does not pay profit shares on unrealised gains that are subsequently lost.'
  )

  // ── 7. Freeze Conditions ────────────────────────────
  doc.addPage()
  sectionHeading(doc, 7, 'Account Freeze & Termination Conditions', { topPad: 10 })

  paragraph(doc,
    'Accounts may be frozen (temporarily suspended) or terminated (permanently closed) under the following conditions. All freeze and termination events are logged in the audit trail with the triggering rule and timestamp.'
  )

  subHeading(doc, 'Freeze Conditions (Temporary)')
  dataTable(doc,
    [
      { key: 'trigger', label: 'Trigger', width: 0.3 },
      { key: 'duration', label: 'Duration', width: 0.2, align: 'center' },
      { key: 'resolution', label: 'Resolution', width: 0.5 },
    ],
    [
      { trigger: 'Daily loss limit breach', duration: 'End of day', resolution: 'Automatic — trading resumes next day.' },
      { trigger: 'Behavioural score < 20', duration: 'Until review', resolution: 'Manual review required to unfreeze.' },
      { trigger: 'Compliance hold', duration: 'Until cleared', resolution: 'KYC/AML team must clear the hold.' },
      { trigger: 'News blackout', duration: 'Event window', resolution: 'Automatic — resumes after event window.' },
      { trigger: 'Treasury throttle', duration: 'Until buffer recovers', resolution: 'Automatic when buffer health improves.' },
    ]
  )

  subHeading(doc, 'Termination Conditions (Permanent)')
  dataTable(doc,
    [
      { key: 'trigger', label: 'Trigger', width: 0.35 },
      { key: 'appeal', label: 'Appeal', width: 0.15, align: 'center' },
      { key: 'note', label: 'Detail', width: 0.5 },
    ],
    [
      { trigger: 'Maximum drawdown breach', appeal: 'No', note: 'Immediate and irreversible.' },
      { trigger: 'Second daily loss breach', appeal: 'No', note: 'Two breaches in any evaluation period.' },
      { trigger: 'Fraud detection confirmation', appeal: 'Limited', note: 'After investigation by compliance team.' },
      { trigger: 'Terms of service violation', appeal: 'Limited', note: 'Copy trading, third-party access, etc.' },
      { trigger: 'Evaluation timeout', appeal: 'No', note: 'Failed to meet target within time limit.' },
    ]
  )

  // ── 8. Compliance ───────────────────────────────────
  sectionHeading(doc, 8, 'Compliance & Legal Notices')

  paragraph(doc,
    'Participation in the FTH Prop Challenge is subject to the following terms and conditions. By submitting an application, participants acknowledge and accept these terms in full.'
  )

  bulletList(doc, [
    'The programme is an evaluation service, not an investment product. Evaluation fees are non-refundable.',
    'Funded accounts operate under a contractual services agreement. Traders are independent contractors, not employees.',
    'The firm reserves the right to modify programme terms with 30 days written notice to active participants.',
    'All trading data, behavioural scores, and compliance records are retained in accordance with applicable data protection regulations.',
    'The programme is not available in jurisdictions where such services are prohibited or require licensing not held by FTH Trading.',
    'Past performance of other traders does not indicate or guarantee future results.',
    'FTH Trading reserves the right to reject applications at its sole discretion.',
  ])

  doc
    .font(fonts.body)
    .fontSize(sizes.footnote)
    .fillColor(colors.gray500)
    .text(`\nRulebook Version: ${docMeta.policyVersion} · Generated: ${new Date().toISOString().split('T')[0]}`, sizes.marginLeft, doc.y + 10)

  // ── Headers/Footers ─────────────────────────────────
  addPageHeaders(doc, 'Prop Challenge Rulebook')

  return renderToBuffer(doc)
}
