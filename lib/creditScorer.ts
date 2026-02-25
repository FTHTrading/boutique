import { sql } from '@vercel/postgres';

export interface Client {
  id: string;
  business_name: string;
  years_in_business?: number;
  monthly_revenue?: number;
  dnb_score?: number;
  has_trade_references?: boolean;
  no_late_payments?: boolean;
}

export interface CreditScore {
  total_score: number;
  years_in_business_score: number;
  revenue_score: number;
  dnb_score: number;
  references_score: number;
  payment_history_score: number;
  recommendation: 'net-30' | 'net-15' | 'prepay';
  risk_level: 'low' | 'medium' | 'high';
}

/**
 * Calculate credit score for a coffee shop client
 * 
 * Scoring System:
 * - Years in Business (0-20 points)
 * - Monthly Revenue (0-25 points)
 * - D&B Score (0-30 points)
 * - Trade References (0-15 points)
 * - Payment History (0-20 points)
 * 
 * Total: 0-110 points
 * 
 * Recommendations:
 * - 80+: Net 30 (Low Risk)
 * - 65-79: Net 15 (Medium Risk)
 * - <65: Prepay (High Risk)
 */
export function scoreCredit(client: Client): CreditScore {
  let yearsScore = 0;
  let revenueScore = 0;
  let dnbScore = 0;
  let referencesScore = 0;
  let paymentScore = 0;

  // Years in Business (0-20 points)
  if (client.years_in_business) {
    if (client.years_in_business >= 10) yearsScore = 20;
    else if (client.years_in_business >= 5) yearsScore = 15;
    else if (client.years_in_business >= 3) yearsScore = 10;
    else if (client.years_in_business >= 1) yearsScore = 5;
  }

  // Monthly Revenue (0-25 points)
  if (client.monthly_revenue) {
    if (client.monthly_revenue >= 100000) revenueScore = 25;
    else if (client.monthly_revenue >= 50000) revenueScore = 20;
    else if (client.monthly_revenue >= 20000) revenueScore = 15;
    else if (client.monthly_revenue >= 10000) revenueScore = 10;
    else if (client.monthly_revenue >= 5000) revenueScore = 5;
  }

  // D&B Score (0-30 points)
  if (client.dnb_score) {
    if (client.dnb_score >= 80) dnbScore = 30;
    else if (client.dnb_score >= 70) dnbScore = 25;
    else if (client.dnb_score >= 60) dnbScore = 20;
    else if (client.dnb_score >= 50) dnbScore = 15;
    else if (client.dnb_score >= 40) dnbScore = 10;
  }

  // Trade References (0-15 points)
  if (client.has_trade_references) {
    referencesScore = 15;
  }

  // Payment History (0-20 points)
  if (client.no_late_payments) {
    paymentScore = 20;
  }

  const totalScore = yearsScore + revenueScore + dnbScore + referencesScore + paymentScore;

  // Determine recommendation
  let recommendation: 'net-30' | 'net-15' | 'prepay';
  let riskLevel: 'low' | 'medium' | 'high';

  if (totalScore >= 80) {
    recommendation = 'net-30';
    riskLevel = 'low';
  } else if (totalScore >= 65) {
    recommendation = 'net-15';
    riskLevel = 'medium';
  } else {
    recommendation = 'prepay';
    riskLevel = 'high';
  }

  return {
    total_score: totalScore,
    years_in_business_score: yearsScore,
    revenue_score: revenueScore,
    dnb_score: dnbScore,
    references_score: referencesScore,
    payment_history_score: paymentScore,
    recommendation,
    risk_level,
  };
}

/**
 * Update client's credit score in database
 */
export async function updateClientCreditScore(clientId: string): Promise<CreditScore> {
  // Fetch client data
  const { rows } = await sql`
    SELECT id, business_name, years_in_business, monthly_revenue, 
           dnb_score, has_trade_references, no_late_payments
    FROM clients
    WHERE id = ${clientId}
  `;

  if (rows.length === 0) {
    throw new Error(`Client not found: ${clientId}`);
  }

  const client = rows[0] as Client;
  const creditScore = scoreCredit(client);

  // Update database
  await sql`
    UPDATE clients 
    SET credit_score = ${creditScore.total_score},
        payment_terms = ${creditScore.recommendation},
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${clientId}
  `;

  return creditScore;
}

/**
 * Batch score all clients
 */
export async function batchScoreAllClients(): Promise<number> {
  const { rows } = await sql`
    SELECT id, business_name, years_in_business, monthly_revenue, 
           dnb_score, has_trade_references, no_late_payments
    FROM clients
    WHERE status IN ('lead', 'qualified', 'active')
  `;

  let updated = 0;

  for (const client of rows as Client[]) {
    try {
      await updateClientCreditScore(client.id);
      updated++;
    } catch (error) {
      console.error(`Failed to score client ${client.id}:`, error);
    }
  }

  return updated;
}

/**
 * Get risk distribution across all clients
 */
export async function getCreditRiskDistribution() {
  const { rows } = await sql`
    SELECT 
      CASE 
        WHEN credit_score >= 80 THEN 'low'
        WHEN credit_score >= 65 THEN 'medium'
        ELSE 'high'
      END as risk_level,
      COUNT(*) as count
    FROM clients
    WHERE status = 'active' AND credit_score IS NOT NULL
    GROUP BY risk_level
  `;

  return {
    low: rows.find(r => r.risk_level === 'low')?.count || 0,
    medium: rows.find(r => r.risk_level === 'medium')?.count || 0,
    high: rows.find(r => r.risk_level === 'high')?.count || 0,
  };
}
