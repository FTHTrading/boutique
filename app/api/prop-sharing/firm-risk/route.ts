import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/sql';

export const dynamic = 'force-dynamic';

/**
 * GET  /api/prop-sharing/firm-risk
 * - Returns firm-wide risk config, latest exposure snapshot, sector breakdown, active correlation alerts
 *
 * POST /api/prop-sharing/firm-risk
 * - Calculates and stores a new firm exposure snapshot
 *
 * PUT  /api/prop-sharing/firm-risk
 * - Updates a firm risk config value
 */

// ── GET: Firm risk dashboard data ────────────────────────────

export async function GET() {
  try {
    // 1. Risk config
    const configRes = await sql.query('SELECT * FROM prop_firm_risk_config ORDER BY config_key');

    // 2. Latest exposure snapshot
    const snapRes = await sql.query(
      'SELECT * FROM prop_firm_exposure ORDER BY snapshot_time DESC LIMIT 1'
    );

    // 3. Sector breakdown from latest snapshot
    let sectors: any[] = [];
    if (snapRes.rows.length > 0) {
      const sectorRes = await sql.query(
        'SELECT * FROM prop_sector_exposure WHERE snapshot_id = $1 ORDER BY pct_of_total DESC',
        [snapRes.rows[0].snapshot_id]
      );
      sectors = sectorRes.rows;
    }

    // 4. Active correlation alerts
    const corrRes = await sql.query(
      'SELECT * FROM prop_correlation_alerts WHERE is_active = TRUE ORDER BY created_at DESC LIMIT 20'
    );

    // 5. Aggregate stats for context
    const statsRes = await sql.query(`
      SELECT
        COUNT(*) FILTER (WHERE current_phase = 'funded' AND status = 'active') as funded_accounts,
        COALESCE(SUM(current_balance) FILTER (WHERE current_phase = 'funded' AND status = 'active'), 0) as total_deployed,
        COALESCE(SUM(current_balance - starting_balance) FILTER (WHERE current_phase = 'funded' AND status = 'active'), 0) as unrealized_pnl,
        COUNT(*) FILTER (WHERE status = 'active') as total_active
      FROM prop_accounts
    `);

    // 6. Exposure history (last 30 snapshots for chart)
    const historyRes = await sql.query(
      'SELECT snapshot_id, snapshot_time, total_capital_deployed, net_exposure, capital_utilization_pct, is_within_limits FROM prop_firm_exposure ORDER BY snapshot_time DESC LIMIT 30'
    );

    return NextResponse.json({
      success: true,
      data: {
        config: configRes.rows,
        latest_snapshot: snapRes.rows[0] || null,
        sectors,
        correlation_alerts: corrRes.rows,
        stats: statsRes.rows[0],
        exposure_history: historyRes.rows,
      },
    });
  } catch (error) {
    console.error('Firm risk GET error:', error);
    return NextResponse.json({
      success: true,
      data: { config: [], latest_snapshot: null, sectors: [], correlation_alerts: [], stats: {}, exposure_history: [] },
    });
  }
}

// ── POST: Calculate new exposure snapshot ─────────────────────

