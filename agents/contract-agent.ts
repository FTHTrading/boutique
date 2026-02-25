/**
 * ContractAgent
 *
 * Manages the full contract lifecycle:
 * - NCNDA generation from template
 * - Supply agreement drafting
 * - Version tracking (append-only)
 * - eSignature token generation + verification
 * - Audit trail logging
 * - Document hashing for tamper-evidence
 *
 * Supported contract types:
 * - NCNDA (Non-Circumvention Non-Disclosure Agreement)
 * - Supply Agreement
 * - MOU (Memorandum of Understanding)
 * - LOI (Letter of Intent)
 * - Purchase Order
 */

import OpenAI from 'openai';
import { createHash, randomBytes } from 'crypto';
import { sql } from '@vercel/postgres';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export type ContractType = 'NCNDA' | 'supply_agreement' | 'MOU' | 'LOI' | 'purchase_order';

export interface ContractParams {
  contract_type: ContractType;
  deal_id?: string;
  company_id?: string;
  party_b_name: string;
  party_b_signatory: string;
  party_b_email: string;
  commodity: string;
  deal_value_usd?: number;
  quantity?: string;
  effective_date?: string;
  expiry_date?: string;
  governing_law?: string;
  special_terms?: string;
  created_by: string;
}

export interface GeneratedContract {
  contract_id: string;
  contract_number: string;
  document_html: string;
  document_hash: string;
  esign_token: string;
  esign_expires_at: Date;
  signing_url: string;
}

// ─────────────────────────────────────────────────────────────
// NCNDA Template
// ─────────────────────────────────────────────────────────────

