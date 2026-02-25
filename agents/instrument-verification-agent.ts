/**
 * InstrumentVerificationAgent
 *
 * Performs automated consistency checks on banking instruments (SBLC, LC, etc.)
 * and flags them for mandatory human review before any verification status can
 * be advanced to VERIFIED.
 *
 * CRITICAL RULE: This agent NEVER marks an instrument "VERIFIED" autonomously.
 * It can only advance status to PENDING_HUMAN_REVIEW.
 * A human operator must explicitly call approveInstrument() to set HUMAN_APPROVED.
 * Final VERIFIED status is set only after HUMAN_APPROVED + final checks pass.
 *
 * The agent does NOT issue, replace, or act as a banking instrument.
 * It is an orchestration and consistency-checking layer only.
 */

import OpenAI from 'openai';
import { sql } from '@/lib/sql';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Types ───────────────────────────────────────────────────────────────────

export interface InstrumentCheckInput {
  instrumentId: string;
  rawSwiftText?: string;      // raw MT760 / MT700 text for parsing
  expectedAmount?: number;
  expectedCurrency?: string;
  expectedBeneficiary?: string;
  expectedIssuingBic?: string;
  expectedExpiry?: string;    // ISO date string
}

export interface VerificationCheck {
  checkName: string;
  passed: boolean;
  details: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
}

export interface VerificationResult {
  instrumentId: string;
  overallPass: boolean;       // true only if no CRITICAL failures
  checks: VerificationCheck[];
  parsedFields: Record<string, unknown>;
  riskFlags: string[];
  recommendation: string;
  humanReviewRequired: true;  // ALWAYS true — never omit this
  newStatus: 'PENDING_HUMAN_REVIEW' | 'HUMAN_REJECTED';
  analysisText: string;
}

// BIC format: 8 or 11 chars, letters + digits
const BIC_REGEX = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;

// ─── Agent ───────────────────────────────────────────────────────────────────

export class InstrumentVerificationAgent {

  async verify(input: InstrumentCheckInput): Promise<VerificationResult> {
    // 1. Load instrument from DB
    const { rows } = await sql`
      SELECT * FROM funding_instruments WHERE id = ${input.instrumentId}
    `;
    if (!rows.length) {
      throw new Error(`InstrumentVerificationAgent: instrument ${input.instrumentId} not found`);
    }
    const instrument = rows[0];

    // 2. Run rule-based checks
    const checks: VerificationCheck[] = [];
    const riskFlags: string[] = [];
    const rawText = input.rawSwiftText ?? instrument.raw_swift_text ?? '';

    // BIC validation
    checks.push(this.checkBic(instrument.issuing_bank_bic, 'Issuing Bank BIC'));
    if (instrument.advising_bank_bic) {
      checks.push(this.checkBic(instrument.advising_bank_bic, 'Advising Bank BIC'));
    }

    // Amount consistency
    if (input.expectedAmount !== undefined && instrument.amount) {
      const tolerance = 0.01;
      const match = Math.abs(parseFloat(instrument.amount) - input.expectedAmount) < tolerance;
      checks.push({
        checkName: 'Amount Match',
        passed: match,
        details: `Instrument: ${instrument.amount} ${instrument.currency}, Expected: ${input.expectedAmount} ${input.expectedCurrency ?? instrument.currency}`,
        severity: match ? 'INFO' : 'CRITICAL',
      });
      if (!match) riskFlags.push('AMOUNT_MISMATCH');
    }

    // Currency check
    if (input.expectedCurrency && instrument.currency) {
      const match = instrument.currency === input.expectedCurrency;
      checks.push({
        checkName: 'Currency Match',
        passed: match,
        details: `Instrument: ${instrument.currency}, Expected: ${input.expectedCurrency}`,
        severity: match ? 'INFO' : 'CRITICAL',
      });
      if (!match) riskFlags.push('CURRENCY_MISMATCH');
    }

    // Expiry date
    if (instrument.expiry_date) {
      const expiry = new Date(instrument.expiry_date);
      const now = new Date();
      const daysToExpiry = Math.ceil((expiry.getTime() - now.getTime()) / 86400000);
      const isExpired = daysToExpiry < 0;
      const isExpiringSoon = daysToExpiry >= 0 && daysToExpiry < 30;
      checks.push({
        checkName: 'Expiry Date',
        passed: !isExpired,
        details: `Expiry: ${instrument.expiry_date} (${isExpired ? 'EXPIRED' : daysToExpiry + ' days remaining'})`,
        severity: isExpired ? 'CRITICAL' : isExpiringSoon ? 'WARNING' : 'INFO',
      });
      if (isExpired) riskFlags.push('INSTRUMENT_EXPIRED');
      if (isExpiringSoon) riskFlags.push('EXPIRING_WITHIN_30_DAYS');
    }

    // Beneficiary check
    if (input.expectedBeneficiary && instrument.beneficiary_name) {
      const match = instrument.beneficiary_name
        .toLowerCase()
        .includes(input.expectedBeneficiary.toLowerCase());
      checks.push({
        checkName: 'Beneficiary Name',
        passed: match,
        details: `On instrument: "${instrument.beneficiary_name}", Expected to contain: "${input.expectedBeneficiary}"`,
        severity: match ? 'INFO' : 'CRITICAL',
      });
      if (!match) riskFlags.push('BENEFICIARY_MISMATCH');
    }

    // Applicable rules present
    checks.push({
      checkName: 'Applicable Rules Defined',
      passed: Boolean(instrument.applicable_rules),
      details: instrument.applicable_rules
        ? `Rules: ${instrument.applicable_rules}`
        : 'No applicable rules defined (UCP600/ISP98/URDG758 required)',
      severity: instrument.applicable_rules ? 'INFO' : 'WARNING',
    });

    // 3. GPT-4o analysis of raw SWIFT text (if present)
    let parsedFields: Record<string, unknown> = {};
    let analysisText = '';
    if (rawText.trim().length > 0) {
      const gptResult = await this.analyzeWithGPT(rawText, instrument, input);
      parsedFields = gptResult.parsedFields ?? {};
      analysisText = gptResult.analysis ?? '';

      // Merge GPT-detected flags
      if (gptResult.additionalFlags) {
        riskFlags.push(...gptResult.additionalFlags);
        gptResult.additionalFlags.forEach((flag: string) => {
          checks.push({
            checkName: `AI Check: ${flag}`,
            passed: false,
            details: `GPT-4o detected: ${flag}`,
            severity: 'WARNING',
          });
        });
      }
    }

    // 4. Determine overall pass (no CRITICAL failures)
    const hasCritical = checks.some((c) => !c.passed && c.severity === 'CRITICAL');
    const overallPass = !hasCritical;
    const newStatus: VerificationResult['newStatus'] = overallPass
      ? 'PENDING_HUMAN_REVIEW'
      : 'HUMAN_REJECTED';

    const result: VerificationResult = {
      instrumentId: input.instrumentId,
      overallPass,
      checks,
      parsedFields,
      riskFlags,
      recommendation: overallPass
        ? 'Automated checks passed. Instrument requires human review and approval before verification.'
        : `Automated checks FAILED (${riskFlags.join(', ')}). Human review required — do not proceed.`,
      humanReviewRequired: true, // ALWAYS true
      newStatus,
      analysisText,
    };

    // 5. Persist results
    await sql`
      UPDATE funding_instruments SET
        verification_status   = ${newStatus},
        verification_notes    = ${result.recommendation},
        agent_analysis        = ${JSON.stringify({ checks, riskFlags, parsedFields, analysisText }) as any},
        raw_swift_text        = ${rawText || null},
        human_approval_required = TRUE,
        updated_at            = NOW()
      WHERE id = ${input.instrumentId}
    `;

    return result;
  }

