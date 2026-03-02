import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/sql';

export const dynamic = 'force-dynamic';

/**
 * GET  /api/prop-sharing/funnel
 * - Returns channel quality, cohort data, funnel snapshots, suppress rules
 *
 * POST /api/prop-sharing/funnel
 * - Recalculate channel quality, create funnel snapshot
 *
 * PUT  /api/prop-sharing/funnel
 * - Update/create suppress rules
 */

// ── GET ──────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const section = url.searchParams.get('section') || 'overview';

    if (section === 'channels') {
      const result = await sql.query(`SELECT * FROM v_channel_leaderboard`);
      return NextResponse.json({ success: true, data: { channels: result.rows } });
    }

    if (section === 'cohorts') {
      const result = await sql.query(`
        SELECT * FROM prop_cohorts
        ORDER BY cohort_month DESC
        LIMIT 24
      `);
      return NextResponse.json({ success: true, data: { cohorts: result.rows } });
    }

    if (section === 'funnel-snapshots') {
      const result = await sql.query(`
        SELECT * FROM prop_funnel_snapshots
        ORDER BY snapshot_date DESC
        LIMIT 30
      `);
      return NextResponse.json({ success: true, data: { snapshots: result.rows } });
    }

    if (section === 'suppress-rules') {
      const result = await sql.query(`
        SELECT * FROM prop_channel_suppress_rules
        ORDER BY is_active DESC, created_at DESC
      `);
      return NextResponse.json({ success: true, data: { rules: result.rows } });
    }

    // Default: overview
    const [channels, cohorts, snapshots, rules] = await Promise.all([
      sql.query(`SELECT * FROM v_channel_leaderboard`),
      sql.query(`SELECT * FROM prop_cohorts ORDER BY cohort_month DESC LIMIT 6`),
      sql.query(`SELECT * FROM prop_funnel_snapshots ORDER BY snapshot_date DESC LIMIT 14`),
      sql.query(`SELECT * FROM prop_channel_suppress_rules WHERE is_active = true`),
    ]);

    // Funnel summary stats
    const funnelStats = await sql.query(`
      SELECT
        COUNT(*) FILTER (WHERE status != 'rejected') as total_applicants,
        COUNT(*) FILTER (WHERE phase = 'phase1') as in_phase1,
        COUNT(*) FILTER (WHERE phase = 'phase2') as in_phase2,
        COUNT(*) FILTER (WHERE phase = 'funded') as funded,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
        ROUND(COUNT(*) FILTER (WHERE phase = 'funded')::numeric / NULLIF(COUNT(*), 0) * 100, 1) as overall_conversion
      FROM prop_accounts
    `);

    return NextResponse.json({
      success: true,
      data: {
        channels: channels.rows,
        cohorts: cohorts.rows,
        snapshots: snapshots.rows,
        suppress_rules: rules.rows,
        funnel_stats: funnelStats.rows[0] || null,
      },
    });
  } catch (error) {
    console.error('Funnel GET error:', error);
    return NextResponse.json({
      success: true,
      data: { channels: [], cohorts: [], snapshots: [], suppress_rules: [], funnel_stats: null },
    });
  }
}

