import type { VercelRequest, VercelResponse } from '@vercel/node';
import { bad, cors } from '../../lib/http.js';
import { requireUser } from '../../lib/auth.js';
import { query } from '../../lib/db.js';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function code(): string {
  let out = '';
  for (let i = 0; i < 6; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

/** Creates (or reuses) a share code the inviter can send to a friend. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return bad(res, 405, 'Method not allowed');
  const user = await requireUser(req, res);
  if (!user) return;

  const existing = await query<{ code: string }>(
    `select code from invites
     where created_by = $1 and accepted_by is null
     order by created_at desc limit 1`,
    [user.id]
  );
  if (existing.length > 0) {
    res.status(200).json({ code: existing[0].code, reused: true });
    return;
  }

  // Codes are short, so retry on the (unlikely) collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const rows = await query<{ code: string }>(
        `insert into invites (code, created_by) values ($1, $2) returning code`,
        [code(), user.id]
      );
      res.status(201).json({ code: rows[0].code, reused: false });
      return;
    } catch (err: any) {
      if (err?.code !== '23505') return bad(res, 500, err?.message ?? 'Failed to create invite');
    }
  }
  bad(res, 500, 'Could not allocate an invite code');
}
