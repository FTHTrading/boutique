/**
 * TradeComplianceAgent
 * 
 * Purpose: Screen deals for compliance risks and generate flags for human review.
 * 
 * CRITICAL DISCLAIMER:
 * This agent DOES NOT certify legal compliance. It flags potential risks
 * based on risk-based rules and requires human review. All flagged transactions
 * must be reviewed by qualified compliance personnel and/or legal counsel.
 * 
 * Regulatory Alignment:
 * - OFAC Framework for Compliance Commitments (risk-based approach)
 * - FinCEN AML guidance (transaction monitoring)
 * - Export control regulations (EAR/ITAR screening when applicable)
 */

import { db } from '@/lib/db';

// Severity levels
export type FlagSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

// Flag types
export type FlagType = 
  | 'SANCTIONS'      // Sanctions risk destinations or entities
  | 'EXPORT_CONTROL' // Export control / dual-use concerns
  | 'LICENSE'        // Licensing requirements
  | 'AML'            // Anti-money laundering / KYC
  | 'DOCS'           // Documentation requirements
  | 'INCOTERM'       // Incoterms obligation concerns
  | 'VALUE'          // Transaction value thresholds
  | 'COMMODITY';     // Commodity-specific restrictions

export interface ComplianceFlag {
  flag_type: FlagType;
  severity: FlagSeverity;
  message: string;
  recommendation: string;
  requires_human_review: boolean;
  blocks_execution: boolean;
}

export interface Deal {
  id: string;
  commodity_id: number;
  origin_country: string;
  destination_country: string;
  incoterm: string;
  deal_value_usd: number;
  quantity: number;
  quantity_unit: string;
}

export interface Jurisdiction {
  country: string;
  country_code: string;
  sanctions_risk: string;
  sanctions_notes?: string;
  aml_notes?: string;
  docs_required?: string[];
}

export interface Commodity {
  id: number;
  name: string;
  category: string;
  hs_code?: string;
  restricted: boolean;
  restricted_reason?: string;
}

/**
 * Main screening function
 * Generates compliance flags for a deal
 */
export async function screenDeal(deal: Deal): Promise<ComplianceFlag[]> {
  const flags: ComplianceFlag[] = [];

  // 1) Fetch jurisdiction data
  const destJurisdiction = await getJurisdiction(deal.destination_country);
  const originJurisdiction = await getJurisdiction(deal.origin_country);

  // 2) Fetch commodity data
  const commodity = await getCommodity(deal.commodity_id);

  // 3) Run screening checks
  flags.push(...await screenSanctions(deal, destJurisdiction, originJurisdiction));
  flags.push(...await screenAML(deal));
  flags.push(...await screenCommodity(deal, commodity));
  flags.push(...await screenIncoterms(deal));
  flags.push(...await screenDocumentation(deal, destJurisdiction, commodity));
  flags.push(...await screenValue(deal));

  return flags;
}

/**
 * Sanctions risk screening
 * Flags high-risk jurisdictions
 */
async function screenSanctions(
  deal: Deal, 
  destJurisdiction: Jurisdiction | null, 
  originJurisdiction: Jurisdiction | null
): Promise<ComplianceFlag[]> {
  const flags: ComplianceFlag[] = [];

  // Destination sanctions risk
  if (destJurisdiction?.sanctions_risk === 'critical') {
    flags.push({
      flag_type: 'SANCTIONS',
      severity: 'CRITICAL',
      message: `Destination ${destJurisdiction.country} is high sanctions-risk jurisdiction. Transaction BLOCKED pending compliance review.`,
      recommendation: `DO NOT PROCEED. Contact legal counsel and verify OFAC General/Specific License requirements. Review: ${destJurisdiction.sanctions_notes || 'N/A'}`,
      requires_human_review: true,
      blocks_execution: true
    });
  } else if (destJurisdiction?.sanctions_risk === 'high') {
    flags.push({
      flag_type: 'SANCTIONS',
      severity: 'HIGH',
      message: `Destination ${destJurisdiction.country} requires enhanced sanctions screening.`,
      recommendation: `Verify counterparty is not on OFAC SDN List, Entity List, or Denied Persons List. Document screening results.`,
      requires_human_review: true,
      blocks_execution: false
    });
  } else if (destJurisdiction?.sanctions_risk === 'medium') {
    flags.push({
      flag_type: 'SANCTIONS',
      severity: 'MEDIUM',
      message: `Destination ${destJurisdiction.country} requires standard sanctions screening.`,
      recommendation: `Run OFAC screening on counterparty name(s). Retain records.`,
      requires_human_review: false,
      blocks_execution: false
    });
  }

  // Origin sanctions risk (less common but possible)
  if (originJurisdiction?.sanctions_risk === 'critical') {
    flags.push({
      flag_type: 'SANCTIONS',
      severity: 'CRITICAL',
      message: `Origin ${originJurisdiction.country} is sanctioned or high-risk. Sourcing from this jurisdiction prohibited.`,
      recommendation: `DO NOT PROCEED. Identify alternative sourcing jurisdiction.`,
      requires_human_review: true,
      blocks_execution: true
    });
  }

  return flags;
}

