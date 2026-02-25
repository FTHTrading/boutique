import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { sql } from '@vercel/postgres';
import { sendEmail, renderTemplate } from '@/lib/email';
import { contactValidationAgent } from '@/agents/contact-validation-agent';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * POST /api/outreach/send
 * Send an outreach email to a contact.
 *
 * POST /api/outreach/draft
 * AI-draft an email without sending. Returns draft for review.
 *
 * GET /api/outreach
 * List outreach history with status.
 */

export async function GET(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const contactId = searchParams.get('contact_id');
  const companyId = searchParams.get('company_id');
  const status = searchParams.get('status');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);

  try {
    let query = `
      SELECT 
        ol.*,
        ct.first_name, ct.last_name, ct.title,
        c.name AS company_name
      FROM outreach_log ol
      LEFT JOIN contacts ct ON ol.contact_id = ct.contact_id
      LEFT JOIN companies c ON ct.company_id = c.company_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (contactId) { params.push(contactId); query += ` AND ol.contact_id = $${params.length}`; }
    if (companyId) { params.push(companyId); query += ` AND ct.company_id = $${params.length}`; }
    if (status) { params.push(status); query += ` AND ol.status = $${params.length}`; }

    query += ` ORDER BY ol.created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await sql.query(query, params);

    // Stats
    const stats = await sql`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'sent') AS sent,
        COUNT(*) FILTER (WHERE status = 'delivered') AS delivered,
        COUNT(*) FILTER (WHERE status IN ('opened', 'clicked')) AS opened,
        COUNT(*) FILTER (WHERE status = 'bounced') AS bounced,
        COUNT(*) FILTER (WHERE status = 'failed') AS failed
      FROM outreach_log
    `;

    return NextResponse.json({
      success: true,
      outreach: result.rows,
      stats: stats.rows[0],
      count: result.rows.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { action, contact_id, template_name, subject, body_text, outreach_type, campaign_id, draft_context } = body;

    // ─── Draft mode (AI-generated, no send) ───────────────────
    if (action === 'draft') {
      if (!contact_id) {
        return NextResponse.json({ success: false, error: 'contact_id required for drafting' }, { status: 400 });
      }

      // Load contact + company context
      const contactResult = await sql`
        SELECT ct.*, c.name AS company_name, c.industry, c.commodities, c.opportunity_score
        FROM contacts ct
        LEFT JOIN companies c ON ct.company_id = c.company_id
        WHERE ct.contact_id = ${contact_id}
      `;

      if (contactResult.rows.length === 0) {
        return NextResponse.json({ success: false, error: 'Contact not found' }, { status: 404 });
      }

      const contact = contactResult.rows[0];

      // Check consent
      const canContact = await contactValidationAgent.canContact(contact_id);
      if (!canContact.allowed) {
        return NextResponse.json({
          success: false,
          error: `Cannot draft for this contact: ${canContact.reason}`,
        }, { status: 400 });
      }

      // AI-generate personalized email
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a senior relationship executive at FTH Trading, a global commodity advisory firm founded in 1976. 
You write concise, professional B2B outreach emails. 
Never be pushy. Lead with value. Respect the prospect's time.
Keep emails under 200 words.
Do NOT promise guaranteed returns, specific pricing, or regulatory certainty.
Always be truthful about what FTH Trading offers.`,
          },
          {
            role: 'user',
            content: `Draft a personalized ${outreach_type || 'initial outreach'} email for:

Name: ${contact.first_name} ${contact.last_name || ''}
Title: ${contact.title || 'Unknown'}
Company: ${contact.company_name}
Industry: ${contact.industry || 'Unknown'}
Their commodities: ${(contact.commodities || []).join(', ') || 'Unknown'}
Context: ${draft_context || 'Initial outreach for commodity supply partnership'}

Include:
- Personalized opening that shows you know their business
- Specific FTH Trading value proposition relevant to them
- Single clear call to action (brief call or reply)

Do NOT include: The CAN-SPAM footer (added automatically), your contact details in the signature`,
          },
        ],
        temperature: 0.7,
      });

      const draftBody = completion.choices[0].message.content || '';
      const draftSubject = `FTH Trading — ${contact.company_name} Partnership Opportunity`;

      return NextResponse.json({
        success: true,
        action: 'draft',
        draft: {
          to: contact.email,
          to_name: `${contact.first_name} ${contact.last_name || ''}`.trim(),
          subject: draftSubject,
          body_text: draftBody,
          contact_id,
          company_name: contact.company_name,
        },
      });
    }

    // ─── Send mode ──────────────────────────────────────────────
    if (action === 'send') {
      if (!contact_id) {
        return NextResponse.json({ success: false, error: 'contact_id required for send' }, { status: 400 });
      }

      const contactResult = await sql`SELECT * FROM contacts WHERE contact_id = ${contact_id}`;
      if (contactResult.rows.length === 0) {
        return NextResponse.json({ success: false, error: 'Contact not found' }, { status: 404 });
      }

      const contact = contactResult.rows[0];
      if (!contact.email) {
        return NextResponse.json({ success: false, error: 'Contact has no email address' }, { status: 400 });
      }

      // Use template if provided
      let finalSubject = subject || 'FTH Trading — Commodity Supply Partnership';
      let finalBody = body_text || '';

      if (template_name) {
        const rendered = await renderTemplate(template_name, {
          contact_first_name: contact.first_name,
          sender_name: 'Bradley',
        });
        if (rendered) {
          finalSubject = rendered.subject;
          finalBody = rendered.body_text;
        }
      }

      if (!finalBody) {
        return NextResponse.json({ success: false, error: 'Email body required' }, { status: 400 });
      }

      const result = await sendEmail({
        to: contact.email,
        to_name: `${contact.first_name} ${contact.last_name || ''}`.trim(),
        subject: finalSubject,
        body_text: finalBody,
        contact_id,
        outreach_type: outreach_type || 'initial',
        campaign_id: campaign_id || undefined,
        template_id: template_name || undefined,
      });

      // Update contact outreach count
      await sql`
        UPDATE contacts SET
          contact_count = contact_count + 1,
          last_contacted_at = NOW(),
          updated_at = NOW()
        WHERE contact_id = ${contact_id}
      `;

      return NextResponse.json({ success: result.success, result, error: result.error });
    }

    return NextResponse.json({ success: false, error: 'action must be "draft" or "send"' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
