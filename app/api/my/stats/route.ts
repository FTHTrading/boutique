export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/sql'

// GET /api/my/stats?email= (email used as identity key if no Clerk)
export async function GET(req: NextRequest) {
  const p = new URL(req.url).searchParams
  const email = p.get('email')
  const clerkUserId = p.get('clerk_user_id')

  try {
    // Resolve team member
    let member = null
    if (clerkUserId) {
      const r = await sql.query(`SELECT * FROM team_members WHERE clerk_user_id = $1 LIMIT 1`, [clerkUserId])
      member = r.rows[0] || null
    }
    if (!member && email) {
      const r = await sql.query(`SELECT * FROM team_members WHERE email = $1 LIMIT 1`, [email])
      member = r.rows[0] || null
    }

    const assignedTo = email || ''
    const memberId = member?.member_id || null

    // Deals assigned to this person
    const dealsResult = await sql.query(`
      SELECT
        COUNT(*) FILTER (WHERE status NOT IN ('closed_won','closed_lost')) as active_count,
        COUNT(*) FILTER (WHERE status = 'closed_won') as won_count,
        COUNT(*) FILTER (WHERE status = 'closed_lost') as lost_count,
        COALESCE(SUM(deal_value_usd) FILTER (WHERE status NOT IN ('closed_won','closed_lost')), 0) as pipeline_value,
        COALESCE(SUM(deal_value_usd) FILTER (WHERE status = 'closed_won'), 0) as won_value
      FROM deals
      WHERE assigned_to = $1
    `, [assignedTo])

    // Contacts
    const contactsResult = await sql.query(`SELECT COUNT(*) as total FROM contacts`)

    // Commissions
    const commissionResult = memberId ? await sql.query(`
      SELECT
        COALESCE(SUM(commission_usd) FILTER (WHERE status IN ('approved','paid')), 0) as total_earned,
        COALESCE(SUM(commission_usd) FILTER (WHERE status = 'pending'), 0) as pending,
        COALESCE(SUM(commission_usd) FILTER (
          WHERE status IN ('approved','paid')
          AND period_month = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
        ), 0) as this_month,
        COALESCE(SUM(commission_usd) FILTER (
          WHERE status IN ('approved','paid')
          AND period_month LIKE CONCAT(EXTRACT(YEAR FROM CURRENT_DATE)::TEXT, '%')
        ), 0) as ytd
      FROM commissions
      WHERE member_id = $1
    `, [memberId]) : { rows: [{ total_earned: 0, pending: 0, this_month: 0, ytd: 0 }] }

    // Recent deals (last 5)
    const recentDeals = await sql.query(`
      SELECT deal_id, deal_number, client_name, commodity, deal_value_usd, status, compliance_status, created_at
      FROM deals
      WHERE assigned_to = $1
      ORDER BY created_at DESC
      LIMIT 5
    `, [assignedTo])

    // Recent commissions (last 5)
    const recentCommissions = memberId ? await sql.query(`
      SELECT commission_id, deal_number, client_name, commodity, commission_usd, rate_pct, status, period_month, created_at
      FROM commissions
      WHERE member_id = $1
      ORDER BY created_at DESC
      LIMIT 5
    `, [memberId]) : { rows: [] }

    // Contracts awaiting action (pending, sent)
    const pendingContracts = await sql.query(`
      SELECT contract_id, contract_number, contract_type, party_b_name, status, created_at
      FROM contracts
      WHERE status IN ('draft','sent','pending_signature')
      ORDER BY created_at DESC
      LIMIT 5
    `)

    // Unresolved compliance flags
    const flagsResult = await sql.query(`
      SELECT COUNT(*) FILTER (WHERE severity IN ('CRITICAL','HIGH') AND resolved = false) as urgent,
             COUNT(*) FILTER (WHERE resolved = false) as total_unresolved
      FROM compliance_flags
    `)

    return NextResponse.json({
      member,
      deals: dealsResult.rows[0],
      contacts: contactsResult.rows[0],
      commissions: commissionResult.rows[0],
      recentDeals: recentDeals.rows,
      recentCommissions: recentCommissions.rows,
      pendingContracts: pendingContracts.rows,
      flags: flagsResult.rows[0],
    })
  } catch (err: any) {
    // Return zeros if DB not connected
    return NextResponse.json({
      member: null,
      deals: { active_count: 0, won_count: 0, lost_count: 0, pipeline_value: 0, won_value: 0 },
      contacts: { total: 0 },
      commissions: { total_earned: 0, pending: 0, this_month: 0, ytd: 0 },
      recentDeals: [],
      recentCommissions: [],
      pendingContracts: [],
      flags: { urgent: 0, total_unresolved: 0 },
      _error: err.message,
    })
  }
}
