import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/sql';

export const dynamic = 'force-dynamic';

/**
 * GET  /api/prop-sharing/scaling
 * - Returns scaling rules, history, and eligible candidates
 *
 * POST /api/prop-sharing/scaling
 * - Evaluate an account (or all eligible) for scaling up/down
 *
 * PUT  /api/prop-sharing/scaling
 * - Update scaling rules
 */

// ── GET: Scaling data ────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const section = url.searchParams.get('section'); // rules | history | candidates | all

    const data: Record<string, any> = {};

    if (!section || section === 'all' || section === 'rules') {
      const rules = await sql.query('SELECT * FROM prop_scaling_rules ORDER BY created_at DESC');
      data.rules = rules.rows;
    }

    if (!section || section === 'all' || section === 'candidates') {
      // Candidates: active funded accounts meeting basic eligibility
      const candidates = await sql.query(`
        SELECT
          a.account_id, a.account_number, a.trader_name, a.trader_email,
          a.balance, a.starting_balance, a.status, a.scaling_eligible,
          a.consistency_score, a.volatility_30d, a.scaling_tier,
          a.last_scaling_event,
          p.name as program_name, p.profit_target_pct, p.max_drawdown_pct,
          CASE WHEN a.starting_balance > 0
            THEN ((a.balance - a.starting_balance) / a.starting_balance * 100)
            ELSE 0
          END as total_return_pct,
          (SELECT COUNT(*) FROM prop_trades t WHERE t.account_id = a.account_id AND t.status = 'closed') as total_trades,
          (SELECT COUNT(*) FROM prop_trades t WHERE t.account_id = a.account_id AND t.status = 'closed' AND t.pnl > 0) as winning_trades,
          (SELECT MAX(closed_at) FROM prop_trades t WHERE t.account_id = a.account_id AND t.status = 'closed') as last_trade_at,
          (SELECT COUNT(*) FROM prop_scaling_history sh WHERE sh.account_id = a.account_id) as total_scaling_events
        FROM prop_accounts a
        JOIN prop_programs p ON p.program_id = a.program_id
        WHERE a.status = 'active' AND a.phase = 'funded'
        ORDER BY
          CASE WHEN a.scaling_eligible THEN 0 ELSE 1 END,
          a.consistency_score DESC NULLS LAST
      `);
      data.candidates = candidates.rows;
    }

    if (!section || section === 'all' || section === 'history') {
      const history = await sql.query(`
        SELECT sh.*, a.account_number, a.trader_name, p.name as program_name
        FROM prop_scaling_history sh
        JOIN prop_accounts a ON a.account_id = sh.account_id
        JOIN prop_programs p ON p.program_id = a.program_id
        ORDER BY sh.scaled_at DESC
        LIMIT 50
      `);
      data.history = history.rows;
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Scaling GET error:', error);
    return NextResponse.json({
      success: true,
      data: { rules: [], candidates: [], history: [] },
    });
  }
}

