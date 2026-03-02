export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/sql'

/**
 * GET /api/prop-sharing/kyc
 * Fetch trader KYC records with filtering
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const account_id = searchParams.get('account_id')
    const search = searchParams.get('search')

    let where = 'WHERE 1=1'
    const params: any[] = []

    if (status) {
      params.push(status)
      where += ` AND k.status = $${params.length}`
    }
    if (account_id) {
      params.push(account_id)
      where += ` AND k.account_id = $${params.length}`
    }
    if (search) {
      params.push(`%${search}%`)
      where += ` AND (k.full_legal_name ILIKE $${params.length} OR k.email ILIKE $${params.length})`
    }

    const result = await sql.query(`
      SELECT k.*,
        a.account_number, a.trader_name, a.status as account_status
      FROM prop_trader_kyc k
      LEFT JOIN prop_accounts a ON k.account_id = a.account_id
      ${where}
      ORDER BY k.submitted_at DESC
    `, params)

    // Summary counts
    const summary = await sql.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'under_review') as under_review,
        COUNT(*) FILTER (WHERE status = 'approved') as approved,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
        COUNT(*) FILTER (WHERE status = 'expired') as expired,
        COUNT(*) as total
      FROM prop_trader_kyc
    `)

    return NextResponse.json({
      success: true,
      records: result.rows,
      summary: {
        pending: Number(summary.rows[0].pending),
        under_review: Number(summary.rows[0].under_review),
        approved: Number(summary.rows[0].approved),
        rejected: Number(summary.rows[0].rejected),
        expired: Number(summary.rows[0].expired),
        total: Number(summary.rows[0].total),
      },
    })
  } catch (error: any) {
    console.error('[API/prop-sharing/kyc] GET error:', error)
    return NextResponse.json({ success: true, records: [], summary: { pending: 0, under_review: 0, approved: 0, rejected: 0, expired: 0, total: 0 } })
  }
}

/**
 * POST /api/prop-sharing/kyc
 * Submit or update a KYC record
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { account_id, full_legal_name, date_of_birth, nationality, country_of_residence, government_id_type, government_id_number, address_line_1, address_line_2, city, state_province, postal_code, phone_number, email, tax_id } = body

    if (!account_id || !full_legal_name || !email) {
      return NextResponse.json({ error: 'account_id, full_legal_name, email required' }, { status: 400 })
    }

    // Check for existing KYC
    const existing = await sql.query(`SELECT kyc_id, status FROM prop_trader_kyc WHERE account_id = $1`, [account_id])

    if (existing.rows.length > 0 && ['approved', 'under_review'].includes(existing.rows[0].status)) {
      return NextResponse.json({ error: `KYC already ${existing.rows[0].status} for this account` }, { status: 400 })
    }

    // Upsert
    const result = await sql.query(`
      INSERT INTO prop_trader_kyc (account_id, full_legal_name, date_of_birth, nationality, country_of_residence, government_id_type, government_id_number, address_line_1, address_line_2, city, state_province, postal_code, phone_number, email, tax_id, status, submitted_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'pending', NOW())
      ON CONFLICT (account_id) DO UPDATE SET
        full_legal_name = EXCLUDED.full_legal_name,
        date_of_birth = EXCLUDED.date_of_birth,
        nationality = EXCLUDED.nationality,
        country_of_residence = EXCLUDED.country_of_residence,
        government_id_type = EXCLUDED.government_id_type,
        government_id_number = EXCLUDED.government_id_number,
        address_line_1 = EXCLUDED.address_line_1,
        address_line_2 = EXCLUDED.address_line_2,
        city = EXCLUDED.city,
        state_province = EXCLUDED.state_province,
        postal_code = EXCLUDED.postal_code,
        phone_number = EXCLUDED.phone_number,
        email = EXCLUDED.email,
        tax_id = EXCLUDED.tax_id,
        status = 'pending',
        submitted_at = NOW(),
        updated_at = NOW()
      RETURNING *
    `, [account_id, full_legal_name, date_of_birth || null, nationality || null, country_of_residence || null, government_id_type || null, government_id_number || null, address_line_1 || null, address_line_2 || null, city || null, state_province || null, postal_code || null, phone_number || null, email, tax_id || null])

    // Audit log
    await sql.query(`
      INSERT INTO prop_audit_log (entity_type, entity_id, action, new_value, performed_by, reason)
      VALUES ('kyc', $1, 'kyc_submitted', $2, $3, 'KYC submission')
    `, [result.rows[0].kyc_id, JSON.stringify(result.rows[0]), full_legal_name])

    return NextResponse.json({ success: true, record: result.rows[0] })
  } catch (error: any) {
    console.error('[API/prop-sharing/kyc] POST error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

/**
 * PUT /api/prop-sharing/kyc
 * Review a KYC record (approve/reject/flag)
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { kyc_id, status, reviewer, rejection_reason, sanctions_check_passed, pep_check_passed, identity_verified } = body

    if (!kyc_id || !status || !reviewer) {
      return NextResponse.json({ error: 'kyc_id, status, reviewer required' }, { status: 400 })
    }

    // Get old state for audit
    const old = await sql.query(`SELECT * FROM prop_trader_kyc WHERE kyc_id = $1`, [kyc_id])
    if (old.rows.length === 0) {
      return NextResponse.json({ error: 'KYC record not found' }, { status: 404 })
    }

    const updates: string[] = ['status = $2', 'reviewed_by = $3', 'reviewed_at = NOW()', 'updated_at = NOW()']
    const params: any[] = [kyc_id, status, reviewer]

    if (rejection_reason !== undefined) {
      params.push(rejection_reason)
      updates.push(`rejection_reason = $${params.length}`)
    }
    if (sanctions_check_passed !== undefined) {
      params.push(sanctions_check_passed)
      updates.push(`sanctions_check_passed = $${params.length}`)
    }
    if (pep_check_passed !== undefined) {
      params.push(pep_check_passed)
      updates.push(`pep_check_passed = $${params.length}`)
    }
    if (identity_verified !== undefined) {
      params.push(identity_verified)
      updates.push(`identity_verified = $${params.length}`)
    }

    const result = await sql.query(`
      UPDATE prop_trader_kyc SET ${updates.join(', ')} WHERE kyc_id = $1 RETURNING *
    `, params)

    // Update account kyc_status
    if (old.rows[0].account_id) {
      await sql.query(`UPDATE prop_accounts SET kyc_status = $1 WHERE account_id = $2`, [status, old.rows[0].account_id])
    }

    // Audit log
    await sql.query(`
      INSERT INTO prop_audit_log (entity_type, entity_id, action, old_value, new_value, performed_by, reason)
      VALUES ('kyc', $1, $2, $3, $4, $5, $6)
    `, [kyc_id, `kyc_${status}`, JSON.stringify(old.rows[0]), JSON.stringify(result.rows[0]), reviewer, rejection_reason || `KYC ${status}`])

    return NextResponse.json({ success: true, record: result.rows[0] })
  } catch (error: any) {
    console.error('[API/prop-sharing/kyc] PUT error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
