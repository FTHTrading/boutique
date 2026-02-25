import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { sql } from '@vercel/postgres';
import { runComplianceScreen } from '@/agents/trade-compliance-agent';
import { sendCriticalComplianceAlert } from '@/lib/email';

/**
 * GET /api/deals
 * List deals with compliance status. Dashboard protected.
 */
export async function GET(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const commodity = searchParams.get('commodity');
  const compliance = searchParams.get('compliance');
  const search = searchParams.get('search');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    let query = `
      SELECT 
        d.*,
        COALESCE(f.flag_counts, '{}'::jsonb) AS flag_counts,
        COALESCE(f.critical_count, 0) AS critical_flags,
        COALESCE(f.total_flags, 0) AS total_flags,
        COALESCE(f.unresolved_flags, 0) AS unresolved_flags
      FROM deals d
      LEFT JOIN (
        SELECT 
          deal_id,
          jsonb_object_agg(severity, cnt) AS flag_counts,
          SUM(CASE WHEN severity = 'CRITICAL' THEN cnt ELSE 0 END) AS critical_count,
          SUM(cnt) AS total_flags,
          COUNT(*) FILTER (WHERE NOT resolved) AS unresolved_flags
        FROM (
          SELECT deal_id, severity, COUNT(*) AS cnt, resolved
          FROM compliance_flags GROUP BY deal_id, severity, resolved
        ) s
        GROUP BY deal_id
      ) f ON d.deal_id = f.deal_id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (status) { params.push(status); query += ` AND d.status = $${params.length}`; }
    if (commodity) { params.push(commodity); query += ` AND d.commodity ILIKE $${params.length}`; }
    if (compliance) { params.push(compliance); query += ` AND d.compliance_status = $${params.length}`; }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (d.client_name ILIKE $${params.length} OR d.deal_number ILIKE $${params.length} OR d.commodity ILIKE $${params.length})`;
    }

    query += ` ORDER BY d.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await sql.query(query, params);

    return NextResponse.json({
      success: true,
      deals: result.rows,
      count: result.rows.length,
      offset,
    });
  } catch (error: any) {
    console.error('[API/deals] GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/deals
 * Create deal + run compliance screening automatically.
 */
export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { client_name, client_email, commodity, deal_value_usd, origin_country, destination_country, incoterm, quantity, quantity_unit, payment_terms, target_delivery, notes } = body;

    if (!client_name || !commodity) {
      return NextResponse.json({ success: false, error: 'Missing required fields: client_name, commodity' }, { status: 400 });
    }

    // Generate deal number
    const year = new Date().getFullYear();
    const countResult = await sql`SELECT COUNT(*) FROM deals WHERE EXTRACT(YEAR FROM created_at) = ${year}`;
    const seq = String(parseInt(countResult.rows[0].count || '0') + 1).padStart(4, '0');
    const dealNumber = `DEAL-${year}-${seq}`;

    // Insert deal
    const dealResult = await sql`
      INSERT INTO deals (
        deal_number, client_name, client_email, commodity,
        deal_value_usd, origin_country, destination_country, incoterm,
        quantity, quantity_unit, payment_terms, target_delivery,
        status, compliance_status, notes, assigned_to
      ) VALUES (
        ${dealNumber}, ${client_name}, ${client_email || null}, ${commodity},
        ${deal_value_usd || null}, ${origin_country || null}, ${destination_country || null}, ${incoterm || null},
        ${quantity || null}, ${quantity_unit || null}, ${payment_terms || null}, ${target_delivery || null},
        'inquiry', 'pending', ${notes || null}, ${userId}
      )
      RETURNING *
    `;

    const deal = dealResult.rows[0];

    // Run compliance screening
    let flags: any[] = [];
    try {
      flags = await runComplianceScreen(deal);

      // Check if CRITICAL flags were generated
      const criticalFlags = flags.filter((f) => f.severity === 'CRITICAL');
      if (criticalFlags.length > 0) {
        await sendCriticalComplianceAlert(dealNumber, deal.deal_id, flags);
        await sql`UPDATE deals SET compliance_status = 'flagged', status = 'on_hold' WHERE deal_id = ${deal.deal_id}`;
      } else if (flags.length === 0) {
        await sql`UPDATE deals SET compliance_status = 'cleared' WHERE deal_id = ${deal.deal_id}`;
      } else {
        await sql`UPDATE deals SET compliance_status = 'flagged' WHERE deal_id = ${deal.deal_id}`;
      }
    } catch (complianceErr: any) {
      console.error('[API/deals] Compliance screening error:', complianceErr.message);
    }

    return NextResponse.json({
      success: true,
      deal,
      compliance_flags: flags,
      deal_number: dealNumber,
      blocked: flags.some((f) => f.blocks_execution),
    });
  } catch (error: any) {
    console.error('[API/deals] POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
