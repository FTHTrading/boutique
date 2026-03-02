import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/sql';
import { checkAllGates, checkTreasuryGate, checkCompoundingReadiness } from '@/lib/prop-guards';

export const dynamic = 'force-dynamic';

/**
 * GET  /api/prop-sharing/compounding
 * - section=overview     → summary stats
 * - section=policies     → list all compounding policies
 * - section=runs         → list compounding runs
 * - section=actions      → list compounding actions
 * - section=allocations  → list vertical allocations
 * - section=gates        → current gate status (treasury + readiness)
 *
 * POST /api/prop-sharing/compounding
 * - action=evaluate      → dry-run all active policies
 * - action=execute       → execute eligible policies (guarded)
 *
 * PUT  /api/prop-sharing/compounding
 * - target=policy        → update a policy
 * - target=approve       → approve a proposed action
 * - target=reject        → reject a proposed action
 */

// ── GET ─────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const section = url.searchParams.get('section') || 'overview';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);

    if (section === 'policies') {
      const result = await sql.query(
        `SELECT * FROM compounding_policies ORDER BY priority ASC, created_at DESC`
      );
      return NextResponse.json({ success: true, data: { policies: result.rows } });
    }

    if (section === 'runs') {
      const result = await sql.query(
        `SELECT * FROM compounding_runs ORDER BY created_at DESC LIMIT $1`,
        [limit]
      );
      return NextResponse.json({ success: true, data: { runs: result.rows } });
    }

    if (section === 'actions') {
      const mode = url.searchParams.get('mode');
      const runId = url.searchParams.get('run_id');

      let query = `SELECT ca.*, cp.name AS policy_name, cp.action_type AS policy_action_type
        FROM compounding_actions ca
        JOIN compounding_policies cp ON cp.policy_id = ca.policy_id
        WHERE 1=1`;
      const params: any[] = [];
      let idx = 1;

      if (mode) { query += ` AND ca.mode = $${idx++}`; params.push(mode); }
      if (runId) { query += ` AND ca.run_id = $${idx++}`; params.push(runId); }

      query += ` ORDER BY ca.created_at DESC LIMIT $${idx}`;
      params.push(limit);

      const result = await sql.query(query, params);
      return NextResponse.json({ success: true, data: { actions: result.rows } });
    }

    if (section === 'allocations') {
      const vertical = url.searchParams.get('vertical');
      let query = `SELECT * FROM vertical_allocations WHERE 1=1`;
      const params: any[] = [];
      let idx = 1;

      if (vertical) { query += ` AND vertical = $${idx++}`; params.push(vertical); }
      query += ` ORDER BY created_at DESC LIMIT $${idx}`;
      params.push(limit);

      const result = await sql.query(query, params);
      return NextResponse.json({ success: true, data: { allocations: result.rows } });
    }

    if (section === 'gates') {
      const gates = await checkAllGates('compounding', 0.7);
      return NextResponse.json({ success: true, data: { gates } });
    }

    // Overview
    const [policiesRes, runsRes, actionsRes, allocRes, gatesRes] = await Promise.all([
      sql.query(`SELECT status, COUNT(*) AS cnt FROM compounding_policies GROUP BY status`),
      sql.query(`SELECT * FROM compounding_runs ORDER BY created_at DESC LIMIT 5`),
      sql.query(`
        SELECT ca.mode, ca.executed, ca.blocked,
               COUNT(*) AS cnt, SUM(ca.amount) AS total_amount
        FROM compounding_actions ca
        GROUP BY ca.mode, ca.executed, ca.blocked
      `),
      sql.query(`
        SELECT vertical, status,
               COUNT(*) AS cnt, SUM(amount) AS total_amount
        FROM vertical_allocations
        GROUP BY vertical, status
      `),
      checkAllGates('compounding', 0.7).catch(() => ({
        allowed: false, readinessScore: 0, reason: 'Gate check failed',
        breakdown: {},
      })),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        policy_summary: policiesRes.rows,
        recent_runs: runsRes.rows,
        action_summary: actionsRes.rows,
        allocation_summary: allocRes.rows,
        gates: gatesRes,
      },
    });
  } catch (err: any) {
    console.error('Compounding GET error:', err);
    return NextResponse.json({
      success: true,
      data: {
        policy_summary: [],
        recent_runs: [],
        action_summary: [],
        allocation_summary: [],
        gates: { allowed: false, readinessScore: 0 },
      },
    });
  }
}

