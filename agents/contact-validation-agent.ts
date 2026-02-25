/**
 * ContactValidationAgent
 *
 * Validates contact information and manages consent status.
 *
 * This agent does NOT:
 * - Guess or construct email addresses
 * - Brute-force email patterns (first.last@domain.com)
 * - Bypass email security
 * - Access LinkedIn or social platforms programmatically
 *
 * This agent DOES:
 * - Validate email format (RFC 5322)
 * - Detect generic vs. direct emails
 * - Track consent status (opt-in, opt-out, unsubscribed)
 * - Log every outreach permission decision
 * - Flag emails from high-risk domains
 * - Monitor bounce/complaint rates
 */

import { sql } from '@/lib/sql';

export interface ContactValidationResult {
  email: string;
  valid_format: boolean;
  is_generic: boolean;           // info@, contact@, sales@, hello@
  is_disposable: boolean;        // Temp email domains
  domain_valid: boolean;
  consent_status: 'opted_in' | 'opted_out' | 'unknown' | 'unsubscribed';
  can_contact: boolean;          // Final determination
  reason?: string;
}

export interface ConsentRecord {
  contact_id: string;
  consent_status: string;
  gdpr_basis: string;
  consent_source: string;
  notes?: string;
}

// Known disposable email domains (partial list)
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', 'tempmail.com', '10minutemail.com',
  'throwaway.email', 'yopmail.com', 'sharklasers.com', 'getairmail.com',
]);

// Generic email prefixes
const GENERIC_PREFIXES = new Set([
  'info', 'contact', 'hello', 'hi', 'sales', 'support', 'admin', 'office',
  'team', 'business', 'general', 'enquiries', 'enquiry', 'mail', 'email',
  'help', 'service', 'marketing', 'pr', 'press', 'media',
]);

class ContactValidationAgent {
  private readonly name = 'ContactValidationAgent';

  /**
   * Validate an email address.
   * Checks format, type, disposable domain, and consent status.
   */
  async validateEmail(email: string, contactId?: string): Promise<ContactValidationResult> {
    const lowered = email.toLowerCase().trim();

    // 1. Format check (RFC 5322 simplified)
    const formatRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    const validFormat = formatRegex.test(lowered);

    if (!validFormat) {
      return {
        email,
        valid_format: false,
        is_generic: false,
        is_disposable: false,
        domain_valid: false,
        consent_status: 'unknown',
        can_contact: false,
        reason: 'Invalid email format',
      };
    }

    const [prefix, domain] = lowered.split('@');

    // 2. Disposable domain check
    const isDisposable = DISPOSABLE_DOMAINS.has(domain);

    // 3. Generic prefix check
    const isGeneric = GENERIC_PREFIXES.has(prefix.split('.')[0].split('+')[0]);

    // 4. Basic domain validation (has at least one dot after @)
    const domainValid = domain.split('.').length >= 2 && domain.split('.').pop()!.length >= 2;

    // 5. Consent status from DB
    let consentStatus: 'opted_in' | 'opted_out' | 'unknown' | 'unsubscribed' = 'unknown';
    if (contactId) {
      const result = await sql`
        SELECT consent_status, bounced FROM contacts 
        WHERE contact_id = ${contactId}
      `;
      if (result.rows.length > 0) {
        consentStatus = result.rows[0].consent_status;
        // If bounced, flag it
        if (result.rows[0].bounced) {
          return {
            email,
            valid_format: true,
            is_generic: isGeneric,
            is_disposable: isDisposable,
            domain_valid: domainValid,
            consent_status: consentStatus,
            can_contact: false,
            reason: 'Email previously bounced',
          };
        }
      }
    }

    // 6. Check unsubscribe list
    const unsubbed = await sql`
      SELECT 1 FROM contacts 
      WHERE email = ${lowered} AND consent_status = 'unsubscribed'
      LIMIT 1
    `;
    if (unsubbed.rows.length > 0) {
      return {
        email,
        valid_format: true,
        is_generic: isGeneric,
        is_disposable: isDisposable,
        domain_valid: domainValid,
        consent_status: 'unsubscribed',
        can_contact: false,
        reason: 'Contact has unsubscribed',
      };
    }

    // 7. Final determination
    const canContact = validFormat && domainValid && !isDisposable && consentStatus !== 'opted_out';

    // 8. Update validation record
    if (contactId) {
      await sql`
        UPDATE contacts SET
          email_valid = ${validFormat && domainValid},
          email_validated_at = NOW(),
          updated_at = NOW()
        WHERE contact_id = ${contactId}
      `;
    }

    return {
      email,
      valid_format: true,
      is_generic: isGeneric,
      is_disposable: isDisposable,
      domain_valid: domainValid,
      consent_status: consentStatus,
      can_contact: canContact,
      reason: canContact ? undefined : `Domain invalid or consent status: ${consentStatus}`,
    };
  }

