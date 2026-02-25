export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/sql'

// GET /api/team/members?role=&active=
export async function GET(req: NextRequest) {
  const p = new URL(req.url).searchParams
  const role = p.get('role')
  const active = p.get('active')

  try {
    const conditions: string[] = []
    if (role) conditions.push(`tm.role = '${role}'`)
    if (active !== null && active !== undefined) conditions.push(`tm.active = ${active === 'false' ? 'false' : 'true'}`)
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : 'WHERE tm.active = true'

    const membersResult = await sql.query(`
      SELECT
        tm.*,
        COUNT(DISTINCT d.deal_id) FILTER (WHERE d.status NOT IN ('closed_won','closed_lost')) as active_deals,
        COUNT(DISTINCT d.deal_id) FILTER (WHERE d.status = 'closed_won') as won_deals,
        COALESCE(SUM(d.deal_value_usd) FILTER (WHERE d.status NOT IN ('closed_won','closed_lost')), 0) as pipeline_value,
        COALESCE(SUM(c.commission_usd) FILTER (WHERE c.status IN ('approved','paid')), 0) as total_commission_earned,
        COALESCE(SUM(c.commission_usd) FILTER (WHERE c.status = 'pending'), 0) as commission_pending,
        COALESCE(SUM(c.commission_usd) FILTER (
          WHERE c.status IN ('approved','paid')
          AND c.period_month = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
        ), 0) as commission_this_month
      FROM team_members tm
      LEFT JOIN deals d ON d.assigned_to = tm.email ${where.replace('WHERE', 'AND')}
      LEFT JOIN commissions c ON c.member_id = tm.member_id
      ${where}
      GROUP BY tm.member_id
      ORDER BY tm.full_name
    `)

    return NextResponse.json({ members: membersResult.rows })
  } catch (err: any) {
    return NextResponse.json({ error: err.message, members: [] }, { status: 500 })
  }
}

// POST /api/team/members — create or sync a team member
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { full_name, email, role = 'sales', title, clerk_user_id, default_commission_pct = 2.00 } = body

    if (!full_name || !email) {
      return NextResponse.json({ error: 'full_name and email are required' }, { status: 400 })
    }

    const result = await sql.query(`
      INSERT INTO team_members (full_name, email, role, title, clerk_user_id, default_commission_pct)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        title = EXCLUDED.title,
        clerk_user_id = COALESCE(EXCLUDED.clerk_user_id, team_members.clerk_user_id),
        updated_at = NOW()
      RETURNING *
    `, [full_name, email, role, title || null, clerk_user_id || null, default_commission_pct])

    return NextResponse.json({ member: result.rows[0] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
