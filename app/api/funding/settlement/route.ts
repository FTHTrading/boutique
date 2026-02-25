import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { sql } from '@/lib/sql';
import { SettlementRailAgent } from '@/agents/settlement-rail-agent';

const agent = new SettlementRailAgent();

// GET /api/funding/settlement?dealId=xxx
export async function GET(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const dealId = req.nextUrl.searchParams.get('dealId');
  if (!dealId) return NextResponse.json({ error: 'dealId required' }, { status: 400 });

  const { rows: instructions } = await sql`
    SELECT * FROM settlement_instructions WHERE deal_id = ${dealId} ORDER BY created_at DESC
  `;
  const { rows: milestones } = await sql`
    SELECT * FROM escrow_milestones WHERE deal_id = ${dealId} ORDER BY created_at ASC
  `;

  return NextResponse.json({ instructions, milestones });
}

// POST /api/funding/settlement — generate settlement instructions
export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { dealId, rail, instrumentId } = body;

  if (!dealId || !rail) {
    return NextResponse.json({ error: 'dealId and rail required' }, { status: 400 });
  }

  let instructions;
  let settlementId: string;

  switch (rail) {
    case 'FIAT': {
      const {
        beneficiaryName, beneficiaryAccount, beneficiaryBank, swiftBic,
        routingNumber, iban, amount, currency, referenceText, intermediaryBank,
      } = body;
      if (!beneficiaryName || !swiftBic || !amount || !currency) {
        return NextResponse.json(
          { error: 'beneficiaryName, swiftBic, amount, currency required for FIAT' },
          { status: 400 }
        );
      }
      instructions = agent.buildFiatInstructions({
        dealId, beneficiaryName, beneficiaryAccount: beneficiaryAccount ?? '',
        beneficiaryBank: beneficiaryBank ?? '', swiftBic,
        routingNumber, iban, amount, currency, referenceText, intermediaryBank,
      });
      break;
    }

    case 'XRPL': {
      const { destinationAddress, amount, currency, issuer, escrowCondition } = body;
      if (!destinationAddress || !amount) {
        return NextResponse.json(
          { error: 'destinationAddress and amount required for XRPL' },
          { status: 400 }
        );
      }
      instructions = agent.buildXrplInstructions({
        destinationAddress, amount: parseFloat(amount),
        currency, issuer, escrowCondition,
        escrowFinishAfterDate: body.escrowFinishAfter ? new Date(body.escrowFinishAfter) : undefined,
        escrowCancelAfterDate: body.escrowCancelAfter ? new Date(body.escrowCancelAfter) : undefined,
      });
      break;
    }

    case 'STELLAR': {
      const { destinationAddress, amount, assetCode, assetIssuer, memo, memoType, federationAddress } = body;
      if (!destinationAddress || !amount) {
        return NextResponse.json(
          { error: 'destinationAddress and amount required for STELLAR' },
          { status: 400 }
        );
      }
      instructions = agent.buildStellarInstructions({
        destinationAddress, amount: String(amount), assetCode, assetIssuer,
        memo, memoType, federationAddress,
      });
      break;
    }

    default:
      return NextResponse.json({ error: `Unknown rail: ${rail}` }, { status: 400 });
  }

  settlementId = await agent.persistSettlement(dealId, instructions, instrumentId);

  return NextResponse.json({ settlementId, instructions }, { status: 201 });
}
