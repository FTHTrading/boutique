import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/sql';

export const dynamic = 'force-dynamic';

/**
 * GET  /api/prop-sharing/fraud
 * - Returns fraud alerts with filters (status, severity, type, account_id)
 *
 * POST /api/prop-sharing/fraud
 * - Runs fraud detection scan on a single account or all active accounts
 *
 * PUT  /api/prop-sharing/fraud
 * - Review/resolve a fraud alert (investigate, confirm, dismiss, resolve)
 */

// ── GET: Fraud alerts ────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const severity = url.searchParams.get('severity');
    const alertType = url.searchParams.get('type');
    const accountId = url.searchParams.get('account_id');

    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (status) { conditions.push(`fa.status = $${idx++}`); params.push(status); }
    if (severity) { conditions.push(`fa.severity = $${idx++}`); params.push(severity); }
    if (alertType) { conditions.push(`fa.alert_type = $${idx++}`); params.push(alertType); }
    if (accountId) { conditions.push(`fa.account_id = $${idx++}`); params.push(accountId); }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const result = await sql.query(`
      SELECT fa.*, a.account_number, a.trader_name, a.trader_email, p.name as program_name
      FROM prop_fraud_alerts fa
      JOIN prop_accounts a ON a.account_id = fa.account_id
      JOIN prop_programs p ON p.program_id = a.program_id
      ${where}
      ORDER BY
        CASE fa.severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 END,
        fa.created_at DESC
      LIMIT 100
    `, params);

    // Summary counts
    const summaryRes = await sql.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'open') as open,
        COUNT(*) FILTER (WHERE status = 'investigating') as investigating,
        COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed,
        COUNT(*) FILTER (WHERE status = 'dismissed') as dismissed,
        COUNT(*) FILTER (WHERE status = 'resolved') as resolved,
        COUNT(*) FILTER (WHERE severity = 'critical' AND status IN ('open', 'investigating')) as critical_active,
        COUNT(*) FILTER (WHERE severity = 'high' AND status IN ('open', 'investigating')) as high_active
      FROM prop_fraud_alerts
    `);

    return NextResponse.json({
      success: true,
      data: { alerts: result.rows, summary: summaryRes.rows[0] },
    });
  } catch (error) {
    console.error('Fraud GET error:', error);
    return NextResponse.json({
      success: true,
      data: { alerts: [], summary: { total: 0, open: 0, investigating: 0, confirmed: 0, dismissed: 0, resolved: 0, critical_active: 0, high_active: 0 } },
    });
  }
}

// ── POST: Run fraud detection scan ───────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const accountId = body.account_id; // optional — null = scan all

    // Get accounts to scan
    let accounts;
    if (accountId) {
      accounts = await sql.query(
        'SELECT account_id, account_number, trader_name FROM prop_accounts WHERE account_id = $1',
        [accountId]
      );
    } else {
      accounts = await sql.query(
        "SELECT account_id, account_number, trader_name FROM prop_accounts WHERE status = 'active'"
      );
    }

    const alertsCreated: any[] = [];

    for (const acct of accounts.rows) {
      const aid = acct.account_id;

      // Get closed trades for analysis
      const trades = await sql.query(`
        SELECT trade_id, commodity, direction, quantity, entry_price, exit_price, pnl,
               opened_at, closed_at,
               EXTRACT(EPOCH FROM (closed_at - opened_at)) as hold_seconds
        FROM prop_trades
        WHERE account_id = $1 AND status = 'closed'
        ORDER BY opened_at DESC
        LIMIT 200
      `, [aid]);

      if (trades.rows.length < 5) continue; // Not enough data

      const tradeRows = trades.rows;

      // ── 1. Latency Arbitrage Detection ──
      // Flag: >30% of trades held < 10 seconds with >80% win rate among those
      const ultraShort = tradeRows.filter((t: any) => parseFloat(t.hold_seconds) < 10);
      if (ultraShort.length >= 5) {
        const pct = (ultraShort.length / tradeRows.length) * 100;
        const wins = ultraShort.filter((t: any) => parseFloat(t.pnl) > 0).length;
        const winRate = (wins / ultraShort.length) * 100;
        if (pct > 30 && winRate > 80) {
          const score = Math.min(((pct - 30) / 70 * 0.5) + ((winRate - 80) / 20 * 0.5), 1);
          const alert = await createAlert(aid, 'latency_arbitrage',
            score > 0.7 ? 'critical' : score > 0.4 ? 'high' : 'medium',
            `Potential latency arbitrage: ${pct.toFixed(0)}% trades under 10s with ${winRate.toFixed(0)}% win rate`,
            `${ultraShort.length} of ${tradeRows.length} trades held under 10 seconds with unusually high win rate`,
            { pct_under_10s: pct, win_rate_under_10s: winRate, count: ultraShort.length },
            ultraShort.slice(0, 10).map((t: any) => t.trade_id),
            score
          );
          if (alert) alertsCreated.push(alert);
        }
      }

      // ── 2. Overfit Scalping Detection ──
      // Flag: >50% of trades held < 60 seconds AND avg P&L per trade < $5
      const shortTrades = tradeRows.filter((t: any) => parseFloat(t.hold_seconds) < 60);
      if (shortTrades.length >= 10) {
        const pctShort = (shortTrades.length / tradeRows.length) * 100;
        const avgPnl = shortTrades.reduce((s: number, t: any) => s + Math.abs(parseFloat(t.pnl)), 0) / shortTrades.length;
        if (pctShort > 50 && avgPnl < 5) {
          const score = Math.min(((pctShort - 50) / 50 * 0.6) + ((5 - avgPnl) / 5 * 0.4), 1);
          const alert = await createAlert(aid, 'overfit_scalping',
            score > 0.6 ? 'high' : 'medium',
            `Potential overfit scalping: ${pctShort.toFixed(0)}% trades under 60s, avg P&L $${avgPnl.toFixed(2)}`,
            `High volume of micro-scalp trades with minimal profit per trade — may indicate strategy overfitting`,
            { pct_under_60s: pctShort, avg_pnl: avgPnl, count: shortTrades.length },
            shortTrades.slice(0, 10).map((t: any) => t.trade_id),
            score
          );
          if (alert) alertsCreated.push(alert);
        }
      }

      // ── 3. Statistical Anomaly: Win Rate ──
      // Flag: Win rate > 95% with >= 20 trades
      if (tradeRows.length >= 20) {
        const wins = tradeRows.filter((t: any) => parseFloat(t.pnl) > 0).length;
        const winRate = (wins / tradeRows.length) * 100;
        if (winRate > 95) {
          const score = Math.min((winRate - 95) / 5, 1);
          const alert = await createAlert(aid, 'statistical_anomaly',
            score > 0.6 ? 'high' : 'medium',
            `Statistical anomaly: ${winRate.toFixed(1)}% win rate across ${tradeRows.length} trades`,
            `Abnormally high win rate suggests potential manipulation, copy-trading from a known signal, or strategy gaming`,
            { win_rate: winRate, total_trades: tradeRows.length, wins },
            [],
            score
          );
          if (alert) alertsCreated.push(alert);
        }
      }

      // ── 4. News Straddling Detection ──
      // Flag: Trades opened within 60 seconds of each other on the same commodity in opposite directions
      for (let i = 0; i < tradeRows.length - 1; i++) {
        const t1 = tradeRows[i];
        const t2 = tradeRows[i + 1];
        if (t1.commodity === t2.commodity && t1.direction !== t2.direction) {
          const timeDiff = Math.abs(new Date(t1.opened_at).getTime() - new Date(t2.opened_at).getTime()) / 1000;
          if (timeDiff < 60) {
            const alert = await createAlert(aid, 'news_straddling',
              'medium',
              `Possible news straddle: opposing ${t1.commodity} positions opened ${timeDiff.toFixed(0)}s apart`,
              `Long and short positions on the same commodity opened within 60 seconds — classic news straddling pattern`,
              { commodity: t1.commodity, time_diff_seconds: timeDiff },
              [t1.trade_id, t2.trade_id],
              0.5
            );
            if (alert) alertsCreated.push(alert);
            break; // One alert per scan per account
          }
        }
      }

      // ── 5. Update/Upsert behavior profile ──
      const holdTimes = tradeRows.map((t: any) => parseFloat(t.hold_seconds)).filter((h: number) => h > 0).sort((a: number, b: number) => a - b);
      if (holdTimes.length > 0) {
        const avgHold = holdTimes.reduce((s: number, h: number) => s + h, 0) / holdTimes.length;
        const medianHold = holdTimes[Math.floor(holdTimes.length / 2)];
        const minHold = holdTimes[0];
        const pctUnder60 = (holdTimes.filter((h: number) => h < 60).length / holdTimes.length) * 100;
        const pctUnder10 = (holdTimes.filter((h: number) => h < 10).length / holdTimes.length) * 100;
        const lotSizes = tradeRows.map((t: any) => parseFloat(t.quantity));
        const avgLot = lotSizes.reduce((s: number, l: number) => s + l, 0) / lotSizes.length;
        const lotStddev = Math.sqrt(lotSizes.reduce((s: number, l: number) => s + Math.pow(l - avgLot, 2), 0) / lotSizes.length);

        await sql.query(`
          INSERT INTO prop_trader_behavior (account_id, avg_hold_seconds, median_hold_seconds, min_hold_seconds, pct_under_60s, pct_under_10s, avg_lot_size, lot_size_stddev, calculated_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), now())
          ON CONFLICT (account_id) DO UPDATE SET
            avg_hold_seconds = $2, median_hold_seconds = $3, min_hold_seconds = $4,
            pct_under_60s = $5, pct_under_10s = $6, avg_lot_size = $7, lot_size_stddev = $8,
            calculated_at = now(), updated_at = now()
        `, [aid, avgHold, medianHold, minHold, pctUnder60, pctUnder10, avgLot, lotStddev]);
      }
    }

    // Audit log
    await sql.query(
      `INSERT INTO prop_audit_log (entity_type, entity_id, action, new_value, performed_by, reason)
       VALUES ('fraud_scan', 'system', 'scan_completed', $1, 'system', 'Fraud detection scan')`,
      [JSON.stringify({ accounts_scanned: accounts.rows.length, alerts_created: alertsCreated.length })]
    );

    return NextResponse.json({
      success: true,
      data: {
        accounts_scanned: accounts.rows.length,
        alerts_created: alertsCreated.length,
        alerts: alertsCreated,
      },
    });
  } catch (error) {
    console.error('Fraud POST error:', error);
    return NextResponse.json({ success: false, error: 'Fraud scan failed' }, { status: 500 });
  }
}

// ── PUT: Review/resolve alert ────────────────────────────────

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { alert_id, status, reviewed_by, resolution_notes, action_taken } = body;

    if (!alert_id || !status) {
      return NextResponse.json({ success: false, error: 'alert_id and status required' }, { status: 400 });
    }

    const validStatuses = ['investigating', 'confirmed', 'dismissed', 'resolved'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: `status must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
    }

    // Get current state for audit
    const current = await sql.query('SELECT * FROM prop_fraud_alerts WHERE alert_id = $1', [alert_id]);
    if (current.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Alert not found' }, { status: 404 });
    }
    const oldAlert = current.rows[0];

    const result = await sql.query(
      `UPDATE prop_fraud_alerts
       SET status = $1, reviewed_by = $2, reviewed_at = now(), resolution_notes = $3, action_taken = $4, updated_at = now()
       WHERE alert_id = $5
       RETURNING *`,
      [status, reviewed_by || 'admin', resolution_notes || null, action_taken || null, alert_id]
    );

    // If confirmed and action is suspend — actually suspend the account
    if (status === 'confirmed' && action_taken === 'account_suspended') {
      await sql.query(
        "UPDATE prop_accounts SET status = 'suspended', updated_at = now() WHERE account_id = $1",
        [oldAlert.account_id]
      );

      await sql.query(
        `INSERT INTO prop_risk_events (account_id, event_type, severity, description, threshold_value, actual_value)
         VALUES ($1, 'max_drawdown_breach', 'critical', $2, 0, 0)`,
        [oldAlert.account_id, `Account suspended due to confirmed fraud: ${oldAlert.alert_type}`]
      );
    }

    // Audit log
    await sql.query(
      `INSERT INTO prop_audit_log (entity_type, entity_id, action, old_value, new_value, performed_by, reason)
       VALUES ('fraud_alert', $1, 'alert_reviewed', $2, $3, $4, $5)`,
      [alert_id, JSON.stringify({ status: oldAlert.status }), JSON.stringify({ status, action_taken }), reviewed_by || 'admin', resolution_notes || `Alert ${status}`]
    );

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Fraud PUT error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update alert' }, { status: 500 });
  }
}

// ── Helper: Create alert (with dedup) ────────────────────────

async function createAlert(
  accountId: string,
  alertType: string,
  severity: string,
  title: string,
  description: string,
  evidence: Record<string, any>,
  flaggedTrades: string[],
  score: number,
): Promise<any | null> {
  // Don't duplicate: check for recent open alert of same type on same account
  const existing = await sql.query(
    `SELECT alert_id FROM prop_fraud_alerts
     WHERE account_id = $1 AND alert_type = $2 AND status IN ('open', 'investigating')
     AND created_at > now() - interval '7 days'`,
    [accountId, alertType]
  );
  if (existing.rows.length > 0) return null;

  const result = await sql.query(
    `INSERT INTO prop_fraud_alerts (account_id, alert_type, severity, title, description, evidence, flagged_trades, detection_score)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [accountId, alertType, severity, title, description, JSON.stringify(evidence), flaggedTrades, score]
  );

  return result.rows[0];
}
