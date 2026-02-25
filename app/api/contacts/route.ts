import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { sql } from '@vercel/postgres';
import { contactValidationAgent } from '@/agents/contact-validation-agent';

/**
 * GET /api/contacts
 * List contacts with outreach statistics.
 *
 * POST /api/contacts
 * Add a contact (manually or from research).
 *
 * PATCH /api/contacts
 * Update contact details or consent status.
 */

export async function GET(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get('company_id');
  const consent = searchParams.get('consent');
  const search = searchParams.get('search');
  const canContact = searchParams.get('can_contact');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);

  try {
    let query = `
      SELECT 
        ct.*,
        c.name AS company_name, c.domain AS company_domain, c.crm_status,
        COUNT(ol.outreach_id) AS emails_sent,
        COUNT(ol.outreach_id) FILTER (WHERE ol.status IN ('opened', 'clicked')) AS emails_opened,
        MAX(ol.sent_at) AS last_contacted_at
      FROM contacts ct
      LEFT JOIN companies c ON ct.company_id = c.company_id
      LEFT JOIN outreach_log ol ON ct.contact_id = ol.contact_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (companyId) { params.push(companyId); query += ` AND ct.company_id = $${params.length}`; }
    if (consent) { params.push(consent); query += ` AND ct.consent_status = $${params.length}`; }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (ct.first_name ILIKE $${params.length} OR ct.last_name ILIKE $${params.length} OR ct.email ILIKE $${params.length} OR ct.title ILIKE $${params.length})`;
    }
    if (canContact === 'true') {
      query += ` AND ct.consent_status NOT IN ('opted_out', 'unsubscribed') AND ct.bounced = false AND ct.email_valid != false`;
    }

    query += ` GROUP BY ct.contact_id, c.name, c.domain, c.crm_status
      ORDER BY ct.is_decision_maker DESC, ct.created_at DESC
      LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await sql.query(query, params);

    return NextResponse.json({ success: true, contacts: result.rows, count: result.rows.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { company_id, first_name, last_name, title, email, email_source, phone, linkedin_url, is_decision_maker, gdpr_basis, notes } = body;

    if (!first_name) {
      return NextResponse.json({ success: false, error: 'first_name is required' }, { status: 400 });
    }

    // Validate email if provided
    let emailValid = null;
    let emailType = null;
    if (email) {
      const validation = await contactValidationAgent.validateEmail(email);
      emailValid = validation.valid_format && validation.domain_valid;
      emailType = validation.is_generic ? 'generic' : 'direct';
    }

    const result = await sql`
      INSERT INTO contacts (
        company_id, first_name, last_name, title, email,
        email_source, email_type, email_valid, phone, linkedin_url,
        is_decision_maker, gdpr_basis, consent_status, notes
      ) VALUES (
        ${company_id || null}, ${first_name}, ${last_name || null}, ${title || null}, ${email || null},
        ${email_source || 'manual'}, ${emailType}, ${emailValid}, ${phone || null}, ${linkedin_url || null},
        ${is_decision_maker || false}, ${gdpr_basis || 'legitimate_interest'}, 'unknown', ${notes || null}
      )
      RETURNING *
    `;

    return NextResponse.json({ success: true, contact: result.rows[0] });
  } catch (error: any) {
    if (error.message?.includes('unique')) {
      return NextResponse.json({ success: false, error: 'Contact with this email already exists' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { contact_id, consent_status, consent_source, title, is_decision_maker, notes } = body;

    if (!contact_id) {
      return NextResponse.json({ success: false, error: 'contact_id required' }, { status: 400 });
    }

    // Handle consent update via dedicated method
    if (consent_status) {
      await contactValidationAgent.updateConsent({
        contact_id,
        consent_status,
        gdpr_basis: 'legitimate_interest',
        consent_source: consent_source || 'manual_update',
      });
    }

    const result = await sql`
      UPDATE contacts SET
        title = COALESCE(${title}, title),
        is_decision_maker = COALESCE(${is_decision_maker}, is_decision_maker),
        notes = COALESCE(${notes}, notes),
        updated_at = NOW()
      WHERE contact_id = ${contact_id}
      RETURNING *
    `;

    return NextResponse.json({ success: true, contact: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
