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
import { CompanyResearchAgent } from './company-research-agent';
import { ContactValidationAgent } from './contact-validation-agent';
import { ContractAgent } from './contract-agent';
import { FundingStructureAgent } from './funding-structure-agent';
import { InstrumentVerificationAgent } from './instrument-verification-agent';
import { SettlementRailAgent } from './settlement-rail-agent';

const companyResearchAgent = new CompanyResearchAgent();
const contactValidationAgent = new ContactValidationAgent();
const contractAgent = new ContractAgent();
const fundingStructureAgent = new FundingStructureAgent();
const instrumentVerificationAgent = new InstrumentVerificationAgent();
const settlementRailAgent = new SettlementRailAgent();

// Create MCP server
const server = new Server(
  {
    name: 'fth-trading-platform',
    version: '3.0.0',
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
      
      // === Enterprise Sales Intelligence Tools ===

      // Company Research
      {
        name: 'research_company',
        description: 'Research a company from its public website. Extracts company info and explicitly listed contacts only. Lawful sources only — no email guessing.',
        inputSchema: {
          type: 'object',
          properties: {
            website_url: { type: 'string', description: 'Full URL of the company website (e.g. https://example.com)' },
            target_commodities: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of commodities to check relevance for (e.g. ["crude oil", "copper"])'
            },
          },
          required: ['website_url'],
        },
      },

      // Contact Validation
      {
        name: 'validate_contact',
        description: 'Validate an email address and check consent status before any outreach',
        inputSchema: {
          type: 'object',
          properties: {
            email: { type: 'string', description: 'Email address to validate' },
            contact_id: { type: 'string', description: 'Optional CRM contact UUID for consent check' },
          },
          required: ['email'],
        },
      },

      // Contract Generation
      {
        name: 'generate_contract',
        description: 'Generate a contract (NCNDA, Supply Agreement, etc.) with eSignature link',
        inputSchema: {
          type: 'object',
          properties: {
            contract_type: { type: 'string', enum: ['NCNDA', 'Supply Agreement', 'Offtake Agreement', 'MOU', 'Broker Agreement'] },
            party_b_name: { type: 'string', description: 'Legal name of counterparty company' },
            party_b_signatory: { type: 'string', description: 'Full name of authorised signatory' },
            party_b_email: { type: 'string', description: 'Signatory email address' },
            commodity: { type: 'string', description: 'Commodity covered by the agreement' },
            governing_law: { type: 'string', description: 'Governing jurisdiction (e.g. England and Wales)' },
            deal_value: { type: 'number', description: 'Optional deal value in USD' },
            special_terms: { type: 'string', description: 'Any additional special terms to include' },
          },
          required: ['contract_type', 'party_b_name', 'party_b_email', 'commodity'],
        },
      },

      // AI Outreach Draft
      {
        name: 'draft_crm_outreach_email',
        description: 'Generate an AI-drafted personalised outreach email for a CRM contact. Returns draft only — does NOT send. Consent is checked first.',
        inputSchema: {
          type: 'object',
          properties: {
            contact_id: { type: 'string', description: 'CRM contact UUID' },
            outreach_type: { type: 'string', enum: ['initial_outreach', 'follow_up', 'contract_follow_up', 'commodity_update'], description: 'Type of outreach' },
            context: { type: 'string', description: 'Optional context or talking points to include in the email' },
          },
          required: ['contact_id'],
        },
      },

      // === Funding Layer Tools ===

      {
        name: 'propose_funding_structure',
        description: 'Analyze a trade deal and propose an optimal funding instrument pack. Returns a non-binding Funding Term Sheet. Platform is an ORCHESTRATOR only — does not issue instruments.',
        inputSchema: {
          type: 'object',
          properties: {
            deal_id: { type: 'string', description: 'Deal UUID' },
            deal_value: { type: 'number', description: 'Deal value in base currency' },
            currency: { type: 'string', description: 'ISO currency code (e.g. USD)' },
            commodity: { type: 'string', description: 'Commodity being traded' },
            jurisdiction: { type: 'string', description: "Buyer's jurisdiction" },
            counterparty_jurisdiction: { type: 'string', description: "Seller's jurisdiction" },
            incoterms: { type: 'string', description: 'Incoterms (e.g. CIF, FOB, DDP)' },
            risk_notes: { type: 'string', description: 'Optional risk context' },
            persist_requirements: { type: 'boolean', description: 'If true, save generated requirements to DB' },
          },
          required: ['deal_id', 'deal_value', 'commodity', 'jurisdiction'],
        },
      },

      {
        name: 'verify_instrument',
        description: 'Run automated consistency checks on a banking instrument (SBLC, LC, etc.). ALWAYS returns humanReviewRequired=true. Status can only advance to PENDING_HUMAN_REVIEW — never VERIFIED autonomously.',
        inputSchema: {
          type: 'object',
          properties: {
            instrument_id: { type: 'string', description: 'Instrument UUID from funding_instruments table' },
            raw_swift_text: { type: 'string', description: 'Raw MT message text for parsing (optional)' },
            expected_amount: { type: 'number', description: 'Expected instrument amount for cross-check' },
            expected_currency: { type: 'string', description: 'Expected currency code' },
            expected_beneficiary: { type: 'string', description: 'Expected beneficiary name fragment' },
            expected_issuing_bic: { type: 'string', description: 'Expected issuing bank BIC' },
          },
          required: ['instrument_id'],
        },
      },

      {
        name: 'generate_settlement_instructions',
        description: 'Generate FIAT, XRPL, or Stellar settlement instructions for a deal. XRPL/Stellar are audit and settlement rails — not replacements for banking instruments. Includes no-funds-lost validation checklist.',
        inputSchema: {
          type: 'object',
          properties: {
            deal_id: { type: 'string', description: 'Deal UUID' },
            rail: { type: 'string', enum: ['FIAT', 'XRPL', 'STELLAR'], description: 'Settlement rail type' },
            instrument_id: { type: 'string', description: 'Optional linked instrument UUID' },
            amount: { type: 'number', description: 'Settlement amount' },
            currency: { type: 'string', description: 'Currency / asset code' },
            beneficiary_name: { type: 'string', description: 'FIAT: beneficiary name' },
            swift_bic: { type: 'string', description: 'FIAT: SWIFT BIC' },
            destination_address: { type: 'string', description: 'XRPL/Stellar: destination address' },
            memo: { type: 'string', description: 'Stellar: memo text' },
            asset_issuer: { type: 'string', description: 'Stellar: asset issuer for non-XLM assets' },
          },
          required: ['deal_id', 'rail', 'amount'],
        },
      },

      {
        name: 'anchor_proof',
        description: 'Anchor a SHA-256 hash of a document/object to XRPL and/or Stellar for audit-grade immutable evidence. Does not transfer funds — creates tamper-evident timestamp proof only.',
        inputSchema: {
          type: 'object',
          properties: {
            deal_id: { type: 'string', description: 'Optional deal UUID for association' },
            object_type: { type: 'string', enum: ['INSTRUMENT', 'CONTRACT', 'MILESTONE', 'BANK_MESSAGE'], description: 'Type of object being anchored' },
            object_id: { type: 'string', description: 'UUID of the record being anchored' },
            object_data: { type: 'object', description: 'The canonical data to hash and anchor' },
            chains: { type: 'array', items: { type: 'string', enum: ['XRPL', 'STELLAR'] }, description: 'Which chains to anchor to (default: ["XRPL"])' },
          },
          required: ['object_type', 'object_id', 'object_data'],
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
  const { name, arguments: rawArgs } = request.params;
  const args: Record<string, unknown> = rawArgs ?? {};
  
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
      
      case 'research_company': {
        const result = await companyResearchAgent.researchCompany(
          args.website_url as string,
          (args.target_commodities as string[]) || []
        );
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'validate_contact': {
        const result = await contactValidationAgent.validateEmail(
          args.email as string,
          args.contact_id as string | undefined
        );
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'generate_contract': {
        const result = await contractAgent.generateContract({
          contract_type: args.contract_type as any,
          party_b_name: args.party_b_name as string,
          party_b_signatory: (args.party_b_signatory as string) || '',
          party_b_email: args.party_b_email as string,
          commodity: args.commodity as string,
          governing_law: (args.governing_law as string) || 'England and Wales',
          deal_value_usd: args.deal_value as number | undefined,
          special_terms: args.special_terms as string | undefined,
          created_by: (args.created_by as string) || 'mcp-agent',
        } as any);
        // Return safe summary (exclude full HTML)
        const { document_html: _, ...summary } = result;
        return {
          content: [{ type: 'text', text: JSON.stringify(summary, null, 2) }],
        };
      }

      case 'draft_crm_outreach_email': {
        // POST to the outreach API to get an AI draft (respects consent)
        const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
        const res = await fetch(`${baseUrl}/api/outreach`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'draft',
            contact_id: args.contact_id,
            outreach_type: args.outreach_type || 'initial_outreach',
            context: args.context,
          }),
        });
        const data = await res.json();
        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        };
      }

      case 'propose_funding_structure': {
        const termSheet = await fundingStructureAgent.analyze({
          dealId: args.deal_id as string,
          dealValue: args.deal_value as number,
          currency: (args.currency as string) || 'USD',
          commodity: args.commodity as string,
          jurisdiction: args.jurisdiction as string,
          counterpartyJurisdiction: args.counterparty_jurisdiction as string | undefined,
          incoterms: args.incoterms as string | undefined,
          riskNotes: args.risk_notes as string | undefined,
        });
        if (args.persist_requirements) {
          await fundingStructureAgent.persistRequirements(args.deal_id as string, termSheet);
        }
        return { content: [{ type: 'text', text: JSON.stringify(termSheet, null, 2) }] };
      }

      case 'verify_instrument': {
        const result = await instrumentVerificationAgent.verify({
          instrumentId: args.instrument_id as string,
          rawSwiftText: args.raw_swift_text as string | undefined,
          expectedAmount: args.expected_amount as number | undefined,
          expectedCurrency: args.expected_currency as string | undefined,
          expectedBeneficiary: args.expected_beneficiary as string | undefined,
          expectedIssuingBic: args.expected_issuing_bic as string | undefined,
        });
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'generate_settlement_instructions': {
        const rail = args.rail as string;
        let instructions;
        if (rail === 'FIAT') {
          instructions = settlementRailAgent.buildFiatInstructions({
            dealId: args.deal_id as string,
            beneficiaryName: (args.beneficiary_name as string) || '',
            beneficiaryAccount: '',
            beneficiaryBank: '',
            swiftBic: (args.swift_bic as string) || '',
            amount: args.amount as number,
            currency: (args.currency as string) || 'USD',
          });
        } else if (rail === 'XRPL') {
          instructions = settlementRailAgent.buildXrplInstructions({
            destinationAddress: (args.destination_address as string) || '',
            amount: args.amount as number,
            currency: args.currency as string | undefined,
          });
        } else {
          instructions = settlementRailAgent.buildStellarInstructions({
            destinationAddress: (args.destination_address as string) || '',
            amount: String(args.amount),
            assetCode: args.currency as string | undefined,
            assetIssuer: args.asset_issuer as string | undefined,
            memo: args.memo as string | undefined,
          });
        }
        const settlementId = await settlementRailAgent.persistSettlement(
          args.deal_id as string,
          instructions,
          args.instrument_id as string | undefined
        );
        return { content: [{ type: 'text', text: JSON.stringify({ settlementId, instructions }, null, 2) }] };
      }

      case 'anchor_proof': {
        const result = await settlementRailAgent.anchorProof({
          dealId: args.deal_id as string | undefined,
          objectType: args.object_type as string,
          objectId: args.object_id as string,
          objectData: args.object_data,
          chains: (args.chains as ('XRPL' | 'STELLAR')[]) || ['XRPL'],
        });
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

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
  
  console.error('🏦 FTH Trading Platform MCP Server running');
  console.error('Agents: Proposal | Credit | Supplier | Outreach | Compliance | CompanyResearch | ContactValidation | Contract | FundingStructure | InstrumentVerification | SettlementRail');
}

main().catch((error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});