// ── POST: Evaluate scaling ───────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const accountId = body.account_id; // optional — null = evaluate all eligible

    // Get active scaling rule
    const ruleRes = await sql.query(
      "SELECT * FROM prop_scaling_rules WHERE is_active = true ORDER BY created_at DESC LIMIT 1"
    );
    if (ruleRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'No active scaling rule configured' }, { status: 400 });
    }
    const rule = ruleRes.rows[0];

    // Get accounts to evaluate
    let accountsQuery;
    if (accountId) {
      accountsQuery = await sql.query(
        "SELECT * FROM prop_accounts WHERE account_id = $1 AND status = 'active' AND phase = 'funded'",
        [accountId]
      );
    } else {
      accountsQuery = await sql.query(
        "SELECT * FROM prop_accounts WHERE status = 'active' AND phase = 'funded'"
      );
    }

    const results: any[] = [];

    for (const acct of accountsQuery.rows) {
      const aid = acct.account_id;

      // Check cooldown
      if (acct.last_scaling_event) {
        const daysSince = (Date.now() - new Date(acct.last_scaling_event).getTime()) / (1000 * 86400);
        if (daysSince < parseFloat(rule.cooldown_days)) {
          results.push({ account_id: aid, account_number: acct.account_number, eligible: false, reason: `Cooldown: ${Math.ceil(parseFloat(rule.cooldown_days) - daysSince)} days remaining` });
          continue;
        }
      }

      // Check max tier
      const currentTier = parseInt(acct.scaling_tier) || 0;
      if (currentTier >= parseInt(rule.max_scaling_tiers)) {
        results.push({ account_id: aid, account_number: acct.account_number, eligible: false, reason: `Already at max tier (${currentTier}/${rule.max_scaling_tiers})` });
        continue;
      }

      // Calculate performance metrics
      const trades = await sql.query(`
        SELECT trade_id, pnl, opened_at, closed_at,
               EXTRACT(EPOCH FROM (closed_at - opened_at)) as hold_seconds
        FROM prop_trades
        WHERE account_id = $1 AND status = 'closed'
        ORDER BY closed_at DESC
      `, [aid]);

      if (trades.rows.length < 10) {
        results.push({ account_id: aid, account_number: acct.account_number, eligible: false, reason: 'Insufficient trades (need >= 10)' });
        continue;
      }

      const pnls = trades.rows.map((t: any) => parseFloat(t.pnl));
      const totalPnl = pnls.reduce((s: number, p: number) => s + p, 0);
      const avgPnl = totalPnl / pnls.length;
      const pnlStddev = Math.sqrt(pnls.reduce((s: number, p: number) => s + Math.pow(p - avgPnl, 2), 0) / pnls.length);

      // Sharpe-like ratio (using average daily PnL / stddev)
      const sharpeRatio = pnlStddev > 0 ? (avgPnl / pnlStddev) * Math.sqrt(252) : 0;

      // Profit factor
      const grossProfit = pnls.filter((p: number) => p > 0).reduce((s: number, p: number) => s + p, 0);
      const grossLoss = Math.abs(pnls.filter((p: number) => p < 0).reduce((s: number, p: number) => s + p, 0));
      const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99 : 0;

      // Max drawdown (running peak-to-trough)
      let peak = 0;
      let maxDD = 0;
      let running = 0;
      for (const p of pnls.reverse()) {
        running += p;
        if (running > peak) peak = running;
        const dd = peak > 0 ? ((peak - running) / peak) * 100 : 0;
        if (dd > maxDD) maxDD = dd;
      }

      // Win rate
      const wins = pnls.filter((p: number) => p > 0).length;
      const winRate = (wins / pnls.length) * 100;

      // Consistency score: proportion of positive trading days
      const dailyPnls: Record<string, number> = {};
      for (const t of trades.rows) {
        const day = new Date(t.closed_at).toISOString().split('T')[0];
        dailyPnls[day] = (dailyPnls[day] || 0) + parseFloat(t.pnl);
      }
      const days = Object.values(dailyPnls);
      const positiveDays = days.filter((d: number) => d > 0).length;
      const consistencyScore = days.length > 0 ? (positiveDays / days.length) * 100 : 0;

      // Check against rules
      const checks = {
        sharpe: { required: parseFloat(rule.min_sharpe_ratio), actual: sharpeRatio, pass: sharpeRatio >= parseFloat(rule.min_sharpe_ratio) },
        profit_factor: { required: parseFloat(rule.min_profit_factor), actual: profitFactor, pass: profitFactor >= parseFloat(rule.min_profit_factor) },
        max_drawdown: { required: parseFloat(rule.max_drawdown_pct), actual: maxDD, pass: maxDD <= parseFloat(rule.max_drawdown_pct) },
      };

      const allPassed = checks.sharpe.pass && checks.profit_factor.pass && checks.max_drawdown.pass;

      // Update consistency score on account
      await sql.query(
        'UPDATE prop_accounts SET consistency_score = $1, scaling_eligible = $2, updated_at = now() WHERE account_id = $3',
        [consistencyScore, allPassed, aid]
      );

      if (allPassed) {
        // Scale up!
        const newTier = currentTier + 1;
        const scalePct = parseFloat(rule.scale_pct_per_tier);
        const oldBalance = parseFloat(acct.balance);
        const increase = oldBalance * (scalePct / 100);
        const newBalance = oldBalance + increase;

        await sql.query(
          'UPDATE prop_accounts SET balance = $1, starting_balance = $2, scaling_tier = $3, last_scaling_event = now(), updated_at = now() WHERE account_id = $4',
          [newBalance, newBalance, newTier, aid]
        );

        // Record scaling event
        await sql.query(`
          INSERT INTO prop_scaling_history (account_id, direction, old_balance, new_balance, old_tier, new_tier, scaling_rule_id, metrics_snapshot)
          VALUES ($1, 'up', $2, $3, $4, $5, $6, $7)
        `, [
          aid, oldBalance, newBalance, currentTier, newTier, rule.rule_id,
          JSON.stringify({ sharpe: sharpeRatio, profit_factor: profitFactor, max_dd: maxDD, win_rate: winRate, consistency: consistencyScore, total_trades: pnls.length })
        ]);

        // Audit log
        await sql.query(
          `INSERT INTO prop_audit_log (entity_type, entity_id, action, old_value, new_value, performed_by, reason)
           VALUES ('prop_account', $1, 'scaling_up', $2, $3, 'system', $4)`,
          [aid, JSON.stringify({ balance: oldBalance, tier: currentTier }), JSON.stringify({ balance: newBalance, tier: newTier }),
           `Auto-scaled: Sharpe ${sharpeRatio.toFixed(2)}, PF ${profitFactor.toFixed(2)}, DD ${maxDD.toFixed(1)}%`]
        );

        results.push({
          account_id: aid,
          account_number: acct.account_number,
          trader_name: acct.trader_name,
          eligible: true,
          scaled: true,
          direction: 'up',
          old_balance: oldBalance,
          new_balance: newBalance,
          old_tier: currentTier,
          new_tier: newTier,
          metrics: { sharpe: sharpeRatio, profit_factor: profitFactor, max_drawdown: maxDD, win_rate: winRate, consistency: consistencyScore },
          checks,
        });
      } else {
        results.push({
          account_id: aid,
          account_number: acct.account_number,
          trader_name: acct.trader_name,
          eligible: false,
          reason: 'Metrics below threshold',
          metrics: { sharpe: sharpeRatio, profit_factor: profitFactor, max_drawdown: maxDD, win_rate: winRate, consistency: consistencyScore },
          checks,
        });
      }
    }

    // Audit
    const scaled = results.filter(r => r.scaled);
    await sql.query(
      `INSERT INTO prop_audit_log (entity_type, entity_id, action, new_value, performed_by, reason)
       VALUES ('scaling_eval', 'system', 'evaluation_completed', $1, 'system', 'Scaling evaluation run')`,
      [JSON.stringify({ evaluated: results.length, scaled: scaled.length })]
    );

    return NextResponse.json({
      success: true,
      data: { evaluated: results.length, scaled: scaled.length, results },
    });
  } catch (error) {
    console.error('Scaling POST error:', error);
    return NextResponse.json({ success: false, error: 'Scaling evaluation failed' }, { status: 500 });
  }
}

