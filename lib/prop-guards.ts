/**
 * lib/prop-guards.ts
 *
 * Centralised enforcement gates for Prop Sharing.
 * Every sensitive action (funding, payout, scaling, compounding) calls these
 * guards so treasury throttles and kill-switches are honoured everywhere.
 */
import { sql } from './sql';

export interface GateResult {
  allowed: boolean;
  reason?: string;
  details?: Record<string, any>;
}

// ── Treasury Gate ───────────────────────────────────────────
/** Returns whether treasury state allows a given action class. */
export async function checkTreasuryGate(
  actionClass: 'funding' | 'payout' | 'scaling' | 'compounding'
): Promise<GateResult> {
  try {
    // 1. Check treasury status
    const { rows: statusRows } = await sql`
      SELECT status, buffer_health_pct, consecutive_healthy_days
      FROM treasury_capital
      ORDER BY snapshot_date DESC
      LIMIT 1
    `;

    if (!statusRows.length) {
      return { allowed: false, reason: 'No treasury data available' };
    }

    const treasury = statusRows[0];

    // Frozen = nothing allowed
    if (treasury.status === 'frozen') {
      return {
        allowed: false,
        reason: 'Treasury is frozen — all operations blocked',
        details: treasury,
      };
    }

    // Throttled = only non-scaling allowed
    if (treasury.status === 'throttled') {
      if (['scaling', 'compounding', 'payout'].includes(actionClass)) {
        return {
          allowed: false,
          reason: `Treasury is throttled — ${actionClass} blocked`,
          details: treasury,
        };
      }
    }

    // Buffer too low = block compounding and scaling
    const bufferPct = Number(treasury.buffer_health_pct ?? 0);
    if (bufferPct < 50 && ['scaling', 'compounding'].includes(actionClass)) {
      return {
        allowed: false,
        reason: `Buffer health ${bufferPct}% too low for ${actionClass}`,
        details: treasury,
      };
    }

    return { allowed: true, details: treasury };
  } catch (err) {
    return { allowed: false, reason: `Treasury check error: ${(err as Error).message}` };
  }
}

// ── Kill-Switch Gate ────────────────────────────────────────
/** Returns whether any active kill-switch blocks the operation. */
export async function checkKillSwitchGate(
  scope: 'trader' | 'instrument' | 'firm',
  targetId?: string
): Promise<GateResult> {
  try {
    let rows: any[];

    if (scope === 'firm') {
      ({ rows } = await sql`
        SELECT switch_id, reason FROM kill_switches
        WHERE scope = 'firm' AND is_active = true
        LIMIT 1
      `);
    } else {
      ({ rows } = await sql`
        SELECT switch_id, reason FROM kill_switches
        WHERE is_active = true
          AND (scope = 'firm' OR (scope = ${scope} AND target_id = ${targetId ?? ''}))
        LIMIT 1
      `);
    }

    if (rows.length) {
      return {
        allowed: false,
        reason: `Kill switch active: ${rows[0].reason ?? rows[0].switch_id}`,
        details: rows[0],
      };
    }

    return { allowed: true };
  } catch (err) {
    // Fail closed
    return { allowed: false, reason: `Kill-switch check error: ${(err as Error).message}` };
  }
}

// ── Compounding Readiness Gate ──────────────────────────────
/** Returns readiness score from the latest completed simulation suite. */
export async function checkCompoundingReadiness(
  minScore = 0.7
): Promise<GateResult & { readinessScore: number }> {
  try {
    const { rows } = await sql`
      SELECT compounding_readiness, enforcement_score,
             trace_integrity_score, behavior_seam_score, funnel_cliff_score,
             completed_at
      FROM simulation_runs
      WHERE status = 'completed'
      ORDER BY completed_at DESC
      LIMIT 1
    `;

    if (!rows.length) {
      return {
        allowed: false,
        readinessScore: 0,
        reason: 'No completed simulation runs — cannot verify readiness',
      };
    }

    const r = rows[0];
    const score = Number(r.compounding_readiness ?? 0);

    if (score < minScore) {
      return {
        allowed: false,
        readinessScore: score,
        reason: `Readiness score ${(score * 100).toFixed(1)}% below threshold ${(minScore * 100).toFixed(1)}%`,
        details: r,
      };
    }

    return { allowed: true, readinessScore: score, details: r };
  } catch (err) {
    return {
      allowed: false,
      readinessScore: 0,
      reason: `Readiness check error: ${(err as Error).message}`,
    };
  }
}

// ── Composite Gate ──────────────────────────────────────────
/** Run all gates at once – convenience for compounding routes. */
export async function checkAllGates(
  actionClass: 'funding' | 'payout' | 'scaling' | 'compounding' = 'compounding',
  minReadiness = 0.7
): Promise<GateResult & { readinessScore: number; breakdown: Record<string, GateResult> }> {
  const [treasury, killSwitch, readiness] = await Promise.all([
    checkTreasuryGate(actionClass),
    checkKillSwitchGate('firm'),
    checkCompoundingReadiness(minReadiness),
  ]);

  const allowed = treasury.allowed && killSwitch.allowed && readiness.allowed;
  const reasons: string[] = [];
  if (!treasury.allowed) reasons.push(treasury.reason!);
  if (!killSwitch.allowed) reasons.push(killSwitch.reason!);
  if (!readiness.allowed) reasons.push(readiness.reason!);

  return {
    allowed,
    readinessScore: readiness.readinessScore,
    reason: reasons.length ? reasons.join('; ') : undefined,
    breakdown: { treasury, killSwitch, readiness },
  };
}
