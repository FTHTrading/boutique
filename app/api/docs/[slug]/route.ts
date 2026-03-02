/**
 * FTH Platform — Document Generation API (Top-Level)
 * GET /api/docs/[slug]
 *
 * Serves ALL platform PDFs from a single route.
 * Covers: platform overview, commodities guide, terms & definitions,
 * plus all prop-sharing documents (architecture, governance, whitepaper,
 * rulebook, one-pager).
 */
import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/sql'

// Platform-wide generators
import { generatePlatformOverview } from '@/lib/pdf/platform-overview'
import { generateCommoditiesGuide } from '@/lib/pdf/commodities-guide'
import { generateTermsDefinitions } from '@/lib/pdf/terms-definitions'

// Prop-sharing generators
import { generateArchitectureOverview } from '@/lib/pdf/architecture'
import { generateGovernanceReport, GovernanceData } from '@/lib/pdf/governance'
import { generateWhitepaper } from '@/lib/pdf/whitepaper'
import { generateRulebook } from '@/lib/pdf/rulebook'
import { generateOnePager } from '@/lib/pdf/one-pager'

export const dynamic = 'force-dynamic'

/* ── Slug → Generator Map ────────────────────────────── */

const SLUG_MAP: Record<string, {
  generator: (data?: any) => Promise<Buffer>
  filename: string
  needsData: boolean
  category: 'platform' | 'commodities' | 'prop-sharing' | 'reference'
}> = {
  // Platform
  'platform-overview': {
    generator: generatePlatformOverview,
    filename: 'FTH_Platform_Overview.pdf',
    needsData: false,
    category: 'platform',
  },

  // Commodities
  'commodities-guide': {
    generator: generateCommoditiesGuide,
    filename: 'FTH_Commodities_Trading_Guide.pdf',
    needsData: false,
    category: 'commodities',
  },

  // Reference / Educational
  'terms-definitions': {
    generator: generateTermsDefinitions,
    filename: 'FTH_Terms_and_Definitions.pdf',
    needsData: false,
    category: 'reference',
  },

  // Prop Sharing
  architecture: {
    generator: generateArchitectureOverview,
    filename: 'FTH_Prop_Architecture_Overview.pdf',
    needsData: false,
    category: 'prop-sharing',
  },
  governance: {
    generator: (data: GovernanceData) => generateGovernanceReport(data),
    filename: 'FTH_Retained_Earnings_Governance_Report.pdf',
    needsData: true,
    category: 'prop-sharing',
  },
  whitepaper: {
    generator: generateWhitepaper,
    filename: 'FTH_Prop_Risk_Controls_Whitepaper.pdf',
    needsData: false,
    category: 'prop-sharing',
  },
  rulebook: {
    generator: generateRulebook,
    filename: 'FTH_Prop_Challenge_Rulebook.pdf',
    needsData: false,
    category: 'prop-sharing',
  },
  'one-pager': {
    generator: generateOnePager,
    filename: 'FTH_Prop_One_Pager.pdf',
    needsData: false,
    category: 'prop-sharing',
  },
}

/* ── Live Data Fetch (for Governance Report) ─────────── */

async function fetchGovernanceData(): Promise<GovernanceData> {
  let treasury = null
  try {
    const res = await sql.query(`
      SELECT status, total_reserves, buffer_health_pct,
             consecutive_healthy_days, snapshot_date::text
      FROM treasury_capital
      ORDER BY snapshot_date DESC LIMIT 1
    `)
    treasury = res.rows[0] || null
  } catch { /* table may not exist yet */ }

  let reservePolicy = null
  try {
    const res = await sql.query(`
      SELECT min_buffer_pct, throttle_threshold,
             freeze_threshold, max_funded_ratio
      FROM prop_reserve_buffer_policy
      WHERE is_active = true
      ORDER BY updated_at DESC LIMIT 1
    `)
    reservePolicy = res.rows[0] || null
  } catch { /* table may not exist yet */ }

  let policies: any[] = []
  try {
    const res = await sql.query(`
      SELECT policy_id, name, status, action_type,
             min_retained_earnings, min_buffer_health,
             min_readiness_score, cooldown_hours
      FROM compounding_policies
      ORDER BY priority ASC
    `)
    policies = res.rows
  } catch { /* table may not exist yet */ }

  let latestSimulation = null
  try {
    const res = await sql.query(`
      SELECT scenario, status, compounding_readiness,
             enforcement_score, trace_integrity_score,
             behavior_seam_score, funnel_cliff_score,
             completed_at::text
      FROM simulation_runs
      WHERE status = 'completed'
      ORDER BY completed_at DESC LIMIT 1
    `)
    latestSimulation = res.rows[0] || null
  } catch { /* table may not exist yet */ }

  const gateStatus = {
    treasury_gate: true,
    kill_switch_gate: true,
    readiness_gate: false,
  }

  try {
    if (treasury) {
      gateStatus.treasury_gate = treasury.status === 'active'
    }
  } catch {}

  try {
    const ks = await sql.query(`
      SELECT switch_id FROM prop_kill_switches
      WHERE is_active = true AND scope = 'firm' LIMIT 1
    `)
    gateStatus.kill_switch_gate = ks.rows.length === 0
  } catch {}

  try {
    if (latestSimulation) {
      gateStatus.readiness_gate = Number(latestSimulation.compounding_readiness) >= 0.7
    }
  } catch {}

  return { treasury, reservePolicy, policies, latestSimulation, gateStatus }
}

/* ── Route Handler ───────────────────────────────────── */

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params
    const entry = SLUG_MAP[slug]

    if (!entry) {
      return NextResponse.json(
        {
          success: false,
          error: `Unknown document: "${slug}". Available: ${Object.keys(SLUG_MAP).join(', ')}`,
        },
        { status: 404 }
      )
    }

    let buffer: Buffer
    if (entry.needsData) {
      const data = await fetchGovernanceData()
      buffer = await entry.generator(data)
    } else {
      buffer = await entry.generator()
    }

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${entry.filename}"`,
        'Cache-Control': entry.needsData
          ? 'no-cache, no-store, must-revalidate'
          : 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('[Docs API] PDF generation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate document' },
      { status: 500 }
    )
  }
}