  /**
   * Update consent status for a contact.
   * Called when: contact opts in (inbound form), opts out (reply), or unsubscribes (link click).
   */
  async updateConsent(record: ConsentRecord): Promise<void> {
    await sql`
      UPDATE contacts SET
        consent_status = ${record.consent_status},
        gdpr_basis = ${record.gdpr_basis},
        consent_date = NOW(),
        consent_source = ${record.consent_source},
        unsubscribed_at = CASE WHEN ${record.consent_status} = 'unsubscribed' THEN NOW() ELSE unsubscribed_at END,
        updated_at = NOW()
      WHERE contact_id = ${record.contact_id}
    `;

    console.log(
      `[${this.name}] Consent updated: ${record.contact_id} → ${record.consent_status} (${record.consent_source})`
    );
  }

  /**
   * Process an unsubscribe request.
   * Called when contact clicks unsubscribe link.
   * Immediately updates consent_status = 'unsubscribed'.
   */
  async processUnsubscribe(email: string, source: string = 'email_link'): Promise<void> {
    await sql`
      UPDATE contacts SET
        consent_status = 'unsubscribed',
        unsubscribed_at = NOW(),
        updated_at = NOW()
      WHERE LOWER(email) = ${email.toLowerCase()}
    `;

    console.log(`[${this.name}] ✅ Unsubscribed: ${email} (via ${source})`);
  }

  /**
   * Process a bounce notification from email provider.
   * Marks contact as bounced so we don't retry.
   */
  async processBounce(email: string, reason?: string): Promise<void> {
    await sql`
      UPDATE contacts SET
        bounced = true,
        bounced_at = NOW(),
        notes = CONCAT(COALESCE(notes, ''), '\n[BOUNCE ${new Date().toISOString()}] ', ${reason || 'Delivery failed'}),
        updated_at = NOW()
      WHERE LOWER(email) = ${email.toLowerCase()}
    `;

    console.log(`[${this.name}] ⚠️ Bounce recorded: ${email}`);
  }

  /**
   * Check if a contact is eligible for outreach.
   * Quick check before sending — no validation overhead.
   */
  async canContact(contactId: string): Promise<{ allowed: boolean; reason?: string }> {
    const result = await sql`
      SELECT consent_status, bounced, email_valid 
      FROM contacts WHERE contact_id = ${contactId}
    `;

    if (result.rows.length === 0) return { allowed: false, reason: 'Contact not found' };

    const contact = result.rows[0];

    if (contact.consent_status === 'opted_out') return { allowed: false, reason: 'Contact opted out' };
    if (contact.consent_status === 'unsubscribed') return { allowed: false, reason: 'Contact unsubscribed' };
    if (contact.bounced) return { allowed: false, reason: 'Email previously bounced' };
    if (contact.email_valid === false) return { allowed: false, reason: 'Email marked invalid' };

    return { allowed: true };
  }

  /**
   * Get outreach statistics for a contact.
   */
  async getContactStats(contactId: string): Promise<{
    total_sent: number;
    delivered: number;
    opened: number;
    responded: number;
    last_contacted_at?: Date;
  }> {
    const result = await sql`
      SELECT
        COUNT(*) FILTER (WHERE status NOT IN ('pending')) AS total_sent,
        COUNT(*) FILTER (WHERE status = 'delivered' OR status = 'opened' OR status = 'clicked') AS delivered,
        COUNT(*) FILTER (WHERE status = 'opened' OR status = 'clicked') AS opened,
        MAX(sent_at) AS last_contacted_at
      FROM outreach_log WHERE contact_id = ${contactId}
    `;

    const contact = await sql`
      SELECT response_count FROM contacts WHERE contact_id = ${contactId}
    `;

    const stats = result.rows[0];
    return {
      total_sent: parseInt(stats.total_sent || '0'),
      delivered: parseInt(stats.delivered || '0'),
      opened: parseInt(stats.opened || '0'),
      responded: contact.rows[0]?.response_count || 0,
      last_contacted_at: stats.last_contacted_at,
    };
  }
}

export { ContactValidationAgent };
export const contactValidationAgent = new ContactValidationAgent();
export default ContactValidationAgent;
