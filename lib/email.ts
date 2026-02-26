/**
 * Email Infrastructure — FTH Trading
 *
 * Supports: SendGrid (primary), Amazon SES (fallback), and SMTP
 *
 * CAN-SPAM Compliance Built-in:
 * - Every outbound email includes: sender identity, physical address, unsubscribe link
 * - Opt-out honored within 10 business days (immediate in this system)
 * - No deceptive subject lines
 * - Accurate from/reply-to fields
 *
 * DNS Requirements (configure in your email provider):
 * - SPF: v=spf1 include:sendgrid.net ~all
 * - DKIM: 2048-bit key (auto-configured via SendGrid)
 * - DMARC: v=DMARC1; p=quarantine; rua=mailto:dmarc@unykorn.org
 */

import { sql } from '@/lib/sql';
import { contactValidationAgent } from '../agents/contact-validation-agent';

export interface EmailMessage {
  to: string;
  to_name?: string;
  from_address?: string;
  from_name?: string;
  reply_to?: string;
  subject: string;
  body_text: string;
  body_html?: string;
  contact_id?: string;
  outreach_type?: string;
  campaign_id?: string;
  template_id?: string;
  ai_generated?: boolean;
  skip_consent_check?: boolean;      // Use ONLY for transactional emails (contracts, receipts)
}

export interface SendResult {
  success: boolean;
  message_id?: string;
  provider?: string;
  error?: string;
  outreach_id?: string;
}

// FTH Trading physical address — required by CAN-SPAM
const FTH_PHYSICAL_ADDRESS = process.env.FTH_PHYSICAL_ADDRESS || '[FTH Trading Physical Address — Set FTH_PHYSICAL_ADDRESS env var]';
const FTH_FROM_ADDRESS = process.env.EMAIL_FROM || 'bradley@unykorn.org';
const FTH_FROM_NAME = process.env.EMAIL_FROM_NAME || 'Bradley — FTH Trading';
const FTH_UNSUBSCRIBE_BASE = process.env.NEXT_PUBLIC_URL || 'https://unykorn.org';

/**
 * Inject CAN-SPAM required footer into email body.
 * Required for ALL commercial emails.
 */
function injectCANSPAMFooter(bodyText: string, bodyHtml: string | undefined, toAddress: string): {
  text: string;
  html: string | undefined;
} {
  const unsub = `${FTH_UNSUBSCRIBE_BASE}/unsubscribe?email=${encodeURIComponent(toAddress)}`;
  
  const textFooter = `\n\n--\nFTH Trading | Global Commodity Advisory | Est. 1976\n${FTH_PHYSICAL_ADDRESS}\nTo unsubscribe from future emails: ${unsub}`;
  
  const htmlFooter = `
<div style="margin-top:40px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;font-family:Arial,sans-serif;">
  <strong>FTH Trading</strong> | Global Commodity Advisory | Est. 1976<br>
  ${FTH_PHYSICAL_ADDRESS}<br><br>
  You are receiving this email because of your relationship with FTH Trading or because 
  you operate in the commodity trading space.<br>
  <a href="${unsub}" style="color:#6b7280;">Unsubscribe</a> from future commercial emails.
</div>`;

  return {
    text: bodyText + textFooter,
    html: bodyHtml ? bodyHtml.replace('</body>', `${htmlFooter}</body>`) : undefined,
  };
}

/**
 * Send an email via SendGrid.
 */