/**
 * Anti-Money Laundering screening
 * Flags high-value transactions requiring enhanced due diligence
 */
async function screenAML(deal: Deal): Promise<ComplianceFlag[]> {
  const flags: ComplianceFlag[] = [];

  // High-value threshold (adjust based on commodity and jurisdiction)
  if (deal.deal_value_usd >= 50000) {
    flags.push({
      flag_type: 'AML',
      severity: 'HIGH',
      message: `High-value transaction ($${deal.deal_value_usd.toLocaleString()} USD). Enhanced due diligence required.`,
      recommendation: `Obtain: (1) Enhanced KYC documentation, (2) Beneficial ownership disclosure (>25% owners), (3) Source of funds verification, (4) Source of wealth documentation. Retain for 5+ years.`,
      requires_human_review: true,
      blocks_execution: false
    });
  }

  // Very high-value threshold
  if (deal.deal_value_usd >= 100000) {
    flags.push({
      flag_type: 'AML',
      severity: 'HIGH',
      message: `Very high-value transaction. CTR/SAR considerations.`,
      recommendation: `If cash involved: Currency Transaction Report (CTR) required for >$10K USD. Monitor for structuring. If suspicious indicators present, file SAR.`,
      requires_human_review: true,
      blocks_execution: false
    });
  }

  return flags;
}

/**
 * Commodity-specific screening
 * Flags restricted commodities requiring special handling
 */
async function screenCommodity(
  deal: Deal, 
  commodity: Commodity | null
): Promise<ComplianceFlag[]> {
  const flags: ComplianceFlag[] = [];

  if (!commodity) {
    flags.push({
      flag_type: 'COMMODITY',
      severity: 'HIGH',
      message: `Commodity data not found (ID: ${deal.commodity_id}). Cannot complete compliance screening.`,
      recommendation: `Verify commodity exists in registry. Update commodity data before proceeding.`,
      requires_human_review: true,
      blocks_execution: true
    });
    return flags;
  }

  // Restricted commodities
  if (commodity.restricted) {
    flags.push({
      flag_type: 'EXPORT_CONTROL',
      severity: 'HIGH',
      message: `Commodity "${commodity.name}" flagged as restricted. Reason: ${commodity.restricted_reason || 'Not specified'}`,
      recommendation: `Verify: (1) Export control classification (ECCN/USML), (2) Export license requirements, (3) End-use/end-user restrictions. Consult export control counsel if uncertain.`,
      requires_human_review: true,
      blocks_execution: true
    });
  }

  // Precious metals AML advisory
  if (commodity.category === 'metals' && commodity.name.toLowerCase().includes('gold')) {
    flags.push({
      flag_type: 'AML',
      severity: 'MEDIUM',
      message: `Precious metals transaction. Enhanced AML protocols apply.`,
      recommendation: `LBMA custody recommended. Document: (1) Source of funds, (2) Intended use, (3) Storage arrangements, (4) Insurance. Retain chain of custody records.`,
      requires_human_review: false,
      blocks_execution: false
    });
  }

  return flags;
}

/**
 * Incoterms screening
 * Flags obligations and documentation requirements
 */
async function screenIncoterms(deal: Deal): Promise<ComplianceFlag[]> {
  const flags: ComplianceFlag[] = [];

  const incoterm = deal.incoterm.toUpperCase();

  // DDP creates importer-of-record obligations
  if (incoterm === 'DDP') {
    flags.push({
      flag_type: 'INCOTERM',
      severity: 'MEDIUM',
      message: `DDP (Delivered Duty Paid) selected. Seller assumes import clearance obligations.`,
      recommendation: `Verify: (1) Customs broker engaged in destination country, (2) Import duties/VAT/taxes calculated, (3) Importer-of-record responsibilities understood. Consider insurance implications.`,
      requires_human_review: false,
      blocks_execution: false
    });
  }

  // FOB/CIF - title transfer considerations
  if (incoterm === 'FOB' || incoterm === 'CIF') {
    flags.push({
      flag_type: 'INCOTERM',
      severity: 'LOW',
      message: `${incoterm} selected. Risk transfers at port of shipment.`,
      recommendation: `Confirm: (1) Title transfer point, (2) Insurance coverage (CIF includes insurance to destination), (3) Freight forwarder arrangements.`,
      requires_human_review: false,
      blocks_execution: false
    });
  }

  // EXW - buyer handles everything
  if (incoterm === 'EXW') {
    flags.push({
      flag_type: 'INCOTERM',
      severity: 'LOW',
      message: `EXW (Ex Works) selected. Buyer assumes all transport and export obligations.`,
      recommendation: `Buyer must arrange: (1) Export clearance from origin country, (2) All transport, (3) Import clearance at destination. Seller delivers at their premises only.`,
      requires_human_review: false,
      blocks_execution: false
    });
  }

  return flags;
}

