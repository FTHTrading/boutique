import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { sql } from '@vercel/postgres';
import { contractAgent } from '@/agents/contract-agent';
import { sendContractForSigning } from '@/lib/email';

/**
 * GET /api/contracts — list all contracts
 * POST /api/contracts — generate a new contract
 * PATCH /api/contracts — update contract status/notes
 */

export async function GET(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const type = searchParams.get('type');
  const search = searchParams.get('search');
  const companyId = searchParams.get('company_id');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);

  try {
    let query = `
      SELECT 
        ct.*,
        co.name AS company_name, co.domain AS company_domain
      FROM contracts ct
      LEFT JOIN companies co ON ct.company_id = co.company_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) { params.push(status); query += ` AND ct.status = $${params.length}`; }
    if (type) { params.push(type); query += ` AND ct.contract_type = $${params.length}`; }
    if (companyId) { params.push(companyId); query += ` AND ct.company_id = $${params.length}`; }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (ct.contract_number ILIKE $${params.length} OR ct.party_b_name ILIKE $${params.length} OR ct.commodity ILIKE $${params.length})`;
    }

    query += ` ORDER BY ct.created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await sql.query(query, params);

    // Stats
    const stats = await sql`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'draft') AS drafts,
        COUNT(*) FILTER (WHERE status = 'sent_for_review') AS awaiting_signature,
        COUNT(*) FILTER (WHERE status = 'executed') AS executed,
        COUNT(*) FILTER (WHERE status = 'expired') AS expired
      FROM contracts
    `;

    return NextResponse.json({
      success: true,
      contracts: result.rows,
      stats: stats.rows[0],
      count: result.rows.length,
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
    const { contract_type, company_id, deal_id, party_b_name, party_b_signatory, party_b_email, commodity, deal_value_usd, quantity, effective_date, expiry_date, governing_law, special_terms, send_for_signature } = body;

    if (!contract_type || !party_b_name || !party_b_signatory || !party_b_email || !commodity) {
      return NextResponse.json({
        success: false,
        error: 'Required: contract_type, party_b_name, party_b_signatory, party_b_email, commodity',
      }, { status: 400 });
    }

    const generated = await contractAgent.generateContract({
      contract_type,
      company_id,
      deal_id,
      party_b_name,
      party_b_signatory,
      party_b_email,
      commodity,
      deal_value_usd,
      quantity,
      effective_date,
      expiry_date,
      governing_law,
      special_terms,
      created_by: userId,
    });

    // Optionally send for signature immediately
    if (send_for_signature) {
      await sendContractForSigning(
        party_b_email,
        party_b_signatory,
        generated.contract_number,
        generated.signing_url,
        commodity,
        deal_value_usd ? `USD ${deal_value_usd.toLocaleString()}` : undefined
      );

      await sql`
        UPDATE contracts SET status = 'sent_for_review', updated_at = NOW()
        WHERE contract_id = ${generated.contract_id}
      `;
    }

    return NextResponse.json({
      success: true,
      contract: generated,
      sent_for_signature: send_for_signature || false,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { contract_id, status, notes, amendments, compliance_notes } = body;

    if (!contract_id) {
      return NextResponse.json({ success: false, error: 'contract_id required' }, { status: 400 });
    }

    if (amendments) {
      // Create amendment (version bump)
      const result = await contractAgent.amendContract(contract_id, amendments, userId);
      return NextResponse.json({ success: true, amendment: result });
    }

    const result = await sql`
      UPDATE contracts SET
        status = COALESCE(${status}, status),
        internal_notes = COALESCE(${notes}, internal_notes),
        compliance_notes = COALESCE(${compliance_notes}, compliance_notes),
        updated_at = NOW()
      WHERE contract_id = ${contract_id}
      RETURNING *
    `;

    return NextResponse.json({ success: true, contract: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
