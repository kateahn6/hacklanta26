import type { NextFunction, Request, Response } from 'express';
import { createRemoteJWKSet, jwtVerify } from 'jose';

import { audience, issuer } from './env.js';
import { query } from './db.js';

export type AuthedUser = {
  id: string; // Auth0 `sub`
  name: string | null;
  email: string | null;
  avatar_url: string | null;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthedUser;
    }
  }
}

let jwks: ReturnType<typeof createRemoteJWKSet> | undefined;

function keys() {
  if (!jwks) jwks = createRemoteJWKSet(new URL(`${issuer()}.well-known/jwks.json`));
  return jwks;
}

function header(req: Request, name: string): string | null {
  const value = req.headers[name];
  if (typeof value !== 'string' || value.length === 0) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * Verifies the Bearer access token against the tenant JWKS, checking both the
 * issuer (with its trailing slash) and the audience, then upserts the user row
 * keyed on the token's `sub`.
 */
export async function requireUser(req: Request, res: Response, next: NextFunction) {
  const authorization = req.headers.authorization ?? '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!token) {
    res.status(401).json({ error: 'Missing Bearer token' });
    return;
  }

  let payload: Record<string, unknown>;
  try {
    const verified = await jwtVerify(token, keys(), {
      issuer: issuer(),
      audience: audience(),
    });
    payload = verified.payload as Record<string, unknown>;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'verification failed';
    console.warn('[unfold] token rejected:', message);
    res.status(401).json({ error: `Invalid token: ${message}` });
    return;
  }

  const sub = typeof payload.sub === 'string' ? payload.sub : null;
  if (!sub) {
    res.status(401).json({ error: 'Token has no sub' });
    return;
  }

  // Access tokens carry no profile claims, so the app forwards them as headers.
  const name = (payload.name as string | undefined) ?? header(req, 'x-user-name');
  const email = (payload.email as string | undefined) ?? header(req, 'x-user-email');
  const avatar = (payload.picture as string | undefined) ?? header(req, 'x-user-avatar');

  try {
    const rows = await query<AuthedUser>(
      `insert into users (id, name, email, avatar_url)
       values ($1, $2, $3, $4)
       on conflict (id) do update set
         name = coalesce(excluded.name, users.name),
         email = coalesce(excluded.email, users.email),
         avatar_url = coalesce(excluded.avatar_url, users.avatar_url)
       returning id, name, email, avatar_url`,
      [sub, name ?? null, email ?? null, avatar ?? null]
    );
    req.user = rows[0];
    next();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'database error';
    console.error('[unfold] could not upsert the user:', message);
    res.status(500).json({ error: `Database error: ${message}` });
  }
}

/** Narrowing helper: routes behind requireUser always have a user. */
export function user(req: Request): AuthedUser {
  if (!req.user) throw new Error('route is not behind requireUser');
  return req.user;
}
