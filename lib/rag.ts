import OpenAI from 'openai';
import { vectorSearch, upsertDocument } from './db';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? 'build-placeholder',
});

/**
 * RAG (Retrieval Augmented Generation) System
 * 
 * Provides semantic search across all historical:
 * - Proposals
 * - Client communications
 * - Product specs
 * - Sustainability certificates
 * - Contract templates
 */

export interface RAGDocument {
  id: string;
  title: string;
  content: string;
  document_type: string;
  client_id?: string;
  proposal_id?: string;
  similarity?: number;
}

/**
 * Generate embedding for text using OpenAI
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Chunk large text into manageable pieces
 */
export function chunkText(text: string, maxChunkSize: number = 1000): string[] {
  const chunks: string[] = [];
  const paragraphs = text.split('\n\n');
  
  let currentChunk = '';
  
  for (const paragraph of paragraphs) {
    if ((currentChunk + paragraph).length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = paragraph;
    } else {
      currentChunk += '\n\n' + paragraph;
    }
  }
  
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

/**
 * Index a document into the RAG system
 */
export async function indexDocument(
  title: string,
  content: string,
  metadata: {
    document_type: string;
    client_id?: string;
    proposal_id?: string;
    file_url?: string;
  }
): Promise<void> {
  try {
    // Chunk if content is too large
    const chunks = chunkText(content, 1500);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunkTitle = chunks.length > 1 ? `${title} (Part ${i + 1})` : title;
      const embedding = await generateEmbedding(chunks[i]);
      
      await upsertDocument(chunkTitle, chunks[i], embedding, metadata);
    }
    
    console.log(`✅ Indexed document: ${title} (${chunks.length} chunks)`);
  } catch (error) {
    console.error('Error indexing document:', error);
    throw error;
  }
}

/**
 * Retrieve relevant documents based on query
 */
export async function retrieveRelevant(
  query: string,
  limit: number = 5,
  threshold: number = 0.7,
  filters?: {
    document_type?: string;
    client_id?: string;
  }
): Promise<RAGDocument[]> {
  try {
    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query);
    
    // Perform vector search
    const results = await vectorSearch(queryEmbedding, limit, threshold);
    
    // Apply filters if provided
    let filtered = results;
    if (filters) {
      filtered = results.filter(doc => {
        if (filters.document_type && doc.document_type !== filters.document_type) {
          return false;
        }
        if (filters.client_id && doc.client_id !== filters.client_id) {
          return false;
        }
        return true;
      });
    }
    
    return filtered;
  } catch (error) {
    console.error('Error retrieving documents:', error);
    throw error;
  }
}

/**
 * Generate context-aware response using RAG
 */
export async function ragQuery(
  query: string,
  systemPrompt: string,
  options?: {
    maxTokens?: number;
    temperature?: number;
    retrievalLimit?: number;
  }
): Promise<{
  response: string;
  sources: RAGDocument[];
  tokensUsed: number;
}> {
  const { maxTokens = 1000, temperature = 0.7, retrievalLimit = 5 } = options || {};
  
  try {
    // Retrieve relevant context
    const relevantDocs = await retrieveRelevant(query, retrievalLimit);
    
    // Build context from retrieved documents
    const context = relevantDocs
      .map((doc, i) => `[Source ${i + 1}]\nTitle: ${doc.title}\n${doc.content}`)
      .join('\n\n---\n\n');
    
    // Generate response with context
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Context:\n${context}\n\nQuery: ${query}` },
      ],
      max_tokens: maxTokens,
      temperature,
    });
    
    return {
      response: completion.choices[0].message.content || '',
      sources: relevantDocs,
      tokensUsed: completion.usage?.total_tokens || 0,
    };
  } catch (error) {
    console.error('Error in RAG query:', error);
    throw error;
  }
}

/**
 * Index a proposal for future retrieval
 */
export async function indexProposal(
  proposalId: string,
  clientId: string,
  proposalContent: {
    title: string;
    custom_message: string;
    products: string[];
    pricing: any;
    terms: string;
  }
): Promise<void> {
  const content = `
Proposal: ${proposalContent.title}

Custom Message:
${proposalContent.custom_message}

Products: ${proposalContent.products.join(', ')}

Pricing: ${JSON.stringify(proposalContent.pricing, null, 2)}

Terms: ${proposalContent.terms}
  `.trim();
  
  await indexDocument(
    proposalContent.title,
    content,
    {
      document_type: 'proposal',
      client_id: clientId,
      proposal_id: proposalId,
    }
  );
}

/**
 * Find similar past proposals for a client type
 */
export async function findSimilarProposals(
  clientType: string,
  volume: number,
  roastProfile: string,
  limit: number = 3
): Promise<RAGDocument[]> {
  const query = `
    Coffee proposal for ${clientType} shop
    Volume: ${volume} lbs/month
    Roast: ${roastProfile}
    Looking for similar successful proposals
  `;
  
  return retrieveRelevant(query, limit, 0.6, {
    document_type: 'proposal',
  });
}

/**
 * Batch index existing proposals
 */
export async function reindexAllProposals(): Promise<number> {
  // This would fetch all proposals from DB and index them
  // Implementation depends on your DB structure
  console.log('Reindexing all proposals...');
  // TODO: Implement based on your needs
  return 0;
}

export default {
  generateEmbedding,
  chunkText,
  indexDocument,
  retrieveRelevant,
  ragQuery,
  indexProposal,
  findSimilarProposals,
  reindexAllProposals,
};
