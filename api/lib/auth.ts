import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from './db.js';
import { bad } from './http.js';

export type AuthedUser = {
  id: string; // Auth0 sub
  name: string | null;
  email: string | null;
  avatar_url: string | null;
};

let jwks: ReturnType<typeof createRemoteJWKSet> | undefined;

function issuer(): string {
  const domain = process.env.AUTH0_DOMAIN;
  if (!domain) throw new Error('AUTH0_DOMAIN is not set');
  return `https://${domain.replace(/^https?:\/\//, '').replace(/\/$/, '')}/`;
}

function keys() {
  if (!jwks) jwks = createRemoteJWKSet(new URL(`${issuer()}.well-known/jwks.json`));
  return jwks;
}

/**
 * Verifies the Bearer token against the Auth0 tenant JWKS (issuer + audience),
 * then upserts the user row keyed on `sub`. Returns null and writes the error
 * response when the request is not authenticated.
 */
export async function requireUser(
  req: VercelRequest,
  res: VercelResponse
): Promise<AuthedUser | null> {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) {
    bad(res, 401, 'Missing Bearer token');
    return null;
  }

  let payload: Record<string, any>;
  try {
    const verified = await jwtVerify(token, keys(), {
      issuer: issuer(),
      audience: process.env.AUTH0_AUDIENCE,
    });
    payload = verified.payload as Record<string, any>;
  } catch (err: any) {
    bad(res, 401, `Invalid token: ${err?.message ?? 'verification failed'}`);
    return null;
  }

  const sub = payload.sub as string | undefined;
  if (!sub) {
    bad(res, 401, 'Token has no sub');
    return null;
  }

  // Access tokens usually carry no profile claims; the app forwards them as headers.
  const name = (payload.name as string) ?? (req.headers['x-user-name'] as string) ?? null;
  const email = (payload.email as string) ?? (req.headers['x-user-email'] as string) ?? null;
  const avatar =
    (payload.picture as string) ?? (req.headers['x-user-avatar'] as string) ?? null;

  const rows = await query<AuthedUser>(
    `insert into users (id, name, email, avatar_url)
     values ($1, $2, $3, $4)
     on conflict (id) do update set
       name = coalesce(excluded.name, users.name),
       email = coalesce(excluded.email, users.email),
       avatar_url = coalesce(excluded.avatar_url, users.avatar_url)
     returning id, name, email, avatar_url`,
    [sub, name, email, avatar]
  );
  return rows[0];
}
