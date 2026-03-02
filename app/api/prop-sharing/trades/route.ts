export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/sql'

/**
 * GET /api/prop-sharing/trades
 * List trades for a specific prop account
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const accountId = searchParams.get('account_id')
  const status = searchParams.get('status')
  const commodity = searchParams.get('commodity')
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500)
  const offset = parseInt(searchParams.get('offset') || '0')

  if (!accountId) {
    return NextResponse.json({ error: 'account_id is required' }, { status: 400 })
  }

  try {
    let query = `SELECT * FROM prop_trades WHERE account_id = $1`
    const params: any[] = [accountId]

    if (status) { params.push(status); query += ` AND status = $${params.length}` }
    if (commodity) { params.push(commodity); query += ` AND commodity ILIKE $${params.length}` }

    query += ` ORDER BY opened_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, offset)

    const result = await sql.query(query, params)
    return NextResponse.json({ success: true, trades: result.rows, count: result.rows.length })
  } catch (error: any) {
    console.error('[API/prop-sharing/trades] GET error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/prop-sharing/trades
 * Record a new trade in a prop account
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      account_id, commodity, side, quantity, quantity_unit,
      entry_price, stop_loss, take_profit, notes,
    } = body

    if (!account_id || !commodity || !side || !quantity || !entry_price) {
      return NextResponse.json({ error: 'account_id, commodity, side, quantity, entry_price required' }, { status: 400 })
    }

    // Verify account exists and is in a tradeable phase
    const acctRes = await sql.query(`SELECT * FROM prop_accounts WHERE account_id = $1`, [account_id])
    if (acctRes.rows.length === 0) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }
    const account = acctRes.rows[0] as any
    if (!['evaluation', 'funded'].includes(account.phase)) {
      return NextResponse.json({ error: `Account is in '${account.phase}' phase - trading not allowed` }, { status: 400 })
    }

    // Check max open positions
    const openRes = await sql.query(
      `SELECT COUNT(*) AS cnt FROM prop_trades WHERE account_id = $1 AND status = 'open'`,
      [account_id]
    )
    const openCount = parseInt((openRes.rows[0] as any).cnt)

    // Fetch program rules
    const progRes = await sql.query(`SELECT * FROM prop_programs WHERE program_id = $1`, [account.program_id])
    const program = progRes.rows[0] as any
    if (program.max_open_positions && openCount >= program.max_open_positions) {
      return NextResponse.json({ error: `Maximum open positions (${program.max_open_positions}) reached` }, { status: 400 })
    }

    // Calculate position size %
    const positionValue = quantity * entry_price
    const positionSizePct = (positionValue / account.current_balance) * 100

    // Generate trade number
    const countRes = await sql.query(`SELECT COUNT(*) AS cnt FROM prop_trades`)
    const seq = parseInt((countRes.rows[0] as any).cnt) + 1
    const tradeNumber = `PT-${new Date().getFullYear()}-${String(seq).padStart(5, '0')}`

    // Risk-reward ratio
    let rrRatio = null
    if (stop_loss && take_profit) {
      const risk = Math.abs(entry_price - stop_loss)
      const reward = Math.abs(take_profit - entry_price)
      rrRatio = risk > 0 ? (reward / risk) : null
    }

    const result = await sql.query(`
      INSERT INTO prop_trades (
        account_id, trade_number, commodity, side, quantity, quantity_unit,
        entry_price, stop_loss, take_profit, status,
        position_size_pct, risk_reward_ratio, notes
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, 'open',
        $10, $11, $12
      ) RETURNING *
    `, [
      account_id, tradeNumber, commodity, side, quantity, quantity_unit || 'lots',
      entry_price, stop_loss || null, take_profit || null,
      positionSizePct, rrRatio, notes || null,
    ])

    // Check if position size exceeds limit (log risk event but allow trade)
    if (program.max_position_size && positionSizePct > program.max_position_size) {
      await sql.query(`
        INSERT INTO prop_risk_events (account_id, trade_id, rule_violated, severity, description, threshold_value, actual_value)
        VALUES ($1, $2, 'max_position_size', 'warning', $3, $4, $5)
      `, [
        account_id, result.rows[0].trade_id,
        `Position size ${positionSizePct.toFixed(2)}% exceeds limit of ${program.max_position_size}%`,
        program.max_position_size, positionSizePct,
      ])
    }

    return NextResponse.json({ success: true, trade: result.rows[0] }, { status: 201 })
  } catch (error: any) {
    console.error('[API/prop-sharing/trades] POST error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