// ── POST ─────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'calculate_channels') {
      // Aggregate channel quality from applications
      const channelData = await sql.query(`
        SELECT
          COALESCE(a.utm_source, 'organic') as source,
          COUNT(*) as total_apps,
          COUNT(*) FILTER (WHERE acc.phase IS NOT NULL) as approved,
          COUNT(*) FILTER (WHERE acc.phase IN ('phase1', 'phase2')) as in_eval,
          COUNT(*) FILTER (WHERE acc.phase = 'funded') as funded,
          COUNT(*) FILTER (WHERE acc.status = 'rejected') as rejected,
          AVG(CASE WHEN acc.phase = 'funded' THEN acc.current_balance - acc.funded_capital END) as avg_funded_pnl,
          COUNT(*) FILTER (WHERE fr.risk_score > 70) as high_fraud_count
        FROM prop_applications a
        LEFT JOIN prop_accounts acc ON acc.application_id = a.application_id
        LEFT JOIN prop_fraud_reviews fr ON fr.application_id = a.application_id
        WHERE a.submitted_at > now() - interval '90 days'
        GROUP BY COALESCE(a.utm_source, 'organic')
      `);

      // Get active suppress rules
      const suppressRes = await sql.query(`
        SELECT * FROM prop_channel_suppress_rules WHERE is_active = true
      `);
      const suppressRules = suppressRes.rows;

      for (const ch of channelData.rows) {
        const totalApps = parseInt(ch.total_apps);
        const funded = parseInt(ch.funded);
        const rejected = parseInt(ch.rejected);
        const highFraud = parseInt(ch.high_fraud_count);

        // Conversion rate: funded / total_apps
        const conversionRate = totalApps > 0 ? (funded / totalApps * 100) : 0;

        // Fraud rate: high_fraud / total_apps
        const fraudRate = totalApps > 0 ? (highFraud / totalApps * 100) : 0;

        // Rejection rate
        const rejectionRate = totalApps > 0 ? (rejected / totalApps * 100) : 0;

        // Quality score (0-100): weighted blend
        // Higher conversion = better, lower fraud = better, lower rejection = better
        let qualityScore = 50; // base
        qualityScore += (conversionRate * 2); // up to ~20pts for 10% conversion
        qualityScore -= (fraudRate * 3);      // penalize fraud heavily
        qualityScore -= (rejectionRate * 0.5); // mild rejection penalty
        qualityScore = Math.max(0, Math.min(100, Math.round(qualityScore)));

        // Check auto-suppress
        let suppressed = false;
        let suppressReason = '';
        for (const rule of suppressRules) {
          if (rule.metric === 'fraud_rate' && fraudRate > parseFloat(rule.threshold_value)) {
            suppressed = true;
            suppressReason = `Auto-suppressed: fraud rate ${fraudRate.toFixed(1)}% > ${rule.threshold_value}%`;
          }
          if (rule.metric === 'conversion_rate' && conversionRate < parseFloat(rule.threshold_value) && totalApps >= 10) {
            suppressed = true;
            suppressReason = `Auto-suppressed: conversion ${conversionRate.toFixed(1)}% < ${rule.threshold_value}%`;
          }
          if (rule.metric === 'rejection_rate' && rejectionRate > parseFloat(rule.threshold_value)) {
            suppressed = true;
            suppressReason = `Auto-suppressed: rejection rate ${rejectionRate.toFixed(1)}% > ${rule.threshold_value}%`;
          }
        }

        // Upsert channel quality
        await sql.query(`
          INSERT INTO prop_channel_quality
            (source, total_apps, approved, in_eval, funded, rejected,
             conversion_rate, fraud_rate, avg_funded_pnl, quality_score,
             suppressed, suppress_reason)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (source) DO UPDATE SET
            total_apps = EXCLUDED.total_apps,
            approved = EXCLUDED.approved,
            in_eval = EXCLUDED.in_eval,
            funded = EXCLUDED.funded,
            rejected = EXCLUDED.rejected,
            conversion_rate = EXCLUDED.conversion_rate,
            fraud_rate = EXCLUDED.fraud_rate,
            avg_funded_pnl = EXCLUDED.avg_funded_pnl,
            quality_score = EXCLUDED.quality_score,
            suppressed = EXCLUDED.suppressed,
            suppress_reason = EXCLUDED.suppress_reason,
            last_calculated = now()
        `, [ch.source, totalApps, parseInt(ch.approved), parseInt(ch.in_eval),
          funded, rejected, conversionRate, fraudRate,
          parseFloat(ch.avg_funded_pnl || '0'), qualityScore,
          suppressed, suppressReason || null]);
      }

      return NextResponse.json({
        success: true,
        data: { channels_calculated: channelData.rows.length },
      });
    }

    if (action === 'calculate_cohorts') {
      // Calculate cohort data by month
      const cohortData = await sql.query(`
        SELECT
          TO_CHAR(DATE_TRUNC('month', a.submitted_at), 'YYYY-MM') as cohort_month,
          COALESCE(a.utm_source, 'organic') as primary_source,
          COUNT(*) as total_applicants,
          COUNT(*) FILTER (WHERE acc.phase IS NOT NULL) as approved,
          COUNT(*) FILTER (WHERE acc.phase = 'funded') as funded,
          COUNT(*) FILTER (WHERE acc.status = 'blown') as blown,
          COALESCE(SUM(acc.current_balance - acc.funded_capital) FILTER (WHERE acc.phase = 'funded'), 0) as total_pnl,
          COALESCE(AVG(EXTRACT(DAY FROM acc.created_at - a.submitted_at)), 0) as avg_time_to_fund
        FROM prop_applications a
        LEFT JOIN prop_accounts acc ON acc.application_id = a.application_id
        GROUP BY DATE_TRUNC('month', a.submitted_at), COALESCE(a.utm_source, 'organic')
        ORDER BY cohort_month DESC
      `);

      for (const c of cohortData.rows) {
        const total = parseInt(c.total_applicants);
        const funnelConv = total > 0 ? (parseInt(c.funded) / total * 100) : 0;
        const survivalRate = parseInt(c.funded) > 0
          ? ((parseInt(c.funded) - parseInt(c.blown)) / parseInt(c.funded) * 100)
          : 0;
        const ltv = parseInt(c.funded) > 0 ? (parseFloat(c.total_pnl) / parseInt(c.funded)) : 0;

        await sql.query(`
          INSERT INTO prop_cohorts
            (cohort_month, primary_source, total_applicants, approved, funded,
             blown, total_pnl, avg_time_to_fund_days, funnel_conversion,
             survival_rate_90d, ltv_per_trader)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (cohort_month, primary_source) DO UPDATE SET
            total_applicants = EXCLUDED.total_applicants,
            approved = EXCLUDED.approved,
            funded = EXCLUDED.funded,
            blown = EXCLUDED.blown,
            total_pnl = EXCLUDED.total_pnl,
            avg_time_to_fund_days = EXCLUDED.avg_time_to_fund_days,
            funnel_conversion = EXCLUDED.funnel_conversion,
            survival_rate_90d = EXCLUDED.survival_rate_90d,
            ltv_per_trader = EXCLUDED.ltv_per_trader,
            calculated_at = now()
        `, [c.cohort_month, c.primary_source, total, parseInt(c.approved),
          parseInt(c.funded), parseInt(c.blown), parseFloat(c.total_pnl),
          parseFloat(c.avg_time_to_fund), funnelConv, survivalRate, ltv]);
      }

      return NextResponse.json({
        success: true,
        data: { cohorts_calculated: cohortData.rows.length },
      });
    }

    if (action === 'snapshot_funnel') {
      const today = new Date().toISOString().split('T')[0];

      const funnelData = await sql.query(`
        SELECT
          COUNT(*) FILTER (WHERE a.submitted_at > now() - interval '24 hours') as new_apps_24h,
          COUNT(*) FILTER (WHERE a.status = 'approved' AND a.decided_at > now() - interval '24 hours') as approved_24h,
          COUNT(*) FILTER (WHERE acc.phase = 'funded') as total_funded,
          COUNT(*) FILTER (WHERE acc.status = 'blown') as total_blown,
          COUNT(*) as total_applications,
          ROUND(COUNT(*) FILTER (WHERE acc.phase = 'funded')::numeric / NULLIF(COUNT(*), 0) * 100, 2) as conversion_rate
        FROM prop_applications a
        LEFT JOIN prop_accounts acc ON acc.application_id = a.application_id
      `);

      const channelCount = await sql.query(`
        SELECT
          COUNT(*) as total_channels,
          COUNT(*) FILTER (WHERE suppressed = true) as suppressed_channels,
          AVG(quality_score) as avg_quality
        FROM prop_channel_quality
      `);

      const fd = funnelData.rows[0];
      const cc = channelCount.rows[0];

      await sql.query(`
        INSERT INTO prop_funnel_snapshots
          (snapshot_date, total_applications, new_applications_24h, approved_24h,
           total_funded, total_blown, overall_conversion, active_channels,
           suppressed_channels, avg_channel_quality)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (snapshot_date) DO UPDATE SET
          total_applications = EXCLUDED.total_applications,
          new_applications_24h = EXCLUDED.new_applications_24h,
          approved_24h = EXCLUDED.approved_24h,
          total_funded = EXCLUDED.total_funded,
          total_blown = EXCLUDED.total_blown,
          overall_conversion = EXCLUDED.overall_conversion,
          active_channels = EXCLUDED.active_channels,
          suppressed_channels = EXCLUDED.suppressed_channels,
          avg_channel_quality = EXCLUDED.avg_channel_quality
      `, [today, parseInt(fd.total_applications), parseInt(fd.new_apps_24h),
        parseInt(fd.approved_24h), parseInt(fd.total_funded), parseInt(fd.total_blown),
        parseFloat(fd.conversion_rate || '0'),
        parseInt(cc.total_channels) - parseInt(cc.suppressed_channels),
        parseInt(cc.suppressed_channels), parseFloat(cc.avg_quality || '0')]);

      return NextResponse.json({ success: true, data: { snapshot_date: today } });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Funnel POST error:', error);
    return NextResponse.json({ success: false, error: 'Operation failed' }, { status: 500 });
  }
}

