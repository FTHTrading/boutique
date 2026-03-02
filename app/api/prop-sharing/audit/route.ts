export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/sql'

/**
 * GET /api/prop-sharing/audit
 * Fetch immutable audit log entries (read-only, never delete or update)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const entity_type = searchParams.get('entity_type')
    const entity_id = searchParams.get('entity_id')
    const action = searchParams.get('action')
    const performed_by = searchParams.get('performed_by')
    const from_date = searchParams.get('from')
    const to_date = searchParams.get('to')
    const limit = parseInt(searchParams.get('limit') || '200')
    const offset = parseInt(searchParams.get('offset') || '0')

    let where = 'WHERE 1=1'
    const params: any[] = []

    if (entity_type) {
      params.push(entity_type)
      where += ` AND entity_type = $${params.length}`
    }
    if (entity_id) {
      params.push(entity_id)
      where += ` AND entity_id = $${params.length}`
    }
    if (action) {
      params.push(action)
      where += ` AND action = $${params.length}`
    }
    if (performed_by) {
      params.push(performed_by)
      where += ` AND performed_by = $${params.length}`
    }
    if (from_date) {
      params.push(from_date)
      where += ` AND created_at >= $${params.length}`
    }
    if (to_date) {
      params.push(to_date)
      where += ` AND created_at <= $${params.length}`
    }

    params.push(limit, offset)

    const entries = await sql.query(`
      SELECT * FROM prop_audit_log
      ${where}
      ORDER BY created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params)

    const countResult = await sql.query(`
      SELECT COUNT(*) as total FROM prop_audit_log ${where}
    `, params.slice(0, -2))

    return NextResponse.json({
      success: true,
      entries: entries.rows,
      total: Number(countResult.rows[0].total),
    })
  } catch (error: any) {
    console.error('[API/prop-sharing/audit] GET error:', error)
    return NextResponse.json({ success: true, entries: [], total: 0 })
  }
}
