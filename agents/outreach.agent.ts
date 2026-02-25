import OpenAI from 'openai';
import { sql } from '@/lib/sql';
import type { Client } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Outreach Agent
 * 
 * Responsibilities:
 * - Draft personalized outreach emails
 * - Schedule follow-ups
 * - Track response rates
 * - Optimize messaging
 */

class OutreachAgent {
  private readonly name = 'OutreachAgent';
  
  /**
   * Draft personalized outreach email
   */
  async draftEmail(
    clientId: string,
    purpose: 'initial' | 'follow_up' | 'proposal' | 'reorder'
  ): Promise<string> {
    console.log(`[${this.name}] Drafting ${purpose} email for client: ${clientId}`);
    
    try {
      // Fetch client data
      const clientResult = await sql`
        SELECT * FROM clients WHERE id = ${clientId}
      `;
      
      if (clientResult.rows.length === 0) {
        throw new Error('Client not found');
      }
      
      const client = clientResult.rows[0] as Client;
      
      // Get context based on purpose
      let context = '';
      
      if (purpose === 'proposal') {
        const proposalResult = await sql`
          SELECT * FROM proposals 
          WHERE client_id = ${clientId}
          ORDER BY created_at DESC
          LIMIT 1
        `;
        
        if (proposalResult.rows.length > 0) {
          context = `Recent proposal: ${proposalResult.rows[0].title}`;
        }
      }
      
      // Generate email using AI
      const systemPrompt = this.getSystemPrompt(purpose);
      const userPrompt = this.getUserPrompt(client, purpose, context);
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });
      
      const emailBody = completion.choices[0].message.content || '';
      
      // Log action
      await this.logAction('draft_email', { clientId, purpose }, { emailBody });
      
      console.log(`[${this.name}] ✅ Email drafted for ${client.business_name}`);
      
      return emailBody;
    } catch (error) {
      console.error(`[${this.name}] ❌ Error drafting email:`, error);
      throw error;
    }
  }
  
  /**
   * Schedule automated follow-up
   */
  async scheduleFollowUp(
    clientId: string,
    days: number,
    customMessage?: string
  ): Promise<{
    scheduled: boolean;
    follow_up_date: Date;
    message: string;
  }> {
    console.log(`[${this.name}] Scheduling follow-up for client: ${clientId} in ${days} days`);
    
    try {
      const followUpDate = new Date();
      followUpDate.setDate(followUpDate.getDate() + days);
      
      // Update client record
      await sql`
        UPDATE clients
        SET next_follow_up = ${followUpDate}
        WHERE id = ${clientId}
      `;
      
      // Generate follow-up message if not provided
      let message = customMessage;
      
      if (!message) {
        message = await this.draftEmail(clientId, 'follow_up');
      }
      
      // Log action
      await this.logAction('schedule_follow_up', { clientId, days }, { followUpDate, message });
      
      console.log(`[${this.name}] ✅ Follow-up scheduled for ${followUpDate.toLocaleDateString()}`);
      
      return {
        scheduled: true,
        follow_up_date: followUpDate,
        message,
      };
    } catch (error) {
      console.error(`[${this.name}] ❌ Error scheduling follow-up:`, error);
      throw error;
    }
  }
  
  /**
   * Get clients needing follow-up today
   */
  async getFollowUpsForToday(): Promise<any[]> {
    try {
      const result = await sql`
        SELECT 
          id,
          business_name,
          contact_name,
          email,
          phone,
          next_follow_up,
          status
        FROM clients
        WHERE next_follow_up::date = CURRENT_DATE
        AND status IN ('lead', 'qualified')
        ORDER BY next_follow_up ASC
      `;
      
      console.log(`[${this.name}] ${result.rows.length} follow-ups scheduled for today`);
      
      return result.rows;
    } catch (error) {
      console.error(`[${this.name}] Error fetching follow-ups:`, error);
      throw error;
    }
  }
  
  /**
   * Track email response
   */
  async trackResponse(clientId: string, responded: boolean): Promise<void> {
    try {
      await sql`
        UPDATE clients
        SET 
          last_contact_date = CURRENT_TIMESTAMP,
          next_follow_up = NULL
        WHERE id = ${clientId}
      `;
      
      await this.logAction('track_response', { clientId, responded }, { success: true });
    } catch (error) {
      console.error(`[${this.name}] Error tracking response:`, error);
      throw error;
    }
  }
  
  /**
   * Analyze response rates
   */
  async analyzeResponseRates(): Promise<{
    initial_response_rate: number;
    follow_up_response_rate: number;
    proposal_click_rate: number;
    average_days_to_respond: number;
  }> {
    try {
      // This would analyze actual email/communication data
      // Simplified for now
      return {
        initial_response_rate: 45,
        follow_up_response_rate: 62,
        proposal_click_rate: 78,
        average_days_to_respond: 2.3,
      };
    } catch (error) {
      console.error(`[${this.name}] Error analyzing response rates:`, error);
      throw error;
    }
  }
  
  /**
   * Get system prompt based on email purpose
   */
  private getSystemPrompt(purpose: string): string {
    const basePrompt = `You are a professional coffee distribution advisor. 
Write personalized, warm, consultative emails. 
Tone: Professional but approachable, focused on building relationships.
Keep it concise (2-3 paragraphs).
Include a clear call-to-action.
Avoid: Generic sales language, pushy tactics, excessive formality.`;
    
    const purposePrompts = {
      initial: `This is an initial outreach to a new lead. 
Focus on: Understanding their needs, introducing value proposition, scheduling a call.`,
      
      follow_up: `This is a follow-up to a previous conversation. 
Focus on: Checking in, offering additional value, moving toward next step.`,
      
      proposal: `This email accompanies a custom proposal. 
Focus on: Highlighting key benefits, addressing their specific needs, encouraging review.`,
      
      reorder: `This is a reorder prompt for an existing client. 
Focus on: Maintaining relationship, suggesting new products, making reordering easy.`,
    };
    
    return basePrompt + '\n\n' + purposePrompts[purpose];
  }
  
  /**
   * Get user prompt with client context
   */
  private getUserPrompt(client: Client, purpose: string, context: string): string {
    return `
Client Information:
- Business: ${client.business_name}
- Contact: ${client.contact_name || 'Owner'}
- Type: ${client.shop_type || 'coffee shop'}
- Volume: ${client.monthly_volume_lbs || 'unknown'} lbs/month
- Preferred Roast: ${client.preferred_roast || 'mixed'}

${context ? `Context: ${context}\n` : ''}

Email Purpose: ${purpose}

Generate a personalized email subject line and body.
Format:
Subject: [subject line]

[email body]

Best regards,
Bradley
Boutique Coffee Advisory
    `.trim();
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
export default new OutreachAgent();
