import { sql } from '@/lib/sql';

/**
 * Prop Sharing Agent
 *
 * Responsibilities:
 * - Evaluate trader accounts against program rules
 * - Auto-advance accounts through evaluation → verification → funded phases
 * - Monitor real-time risk metrics across all prop accounts
 * - Calculate and recommend payouts
 * - Flag compliance and risk anomalies
 * - Generate trader performance reports
 */

class PropSharingAgent {
  private readonly name = 'PropSharingAgent';

  // ── Evaluation Scoring ──────────────────────────────────────────

  /**
   * Evaluate a prop account and determine if it should advance phases.
   * Returns the updated phase and reasoning.
   */
  async evaluateAccount(accountId: string): Promise<{
    phase: string;
    advanced: boolean;
    reasoning: string;
    metrics: Record<string, any>;
  }> {
    console.log(`[${this.name}] Evaluating account: ${accountId}`);

    try {
      // Get account + program details
      const acct = await sql`
        SELECT a.*, p.name as program_name,
               p.eval_profit_target_pct, p.eval_max_drawdown_pct,
               p.eval_max_daily_loss_pct, p.eval_min_trading_days,
               p.funded_max_drawdown_pct, p.funded_max_daily_loss_pct,
               p.funded_max_position_pct
        FROM prop_accounts a
        JOIN prop_programs p ON p.program_id = a.program_id
        WHERE a.account_id = ${accountId}
      `;

      if (acct.rows.length === 0) throw new Error('Account not found');
      const account = acct.rows[0];

      // Get trade stats
      const stats = await sql`
        SELECT
          COUNT(*) FILTER (WHERE status = 'closed') as total_trades,
          COUNT(DISTINCT DATE(opened_at)) FILTER (WHERE status = 'closed') as trading_days,
          COUNT(*) FILTER (WHERE status = 'closed' AND realized_pnl > 0) as winning_trades,
          COALESCE(SUM(realized_pnl) FILTER (WHERE status = 'closed'), 0) as total_pnl,
          COALESCE(AVG(realized_pnl) FILTER (WHERE status = 'closed'), 0) as avg_pnl
        FROM prop_trades
        WHERE account_id = ${accountId}
      `;

      const s = stats.rows[0];
      const profitPct = account.funded_capital > 0
        ? ((account.current_balance - account.funded_capital) / account.funded_capital) * 100
        : 0;
      const drawdownPct = account.peak_balance > 0
        ? ((account.peak_balance - account.current_balance) / account.peak_balance) * 100
        : 0;
      const winRate = s.total_trades > 0 ? (s.winning_trades / s.total_trades) * 100 : 0;

      const metrics = {
        total_trades: Number(s.total_trades),
        trading_days: Number(s.trading_days),
        winning_trades: Number(s.winning_trades),
        win_rate: winRate,
        profit_pct: profitPct,
        drawdown_pct: drawdownPct,
        total_pnl: Number(s.total_pnl),
        avg_pnl: Number(s.avg_pnl),
        current_balance: Number(account.current_balance),
        peak_balance: Number(account.peak_balance),
      };

      let advanced = false;
      let reasoning = '';

      // ── Evaluate based on current phase ──
      if (account.phase === 'evaluation') {
        const hitTarget = profitPct >= account.eval_profit_target_pct;
        const minDays = s.trading_days >= account.eval_min_trading_days;
        const clean = drawdownPct < account.eval_max_drawdown_pct;

        if (hitTarget && minDays && clean) {
          await sql`UPDATE prop_accounts SET phase = 'verification' WHERE account_id = ${accountId}`;
          advanced = true;
          reasoning = `Account advanced to VERIFICATION. Profit target reached (${profitPct.toFixed(1)}% >= ${account.eval_profit_target_pct}%), `
            + `minimum trading days met (${s.trading_days} >= ${account.eval_min_trading_days}), `
            + `drawdown within limits (${drawdownPct.toFixed(1)}% < ${account.eval_max_drawdown_pct}%).`;
        } else {
          const reasons: string[] = [];
          if (!hitTarget) reasons.push(`Profit ${profitPct.toFixed(1)}% < target ${account.eval_profit_target_pct}%`);
          if (!minDays) reasons.push(`Trading days ${s.trading_days} < min ${account.eval_min_trading_days}`);
          if (!clean) reasons.push(`Drawdown ${drawdownPct.toFixed(1)}% exceeds limit ${account.eval_max_drawdown_pct}%`);
          reasoning = `Still in EVALUATION. Missing: ${reasons.join('; ')}`;
        }
      } else if (account.phase === 'verification') {
        // Verification: must maintain profit without drawdown breach for continued trading
        const clean = drawdownPct < account.eval_max_drawdown_pct;
        const minDays = s.trading_days >= (account.eval_min_trading_days * 2);

        if (clean && minDays) {
          await sql`UPDATE prop_accounts SET phase = 'funded' WHERE account_id = ${accountId}`;
          advanced = true;
          reasoning = `Account advanced to FUNDED! Verification passed — drawdown clean (${drawdownPct.toFixed(1)}%), `
            + `trading days sufficient (${s.trading_days}).`;
        } else {
          reasoning = `In VERIFICATION phase. ${!clean ? 'Drawdown concern. ' : ''}${!minDays ? `Need more trading days (${s.trading_days}). ` : ''}`;
        }
      } else if (account.phase === 'funded') {
        reasoning = `FUNDED account performing at ${profitPct.toFixed(1)}% profit, ${winRate.toFixed(0)}% win rate, `
          + `${drawdownPct.toFixed(1)}% drawdown. ${drawdownPct > 5 ? '⚠️ Drawdown elevated.' : '✅ Within limits.'}`;
      } else {
        reasoning = `Account is in ${account.phase} phase — no evaluation possible.`;
      }

      await this.logAction('evaluate_account', { accountId }, { phase: account.phase, advanced, metrics });

      console.log(`[${this.name}] ${advanced ? '✅' : 'ℹ️'} ${reasoning}`);
      return { phase: advanced ? (account.phase === 'evaluation' ? 'verification' : 'funded') : account.phase, advanced, reasoning, metrics };
    } catch (error) {
      console.error(`[${this.name}] ❌ Error evaluating account:`, error);
      throw error;
    }
  }

