export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/sql'

/**
 * Immutable audit log helper
 */
async function logAudit(entity_type: string, entity_id: string, action: string, old_value: any, new_value: any, performed_by: string, reason: string) {
  try {
    await sql.query(`
      INSERT INTO prop_audit_log (entity_type, entity_id, action, old_value, new_value, performed_by, reason)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [entity_type, entity_id, action, JSON.stringify(old_value), JSON.stringify(new_value), performed_by, reason])
  } catch (e) {
    console.error('[audit] Failed to log:', e)
  }
}

/**
 * POST /api/prop-sharing/trades/close
 * Close an open trade and calculate P&L.
 * V2: Auto-lock on daily loss breach, immutable audit log on every state change, phase rollback support
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

    // Check if account is locked out for the day
    const acctRes = await sql.query(`SELECT * FROM prop_accounts WHERE account_id = $1`, [trade.account_id])
    const account = acctRes.rows[0] as any

    if (account.locked_out) {
      return NextResponse.json({
        error: 'Account is locked out for today. Daily loss limit was breached. Trading resumes next session.',
        locked_out_at: account.locked_out_at,
        lock_reason: account.lock_reason,
      }, { status: 403 })
    }

    if (account.status === 'suspended') {
      return NextResponse.json({ error: 'Account is suspended. Contact compliance.' }, { status: 403 })
    }

    // Calculate P&L
    const direction = trade.side === 'long' ? 1 : -1
    const priceDiff = (exit_price - trade.entry_price) * direction
    const rawPnl = priceDiff * trade.quantity
    const totalFees = (fees || 0) + (trade.fees || 0)
    const pnl = rawPnl - totalFees
    const pnlPct = (pnl / (trade.entry_price * trade.quantity)) * 100

    // Capture pre-update state for audit
    const preTradeState = { ...trade }
    const preAccountState = { balance: account.current_balance, drawdown: account.current_drawdown, daily_pnl: account.daily_pnl, phase: account.current_phase }

    // Update trade
    await sql.query(`
      UPDATE prop_trades
      SET exit_price = $1, pnl = $2, pnl_pct = $3, fees = $4, status = 'closed', closed_at = NOW()
      WHERE trade_id = $5
    `, [exit_price, pnl, pnlPct, totalFees, trade_id])

    // Update account balances
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

    // Audit: trade closed
    await logAudit('trade', trade_id, 'trade_closed', preTradeState, { exit_price, pnl, pnl_pct: pnlPct, fees: totalFees }, 'system', `Trade closed at ${exit_price}, P&L: ${pnl.toFixed(2)}`)

    // Fetch program risk rules
    const progRes = await sql.query(`SELECT * FROM prop_programs WHERE program_id = $1`, [account.program_id])
    const program = progRes.rows[0] as any
    const phase = account.current_phase
    const maxDD = phase === 'evaluation' ? program.eval_max_drawdown : program.max_drawdown
    const dailyLimit = phase === 'evaluation' ? program.eval_daily_loss_limit : program.daily_loss_limit
    const startingBal = parseFloat(account.starting_balance)
    const dailyLossPct = startingBal > 0 ? (Math.abs(newDailyPnl) / startingBal) * 100 : 0

    let accountAction = 'none'
    let lockApplied = false

    // Check drawdown breach → SUSPEND + FREEZE
    if (drawdown >= maxDD) {
      await sql.query(`
        INSERT INTO prop_risk_events (account_id, trade_id, rule_violated, severity, description, threshold_value, actual_value, action_taken)
        VALUES ($1, $2, 'max_drawdown', 'critical', $3, $4, $5, 'account_suspended')
      `, [
        trade.account_id, trade_id,
        `Maximum drawdown breached: ${drawdown.toFixed(2)}% (limit: ${maxDD}%)`,
        maxDD, drawdown,
      ])

      // Suspend account immediately
      await sql.query(`
        UPDATE prop_accounts SET status = 'suspended', locked_out = true, locked_out_at = NOW(),
        lock_reason = 'Max drawdown breached — account frozen'
        WHERE account_id = $1
      `, [trade.account_id])

      accountAction = 'suspended'

      // Audit: account suspended
      await logAudit('account', trade.account_id, 'account_suspended', preAccountState, { drawdown, maxDD, newBalance }, 'risk-engine', `Max drawdown breached: ${drawdown.toFixed(2)}% >= ${maxDD}%`)

      // If in evaluation, rollback to phase_1 instead of keeping suspended
      if (phase === 'phase_1' || phase === 'phase_2') {
        await logAudit('account', trade.account_id, 'phase_rollback', { phase }, { phase: 'failed' }, 'risk-engine', 'Evaluation failed due to drawdown breach')
      }
    }
    // Check daily loss limit → AUTO-LOCK (not suspend, just prevent trading for the day)
    else if (newDailyPnl < 0 && dailyLossPct >= dailyLimit) {
      await sql.query(`
        INSERT INTO prop_risk_events (account_id, trade_id, rule_violated, severity, description, threshold_value, actual_value, action_taken)
        VALUES ($1, $2, 'daily_loss_limit', 'critical', $3, $4, $5, 'daily_lockout')
      `, [
        trade.account_id, trade_id,
        `Daily loss limit breached: ${dailyLossPct.toFixed(2)}% of starting balance (limit: ${dailyLimit}%)`,
        dailyLimit, dailyLossPct,
      ])

      // AUTO-LOCK: prevent further trading today
      await sql.query(`
        UPDATE prop_accounts SET locked_out = true, locked_out_at = NOW(),
        lock_reason = $1
        WHERE account_id = $2
      `, [`Daily loss limit hit: -${dailyLossPct.toFixed(2)}% (limit: ${dailyLimit}%)`, trade.account_id])

      lockApplied = true
      accountAction = 'daily_lockout'

      // Audit: daily lockout
      await logAudit('account', trade.account_id, 'daily_lockout', preAccountState, { daily_pnl: newDailyPnl, daily_loss_pct: dailyLossPct, limit: dailyLimit }, 'risk-engine', `Daily loss limit breached — account locked for session`)
    }

    // Check evaluation pass conditions
    if ((phase === 'phase_1' || phase === 'phase_2') && accountAction === 'none') {
      const profitPct = startingBal > 0 ? (newTotalPnl / startingBal) * 100 : 0
      const updatedAcct = await sql.query(`SELECT * FROM prop_accounts WHERE account_id = $1`, [trade.account_id])
      const updated = updatedAcct.rows[0] as any

      if (
        profitPct >= program.eval_profit_target &&
        updated.active_trading_days >= program.eval_min_trading_days &&
        drawdown < maxDD
      ) {
        const nextPhase = phase === 'phase_1' ? 'phase_2' : 'funded'
        await sql.query(`
          UPDATE prop_accounts SET current_phase = $1, updated_at = NOW()
          WHERE account_id = $2
        `, [nextPhase, trade.account_id])

        accountAction = `phase_advanced_to_${nextPhase}`

        // Audit: phase advancement
        await logAudit('account', trade.account_id, 'phase_advanced', { phase }, { phase: nextPhase, profitPct, tradingDays: updated.active_trading_days }, 'risk-engine', `Evaluation passed — advanced to ${nextPhase}`)
      }
    }

    const updatedTrade = await sql.query(`SELECT * FROM prop_trades WHERE trade_id = $1`, [trade_id])

    return NextResponse.json({
      success: true,
      trade: updatedTrade.rows[0],
      account_update: {
        current_balance: newBalance,
        drawdown,
        total_pnl: newTotalPnl,
        daily_pnl: newDailyPnl,
        action: accountAction,
        locked_out: lockApplied || accountAction === 'suspended',
      },
    })
  } catch (error: any) {
    console.error('[API/prop-sharing/trades/close] POST error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
