import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/sql';

export const dynamic = 'force-dynamic';

/**
 * GET  /api/prop-sharing/treasury-guard
 * - Returns reserve policy, throttle state, stress tests, capital snapshots
 *
 * POST /api/prop-sharing/treasury-guard
 * - Run treasury health check (reserve calc, throttle update, stress test, snapshot)
 *
 * PUT  /api/prop-sharing/treasury-guard
 * - Update reserve policy
 */

// ── GET: Treasury data ───────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const section = url.searchParams.get('section') || 'overview';

    if (section === 'policy') {
      const result = await sql.query(`SELECT * FROM prop_reserve_policy WHERE is_active = true LIMIT 1`);
      return NextResponse.json({ success: true, data: { policy: result.rows[0] || null } });
    }

    if (section === 'throttle') {
      const result = await sql.query(`SELECT * FROM v_throttle_current`);
      return NextResponse.json({ success: true, data: { throttle: result.rows[0] || null } });
    }

    if (section === 'stress-tests') {
      const result = await sql.query(`
        SELECT * FROM prop_stress_tests
        ORDER BY run_at DESC
        LIMIT 20
      `);
      return NextResponse.json({ success: true, data: { stress_tests: result.rows } });
    }

    if (section === 'snapshots') {
      const result = await sql.query(`
        SELECT * FROM prop_capital_snapshots
        ORDER BY snapshot_date DESC
        LIMIT 30
      `);
      return NextResponse.json({ success: true, data: { snapshots: result.rows } });
    }

    if (section === 'throttle-history') {
      const result = await sql.query(`
        SELECT * FROM prop_throttle_history
        ORDER BY changed_at DESC
        LIMIT 50
      `);
      return NextResponse.json({ success: true, data: { history: result.rows } });
    }

    // Default: overview
    const [policy, throttle, recentTests, snapshots] = await Promise.all([
      sql.query(`SELECT * FROM prop_reserve_policy WHERE is_active = true LIMIT 1`),
      sql.query(`SELECT * FROM v_throttle_current`),
      sql.query(`SELECT * FROM prop_stress_tests ORDER BY run_at DESC LIMIT 5`),
      sql.query(`SELECT * FROM prop_capital_snapshots ORDER BY snapshot_date DESC LIMIT 14`),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        policy: policy.rows[0] || null,
        throttle: throttle.rows[0] || null,
        stress_tests: recentTests.rows,
        snapshots: snapshots.rows,
      },
    });
  } catch (error) {
    console.error('Treasury Guard GET error:', error);
    return NextResponse.json({
      success: true,
      data: { policy: null, throttle: null, stress_tests: [], snapshots: [] },
    });
  }
}

