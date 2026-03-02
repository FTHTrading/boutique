export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/sql'

/**
 * GET /api/prop-sharing/accounts
 * List prop accounts with optional filters
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const phase = searchParams.get('phase')
  const programId = searchParams.get('program_id')
  const search = searchParams.get('search')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
  const offset = parseInt(searchParams.get('offset') || '0')

  try {
    let query = `
      SELECT pa.*, pp.name AS program_name, pp.slug AS program_slug
      FROM prop_accounts pa
      LEFT JOIN prop_programs pp ON pa.program_id = pp.program_id
      WHERE 1=1
    `
    const params: any[] = []

    if (phase) { params.push(phase); query += ` AND pa.phase = $${params.length}` }
    if (programId) { params.push(programId); query += ` AND pa.program_id = $${params.length}` }
    if (search) {
      params.push(`%${search}%`)
      query += ` AND (pa.trader_name ILIKE $${params.length} OR pa.account_number ILIKE $${params.length} OR pa.trader_email ILIKE $${params.length})`
    }

    query += ` ORDER BY pa.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, offset)

    const result = await sql.query(query, params)

    return NextResponse.json({ success: true, accounts: result.rows, count: result.rows.length, offset })
  } catch (error: any) {
    console.error('[API/prop-sharing/accounts] GET error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/prop-sharing/accounts
 * Create a new prop trading account (starts in evaluation phase)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { program_id, trader_name, trader_email, trader_country, trader_experience, member_id, notes } = body

    if (!program_id || !trader_name || !trader_email) {
      return NextResponse.json({ error: 'program_id, trader_name, and trader_email required' }, { status: 400 })
    }

    // Fetch program to set capital + eval deadline
    const programRes = await sql.query(`SELECT * FROM prop_programs WHERE program_id = $1`, [program_id])
    if (programRes.rows.length === 0) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }
    const program = programRes.rows[0] as any

    // Generate account number
    const countRes = await sql.query(`SELECT COUNT(*) AS cnt FROM prop_accounts`)
    const seq = parseInt((countRes.rows[0] as any).cnt) + 1
    const accountNumber = `PROP-${new Date().getFullYear()}-${String(seq).padStart(4, '0')}`

    const startingCapital = program.funded_capital
    const evalDeadline = new Date()
    evalDeadline.setDate(evalDeadline.getDate() + program.eval_duration_days)

    const result = await sql.query(`
      INSERT INTO prop_accounts (
        account_number, program_id, member_id,
        trader_name, trader_email, trader_country, trader_experience,
        phase, starting_capital, current_balance, peak_balance,
        eval_started_at, eval_deadline, notes
      ) VALUES (
        $1, $2, $3,
        $4, $5, $6, $7,
        'evaluation', $8, $8, $8,
        NOW(), $9, $10
      ) RETURNING *
    `, [
      accountNumber, program_id, member_id || null,
      trader_name, trader_email, trader_country || null, trader_experience || null,
      startingCapital, evalDeadline.toISOString(), notes || null,
    ])

    return NextResponse.json({ success: true, account: result.rows[0] }, { status: 201 })
  } catch (error: any) {
    console.error('[API/prop-sharing/accounts] POST error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
