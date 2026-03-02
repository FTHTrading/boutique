export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/sql'

/**
 * POST /api/prop-sharing/trades/close
 * Close an open trade and calculate P&L
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { trade_id, exit_price, fees } = body

    if (!trade_id || exit_price == null) {
      return NextResponse.json({ error: 'trade_id and exit_price required' }, { status: 400 })
    }

    // Get the trade
    const tradeRes = await sql.query(`SELECT * FROM prop_trades WHERE trade_id = $1`, [trade_id])
    if (tradeRes.rows.length === 0) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 })
    }
    const trade = tradeRes.rows[0] as any
    if (trade.status !== 'open') {
      return NextResponse.json({ error: 'Trade is not open' }, { status: 400 })
    }

    // Calculate P&L
    const direction = trade.side === 'long' ? 1 : -1
    const priceDiff = (exit_price - trade.entry_price) * direction
    const rawPnl = priceDiff * trade.quantity
    const totalFees = (fees || 0) + (trade.fees || 0)
    const pnl = rawPnl - totalFees
    const pnlPct = (pnl / (trade.entry_price * trade.quantity)) * 100

    // Update trade
    await sql.query(`
      UPDATE prop_trades
      SET exit_price = $1, pnl = $2, pnl_pct = $3, fees = $4, status = 'closed', closed_at = NOW()
      WHERE trade_id = $5
    `, [exit_price, pnl, pnlPct, totalFees, trade_id])

    // Update account balances
    const acctRes = await sql.query(`SELECT * FROM prop_accounts WHERE account_id = $1`, [trade.account_id])
    const account = acctRes.rows[0] as any
    const newBalance = parseFloat(account.current_balance) + pnl
    const newTotalPnl = parseFloat(account.total_pnl) + pnl
    const newPeak = Math.max(parseFloat(account.peak_balance), newBalance)
    const drawdown = newPeak > 0 ? ((newPeak - newBalance) / newPeak) * 100 : 0
    const newDailyPnl = parseFloat(account.daily_pnl) + pnl
    const isWin = pnl > 0

    await sql.query(`
      UPDATE prop_accounts SET
        current_balance = $1,
        peak_balance = $2,
        current_drawdown = $3,
        daily_pnl = daily_pnl + $4,
        total_pnl = $5,
        total_trades = total_trades + 1,
        winning_trades = winning_trades + $6,
        losing_trades = losing_trades + $7,
        updated_at = NOW()
      WHERE account_id = $8
    `, [
      newBalance, newPeak, drawdown, pnl, newTotalPnl,
      isWin ? 1 : 0, isWin ? 0 : 1,
      trade.account_id,
    ])

    // Fetch program risk rules
    const progRes = await sql.query(`SELECT * FROM prop_programs WHERE program_id = $1`, [account.program_id])
    const program = progRes.rows[0] as any
    const phase = account.phase
    const maxDD = phase === 'evaluation' ? program.eval_max_drawdown : program.max_drawdown
    const dailyLimit = phase === 'evaluation' ? program.eval_daily_loss_limit : program.daily_loss_limit
    const dailyLossPct = Math.abs(newDailyPnl / parseFloat(account.starting_capital)) * 100

    // Check drawdown breach
    if (drawdown >= maxDD) {
      await sql.query(`
        INSERT INTO prop_risk_events (account_id, trade_id, rule_violated, severity, description, threshold_value, actual_value, action_taken)
        VALUES ($1, $2, 'max_drawdown', 'critical', $3, $4, $5, 'account_suspended')
      `, [
        trade.account_id, trade_id,
        `Maximum drawdown breached: ${drawdown.toFixed(2)}% (limit: ${maxDD}%)`,
        maxDD, drawdown,
      ])
      // Suspend account
      await sql.query(`
        UPDATE prop_accounts SET phase = 'suspended', suspended_at = NOW(),
        suspension_reason = 'Max drawdown breached' WHERE account_id = $1
      `, [trade.account_id])
    }

    // Check daily loss limit
    if (newDailyPnl < 0 && dailyLossPct >= dailyLimit) {
      await sql.query(`
        INSERT INTO prop_risk_events (account_id, trade_id, rule_violated, severity, description, threshold_value, actual_value, action_taken)
        VALUES ($1, $2, 'daily_loss_limit', 'breach', $3, $4, $5, 'warning_issued')
      `, [
        trade.account_id, trade_id,
        `Daily loss limit reached: ${dailyLossPct.toFixed(2)}% (limit: ${dailyLimit}%)`,
        dailyLimit, dailyLossPct,
      ])
    }

    // Check evaluation pass conditions
    if (phase === 'evaluation') {
      const profitPct = (newTotalPnl / parseFloat(account.starting_capital)) * 100
      const updatedAcct = await sql.query(`SELECT * FROM prop_accounts WHERE account_id = $1`, [trade.account_id])
      const updated = updatedAcct.rows[0] as any
      if (
        profitPct >= program.eval_profit_target &&
        updated.active_trading_days >= program.eval_min_trading_days &&
        drawdown < maxDD
      ) {
        await sql.query(`
          UPDATE prop_accounts SET phase = 'verification', eval_passed = true, eval_passed_at = NOW()
          WHERE account_id = $1
        `, [trade.account_id])
      }
    }

    const updatedTrade = await sql.query(`SELECT * FROM prop_trades WHERE trade_id = $1`, [trade_id])

    return NextResponse.json({
      success: true,
      trade: updatedTrade.rows[0],
      account_update: { current_balance: newBalance, drawdown, total_pnl: newTotalPnl },
    })
  } catch (error: any) {
    console.error('[API/prop-sharing/trades/close] POST error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
