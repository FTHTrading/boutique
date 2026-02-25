import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { sql } from '@/lib/sql';
import { SettlementRailAgent } from '@/agents/settlement-rail-agent';

const agent = new SettlementRailAgent();

// GET /api/funding/anchors?dealId=xxx or ?objectId=xxx
export async function GET(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const dealId = req.nextUrl.searchParams.get('dealId');
  const objectId = req.nextUrl.searchParams.get('objectId');

  if (!dealId && !objectId) {
    return NextResponse.json({ error: 'dealId or objectId required' }, { status: 400 });
  }

  const { rows } = dealId
    ? await sql`SELECT * FROM proof_anchors WHERE deal_id = ${dealId} ORDER BY created_at DESC`
    : await sql`SELECT * FROM proof_anchors WHERE object_id = ${objectId!} ORDER BY created_at DESC`;

  return NextResponse.json({ anchors: rows });
}

// POST /api/funding/anchors — anchor a document hash
export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { dealId, objectType, objectId, objectData, chains } = body;

  if (!objectType || !objectId || !objectData) {
    return NextResponse.json(
      { error: 'objectType, objectId, objectData required' },
      { status: 400 }
    );
  }

  const result = await agent.anchorProof({
    dealId,
    objectType,
    objectId,
    objectData,
    chains: chains ?? ['XRPL'],
  });

  return NextResponse.json({ anchor: result }, { status: 201 });
}
