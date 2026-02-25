export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { sql } from '@/lib/sql';

/**
 * GET /api/compliance/flags
 * List compliance flags. Supports severity + resolved filters.
 */
export async function GET(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const severity = searchParams.get('severity');
  const resolved = searchParams.get('resolved');
  const dealId = searchParams.get('deal_id');
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);

  try {
    let query = `
      SELECT 
        f.*,
        d.deal_number, d.client_name, d.commodity, 
        d.deal_value_usd, d.origin_country, d.destination_country,
        d.status AS deal_status
      FROM compliance_flags f
      LEFT JOIN deals d ON f.deal_id = d.deal_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (severity) { params.push(severity); query += ` AND f.severity = $${params.length}`; }
    if (resolved !== null && resolved !== '') {
      params.push(resolved === 'true');
      query += ` AND f.resolved = $${params.length}`;
    }
    if (dealId) { params.push(dealId); query += ` AND f.deal_id = $${params.length}`; }

    query += ` ORDER BY 
      CASE f.severity WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END,
      f.created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await sql.query(query, params);

    // Summary stats
    const stats = await sql`
      SELECT
        COUNT(*) FILTER (WHERE severity = 'CRITICAL' AND NOT resolved) AS critical_unresolved,
        COUNT(*) FILTER (WHERE severity = 'HIGH' AND NOT resolved) AS high_unresolved,
        COUNT(*) FILTER (WHERE severity = 'MEDIUM' AND NOT resolved) AS medium_unresolved,
        COUNT(*) FILTER (WHERE NOT resolved) AS total_unresolved,
        COUNT(*) FILTER (WHERE resolved) AS total_resolved,
        COUNT(*) AS total
      FROM compliance_flags
    `;

    return NextResponse.json({
      success: true,
      flags: result.rows,
      stats: stats.rows[0],
      count: result.rows.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
