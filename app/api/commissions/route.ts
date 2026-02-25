export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/sql'

// GET /api/commissions?member_id=&status=&period=&limit=
export async function GET(req: NextRequest) {
  const p = new URL(req.url).searchParams
  const memberId = p.get('member_id')
  const status = p.get('status')
  const period = p.get('period')
  const limit = parseInt(p.get('limit') || '100')

  try {
    // Build summary stats
    const summaryWhere = memberId ? `WHERE member_id = '${memberId}'` : ''
    const summary = await sql.query(`
      SELECT
        COALESCE(SUM(commission_usd) FILTER (WHERE status = 'paid'), 0) as total_paid,
        COALESCE(SUM(commission_usd) FILTER (WHERE status = 'pending'), 0) as total_pending,
        COALESCE(SUM(commission_usd) FILTER (WHERE status = 'approved'), 0) as total_approved,
        COALESCE(SUM(commission_usd) FILTER (WHERE period_month = TO_CHAR(CURRENT_DATE, 'YYYY-MM')), 0) as this_month,
        COALESCE(SUM(commission_usd) FILTER (WHERE period_month LIKE CONCAT(EXTRACT(YEAR FROM CURRENT_DATE)::TEXT, '%')), 0) as ytd,
        COUNT(*) as total_records
      FROM commissions ${summaryWhere}
    `)

    // Build item list
    const conditions: string[] = []
    if (memberId) conditions.push(`member_id = '${memberId}'`)
    if (status) conditions.push(`status = '${status}'`)
    if (period) conditions.push(`period_month = '${period}'`)
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const items = await sql.query(`
      SELECT
        c.*,
        tm.full_name as member_full_name,
        tm.email as member_email,
        tm.role as member_role
      FROM commissions c
      LEFT JOIN team_members tm ON c.member_id = tm.member_id
      ${where}
      ORDER BY c.created_at DESC
      LIMIT ${limit}
    `)

    return NextResponse.json({
      summary: summary.rows[0],
      commissions: items.rows,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message, summary: null, commissions: [] }, { status: 500 })
  }
}

// POST /api/commissions — create a commission record
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      deal_id, member_id, member_name, deal_number, client_name, commodity,
      commission_type = 'deal_close', deal_value_usd, rate_pct, commission_usd,
      period_month, notes,
    } = body

    if (!member_id || !member_name || !commission_usd) {
      return NextResponse.json({ error: 'member_id, member_name, commission_usd are required' }, { status: 400 })
    }

    const result = await sql.query(`
      INSERT INTO commissions
        (deal_id, member_id, member_name, deal_number, client_name, commodity,
         commission_type, deal_value_usd, rate_pct, commission_usd, period_month, notes, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'pending')
      RETURNING *
    `, [
      deal_id || null, member_id, member_name, deal_number || null, client_name || null, commodity || null,
      commission_type, deal_value_usd || null, rate_pct || null, commission_usd,
      period_month || new Date().toISOString().slice(0, 7), notes || null,
    ])

    return NextResponse.json({ commission: result.rows[0] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// PATCH /api/commissions — update status (approve/pay/dispute)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { commission_id, status, approved_by, payment_ref, notes } = body

    if (!commission_id || !status) {
      return NextResponse.json({ error: 'commission_id and status required' }, { status: 400 })
    }

    const validStatuses = ['pending', 'approved', 'paid', 'disputed', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 })
    }

    const result = await sql.query(`
      UPDATE commissions SET
        status = $1,
        approved_by = COALESCE($2, approved_by),
        approved_at = CASE WHEN $1 = 'approved' THEN NOW() ELSE approved_at END,
        paid_at = CASE WHEN $1 = 'paid' THEN NOW() ELSE paid_at END,
        payment_ref = COALESCE($3, payment_ref),
        notes = COALESCE($4, notes),
        updated_at = NOW()
      WHERE commission_id = $5
      RETURNING *
    `, [status, approved_by || null, payment_ref || null, notes || null, commission_id])

    if (!result.rows.length) {
      return NextResponse.json({ error: 'Commission not found' }, { status: 404 })
    }

    return NextResponse.json({ commission: result.rows[0] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
