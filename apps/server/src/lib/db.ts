import { Pool, type QueryResultRow } from 'pg';

const globalForPool = globalThis as unknown as { flownotePool?: Pool };

function pool(): Pool {
  if (!globalForPool.flownotePool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error('DATABASE_URL is not set');
    globalForPool.flownotePool = new Pool({ connectionString, max: 10 });
  }
  return globalForPool.flownotePool;
}

export async function query<T extends QueryResultRow>(text: string, params: unknown[] = []): Promise<T[]> {
  const result = await pool().query<T>(text, params);
  return result.rows;
}

export async function queryOne<T extends QueryResultRow>(text: string, params: unknown[] = []): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}