  // ── Risk Assessment ─────────────────────────────────────────────

  /**
   * Check all active accounts for risk breaches and log events.
   */
  async runRiskSweep(): Promise<{ checked: number; alerts: number; details: any[] }> {
    console.log(`[${this.name}] Running risk sweep...`);

    try {
      const accounts = await sql`
        SELECT a.*, p.name as program_name,
               p.eval_max_drawdown_pct, p.eval_max_daily_loss_pct,
               p.funded_max_drawdown_pct, p.funded_max_daily_loss_pct,
               p.funded_max_position_pct
        FROM prop_accounts a
        JOIN prop_programs p ON p.program_id = a.program_id
        WHERE a.phase IN ('evaluation', 'verification', 'funded')
      `;

      const alerts: any[] = [];

      for (const a of accounts.rows) {
        const maxDD = a.phase === 'funded' ? a.funded_max_drawdown_pct : a.eval_max_drawdown_pct;
        const maxDL = a.phase === 'funded' ? a.funded_max_daily_loss_pct : a.eval_max_daily_loss_pct;
        const drawdownPct = a.peak_balance > 0
          ? ((a.peak_balance - a.current_balance) / a.peak_balance) * 100
          : 0;

        // Check drawdown
        if (maxDD && drawdownPct >= maxDD * 0.8) {
          const severity = drawdownPct >= maxDD ? 'critical' : 'warning';
          await this.createRiskEvent(a.account_id, 'drawdown_breach', severity,
            `Drawdown at ${drawdownPct.toFixed(1)}% (limit: ${maxDD}%)`,
            drawdownPct, maxDD);
          alerts.push({ account: a.account_number, type: 'drawdown', severity, value: drawdownPct });

          if (severity === 'critical' && a.phase !== 'suspended') {
            await sql`UPDATE prop_accounts SET phase = 'suspended' WHERE account_id = ${a.account_id}`;
            alerts.push({ account: a.account_number, type: 'auto_suspend', severity: 'critical' });
          }
        }

        // Check open positions concentration
        if (a.funded_max_position_pct) {
          const openTrades = await sql`
            SELECT commodity, quantity, entry_price
            FROM prop_trades
            WHERE account_id = ${a.account_id} AND status = 'open'
          `;
          for (const t of openTrades.rows) {
            const posPct = (t.quantity * t.entry_price) / a.current_balance * 100;
            if (posPct > a.funded_max_position_pct) {
              await this.createRiskEvent(a.account_id, 'position_limit', 'warning',
                `Position in ${t.commodity} is ${posPct.toFixed(1)}% of balance (limit: ${a.funded_max_position_pct}%)`,
                posPct, a.funded_max_position_pct);
              alerts.push({ account: a.account_number, type: 'position', severity: 'warning', commodity: t.commodity });
            }
          }
        }
      }

      await this.logAction('risk_sweep', { checked: accounts.rows.length }, { alerts: alerts.length, details: alerts });
      console.log(`[${this.name}] ✅ Checked ${accounts.rows.length} accounts, ${alerts.length} alerts`);
      return { checked: accounts.rows.length, alerts: alerts.length, details: alerts };
    } catch (error) {
      console.error(`[${this.name}] ❌ Error in risk sweep:`, error);
      throw error;
    }
  }

