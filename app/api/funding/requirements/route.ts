import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { sql } from '@/lib/sql';
import { FundingStructureAgent } from '@/agents/funding-structure-agent';

const agent = new FundingStructureAgent();

// GET /api/funding/requirements?dealId=xxx
export async function GET(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const dealId = req.nextUrl.searchParams.get('dealId');
  if (!dealId) return NextResponse.json({ error: 'dealId required' }, { status: 400 });

  const { rows } = await sql`
    SELECT * FROM funding_requirements
    WHERE deal_id = ${dealId}
    ORDER BY is_critical DESC, created_at ASC
  `;

  const score = await agent.computeReadinessScore(dealId);

  return NextResponse.json({ requirements: rows, readinessScore: score });
}

// POST /api/funding/requirements
export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { dealId, requirementType, label, description, isCritical, dueDate } = body;

  if (!dealId || !requirementType || !label) {
    return NextResponse.json({ error: 'dealId, requirementType, label required' }, { status: 400 });
  }

  const { rows } = await sql`
    INSERT INTO funding_requirements
      (deal_id, requirement_type, label, description, is_critical, due_date)
    VALUES (${dealId}, ${requirementType}, ${label}, ${description ?? null}, ${isCritical ?? false}, ${dueDate ?? null})
    RETURNING *
  `;

  return NextResponse.json({ requirement: rows[0] }, { status: 201 });
}

// PATCH /api/funding/requirements — update status
export async function PATCH(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { id, status, notes, documentUrl } = body;
  if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 });

  const { rows } = await sql`
    UPDATE funding_requirements SET
      status       = ${status},
      notes        = ${notes ?? null},
      document_url = ${documentUrl ?? null},
      reviewed_by  = ${userId},
      reviewed_at  = ${status !== 'PENDING' ? new Date().toISOString() : null},
      updated_at   = NOW()
    WHERE id = ${id}
    RETURNING *
  `;

  return NextResponse.json({ requirement: rows[0] });
}
