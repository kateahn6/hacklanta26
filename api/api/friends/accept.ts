import type { VercelRequest, VercelResponse } from '@vercel/node';
import { bad, body, cors } from '../../lib/http.js';
import { requireUser } from '../../lib/auth.js';
import { db } from '../../lib/db.js';

/** Redeems a share code: writes the friendship in both directions. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return bad(res, 405, 'Method not allowed');
  const user = await requireUser(req, res);
  if (!user) return;

  const raw = body<{ code?: string }>(req).code;
  const invite = (raw ?? '').trim().toUpperCase();
  if (!invite) return bad(res, 400, 'code is required');

  const client = await db().connect();
  try {
    await client.query('begin');
    const found = await client.query<{ created_by: string; accepted_by: string | null }>(
      `select created_by, accepted_by from invites where code = $1 for update`,
      [invite]
    );
    if (found.rows.length === 0) {
      await client.query('rollback');
      return bad(res, 404, 'That code does not exist');
    }
    const inviter = found.rows[0].created_by;
    if (inviter === user.id) {
      await client.query('rollback');
      return bad(res, 400, 'That is your own invite code');
    }

    await client.query(
      `insert into friendships (user_id, friend_id) values ($1,$2), ($2,$1)
       on conflict do nothing`,
      [user.id, inviter]
    );
    await client.query(
      `update invites set accepted_by = $1, accepted_at = now() where code = $2 and accepted_by is null`,
      [user.id, invite]
    );
    await client.query('commit');

    const friend = await client.query(
      `select id, name, email, avatar_url from users where id = $1`,
      [inviter]
    );
    res.status(200).json({ friend: friend.rows[0] });
  } catch (err: any) {
    await client.query('rollback').catch(() => {});
    bad(res, 500, err?.message ?? 'Failed to accept invite');
  } finally {
    client.release();
  }
}
