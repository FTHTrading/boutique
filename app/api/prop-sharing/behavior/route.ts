import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/sql';

export const dynamic = 'force-dynamic';

/**
 * GET  /api/prop-sharing/behavior
 * - Returns stability scores, interventions, behavior config
 *
 * POST /api/prop-sharing/behavior
 * - Calculate stability score for an account
 * - Auto-trigger interventions based on thresholds
 *
 * PUT  /api/prop-sharing/behavior
 * - Update behavior config, resolve interventions
 */

// ── GET: Behavior data ───────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const section = url.searchParams.get('section') || 'overview';
    const accountId = url.searchParams.get('account_id');

    if (section === 'scores') {
      const conditions: string[] = [];
      const params: any[] = [];
      let idx = 1;

      if (accountId) { conditions.push(`ss.account_id = $${idx++}`); params.push(accountId); }
      const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

      const result = await sql.query(`
        SELECT ss.*, a.account_number, a.trader_name
        FROM prop_stability_scores ss
        JOIN prop_accounts a ON a.account_id = ss.account_id
        ${where}
        ORDER BY ss.overall_score ASC
        LIMIT 100
      `, params);

      return NextResponse.json({ success: true, data: { scores: result.rows } });
    }

    if (section === 'interventions') {
      const status = url.searchParams.get('status');
      const conditions: string[] = [];
      const params: any[] = [];
      let idx = 1;

      if (accountId) { conditions.push(`i.account_id = $${idx++}`); params.push(accountId); }
      if (status) { conditions.push(`i.status = $${idx++}`); params.push(status); }
      const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

      const result = await sql.query(`
        SELECT i.*, a.account_number, a.trader_name
        FROM prop_interventions i
        JOIN prop_accounts a ON a.account_id = i.account_id
        ${where}
        ORDER BY
          CASE i.intervention_type WHEN 'freeze' THEN 1 WHEN 'phase_rollback' THEN 2 WHEN 'restriction' THEN 3 WHEN 'warning' THEN 4 END,
          i.created_at DESC
        LIMIT 100
      `, params);

      return NextResponse.json({ success: true, data: { interventions: result.rows } });
    }

    if (section === 'config') {
      const result = await sql.query(`SELECT * FROM prop_behavior_config ORDER BY config_key`);
      return NextResponse.json({ success: true, data: { config: result.rows } });
    }

    if (section === 'history') {
      if (!accountId) return NextResponse.json({ success: false, error: 'account_id required' }, { status: 400 });
      const result = await sql.query(`
        SELECT * FROM prop_stability_history
        WHERE account_id = $1
        ORDER BY calculated_at DESC
        LIMIT 30
      `, [accountId]);
      return NextResponse.json({ success: true, data: { history: result.rows } });
    }

    // Default: overview
    const [scores, interventions, config] = await Promise.all([
      sql.query(`
        SELECT
          COUNT(*) as total_scored,
          COALESCE(AVG(overall_score), 0) as avg_score,
          COUNT(*) FILTER (WHERE overall_score < 30) as critical_low,
          COUNT(*) FILTER (WHERE overall_score >= 30 AND overall_score < 50) as at_risk,
          COUNT(*) FILTER (WHERE overall_score >= 50 AND overall_score < 70) as moderate,
          COUNT(*) FILTER (WHERE overall_score >= 70) as stable,
          COALESCE(AVG(revenge_trade_count), 0) as avg_revenge,
          COALESCE(AVG(martingale_count), 0) as avg_martingale,
          COALESCE(AVG(overtrade_burst_count), 0) as avg_overtrade,
          COALESCE(AVG(panic_exit_count), 0) as avg_panic
        FROM prop_stability_scores
      `),
      sql.query(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status IN ('pending', 'active')) as active,
          COUNT(*) FILTER (WHERE intervention_type = 'freeze' AND status IN ('pending', 'active')) as active_freezes,
          COUNT(*) FILTER (WHERE intervention_type = 'warning' AND status IN ('pending', 'active')) as active_warnings,
          COUNT(*) FILTER (WHERE intervention_type = 'restriction' AND status IN ('pending', 'active')) as active_restrictions,
          COUNT(*) FILTER (WHERE intervention_type = 'phase_rollback' AND status IN ('pending', 'active')) as active_rollbacks
        FROM prop_interventions
      `),
      sql.query(`SELECT * FROM prop_behavior_config ORDER BY config_key`),
    ]);

    // Top 10 lowest scores
    const worstScores = await sql.query(`
      SELECT ss.*, a.account_number, a.trader_name
      FROM prop_stability_scores ss
      JOIN prop_accounts a ON a.account_id = ss.account_id
      ORDER BY ss.overall_score ASC
      LIMIT 10
    `);

    // Active interventions
    const activeInterventions = await sql.query(`
      SELECT i.*, a.account_number, a.trader_name
      FROM prop_interventions i
      JOIN prop_accounts a ON a.account_id = i.account_id
      WHERE i.status IN ('pending', 'active')
      ORDER BY i.created_at DESC
      LIMIT 20
    `);

    return NextResponse.json({
      success: true,
      data: {
        summary: scores.rows[0],
        interventions_summary: interventions.rows[0],
        worst_scores: worstScores.rows,
        active_interventions: activeInterventions.rows,
        config: config.rows,
      },
    });
  } catch (error) {
    console.error('Behavior GET error:', error);
    return NextResponse.json({
      success: true,
      data: {
        summary: { total_scored: 0, avg_score: 0, critical_low: 0, at_risk: 0, moderate: 0, stable: 0 },
        interventions_summary: { total: 0, active: 0, active_freezes: 0, active_warnings: 0, active_restrictions: 0, active_rollbacks: 0 },
        worst_scores: [],
        active_interventions: [],
        config: [],
      },
    });
  }
}

// ── POST: Calculate stability score ──────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'calculate_score') {
      const { account_id } = body;
      if (!account_id) return NextResponse.json({ success: false, error: 'account_id required' }, { status: 400 });

      // Get recent trades (last 30 days)
      const trades = await sql.query(`
        SELECT * FROM prop_trades
        WHERE account_id = $1 AND status = 'closed' AND closed_at > now() - interval '30 days'
        ORDER BY closed_at
      `, [account_id]);

      if (trades.rows.length < 5) {
        return NextResponse.json({ success: true, data: { message: 'Insufficient trade data (need >= 5 closed trades)' } });
      }

      const t = trades.rows;

      // ── Feature Extraction ──

      // Revenge trading: loss followed by larger trade within 30 min
      let revengeCount = 0;
      for (let i = 1; i < t.length; i++) {
        if (parseFloat(t[i - 1].realized_pnl || 0) < 0) {
          const timeDiff = (new Date(t[i].opened_at).getTime() - new Date(t[i - 1].closed_at).getTime()) / 60000;
          if (timeDiff < 30 && parseFloat(t[i].size || 0) > parseFloat(t[i - 1].size || 0) * 1.3) {
            revengeCount++;
          }
        }
      }

      // Martingale: consecutive losses with increasing position size
      let martingaleCount = 0;
      let consecLoss = 0;
      let prevSize = 0;
      for (const trade of t) {
        if (parseFloat(trade.realized_pnl || 0) < 0) {
          if (parseFloat(trade.size || 0) > prevSize * 1.5 && consecLoss > 0) {
            martingaleCount++;
          }
          consecLoss++;
        } else {
          consecLoss = 0;
        }
        prevSize = parseFloat(trade.size || 0);
      }

      // Overtrade bursts: > 10 trades in 2 hours
      let overtradeCount = 0;
      const tradesByHourWindow: Record<string, number> = {};
      for (const trade of t) {
        const hourKey = new Date(trade.opened_at).toISOString().slice(0, 13);
        tradesByHourWindow[hourKey] = (tradesByHourWindow[hourKey] || 0) + 1;
      }
      overtradeCount = Object.values(tradesByHourWindow).filter(c => c > 10).length;

      // Panic exits: profitable trade closed with < 20% of max unrealized gain
      let panicExitCount = 0;
      for (const trade of t) {
        const maxFavorable = parseFloat(trade.max_favorable_excursion || 0);
        const realized = parseFloat(trade.realized_pnl || 0);
        if (maxFavorable > 0 && realized > 0 && realized < maxFavorable * 0.2) {
          panicExitCount++;
        }
      }

      // Position sizing variance (coefficient of variation)
      const sizes = t.map((tr: any) => parseFloat(tr.size || 0)).filter((s: number) => s > 0);
      const avgSize = sizes.reduce((a: number, b: number) => a + b, 0) / sizes.length;
      const sizeVariance = Math.sqrt(sizes.reduce((s: number, v: number) => s + Math.pow(v - avgSize, 2), 0) / sizes.length);
      const positionSizingCV = avgSize > 0 ? sizeVariance / avgSize : 0;

      // Leverage escalation slope
      const leverages = t.map((tr: any, i: number) => ({ x: i, y: parseFloat(tr.size || 0) }));
      const n = leverages.length;
      const sumX = leverages.reduce((s: number, p: any) => s + p.x, 0);
      const sumY = leverages.reduce((s: number, p: any) => s + p.y, 0);
      const sumXY = leverages.reduce((s: number, p: any) => s + p.x * p.y, 0);
      const sumXX = leverages.reduce((s: number, p: any) => s + p.x * p.x, 0);
      const leverageSlope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX) || 0;

      // Hold time coefficient of variation
      const holdTimes = t
        .filter((tr: any) => tr.opened_at && tr.closed_at)
        .map((tr: any) => (new Date(tr.closed_at).getTime() - new Date(tr.opened_at).getTime()) / 60000);
      const avgHold = holdTimes.length > 0 ? holdTimes.reduce((a: number, b: number) => a + b, 0) / holdTimes.length : 0;
      const holdVariance = holdTimes.length > 0
        ? Math.sqrt(holdTimes.reduce((s: number, v: number) => s + Math.pow(v - avgHold, 2), 0) / holdTimes.length)
        : 0;
      const holdTimeCV = avgHold > 0 ? holdVariance / avgHold : 0;

      // Post-loss aggression: avg size increase after losses
      let postLossAggression = 0;
      let postLossCount = 0;
      for (let i = 1; i < t.length; i++) {
        if (parseFloat(t[i - 1].realized_pnl || 0) < 0) {
          const sizeRatio = parseFloat(t[i].size || 0) / parseFloat(t[i - 1].size || 1);
          postLossAggression += sizeRatio;
          postLossCount++;
        }
      }
      postLossAggression = postLossCount > 0 ? postLossAggression / postLossCount : 1;

      // Rule violations count
      const ruleViolations = await sql.query(`
        SELECT COUNT(*) as total FROM prop_risk_events
        WHERE account_id = $1 AND created_at > now() - interval '30 days'
      `, [account_id]);
      const ruleViolationCount = parseInt(ruleViolations.rows[0]?.total || '0');

      // ── Score Calculation ──
      // Each subcomponent 0-100, weighted to overall

      // Discipline (30%): penalize revenge, overtrade, rule violations
      const disciplineScore = Math.max(0, Math.min(100,
        100 - (revengeCount * 15) - (overtradeCount * 10) - (ruleViolationCount * 8)));

      // Consistency (25%): penalize high position sizing variance & hold time variance
      const consistencyScore = Math.max(0, Math.min(100,
        100 - (positionSizingCV * 40) - (holdTimeCV * 30)));

      // Aggression (25%): penalize martingale, leverage escalation, post-loss aggression
      const aggressionScore = Math.max(0, Math.min(100,
        100 - (martingaleCount * 20) - (Math.max(0, leverageSlope) * 10) - (Math.max(0, (postLossAggression - 1)) * 30)));

      // Rule adherence (20%): penalize violations and panic exits
      const ruleAdherence = Math.max(0, Math.min(100,
        100 - (ruleViolationCount * 12) - (panicExitCount * 5)));

      const overallScore = Math.round(
        disciplineScore * 0.30 +
        consistencyScore * 0.25 +
        aggressionScore * 0.25 +
        ruleAdherence * 0.20
      );

      // Get previous score for delta
      const prevScore = await sql.query(`
        SELECT overall_score FROM prop_stability_scores
        WHERE account_id = $1
      `, [account_id]);

      const previousScore = prevScore.rows[0]?.overall_score || null;
      const scoreDelta = previousScore !== null ? overallScore - parseFloat(previousScore) : 0;
      const trendDirection = scoreDelta > 2 ? 'improving' : scoreDelta < -2 ? 'declining' : 'stable';

      // Upsert stability score
      await sql.query(`
        INSERT INTO prop_stability_scores
          (account_id, overall_score, discipline_score, consistency_score, aggression_score,
           rule_adherence, position_sizing_variance, leverage_escalation_slope,
           revenge_trade_count, martingale_count, overtrade_burst_count, panic_exit_count,
           rule_violation_count, post_loss_aggression, hold_time_cv,
           previous_score, score_delta, trend_direction)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        ON CONFLICT (account_id) DO UPDATE SET
          overall_score = EXCLUDED.overall_score,
          discipline_score = EXCLUDED.discipline_score,
          consistency_score = EXCLUDED.consistency_score,
          aggression_score = EXCLUDED.aggression_score,
          rule_adherence = EXCLUDED.rule_adherence,
          position_sizing_variance = EXCLUDED.position_sizing_variance,
          leverage_escalation_slope = EXCLUDED.leverage_escalation_slope,
          revenge_trade_count = EXCLUDED.revenge_trade_count,
          martingale_count = EXCLUDED.martingale_count,
          overtrade_burst_count = EXCLUDED.overtrade_burst_count,
          panic_exit_count = EXCLUDED.panic_exit_count,
          rule_violation_count = EXCLUDED.rule_violation_count,
          post_loss_aggression = EXCLUDED.post_loss_aggression,
          hold_time_cv = EXCLUDED.hold_time_cv,
          previous_score = EXCLUDED.previous_score,
          score_delta = EXCLUDED.score_delta,
          trend_direction = EXCLUDED.trend_direction,
          calculated_at = now()
      `, [account_id, overallScore, Math.round(disciplineScore), Math.round(consistencyScore),
        Math.round(aggressionScore), Math.round(ruleAdherence), positionSizingCV, leverageSlope,
        revengeCount, martingaleCount, overtradeCount, panicExitCount,
        ruleViolationCount, postLossAggression, holdTimeCV,
        previousScore, scoreDelta, trendDirection]);

      // Save to history
      await sql.query(`
        INSERT INTO prop_stability_history
          (account_id, overall_score, discipline_score, consistency_score, aggression_score, rule_adherence)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [account_id, overallScore, Math.round(disciplineScore), Math.round(consistencyScore),
        Math.round(aggressionScore), Math.round(ruleAdherence)]);

      // ── Auto-Interventions ──
      const configRes = await sql.query(`SELECT * FROM prop_behavior_config`);
      const cfg: Record<string, number> = {};
      for (const row of configRes.rows) {
        cfg[row.config_key] = parseFloat(row.config_value);
      }

      const interventions: any[] = [];

      // Freeze threshold
      if (overallScore <= (cfg.freeze_score_threshold || 20)) {
        interventions.push({
          type: 'freeze',
          reason: `Stability score ${overallScore} below freeze threshold ${cfg.freeze_score_threshold || 20}`,
          signals: { overall_score: overallScore, threshold: cfg.freeze_score_threshold || 20 },
          details: { action: 'freeze_account', duration_hours: 48 },
        });
      }
      // Warning threshold
      else if (overallScore <= (cfg.warning_score_threshold || 40)) {
        interventions.push({
          type: 'warning',
          reason: `Stability score ${overallScore} below warning threshold ${cfg.warning_score_threshold || 40}`,
          signals: { overall_score: overallScore, threshold: cfg.warning_score_threshold || 40 },
          details: { action: 'send_warning', cooldown_hours: 24 },
        });
      }

      // Revenge trading detection
      if (revengeCount >= (cfg.revenge_trade_threshold || 3)) {
        interventions.push({
          type: 'restriction',
          reason: `${revengeCount} revenge trades detected (threshold: ${cfg.revenge_trade_threshold || 3})`,
          signals: { revenge_trade_count: revengeCount, threshold: cfg.revenge_trade_threshold || 3 },
          details: { action: 'reduce_position_limit', reduction_pct: 50, duration_hours: 24 },
        });
      }

      // Martingale detection
      if (martingaleCount >= (cfg.martingale_threshold || 2)) {
        interventions.push({
          type: 'restriction',
          reason: `${martingaleCount} martingale patterns detected (threshold: ${cfg.martingale_threshold || 2})`,
          signals: { martingale_count: martingaleCount, threshold: cfg.martingale_threshold || 2 },
          details: { action: 'position_size_cap', cap_lots: avgSize, duration_hours: 48 },
        });
      }

      // Insert interventions
      for (const int of interventions) {
        // Check if similar active intervention already exists
        const existing = await sql.query(`
          SELECT COUNT(*) as cnt FROM prop_interventions
          WHERE account_id = $1 AND intervention_type = $2 AND status IN ('pending', 'active')
        `, [account_id, int.type]);

        if (parseInt(existing.rows[0].cnt) === 0) {
          await sql.query(`
            INSERT INTO prop_interventions
              (account_id, intervention_type, trigger_reason, trigger_score, trigger_signals,
               action_details, status, auto_triggered, expires_at)
            VALUES ($1, $2, $3, $4, $5, $6, 'active', true, now() + interval '${int.details.duration_hours || 24} hours')
          `, [account_id, int.type, int.reason, overallScore,
            JSON.stringify(int.signals), JSON.stringify(int.details)]);
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          score: {
            overall: overallScore,
            discipline: Math.round(disciplineScore),
            consistency: Math.round(consistencyScore),
            aggression: Math.round(aggressionScore),
            rule_adherence: Math.round(ruleAdherence),
            delta: scoreDelta,
            trend: trendDirection,
          },
          signals: {
            revenge_count: revengeCount,
            martingale_count: martingaleCount,
            overtrade_bursts: overtradeCount,
            panic_exits: panicExitCount,
            rule_violations: ruleViolationCount,
            position_sizing_cv: positionSizingCV.toFixed(3),
            leverage_slope: leverageSlope.toFixed(3),
            post_loss_aggression: postLossAggression.toFixed(2),
            hold_time_cv: holdTimeCV.toFixed(3),
          },
          interventions_triggered: interventions.length,
        },
      });
    }

    if (action === 'calculate_all') {
      // Calculate scores for all active funded/evaluation accounts
      const accounts = await sql.query(`
        SELECT account_id FROM prop_accounts
        WHERE phase IN ('evaluation', 'verification', 'funded') AND status = 'active'
      `);

      let scored = 0;
      let errors = 0;
      for (const acct of accounts.rows) {
        try {
          const res = await fetch(req.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'calculate_score', account_id: acct.account_id }),
          });
          if ((await res.json()).success) scored++;
          else errors++;
        } catch {
          errors++;
        }
      }

      return NextResponse.json({ success: true, data: { scored, errors, total: accounts.rows.length } });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Behavior POST error:', error);
    return NextResponse.json({ success: false, error: 'Score calculation failed' }, { status: 500 });
  }
}

