import pg from 'pg';

import { require_ } from './env.js';

let pool: pg.Pool | undefined;

export function db(): pg.Pool {
  if (!pool) {
    pool = new pg.Pool({
      connectionString: require_('DATABASE_URL'),
      // Tiger Data terminates TLS with its own chain; the demo does not pin it.
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
    });
    pool.on('error', (err) => console.error('[unfold] idle pg client error:', err.message));
  }
  return pool;
}

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const res = await db().query<T>(text, params as unknown[]);
  return res.rows;
}
