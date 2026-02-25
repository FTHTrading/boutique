export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { sql } from '@/lib/sql';
import { companyResearchAgent } from '@/agents/company-research-agent';

/**
 * GET /api/companies
 * List companies with CRM status and opportunity scores.
 *
 * POST /api/companies
 * Manually add a company OR trigger automated research from a website URL.
 */

export async function GET(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const industry = searchParams.get('industry');
  const search = searchParams.get('search');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
  const offset = parseInt(searchParams.get('offset') || '0');
  const sort = searchParams.get('sort') || 'opportunity_score';

  try {
    let query = `
      SELECT 
        c.*,
        COUNT(DISTINCT ct.contact_id) AS contact_count,
        COUNT(DISTINCT d.deal_id) AS deal_count,
        COUNT(DISTINCT CASE WHEN d.status NOT IN ('closed_lost') THEN d.deal_id END) AS active_deals,
        MAX(ol.sent_at) AS last_contacted_at
      FROM companies c
      LEFT JOIN contacts ct ON c.company_id = ct.company_id
      LEFT JOIN deals d ON c.company_id = d.company_id
      LEFT JOIN outreach_log ol ON ct.contact_id = ol.contact_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) { params.push(status); query += ` AND c.crm_status = $${params.length}`; }
    if (industry) { params.push(industry); query += ` AND c.industry = $${params.length}`; }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (c.name ILIKE $${params.length} OR c.domain ILIKE $${params.length})`;
    }

    const allowedSort = ['opportunity_score', 'name', 'created_at', 'last_researched_at'];
    const sortCol = allowedSort.includes(sort) ? sort : 'opportunity_score';

    query += ` GROUP BY c.company_id
      ORDER BY c.${sortCol} DESC NULLS LAST
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await sql.query(query, params);

    return NextResponse.json({
      success: true,
      companies: result.rows,
      count: result.rows.length,
      offset,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { mode, website_url, name, domain, industry, company_type, hq_country, hq_city, commodities, notes } = body;

    // Mode 1: Auto-research from website URL
    if (mode === 'research' && website_url) {
      const result = await companyResearchAgent.researchCompany(website_url);
      const companyId = await companyResearchAgent.persistResearch(result);

      return NextResponse.json({
        success: true,
        mode: 'research',
        company_id: companyId,
        company: result,
        contacts_found: result.publicly_listed_contacts.length,
        opportunity_score: result.opportunity_score,
      });
    }

    // Mode 2: Manual entry
    if (!name) {
      return NextResponse.json({ success: false, error: 'name is required for manual entry' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO companies (name, domain, website, industry, company_type, hq_country, hq_city, commodities, research_notes, source, crm_status)
      VALUES (
        ${name}, ${domain || null},
        ${website_url || null},
        ${industry || null}, ${company_type || 'prospect'},
        ${hq_country || null}, ${hq_city || null},
        ${commodities || null},
        ${notes || null}, 'manual', 'new'
      )
      RETURNING *
    `;

    return NextResponse.json({ success: true, company: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { company_id, crm_status, assigned_to, notes, opportunity_score } = body;

    if (!company_id) {
      return NextResponse.json({ success: false, error: 'company_id required' }, { status: 400 });
    }

    const result = await sql`
      UPDATE companies SET
        crm_status = COALESCE(${crm_status}, crm_status),
        assigned_to = COALESCE(${assigned_to}, assigned_to),
        research_notes = COALESCE(${notes}, research_notes),
        opportunity_score = COALESCE(${opportunity_score}, opportunity_score),
        updated_at = NOW()
      WHERE company_id = ${company_id}
      RETURNING *
    `;

    return NextResponse.json({ success: true, company: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