// ── POST ────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'evaluate') {
      return await handleEvaluate('dry_run');
    }

    if (action === 'execute') {
      return await handleEvaluate('execute');
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('Compounding POST error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// ── PUT ─────────────────────────────────────────────────────

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { target } = body;

    if (target === 'policy') {
      return await handleUpdatePolicy(body);
    }

    if (target === 'approve') {
      return await handleApproveAction(body.action_id);
    }

    if (target === 'reject') {
      return await handleRejectAction(body.action_id, body.reason);
    }

    return NextResponse.json({ success: false, error: 'Unknown target' }, { status: 400 });
  } catch (err: any) {
    console.error('Compounding PUT error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// ── Evaluate / Execute Policies ─────────────────────────────

async function handleEvaluate(mode: 'dry_run' | 'execute') {
  // 1. Gather current system state
  const [treasuryRes, readinessRes, channelRes, behaviorRes, fraudRes] = await Promise.all([
    sql.query(`SELECT status, buffer_health_pct, consecutive_healthy_days, total_reserves
      FROM treasury_capital ORDER BY snapshot_date DESC LIMIT 1`).catch(() => ({ rows: [] })),
    checkCompoundingReadiness(0.0),
    sql.query(`SELECT AVG(quality_score) AS avg_quality FROM prop_channel_quality
      WHERE scored_at > NOW() - INTERVAL '7 days'`).catch(() => ({ rows: [{ avg_quality: 0 }] })),
    sql.query(`SELECT AVG(composite_risk_score) AS avg_risk FROM prop_behavior_scores
      WHERE scored_at > NOW() - INTERVAL '7 days'`).catch(() => ({ rows: [{ avg_risk: 0 }] })),
    sql.query(`SELECT COUNT(*) FILTER (WHERE is_fraudulent = true) * 1.0 / GREATEST(COUNT(*), 1) AS fraud_rate
      FROM prop_applications WHERE created_at > NOW() - INTERVAL '30 days'`).catch(() => ({ rows: [{ fraud_rate: 0 }] })),
  ]);

  const treasury = treasuryRes.rows[0] || {};
  const retainedEarnings = Number(treasury.total_reserves ?? 0);
  const bufferHealth = Number(treasury.buffer_health_pct ?? 0);
  const bufferDays = Number(treasury.consecutive_healthy_days ?? 0);
  const treasuryStatus = treasury.status || 'unknown';
  const avgChannelQuality = Number(channelRes.rows[0]?.avg_quality ?? 0);
  const readinessScore = readinessRes.readinessScore;
  const fraudRate = Number(fraudRes.rows[0]?.fraud_rate ?? 0);
  const avgCohortSurvival = 1.0; // Placeholder — would be calculated from cohort data

  // 2. Create compounding run
  const { rows: runRows } = await sql.query(`
    INSERT INTO compounding_runs
      (mode, retained_earnings, buffer_health, buffer_consecutive_days,
       avg_channel_quality, avg_cohort_survival, fraud_rate,
       readiness_score, treasury_status, started_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
    RETURNING run_id
  `, [mode, retainedEarnings, bufferHealth, bufferDays,
      avgChannelQuality, avgCohortSurvival, fraudRate,
      readinessScore, treasuryStatus]);

  const runId = runRows[0].run_id;

  // 3. Check gates for execute mode
  let gateBlocked = false;
  let gateReason = '';

  if (mode === 'execute') {
    const gates = await checkAllGates('compounding', 0.7);
    if (!gates.allowed) {
      gateBlocked = true;
      gateReason = gates.reason || 'Gate check failed';
    }
  }

  // 4. Get active policies ordered by priority
  const { rows: policies } = await sql.query(`
    SELECT * FROM compounding_policies
    WHERE status = 'active'
    ORDER BY priority ASC
  `);

  let policiesEvaluated = 0;
  let policiesEligible = 0;
  let actionsProposed = 0;
  let actionsExecuted = 0;
  let actionsBlocked = 0;
  const actions: any[] = [];

  for (const policy of policies) {
    policiesEvaluated++;

    // 5. Check policy conditions
    const eligible = evaluatePolicyConditions(policy, {
      retainedEarnings, bufferHealth, bufferDays,
      avgChannelQuality, avgCohortSurvival, fraudRate, readinessScore,
    });

    if (!eligible.pass) continue;
    policiesEligible++;

    // 6. Check cooldown
    if (policy.last_executed) {
      const lastExec = new Date(policy.last_executed);
      const cooldownEnd = new Date(lastExec.getTime() + policy.cooldown_days * 86400000);
      if (new Date() < cooldownEnd) continue;
    }

    // 7. Check quarterly execution limit
    const { rows: quarterExecs } = await sql.query(`
      SELECT COUNT(*) AS cnt FROM compounding_actions
      WHERE policy_id = $1 AND executed = true
        AND created_at > NOW() - INTERVAL '90 days'
    `, [policy.policy_id]);
    if (Number(quarterExecs[0]?.cnt ?? 0) >= policy.max_executions_per_quarter) continue;

    // 8. Compute action amount
    const amount = computeActionAmount(policy, retainedEarnings);

    // 9. Determine blocked status
    const blocked = gateBlocked || (mode === 'execute' && policy.requires_approval);
    const blockedReason = gateBlocked ? gateReason : (policy.requires_approval ? 'Requires approval' : undefined);

    // 10. Insert action
    const inputSnapshot = {
      retained_earnings: retainedEarnings,
      buffer_health: bufferHealth,
      buffer_days: bufferDays,
      channel_quality: avgChannelQuality,
      readiness_score: readinessScore,
      fraud_rate: fraudRate,
    };

    const actionMode = mode === 'execute' && !blocked ? 'execute' :
                       mode === 'execute' && blocked && policy.requires_approval ? 'proposed' :
                       'dry_run';

    const executed = actionMode === 'execute';

    const { rows: actionRows } = await sql.query(`
      INSERT INTO compounding_actions
        (run_id, policy_id, action_type, action_params, amount,
         target_vertical, mode, executed, blocked, blocked_reason,
         input_snapshot)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING action_id
    `, [runId, policy.policy_id, policy.action_type,
        JSON.stringify(policy.action_params), amount,
        policy.action_params?.vertical || null,
        actionMode, executed, blocked, blockedReason || null,
        JSON.stringify(inputSnapshot)]);

    const actionId = actionRows[0].action_id;
    actionsProposed++;

    if (executed) {
      actionsExecuted++;
      // Record vertical allocation if applicable
      if (policy.action_type === 'allocate_to_vertical' && policy.action_params?.vertical) {
        await sql.query(`
          INSERT INTO vertical_allocations
            (vertical, amount, source, action_id, policy_id, status)
          VALUES ($1, $2, 'compounding', $3, $4, 'allocated')
        `, [policy.action_params.vertical, amount, actionId, policy.policy_id]);
      }

      // Update policy last_executed
      await sql.query(`
        UPDATE compounding_policies SET last_executed = NOW(), updated_at = NOW()
        WHERE policy_id = $1
      `, [policy.policy_id]);
    }

    if (blocked) actionsBlocked++;

    actions.push({
      action_id: actionId,
      policy_name: policy.name,
      action_type: policy.action_type,
      amount,
      mode: actionMode,
      executed,
      blocked,
      blocked_reason: blockedReason,
    });
  }

  // 11. Finalize run
  await sql.query(`
    UPDATE compounding_runs
    SET policies_evaluated = $1, policies_eligible = $2,
        actions_proposed = $3, actions_executed = $4,
        actions_blocked = $5, blocked_reason = $6,
        completed_at = NOW()
    WHERE run_id = $7
  `, [policiesEvaluated, policiesEligible, actionsProposed,
      actionsExecuted, actionsBlocked,
      gateBlocked ? gateReason : null, runId]);

  return NextResponse.json({
    success: true,
    data: {
      run_id: runId,
      mode,
      policies_evaluated: policiesEvaluated,
      policies_eligible: policiesEligible,
      actions_proposed: actionsProposed,
      actions_executed: actionsExecuted,
      actions_blocked: actionsBlocked,
      gate_blocked: gateBlocked,
      gate_reason: gateReason || null,
      actions,
    },
  });
}

// ── Policy Update ───────────────────────────────────────────

async function handleUpdatePolicy(body: any) {
  const {
    policy_id, name, description, status, priority,
    min_retained_earnings, min_buffer_health, min_buffer_days,
    min_channel_quality, max_fraud_rate, min_readiness_score,
    action_type, action_params, requires_approval,
    max_executions_per_quarter, cooldown_days,
  } = body;

  if (!policy_id) {
    return NextResponse.json({ success: false, error: 'policy_id required' }, { status: 400 });
  }

  await sql.query(`
    UPDATE compounding_policies SET
      name = COALESCE($1, name),
      description = COALESCE($2, description),
      status = COALESCE($3, status),
      priority = COALESCE($4, priority),
      min_retained_earnings = COALESCE($5, min_retained_earnings),
      min_buffer_health = COALESCE($6, min_buffer_health),
      min_buffer_days = COALESCE($7, min_buffer_days),
      min_channel_quality = COALESCE($8, min_channel_quality),
      max_fraud_rate = COALESCE($9, max_fraud_rate),
      min_readiness_score = COALESCE($10, min_readiness_score),
      action_type = COALESCE($11, action_type),
      action_params = COALESCE($12, action_params),
      requires_approval = COALESCE($13, requires_approval),
      max_executions_per_quarter = COALESCE($14, max_executions_per_quarter),
      cooldown_days = COALESCE($15, cooldown_days),
      updated_at = NOW()
    WHERE policy_id = $16
  `, [name, description, status, priority,
      min_retained_earnings, min_buffer_health, min_buffer_days,
      min_channel_quality, max_fraud_rate, min_readiness_score,
      action_type, action_params ? JSON.stringify(action_params) : null,
      requires_approval, max_executions_per_quarter, cooldown_days,
      policy_id]);

  const { rows } = await sql.query(
    `SELECT * FROM compounding_policies WHERE policy_id = $1`, [policy_id]
  );

  return NextResponse.json({ success: true, data: { policy: rows[0] } });
}

// ── Approve / Reject Actions ────────────────────────────────

async function handleApproveAction(actionId: number) {
  if (!actionId) {
    return NextResponse.json({ success: false, error: 'action_id required' }, { status: 400 });
  }

  // Check gates before approving
  const gates = await checkAllGates('compounding', 0.7);
  if (!gates.allowed) {
    return NextResponse.json({
      success: false,
      error: `Cannot approve: ${gates.reason}`,
    }, { status: 403 });
  }

  await sql.query(`
    UPDATE compounding_actions
    SET mode = 'execute', executed = true, blocked = false,
        blocked_reason = NULL, approved_at = NOW(), approved_by = 'admin'
    WHERE action_id = $1
  `, [actionId]);

  // Get action details for allocation
  const { rows } = await sql.query(
    `SELECT ca.*, cp.action_params FROM compounding_actions ca
     JOIN compounding_policies cp ON cp.policy_id = ca.policy_id
     WHERE ca.action_id = $1`, [actionId]
  );

  if (rows[0] && rows[0].action_type === 'allocate_to_vertical') {
    const params = typeof rows[0].action_params === 'string'
      ? JSON.parse(rows[0].action_params) : rows[0].action_params;
    if (params?.vertical) {
      await sql.query(`
        INSERT INTO vertical_allocations
          (vertical, amount, source, action_id, policy_id, status)
        VALUES ($1, $2, 'compounding', $3, $4, 'allocated')
      `, [params.vertical, rows[0].amount, actionId, rows[0].policy_id]);
    }
  }

  return NextResponse.json({ success: true, data: { approved: true, action_id: actionId } });
}

async function handleRejectAction(actionId: number, reason?: string) {
  if (!actionId) {
    return NextResponse.json({ success: false, error: 'action_id required' }, { status: 400 });
  }

  await sql.query(`
    UPDATE compounding_actions
    SET blocked = true, blocked_reason = $1
    WHERE action_id = $2
  `, [reason || 'Manually rejected', actionId]);

  return NextResponse.json({ success: true, data: { rejected: true, action_id: actionId } });
}

// ── Condition Evaluation ────────────────────────────────────

function evaluatePolicyConditions(
  policy: any,
  state: {
    retainedEarnings: number;
    bufferHealth: number;
    bufferDays: number;
    avgChannelQuality: number;
    avgCohortSurvival: number;
    fraudRate: number;
    readinessScore: number;
  }
): { pass: boolean; reason?: string } {
  if (policy.min_retained_earnings != null && state.retainedEarnings < Number(policy.min_retained_earnings)) {
    return { pass: false, reason: `Retained earnings ${state.retainedEarnings} < ${policy.min_retained_earnings}` };
  }
  if (policy.min_buffer_health != null && state.bufferHealth < Number(policy.min_buffer_health)) {
    return { pass: false, reason: `Buffer health ${state.bufferHealth}% < ${policy.min_buffer_health}%` };
  }
  if (policy.min_buffer_days != null && state.bufferDays < Number(policy.min_buffer_days)) {
    return { pass: false, reason: `Buffer days ${state.bufferDays} < ${policy.min_buffer_days}` };
  }
  if (policy.min_channel_quality != null && state.avgChannelQuality < Number(policy.min_channel_quality)) {
    return { pass: false, reason: `Channel quality ${state.avgChannelQuality} < ${policy.min_channel_quality}` };
  }
  if (policy.max_fraud_rate != null && state.fraudRate > Number(policy.max_fraud_rate)) {
    return { pass: false, reason: `Fraud rate ${state.fraudRate} > ${policy.max_fraud_rate}` };
  }
  if (policy.min_readiness_score != null && state.readinessScore < Number(policy.min_readiness_score)) {
    return { pass: false, reason: `Readiness ${state.readinessScore} < ${policy.min_readiness_score}` };
  }
  return { pass: true };
}

// ── Amount Computation ──────────────────────────────────────

function computeActionAmount(policy: any, retainedEarnings: number): number {
  const params = typeof policy.action_params === 'string'
    ? JSON.parse(policy.action_params) : (policy.action_params || {});

  if (params.pct_of_retained) {
    return Math.round(retainedEarnings * Number(params.pct_of_retained) * 100) / 100;
  }
  if (params.fixed_amount) {
    return Number(params.fixed_amount);
  }
  if (params.max_amount) {
    return Math.min(retainedEarnings * 0.1, Number(params.max_amount));
  }
  return 0;
}
