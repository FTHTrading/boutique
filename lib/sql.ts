/**
 * lib/sql.ts
 *
 * Database client — works on Railway, Fly.io, Render, or any host.
 * Drop-in compatible with the @vercel/postgres `sql` tagged-template API so
 * every existing file stays unchanged.
 *
 * Set DATABASE_URL in your environment.
 */
import { Pool, PoolClient } from 'pg';

let _pool: Pool | null = null;

function getPool(): Pool {
  if (!_pool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is not set');
    _pool = new Pool({
      connectionString: url,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });
    _pool.on('error', (err) => console.error('DB pool error', err));
  }
  return _pool;
}

export interface SqlResult<T = Record<string, any>> {
  rows: T[];
  rowCount: number;
}

/**
 * Tagged-template SQL — identical call signature to @vercel/postgres `sql`.
 *
 *   const { rows } = await sql`SELECT * FROM deals WHERE id = ${id}`;
 */
async function sqlTag<T = Record<string, any>>(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<SqlResult<T>> {
  let text = '';
  const params: unknown[] = [];

  strings.forEach((segment, i) => {
    text += segment;
    if (i < values.length) {
      params.push(values[i]);
      text += `$${params.length}`;
    }
  });

  const result = await getPool().query(text, params as any[]);
  return { rows: result.rows as T[], rowCount: result.rowCount ?? 0 };
}

/**
 * sql.query(text, params) — for dynamic queries that can't use tagged templates.
 */
sqlTag.query = async function <T = Record<string, any>>(
  text: string,
  params?: unknown[]
): Promise<SqlResult<T>> {
  const result = await getPool().query(text, params as any[]);
  return { rows: result.rows as T[], rowCount: result.rowCount ?? 0 };
};

/**
 * sql.transaction(fn) — run multiple statements in a single transaction.
 */
sqlTag.transaction = async function <T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const sql = sqlTag;

export default getPool;
