import { sql } from '@/lib/sql';
import type { Proposal, Client } from '@/types';

/**
 * Compliance Agent
 * 
 * Responsibilities:
 * - Verify legal compliance of proposals
 * - Ensure terms match credit risk
 * - Validate contract language
 * - Log approval chain
 * - Flag regulatory issues
 */

class ComplianceAgent {
  private readonly name = 'ComplianceAgent';
  
  /**
   * Verify proposal compliance
   */
  async verifyProposal(proposalId: string): Promise<{
    compliant: boolean;
    issues: string[];
    warnings: string[];
    approved: boolean;
  }> {
    console.log(`[${this.name}] Verifying proposal: ${proposalId}`);
    
    try {
      const issues: string[] = [];
      const warnings: string[] = [];
      
      // Fetch proposal and client data
      const proposalResult = await sql`
        SELECT p.*, c.credit_score, c.payment_terms as client_payment_terms
        FROM proposals p
        JOIN clients c ON p.client_id = c.id
        WHERE p.id = ${proposalId}
      `;
      
      if (proposalResult.rows.length === 0) {
        throw new Error('Proposal not found');
      }
      
      const proposal = proposalResult.rows[0];
      
      // Check 1: Payment terms match credit score
      const termsMatch = this.checkPaymentTerms(proposal);
      if (!termsMatch.valid && termsMatch.issue) {
        issues.push(termsMatch.issue);
      }
      
      // Check 2: Pricing within acceptable margins
      const pricingCheck = this.checkPricing(proposal);
      if (!pricingCheck.valid && pricingCheck.issue) {
        if (pricingCheck.severity === 'error') {
          issues.push(pricingCheck.issue);
        } else {
          warnings.push(pricingCheck.issue);
        }
      }
      
      // Check 3: Required fields present
      const fieldsCheck = this.checkRequiredFields(proposal);
      if (!fieldsCheck.valid) {
        issues.push(...fieldsCheck.issues);
      }
      
      // Check 4: Credit approval for terms
      const creditCheck = this.checkCreditApproval(proposal);
      if (!creditCheck.valid && creditCheck.issue) {
        warnings.push(creditCheck.issue);
      }
      
      const compliant = issues.length === 0;
      const approved = compliant && warnings.length === 0;
      
      // Log verification
      await this.logAction('verify_proposal', { proposalId }, {
        compliant,
        issues,
        warnings,
        approved,
      });
      
      // Update proposal if approved
      if (approved) {
        await sql`
          UPDATE proposals
          SET credit_approved = true
          WHERE id = ${proposalId}
        `;
      }
      
      console.log(`[${this.name}] ${approved ? '✅' : '⚠️'} Proposal ${compliant ? 'compliant' : 'has issues'}`);
      
      return {
        compliant,
        issues,
        warnings,
        approved,
      };
    } catch (error) {
      console.error(`[${this.name}] ❌ Error verifying proposal:`, error);
      throw error;
    }
  }
  
  /**
   * Check if payment terms match credit score
   */
  private checkPaymentTerms(proposal: any): { valid: boolean; issue?: string } {
    const creditScore = proposal.credit_score || 0;
    const proposedTerms = proposal.payment_terms;
    
    let recommendedTerms: string;
    
    if (creditScore >= 80) {
      recommendedTerms = 'net-30';
    } else if (creditScore >= 65) {
      recommendedTerms = 'net-15';
    } else {
      recommendedTerms = 'prepay';
    }
    
    // More lenient terms than recommended is an issue
    const termsHierarchy: Record<string, number> = { 'prepay': 0, 'net-15': 1, 'net-30': 2 };
    const proposedLevel = termsHierarchy[proposedTerms as string] ?? 0;
    const recommendedLevel = termsHierarchy[recommendedTerms] ?? 0;
    
    if (proposedLevel > recommendedLevel) {
      return {
        valid: false,
        issue: `Payment terms (${proposedTerms}) exceed credit risk tolerance. ` +
          `Credit score ${creditScore} recommends ${recommendedTerms}.`,
      };
    }
    
    return { valid: true };
  }
  
