import { sql } from '@vercel/postgres';

/**
 * Database utility for PostgreSQL with pgvector
 */

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

/**
 * Execute raw SQL query
 */
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  try {
    const result = await sql.query(text, params);
    return {
      rows: result.rows as T[],
      rowCount: result.rowCount || 0,
    };
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Insert a single record
 */
export async function insert<T = any>(
  table: string,
  data: Record<string, any>
): Promise<T> {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

  const text = `
    INSERT INTO ${table} (${keys.join(', ')})
    VALUES (${placeholders})
    RETURNING *
  `;

  const result = await query<T>(text, values);
  return result.rows[0];
}

/**
 * Update a record by ID
 */
export async function update<T = any>(
  table: string,
  id: string,
  data: Record<string, any>
): Promise<T> {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');

  const text = `
    UPDATE ${table}
    SET ${setClause}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $${keys.length + 1}
    RETURNING *
  `;

  const result = await query<T>(text, [...values, id]);
  return result.rows[0];
}

/**
 * Delete a record by ID
 */
export async function deleteRecord(table: string, id: string): Promise<boolean> {
  const text = `DELETE FROM ${table} WHERE id = $1`;
  const result = await query(text, [id]);
  return result.rowCount > 0;
}

/**
 * Find one record by ID
 */
export async function findById<T = any>(
  table: string,
  id: string
): Promise<T | null> {
  const text = `SELECT * FROM ${table} WHERE id = $1`;
  const result = await query<T>(text, [id]);
  return result.rows[0] || null;
}

/**
 * Find all records with optional filtering
 */
export async function findAll<T = any>(
  table: string,
  where?: Record<string, any>,
  orderBy?: string,
  limit?: number
): Promise<T[]> {
  let text = `SELECT * FROM ${table}`;
  const values: any[] = [];

  if (where && Object.keys(where).length > 0) {
    const conditions = Object.keys(where).map((key, i) => {
      values.push(where[key]);
      return `${key} = $${i + 1}`;
    });
    text += ` WHERE ${conditions.join(' AND ')}`;
  }

  if (orderBy) {
    text += ` ORDER BY ${orderBy}`;
  }

  if (limit) {
    text += ` LIMIT ${limit}`;
  }

  const result = await query<T>(text, values);
  return result.rows;
}

/**
 * Vector similarity search for RAG
 */
export async function vectorSearch(
  embedding: number[],
  limit: number = 5,
  threshold: number = 0.7
): Promise<any[]> {
  const text = `
    SELECT 
      id,
      title,
      content,
      document_type,
      client_id,
      proposal_id,
      1 - (embedding <=> $1::vector) as similarity
    FROM documents
    WHERE 1 - (embedding <=> $1::vector) > $2
    ORDER BY embedding <=> $1::vector
    LIMIT $3
  `;

  const result = await query(text, [JSON.stringify(embedding), threshold, limit]);
  return result.rows;
}

/**
 * Upsert document with embedding
 */
export async function upsertDocument(
  title: string,
  content: string,
  embedding: number[],
  metadata: {
    document_type: string;
    client_id?: string;
    proposal_id?: string;
    file_url?: string;
  }
): Promise<any> {
  const text = `
    INSERT INTO documents (
      title, content, embedding, document_type, client_id, proposal_id, file_url
    ) VALUES ($1, $2, $3::vector, $4, $5, $6, $7)
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      content = EXCLUDED.content,
      embedding = EXCLUDED.embedding,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `;

  const result = await query(text, [
    title,
    content,
    JSON.stringify(embedding),
    metadata.document_type,
    metadata.client_id || null,
    metadata.proposal_id || null,
    metadata.file_url || null,
  ]);

  return result.rows[0];
}

/**
 * Health check for database connection
 */
export async function healthCheck(): Promise<boolean> {
  try {
    await query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

export default {
  query,
  insert,
  update,
  deleteRecord,
  findById,
  findAll,
  vectorSearch,
  upsertDocument,
  healthCheck,
};
