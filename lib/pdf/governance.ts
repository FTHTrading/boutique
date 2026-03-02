/**
 * FTH Retained Earnings & Capital Governance Report
 * DYNAMIC — Pulls live data from treasury, simulations, and compounding policies.
 * Allocator-grade formal compliance document.
 */
import {
  createDoc, drawCoverPage, sectionHeading, subHeading,
  paragraph, boldParagraph, bulletList, keyValueBlock,
  calloutBox, dataTable, horizontalRule,
  addPageHeaders, renderToBuffer, ensureSpace,
} from './components'
import { colors, fonts, sizes, layout, docMeta } from './theme'

// ── Data Shape ────────────────────────────────────────

export interface GovernanceData {
  treasury: {
    status: string
    total_reserves: number
    buffer_health_pct: number
    consecutive_healthy_days: number
    snapshot_date: string
  } | null
  reservePolicy: {
    min_buffer_pct: number
    throttle_threshold: number
    freeze_threshold: number
    max_funded_ratio: number
  } | null
  policies: {
    policy_id: number
    name: string
    status: string
    action_type: string
    min_retained_earnings: number
    min_buffer_health: number
    min_readiness_score: number
    cooldown_hours: number
  }[]
  latestSimulation: {
    scenario: string
    status: string
    compounding_readiness: number
    enforcement_score: number
    trace_integrity_score: number
    behavior_seam_score: number
    funnel_cliff_score: number
    completed_at: string
  } | null
  gateStatus: {
    treasury_gate: boolean
    kill_switch_gate: boolean
    readiness_gate: boolean
  }
}

// ── Generator ─────────────────────────────────────────

