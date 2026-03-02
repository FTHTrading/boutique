import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/sql';

export const dynamic = 'force-dynamic';

/**
 * GET  /api/prop-sharing/execution
 * - Returns execution configs, market sessions, blackouts, traces, daily summaries
 *
 * POST /api/prop-sharing/execution
 * - Simulate execution for a trade (spread, slippage, commission, blackout check)
 *
 * PUT  /api/prop-sharing/execution
 * - Update execution config, create/update blackout, toggle kill switch
 */

// ── GET: Execution data ──────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const section = url.searchParams.get('section') || 'overview';
    const accountId = url.searchParams.get('account_id');
    const instrument = url.searchParams.get('instrument');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);

    if (section === 'configs') {
      const result = await sql.query(`
        SELECT * FROM prop_execution_config
        WHERE is_active = true
        ORDER BY instrument, session_name
      `);
      return NextResponse.json({ success: true, data: { configs: result.rows } });
    }

    if (section === 'sessions') {
      const result = await sql.query(`
        SELECT * FROM prop_market_sessions
        WHERE is_active = true
        ORDER BY instrument, day_of_week, open_time
      `);
      return NextResponse.json({ success: true, data: { sessions: result.rows } });
    }

    if (section === 'blackouts') {
      const result = await sql.query(`
        SELECT * FROM prop_news_blackouts
        WHERE is_active = true
        ORDER BY blackout_start DESC
        LIMIT $1
      `, [limit]);
      return NextResponse.json({ success: true, data: { blackouts: result.rows } });
    }

    if (section === 'traces') {
      const conditions: string[] = [];
      const params: any[] = [];
      let idx = 1;

      if (accountId) { conditions.push(`et.account_id = $${idx++}`); params.push(accountId); }
      if (instrument) { conditions.push(`t.instrument = $${idx++}`); params.push(instrument); }
      params.push(limit);

      const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

      const result = await sql.query(`
        SELECT et.*, t.instrument, t.direction, t.size, a.account_number, a.trader_name
        FROM prop_execution_traces et
        JOIN prop_trades t ON t.trade_id = et.trade_id
        JOIN prop_accounts a ON a.account_id = et.account_id
        ${where}
        ORDER BY et.executed_at DESC
        LIMIT $${idx}
      `, params);

      return NextResponse.json({ success: true, data: { traces: result.rows } });
    }

    if (section === 'summaries') {
      const conditions: string[] = [];
      const params: any[] = [];
      let idx = 1;

      if (accountId) { conditions.push(`account_id = $${idx++}`); params.push(accountId); }
      params.push(limit);

      const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

      const result = await sql.query(`
        SELECT * FROM prop_execution_daily_summary
        ${where}
        ORDER BY summary_date DESC
        LIMIT $${idx}
      `, params);

      return NextResponse.json({ success: true, data: { summaries: result.rows } });
    }

    if (section === 'kill-switches') {
      const result = await sql.query(`SELECT * FROM v_active_kill_switches`);
      return NextResponse.json({ success: true, data: { kill_switches: result.rows } });
    }

    // Default: overview
    const [configs, blackouts, recentTraces, summaries, killSwitches] = await Promise.all([
      sql.query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_active) as active FROM prop_execution_config`),
      sql.query(`
        SELECT COUNT(*) as total,
               COUNT(*) FILTER (WHERE is_active AND blackout_start <= now() AND blackout_end >= now()) as currently_active,
               COUNT(*) FILTER (WHERE is_active AND blackout_start > now() AND blackout_start <= now() + interval '24 hours') as upcoming_24h
        FROM prop_news_blackouts
      `),
      sql.query(`
        SELECT COUNT(*) as total,
               COALESCE(AVG(spread_applied), 0) as avg_spread,
               COALESCE(AVG(slippage_applied), 0) as avg_slippage,
               COALESCE(SUM(commission_charged), 0) as total_commissions,
               COUNT(*) FILTER (WHERE fill_type = 'partial') as partial_fills,
               COUNT(*) FILTER (WHERE order_status = 'rejected') as rejections,
               COUNT(*) FILTER (WHERE blackout_active) as blackout_violations
        FROM prop_execution_traces
        WHERE executed_at > now() - interval '24 hours'
      `),
      sql.query(`
        SELECT * FROM prop_execution_daily_summary
        WHERE account_id IS NULL
        ORDER BY summary_date DESC
        LIMIT 7
      `),
      sql.query(`SELECT * FROM v_active_kill_switches`),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        configs: configs.rows[0],
        blackouts: blackouts.rows[0],
        recent_execution: recentTraces.rows[0],
        daily_summaries: summaries.rows,
        kill_switches: killSwitches.rows,
      },
    });
  } catch (error) {
    console.error('Execution GET error:', error);
    return NextResponse.json({
      success: true,
      data: {
        configs: { total: 0, active: 0 },
        blackouts: { total: 0, currently_active: 0, upcoming_24h: 0 },
        recent_execution: { total: 0, avg_spread: 0, avg_slippage: 0, total_commissions: 0, partial_fills: 0, rejections: 0, blackout_violations: 0 },
        daily_summaries: [],
        kill_switches: [],
      },
    });
  }
}

// ── POST: Simulate execution ─────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'simulate') {
      const { trade_id } = body;
      if (!trade_id) return NextResponse.json({ success: false, error: 'trade_id required' }, { status: 400 });

      // Get trade details
      const tradeRes = await sql.query(`
        SELECT t.*, a.account_number, a.trader_name
        FROM prop_trades t
        JOIN prop_accounts a ON a.account_id = t.account_id
        WHERE t.trade_id = $1
      `, [trade_id]);

      if (tradeRes.rows.length === 0) return NextResponse.json({ success: false, error: 'Trade not found' }, { status: 404 });
      const trade = tradeRes.rows[0];

      // Check kill switches
      const killCheck = await sql.query(`
        SELECT * FROM prop_kill_switches
        WHERE is_active = true AND (
          (scope = 'firm') OR
          (scope = 'trader' AND target_id = $1) OR
          (scope = 'instrument' AND target_id = $2)
        )
      `, [trade.account_id, trade.instrument]);

      if (killCheck.rows.length > 0) {
        const trace = await createTrace(trade, {
          order_status: 'rejected',
          fill_type: 'none',
          fill_pct: 0,
          quantity_filled: 0,
          spread_applied: 0,
          slippage_applied: 0,
          commission_charged: 0,
          notes: `Kill switch active: ${killCheck.rows[0].reason || 'No reason given'}`,
        });
        return NextResponse.json({ success: true, data: { trace, rejected: true, reason: 'kill_switch' } });
      }

      // Check blackout
      const now = new Date();
      const blackoutRes = await sql.query(`
        SELECT * FROM prop_news_blackouts
        WHERE is_active = true
          AND $1 = ANY(instruments)
          AND $2 >= blackout_start - (pre_window_mins || ' minutes')::interval
          AND $2 <= blackout_end + (post_window_mins || ' minutes')::interval
        LIMIT 1
      `, [trade.instrument, now]);

      const blackoutActive = blackoutRes.rows.length > 0;
      const blackout = blackoutRes.rows[0];

      if (blackoutActive && blackout?.action === 'block') {
        const trace = await createTrace(trade, {
          order_status: 'rejected',
          fill_type: 'none',
          fill_pct: 0,
          quantity_filled: 0,
          spread_applied: 0,
          slippage_applied: 0,
          commission_charged: 0,
          blackout_active: true,
          blackout_id: blackout.blackout_id,
          notes: `Blocked by blackout: ${blackout.name}`,
        });
        return NextResponse.json({ success: true, data: { trace, rejected: true, reason: 'blackout_block' } });
      }

      // Get execution config
      const currentHour = now.getUTCHours();
      let sessionName = 'default';
      if (currentHour >= 8 && currentHour < 16) sessionName = 'london';
      else if (currentHour >= 13 && currentHour < 21) sessionName = 'new_york';
      else if (currentHour >= 0 && currentHour < 9) sessionName = 'asia';

      const configRes = await sql.query(`
        SELECT * FROM prop_execution_config
        WHERE instrument = $1 AND is_active = true
        ORDER BY CASE WHEN session_name = $2 THEN 0 ELSE 1 END
        LIMIT 1
      `, [trade.instrument, sessionName]);

      // Default config if none found
      const config = configRes.rows[0] || {
        base_spread_bps: 2.0,
        volatility_spread_mult: 1.0,
        base_slippage_bps: 1.0,
        size_slippage_mult: 0.5,
        size_threshold_lots: 10,
        commission_per_lot: 3.50,
        partial_fill_enabled: false,
        max_partial_pct: 100,
      };

      // Calculate spread (basis points)
      const volatilityFactor = 1 + (Math.random() * 0.3); // Simulated volatility
      const spreadBps = config.base_spread_bps * config.volatility_spread_mult * volatilityFactor;
      const spreadAmount = (trade.entry_price || 0) * (spreadBps / 10000);

      // Calculate slippage (basis points, size-dependent)
      const sizeFactor = trade.size > config.size_threshold_lots
        ? 1 + ((trade.size - config.size_threshold_lots) / config.size_threshold_lots) * config.size_slippage_mult
        : 1;
      const slippageBps = config.base_slippage_bps * sizeFactor * (0.5 + Math.random());
      const slippageAmount = (trade.entry_price || 0) * (slippageBps / 10000);

      // Commission
      const commission = config.commission_per_lot * (trade.size || 1);

      // Fill simulation
      let fillType = 'full' as string;
      let fillPct = 100;
      let quantityFilled = trade.size || 1;

      if (config.partial_fill_enabled && trade.size > config.size_threshold_lots) {
        const partialChance = Math.min((trade.size - config.size_threshold_lots) / (config.size_threshold_lots * 3), 0.4);
        if (Math.random() < partialChance) {
          fillPct = Math.max(30, Math.min(config.max_partial_pct, 50 + Math.random() * 50));
          quantityFilled = Math.floor(trade.size * (fillPct / 100));
          fillType = 'partial';
        }
      }

      // Calculate fill price
      const direction = trade.direction === 'long' ? 1 : -1;
      const fillPrice = (trade.entry_price || 0) + (direction * (spreadAmount + slippageAmount));

      // Execution latency simulation (10-250ms)
      const latencyMs = Math.floor(10 + Math.random() * 240);

      const trace = await createTrace(trade, {
        order_status: fillType === 'partial' ? 'partial' : 'filled',
        fill_type: fillType,
        fill_pct: fillPct,
        quantity_filled: quantityFilled,
        fill_price: fillPrice,
        spread_applied: spreadBps,
        slippage_applied: slippageBps,
        commission_charged: commission,
        execution_latency_ms: latencyMs,
        market_session: sessionName,
        volatility_regime: volatilityFactor > 1.15 ? 'high' : volatilityFactor > 1.05 ? 'medium' : 'low',
        blackout_active: blackoutActive,
        blackout_id: blackout?.blackout_id,
        notes: blackoutActive ? `Warning: executed during blackout window (${blackout?.name})` : null,
      });

      return NextResponse.json({ success: true, data: { trace } });
    }

    if (action === 'aggregate_daily') {
      // Aggregate today's execution traces into daily summary
      const today = new Date().toISOString().split('T')[0];

      await sql.query(`
        INSERT INTO prop_execution_daily_summary
          (summary_date, account_id, total_orders, fills, partial_fills, rejections,
           avg_spread_bps, avg_slippage_bps, total_commissions, blackout_violations)
        SELECT
          $1::date,
          account_id,
          COUNT(*),
          COUNT(*) FILTER (WHERE order_status = 'filled'),
          COUNT(*) FILTER (WHERE order_status = 'partial'),
          COUNT(*) FILTER (WHERE order_status = 'rejected'),
          COALESCE(AVG(spread_applied), 0),
          COALESCE(AVG(slippage_applied), 0),
          COALESCE(SUM(commission_charged), 0),
          COUNT(*) FILTER (WHERE blackout_active)
        FROM prop_execution_traces
        WHERE executed_at::date = $1::date
        GROUP BY account_id
        ON CONFLICT (summary_date, COALESCE(account_id, '00000000-0000-0000-0000-000000000000'))
        DO UPDATE SET
          total_orders = EXCLUDED.total_orders,
          fills = EXCLUDED.fills,
          partial_fills = EXCLUDED.partial_fills,
          rejections = EXCLUDED.rejections,
          avg_spread_bps = EXCLUDED.avg_spread_bps,
          avg_slippage_bps = EXCLUDED.avg_slippage_bps,
          total_commissions = EXCLUDED.total_commissions,
          blackout_violations = EXCLUDED.blackout_violations
      `, [today]);

      // Also insert firm-wide summary (null account_id)
      await sql.query(`
        INSERT INTO prop_execution_daily_summary
          (summary_date, account_id, total_orders, fills, partial_fills, rejections,
           avg_spread_bps, avg_slippage_bps, total_commissions, blackout_violations)
        SELECT
          $1::date,
          NULL,
          COUNT(*),
          COUNT(*) FILTER (WHERE order_status = 'filled'),
          COUNT(*) FILTER (WHERE order_status = 'partial'),
          COUNT(*) FILTER (WHERE order_status = 'rejected'),
          COALESCE(AVG(spread_applied), 0),
          COALESCE(AVG(slippage_applied), 0),
          COALESCE(SUM(commission_charged), 0),
          COUNT(*) FILTER (WHERE blackout_active)
        FROM prop_execution_traces
        WHERE executed_at::date = $1::date
        ON CONFLICT (summary_date, COALESCE(account_id, '00000000-0000-0000-0000-000000000000'))
        DO UPDATE SET
          total_orders = EXCLUDED.total_orders,
          fills = EXCLUDED.fills,
          partial_fills = EXCLUDED.partial_fills,
          rejections = EXCLUDED.rejections,
          avg_spread_bps = EXCLUDED.avg_spread_bps,
          avg_slippage_bps = EXCLUDED.avg_slippage_bps,
          total_commissions = EXCLUDED.total_commissions,
          blackout_violations = EXCLUDED.blackout_violations
      `, [today]);

      return NextResponse.json({ success: true, data: { aggregated: today } });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Execution POST error:', error);
    return NextResponse.json({ success: false, error: 'Execution simulation failed' }, { status: 500 });
  }
}

// ── PUT: Update config / blackout / kill switch ──────────────

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'update_config') {
      const { config_id, ...updates } = body;
      if (!config_id) return NextResponse.json({ success: false, error: 'config_id required' }, { status: 400 });

      const fields: string[] = [];
      const params: any[] = [config_id];
      let idx = 2;

      const allowed = ['base_spread_bps', 'volatility_spread_mult', 'base_slippage_bps', 'size_slippage_mult',
        'size_threshold_lots', 'commission_per_lot', 'partial_fill_enabled', 'max_partial_pct', 'is_active'];

      for (const key of allowed) {
        if (updates[key] !== undefined) {
          fields.push(`${key} = $${idx++}`);
          params.push(updates[key]);
        }
      }

      if (fields.length === 0) return NextResponse.json({ success: false, error: 'No valid fields' }, { status: 400 });
      fields.push('updated_at = now()');

      await sql.query(`UPDATE prop_execution_config SET ${fields.join(', ')} WHERE config_id = $1`, params);
      return NextResponse.json({ success: true, data: { updated: config_id } });
    }

    if (action === 'create_blackout') {
      const { name, instruments, blackout_start, blackout_end, pre_window_mins, post_window_mins,
        action: blackoutAction, severity, is_recurring, recurrence_rule } = body;

      const result = await sql.query(`
        INSERT INTO prop_news_blackouts
          (name, instruments, blackout_start, blackout_end, pre_window_mins, post_window_mins,
           action, severity, is_recurring, recurrence_rule)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `, [name, instruments, blackout_start, blackout_end, pre_window_mins || 15,
        post_window_mins || 10, blackoutAction || 'block', severity || 'high',
        is_recurring || false, recurrence_rule]);

      return NextResponse.json({ success: true, data: { blackout: result.rows[0] } });
    }

    if (action === 'toggle_kill_switch') {
      const { scope, target_id, is_active, reason, activated_by } = body;
      if (!scope) return NextResponse.json({ success: false, error: 'scope required' }, { status: 400 });

      if (is_active) {
        const result = await sql.query(`
          INSERT INTO prop_kill_switches (scope, target_id, is_active, reason, activated_by, activated_at)
          VALUES ($1, $2, true, $3, $4, now())
          ON CONFLICT (scope, COALESCE(target_id, '')) WHERE is_active = true
          DO UPDATE SET reason = EXCLUDED.reason, activated_by = EXCLUDED.activated_by, activated_at = now()
          RETURNING *
        `, [scope, target_id, reason, activated_by]);
        return NextResponse.json({ success: true, data: { kill_switch: result.rows[0] } });
      } else {
        await sql.query(`
          UPDATE prop_kill_switches
          SET is_active = false, deactivated_at = now()
          WHERE scope = $1 AND ($2::uuid IS NULL OR target_id = $2) AND is_active = true
        `, [scope, target_id]);
        return NextResponse.json({ success: true, data: { deactivated: true } });
      }
    }

    if (action === 'create_config') {
      const { instrument, session_name, base_spread_bps, volatility_spread_mult, base_slippage_bps,
        size_slippage_mult, size_threshold_lots, commission_per_lot, partial_fill_enabled, max_partial_pct } = body;

      const result = await sql.query(`
        INSERT INTO prop_execution_config
          (instrument, session_name, base_spread_bps, volatility_spread_mult, base_slippage_bps,
           size_slippage_mult, size_threshold_lots, commission_per_lot, partial_fill_enabled, max_partial_pct)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `, [instrument, session_name || 'default', base_spread_bps || 2.0, volatility_spread_mult || 1.0,
        base_slippage_bps || 1.0, size_slippage_mult || 0.5, size_threshold_lots || 10,
        commission_per_lot || 3.50, partial_fill_enabled || false, max_partial_pct || 100]);

      return NextResponse.json({ success: true, data: { config: result.rows[0] } });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Execution PUT error:', error);
    return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 });
  }
}

// ── Helper: Create execution trace ───────────────────────────

async function createTrace(trade: any, overrides: Record<string, any>) {
  const result = await sql.query(`
    INSERT INTO prop_execution_traces
      (trade_id, account_id, order_type, order_status, intended_price, fill_price,
       spread_applied, slippage_applied, commission_charged, fill_type, fill_pct,
       quantity_requested, quantity_filled, execution_latency_ms, market_session,
       volatility_regime, blackout_active, blackout_id, notes)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
    RETURNING *
  `, [
    trade.trade_id,
    trade.account_id,
    'market',
    overrides.order_status || 'filled',
    trade.entry_price || 0,
    overrides.fill_price || trade.entry_price || 0,
    overrides.spread_applied || 0,
    overrides.slippage_applied || 0,
    overrides.commission_charged || 0,
    overrides.fill_type || 'full',
    overrides.fill_pct || 100,
    trade.size || 1,
    overrides.quantity_filled || trade.size || 1,
    overrides.execution_latency_ms || 0,
    overrides.market_session || null,
    overrides.volatility_regime || 'low',
    overrides.blackout_active || false,
    overrides.blackout_id || null,
    overrides.notes || null,
  ]);

  return result.rows[0];
}
