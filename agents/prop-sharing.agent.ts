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