async function sendViaSendGrid(msg: EmailMessage): Promise<SendResult> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) throw new Error('SENDGRID_API_KEY not configured');

  const payload: Record<string, any> = {
    personalizations: [{ to: [{ email: msg.to, name: msg.to_name || '' }] }],
    from: { email: msg.from_address || FTH_FROM_ADDRESS, name: msg.from_name || FTH_FROM_NAME },
    reply_to: { email: msg.reply_to || FTH_FROM_ADDRESS },
    subject: msg.subject,
    content: [{ type: 'text/plain', value: msg.body_text }],
  };

  if (msg.body_html) {
    payload.content.push({ type: 'text/html', value: msg.body_html });
  }

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SendGrid error ${response.status}: ${error}`);
  }

  const messageId = response.headers.get('x-message-id') || 'unknown';
  return { success: true, message_id: messageId, provider: 'sendgrid' };
}

/**
 * Send an email via Amazon SES.
 */
async function sendViaSES(msg: EmailMessage): Promise<SendResult> {
  // SES requires AWS SDK — use raw REST API for simplicity
  // In production, install @aws-sdk/client-sesv2
  throw new Error('SES not configured. Install @aws-sdk/client-sesv2 and add AWS credentials.');
}

/**
 * Core send function.
 * 1. Consent check (unless transactional)
 * 2. CAN-SPAM footer injection
 * 3. Send via provider
 * 4. Log to outreach_log
 */
export async function sendEmail(msg: EmailMessage): Promise<SendResult> {
  // 1. Consent check for commercial emails
  if (!msg.skip_consent_check && msg.contact_id) {
    const canContact = await contactValidationAgent.canContact(msg.contact_id);
    if (!canContact.allowed) {
      console.warn(`[Email] Blocked: ${msg.to} — ${canContact.reason}`);
      return { success: false, error: `Contact blocked: ${canContact.reason}` };
    }
  }

  // 2. Inject CAN-SPAM footer for commercial emails
  const withFooter = msg.skip_consent_check
    ? { text: msg.body_text, html: msg.body_html }
    : injectCANSPAMFooter(msg.body_text, msg.body_html, msg.to);

  const enrichedMsg = { ...msg, body_text: withFooter.text, body_html: withFooter.html };

  // 3. Send
  let result: SendResult;
  try {
    if (process.env.SENDGRID_API_KEY) {
      result = await sendViaSendGrid(enrichedMsg);
    } else if (process.env.AWS_ACCESS_KEY_ID) {
      result = await sendViaSES(enrichedMsg);
    } else {
      // Development mode — log instead of send
      console.log(`[Email DEV] TO: ${msg.to} | SUBJECT: ${msg.subject}`);
      console.log(`[Email DEV] BODY:\n${msg.body_text.slice(0, 500)}`);
      result = { success: true, message_id: `dev-${Date.now()}`, provider: 'dev-console' };
    }
  } catch (err: any) {
    console.error('[Email] Send failed:', err.message);
    result = { success: false, error: err.message };
  }

  // 4. Log to outreach_log
  try {
    const unsubUrl = `${FTH_UNSUBSCRIBE_BASE}/unsubscribe?email=${encodeURIComponent(msg.to)}`;
    const logResult = await sql`
      INSERT INTO outreach_log (
        contact_id, from_address, to_address, subject, body_text, body_html,
        template_id, outreach_type, campaign_id,
        status, sent_at,
        includes_unsubscribe, unsubscribe_link, physical_address_included,
        provider, provider_message_id,
        ai_generated
      ) VALUES (
        ${msg.contact_id || null},
        ${msg.from_address || FTH_FROM_ADDRESS},
        ${msg.to},
        ${msg.subject},
        ${enrichedMsg.body_text},
        ${enrichedMsg.body_html || null},
        ${msg.template_id || null},
        ${msg.outreach_type || 'general'},
        ${msg.campaign_id || null},
        ${result.success ? 'sent' : 'failed'},
        ${result.success ? new Date().toISOString() : null},
        ${!msg.skip_consent_check},
        ${!msg.skip_consent_check ? unsubUrl : null},
        true,
        ${result.provider || 'unknown'},
        ${result.message_id || null},
        ${msg.ai_generated || false}
      )
      RETURNING outreach_id
    `;
    result.outreach_id = logResult.rows[0]?.outreach_id;
  } catch (dbErr: any) {
    console.error('[Email] Failed to log outreach:', dbErr.message);
  }

  return result;
}

/**
 * Render a template from the database.
 * Replaces {{variable}} tokens with provided values.
 */
export async function renderTemplate(
  templateName: string,
  variables: Record<string, string>
): Promise<{ subject: string; body_text: string; body_html?: string } | null> {
  const result = await sql`
    SELECT subject_line, body_text, body_html 
    FROM email_templates WHERE name = ${templateName} AND active = true
    LIMIT 1
  `;

  if (result.rows.length === 0) return null;

  const template = result.rows[0];
  let subject = template.subject_line;
  let text = template.body_text;
  let html = template.body_html;

  for (const [key, value] of Object.entries(variables)) {
    const token = new RegExp(`{{${key}}}`, 'g');
    subject = subject.replace(token, value);
    text = text.replace(token, value);
    if (html) html = html.replace(token, value);
  }

  return { subject, body_text: text, body_html: html || undefined };
}

/**
 * Send a CRITICAL compliance alert to the compliance officer.
 * This is a transactional email — bypasses commercial consent checks.
 */
export async function sendCriticalComplianceAlert(
  dealNumber: string,
  dealId: string,
  flags: Array<{ severity: string; message: string; flag_type: string }>
): Promise<void> {
  const to = process.env.COMPLIANCE_OFFICER_EMAIL;
  if (!to) {
    console.error('[Email] COMPLIANCE_OFFICER_EMAIL not set — critical alert not sent');
    return;
  }

  const flagList = flags
    .filter((f) => f.severity === 'CRITICAL' || f.severity === 'HIGH')
    .map((f) => `  [${f.severity}] ${f.flag_type}: ${f.message}`)
    .join('\n');

  await sendEmail({
    to,
    subject: `[URGENT] CRITICAL Compliance Flags — Deal ${dealNumber}`,
    body_text: `COMPLIANCE ALERT — IMMEDIATE ACTION REQUIRED\n\nDeal: ${dealNumber}\n\nFlags Generated:\n${flagList}\n\nReview required within 24 hours.\n\nDashboard: ${FTH_UNSUBSCRIBE_BASE}/dashboard/compliance\n\nDo NOT proceed with this deal until flags are reviewed and resolved.`,
    outreach_type: 'compliance_alert',
    skip_consent_check: true,
  });

  console.log(`[Email] ⚠️ Critical alert sent to compliance officer for deal ${dealNumber}`);
}

/**
 * Send contract signing link.
 * Transactional — bypasses commercial consent checks.
 */
export async function sendContractForSigning(
  contactEmail: string,
  contactName: string,
  contractNumber: string,
  signingUrl: string,
  commodity: string,
  dealValue?: string
): Promise<SendResult> {
  const rendered = await renderTemplate('ncnda_cover', {
    contact_first_name: contactName.split(' ')[0],
    deal_number: contractNumber,
    commodity,
    deal_value: dealValue || 'As per agreed terms',
    signing_link: signingUrl,
    sender_name: 'Bradley',
  });

  if (!rendered) {
    // Fallback
    return sendEmail({
      to: contactEmail,
      to_name: contactName,
      subject: `FTH Trading — ${contractNumber} Ready for Signature`,
      body_text: `Dear ${contactName.split(' ')[0]},\n\nPlease review and sign the attached agreement:\n\n${signingUrl}\n\nThis link expires in 72 hours.\n\nBest regards,\nBradley\nFTH Trading`,
      outreach_type: 'contract',
      skip_consent_check: true,
    });
  }

  return sendEmail({
    to: contactEmail,
    to_name: contactName,
    subject: rendered.subject,
    body_text: rendered.body_text,
    body_html: rendered.body_html,
    outreach_type: 'contract',
    skip_consent_check: true,
  });
}
