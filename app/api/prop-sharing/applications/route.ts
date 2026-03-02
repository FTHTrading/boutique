export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/sql'

/**
 * GET /api/prop-sharing/applications
 * Fetch challenge applications with pipeline summary
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const program_id = searchParams.get('program_id')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    let where = 'WHERE 1=1'
    const params: any[] = []

    if (status) {
      params.push(status)
      where += ` AND ca.status = $${params.length}`
    }
    if (program_id) {
      params.push(program_id)
      where += ` AND ca.program_id = $${params.length}`
    }
    if (search) {
      params.push(`%${search}%`)
      where += ` AND (ca.applicant_name ILIKE $${params.length} OR ca.applicant_email ILIKE $${params.length})`
    }

    params.push(limit, offset)

    const result = await sql.query(`
      SELECT ca.*,
        p.name as program_name, p.capital as program_capital, p.eval_fee
      FROM prop_challenge_applications ca
      LEFT JOIN prop_programs p ON ca.program_id = p.program_id
      ${where}
      ORDER BY ca.applied_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params)

    // Pipeline summary
    const pipeline = await sql.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'submitted') as submitted,
        COUNT(*) FILTER (WHERE status = 'payment_pending') as payment_pending,
        COUNT(*) FILTER (WHERE status = 'payment_confirmed') as payment_confirmed,
        COUNT(*) FILTER (WHERE status = 'under_review') as under_review,
        COUNT(*) FILTER (WHERE status = 'approved') as approved,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
        COUNT(*) FILTER (WHERE status = 'waitlisted') as waitlisted,
        COUNT(*) as total,
        COALESCE(SUM(CASE WHEN payment_confirmed THEN payment_amount ELSE 0 END), 0) as total_revenue
      FROM prop_challenge_applications
    `)

    const p = pipeline.rows[0]

    return NextResponse.json({
      success: true,
      applications: result.rows,
      pipeline: {
        submitted: Number(p.submitted),
        payment_pending: Number(p.payment_pending),
        payment_confirmed: Number(p.payment_confirmed),
        under_review: Number(p.under_review),
        approved: Number(p.approved),
        rejected: Number(p.rejected),
        waitlisted: Number(p.waitlisted),
        total: Number(p.total),
        total_revenue: Number(p.total_revenue),
      },
    })
  } catch (error: any) {
    console.error('[API/prop-sharing/applications] GET error:', error)
    return NextResponse.json({ success: true, applications: [], pipeline: { submitted: 0, payment_pending: 0, payment_confirmed: 0, under_review: 0, approved: 0, rejected: 0, waitlisted: 0, total: 0, total_revenue: 0 } })
  }
}

/**
 * POST /api/prop-sharing/applications
 * Submit a new challenge application (public-facing)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { program_id, applicant_name, applicant_email, applicant_phone, trading_experience, preferred_markets, motivation, referral_source, utm_source, utm_medium, utm_campaign } = body

    if (!program_id || !applicant_name || !applicant_email) {
      return NextResponse.json({ error: 'program_id, applicant_name, applicant_email required' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(applicant_email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Check program exists and is active
    const program = await sql.query(`SELECT * FROM prop_programs WHERE program_id = $1 AND status = 'active'`, [program_id])
    if (program.rows.length === 0) {
      return NextResponse.json({ error: 'Program not found or inactive' }, { status: 404 })
    }

    // Check for duplicate recent application
    const recentDupe = await sql.query(`
      SELECT application_id FROM prop_challenge_applications
      WHERE applicant_email = $1 AND program_id = $2 AND status NOT IN ('rejected', 'expired')
      AND applied_at > NOW() - INTERVAL '30 days'
    `, [applicant_email, program_id])

    if (recentDupe.rows.length > 0) {
      return NextResponse.json({ error: 'You already have a pending application for this program' }, { status: 400 })
    }

    const result = await sql.query(`
      INSERT INTO prop_challenge_applications (
        program_id, applicant_name, applicant_email, applicant_phone,
        trading_experience, preferred_markets, motivation, referral_source,
        utm_source, utm_medium, utm_campaign,
        payment_amount, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'submitted')
      RETURNING *
    `, [
      program_id, applicant_name, applicant_email, applicant_phone || null,
      trading_experience || null, preferred_markets || null, motivation || null, referral_source || null,
      utm_source || null, utm_medium || null, utm_campaign || null,
      program.rows[0].eval_fee,
    ])

    // Audit log
    await sql.query(`
      INSERT INTO prop_audit_log (entity_type, entity_id, action, new_value, performed_by, reason)
      VALUES ('application', $1, 'application_submitted', $2, $3, 'New challenge application')
    `, [result.rows[0].application_id, JSON.stringify({ program: program.rows[0].name, applicant: applicant_name, email: applicant_email }), applicant_email])

    return NextResponse.json({
      success: true,
      application: result.rows[0],
      message: 'Application submitted successfully. You will receive payment instructions shortly.',
    })
  } catch (error: any) {
    console.error('[API/prop-sharing/applications] POST error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

/**
 * PUT /api/prop-sharing/applications
 * Update application status (admin review)
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { application_id, status, reviewer, rejection_reason, payment_confirmed, payment_reference } = body

    if (!application_id || !status || !reviewer) {
      return NextResponse.json({ error: 'application_id, status, reviewer required' }, { status: 400 })
    }

    // Get old state
    const old = await sql.query(`SELECT * FROM prop_challenge_applications WHERE application_id = $1`, [application_id])
    if (old.rows.length === 0) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    const updates: string[] = ['status = $2', 'reviewed_by = $3', 'reviewed_at = NOW()', 'updated_at = NOW()']
    const params: any[] = [application_id, status, reviewer]

    if (rejection_reason) {
      params.push(rejection_reason)
      updates.push(`rejection_reason = $${params.length}`)
    }
    if (payment_confirmed !== undefined) {
      params.push(payment_confirmed)
      updates.push(`payment_confirmed = $${params.length}`)
    }
    if (payment_reference) {
      params.push(payment_reference)
      updates.push(`payment_reference = $${params.length}`)
    }

    const result = await sql.query(`
      UPDATE prop_challenge_applications SET ${updates.join(', ')} WHERE application_id = $1 RETURNING *
    `, params)

    // If approved, create the prop account
    if (status === 'approved') {
      const app = result.rows[0]
      const program = await sql.query(`SELECT * FROM prop_programs WHERE program_id = $1`, [app.program_id])
      if (program.rows.length > 0) {
        const pg = program.rows[0]
        const year = new Date().getFullYear()
        const seq = await sql.query(`SELECT COUNT(*) as c FROM prop_accounts WHERE account_number LIKE $1`, [`PROP-${year}-%`])
        const num = String(Number(seq.rows[0].c) + 1).padStart(4, '0')
        const account_number = `PROP-${year}-${num}`

        const newAccount = await sql.query(`
          INSERT INTO prop_accounts (program_id, account_number, trader_name, trader_email, starting_balance, current_balance, status, current_phase, kyc_status)
          VALUES ($1, $2, $3, $4, $5, $5, 'active', 'phase_1', 'pending')
          RETURNING *
        `, [app.program_id, account_number, app.applicant_name, app.applicant_email, pg.capital])

        // Link account to application
        await sql.query(`UPDATE prop_challenge_applications SET resulting_account_id = $1 WHERE application_id = $2`, [newAccount.rows[0].account_id, application_id])

        // Treasury entry for eval fee revenue
        if (app.payment_confirmed && app.payment_amount > 0) {
          const lastEntry = await sql.query(`SELECT running_balance FROM prop_treasury_ledger ORDER BY created_at DESC LIMIT 1`)
          const prevBal = lastEntry.rows.length > 0 ? Number(lastEntry.rows[0].running_balance) : 0

          await sql.query(`
            INSERT INTO prop_treasury_ledger (entry_type, account_id, program_id, amount, direction, description, reference, performed_by, running_balance)
            VALUES ('eval_fee_received', $1, $2, $3, 'credit', $4, $5, $6, $7)
          `, [newAccount.rows[0].account_id, app.program_id, app.payment_amount, `Eval fee from ${app.applicant_name}`, payment_reference || null, reviewer, prevBal + Number(app.payment_amount)])
        }

        // Treasury entry for capital allocation
        const lastEntry2 = await sql.query(`SELECT running_balance FROM prop_treasury_ledger ORDER BY created_at DESC LIMIT 1`)
        const prevBal2 = lastEntry2.rows.length > 0 ? Number(lastEntry2.rows[0].running_balance) : 0

        await sql.query(`
          INSERT INTO prop_treasury_ledger (entry_type, account_id, program_id, amount, direction, description, performed_by, running_balance)
          VALUES ('capital_allocated', $1, $2, $3, 'debit', $4, $5, $6)
        `, [newAccount.rows[0].account_id, app.program_id, pg.capital, `Capital allocated for ${app.applicant_name} - ${pg.name}`, reviewer, prevBal2 - Number(pg.capital)])
      }
    }

    // Audit log
    await sql.query(`
      INSERT INTO prop_audit_log (entity_type, entity_id, action, old_value, new_value, performed_by, reason)
      VALUES ('application', $1, $2, $3, $4, $5, $6)
    `, [application_id, `application_${status}`, JSON.stringify(old.rows[0]), JSON.stringify(result.rows[0]), reviewer, rejection_reason || `Application ${status}`])

    return NextResponse.json({ success: true, application: result.rows[0] })
  } catch (error: any) {
    console.error('[API/prop-sharing/applications] PUT error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