export async function POST() {
  try {
    // Get firm risk limits
    const configRes = await sql.query('SELECT config_key, config_value FROM prop_firm_risk_config');
    const config: Record<string, any> = {};
    configRes.rows.forEach((r: any) => { config[r.config_key] = r.config_value; });

    const maxExposure = config.max_total_exposure?.amount || 5000000;
    const maxSectorPct = config.max_sector_concentration?.pct || 40;
    const marginReservePct = config.margin_reserve_pct?.pct || 20;
    const maxConcurrent = config.max_concurrent_funded?.count || 100;
    const dailyFirmLossLimit = config.daily_firm_loss_limit?.pct || 3;

    // Aggregate funded account data
    const acctRes = await sql.query(`
      SELECT
        COUNT(*) as funded_count,
        COALESCE(SUM(starting_balance), 0) as total_allocated,
        COALESCE(SUM(current_balance), 0) as total_current,
        COALESCE(SUM(current_balance - starting_balance), 0) as total_pnl
      FROM prop_accounts
      WHERE current_phase = 'funded' AND status = 'active'
    `);

    const stats = acctRes.rows[0];
    const totalDeployed = parseFloat(stats.total_allocated) || 0;
    const totalPnl = parseFloat(stats.total_pnl) || 0;
    const fundedCount = parseInt(stats.funded_count) || 0;
    const netExposure = totalDeployed + totalPnl;
    const utilizationPct = maxExposure > 0 ? (totalDeployed / maxExposure) * 100 : 0;
    const marginReserve = maxExposure * (marginReservePct / 100);

    // Check for breaches
    const breachFlags: string[] = [];

    if (totalDeployed > maxExposure) {
      breachFlags.push(`Total deployed ($${totalDeployed.toLocaleString()}) exceeds max exposure ($${maxExposure.toLocaleString()})`);
    }
    if (fundedCount > maxConcurrent) {
      breachFlags.push(`Funded accounts (${fundedCount}) exceeds maximum concurrent (${maxConcurrent})`);
    }

    // Daily firm P&L check
    const dailyPnlRes = await sql.query(`
      SELECT COALESCE(SUM(pnl), 0) as daily_pnl
      FROM prop_trades
      WHERE status = 'closed'
        AND closed_at >= CURRENT_DATE
    `);
    const dailyPnl = parseFloat(dailyPnlRes.rows[0].daily_pnl) || 0;
    const dailyLossThreshold = totalDeployed * (dailyFirmLossLimit / 100);
    if (dailyPnl < 0 && Math.abs(dailyPnl) > dailyLossThreshold) {
      breachFlags.push(`Daily firm loss ($${Math.abs(dailyPnl).toLocaleString()}) exceeds ${dailyFirmLossLimit}% limit ($${dailyLossThreshold.toLocaleString()})`);
    }

    // Sector exposure aggregation from open trades
    const sectorRes = await sql.query(`
      SELECT
        COALESCE(t.commodity_sector, 'unknown') as sector,
        t.commodity,
        SUM(CASE WHEN t.direction = 'long' THEN t.quantity * t.entry_price ELSE 0 END) as long_exp,
        SUM(CASE WHEN t.direction = 'short' THEN t.quantity * t.entry_price ELSE 0 END) as short_exp,
        COUNT(DISTINCT t.account_id) as num_accounts
      FROM prop_trades t
      JOIN prop_accounts a ON a.account_id = t.account_id
      WHERE t.status = 'open'
        AND a.current_phase = 'funded'
        AND a.status = 'active'
      GROUP BY COALESCE(t.commodity_sector, 'unknown'), t.commodity
    `);

    const isWithinLimits = breachFlags.length === 0;

    // Insert snapshot
    const snapRes = await sql.query(
      `INSERT INTO prop_firm_exposure
       (total_funded_accounts, total_capital_deployed, total_unrealized_pnl, total_realized_pnl, net_exposure,
        capital_utilization_pct, margin_reserve, breach_flags, is_within_limits)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [fundedCount, totalDeployed, totalPnl, dailyPnl, netExposure,
       Math.round(utilizationPct * 100) / 100, marginReserve,
       JSON.stringify(breachFlags), isWithinLimits]
    );

    const snapshot = snapRes.rows[0];

    // Insert sector exposure rows
    const totalExp = sectorRes.rows.reduce((sum: number, r: any) =>
      sum + parseFloat(r.long_exp || 0) + parseFloat(r.short_exp || 0), 0
    );

    for (const row of sectorRes.rows) {
      const longExp = parseFloat(row.long_exp) || 0;
      const shortExp = parseFloat(row.short_exp) || 0;
      const sectorNet = longExp - shortExp;
      const sectorTotal = longExp + shortExp;
      const pctOfTotal = totalExp > 0 ? (sectorTotal / totalExp) * 100 : 0;
      const breach = pctOfTotal > maxSectorPct;

      if (breach) {
        breachFlags.push(`Sector "${row.sector}" at ${pctOfTotal.toFixed(1)}% exceeds ${maxSectorPct}% limit`);
      }

      await sql.query(
        `INSERT INTO prop_sector_exposure
         (snapshot_id, sector, commodity, long_exposure, short_exposure, net_exposure, num_accounts, pct_of_total, breach)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [snapshot.snapshot_id, row.sector, row.commodity, longExp, shortExp, sectorNet, row.num_accounts, Math.round(pctOfTotal * 100) / 100, breach]
      );
    }

    // If sector breaches were found, update the snapshot
    if (breachFlags.length > (isWithinLimits ? 0 : breachFlags.length)) {
      await sql.query(
        'UPDATE prop_firm_exposure SET breach_flags = $1, is_within_limits = FALSE WHERE snapshot_id = $2',
        [JSON.stringify(breachFlags), snapshot.snapshot_id]
      );
    }

    // Audit log
    await sql.query(
      `INSERT INTO prop_audit_log (entity_type, entity_id, action, new_value, performed_by, reason)
       VALUES ('firm_exposure', $1, 'snapshot_created', $2, 'system', 'Scheduled firm-wide risk assessment')`,
      [snapshot.snapshot_id, JSON.stringify({ breachFlags, isWithinLimits, totalDeployed, netExposure, utilizationPct: Math.round(utilizationPct * 100) / 100 })]
    );

    return NextResponse.json({
      success: true,
      data: {
        snapshot,
        breach_flags: breachFlags,
        is_within_limits: breachFlags.length === 0,
        sectors: sectorRes.rows.length,
      },
    });
  } catch (error) {
    console.error('Firm risk POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to calculate firm exposure' }, { status: 500 });
  }
}

// ── PUT: Update firm risk config ─────────────────────────────

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { config_key, config_value, updated_by } = body;

    if (!config_key || config_value === undefined) {
      return NextResponse.json({ success: false, error: 'config_key and config_value required' }, { status: 400 });
    }

    // Get current value for audit
    const current = await sql.query(
      'SELECT config_value FROM prop_firm_risk_config WHERE config_key = $1',
      [config_key]
    );

    const oldValue = current.rows[0]?.config_value || null;

    const result = await sql.query(
      `UPDATE prop_firm_risk_config
       SET config_value = $1, updated_by = $2, updated_at = now()
       WHERE config_key = $3
       RETURNING *`,
      [JSON.stringify(config_value), updated_by || 'admin', config_key]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Config key not found' }, { status: 404 });
    }

    // Audit log
    await sql.query(
      `INSERT INTO prop_audit_log (entity_type, entity_id, action, old_value, new_value, performed_by, reason)
       VALUES ('firm_risk_config', $1, 'config_updated', $2, $3, $4, $5)`,
      [config_key, JSON.stringify(oldValue), JSON.stringify(config_value), updated_by || 'admin', `Updated ${config_key}`]
    );

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Firm risk PUT error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update config' }, { status: 500 });
  }
}
