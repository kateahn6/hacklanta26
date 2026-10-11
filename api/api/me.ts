import type { VercelRequest, VercelResponse } from '@vercel/node';
import { cors } from '../lib/http.js';
import { requireUser } from '../lib/auth.js';
import { query } from '../lib/db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return;
  const user = await requireUser(req, res);
  if (!user) return;
  const friends = await query(
    `select u.id, u.name, u.email, u.avatar_url
     from friendships f join users u on u.id = f.friend_id
     where f.user_id = $1
     order by u.name nulls last`,
    [user.id]
  );
  res.status(200).json({ user, friends });
}
