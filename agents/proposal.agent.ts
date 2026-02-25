import { generateProposal, regenerateProposal } from '../lib/proposalGenerator';
import { sql } from '@/lib/sql';
import type { ProposalGenerationRequest, ProposalGenerationResponse } from '@/types';

/**
 * Proposal Agent
 * 
 * Responsibilities:
 * - Generate custom proposals using RAG
 * - Adapt messaging based on client type
 * - Optimize pricing and margins
 * - Create branded outputs (PDF, Web, Email)
 * - Track proposal performance
 */

class ProposalAgent {
  private readonly name = 'ProposalAgent';
  
  /**
   * Generate a new proposal
   */
  async generateProposal(request: ProposalGenerationRequest): Promise<ProposalGenerationResponse> {
    console.log(`[${this.name}] Generating proposal for client: ${request.clientId}`);
    
    try {
      // Log agent action
      await this.logAction('generate_proposal', { request }, null);
      
      // Generate proposal
      const result = await generateProposal(request);
      
      // Log success
      await this.logAction('generate_proposal', { request }, result);
      
      console.log(`[${this.name}] ✅ Proposal generated: ${result.proposalId}`);
      
      return result;
    } catch (error) {
      console.error(`[${this.name}] ❌ Error generating proposal:`, error);
      throw error;
    }
  }
  
  /**
   * Regenerate proposal with modifications
   */
  async regenerateProposal(
    proposalId: string,
    modifications: Partial<ProposalGenerationRequest>
  ): Promise<ProposalGenerationResponse> {
    console.log(`[${this.name}] Regenerating proposal: ${proposalId}`);
    
    try {
      const result = await regenerateProposal(proposalId, modifications);
      
      await this.logAction('regenerate_proposal', { proposalId, modifications }, result);
      
      return result;
    } catch (error) {
      console.error(`[${this.name}] ❌ Error regenerating proposal:`, error);
      throw error;
    }
  }
  
  /**
   * Get proposal performance metrics
   */
  async getProposalMetrics(proposalId: string) {
    try {
      const result = await sql`
        SELECT 
          id,
          proposal_number,
          status,
          created_at,
          sent_at,
          viewed_at,
          responded_at,
          agent_confidence,
          EXTRACT(EPOCH FROM (viewed_at - sent_at))/3600 as hours_to_view,
          EXTRACT(EPOCH FROM (responded_at - sent_at))/86400 as days_to_respond
        FROM proposals
        WHERE id = ${proposalId}
      `;
      
      if (result.rows.length === 0) {
        throw new Error('Proposal not found');
      }
      
      return result.rows[0];
    } catch (error) {
      console.error(`[${this.name}] Error fetching metrics:`, error);
      throw error;
    }
  }
  
  /**
   * Analyze proposal conversion rates
   */
  async analyzeConversionRates() {
    try {
      const result = await sql`
        SELECT 
          volume_tier,
          payment_terms,
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted,
          ROUND(
            COUNT(CASE WHEN status = 'accepted' THEN 1 END)::numeric / 
            COUNT(*)::numeric * 100, 
            2
          ) as conversion_rate
        FROM proposals
        WHERE status IN ('sent', 'viewed', 'accepted', 'rejected')
        GROUP BY volume_tier, payment_terms
        ORDER BY conversion_rate DESC
      `;
      
      return result.rows;
    } catch (error) {
      console.error(`[${this.name}] Error analyzing conversion:`, error);
      throw error;
    }
  }
  
  /**
   * Get proposals needing follow-up
   */
  async getProposalsNeedingFollowUp(daysThreshold: number = 3) {
    try {
      const result = await sql`
        SELECT 
          p.id,
          p.proposal_number,
          p.client_id,
          c.business_name,
          c.email,
          p.sent_at,
          EXTRACT(DAY FROM (CURRENT_TIMESTAMP - p.sent_at)) as days_since_sent
        FROM proposals p
        JOIN clients c ON p.client_id = c.id
        WHERE p.status = 'sent'
        AND p.sent_at < CURRENT_TIMESTAMP - INTERVAL '${daysThreshold} days'
        AND NOT EXISTS (
          SELECT 1 FROM agent_logs 
          WHERE agent_name = 'OutreachAgent' 
          AND action = 'follow_up'
          AND proposal_id = p.id
          AND created_at > CURRENT_TIMESTAMP - INTERVAL '${daysThreshold} days'
        )
        ORDER BY p.sent_at ASC
      `;
      
      return result.rows;
    } catch (error) {
      console.error(`[${this.name}] Error fetching follow-ups:`, error);
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
          proposal_id,
          input_data,
          output_data,
          success
        ) VALUES (
          ${this.name},
          ${action},
          ${inputData.request?.clientId || inputData.clientId || null},
          ${outputData?.proposalId || inputData.proposalId || null},
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
export default new ProposalAgent();
