/**
 * FundingStructureAgent
 *
 * Analyzes a trade deal and recommends an optimal funding instrument structure.
 * Generates non-binding Funding Term Sheets and maps required documentation.
 *
 * IMPORTANT: This agent is an orchestration tool only.
 * It does NOT issue banking instruments or replace MT760/MT700 instruments.
 * All recommendations are advisory. Human review is required before execution.
 */

import OpenAI from 'openai';
import { sql } from '@/lib/sql';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FundingStructureInput {
  dealId: string;
  dealValue: number;
  currency: string;
  commodity: string;
  jurisdiction: string;                // buyer's jurisdiction
  counterpartyJurisdiction?: string;   // seller's jurisdiction
  incoterms?: string;                  // e.g. CIF, FOB, DDP
  paymentTermsRequested?: string;      // buyer's request
  existingInstruments?: string[];      // any already-issued instruments
  riskNotes?: string;
}

export interface InstrumentRecommendation {
  instrument: 'SBLC' | 'LC' | 'ESCROW' | 'PREPAY' | 'NET_TERMS' | 'FACTORING' | 'BANK_GUARANTEE';
  rationale: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  applicableRules: string;             // UCP600, ISP98, URDG758
  estimatedTimeline: string;
  requiredDocs: string[];
}

export interface FundingTermSheet {
  recommendedStructure: InstrumentRecommendation[];
  primaryInstrument: string;
  fallbackInstrument?: string;
  totalRequirements: FundingRequirement[];
  fundingReadinessScore: number;       // 0–100
  riskFlags: string[];
  timeline: string;
  notes: string;
  generatedAt: string;
  disclaimer: string;
}

interface FundingRequirement {
  type: string;
  label: string;
  isCritical: boolean;
  description: string;
}

// ─── Agent ───────────────────────────────────────────────────────────────────

export class FundingStructureAgent {

  async analyze(input: FundingStructureInput): Promise<FundingTermSheet> {
    const prompt = this.buildPrompt(input);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a senior trade finance structuring advisor for FTH Trading.
You help structure funding instruments for commodity trade deals.

CRITICAL CONTEXT:
- FTH Trading is an ORCHESTRATOR, not a bank.
- You do NOT issue banking instruments.
- You do NOT replace MT760 / MT700 / bank guarantee instruments.
- XRPL and Stellar are programmable settlement and audit rails alongside traditional banking instruments.
- All recommendations are non-binding and advisory only.
- Human review is ALWAYS required before execution.

OUTPUT FORMAT: Return valid JSON matching the FundingTermSheet schema.`,
        },
        { role: 'user', content: prompt },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? '{}';
    let parsed: Partial<FundingTermSheet>;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error('FundingStructureAgent: failed to parse GPT response');
    }

    return this.normalise(parsed, input);
  }

  // Store generated term sheet requirements into DB
  async persistRequirements(
    dealId: string,
    termSheet: FundingTermSheet
  ): Promise<void> {
    for (const req of termSheet.totalRequirements) {
      await sql`
        INSERT INTO funding_requirements
          (deal_id, requirement_type, label, description, is_critical)
        VALUES (
          ${dealId},
          ${req.type as string},
          ${req.label},
          ${req.description ?? null},
          ${req.isCritical}
        )
        ON CONFLICT DO NOTHING
      `;
    }
  }

  // Compute readiness score from DB state
  async computeReadinessScore(dealId: string): Promise<number> {
    const { rows } = await sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'PENDING'  AND is_critical) AS missing_critical,
        COUNT(*) FILTER (WHERE status = 'PENDING'  AND NOT is_critical) AS missing_optional,
        COUNT(*) FILTER (WHERE status IN ('APPROVED','WAIVED')) AS completed
      FROM funding_requirements
      WHERE deal_id = ${dealId}
    `;

    const { rows: instRows } = await sql`
      SELECT
        COUNT(*) FILTER (WHERE verification_status NOT IN ('HUMAN_APPROVED','VERIFIED')) AS unverified
      FROM funding_instruments
      WHERE deal_id = ${dealId}
    `;

    const { rows: flagRows } = await sql`
      SELECT COUNT(*) AS critical_flags
      FROM compliance_flags
      WHERE deal_id = ${dealId} AND status = 'OPEN' AND severity = 'HIGH'
    `;

    const missingCritical = parseInt(rows[0]?.missing_critical ?? '0', 10);
    const missingOptional = parseInt(rows[0]?.missing_optional ?? '0', 10);
    const unverified = parseInt(instRows[0]?.unverified ?? '0', 10);
    const criticalFlags = parseInt(flagRows[0]?.critical_flags ?? '0', 10);

    const score = Math.max(
      0,
      100
        - missingCritical * 20
        - missingOptional * 10
        - unverified * 15
        - criticalFlags * 25
    );
    return Math.min(100, score);
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private buildPrompt(input: FundingStructureInput): string {
    return `Analyze this trade deal and produce a Funding Term Sheet.

Deal Parameters:
- Deal ID: ${input.dealId}
- Value: ${input.currency} ${input.dealValue.toLocaleString()}
- Commodity: ${input.commodity}
- Buyer Jurisdiction: ${input.jurisdiction}
- Seller Jurisdiction: ${input.counterpartyJurisdiction ?? 'Unknown'}
- Incoterms: ${input.incoterms ?? 'Not specified'}
- Payment Terms Requested: ${input.paymentTermsRequested ?? 'Not specified'}
- Existing Instruments: ${(input.existingInstruments ?? []).join(', ') || 'None'}
- Risk Notes: ${input.riskNotes ?? 'None'}

Return JSON with:
{
  "recommendedStructure": [
    {
      "instrument": "SBLC|LC|ESCROW|PREPAY|NET_TERMS|FACTORING|BANK_GUARANTEE",
      "rationale": "...",
      "riskLevel": "LOW|MEDIUM|HIGH",
      "applicableRules": "UCP 600|ISP98|URDG758",
      "estimatedTimeline": "e.g. 5-7 banking days",
      "requiredDocs": ["...", "..."]
    }
  ],
  "primaryInstrument": "e.g. LC",
  "fallbackInstrument": "e.g. ESCROW",
  "totalRequirements": [
    {
      "type": "KYC|KYB|POF|BANK_LETTER|FIN_STATEMENTS|INSURANCE|COLLATERAL|UCC|LICENSE|OTHER",
      "label": "...",
      "isCritical": true,
      "description": "..."
    }
  ],
  "fundingReadinessScore": 0-100,
  "riskFlags": ["...", "..."],
  "timeline": "overall timeline narrative",
  "notes": "advisory notes"
}`;
  }

  private normalise(
    parsed: Partial<FundingTermSheet>,
    input: FundingStructureInput
  ): FundingTermSheet {
    return {
      recommendedStructure: parsed.recommendedStructure ?? [],
      primaryInstrument: parsed.primaryInstrument ?? 'LC',
      fallbackInstrument: parsed.fallbackInstrument,
      totalRequirements: parsed.totalRequirements ?? [],
      fundingReadinessScore: parsed.fundingReadinessScore ?? 0,
      riskFlags: parsed.riskFlags ?? [],
      timeline: parsed.timeline ?? 'To be determined',
      notes: parsed.notes ?? '',
      generatedAt: new Date().toISOString(),
      disclaimer:
        'This term sheet is produced by an AI orchestration system for informational purposes only. ' +
        'FTH Trading does not issue banking instruments or provide regulated financial advice. ' +
        'All funding structures require review and approval by qualified banking and legal professionals ' +
        'before execution. XRPL/Stellar components are settlement and audit rails only, not financial instruments.',
    };
  }
}