// ── PUT: Update config / resolve interventions ───────────────

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'update_config') {
      const { config_key, config_value, description } = body;
      if (!config_key || config_value === undefined) {
        return NextResponse.json({ success: false, error: 'config_key and config_value required' }, { status: 400 });
      }

      await sql.query(`
        INSERT INTO prop_behavior_config (config_key, config_value, description)
        VALUES ($1, $2, $3)
        ON CONFLICT (config_key) DO UPDATE SET
          config_value = $2, description = COALESCE($3, prop_behavior_config.description), updated_at = now()
      `, [config_key, String(config_value), description]);

      return NextResponse.json({ success: true, data: { updated: config_key } });
    }

    if (action === 'resolve_intervention') {
      const { intervention_id, resolution_notes, status } = body;
      if (!intervention_id) return NextResponse.json({ success: false, error: 'intervention_id required' }, { status: 400 });

      await sql.query(`
        UPDATE prop_interventions
        SET status = $2, resolution_notes = $3, resolved_at = now()
        WHERE intervention_id = $1
      `, [intervention_id, status || 'expired', resolution_notes || 'Manually resolved']);

      return NextResponse.json({ success: true, data: { resolved: intervention_id } });
    }

    if (action === 'override_intervention') {
      const { intervention_id, approved_by, resolution_notes } = body;
      if (!intervention_id) return NextResponse.json({ success: false, error: 'intervention_id required' }, { status: 400 });

      await sql.query(`
        UPDATE prop_interventions
        SET status = 'overridden', approved_by = $2, resolution_notes = $3, resolved_at = now()
        WHERE intervention_id = $1
      `, [intervention_id, approved_by || 'admin', resolution_notes || 'Override']);

      return NextResponse.json({ success: true, data: { overridden: intervention_id } });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Behavior PUT error:', error);
    return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 });
  }
}
