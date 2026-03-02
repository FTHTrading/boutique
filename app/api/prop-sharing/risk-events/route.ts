export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/sql'

/**
 * GET /api/prop-sharing/risk-events
 * List risk events across prop accounts
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const accountId = searchParams.get('account_id')
  const severity = searchParams.get('severity')
  const resolved = searchParams.get('resolved')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)

  try {
    let query = `
      SELECT re.*, pa.trader_name, pa.account_number
      FROM prop_risk_events re
      LEFT JOIN prop_accounts pa ON re.account_id = pa.account_id
      WHERE 1=1
    `
    const params: any[] = []

    if (accountId) { params.push(accountId); query += ` AND re.account_id = $${params.length}` }
    if (severity) { params.push(severity); query += ` AND re.severity = $${params.length}` }
    if (resolved !== null && resolved !== undefined) {
      params.push(resolved === 'true')
      query += ` AND re.resolved = $${params.length}`
    }

    query += ` ORDER BY re.created_at DESC LIMIT $${params.length + 1}`
    params.push(limit)

    const result = await sql.query(query, params)
    return NextResponse.json({ success: true, events: result.rows, count: result.rows.length })
  } catch (error: any) {
    console.error('[API/prop-sharing/risk-events] GET error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/prop-sharing/risk-events/resolve
 * Resolve a risk event
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { event_id, resolved_by, resolution_notes, action_taken } = body

    if (!event_id) {
      return NextResponse.json({ error: 'event_id required' }, { status: 400 })
    }

    const result = await sql.query(`
      UPDATE prop_risk_events SET
        resolved = TRUE,
        resolved_by = $1,
        resolved_at = NOW(),
        resolution_notes = $2,
        action_taken = $3
      WHERE event_id = $4
      RETURNING *
    `, [resolved_by || 'system', resolution_notes || null, action_taken || 'reviewed', event_id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, event: result.rows[0] })
  } catch (error: any) {
    console.error('[API/prop-sharing/risk-events] POST error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