const NCNDA_TEMPLATE = (params: {
  contract_number: string;
  party_b_name: string;
  party_b_signatory: string;
  commodity: string;
  effective_date: string;
  expiry_date: string;
  governing_law: string;
  deal_description: string;
  special_terms?: string;
}) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Georgia, serif; max-width: 800px; margin: 0 auto; padding: 40px; line-height: 1.6; color: #1a1a1a; }
    h1 { text-align: center; font-size: 18px; text-transform: uppercase; letter-spacing: 2px; border-bottom: 2px solid #1a1a1a; padding-bottom: 12px; }
    h2 { font-size: 14px; text-transform: uppercase; margin-top: 28px; }
    .header { text-align: center; margin-bottom: 32px; }
    .ref { text-align: center; font-size: 12px; color: #666; margin-top: -10px; margin-bottom: 20px; }
    .parties { background: #f8f8f8; padding: 20px; border-radius: 4px; margin: 24px 0; }
    .signature-block { display: flex; justify-content: space-between; margin-top: 60px; }
    .sig-col { width: 45%; }
    .sig-line { border-top: 1px solid #1a1a1a; margin-top: 50px; padding-top: 8px; font-size: 12px; }
    .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 80px; opacity: 0.04; white-space: nowrap; pointer-events: none; }
    ol li { margin-bottom: 12px; }
    .clause { margin-bottom: 20px; }
    .date-line { margin-top: 40px; font-size: 13px; color: #555; }
    .disclaimer { font-size: 11px; color: #888; margin-top: 40px; border-top: 1px solid #ddd; padding-top: 16px; }
  </style>
</head>
<body>

<div class="watermark">DRAFT</div>

<div class="header">
  <div style="font-size:13px;color:#555;margin-bottom:8px;">FTH TRADING</div>
  <h1>Non-Circumvention Non-Disclosure Agreement</h1>
  <div class="ref">Ref: ${params.contract_number} | Effective: ${params.effective_date}</div>
</div>

<div class="parties">
  <strong>PARTY A (INTRODUCING PARTY):</strong><br>
  FTH Trading<br>
  Registered commodity advisory and distribution firm<br>
  Est. 1976<br><br>

  <strong>PARTY B (RECEIVING PARTY):</strong><br>
  ${params.party_b_name}<br>
  Represented by: ${params.party_b_signatory}
</div>

<p>This Non-Circumvention, Non-Disclosure Agreement ("Agreement") is entered into as of 
<strong>${params.effective_date}</strong> between FTH Trading ("Party A") and 
<strong>${params.party_b_name}</strong> ("Party B"), collectively referred to as the "Parties".</p>

<h2>1. Purpose</h2>
<div class="clause">
<p>This Agreement is entered into for the purpose of exploring a potential business relationship 
relating to <strong>${params.deal_description}</strong> (the "Transaction"). 
The Parties wish to share certain confidential information with each other for the purpose of 
evaluating and potentially consummating the Transaction.</p>
</div>

<h2>2. Confidential Information</h2>
<div class="clause">
<ol type="a">
  <li>"Confidential Information" means any information disclosed by either Party to the other Party, 
  either directly or indirectly, in writing, orally or by inspection of tangible objects, including 
  but not limited to business plans, supplier identities, buyer identities, pricing structures, 
  transaction structures, due diligence materials, and all documents relating to the Transaction.</li>
  
  <li>Each Party agrees to: (i) hold the other Party's Confidential Information in strict confidence; 
  (ii) not to disclose such information to third parties without prior written consent; 
  (iii) use the Confidential Information solely for the purpose of evaluating the Transaction.</li>
  
  <li>The obligations of confidentiality shall survive termination of this Agreement for a period 
  of <strong>five (5) years</strong>.</li>
</ol>
</div>

<h2>3. Non-Circumvention</h2>
<div class="clause">
<ol type="a">
  <li>Party B agrees not to circumvent Party A and to not directly or indirectly contact, 
  deal with or otherwise engage any supplier, buyer, agent, broker, or other business contact 
  introduced by Party A without Party A's express written consent.</li>
  
  <li>This non-circumvention obligation shall remain in force for a period of 
  <strong>two (2) years</strong> from the date of disclosure of any contact or business source.</li>
  
  <li>For the purposes of this clause, "circumvention" includes any attempt to bypass Party A 
  in any transaction involving contacts introduced by Party A, whether directly, indirectly, 
  through associates, subsidiaries, or affiliated entities.</li>
</ol>
</div>

<h2>4. Transaction Exclusivity</h2>
<div class="clause">
<p>With respect to the specific Transaction described herein, both Parties agree to act 
exclusively through each other for a period of <strong>ninety (90) days</strong> from the 
signing of this Agreement, unless otherwise agreed in writing.</p>
</div>

<h2>5. Exceptions</h2>
<div class="clause">
<p>The confidentiality and non-circumvention obligations shall not apply to information that:</p>
<ol type="a">
  <li>Is or becomes publicly known through no fault of the Receiving Party;</li>
  <li>Was rightfully known by the Receiving Party before disclosure;</li>
  <li>Is disclosed by operation of law or by order of a court of competent jurisdiction;</li>
  <li>Is independently developed by the Receiving Party without use of the Confidential Information.</li>
</ol>
</div>

<h2>6. Term</h2>
<div class="clause">
<p>This Agreement shall be effective as of <strong>${params.effective_date}</strong> and shall 
remain in full force and effect until <strong>${params.expiry_date}</strong>, unless earlier 
terminated by mutual written agreement of the Parties. The confidentiality and non-circumvention 
provisions shall survive termination as specified in Sections 2(c) and 3(b).</p>
</div>

<h2>7. Remedies</h2>
<div class="clause">
<p>Each Party acknowledges that breach of this Agreement would cause irreparable harm for which 
monetary damages would be inadequate. Accordingly, the non-breaching Party shall be entitled 
to seek injunctive relief, in addition to any other remedies available at law or in equity, 
without the requirement to post bond or other security.</p>
</div>

<h2>8. Governing Law</h2>
<div class="clause">
<p>This Agreement shall be governed by and construed in accordance with the laws of 
<strong>${params.governing_law}</strong>, without regard to its conflicts of law principles. 
Any disputes shall be resolved by arbitration under the rules of the International Chamber 
of Commerce (ICC).</p>
</div>

${params.special_terms ? `
<h2>9. Special Terms</h2>
<div class="clause">
<p>${params.special_terms}</p>
</div>` : ''}

<h2>10. Entire Agreement</h2>
<div class="clause">
<p>This Agreement constitutes the entire agreement between the Parties with respect to the 
subject matter hereof and supersedes all prior negotiations, representations, 
warranties, and understandings of the Parties with respect thereto.</p>
</div>

<div class="date-line">
<strong>IN WITNESS WHEREOF</strong>, the Parties have executed this Agreement as of 
${params.effective_date}.
</div>

<div class="signature-block">
  <div class="sig-col">
    <strong>PARTY A — FTH Trading</strong>
    <div class="sig-line">
      Signature: ___________________<br>
      Name: Bradley [Last Name]<br>
      Title: Managing Director<br>
      Date: _______________________
    </div>
  </div>
  <div class="sig-col">
    <strong>PARTY B — ${params.party_b_name}</strong>
    <div class="sig-line">
      Signature: ___________________<br>
      Name: ${params.party_b_signatory}<br>
      Title: ________________________<br>
      Date: _______________________
    </div>
  </div>
</div>

<div class="disclaimer">
  DOCUMENT REFERENCE: ${params.contract_number}<br>
  This document is generated by FTH Trading's internal contract management system.<br>
  For legal questions, consult qualified legal counsel before executing.<br>
  This template is provided for informational purposes and does not constitute legal advice.
</div>

</body>
</html>
`;

// ─────────────────────────────────────────────────────────────
// Supply Agreement Template (simplified)
// ─────────────────────────────────────────────────────────────

class ContractAgent {
  private readonly name = 'ContractAgent';

  /**
   * Generate and persist a contract.
   */
  async generateContract(params: ContractParams): Promise<GeneratedContract> {
    console.log(`[${this.name}] Generating ${params.contract_type} for ${params.party_b_name}`);

    // 1. Generate contract number
    const contractNumber = await this.generateContractNumber(params.contract_type);

    // 2. Set dates
    const effectiveDate = params.effective_date || new Date().toISOString().split('T')[0];
    const expiryDate = params.expiry_date || this.addMonths(new Date(), 12).toISOString().split('T')[0];
    const governingLaw = params.governing_law || 'the State of New York, United States';

    // 3. Generate document HTML
    let documentHtml = '';

    if (params.contract_type === 'NCNDA') {
      documentHtml = NCNDA_TEMPLATE({
        contract_number: contractNumber,
        party_b_name: params.party_b_name,
        party_b_signatory: params.party_b_signatory,
        commodity: params.commodity,
        effective_date: effectiveDate,
        expiry_date: expiryDate,
        governing_law: governingLaw,
        deal_description: `${params.commodity} supply transaction${params.deal_value_usd ? ` valued at USD ${params.deal_value_usd.toLocaleString()}` : ''}`,
        special_terms: params.special_terms,
      });
    } else {
      // For other types, use AI to generate
      documentHtml = await this.generateWithAI(params, contractNumber, effectiveDate, expiryDate, governingLaw);
    }

    // 4. Hash the document
    const documentHash = createHash('sha256').update(documentHtml).digest('hex');

    // 5. Generate secure eSign token
    const esignToken = randomBytes(32).toString('hex');
    const esignExpiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours

    // 6. Persist to database
    const result = await sql`
      INSERT INTO contracts (
        contract_number, contract_type, title,
        company_id, deal_id,
        party_a_name, party_b_name, party_b_signatory, party_b_email,
        commodity, deal_value_usd,
        effective_date, expiry_date, governing_law,
        status, template_used,
        document_html, document_hash,
        esign_token, esign_expires_at,
        created_by
      ) VALUES (
        ${contractNumber}, ${params.contract_type},
        ${`${params.contract_type} — ${params.party_b_name} — ${params.commodity}`},
        ${params.company_id || null}, ${params.deal_id || null},
        'FTH Trading', ${params.party_b_name}, ${params.party_b_signatory}, ${params.party_b_email},
        ${params.commodity}, ${params.deal_value_usd || null},
        ${effectiveDate}, ${expiryDate}, ${governingLaw},
        'draft', ${params.contract_type.toLowerCase()},
        ${documentHtml}, ${documentHash},
        ${esignToken}, ${esignExpiresAt.toISOString()},
        ${params.created_by}
      )
      RETURNING contract_id
    `;

    const contractId = result.rows[0].contract_id;

    // 7. Save initial version
    await sql`
      INSERT INTO contract_versions (contract_id, version_number, document_html, document_hash, changed_by, change_notes)
      VALUES (${contractId}, 1, ${documentHtml}, ${documentHash}, ${params.created_by}, 'Initial generation')
    `;

    // 8. Log audit trail
    await sql`
      INSERT INTO contract_audit_log (contract_id, action, actor, metadata)
      VALUES (${contractId}, 'created', ${params.created_by}, ${JSON.stringify({ contract_type: params.contract_type, commodity: params.commodity })})
    `;

    const signingUrl = `${process.env.NEXT_PUBLIC_URL || 'https://fthtrading.com'}/sign/${esignToken}`;

    console.log(`[${this.name}] ✅ Contract generated: ${contractNumber} (${contractId})`);

    return {
      contract_id: contractId,
      contract_number: contractNumber,
      document_html: documentHtml,
      document_hash: documentHash,
      esign_token: esignToken,
      esign_expires_at: esignExpiresAt,
      signing_url: signingUrl,
    };
  }

  /**
   * Process an eSignature submission.
   * Called when Party B submits their signature via the signing URL.
   */
  async processSignature(
    esignToken: string,
    signatoryName: string,
    ipAddress: string,
    userAgent: string
  ): Promise<{ success: boolean; contract_id?: string; message: string }> {
    // 1. Validate token
    const contract = await sql`
      SELECT contract_id, contract_number, status, esign_expires_at, signed_by_b
      FROM contracts WHERE esign_token = ${esignToken}
    `;

    if (contract.rows.length === 0) {
      return { success: false, message: 'Invalid signing link' };
    }

    const c = contract.rows[0];

    if (c.signed_by_b) {
      return { success: false, message: 'Contract already signed' };
    }

    if (new Date() > new Date(c.esign_expires_at)) {
      return { success: false, message: 'Signing link has expired. Please request a new link.' };
    }

    if (c.status === 'executed' || c.status === 'terminated') {
      return { success: false, message: `Contract is ${c.status}` };
    }

    // 2. Record signature
    await sql`
      UPDATE contracts SET
        signed_by_b = ${signatoryName},
        signed_by_b_at = NOW(),
        signature_method = 'internal_esign',
        esign_ip_address = ${ipAddress},
        esign_user_agent = ${userAgent},
        status = CASE 
          WHEN signed_by_a IS NOT NULL THEN 'executed' 
          ELSE 'sent_for_review' 
        END,
        updated_at = NOW()
      WHERE contract_id = ${c.contract_id}
    `;

    // 3. Log audit trail
    await sql`
      INSERT INTO contract_audit_log (contract_id, action, actor, actor_ip, actor_user_agent, metadata)
      VALUES (
        ${c.contract_id}, 'signed', ${signatoryName}, ${ipAddress}::inet, ${userAgent},
        ${JSON.stringify({ method: 'internal_esign', timestamp: new Date().toISOString() })}
      )
    `;

    console.log(`[${this.name}] ✅ Signed: ${c.contract_number} by ${signatoryName}`);

    return {
      success: true,
      contract_id: c.contract_id,
      message: `Contract ${c.contract_number} has been successfully executed`,
    };
  }

  /**
   * Create an amendment to an existing contract.
   * Preserves version history. New version is append-only.
   */
  async amendContract(
    contractId: string,
    amendments: string,
    changedBy: string
  ): Promise<{ new_version: number; document_hash: string }> {
    const contract = await sql`
      SELECT contract_id, contract_number, document_html, version FROM contracts 
      WHERE contract_id = ${contractId}
    `;

    if (contract.rows.length === 0) throw new Error('Contract not found');

    const c = contract.rows[0];
    const newVersion = (c.version || 1) + 1;

    // AI-assisted amendment generation
    const updatedHtml = await this.applyAmendment(c.document_html, amendments, c.contract_number, newVersion);
    const newHash = createHash('sha256').update(updatedHtml).digest('hex');

    // Update contract (main doc)
    await sql`
      UPDATE contracts SET
        document_html = ${updatedHtml},
        document_hash = ${newHash},
        version = ${newVersion},
        status = 'under_negotiation',
        updated_at = NOW()
      WHERE contract_id = ${contractId}
    `;

    // Append to versions (never delete old)
    await sql`
      INSERT INTO contract_versions (contract_id, version_number, document_html, document_hash, changed_by, change_notes)
      VALUES (${contractId}, ${newVersion}, ${updatedHtml}, ${newHash}, ${changedBy}, ${amendments.slice(0, 500)})
    `;

    await sql`
      INSERT INTO contract_audit_log (contract_id, action, actor, metadata)
      VALUES (${contractId}, 'amended', ${changedBy}, ${JSON.stringify({ version: newVersion, notes: amendments.slice(0, 200) })})
    `;

    return { new_version: newVersion, document_hash: newHash };
  }

  /**
   * Get the full audit trail for a contract.
   */
  async getAuditTrail(contractId: string): Promise<any[]> {
    const result = await sql`
      SELECT action, actor, actor_ip, metadata, created_at
      FROM contract_audit_log
      WHERE contract_id = ${contractId}
      ORDER BY created_at ASC
    `;
    return result.rows;
  }

  private async generateContractNumber(type: ContractType): Promise<string> {
    const prefix = {
      NCNDA: 'NCNDA',
      supply_agreement: 'SA',
      MOU: 'MOU',
      LOI: 'LOI',
      purchase_order: 'PO',
    }[type];

    const year = new Date().getFullYear();
    const count = await sql`SELECT COUNT(*) FROM contracts WHERE contract_type = ${type}`;
    const seq = String(parseInt(count.rows[0].count || '0') + 1).padStart(3, '0');

    return `${prefix}-${year}-${seq}`;
  }

  private async generateWithAI(
    params: ContractParams,
    contractNumber: string,
    effectiveDate: string,
    expiryDate: string,
    governingLaw: string
  ): Promise<string> {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a contract drafting assistant for FTH Trading. Generate professional ${params.contract_type} agreements in HTML format. Include all standard clauses. Add a disclaimer that this is AI-generated and should be reviewed by legal counsel.`,
        },
        {
          role: 'user',
          content: `Draft a ${params.contract_type} between FTH Trading (Party A) and ${params.party_b_name} for ${params.commodity} transactions.
Contract number: ${contractNumber}
Value: ${params.deal_value_usd ? `USD ${params.deal_value_usd.toLocaleString()}` : 'TBD'}
Effective: ${effectiveDate} to ${expiryDate}
Governing law: ${governingLaw}
Special terms: ${params.special_terms || 'None'}
Format as clean HTML with professional styling.`,
        },
      ],
      temperature: 0.2,
    });

    return completion.choices[0].message.content || '<html><body><p>Contract generation failed</p></body></html>';
  }

  private async applyAmendment(
    baseHtml: string,
    amendments: string,
    contractNumber: string,
    version: number
  ): Promise<string> {
    const amendmentBlock = `
<div style="border: 2px solid #f59e0b; padding: 16px; margin: 24px 0; background: #fffbeb;">
  <strong>AMENDMENT (Version ${version})</strong><br>
  <small>Applied: ${new Date().toISOString()}</small><br><br>
  ${amendments}
</div>`;

    // Insert amendment block before closing body tag
    return baseHtml.replace('</body>', `${amendmentBlock}</body>`);
  }

  private addMonths(date: Date, months: number): Date {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
  }
}

export const contractAgent = new ContractAgent();
export default ContractAgent;
