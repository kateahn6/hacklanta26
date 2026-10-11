import type { NextFunction, Request, Response } from 'express';
import { createRemoteJWKSet, jwtVerify } from 'jose';

import { audience, issuer } from './env.js';
import { query } from './db.js';

export type AuthedUser = {
  id: string; // Auth0 `sub`
  /** Random public username, e.g. "Sunny-Otter-4821". The only name anyone sees. */
  username: string;
  email: string | null;
  avatar_url: string | null;
  /** When the user first signed in: "member since". */
  created_at: string;
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
  // The real name is deliberately never read: a username is assigned instead.
  const email = (payload.email as string | undefined) ?? header(req, 'x-user-email');
  const avatar = (payload.picture as string | undefined) ?? header(req, 'x-user-avatar');

  try {
    // The username column defaults to random_username(); on the rare clash
    // with an existing username, the insert is simply retried.
    let rows: AuthedUser[] = [];
    for (let attempt = 0; attempt < 5 && rows.length === 0; attempt++) {
      try {
        rows = await query<AuthedUser>(
          `insert into users (id, email, avatar_url)
           values ($1, $2, $3)
           on conflict (id) do update set
             email = coalesce(excluded.email, users.email),
             avatar_url = coalesce(excluded.avatar_url, users.avatar_url)
           returning id, username, email, avatar_url, created_at`,
          [sub, email ?? null, avatar ?? null]
        );
      } catch (err) {
        if ((err as { constraint?: string }).constraint !== 'users_username_key') throw err;
      }
    }
    if (rows.length === 0) throw new Error('could not assign a username');
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