export async function generateGovernanceReport(data: GovernanceData): Promise<Buffer> {
  const doc = createDoc(
    'FTH Retained Earnings & Capital Governance Report',
    'Live governance snapshot for institutional counterparties'
  )
  const now = new Date()
  const dateStr = now.toISOString().split('T')[0]
  const timeStr = now.toISOString().split('T')[1]?.slice(0, 8) || ''

  // ── Cover ───────────────────────────────────────────
  drawCoverPage(doc, {
    title: 'Retained Earnings &\nCapital Governance Report',
    subtitle: 'Live System Snapshot — Generated from Production Data',
    classification: 'Confidential — Institutional Distribution',
    date: dateStr,
    version: `${docMeta.policyVersion}-live`,
  })

  // ── Page 2: Capital Overview ────────────────────────
  doc.addPage()

  sectionHeading(doc, 1, 'Capital Overview', { topPad: 10 })

  if (data.treasury) {
    const t = data.treasury
    calloutBox(doc,
      `Treasury Status: ${t.status.toUpperCase()} — Snapshot as of ${t.snapshot_date || dateStr}`,
      {
        color: t.status === 'active' ? colors.green : t.status === 'throttled' ? colors.amberLight : colors.red,
        bgColor: t.status === 'active' ? '#F0FDF4' : t.status === 'throttled' ? '#FFF7ED' : '#FEF2F2',
      }
    )

    keyValueBlock(doc, [
      { label: 'Total Reserves', value: `$${Number(t.total_reserves).toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
      { label: 'Buffer Health', value: `${Number(t.buffer_health_pct).toFixed(1)}%` },
      { label: 'Consecutive Healthy Days', value: `${t.consecutive_healthy_days} days` },
      { label: 'Operating State', value: t.status.charAt(0).toUpperCase() + t.status.slice(1) },
      { label: 'Report Generated', value: `${dateStr} ${timeStr} UTC` },
    ])
  } else {
    paragraph(doc,
      'Treasury data is not yet available. The system has not recorded a capital snapshot. This report will populate automatically once the treasury module has been initialised and the first daily snapshot has been recorded.'
    )
  }

  paragraph(doc,
    'This report is generated dynamically from the production database. All figures reflect the most recent recorded state. Policy versions, gate results, and simulation scores are queried at generation time and represent a point-in-time snapshot.'
  )

  // ── Page 3: Reserve Buffer Policy ───────────────────
  sectionHeading(doc, 2, 'Reserve Buffer Policy')

  if (data.reservePolicy) {
    const rp = data.reservePolicy
    paragraph(doc,
      'The reserve buffer policy defines the minimum capital reserves the firm must maintain relative to total funded trader capital. The policy enforces automatic throttling and freezing when reserves fall below defined thresholds.'
    )

    dataTable(doc,
      [
        { key: 'parameter', label: 'Parameter', width: 0.4 },
        { key: 'value', label: 'Current Value', width: 0.3, align: 'center' },
        { key: 'effect', label: 'Effect', width: 0.3 },
      ],
      [
        { parameter: 'Minimum Buffer Percentage', value: `${rp.min_buffer_pct}%`, effect: 'Baseline reserve floor' },
        { parameter: 'Throttle Threshold', value: `${rp.throttle_threshold}%`, effect: 'New accounts suspended' },
        { parameter: 'Freeze Threshold', value: `${rp.freeze_threshold}%`, effect: 'All funding halted' },
        { parameter: 'Max Funded Ratio', value: `${rp.max_funded_ratio}x`, effect: 'Leverage ceiling' },
      ]
    )
  } else {
    paragraph(doc,
      'Reserve buffer policy has not been configured. Default conservative thresholds are applied until an explicit policy is defined by an authorised principal.'
    )
  }

  subHeading(doc, 'Funding Throttle Logic')
  paragraph(doc,
    'When buffer health falls below the throttle threshold, the system automatically suspends new account creation and delays pending payouts. This is not a discretionary decision — it is a deterministic enforcement gate that fires based on the most recent treasury snapshot. The throttle releases automatically when buffer health recovers above the threshold for a configurable number of consecutive snapshots.'
  )

  // ── Page 4: Compounding Policies ────────────────────
  doc.addPage()
  sectionHeading(doc, 3, 'Compounding Policies', { topPad: 10 })

  paragraph(doc,
    'The Capital Compounding Engine uses policy-defined rules to govern how retained earnings are reinvested. Each policy specifies activation conditions, allocation percentages, cooldown periods, and approval requirements. The following table shows all policies currently registered in the system.'
  )

  if (data.policies.length > 0) {
    dataTable(doc,
      [
        { key: 'id', label: 'ID', width: 0.06, align: 'center' },
        { key: 'name', label: 'Policy Name', width: 0.22 },
        { key: 'status', label: 'Status', width: 0.1, align: 'center' },
        { key: 'type', label: 'Action', width: 0.14 },
        { key: 'minRE', label: 'Min Retained', width: 0.14, align: 'right' },
        { key: 'minBuf', label: 'Min Buffer', width: 0.12, align: 'center' },
        { key: 'minCRS', label: 'Min CRS', width: 0.1, align: 'center' },
        { key: 'cooldown', label: 'Cool-down', width: 0.12, align: 'center' },
      ],
      data.policies.map(p => ({
        id: String(p.policy_id),
        name: p.name,
        status: p.status,
        type: p.action_type.replace(/_/g, ' '),
        minRE: `$${Number(p.min_retained_earnings || 0).toLocaleString()}`,
        minBuf: `${Number(p.min_buffer_health || 0)}%`,
        minCRS: Number(p.min_readiness_score || 0).toFixed(2),
        cooldown: `${p.cooldown_hours || 0}h`,
      }))
    )
  } else {
    paragraph(doc, 'No compounding policies are currently registered. Policies will be listed here once defined.')
  }

  calloutBox(doc,
    'All compounding actions require a passing Compounding Readiness Score and treasury gate clearance. The Emergency Lock policy overrides all others when buffer health drops below 30%.'
  )

  // ── Page 5: Enforcement Gate Summary ────────────────
  sectionHeading(doc, 4, 'Enforcement Gate Summary')

  paragraph(doc,
    'Three independent enforcement gates must all return "allowed" before any compounding policy may execute. This section shows the current state of each gate as of report generation time.'
  )

  const gateRows = [
    {
      gate: 'Treasury Gate',
      status: data.gateStatus.treasury_gate ? 'PASS' : 'BLOCKED',
      description: 'Checks treasury operating state and buffer health.',
    },
    {
      gate: 'Kill Switch Gate',
      status: data.gateStatus.kill_switch_gate ? 'PASS' : 'BLOCKED',
      description: 'Checks for active kill switches at firm scope.',
    },
    {
      gate: 'Readiness Gate',
      status: data.gateStatus.readiness_gate ? 'PASS' : 'BLOCKED',
      description: 'Checks Compounding Readiness Score from latest simulation.',
    },
  ]

  dataTable(doc,
    [
      { key: 'gate', label: 'Gate', width: 0.22 },
      { key: 'status', label: 'Current Status', width: 0.18, align: 'center' },
      { key: 'description', label: 'What It Checks', width: 0.6 },
    ],
    gateRows
  )

  const allGatesPass = data.gateStatus.treasury_gate && data.gateStatus.kill_switch_gate && data.gateStatus.readiness_gate
  calloutBox(doc,
    allGatesPass
      ? 'All enforcement gates are currently passing. Compounding policies may execute subject to individual policy conditions.'
      : 'One or more enforcement gates are BLOCKED. No compounding policies may execute until all gates return to PASS status.',
    {
      color: allGatesPass ? colors.green : colors.red,
      bgColor: allGatesPass ? '#F0FDF4' : '#FEF2F2',
    }
  )

  // ── Page 6: Readiness Score Methodology ─────────────
  doc.addPage()
  sectionHeading(doc, 5, 'Readiness Score Methodology', { topPad: 10 })

  paragraph(doc,
    'The Compounding Readiness Score (CRS) is a composite metric derived from the most recent completed stress simulation suite. It represents the system\'s verified confidence that all enforcement layers are functioning correctly.'
  )

  subHeading(doc, 'Component Scores')
  paragraph(doc,
    'The CRS is the unweighted average of four component scores, each ranging from 0.0 to 1.0:'
  )

  if (data.latestSimulation) {
    const s = data.latestSimulation
    dataTable(doc,
      [
        { key: 'component', label: 'Component', width: 0.3 },
        { key: 'score', label: 'Score', width: 0.15, align: 'center' },
        { key: 'description', label: 'What It Verifies', width: 0.55 },
      ],
      [
        { component: 'Enforcement', score: Number(s.enforcement_score || 0).toFixed(3), description: 'Gates respond correctly under adversarial conditions' },
        { component: 'Trace Integrity', score: Number(s.trace_integrity_score || 0).toFixed(3), description: 'All state transitions have complete audit trails' },
        { component: 'Behaviour Seam', score: Number(s.behavior_seam_score || 0).toFixed(3), description: 'No gaps between scoring and intervention enforcement' },
        { component: 'Funnel Cliff', score: Number(s.funnel_cliff_score || 0).toFixed(3), description: 'Acquisition economics remain sound under stress' },
      ]
    )

    const crs = Number(s.compounding_readiness || 0)
    calloutBox(doc,
      `Current Compounding Readiness Score: ${crs.toFixed(3)} — ${crs >= 0.8 ? 'ELIGIBLE for compounding' : crs >= 0.5 ? 'MARGINAL — most policies blocked' : 'INELIGIBLE — all compounding suspended'}`,
      {
        color: crs >= 0.8 ? colors.green : crs >= 0.5 ? colors.amberLight : colors.red,
        bgColor: crs >= 0.8 ? '#F0FDF4' : crs >= 0.5 ? '#FFF7ED' : '#FEF2F2',
      }
    )

    keyValueBlock(doc, [
      { label: 'Simulation Completed', value: s.completed_at ? new Date(s.completed_at).toISOString() : 'N/A' },
      { label: 'Scenario', value: s.scenario || 'Suite' },
      { label: 'Status', value: s.status || 'Unknown' },
    ])
  } else {
    paragraph(doc,
      'No simulation has been completed yet. The Compounding Readiness Score will be populated after the first stress simulation suite run completes. Until then, the readiness gate will block all compounding activity.'
    )
  }

  // ── Page 7: Risk Disclosure ─────────────────────────
  sectionHeading(doc, 6, 'Risk Disclosure Summary')

  paragraph(doc,
    'This section provides a summary of the principal risks associated with the FTH Prop Sharing programme. This disclosure is provided for informational purposes and does not constitute financial, legal, or investment advice.'
  )

  bulletList(doc, [
    'Market Risk: Funded traders operate in volatile commodity markets. Losses may exceed expected ranges despite risk controls.',
    'Operational Risk: System failures, data corruption, or software defects may temporarily affect enforcement layer reliability.',
    'Counterparty Risk: Traders may violate terms of service or engage in undetected gaming behaviours.',
    'Liquidity Risk: Rapid drawdowns across multiple funded accounts may temporarily strain reserve buffers.',
    'Regulatory Risk: Changes in regulatory classification of prop trading programmes may require structural adjustments.',
    'Technology Risk: Dependence on third-party infrastructure (cloud, database, payment processors) introduces availability risk.',
  ])

  calloutBox(doc,
    'Past performance of funded traders does not guarantee future results. All figures in this report are descriptive of system state, not predictive of outcomes.'
  )

  horizontalRule(doc)

  // ── Signature Block ─────────────────────────────────
  ensureSpace(doc, 80)
  doc
    .font(fonts.bold)
    .fontSize(sizes.bodySmall)
    .fillColor(colors.gray600)
    .text('This report was generated automatically by the FTH governance engine.', sizes.marginLeft, doc.y)
  doc.moveDown(0.3)
  doc
    .font(fonts.body)
    .fontSize(sizes.footnote)
    .fillColor(colors.gray500)
    .text(`Generated: ${now.toISOString()}`, sizes.marginLeft, doc.y)
    .text(`Policy Version: ${docMeta.policyVersion}`, sizes.marginLeft, doc.y)
    .text(`Engine Version: v${docMeta.engineVersion}`, sizes.marginLeft, doc.y)
    .text(`Data Source: Production Database (point-in-time snapshot)`, sizes.marginLeft, doc.y)

  // ── Headers/Footers ─────────────────────────────────
  addPageHeaders(doc, 'Capital Governance Report')

  return renderToBuffer(doc)
}