// ── PUT: Update scaling rules ────────────────────────────────

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { rule_id, ...updates } = body;

    if (!rule_id) {
      return NextResponse.json({ success: false, error: 'rule_id required' }, { status: 400 });
    }

    // Get current for audit
    const current = await sql.query('SELECT * FROM prop_scaling_rules WHERE rule_id = $1', [rule_id]);
    if (current.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Rule not found' }, { status: 404 });
    }

    const setClauses: string[] = ['updated_at = now()'];
    const params: any[] = [];
    let idx = 1;

    const allowedFields = ['name', 'min_sharpe_ratio', 'min_profit_factor', 'max_drawdown_pct', 'min_trading_days', 'cooldown_days', 'max_scaling_tiers', 'scale_pct_per_tier', 'is_active'];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        setClauses.push(`${field} = $${idx++}`);
        params.push(updates[field]);
      }
    }

    params.push(rule_id);

    const result = await sql.query(
      `UPDATE prop_scaling_rules SET ${setClauses.join(', ')} WHERE rule_id = $${idx} RETURNING *`,
      params
    );

    // Audit
    await sql.query(
      `INSERT INTO prop_audit_log (entity_type, entity_id, action, old_value, new_value, performed_by, reason)
       VALUES ('scaling_rule', $1, 'rule_updated', $2, $3, 'admin', 'Scaling rule updated')`,
      [rule_id, JSON.stringify(current.rows[0]), JSON.stringify(result.rows[0])]
    );

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Scaling PUT error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update rule' }, { status: 500 });
  }
}
