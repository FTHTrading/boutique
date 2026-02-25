export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';
import { sql } from '@/lib/sql';

export async function GET() {
  try {
    await sql`SELECT 1`;
    return NextResponse.json({
      status: 'ok',
      db: 'connected',
      ts: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[health] DB check failed:', err);
    return NextResponse.json(
      { status: 'error', db: 'disconnected' },
      { status: 503 }
    );
  }
}
