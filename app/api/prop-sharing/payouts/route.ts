export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/sql'

/**
 * GET /api/prop-sharing/payouts
 * List payouts with optional filters
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const accountId = searchParams.get('account_id')
  const status = searchParams.get('status')
  const period = searchParams.get('period')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
  const offset = parseInt(searchParams.get('offset') || '0')

  try {
    let query = `
      SELECT p.*, pa.trader_name, pa.account_number, pp.name AS program_name
      FROM prop_payouts p
      LEFT JOIN prop_accounts pa ON p.account_id = pa.account_id
      LEFT JOIN prop_programs pp ON p.program_id = pp.program_id
      WHERE 1=1
    `
    const params: any[] = []

    if (accountId) { params.push(accountId); query += ` AND p.account_id = $${params.length}` }
    if (status) { params.push(status); query += ` AND p.status = $${params.length}` }
    if (period) { params.push(period); query += ` AND p.period_label = $${params.length}` }

    query += ` ORDER BY p.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, offset)

    const result = await sql.query(query, params)
    return NextResponse.json({ success: true, payouts: result.rows, count: result.rows.length })
  } catch (error: any) {
    console.error('[API/prop-sharing/payouts] GET error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/prop-sharing/payouts
 * Create a payout for a funded account
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { account_id, period_start, period_end, period_label } = body

    if (!account_id || !period_start || !period_end) {
      return NextResponse.json({ error: 'account_id, period_start, period_end required' }, { status: 400 })
    }

    // Fetch account + program
    const acctRes = await sql.query(`
      SELECT pa.*, pp.trader_profit_pct, pp.firm_profit_pct, pp.min_payout_amount, pp.name AS program_name
      FROM prop_accounts pa
      JOIN prop_programs pp ON pa.program_id = pp.program_id
      WHERE pa.account_id = $1
    `, [account_id])
    if (acctRes.rows.length === 0) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }
    const account = acctRes.rows[0] as any

    if (account.phase !== 'funded') {
      return NextResponse.json({ error: 'Payouts only for funded accounts' }, { status: 400 })
    }

    // Calculate profit in period from closed trades
    const tradesRes = await sql.query(`
      SELECT COALESCE(SUM(pnl), 0) AS gross_profit
      FROM prop_trades
      WHERE account_id = $1 AND status = 'closed'
        AND closed_at >= $2 AND closed_at <= $3
    `, [account_id, period_start, period_end])
    const grossProfit = parseFloat((tradesRes.rows[0] as any).gross_profit)

    if (grossProfit <= 0) {
      return NextResponse.json({ error: 'No profit in this period' }, { status: 400 })
    }

    const traderPct = parseFloat(account.trader_profit_pct)
    const firmPct = parseFloat(account.firm_profit_pct)
    const traderPayout = grossProfit * (traderPct / 100)
    const firmShare = grossProfit * (firmPct / 100)

    if (account.min_payout_amount && traderPayout < account.min_payout_amount) {
      return NextResponse.json({
        error: `Payout $${traderPayout.toFixed(2)} below minimum $${account.min_payout_amount}`
      }, { status: 400 })
    }

    const result = await sql.query(`
      INSERT INTO prop_payouts (
        account_id, program_id, period_start, period_end, period_label,
        gross_profit, trader_share_pct, trader_payout, firm_share, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
      RETURNING *
    `, [
      account_id, account.program_id, period_start, period_end, period_label || null,
      grossProfit, traderPct, traderPayout, firmShare,
    ])

    return NextResponse.json({ success: true, payout: result.rows[0] }, { status: 201 })
  } catch (error: any) {
    console.error('[API/prop-sharing/payouts] POST error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
