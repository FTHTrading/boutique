export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/sql'

/**
 * GET /api/prop-sharing/performance
 * Fetch performance metrics for accounts
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const account_id = searchParams.get('account_id')
    const sort = searchParams.get('sort') || 'sharpe_ratio'
    const order = searchParams.get('order') || 'DESC'

    const validSorts = ['sharpe_ratio', 'sortino_ratio', 'calmar_ratio', 'max_drawdown_pct', 'win_rate', 'profit_factor', 'expectancy', 'total_pnl']
    const sortCol = validSorts.includes(sort) ? sort : 'sharpe_ratio'
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'

    let where = 'WHERE 1=1'
    const params: any[] = []

    if (account_id) {
      params.push(account_id)
      where += ` AND pm.account_id = $${params.length}`
    }

    const result = await sql.query(`
      SELECT pm.*,
        a.account_number, a.trader_name, a.current_phase, a.status as account_status,
        p.name as program_name
      FROM prop_performance_metrics pm
      JOIN prop_accounts a ON pm.account_id = a.account_id
      JOIN prop_programs p ON a.program_id = p.program_id
      ${where}
      ORDER BY ${sortCol} ${sortOrder} NULLS LAST
    `, params)

    return NextResponse.json({
      success: true,
      metrics: result.rows,
    })
  } catch (error: any) {
    console.error('[API/prop-sharing/performance] GET error:', error)
    return NextResponse.json({ success: true, metrics: [] })
  }
}

/**
 * POST /api/prop-sharing/performance/calculate
 * Recalculate performance metrics for an account (or all accounts)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { account_id } = body

    let accountIds: string[] = []

    if (account_id) {
      accountIds = [account_id]
    } else {
      const allActive = await sql.query(`SELECT account_id FROM prop_accounts WHERE status IN ('active', 'funded')`)
      accountIds = allActive.rows.map((r: any) => r.account_id)
    }

    const results: any[] = []

    for (const aid of accountIds) {
      // Get all closed trades for this account
      const trades = await sql.query(`
        SELECT * FROM prop_trades
        WHERE account_id = $1 AND status = 'closed'
        ORDER BY closed_at ASC
      `, [aid])

      if (trades.rows.length === 0) continue

      const pnls = trades.rows.map((t: any) => Number(t.pnl))
      const totalTrades = pnls.length
      const wins = pnls.filter((p: number) => p > 0)
      const losses = pnls.filter((p: number) => p < 0)
      const totalPnl = pnls.reduce((s: number, p: number) => s + p, 0)
      const avgWin = wins.length > 0 ? wins.reduce((s: number, p: number) => s + p, 0) / wins.length : 0
      const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s: number, p: number) => s + p, 0) / losses.length) : 0
      const winRate = totalTrades > 0 ? wins.length / totalTrades : 0
      const lossRate = 1 - winRate
      const profitFactor = losses.length > 0 ? Math.abs(wins.reduce((s: number, p: number) => s + p, 0)) / Math.abs(losses.reduce((s: number, p: number) => s + p, 0)) : wins.length > 0 ? Infinity : 0
      const expectancy = (winRate * avgWin) - (lossRate * avgLoss)

      // Kelly Criterion: f = (bp - q) / b where b = avgWin/avgLoss, p = winRate, q = lossRate
      let kellyCriterion = 0
      if (avgLoss > 0 && winRate > 0) {
        const b = avgWin / avgLoss
        kellyCriterion = Math.max(0, (b * winRate - lossRate) / b)
      }

      // Maximum drawdown
      let peak = 0
      let maxDd = 0
      let maxDdPct = 0
      let cumulative = 0
      const account = await sql.query(`SELECT starting_balance FROM prop_accounts WHERE account_id = $1`, [aid])
      const startBal = Number(account.rows[0]?.starting_balance || 0)

      for (const p of pnls) {
        cumulative += p
        const bal = startBal + cumulative
        if (bal > peak) peak = bal
        const dd = peak - bal
        if (dd > maxDd) {
          maxDd = dd
          maxDdPct = peak > 0 ? (dd / peak) * 100 : 0
        }
      }

      // Sharpe Ratio (annualized, assuming ~252 trading days)
      const meanReturn = pnls.reduce((s: number, p: number) => s + p, 0) / totalTrades
      const variance = pnls.reduce((s: number, p: number) => s + Math.pow(p - meanReturn, 2), 0) / totalTrades
      const stdDev = Math.sqrt(variance)
      const sharpeRatio = stdDev > 0 ? (meanReturn / stdDev) * Math.sqrt(252) : 0

      // Sortino Ratio (only downside deviation)
      const downsideReturns = pnls.filter((p: number) => p < 0)
      const downsideVariance = downsideReturns.length > 0
        ? downsideReturns.reduce((s: number, p: number) => s + Math.pow(p, 2), 0) / totalTrades
        : 0
      const downsideDev = Math.sqrt(downsideVariance)
      const sortinoRatio = downsideDev > 0 ? (meanReturn / downsideDev) * Math.sqrt(252) : 0

      // Calmar Ratio (annualized return / max drawdown)
      const annualizedReturn = meanReturn * 252
      const calmarRatio = maxDd > 0 ? annualizedReturn / maxDd : 0

      // Streaks
      let currentStreak = 0
      let longestWinStreak = 0
      let longestLoseStreak = 0
      let tmpWin = 0
      let tmpLose = 0
      for (const p of pnls) {
        if (p > 0) {
          tmpWin++
          tmpLose = 0
          if (tmpWin > longestWinStreak) longestWinStreak = tmpWin
        } else if (p < 0) {
          tmpLose++
          tmpWin = 0
          if (tmpLose > longestLoseStreak) longestLoseStreak = tmpLose
        }
      }
      // Current streak
      for (let i = pnls.length - 1; i >= 0; i--) {
        if (i === pnls.length - 1) {
          currentStreak = pnls[i] > 0 ? 1 : -1
        } else {
          if (pnls[i] > 0 && currentStreak > 0) currentStreak++
          else if (pnls[i] < 0 && currentStreak < 0) currentStreak--
          else break
        }
      }

      // First and last trade dates
      const firstTradeDate = trades.rows[0].opened_at
      const lastTradeDate = trades.rows[trades.rows.length - 1].closed_at

      // Upsert metrics
      const metrics = await sql.query(`
        INSERT INTO prop_performance_metrics (
          account_id, period_start, period_end, total_trades, winning_trades, losing_trades,
          total_pnl, avg_win, avg_loss, largest_win, largest_loss,
          win_rate, profit_factor, expectancy, kelly_criterion,
          sharpe_ratio, sortino_ratio, calmar_ratio,
          max_drawdown, max_drawdown_pct,
          longest_win_streak, longest_lose_streak, current_streak,
          calculated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11,
          $12, $13, $14, $15,
          $16, $17, $18,
          $19, $20,
          $21, $22, $23,
          NOW()
        )
        ON CONFLICT (account_id) DO UPDATE SET
          period_start = EXCLUDED.period_start,
          period_end = EXCLUDED.period_end,
          total_trades = EXCLUDED.total_trades,
          winning_trades = EXCLUDED.winning_trades,
          losing_trades = EXCLUDED.losing_trades,
          total_pnl = EXCLUDED.total_pnl,
          avg_win = EXCLUDED.avg_win,
          avg_loss = EXCLUDED.avg_loss,
          largest_win = EXCLUDED.largest_win,
          largest_loss = EXCLUDED.largest_loss,
          win_rate = EXCLUDED.win_rate,
          profit_factor = EXCLUDED.profit_factor,
          expectancy = EXCLUDED.expectancy,
          kelly_criterion = EXCLUDED.kelly_criterion,
          sharpe_ratio = EXCLUDED.sharpe_ratio,
          sortino_ratio = EXCLUDED.sortino_ratio,
          calmar_ratio = EXCLUDED.calmar_ratio,
          max_drawdown = EXCLUDED.max_drawdown,
          max_drawdown_pct = EXCLUDED.max_drawdown_pct,
          longest_win_streak = EXCLUDED.longest_win_streak,
          longest_lose_streak = EXCLUDED.longest_lose_streak,
          current_streak = EXCLUDED.current_streak,
          calculated_at = NOW()
        RETURNING *
      `, [
        aid, firstTradeDate, lastTradeDate, totalTrades, wins.length, losses.length,
        totalPnl, avgWin, avgLoss,
        wins.length > 0 ? Math.max(...wins) : 0,
        losses.length > 0 ? Math.min(...losses) : 0,
        winRate,
        profitFactor === Infinity ? 999.99 : profitFactor,
        expectancy, kellyCriterion,
        sharpeRatio, sortinoRatio, calmarRatio,
        maxDd, maxDdPct,
        longestWinStreak, longestLoseStreak, currentStreak,
      ])

      results.push(metrics.rows[0])
    }

    return NextResponse.json({
      success: true,
      calculated: results.length,
      metrics: results,
    })
  } catch (error: any) {
    console.error('[API/prop-sharing/performance] POST error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
