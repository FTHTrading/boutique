import OpenAI from 'openai';
import { sql } from '@/lib/sql';
import { findSimilarProposals, indexProposal } from './rag';
import type { Client, Product, ProposalGenerationRequest, ProposalGenerationResponse } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? 'build-placeholder',
});

/**
 * AI-Powered Proposal Generator
 * 
 * Uses RAG to retrieve similar successful proposals
 * Generates custom messaging based on client profile
 * Adapts pricing and terms based on credit score
 */

export interface ProposalContext {
  client: Client;
  products: Product[];
  creditScore: number;
  similarProposals: any[];
}

/**
 * Generate custom proposal message
 */
async function generateCustomMessage(context: ProposalContext): Promise<string> {
  const { client, products, creditScore, similarProposals } = context;
  
  // Build context from similar proposals
  const similarContext = similarProposals
    .map(p => `Example: ${p.content.substring(0, 300)}...`)
    .join('\n\n');
  
  const systemPrompt = `You are an expert coffee distribution advisor. 
Generate a personalized proposal introduction for a coffee shop client.

Tone: Professional, warm, consultative
Focus: Quality, sustainability, partnership
Length: 2-3 paragraphs

Include:
- Personalized greeting
- Understanding of their needs
- Value proposition
- Regenerative sourcing highlight
- Call to action

Avoid: Generic sales language, aggressive upselling`;
  
  const userPrompt = `
Client: ${client.business_name}
Type: ${client.shop_type}
Volume: ${client.monthly_volume_lbs} lbs/month
Roast Preference: ${client.preferred_roast}
Credit Score: ${creditScore}

Products Being Offered:
${products.map(p => `- ${p.name} (${p.roast_level} roast from ${p.origin_region})`).join('\n')}

Previous Successful Proposals:
${similarContext}

Generate a compelling, personalized proposal introduction.
  `;
  
  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.8,
    max_tokens: 500,
  });
  
  return completion.choices[0].message.content || '';
}

/**
 * Calculate pricing based on volume tier and credit
 */
function calculatePricing(
  products: Product[],
  volumeTier: 'low' | 'mid' | 'high',
  creditScore: number
): {
  unitPrice: number;
  totalPrice: number;
  margin: number;
  discount: number;
} {
  const basePrice = products.reduce((sum, p) => sum + p.wholesale_price, 0) / products.length;
  
  // Volume discount
  const volumeDiscount = {
    low: 0,
    mid: 0.05,  // 5%
    high: 0.10, // 10%
  }[volumeTier];
  
  // Credit discount (better terms for better credit)
  const creditDiscount = creditScore >= 80 ? 0.02 : 0;
  
  const totalDiscount = volumeDiscount + creditDiscount;
  const unitPrice = basePrice * (1 - totalDiscount);
  const totalPrice = unitPrice * 100; // Assuming 100 lbs initial order
  
  // Calculate margin
  const cost = basePrice * 0.7; // Assuming 70% cost
  const margin = ((unitPrice - cost) / unitPrice) * 100;
  
  return {
    unitPrice: Math.round(unitPrice * 100) / 100,
    totalPrice: Math.round(totalPrice * 100) / 100,
    margin: Math.round(margin * 10) / 10,
    discount: Math.round(totalDiscount * 100),
  };
}

/**
 * Generate complete proposal
 */
