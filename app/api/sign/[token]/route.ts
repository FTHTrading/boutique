export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/sql';
import { ContractAgent } from '@/agents/contract-agent';

const contractAgent = new ContractAgent();

// GET /api/sign/[token] — fetch contract for review (public, no auth)
export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { rows } = await sql`
      SELECT
        c.id AS contract_id,
        c.contract_number,
        c.contract_type,
        c.party_b_name,
        c.party_b_signatory,
        c.party_b_email,
        c.commodity,
        c.effective_date,
        c.expiry_date,
        c.governing_law,
        c.document_html,
        c.esign_token,
        c.esign_expires_at,
        c.status,
        c.signed_by_b,
        c.signed_by_b_at
      FROM contracts c
      WHERE c.esign_token = ${params.token}
      LIMIT 1
    `;

    if (!rows.length) {
      return NextResponse.json({ success: false, error: 'Invalid or expired signing link' }, { status: 404 });
    }

    const contract = rows[0];

    // Check expiry (unless already signed)
    if (contract.status !== 'executed' && contract.esign_expires_at) {
      const expires = new Date(contract.esign_expires_at);
      if (expires < new Date()) {
        return NextResponse.json(
          { success: false, error: 'This signing link has expired. Please contact contracts@fthtrading.com for a new link.' },
          { status: 410 }
        );
      }
    }

    return NextResponse.json({ success: true, contract });
  } catch (err) {
    console.error('GET /api/sign error:', err);
    return NextResponse.json({ success: false, error: 'Failed to load contract' }, { status: 500 });
  }
}

// POST /api/sign/[token] — execute signature (public, no auth)
export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const body = await req.json();
    const { signatory_name } = body;

    if (!signatory_name?.trim()) {
      return NextResponse.json({ success: false, error: 'Signatory name is required' }, { status: 400 });
    }

    // Get IP address from headers (works on Vercel)
    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';

    const userAgent = req.headers.get('user-agent') || 'unknown';

    const result = await contractAgent.processSignature(
      params.token,
      signatory_name.trim(),
      ipAddress,
      userAgent
    );

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      contract_id: result.contract_id,
      message: 'Contract has been executed successfully.',
    });
  } catch (err) {
    console.error('POST /api/sign error:', err);
    return NextResponse.json({ success: false, error: 'Signature processing failed' }, { status: 500 });
  }
}
