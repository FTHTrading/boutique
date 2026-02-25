import { scoreCredit, updateClientCreditScore } from '../lib/creditScorer';
import { sql } from '@/lib/sql';
import type { CreditScore } from '@/types';

/**
 * Credit Risk Agent
 * 
 * Responsibilities:
 * - Score creditworthiness of clients
 * - Flag risk factors
 * - Recommend payment terms
 * - Monitor invoice aging
 * - Alert on overdue accounts
 */

class CreditRiskAgent {
  private readonly name = 'CreditRiskAgent';
  
  /**
   * Score a client's credit
   */
  async scoreClient(clientId: string): Promise<CreditScore> {
    console.log(`[${this.name}] Scoring client: ${clientId}`);
    
    try {
      const creditScore = await updateClientCreditScore(clientId);
      
      await this.logAction('score_credit', { clientId }, creditScore);
      
      console.log(`[${this.name}] ✅ Score: ${creditScore.total_score} (${creditScore.risk_level} risk)`);
      
      return creditScore;
    } catch (error) {
      console.error(`[${this.name}] ❌ Error scoring client:`, error);
      throw error;
    }
  }
  
  /**
   * Get clients with high credit risk
   */
  async getHighRiskClients(): Promise<any[]> {
    try {
      const result = await sql`
        SELECT 
          id,
          business_name,
          credit_score,
          payment_terms,
          status,
          (
            SELECT COUNT(*) 
            FROM invoices 
            WHERE client_id = clients.id 
            AND status = 'overdue'
          ) as overdue_invoices
        FROM clients
        WHERE credit_score < 65
        AND status = 'active'
        ORDER BY credit_score ASC
      `;
      
      return result.rows;
    } catch (error) {
      console.error(`[${this.name}] Error fetching high risk clients:`, error);
      throw error;
    }
  }
  
  /**
   * Monitor overdue invoices
   */
  async monitorOverdueInvoices(): Promise<any[]> {
    try {
      const result = await sql`
        SELECT 
          i.id,
          i.invoice_number,
          i.client_id,
          c.business_name,
          c.email,
          i.total,
          i.amount_paid,
          i.due_date,
          CURRENT_DATE - i.due_date as days_overdue
        FROM invoices i
        JOIN clients c ON i.client_id = c.id
        WHERE i.status = 'overdue'
        ORDER BY days_overdue DESC
      `;
      
      // Log high-priority overdue accounts
      const critical = result.rows.filter(inv => inv.days_overdue > 30);
      
      if (critical.length > 0) {
        console.warn(`[${this.name}] ⚠️ ${critical.length} invoices >30 days overdue`);
      }
      
      return result.rows;
    } catch (error) {
      console.error(`[${this.name}] Error monitoring invoices:`, error);
      throw error;
    }
  }
  
  /**
   * Flag accounts at risk
   */
  async flagRiskAccounts(): Promise<any[]> {
    try {
      const result = await sql`
        SELECT 
          c.id,
          c.business_name,
          c.credit_score,
          c.payment_terms,
          COUNT(i.id) as total_invoices,
          COUNT(CASE WHEN i.status = 'overdue' THEN 1 END) as overdue_count,
          SUM(CASE WHEN i.status = 'overdue' THEN i.total - i.amount_paid ELSE 0 END) as overdue_amount,
          AVG(CASE WHEN i.status = 'paid' THEN i.days_overdue ELSE NULL END) as avg_days_to_payment
        FROM clients c
        LEFT JOIN invoices i ON c.id = i.client_id
        WHERE c.status = 'active'
        GROUP BY c.id, c.business_name, c.credit_score, c.payment_terms
        HAVING 
          COUNT(CASE WHEN i.status = 'overdue' THEN 1 END) >= 2
          OR SUM(CASE WHEN i.status = 'overdue' THEN i.total - i.amount_paid ELSE 0 END) > 5000
        ORDER BY overdue_amount DESC
      `;
      
      // Update client status if needed
      for (const account of result.rows) {
        if (account.overdue_amount > 10000 || account.overdue_count > 3) {
          await sql`
            UPDATE clients 
            SET payment_terms = 'prepay'
            WHERE id = ${account.id}
          `;
          
          console.warn(`[${this.name}] ⚠️ Moved ${account.business_name} to prepay terms`);
        }
      }
      
      return result.rows;
    } catch (error) {
      console.error(`[${this.name}] Error flagging risk accounts:`, error);
      throw error;
    }
  }
  
  /**
   * Recommend payment terms for new client
   */
  async recommendTerms(clientId: string): Promise<{
    terms: string;
    reasoning: string;
  }> {
    try {
      const creditScore = await this.scoreClient(clientId);
      
      let reasoning = '';
      
      if (creditScore.risk_level === 'low') {
        reasoning = `Strong credit profile (score: ${creditScore.total_score}). ` +
          `${creditScore.years_in_business_score > 15 ? 'Established business. ' : ''}` +
          `${creditScore.payment_history_score === 20 ? 'Clean payment history. ' : ''}` +
          `Approved for Net 30 terms.`;
      } else if (creditScore.risk_level === 'medium') {
        reasoning = `Moderate credit profile (score: ${creditScore.total_score}). ` +
          `Recommend Net 15 terms to manage risk.`;
      } else {
        reasoning = `Limited credit history or risk factors (score: ${creditScore.total_score}). ` +
          `Prepayment required until proven track record.`;
      }
      
      return {
        terms: creditScore.recommendation,
        reasoning,
      };
    } catch (error) {
      console.error(`[${this.name}] Error recommending terms:`, error);
      throw error;
    }
  }
  
  /**
   * Log agent action
   */
  private async logAction(
    action: string,
    inputData: any,
    outputData: any
  ): Promise<void> {
    try {
      await sql`
        INSERT INTO agent_logs (
          agent_name,
          action,
          client_id,
          input_data,
          output_data,
          success
        ) VALUES (
          ${this.name},
          ${action},
          ${inputData.clientId || null},
          ${JSON.stringify(inputData)},
          ${outputData ? JSON.stringify(outputData) : null},
          ${outputData !== null}
        )
      `;
    } catch (error) {
      console.error(`[${this.name}] Error logging action:`, error);
    }
  }
}

// Export singleton instance
export default new CreditRiskAgent();