export async function generateProposal(
  request: ProposalGenerationRequest
): Promise<ProposalGenerationResponse> {
  try {
    // Fetch client data
    const clientResult = await sql`
      SELECT * FROM clients WHERE id = ${request.clientId}
    `;
    
    if (clientResult.rows.length === 0) {
      throw new Error('Client not found');
    }
    
    const client = clientResult.rows[0] as Client;
    
    // Fetch matching products
    const roastFilter = request.roastProfile || client.preferred_roast || 'medium';
    const productsResult = await sql`
      SELECT * FROM products 
      WHERE roast_level = ${roastFilter}
      AND active = true
      ${request.originRegion ? sql`AND origin_region = ${request.originRegion}` : sql``}
      LIMIT 3
    `;
    
    const products = productsResult.rows as Product[];
    
    if (products.length === 0) {
      throw new Error('No matching products found');
    }
    
    // Retrieve similar successful proposals using RAG
    const similarProposals = await findSimilarProposals(
      client.shop_type || 'boutique',
      client.monthly_volume_lbs || 100,
      roastFilter,
      3
    );
    
    // Generate custom message using AI
    const customMessage = await generateCustomMessage({
      client,
      products,
      creditScore: client.credit_score || 50,
      similarProposals,
    });
    
    // Calculate pricing
    const volumeTier = request.volumeTier || 
      ((client.monthly_volume_lbs || 0) > 500 ? 'high' :
       (client.monthly_volume_lbs || 0) > 100 ? 'mid' : 'low');
    
    const pricing = calculatePricing(products, volumeTier, client.credit_score || 50);
    
    // Determine payment terms
    const paymentTerms = request.paymentTerms || client.payment_terms || 'prepay';
    
    // Generate proposal number
    const proposalNumber = `PROP-${Date.now()}-${client.business_name.substring(0, 3).toUpperCase()}`;
    
    // Insert into database
    const proposalResult = await sql`
      INSERT INTO proposals (
        proposal_number,
        client_id,
        title,
        custom_message,
        product_ids,
        volume_tier,
        total_volume_lbs,
        unit_price,
        total_price,
        margin,
        payment_terms,
        delivery_timeline,
        status,
        generated_by,
        agent_confidence,
        rag_sources
      ) VALUES (
        ${proposalNumber},
        ${request.clientId},
        ${`Coffee Proposal for ${client.business_name}`},
        ${customMessage},
        ${products.map(p => p.id)},
        ${volumeTier},
        ${100}, -- Initial order
        ${pricing.unitPrice},
        ${pricing.totalPrice},
        ${pricing.margin},
        ${paymentTerms},
        ${'Delivery within 5-7 business days from our NY warehouse'},
        ${'draft'},
        ${'ProposalAgent'},
        ${0.85 + (similarProposals.length * 0.05)},
        ${JSON.stringify(similarProposals.map(p => ({
          document_id: p.id,
          similarity_score: p.similarity,
        })))}
      )
      RETURNING *
    `;
    
    const proposal = proposalResult.rows[0];
    
    // Index proposal for future RAG retrieval
    await indexProposal(proposal.id, client.id, {
      title: proposal.title,
      custom_message: customMessage,
      products: products.map(p => p.name),
      pricing,
      terms: paymentTerms,
    });
    
    // Generate URLs (these would be actual PDF/web generation in production)
    const pdfUrl = `/api/proposals/${proposal.id}/pdf`;
    const webUrl = `/proposals/${proposal.id}`;
    
    // Update URLs in database
    await sql`
      UPDATE proposals 
      SET pdf_url = ${pdfUrl}, web_url = ${webUrl}
      WHERE id = ${proposal.id}
    `;
    
    // Generate email HTML (simplified)
    const emailHtml = `
      <h2>Custom Coffee Proposal for ${client.business_name}</h2>
      <div>${customMessage}</div>
      <h3>Pricing</h3>
      <p>Unit Price: $${pricing.unitPrice}/lb</p>
      <p>Total: $${pricing.totalPrice}</p>
      <p>Terms: ${paymentTerms}</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}${webUrl}">View Full Proposal</a>
    `;
    
    return {
      proposalId: proposal.id,
      pdfUrl,
      webUrl,
      emailHtml,
      confidence: proposal.agent_confidence,
      ragSources: similarProposals.map(p => ({
        document_id: p.id,
        similarity_score: p.similarity ?? 0,
        excerpt: p.content.substring(0, 200),
      })),
    };
    
  } catch (error) {
    console.error('Error generating proposal:', error);
    throw error;
  }
}

/**
 * Regenerate proposal with modifications
 */
export async function regenerateProposal(
  proposalId: string,
  modifications: Partial<ProposalGenerationRequest>
): Promise<ProposalGenerationResponse> {
  // Fetch existing proposal
  const existingResult = await sql`
    SELECT * FROM proposals WHERE id = ${proposalId}
  `;
  
  if (existingResult.rows.length === 0) {
    throw new Error('Proposal not found');
  }
  
  const existing = existingResult.rows[0];
  
  // Create new request with modifications
  const newRequest: ProposalGenerationRequest = {
    clientId: existing.client_id,
    volumeTier: modifications.volumeTier || existing.volume_tier,
    roastProfile: modifications.roastProfile,
    paymentTerms: modifications.paymentTerms || existing.payment_terms,
    originRegion: modifications.originRegion,
    customMessage: modifications.customMessage,
    brandingProfile: modifications.brandingProfile,
  };
  
  // Generate new proposal
  const newProposal = await generateProposal(newRequest);
  
  // Link to parent
  await sql`
    UPDATE proposals 
    SET parent_proposal_id = ${proposalId},
        version = ${existing.version + 1}
    WHERE id = ${newProposal.proposalId}
  `;
  
  return newProposal;
}

export default {
  generateProposal,
  regenerateProposal,
};
