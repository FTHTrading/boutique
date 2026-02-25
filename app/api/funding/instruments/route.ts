import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { sql } from '@/lib/sql';
import { InstrumentVerificationAgent } from '@/agents/instrument-verification-agent';

const verifier = new InstrumentVerificationAgent();

// GET /api/funding/instruments?dealId=xxx
export async function GET(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const dealId = req.nextUrl.searchParams.get('dealId');
  if (!dealId) return NextResponse.json({ error: 'dealId required' }, { status: 400 });

  const { rows } = await sql`
    SELECT * FROM funding_instruments
    WHERE deal_id = ${dealId}
    ORDER BY created_at DESC
  `;

  return NextResponse.json({ instruments: rows });
}

// POST /api/funding/instruments — create an instrument record
export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const {
    dealId, instrumentType, issuingBankName, issuingBankBic, issuingBankCountry,
    advisingBankName, advisingBankBic, referenceNumber,
    amount, currency, issueDate, expiryDate,
    beneficiaryName, applicantName, applicableRules, specialConditions,
    presentationDays, rawSwiftText,
  } = body;

  if (!dealId || !instrumentType) {
    return NextResponse.json({ error: 'dealId and instrumentType required' }, { status: 400 });
  }

  const { rows } = await sql`
    INSERT INTO funding_instruments (
      deal_id, instrument_type, issuing_bank_name, issuing_bank_bic, issuing_bank_country,
      advising_bank_name, advising_bank_bic, reference_number,
      amount, currency, issue_date, expiry_date,
      beneficiary_name, applicant_name, applicable_rules, special_conditions,
      presentation_days, raw_swift_text, human_approval_required
    ) VALUES (
      ${dealId}, ${instrumentType}, ${issuingBankName ?? null}, ${issuingBankBic ?? null},
      ${issuingBankCountry ?? null}, ${advisingBankName ?? null}, ${advisingBankBic ?? null},
      ${referenceNumber ?? null}, ${amount ?? null}, ${currency ?? 'USD'},
      ${issueDate ?? null}, ${expiryDate ?? null}, ${beneficiaryName ?? null},
      ${applicantName ?? null}, ${applicableRules ?? 'UCP 600'}, ${specialConditions ?? null},
      ${presentationDays ?? 21}, ${rawSwiftText ?? null}, TRUE
    )
    RETURNING *
  `;

  return NextResponse.json({ instrument: rows[0] }, { status: 201 });
}

// PATCH /api/funding/instruments — verify, approve, or update stage
export async function PATCH(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { action, instrumentId } = body;

  if (!instrumentId || !action) {
    return NextResponse.json({ error: 'instrumentId and action required' }, { status: 400 });
  }

  switch (action) {
    case 'VERIFY': {
      // Run automated checks — always returns PENDING_HUMAN_REVIEW or HUMAN_REJECTED
      const result = await verifier.verify({
        instrumentId,
        rawSwiftText: body.rawSwiftText,
        expectedAmount: body.expectedAmount,
        expectedCurrency: body.expectedCurrency,
        expectedBeneficiary: body.expectedBeneficiary,
        expectedIssuingBic: body.expectedIssuingBic,
        expectedExpiry: body.expectedExpiry,
      });
      return NextResponse.json({ result });
    }

    case 'HUMAN_APPROVE': {
      // Human gate — operator explicitly approves
      if (!body.approvedBy) {
        return NextResponse.json({ error: 'approvedBy required for HUMAN_APPROVE' }, { status: 400 });
      }
      await verifier.approveInstrument(instrumentId, body.approvedBy, body.notes);
      return NextResponse.json({ status: 'HUMAN_APPROVED' });
    }

    case 'HUMAN_REJECT': {
      if (!body.reason) {
        return NextResponse.json({ error: 'reason required for HUMAN_REJECT' }, { status: 400 });
      }
      await verifier.rejectInstrument(instrumentId, userId, body.reason);
      return NextResponse.json({ status: 'HUMAN_REJECTED' });
    }

    case 'UPDATE_STAGE': {
      const { stage } = body;
      if (!stage) return NextResponse.json({ error: 'stage required' }, { status: 400 });
      const { rows } = await sql`
        UPDATE funding_instruments SET stage = ${stage}, updated_at = NOW()
        WHERE id = ${instrumentId}
        RETURNING *
      `;
      return NextResponse.json({ instrument: rows[0] });
    }

    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }
}
