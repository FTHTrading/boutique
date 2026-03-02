export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/sql'

/**
 * GET /api/prop-sharing/dashboard
 * Aggregate metrics for the prop sharing overview
 */
export async function GET(_req: NextRequest) {
  try {
    const [programs, accounts, payouts, riskEvents] = await Promise.all([
      sql.query(`
        SELECT COUNT(*) AS total,
          COUNT(CASE WHEN status = 'active' THEN 1 END) AS active,
          COALESCE(SUM(funded_capital), 0) AS total_capital
        FROM prop_programs
      `),
      sql.query(`
        SELECT
          COUNT(*) AS total,
          COUNT(CASE WHEN phase = 'evaluation' THEN 1 END) AS evaluation,
          COUNT(CASE WHEN phase = 'verification' THEN 1 END) AS verification,
          COUNT(CASE WHEN phase = 'funded' THEN 1 END) AS funded,
          COUNT(CASE WHEN phase = 'suspended' THEN 1 END) AS suspended,
          COUNT(CASE WHEN phase = 'terminated' THEN 1 END) AS terminated,
          COALESCE(SUM(total_pnl), 0) AS total_pnl,
          COALESCE(SUM(total_payouts), 0) AS total_payouts_distributed,
          CASE WHEN SUM(total_trades) > 0
            THEN ROUND((SUM(winning_trades)::NUMERIC / SUM(total_trades)) * 100, 1)
            ELSE 0 END AS avg_win_rate
        FROM prop_accounts
      `),
      sql.query(`
        SELECT
          COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending,
          COALESCE(SUM(CASE WHEN status = 'paid' THEN trader_payout ELSE 0 END), 0) AS total_paid
        FROM prop_payouts
      `),
      sql.query(`
        SELECT COUNT(CASE WHEN resolved = FALSE THEN 1 END) AS active_events
        FROM prop_risk_events
      `),
    ])

    const p = programs.rows[0] as any
    const a = accounts.rows[0] as any
    const pay = payouts.rows[0] as any
    const r = riskEvents.rows[0] as any

    return NextResponse.json({
      success: true,
      metrics: {
        total_programs: parseInt(p.total),
        active_programs: parseInt(p.active),
        total_funded_capital: parseFloat(p.total_capital),
        total_accounts: parseInt(a.total),
        accounts_by_phase: {
          evaluation: parseInt(a.evaluation),
          verification: parseInt(a.verification),
          funded: parseInt(a.funded),
          suspended: parseInt(a.suspended),
          terminated: parseInt(a.terminated),
        },
        total_pnl: parseFloat(a.total_pnl),
        total_payouts_distributed: parseFloat(a.total_payouts_distributed),
        avg_win_rate: parseFloat(a.avg_win_rate),
        pending_payouts: parseInt(pay.pending),
        total_paid: parseFloat(pay.total_paid),
        active_risk_events: parseInt(r.active_events),
      },
    })
  } catch (error: any) {
    console.error('[API/prop-sharing/dashboard] GET error:', error)
    return NextResponse.json({
      success: true,
      metrics: {
        total_programs: 0, active_programs: 0, total_funded_capital: 0,
        total_accounts: 0, accounts_by_phase: { evaluation: 0, verification: 0, funded: 0, suspended: 0, terminated: 0 },
        total_pnl: 0, total_payouts_distributed: 0, avg_win_rate: 0,
        pending_payouts: 0, total_paid: 0, active_risk_events: 0,
      },
    })
  }
}