  /**
   * Human operator approves an instrument after reviewing automated results.
   * This is the ONLY path to HUMAN_APPROVED status.
   */
  async approveInstrument(
    instrumentId: string,
    approvedBy: string,
    notes?: string
  ): Promise<void> {
    const { rows } = await sql`
      SELECT verification_status FROM funding_instruments WHERE id = ${instrumentId}
    `;
    if (!rows.length) throw new Error(`Instrument ${instrumentId} not found`);

    if (rows[0].verification_status !== 'PENDING_HUMAN_REVIEW') {
      throw new Error(
        `Instrument must be in PENDING_HUMAN_REVIEW status before approval. ` +
        `Current: ${rows[0].verification_status}`
      );
    }

    await sql`
      UPDATE funding_instruments SET
        verification_status  = 'HUMAN_APPROVED',
        verified_by          = ${approvedBy},
        verified_at          = NOW(),
        verification_notes   = ${notes ?? null},
        updated_at           = NOW()
      WHERE id = ${instrumentId}
    `;
  }

  /**
   * Human operator rejects or requests re-review.
   */
  async rejectInstrument(
    instrumentId: string,
    rejectedBy: string,
    reason: string
  ): Promise<void> {
    await sql`
      UPDATE funding_instruments SET
        verification_status = 'HUMAN_REJECTED',
        verified_by         = ${rejectedBy},
        verified_at         = NOW(),
        verification_notes  = ${reason},
        updated_at          = NOW()
      WHERE id = ${instrumentId}
    `;
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private checkBic(bic: string | null, label: string): VerificationCheck {
    if (!bic) {
      return {
        checkName: `${label} Present`,
        passed: false,
        details: `${label} is missing`,
        severity: 'WARNING',
      };
    }
    const valid = BIC_REGEX.test(bic.trim().toUpperCase());
    return {
      checkName: `${label} Format`,
      passed: valid,
      details: valid ? `${bic} — valid BIC format` : `${bic} — INVALID BIC format (expected 8 or 11 chars)`,
      severity: valid ? 'INFO' : 'CRITICAL',
    };
  }

  private async analyzeWithGPT(
    rawText: string,
    instrument: Record<string, unknown>,
    input: InstrumentCheckInput
  ): Promise<{ parsedFields: Record<string, unknown>; analysis: string; additionalFlags: string[] }> {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a trade finance compliance expert specializing in SWIFT MT messages and banking instruments.
Parse the provided SWIFT message and identify any inconsistencies, red flags, or missing fields.

Return JSON with:
{
  "parsedFields": { "field_tag": "value", ... },
  "analysis": "narrative analysis",
  "additionalFlags": ["FLAG_1", "FLAG_2"]
}

Focus on: MT field completeness, amount/currency/date consistency, BIC validity, UCP600/ISP98 compliance indicators.
Flag: SANCTION_RISK_KEYWORDS, UNUSUAL_CONDITIONS, MISSING_REQUIRED_FIELDS, PRESENTATION_PERIOD_SHORT`,
        },
        {
          role: 'user',
          content: `SWIFT Text:\n${rawText.substring(0, 3000)}\n\nInstrument DB Record:\n${JSON.stringify(
            {
              type: instrument.instrument_type,
              amount: instrument.amount,
              currency: instrument.currency,
              issuing_bic: instrument.issuing_bank_bic,
              beneficiary: instrument.beneficiary_name,
              expiry: instrument.expiry_date,
            },
            null, 2
          )}`,
        },
      ],
    });

    try {
      return JSON.parse(response.choices[0]?.message?.content ?? '{}');
    } catch {
      return { parsedFields: {}, analysis: '', additionalFlags: [] };
    }
  }
}