/**
 * Documentation screening
 * Flags required documents based on jurisdiction and commodity
 */
async function screenDocumentation(
  deal: Deal,
  destination: Jurisdiction | null,
  commodity: Commodity | null
): Promise<ComplianceFlag[]> {
  const flags: ComplianceFlag[] = [];

  const requiredDocs: string[] = [];

  // Standard international trade docs
  requiredDocs.push('Commercial Invoice', 'Packing List', 'Bill of Lading');

  // Jurisdiction-specific docs
  if (destination?.docs_required && Array.isArray(destination.docs_required)) {
    requiredDocs.push(...destination.docs_required);
  }

  // Commodity-specific docs
  if (commodity?.category === 'agricultural') {
    requiredDocs.push('Phytosanitary Certificate', 'Certificate of Origin');
  }
  if (commodity?.category === 'metals') {
    requiredDocs.push('Assay Certificate', 'Certificate of Origin');
    if (commodity.name.toLowerCase().includes('gold') || commodity.name.toLowerCase().includes('silver')) {
      requiredDocs.push('Chain of Custody Documentation', 'Insurance Certificate');
    }
  }

  if (requiredDocs.length > 0) {
    flags.push({
      flag_type: 'DOCS',
      severity: 'MEDIUM',
      message: `Required documentation for ${destination?.country || 'destination'} / ${commodity?.name || 'commodity'} trade.`,
      recommendation: `Prepare and retain: ${requiredDocs.join(', ')}. Verify authenticity. Retain for 5+ years per recordkeeping requirements.`,
      requires_human_review: false,
      blocks_execution: false
    });
  }

  return flags;
}

/**
 * Transaction value screening
 * Flags reporting thresholds
 */
async function screenValue(deal: Deal): Promise<ComplianceFlag[]> {
  const flags: ComplianceFlag[] = [];

  // $10K threshold (various reporting requirements)
  if (deal.deal_value_usd >= 10000 && deal.deal_value_usd < 50000) {
    flags.push({
      flag_type: 'VALUE',
      severity: 'LOW',
      message: `Transaction value $${deal.deal_value_usd.toLocaleString()} USD exceeds $10K reporting threshold.`,
      recommendation: `If cash payment: Currency Transaction Report (CTR) required. If wire: Document source/destination. Monitor for structuring (multiple transactions <$10K).`,
      requires_human_review: false,
      blocks_execution: false
    });
  }

  return flags;
}

/**
 * Persist flags to database
 */
export async function persistFlags(dealId: string, flags: ComplianceFlag[]): Promise<void> {
  for (const flag of flags) {
    await db.complianceFlags.create({
      data: {
        deal_id: dealId,
        flag_type: flag.flag_type,
        severity: flag.severity,
        message: flag.message,
        recommendation: flag.recommendation,
        requires_human_review: flag.requires_human_review,
        blocks_execution: flag.blocks_execution,
        resolved: false
      }
    });
  }

  // Log screening action
  await db.complianceActions.create({
    data: {
      deal_id: dealId,
      action_type: 'SCREEN',
      action_by: 'TradeComplianceAgent',
      action_notes: `Generated ${flags.length} compliance flag(s)`,
      metadata: { flag_count: flags.length, critical_count: flags.filter(f => f.severity === 'CRITICAL').length }
    }
  });
}

/**
 * Check if deal is cleared for execution
 */
export async function isDealCleared(dealId: string): Promise<boolean> {
  const criticalFlags = await db.complianceFlags.findMany({
    where: {
      deal_id: dealId,
      severity: 'CRITICAL',
      resolved: false
    }
  });

  return criticalFlags.length === 0;
}

/**
 * Helper: Get jurisdiction data
 */
async function getJurisdiction(countryCode: string): Promise<Jurisdiction | null> {
  return await db.jurisdictions.findFirst({
    where: { country_code: countryCode }
  });
}

/**
 * Helper: Get commodity data
 */
async function getCommodity(commodityId: number): Promise<Commodity | null> {
  return await db.commodities.findUnique({
    where: { id: commodityId }
  });
}

/**
 * Full deal screening workflow
 * Call this when deal is created or updated
 */
export async function runComplianceScreen(deal: Deal): Promise<{
  flags: ComplianceFlag[];
  cleared: boolean;
  criticalCount: number;
}> {
  // Generate flags
  const flags = await screenDeal(deal);

  // Persist to database
  await persistFlags(deal.id, flags);

  // Check clearance
  const cleared = await isDealCleared(deal.id);
  const criticalCount = flags.filter(f => f.severity === 'CRITICAL').length;

  // Update deal compliance status
  await db.deals.update({
    where: { id: deal.id },
    data: {
      compliance_cleared: cleared,
      critical_flags_count: criticalCount
    }
  });

  return { flags, cleared, criticalCount };
}
