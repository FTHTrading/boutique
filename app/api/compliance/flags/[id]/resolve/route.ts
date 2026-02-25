import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { sql } from '@vercel/postgres';

/**
 * POST /api/compliance/flags/[id]/resolve
 * Resolve a compliance flag with notes. Logs to audit trail.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId, sessionClaims } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const flagId = params.id;
  const userName = (sessionClaims?.name as string) || userId;

  try {
    const body = await req.json();
    const { resolved_by, resolution_notes } = body;

    if (!resolved_by || !resolution_notes) {
      return NextResponse.json(
        { success: false, error: 'resolved_by and resolution_notes are required' },
        { status: 400 }
      );
    }

    // Fetch flag + associated deal for CRITICAL check
    const flagResult = await sql`
      SELECT cf.*, d.deal_number, d.deal_id 
      FROM compliance_flags cf
      LEFT JOIN deals d ON cf.deal_id = d.deal_id
      WHERE cf.flag_id = ${flagId}
    `;

    if (flagResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Flag not found' }, { status: 404 });
    }

    const flag = flagResult.rows[0];

    if (flag.resolved) {
      return NextResponse.json({ success: false, error: 'Flag already resolved' }, { status: 400 });
    }

    // Update flag
    const updated = await sql`
      UPDATE compliance_flags SET
        resolved = true,
        resolved_by = ${resolved_by},
        resolved_at = NOW(),
        resolution_notes = ${resolution_notes}
      WHERE flag_id = ${flagId}
      RETURNING *
    `;

    // Log to compliance_actions audit trail
    await sql`
      INSERT INTO compliance_actions (deal_id, flag_id, action_type, performed_by, metadata)
      VALUES (
        ${flag.deal_id}, ${flagId}, 'flag_resolved', ${resolved_by},
        ${JSON.stringify({ resolution_notes, severity: flag.severity, flag_type: flag.flag_type })}
      )
    `;

    // After resolving, check if all CRITICAL flags for this deal are now resolved
    // If so, update deal compliance_status
    if (flag.deal_id) {
      const remaining = await sql`
        SELECT COUNT(*) FROM compliance_flags
        WHERE deal_id = ${flag.deal_id} AND NOT resolved AND blocks_execution = true
      `;

      if (parseInt(remaining.rows[0].count) === 0) {
        // Check if any flags remain
        const anyRemaining = await sql`
          SELECT COUNT(*) FROM compliance_flags
          WHERE deal_id = ${flag.deal_id} AND NOT resolved
        `;

        const newStatus = parseInt(anyRemaining.rows[0].count) === 0 ? 'cleared' : 'flagged';
        await sql`
          UPDATE deals SET 
            compliance_status = ${newStatus},
            compliance_cleared_at = ${newStatus === 'cleared' ? new Date().toISOString() : null},
            compliance_cleared_by = ${newStatus === 'cleared' ? resolved_by : null},
            status = CASE WHEN ${newStatus} = 'cleared' AND status = 'on_hold' THEN 'qualified' ELSE status END,
            updated_at = NOW()
          WHERE deal_id = ${flag.deal_id}
        `;
      }
    }

    return NextResponse.json({
      success: true,
      flag: updated.rows[0],
      message: `Flag resolved by ${resolved_by}`,
    });
  } catch (error: any) {
    console.error('[API/compliance/flags/resolve] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