  // ── Payout Recommendations ──────────────────────────────────────

  /**
   * Calculate recommended payouts for funded accounts with unrealized profits.
   */
  async calculatePayoutRecommendations(): Promise<any[]> {
    console.log(`[${this.name}] Calculating payout recommendations...`);

    try {
      const funded = await sql`
        SELECT a.*, p.name as program_name,
               p.profit_split_trader_pct, p.profit_split_firm_pct,
               p.min_payout_amount, p.payout_frequency
        FROM prop_accounts a
        JOIN prop_programs p ON p.program_id = a.program_id
        WHERE a.phase = 'funded' AND a.total_pnl > 0
      `;

      const recommendations: any[] = [];

      for (const a of funded.rows) {
        // Get last payout date
        const lastPayout = await sql`
          SELECT MAX(period_end) as last_period_end
          FROM prop_payouts
          WHERE account_id = ${a.account_id} AND status IN ('paid', 'approved', 'processing')
        `;

        const sinceDate = lastPayout.rows[0]?.last_period_end || a.created_at;

        // Calculate profit since last payout
        const profit = await sql`
          SELECT COALESCE(SUM(realized_pnl), 0) as period_profit
          FROM prop_trades
          WHERE account_id = ${a.account_id}
            AND status = 'closed'
            AND closed_at > ${sinceDate}
        `;

        const periodProfit = Number(profit.rows[0].period_profit);
        if (periodProfit <= 0) continue;

        const traderPayout = periodProfit * (a.profit_split_trader_pct / 100);
        const firmShare = periodProfit * (a.profit_split_firm_pct / 100);

        if (traderPayout >= (a.min_payout_amount || 0)) {
          recommendations.push({
            account_id: a.account_id,
            account_number: a.account_number,
            trader_name: a.trader_name,
            program: a.program_name,
            period_profit: periodProfit,
            trader_payout: traderPayout,
            firm_share: firmShare,
            split: `${a.profit_split_trader_pct}/${a.profit_split_firm_pct}`,
            since: sinceDate,
          });
        }
      }

      await this.logAction('payout_recommendations', {}, { count: recommendations.length, total: recommendations.reduce((s, r) => s + r.trader_payout, 0) });
      console.log(`[${this.name}] ✅ ${recommendations.length} payout recommendations`);
      return recommendations;
    } catch (error) {
      console.error(`[${this.name}] ❌ Error calculating payouts:`, error);
      throw error;
    }
  }

  // ── Performance Report ──────────────────────────────────────────

