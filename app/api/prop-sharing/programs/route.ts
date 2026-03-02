export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/sql'

/**
 * GET /api/prop-sharing/programs
 * List all prop trading programs
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const slug = searchParams.get('slug')

  try {
    let query = `SELECT * FROM prop_programs WHERE 1=1`
    const params: any[] = []

    if (status) {
      params.push(status)
      query += ` AND status = $${params.length}`
    }
    if (slug) {
      params.push(slug)
      query += ` AND slug = $${params.length}`
    }

    query += ` ORDER BY funded_capital ASC`

    const result = await sql.query(query, params)
    return NextResponse.json({ success: true, programs: result.rows })
  } catch (error: any) {
    console.error('[API/prop-sharing/programs] GET error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/prop-sharing/programs
 * Create a new prop trading program
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      name, slug, description, commodity_focus, funded_capital, currency,
      eval_duration_days, eval_profit_target, eval_max_drawdown, eval_daily_loss_limit,
      eval_min_trading_days, eval_fee,
      max_drawdown, daily_loss_limit, max_position_size, max_open_positions, leverage_limit,
      scaling_plan, trader_profit_pct, firm_profit_pct,
      payout_frequency, min_payout_amount, first_payout_delay,
    } = body

    if (!name || !slug || !funded_capital) {
      return NextResponse.json({ error: 'name, slug, and funded_capital are required' }, { status: 400 })
    }

    const result = await sql.query(`
      INSERT INTO prop_programs (
        name, slug, description, commodity_focus,
        funded_capital, currency,
        eval_duration_days, eval_profit_target, eval_max_drawdown, eval_daily_loss_limit,
        eval_min_trading_days, eval_fee,
        max_drawdown, daily_loss_limit, max_position_size, max_open_positions, leverage_limit,
        scaling_plan, trader_profit_pct, firm_profit_pct,
        payout_frequency, min_payout_amount, first_payout_delay
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6,
        $7, $8, $9, $10,
        $11, $12,
        $13, $14, $15, $16, $17,
        $18, $19, $20,
        $21, $22, $23
      ) RETURNING *
    `, [
      name, slug, description || null, commodity_focus || null,
      funded_capital, currency || 'USD',
      eval_duration_days || 30, eval_profit_target || 8, eval_max_drawdown || 5, eval_daily_loss_limit || 2,
      eval_min_trading_days || 10, eval_fee || 0,
      max_drawdown || 10, daily_loss_limit || 3, max_position_size || 20, max_open_positions || 5, leverage_limit || 1,
      scaling_plan ? JSON.stringify(scaling_plan) : null, trader_profit_pct || 80, firm_profit_pct || 20,
      payout_frequency || 'monthly', min_payout_amount || 100, first_payout_delay || 30,
    ])

    return NextResponse.json({ success: true, program: result.rows[0] }, { status: 201 })
  } catch (error: any) {
    console.error('[API/prop-sharing/programs] POST error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