// ── PUT ──────────────────────────────────────────────────────

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'update_suppress_rule') {
      const { rule_id, ...updates } = body;
      if (!rule_id) return NextResponse.json({ success: false, error: 'rule_id required' }, { status: 400 });

      const fields: string[] = [];
      const params: any[] = [rule_id];
      let idx = 2;

      const allowed = ['metric', 'threshold_value', 'is_active'];
      for (const key of allowed) {
        if (updates[key] !== undefined) {
          fields.push(`${key} = $${idx++}`);
          params.push(updates[key]);
        }
      }

      if (fields.length === 0) return NextResponse.json({ success: false, error: 'No valid fields' }, { status: 400 });

      await sql.query(`UPDATE prop_channel_suppress_rules SET ${fields.join(', ')} WHERE rule_id = $1`, params);
      return NextResponse.json({ success: true, data: { updated: rule_id } });
    }

    if (action === 'create_suppress_rule') {
      const { metric, threshold_value, auto_suppress } = body;
      if (!metric || threshold_value === undefined) {
        return NextResponse.json({ success: false, error: 'metric and threshold_value required' }, { status: 400 });
      }

      const result = await sql.query(`
        INSERT INTO prop_channel_suppress_rules (metric, threshold_value, auto_suppress)
        VALUES ($1, $2, $3)
        RETURNING rule_id
      `, [metric, threshold_value, auto_suppress !== false]);

      return NextResponse.json({ success: true, data: { rule_id: result.rows[0].rule_id } });
    }

    if (action === 'suppress_channel') {
      const { source, reason } = body;
      if (!source) return NextResponse.json({ success: false, error: 'source required' }, { status: 400 });

      await sql.query(`
        UPDATE prop_channel_quality
        SET suppressed = true, suppress_reason = $2
        WHERE source = $1
      `, [source, reason || 'Manually suppressed']);

      return NextResponse.json({ success: true, data: { suppressed: source } });
    }

    if (action === 'unsuppress_channel') {
      const { source } = body;
      if (!source) return NextResponse.json({ success: false, error: 'source required' }, { status: 400 });

      await sql.query(`
        UPDATE prop_channel_quality
        SET suppressed = false, suppress_reason = null
        WHERE source = $1
      `, [source]);

      return NextResponse.json({ success: true, data: { unsuppressed: source } });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Funnel PUT error:', error);
    return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 });
  }
}
