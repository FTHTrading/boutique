export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { FundingStructureAgent } from '@/agents/funding-structure-agent';

// Auth: pass-through when CLERK_SECRET_KEY is not set (internal platform)
function auth(): { userId: string | null } {
  if (!process.env.CLERK_SECRET_KEY) return { userId: 'dev' };
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@clerk/nextjs').auth();
  } catch { return { userId: null }; }
}

const agent = new FundingStructureAgent();

// POST /api/funding/structure — run FundingStructureAgent and return term sheet
export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const {
    dealId, dealValue, currency, commodity, jurisdiction,
    counterpartyJurisdiction, incoterms, paymentTermsRequested,
    existingInstruments, riskNotes, persistRequirements,
  } = body;

  if (!dealId || !dealValue || !commodity || !jurisdiction) {
    return NextResponse.json(
      { error: 'dealId, dealValue, commodity, jurisdiction required' },
      { status: 400 }
    );
  }

  const termSheet = await agent.analyze({
    dealId,
    dealValue: parseFloat(dealValue),
    currency: currency ?? 'USD',
    commodity,
    jurisdiction,
    counterpartyJurisdiction,
    incoterms,
    paymentTermsRequested,
    existingInstruments,
    riskNotes,
  });

  // Optionally persist the generated requirements to DB
  if (persistRequirements) {
    await agent.persistRequirements(dealId, termSheet);
  }

  return NextResponse.json({ termSheet });
}