  /**
   * Check pricing and margins
   */
  private checkPricing(proposal: any): {
    valid: boolean;
    issue?: string;
    severity?: 'error' | 'warning';
  } {
    const margin = proposal.margin || 0;
    
    // Minimum margin threshold
    if (margin < 15) {
      return {
        valid: false,
        issue: `Margin too low (${margin}%). Minimum 15% required for profitability.`,
        severity: 'error',
      };
    }
    
    // Warning for low margins
    if (margin < 20) {
      return {
        valid: false,
        issue: `Margin (${margin}%) below target. Consider 20%+ for optimal profitability.`,
        severity: 'warning',
      };
    }
    
    return { valid: true };
  }
  
  /**
   * Check required fields
   */
  private checkRequiredFields(proposal: any): {
    valid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    const requiredFields = [
      'title',
      'custom_message',
      'product_ids',
      'unit_price',
      'total_price',
      'payment_terms',
      'delivery_timeline',
    ];
    
    for (const field of requiredFields) {
      if (!proposal[field] || (Array.isArray(proposal[field]) && proposal[field].length === 0)) {
        issues.push(`Missing required field: ${field}`);
      }
    }
    
    return {
      valid: issues.length === 0,
      issues,
    };
  }
  
  /**
   * Check credit approval requirements
   */
  private checkCreditApproval(proposal: any): {
    valid: boolean;
    issue?: string;
  } {
    const creditScore = proposal.credit_score || 0;
    const totalPrice = proposal.total_price || 0;
    
    // High-value deals require explicit credit approval
    if (totalPrice > 10000 && creditScore < 70) {
      return {
        valid: false,
        issue: `High-value proposal ($${totalPrice}) with marginal credit (${creditScore}). ` +
          'Manual credit review recommended.',
      };
    }
    
    return { valid: true };
  }
  
  /**
   * Audit trail for all proposals
   */
  async getAuditTrail(proposalId: string): Promise<any[]> {
    try {
      const result = await sql`
        SELECT 
          agent_name,
          action,
          input_data,
          output_data,
          success,
          created_at
        FROM agent_logs
        WHERE proposal_id = ${proposalId}
        ORDER BY created_at ASC
      `;
      
      return result.rows;
    } catch (error) {
      console.error(`[${this.name}] Error fetching audit trail:`, error);
      throw error;
    }
  }
  
  /**
   * Get compliance summary
   */
  async getComplianceSummary(): Promise<{
    total_proposals: number;
    compliant: number;
    non_compliant: number;
    pending_review: number;
    compliance_rate: number;
  }> {
    try {
      const result = await sql`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN credit_approved = true THEN 1 END) as approved,
          COUNT(CASE WHEN status = 'draft' THEN 1 END) as pending
        FROM proposals
        WHERE created_at > CURRENT_DATE - INTERVAL '30 days'
      `;
      
      const data = result.rows[0] as any;
      const total = parseInt(data.total) || 0;
      const approved = parseInt(data.approved) || 0;
      const pending = parseInt(data.pending) || 0;
      
      return {
        total_proposals: total,
        compliant: approved,
        non_compliant: total - approved - pending,
        pending_review: pending,
        compliance_rate: total > 0 ? Math.round((approved / total) * 100) : 0,
      };
    } catch (error) {
      console.error(`[${this.name}] Error fetching compliance summary:`, error);
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
          proposal_id,
          input_data,
          output_data,
          success
        ) VALUES (
          ${this.name},
          ${action},
          ${inputData.proposalId || null},
          ${JSON.stringify(inputData)},
          ${outputData ? JSON.stringify(outputData) : null},
          ${outputData !== null && outputData.compliant}
        )
      `;
    } catch (error) {
      console.error(`[${this.name}] Error logging action:`, error);
    }
  }
}

// Export singleton instance
export default new ComplianceAgent();