  /**
   * Generate a performance summary for a trader account.
   */
  async generatePerformanceReport(accountId: string): Promise<Record<string, any>> {
    console.log(`[${this.name}] Generating performance report for ${accountId}`);

    try {
      const acct = await sql`
        SELECT a.*, p.name as program_name, p.funded_capital as program_capital
        FROM prop_accounts a
        JOIN prop_programs p ON p.program_id = a.program_id
        WHERE a.account_id = ${accountId}
      `;
      if (acct.rows.length === 0) throw new Error('Account not found');
      const a = acct.rows[0];

      const trades = await sql`
        SELECT
          COUNT(*) as total_trades,
          COUNT(*) FILTER (WHERE realized_pnl > 0) as wins,
          COUNT(*) FILTER (WHERE realized_pnl < 0) as losses,
          COUNT(*) FILTER (WHERE realized_pnl = 0) as breakeven,
          COALESCE(SUM(realized_pnl), 0) as total_pnl,
          COALESCE(AVG(realized_pnl), 0) as avg_pnl,
          COALESCE(MAX(realized_pnl), 0) as best_trade,
          COALESCE(MIN(realized_pnl), 0) as worst_trade,
          COUNT(DISTINCT commodity) as commodities_traded,
          COUNT(DISTINCT DATE(opened_at)) as trading_days,
          MIN(opened_at) as first_trade,
          MAX(opened_at) as last_trade
        FROM prop_trades
        WHERE account_id = ${accountId} AND status = 'closed'
      `;
      const t = trades.rows[0];

      const byComm = await sql`
        SELECT commodity,
          COUNT(*) as trades,
          SUM(realized_pnl) as pnl,
          AVG(realized_pnl) as avg_pnl
        FROM prop_trades
        WHERE account_id = ${accountId} AND status = 'closed'
        GROUP BY commodity
        ORDER BY pnl DESC
      `;

      const riskEvents = await sql`
        SELECT severity, COUNT(*) as count
        FROM prop_risk_events
        WHERE account_id = ${accountId}
        GROUP BY severity
      `;

      const report = {
        account: {
          id: a.account_id,
          number: a.account_number,
          trader: a.trader_name,
          program: a.program_name,
          phase: a.phase,
          funded_capital: Number(a.funded_capital),
          current_balance: Number(a.current_balance),
          peak_balance: Number(a.peak_balance),
          total_pnl: Number(a.total_pnl),
          return_pct: a.funded_capital > 0 ? ((a.current_balance - a.funded_capital) / a.funded_capital * 100).toFixed(2) : '0',
        },
        trading: {
          total_trades: Number(t.total_trades),
          wins: Number(t.wins),
          losses: Number(t.losses),
          win_rate: t.total_trades > 0 ? (t.wins / t.total_trades * 100).toFixed(1) : '0',
          profit_factor: t.losses > 0 ? (t.wins / t.losses).toFixed(2) : 'N/A',
          avg_pnl: Number(t.avg_pnl).toFixed(2),
          best_trade: Number(t.best_trade),
          worst_trade: Number(t.worst_trade),
          trading_days: Number(t.trading_days),
          commodities_traded: Number(t.commodities_traded),
        },
        by_commodity: byComm.rows.map(c => ({
          commodity: c.commodity,
          trades: Number(c.trades),
          pnl: Number(c.pnl),
          avg_pnl: Number(c.avg_pnl).toFixed(2),
        })),
        risk_events: riskEvents.rows.reduce((obj, r) => {
          obj[r.severity] = Number(r.count);
          return obj;
        }, {} as Record<string, number>),
      };

      await this.logAction('performance_report', { accountId }, report);
      console.log(`[${this.name}] ✅ Report generated for ${a.account_number}`);
      return report;
    } catch (error) {
      console.error(`[${this.name}] ❌ Error generating report:`, error);
      throw error;
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────

  private async createRiskEvent(
    accountId: string,
    eventType: string,
    severity: string,
    description: string,
    metricValue?: number,
    thresholdValue?: number
  ): Promise<void> {
    try {
      // Avoid duplicate unresolved events
      const existing = await sql`
        SELECT event_id FROM prop_risk_events
        WHERE account_id = ${accountId}
          AND event_type = ${eventType}
          AND resolved = false
        LIMIT 1
      `;
      if (existing.rows.length > 0) return;

      await sql`
        INSERT INTO prop_risk_events (account_id, event_type, severity, description, metric_value, threshold_value)
        VALUES (${accountId}, ${eventType}, ${severity}, ${description}, ${metricValue || null}, ${thresholdValue || null})
      `;
    } catch (error) {
      console.error(`[${this.name}] Error creating risk event:`, error);
    }
  }

  // ── V2: Performance Metrics Engine ──────────────────────────────

  /**
   * Calculate deterministic performance metrics for an account.
   * Sharpe, Sortino, Calmar, Max DD, Win Rate, Expectancy, Kelly
   */
  async calculatePerformanceMetrics(accountId: string): Promise<Record<string, any> | null> {
    console.log(`[${this.name}] Calculating performance metrics for: ${accountId}`);
    try {
      const trades = await sql`
        SELECT pnl, opened_at, closed_at FROM prop_trades
        WHERE account_id = ${accountId} AND status = 'closed'
        ORDER BY closed_at ASC
      `;
      if (trades.rows.length === 0) return null;

      const pnls = trades.rows.map((t: any) => Number(t.pnl));
      const n = pnls.length;
      const wins = pnls.filter((p: number) => p > 0);
      const losses = pnls.filter((p: number) => p < 0);
      const totalPnl = pnls.reduce((s: number, p: number) => s + p, 0);
      const winRate = wins.length / n;
      const avgWin = wins.length > 0 ? wins.reduce((s: number, p: number) => s + p, 0) / wins.length : 0;
      const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s: number, p: number) => s + p, 0) / losses.length) : 0;
      const expectancy = (winRate * avgWin) - ((1 - winRate) * avgLoss);
      const profitFactor = losses.length > 0 ? Math.abs(wins.reduce((s: number, p: number) => s + p, 0)) / Math.abs(losses.reduce((s: number, p: number) => s + p, 0)) : 0;

      // Sharpe
      const mean = totalPnl / n;
      const variance = pnls.reduce((s: number, p: number) => s + Math.pow(p - mean, 2), 0) / n;
      const stdDev = Math.sqrt(variance);
      const sharpe = stdDev > 0 ? (mean / stdDev) * Math.sqrt(252) : 0;

      // Sortino
      const downsideVar = pnls.filter((p: number) => p < 0).reduce((s: number, p: number) => s + Math.pow(p, 2), 0) / n;
      const sortino = Math.sqrt(downsideVar) > 0 ? (mean / Math.sqrt(downsideVar)) * Math.sqrt(252) : 0;

      // Max DD
      const acct = await sql`SELECT starting_balance FROM prop_accounts WHERE account_id = ${accountId}`;
      const startBal = Number(acct.rows[0]?.starting_balance || 0);
      let peak = startBal, maxDd = 0, cum = 0;
      for (const p of pnls) { cum += p; const bal = startBal + cum; if (bal > peak) peak = bal; const dd = peak - bal; if (dd > maxDd) maxDd = dd; }
      const maxDdPct = peak > 0 ? (maxDd / peak) * 100 : 0;

      const calmar = maxDd > 0 ? (mean * 252) / maxDd : 0;

      const result = { sharpe, sortino, calmar, winRate, profitFactor, expectancy, maxDd, maxDdPct, totalPnl, totalTrades: n };
      await this.logAction('calculatePerformanceMetrics', { accountId }, result);
      return result;
    } catch (error) {
      console.error(`[${this.name}] Error calculating metrics:`, error);
      return null;
    }
  }

  // ── V2: Daily Snapshot Generator ──────────────────────────────

  /**
   * Generate end-of-day snapshots for all active accounts.
   * Captures balance, P&L, risk state at EOD.
   */
  async generateDailySnapshots(): Promise<number> {
    console.log(`[${this.name}] Generating daily snapshots`);
    let count = 0;
    try {
      const accounts = await sql`
        SELECT a.*, p.eval_max_drawdown, p.max_drawdown, p.eval_daily_loss_limit, p.daily_loss_limit
        FROM prop_accounts a
        JOIN prop_programs p ON p.program_id = a.program_id
        WHERE a.status IN ('active', 'funded')
      `;

      const today = new Date().toISOString().split('T')[0];

      for (const acct of accounts.rows) {
        // Get today's trades
        const dayTrades = await sql`
          SELECT COALESCE(SUM(pnl), 0) as day_pnl,
            COUNT(*) as trade_count,
            COALESCE(SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END), 0) as wins,
            COALESCE(SUM(CASE WHEN pnl < 0 THEN 1 ELSE 0 END), 0) as losses
          FROM prop_trades
          WHERE account_id = ${acct.account_id} AND status = 'closed'
            AND DATE(closed_at) = ${today}
        `;

        const dayPnl = Number(dayTrades.rows[0]?.day_pnl || 0);
        const openBal = Number(acct.current_balance) - dayPnl;
        const maxDD = acct.current_phase === 'evaluation' ? acct.eval_max_drawdown : acct.max_drawdown;
        const dailyLimit = acct.current_phase === 'evaluation' ? acct.eval_daily_loss_limit : acct.daily_loss_limit;

        await sql`
          INSERT INTO prop_daily_snapshots (account_id, snapshot_date, opening_balance, closing_balance, daily_pnl, trades_count, max_drawdown_pct, daily_loss_pct, locked_out)
          VALUES (
            ${acct.account_id}, ${today}, ${openBal}, ${Number(acct.current_balance)},
            ${dayPnl}, ${Number(dayTrades.rows[0]?.trade_count || 0)},
            ${Number(acct.current_drawdown)},
            ${Number(acct.starting_balance) > 0 ? (Math.abs(dayPnl) / Number(acct.starting_balance)) * 100 : 0},
            ${acct.locked_out || false}
          )
          ON CONFLICT (account_id, snapshot_date) DO UPDATE SET
            closing_balance = EXCLUDED.closing_balance,
            daily_pnl = EXCLUDED.daily_pnl,
            trades_count = EXCLUDED.trades_count,
            max_drawdown_pct = EXCLUDED.max_drawdown_pct,
            daily_loss_pct = EXCLUDED.daily_loss_pct,
            locked_out = EXCLUDED.locked_out
        `;

        // Reset daily lockout at end of day
        if (acct.locked_out && acct.status !== 'suspended') {
          await sql`
            UPDATE prop_accounts SET locked_out = false, locked_out_at = NULL, lock_reason = NULL, daily_pnl = 0
            WHERE account_id = ${acct.account_id}
          `;
        }

        count++;
      }

      await this.logAction('generateDailySnapshots', { date: today }, { snapshots: count });
    } catch (error) {
      console.error(`[${this.name}] Error generating snapshots:`, error);
    }
    return count;
  }

  // ── V2: Audit Logger ──────────────────────────────────────────

  /**
   * Write an immutable audit log entry for any prop sharing state change.
   */
  async logAudit(entityType: string, entityId: string, action: string, oldValue: any, newValue: any, performedBy: string, reason: string): Promise<void> {
    try {
      await sql`
        INSERT INTO prop_audit_log (entity_type, entity_id, action, old_value, new_value, performed_by, reason)
        VALUES (${entityType}, ${entityId}, ${action}, ${JSON.stringify(oldValue || null)}, ${JSON.stringify(newValue || null)}, ${performedBy}, ${reason})
      `;
    } catch (error) {
      console.error(`[${this.name}] Error writing audit log:`, error);
    }
  }

  // ── V3: Firm Exposure Calculator ────────────────────────────────

  /**
   * Calculate and store a firm-wide exposure snapshot.
   * Aggregates all funded account positions, checks breach limits.
   */
  async calculateFirmExposure(): Promise<{ deployed: number; net_exposure: number; utilization_pct: number; breaches: string[] }> {
    try {
      const configRes = await sql`SELECT config_key, config_value FROM prop_firm_risk_config`;
      const config: Record<string, any> = {};
      for (const row of configRes) config[row.config_key] = row.config_value;

      const maxExposure = parseFloat(config.max_total_exposure?.value || '5000000');
      const maxConcurrent = parseInt(config.max_concurrent_funded?.value || '100');
      const dailyLossLimit = parseFloat(config.daily_firm_loss_limit?.value || '3');

      const agg = await sql`
        SELECT
          COUNT(*) as funded_count,
          COALESCE(SUM(balance), 0) as total_deployed,
          COALESCE(SUM(balance - starting_balance), 0) as realized_pnl
        FROM prop_accounts WHERE status = 'active' AND phase = 'funded'
      `;
      const row = agg[0];
      const deployed = parseFloat(row.total_deployed);
      const netExposure = deployed;
      const utilization = maxExposure > 0 ? (deployed / maxExposure) * 100 : 0;

      const breaches: string[] = [];
      if (deployed > maxExposure) breaches.push('max_total_exposure');
      if (parseInt(row.funded_count) > maxConcurrent) breaches.push('max_concurrent_funded');

      await sql`
        INSERT INTO prop_firm_exposure (total_deployed, unrealized_pnl, realized_pnl, net_exposure, available_capital, utilization_pct, breach_flags)
        VALUES (${deployed}, ${0}, ${parseFloat(row.realized_pnl)}, ${netExposure}, ${maxExposure - deployed}, ${utilization}, ${breaches})
      `;

      await this.logAction('calculateFirmExposure', {}, { deployed, net_exposure: netExposure, utilization_pct: utilization, breaches });
      return { deployed, net_exposure: netExposure, utilization_pct: utilization, breaches };
    } catch (error) {
      console.error(`[${this.name}] Error calculating firm exposure:`, error);
      return { deployed: 0, net_exposure: 0, utilization_pct: 0, breaches: [] };
    }
  }

  // ── V3: Fraud Pattern Detection ───────────────────────────────

  /**
   * Detect fraud patterns for a specific account.
   * Checks: latency arbitrage, overfit scalping, statistical anomalies.
   */
  async detectFraudPatterns(accountId: string): Promise<{ alerts_created: number; patterns_found: string[] }> {
    try {
      const trades = await sql`
        SELECT trade_id, commodity, direction, quantity, entry_price, exit_price, pnl,
               opened_at, closed_at,
               EXTRACT(EPOCH FROM (closed_at - opened_at)) as hold_seconds
        FROM prop_trades WHERE account_id = ${accountId} AND status = 'closed'
        ORDER BY opened_at DESC LIMIT 200
      `;

      if (trades.length < 5) return { alerts_created: 0, patterns_found: [] };

      const patterns: string[] = [];
      let alertCount = 0;

      // Latency arbitrage check
      const ultraShort = trades.filter((t: any) => parseFloat(t.hold_seconds) < 10);
      if (ultraShort.length >= 5) {
        const pct = (ultraShort.length / trades.length) * 100;
        const wins = ultraShort.filter((t: any) => parseFloat(t.pnl) > 0).length;
        const winRate = (wins / ultraShort.length) * 100;
        if (pct > 30 && winRate > 80) {
          patterns.push('latency_arbitrage');
          const score = Math.min(((pct - 30) / 70 * 0.5) + ((winRate - 80) / 20 * 0.5), 1);
          const existing = await sql`
            SELECT alert_id FROM prop_fraud_alerts
            WHERE account_id = ${accountId} AND alert_type = 'latency_arbitrage'
            AND status IN ('open', 'investigating') AND created_at > now() - interval '7 days'
          `;
          if (existing.length === 0) {
            await sql`
              INSERT INTO prop_fraud_alerts (account_id, alert_type, severity, title, description, evidence, detection_score)
              VALUES (${accountId}, 'latency_arbitrage',
                ${score > 0.7 ? 'critical' : score > 0.4 ? 'high' : 'medium'},
                ${`Latency arbitrage: ${pct.toFixed(0)}% trades <10s, ${winRate.toFixed(0)}% WR`},
                ${'High percentage of ultra-short trades with abnormally high win rate'},
                ${JSON.stringify({ pct_under_10s: pct, win_rate: winRate, count: ultraShort.length })},
                ${score})
            `;
            alertCount++;
          }
        }
      }

      // Overfit scalping
      const shortTrades = trades.filter((t: any) => parseFloat(t.hold_seconds) < 60);
      if (shortTrades.length >= 10) {
        const pctShort = (shortTrades.length / trades.length) * 100;
        const avgPnl = shortTrades.reduce((s: number, t: any) => s + Math.abs(parseFloat(t.pnl)), 0) / shortTrades.length;
        if (pctShort > 50 && avgPnl < 5) {
          patterns.push('overfit_scalping');
        }
      }

      // Win rate anomaly
      if (trades.length >= 20) {
        const wins = trades.filter((t: any) => parseFloat(t.pnl) > 0).length;
        const winRate = (wins / trades.length) * 100;
        if (winRate > 95) patterns.push('statistical_anomaly');
      }

      await this.logAction('detectFraudPatterns', { accountId }, { alerts_created: alertCount, patterns_found: patterns });
      return { alerts_created: alertCount, patterns_found: patterns };
    } catch (error) {
      console.error(`[${this.name}] Error detecting fraud patterns:`, error);
      return { alerts_created: 0, patterns_found: [] };
    }
  }

  // ── V3: Behavior Profile Builder ──────────────────────────────

  /**
   * Build or update a statistical behavior profile for an account.
   */
  async buildBehaviorProfile(accountId: string): Promise<Record<string, any> | null> {
    try {
      const trades = await sql`
        SELECT pnl, EXTRACT(EPOCH FROM (closed_at - opened_at)) as hold_seconds, quantity
        FROM prop_trades WHERE account_id = ${accountId} AND status = 'closed'
        ORDER BY closed_at DESC LIMIT 200
      `;
      if (trades.length < 5) return null;

      const holdTimes = trades.map((t: any) => parseFloat(t.hold_seconds)).filter((h: number) => h > 0).sort((a: number, b: number) => a - b);
      const avgHold = holdTimes.reduce((s: number, h: number) => s + h, 0) / holdTimes.length;
      const medianHold = holdTimes[Math.floor(holdTimes.length / 2)];
      const pctUnder60 = (holdTimes.filter((h: number) => h < 60).length / holdTimes.length) * 100;
      const pctUnder10 = (holdTimes.filter((h: number) => h < 10).length / holdTimes.length) * 100;
      const lotSizes = trades.map((t: any) => parseFloat(t.quantity));
      const avgLot = lotSizes.reduce((s: number, l: number) => s + l, 0) / lotSizes.length;
      const lotStddev = Math.sqrt(lotSizes.reduce((s: number, l: number) => s + Math.pow(l - avgLot, 2), 0) / lotSizes.length);

      const profile = { avg_hold_seconds: avgHold, median_hold_seconds: medianHold, pct_under_60s: pctUnder60, pct_under_10s: pctUnder10, avg_lot_size: avgLot, lot_size_stddev: lotStddev };

      await sql`
        INSERT INTO prop_trader_behavior (account_id, avg_hold_seconds, median_hold_seconds, min_hold_seconds, pct_under_60s, pct_under_10s, avg_lot_size, lot_size_stddev, calculated_at, updated_at)
        VALUES (${accountId}, ${avgHold}, ${medianHold}, ${holdTimes[0]}, ${pctUnder60}, ${pctUnder10}, ${avgLot}, ${lotStddev}, now(), now())
        ON CONFLICT (account_id) DO UPDATE SET
          avg_hold_seconds = ${avgHold}, median_hold_seconds = ${medianHold}, min_hold_seconds = ${holdTimes[0]},
          pct_under_60s = ${pctUnder60}, pct_under_10s = ${pctUnder10}, avg_lot_size = ${avgLot}, lot_size_stddev = ${lotStddev},
          calculated_at = now(), updated_at = now()
      `;

      await this.logAction('buildBehaviorProfile', { accountId }, profile);
      return profile;
    } catch (error) {
      console.error(`[${this.name}] Error building behavior profile:`, error);
      return null;
    }
  }

  // ── V3: Scaling Evaluator ─────────────────────────────────────

  /**
   * Evaluate an account for scaling eligibility.
   * Returns metrics and whether the account qualifies for the next tier.
   */
  async evaluateScaling(accountId: string): Promise<{ eligible: boolean; metrics: Record<string, number>; reason: string }> {
    try {
      const ruleRes = await sql`SELECT * FROM prop_scaling_rules WHERE is_active = true ORDER BY created_at DESC LIMIT 1`;
      if (ruleRes.length === 0) return { eligible: false, metrics: {}, reason: 'No active scaling rule' };
      const rule = ruleRes[0];

      const acctRes = await sql`SELECT * FROM prop_accounts WHERE account_id = ${accountId}`;
      if (acctRes.length === 0) return { eligible: false, metrics: {}, reason: 'Account not found' };
      const acct = acctRes[0];

      // Cooldown check
      if (acct.last_scaling_event) {
        const daysSince = (Date.now() - new Date(acct.last_scaling_event).getTime()) / (1000 * 86400);
        if (daysSince < parseFloat(rule.cooldown_days)) {
          return { eligible: false, metrics: {}, reason: `Cooldown: ${Math.ceil(parseFloat(rule.cooldown_days) - daysSince)} days remaining` };
        }
      }

      const trades = await sql`
        SELECT pnl, closed_at FROM prop_trades WHERE account_id = ${accountId} AND status = 'closed' ORDER BY closed_at DESC
      `;
      if (trades.length < 10) return { eligible: false, metrics: {}, reason: 'Insufficient trades (<10)' };

      const pnls = trades.map((t: any) => parseFloat(t.pnl));
      const avgPnl = pnls.reduce((s: number, p: number) => s + p, 0) / pnls.length;
      const stddev = Math.sqrt(pnls.reduce((s: number, p: number) => s + Math.pow(p - avgPnl, 2), 0) / pnls.length);
      const sharpe = stddev > 0 ? (avgPnl / stddev) * Math.sqrt(252) : 0;
      const grossProfit = pnls.filter((p: number) => p > 0).reduce((s: number, p: number) => s + p, 0);
      const grossLoss = Math.abs(pnls.filter((p: number) => p < 0).reduce((s: number, p: number) => s + p, 0));
      const pf = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? 99 : 0);

      let peak = 0, maxDD = 0, running = 0;
      for (const p of [...pnls].reverse()) { running += p; if (running > peak) peak = running; const dd = peak > 0 ? ((peak - running) / peak) * 100 : 0; if (dd > maxDD) maxDD = dd; }

      const metrics = { sharpe, profit_factor: pf, max_drawdown: maxDD };
      const eligible = sharpe >= parseFloat(rule.min_sharpe_ratio) && pf >= parseFloat(rule.min_profit_factor) && maxDD <= parseFloat(rule.max_drawdown_pct);

      await sql`UPDATE prop_accounts SET consistency_score = ${((pnls.filter(p => p > 0).length / pnls.length) * 100)}, scaling_eligible = ${eligible}, updated_at = now() WHERE account_id = ${accountId}`;

      await this.logAction('evaluateScaling', { accountId }, { eligible, metrics });
      return { eligible, metrics, reason: eligible ? 'All criteria met' : 'Metrics below threshold' };
    } catch (error) {
      console.error(`[${this.name}] Error evaluating scaling:`, error);
      return { eligible: false, metrics: {}, reason: 'Evaluation error' };
    }
  }

  // ── V3: Consistency Score Calculator ──────────────────────────

  /**
   * Calculate a rolling consistency score for an account.
   * Measures the proportion of positive trading days over the last 30 days.
   */
  async calculateConsistencyScore(accountId: string): Promise<number> {
    try {
      const trades = await sql`
        SELECT pnl, closed_at FROM prop_trades
        WHERE account_id = ${accountId} AND status = 'closed' AND closed_at > now() - interval '30 days'
        ORDER BY closed_at
      `;
      if (trades.length === 0) return 0;

      const dailyPnls: Record<string, number> = {};
      for (const t of trades) {
        const day = new Date(t.closed_at).toISOString().split('T')[0];
        dailyPnls[day] = (dailyPnls[day] || 0) + parseFloat(t.pnl);
      }
      const days = Object.values(dailyPnls);
      const score = days.length > 0 ? (days.filter(d => d > 0).length / days.length) * 100 : 0;

      await sql`UPDATE prop_accounts SET consistency_score = ${score}, updated_at = now() WHERE account_id = ${accountId}`;
      await this.logAction('calculateConsistencyScore', { accountId }, { score, trading_days: days.length });
      return score;
    } catch (error) {
      console.error(`[${this.name}] Error calculating consistency score:`, error);
      return 0;
    }
  }

  private async logAction(action: string, inputData: any, outputData: any): Promise<void> {
    try {
      await sql`
        INSERT INTO agent_logs (agent_name, action, input_data, output_data, success)
        VALUES (
          ${this.name},
          ${action},
          ${JSON.stringify(inputData)},
          ${outputData ? JSON.stringify(outputData) : null},
          ${outputData !== null}
        )
      `;
    } catch (error) {
      console.error(`[${this.name}] Error logging action:`, error);
    }
  }
}

// Export singleton instance
export default new PropSharingAgent();
