export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/sql'

/**
 * GET /api/prop-sharing/treasury
 * Fetch treasury ledger entries with summary
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const account_id = searchParams.get('account_id')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    let where = 'WHERE 1=1'
    const params: any[] = []

    if (type) {
      params.push(type)
      where += ` AND t.entry_type = $${params.length}`
    }
    if (account_id) {
      params.push(account_id)
      where += ` AND t.account_id = $${params.length}`
    }

    params.push(limit, offset)

    const entries = await sql.query(`
      SELECT t.*,
        a.account_number, a.trader_name,
        p.name as program_name
      FROM prop_treasury_ledger t
      LEFT JOIN prop_accounts a ON t.account_id = a.account_id
      LEFT JOIN prop_programs p ON t.program_id = p.program_id
      ${where}
      ORDER BY t.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params)

    // Summary aggregations
    const summary = await sql.query(`
      SELECT
        COALESCE(SUM(CASE WHEN entry_type = 'capital_allocated' THEN amount ELSE 0 END), 0) as total_capital_allocated,
        COALESCE(SUM(CASE WHEN entry_type = 'capital_returned' THEN amount ELSE 0 END), 0) as total_capital_returned,
        COALESCE(SUM(CASE WHEN entry_type = 'trader_payout' THEN amount ELSE 0 END), 0) as total_trader_payouts,
        COALESCE(SUM(CASE WHEN entry_type = 'firm_revenue' THEN amount ELSE 0 END), 0) as total_firm_revenue,
        COALESCE(SUM(CASE WHEN entry_type = 'eval_fee_received' THEN amount ELSE 0 END), 0) as total_eval_fees,
        COALESCE(SUM(CASE WHEN entry_type = 'loss_absorbed' THEN amount ELSE 0 END), 0) as total_losses_absorbed,
        COALESCE(SUM(CASE WHEN direction = 'credit' THEN amount ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN direction = 'debit' THEN amount ELSE 0 END), 0) as net_position,
        COUNT(*) as entry_count
      FROM prop_treasury_ledger
    `)

    const s = summary.rows[0]

    return NextResponse.json({
      success: true,
      entries: entries.rows,
      summary: {
        total_capital_allocated: Number(s.total_capital_allocated),
        total_capital_returned: Number(s.total_capital_returned),
        net_capital_deployed: Number(s.total_capital_allocated) - Number(s.total_capital_returned),
        total_trader_payouts: Number(s.total_trader_payouts),
        total_firm_revenue: Number(s.total_firm_revenue),
        total_eval_fees: Number(s.total_eval_fees),
        total_losses_absorbed: Number(s.total_losses_absorbed),
        net_position: Number(s.net_position),
        entry_count: Number(s.entry_count),
      },
    })
  } catch (error: any) {
    console.error('[API/prop-sharing/treasury] GET error:', error)
    return NextResponse.json({ success: true, entries: [], summary: { total_capital_allocated: 0, total_capital_returned: 0, net_capital_deployed: 0, total_trader_payouts: 0, total_firm_revenue: 0, total_eval_fees: 0, total_losses_absorbed: 0, net_position: 0, entry_count: 0 } })
  }
}

/**
 * POST /api/prop-sharing/treasury
 * Record a treasury entry (immutable)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { entry_type, account_id, payout_id, program_id, amount, direction, description, reference, performed_by, metadata } = body

    if (!entry_type || !amount || !direction || !description) {
      return NextResponse.json({ error: 'entry_type, amount, direction, description required' }, { status: 400 })
    }

    // Calculate running balance
    const lastEntry = await sql.query(`
      SELECT running_balance FROM prop_treasury_ledger ORDER BY created_at DESC LIMIT 1
    `)
    const prevBalance = lastEntry.rows.length > 0 ? Number(lastEntry.rows[0].running_balance) : 0
    const running_balance = direction === 'credit' ? prevBalance + Number(amount) : prevBalance - Number(amount)

    const result = await sql.query(`
      INSERT INTO prop_treasury_ledger (entry_type, account_id, payout_id, program_id, amount, direction, description, reference, performed_by, metadata, running_balance)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [entry_type, account_id || null, payout_id || null, program_id || null, amount, direction, description, reference || null, performed_by || 'system', JSON.stringify(metadata || {}), running_balance])

    // Also log to audit
    await sql.query(`
      INSERT INTO prop_audit_log (entity_type, entity_id, action, new_value, performed_by, reason)
      VALUES ('treasury', $1, 'ledger_entry', $2, $3, $4)
    `, [result.rows[0].entry_id, JSON.stringify(result.rows[0]), performed_by || 'system', description])

    return NextResponse.json({ success: true, entry: result.rows[0] })
  } catch (error: any) {
    console.error('[API/prop-sharing/treasury] POST error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