// ── POST: Run treasury health check ──────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'health_check') {
      // Get active policy
      const policyRes = await sql.query(`SELECT * FROM prop_reserve_policy WHERE is_active = true LIMIT 1`);
      if (policyRes.rows.length === 0) {
        return NextResponse.json({ success: false, error: 'No active reserve policy' }, { status: 400 });
      }
      const policy = policyRes.rows[0];

      // Get capital state from funded accounts
      const capitalRes = await sql.query(`
        SELECT
          COALESCE(SUM(funded_capital), 0) as deployed_capital,
          COALESCE(SUM(current_balance - funded_capital), 0) as unrealized_pnl,
          COUNT(*) as funded_count
        FROM prop_accounts
        WHERE phase = 'funded' AND status = 'active'
      `);
      const capital = capitalRes.rows[0];

      // Get total firm capital (from treasury if exists, or estimate)
      const treasuryRes = await sql.query(`
        SELECT COALESCE(SUM(
          CASE WHEN entry_type IN ('deposit', 'eval_fee', 'commission_earned', 'interest')
               THEN amount ELSE -amount END
        ), 0) as total_capital
        FROM prop_treasury_entries
      `);
      const totalCapital = parseFloat(treasuryRes.rows[0]?.total_capital || '0');

      const deployedCapital = parseFloat(capital.deployed_capital);
      const unrealizedPnl = parseFloat(capital.unrealized_pnl);
      const reserveCapital = totalCapital - deployedCapital;
      const fundedCount = parseInt(capital.funded_count);

      // Calculate required reserve
      const reserveAbsolute = parseFloat(policy.min_reserve_absolute);
      const reservePctRequired = deployedCapital * (parseFloat(policy.min_reserve_pct) / 100);
      const reserveRequired = Math.max(reserveAbsolute, reservePctRequired);

      // Dynamic buffer (if enabled, add volatility-based buffer)
      let dynamicBuffer = 0;
      if (policy.dynamic_buffer_enabled) {
        const volatilityRes = await sql.query(`
          SELECT
            COALESCE(STDDEV(daily_pnl), 0) as pnl_stddev
          FROM (
            SELECT DATE(closed_at) as d, SUM(realized_pnl) as daily_pnl
            FROM prop_trades
            WHERE status = 'closed' AND closed_at > now() - interval '${policy.volatility_lookback_days} days'
            GROUP BY DATE(closed_at)
          ) sub
        `);
        const pnlStddev = parseFloat(volatilityRes.rows[0]?.pnl_stddev || '0');
        dynamicBuffer = pnlStddev * parseFloat(policy.volatility_buffer_mult);
      }

      const totalReserveRequired = reserveRequired + dynamicBuffer;

      // Calculate buffer health (0-100)
      const bufferHealth = totalReserveRequired > 0
        ? Math.min(100, Math.round((reserveCapital / totalReserveRequired) * 100))
        : 100;

      // Determine throttle status
      let status: string;
      let scalingPaused = false;
      let newFundingPaused = false;
      let reason = '';

      if (bufferHealth >= 80) {
        status = 'normal';
        reason = 'Reserve buffer healthy';
      } else if (bufferHealth >= 50) {
        status = 'caution';
        reason = `Buffer at ${bufferHealth}% — monitor closely`;
      } else if (bufferHealth >= 25) {
        status = 'throttled';
        scalingPaused = true;
        reason = `Buffer at ${bufferHealth}% — scaling paused, new funding throttled`;
      } else {
        status = 'frozen';
        scalingPaused = true;
        newFundingPaused = true;
        reason = `Buffer critically low at ${bufferHealth}% — all funding frozen`;
      }

      // Check funded trader cap
      if (fundedCount >= parseInt(policy.max_funded_traders)) {
        newFundingPaused = true;
        reason += ` | Funded trader cap reached (${fundedCount}/${policy.max_funded_traders})`;
      }

      // Upsert throttle state
      await sql.query(`
        INSERT INTO prop_throttle_state
          (status, available_capital, reserve_required, reserve_actual, reserve_pct,
           buffer_health, funded_count, funded_cap, scaling_paused, new_funding_paused, reason)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [status, totalCapital - deployedCapital, totalReserveRequired, reserveCapital,
        totalReserveRequired > 0 ? (reserveCapital / totalReserveRequired * 100) : 100,
        bufferHealth, fundedCount, parseInt(policy.max_funded_traders),
        scalingPaused, newFundingPaused, reason]);

      // Save to throttle history
      await sql.query(`
        INSERT INTO prop_throttle_history
          (status, buffer_health, reason)
        VALUES ($1, $2, $3)
      `, [status, bufferHealth, reason]);

      // ── Run Stress Tests ──
      const scenarios = [
        { name: '10% Market Gap', type: 'market_gap', gap_pct: 10, correlation_shock: null },
        { name: '20% Market Gap', type: 'market_gap', gap_pct: 20, correlation_shock: null },
        { name: 'Correlation Shock', type: 'correlation_shock', gap_pct: null, correlation_shock: 0.95 },
        { name: 'Black Swan (30% gap)', type: 'black_swan', gap_pct: 30, correlation_shock: 0.98 },
      ];

      const stressResults = [];
      for (const scenario of scenarios) {
        const gapPct = scenario.gap_pct || parseFloat(policy.stress_gap_pct);
        const corrShock = scenario.correlation_shock || parseFloat(policy.stress_correlation);

        // Estimate loss: deployed capital * gap% * correlation factor
        const estimatedLoss = deployedCapital * (gapPct / 100) * corrShock;
        const capitalRemaining = totalCapital - estimatedLoss;
        const survival = capitalRemaining > reserveAbsolute;
        const survivalScore = Math.max(0, Math.min(100,
          Math.round((capitalRemaining / totalCapital) * 100)));

        await sql.query(`
          INSERT INTO prop_stress_tests
            (scenario_name, scenario_type, gap_pct, correlation_shock,
             estimated_loss, capital_remaining, survival, survival_score,
             affected_accounts, details)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [scenario.name, scenario.type, gapPct, corrShock,
          estimatedLoss, capitalRemaining, survival, survivalScore,
          fundedCount, JSON.stringify({
            total_capital: totalCapital,
            deployed: deployedCapital,
            reserve: reserveCapital,
            gap_applied: gapPct,
          })]);

        stressResults.push({
          name: scenario.name,
          estimated_loss: estimatedLoss,
          capital_remaining: capitalRemaining,
          survival,
          survival_score: survivalScore,
        });
      }

      // ── Capital Snapshot ──
      const today = new Date().toISOString().split('T')[0];

      // Get eval revenue + payouts
      const revenueRes = await sql.query(`
        SELECT
          COALESCE(SUM(amount) FILTER (WHERE entry_type = 'eval_fee'), 0) as eval_revenue,
          COALESCE(SUM(amount) FILTER (WHERE entry_type = 'payout'), 0) as payouts,
          COALESCE(SUM(CASE WHEN entry_type IN ('deposit', 'eval_fee', 'commission_earned', 'interest')
                        THEN amount ELSE -amount END), 0) as net_position
        FROM prop_treasury_entries
      `);
      const rev = revenueRes.rows[0];

      const retainedEarnings = totalCapital - deployedCapital - parseFloat(rev.payouts || '0');

      // Get 30-day firm volatility
      const firmVolRes = await sql.query(`
        SELECT COALESCE(STDDEV(daily_pnl), 0) as firm_vol
        FROM (
          SELECT DATE(closed_at) as d, SUM(realized_pnl) as daily_pnl
          FROM prop_trades
          WHERE status = 'closed' AND closed_at > now() - interval '30 days'
          GROUP BY DATE(closed_at)
        ) sub
      `);

      await sql.query(`
        INSERT INTO prop_capital_snapshots
          (snapshot_date, total_capital, deployed_capital, reserve_capital, unrealized_pnl,
           retained_earnings, eval_fee_revenue, payout_obligations, net_position,
           firm_volatility_30d, throttle_status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (snapshot_date) DO UPDATE SET
          total_capital = EXCLUDED.total_capital,
          deployed_capital = EXCLUDED.deployed_capital,
          reserve_capital = EXCLUDED.reserve_capital,
          unrealized_pnl = EXCLUDED.unrealized_pnl,
          retained_earnings = EXCLUDED.retained_earnings,
          eval_fee_revenue = EXCLUDED.eval_fee_revenue,
          payout_obligations = EXCLUDED.payout_obligations,
          net_position = EXCLUDED.net_position,
          firm_volatility_30d = EXCLUDED.firm_volatility_30d,
          throttle_status = EXCLUDED.throttle_status
      `, [today, totalCapital, deployedCapital, reserveCapital, unrealizedPnl,
        retainedEarnings, parseFloat(rev.eval_revenue), parseFloat(rev.payouts),
        parseFloat(rev.net_position), parseFloat(firmVolRes.rows[0]?.firm_vol || '0'),
        status]);

      return NextResponse.json({
        success: true,
        data: {
          throttle: { status, buffer_health: bufferHealth, scaling_paused: scalingPaused, new_funding_paused: newFundingPaused, reason },
          capital: { total: totalCapital, deployed: deployedCapital, reserve: reserveCapital, required: totalReserveRequired },
          stress_results: stressResults,
        },
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Treasury Guard POST error:', error);
    return NextResponse.json({ success: false, error: 'Health check failed' }, { status: 500 });
  }
}

// ── PUT: Update reserve policy ───────────────────────────────

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'update_policy') {
      const { policy_id, ...updates } = body;
      if (!policy_id) return NextResponse.json({ success: false, error: 'policy_id required' }, { status: 400 });

      const fields: string[] = [];
      const params: any[] = [policy_id];
      let idx = 2;

      const allowed = [
        'name', 'min_reserve_absolute', 'min_reserve_pct', 'dynamic_buffer_enabled',
        'volatility_lookback_days', 'volatility_buffer_mult', 'max_funded_traders',
        'max_total_notional', 'max_per_instrument', 'max_per_sector_pct',
        'stress_gap_pct', 'stress_correlation',
      ];

      for (const key of allowed) {
        if (updates[key] !== undefined) {
          fields.push(`${key} = $${idx++}`);
          params.push(updates[key]);
        }
      }

      if (fields.length === 0) return NextResponse.json({ success: false, error: 'No valid fields' }, { status: 400 });
      fields.push('updated_at = now()');

      await sql.query(`UPDATE prop_reserve_policy SET ${fields.join(', ')} WHERE policy_id = $1`, params);
      return NextResponse.json({ success: true, data: { updated: policy_id } });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Treasury Guard PUT error:', error);
    return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 });
  }
}
