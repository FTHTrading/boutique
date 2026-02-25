import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

/**
 * MCP Server for Coffee Advisory OS
 * 
 * Manages orchestration of all agents:
 * - ProposalAgent
 * - CreditRiskAgent
 * - SupplierOriginAgent
 * - OutreachAgent
 * - ComplianceAgent
 * 
 * Provides unified tool interface for external systems
 */

// Import agent modules
import ProposalAgent from './proposal.agent';
import CreditAgent from './credit.agent';
import SupplierAgent from './supplier.agent';
import OutreachAgent from './outreach.agent';
import ComplianceAgent from './compliance.agent';

// Create MCP server
const server = new Server(
  {
    name: 'coffee-advisory-os',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Register available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Proposal Agent Tools
      {
        name: 'generate_proposal',
        description: 'Generate a custom AI-powered proposal for a coffee shop client',
        inputSchema: {
          type: 'object',
          properties: {
            clientId: { type: 'string', description: 'Client UUID' },
            volumeTier: { 
              type: 'string', 
              enum: ['low', 'mid', 'high'],
              description: 'Volume tier for pricing' 
            },
            roastProfile: { 
              type: 'string',
              enum: ['light', 'medium', 'dark', 'mixed'],
              description: 'Preferred roast profile'
            },
            paymentTerms: {
              type: 'string',
              enum: ['net-30', 'net-15', 'prepay'],
              description: 'Payment terms'
            },
            originRegion: {
              type: 'string',
              description: 'Coffee origin region (e.g., brazil-cerrado)'
            },
          },
          required: ['clientId'],
        },
      },
      
      // Credit Risk Agent Tools
      {
        name: 'score_credit',
        description: 'Calculate credit score and risk assessment for a client',
        inputSchema: {
          type: 'object',
          properties: {
            clientId: { type: 'string', description: 'Client UUID' },
          },
          required: ['clientId'],
        },
      },
      
      // Supplier Origin Agent Tools
      {
        name: 'get_regenerative_certificate',
        description: 'Generate sustainability certificate for a product origin',
        inputSchema: {
          type: 'object',
          properties: {
            lotId: { type: 'string', description: 'Origin lot ID' },
            clientId: { type: 'string', description: 'Client UUID' },
          },
          required: ['lotId'],
        },
      },
      
      // Outreach Agent Tools
      {
        name: 'draft_outreach_email',
        description: 'Generate personalized outreach email for a lead',
        inputSchema: {
          type: 'object',
          properties: {
            clientId: { type: 'string', description: 'Client UUID' },
            purpose: {
              type: 'string',
              enum: ['initial', 'follow_up', 'proposal', 'reorder'],
              description: 'Email purpose'
            },
          },
          required: ['clientId', 'purpose'],
        },
      },
      
      {
        name: 'schedule_follow_up',
        description: 'Schedule automated follow-up for a lead',
        inputSchema: {
          type: 'object',
          properties: {
            clientId: { type: 'string', description: 'Client UUID' },
            days: { type: 'number', description: 'Days until follow-up' },
            message: { type: 'string', description: 'Custom follow-up message' },
          },
          required: ['clientId', 'days'],
        },
      },
      
      // Compliance Agent Tools
      {
        name: 'verify_proposal_compliance',
        description: 'Verify proposal meets legal and policy requirements',
        inputSchema: {
          type: 'object',
          properties: {
            proposalId: { type: 'string', description: 'Proposal UUID' },
          },
          required: ['proposalId'],
        },
      },
      
      // Analytics Tools
      {
        name: 'get_dashboard_metrics',
        description: 'Get real-time dashboard metrics and analytics',
        inputSchema: {
          type: 'object',
          properties: {
            period: {
              type: 'string',
              enum: ['today', 'week', 'month', 'quarter', 'year'],
              description: 'Time period for metrics'
            },
          },
        },
      },
    ],
  };
});

/**
 * Handle tool calls
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    switch (name) {
      case 'generate_proposal':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await ProposalAgent.generateProposal(args as any),
                null,
                2
              ),
            },
          ],
        };
      
      case 'score_credit':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await CreditAgent.scoreClient(args.clientId as string),
                null,
                2
              ),
            },
          ],
        };
      
      case 'get_regenerative_certificate':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await SupplierAgent.generateCertificate(
                  args.lotId as string,
                  args.clientId as string
                ),
                null,
                2
              ),
            },
          ],
        };
      
      case 'draft_outreach_email':
        return {
          content: [
            {
              type: 'text',
              text: await OutreachAgent.draftEmail(
                args.clientId as string,
                args.purpose as any
              ),
            },
          ],
        };
      
      case 'schedule_follow_up':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await OutreachAgent.scheduleFollowUp(
                  args.clientId as string,
                  args.days as number,
                  args.message as string
                ),
                null,
                2
              ),
            },
          ],
        };
      
      case 'verify_proposal_compliance':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await ComplianceAgent.verifyProposal(args.proposalId as string),
                null,
                2
              ),
            },
          ],
        };
      
      case 'get_dashboard_metrics':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await getDashboardMetrics(args.period as any),
                null,
                2
              ),
            },
          ],
        };
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: error instanceof Error ? error.message : 'Unknown error',
          }),
        },
      ],
      isError: true,
    };
  }
});

/**
 * Get dashboard metrics
 */
async function getDashboardMetrics(period: string = 'month') {
  // This would fetch real metrics from database
  // Simplified for now
  return {
    period,
    total_leads: 45,
    qualified_leads: 32,
    active_clients: 18,
    monthly_revenue: 45000,
    monthly_revenue_change: 12.5,
    average_deal_size: 2500,
    conversion_rate: 71,
    proposals_sent: 28,
    proposals_accepted: 20,
  };
}

/**
 * Start MCP server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error('☕ Coffee Advisory OS MCP Server running');
  console.error('Agents: Proposal | Credit | Supplier | Outreach | Compliance');
}

main().catch((error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});
