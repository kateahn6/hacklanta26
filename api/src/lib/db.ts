import pg from 'pg';

import { require_ } from './env.js';

let pool: pg.Pool | undefined;

/**
 * `pg` reads `sslmode` out of the connection string and lets it override the
 * explicit `ssl` option, so a URL ending in `sslmode=require` turns certificate
 * verification back on and Tiger Data's chain is rejected as self-signed.
 * Stripping the parameter leaves the `ssl` option below in charge.
 */
function connectionString(): string {
  const raw = require_('DATABASE_URL');
  try {
    const url = new URL(raw);
    url.searchParams.delete('sslmode');
    url.searchParams.delete('ssl');
    return url.toString();
  } catch {
    return raw.replace(/[?&]ssl(mode)?=[^&]*/g, '');
  }
}

export function db(): pg.Pool {
  if (!pool) {
    pool = new pg.Pool({
      connectionString: connectionString(),
      // TLS is still used; Tiger Data's chain just is not verified against a CA.
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
