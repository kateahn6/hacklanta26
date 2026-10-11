import type { VercelRequest, VercelResponse } from '@vercel/node';
import { bad, body, cors } from '../lib/http.js';
import { requireUser } from '../lib/auth.js';
import { query } from '../lib/db.js';

const VISIBLE = `(p.created_by = $1 or p.created_by in (
  select friend_id from friendships where user_id = $1
))`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return;
  const user = await requireUser(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    // Places I can see (mine + my friends'), each with its entries inlined so the
    // map screen needs a single request.
    const rows = await query(
      `select p.id, p.name, p.lat, p.lng, p.created_by, p.created_at,
              cu.name as created_by_name,
              coalesce(
                (select json_agg(e order by e.created_at desc)
                 from (
                   select en.id, en.user_id, u.name as user_name, u.avatar_url,
                          en.caption, en.story, en.tags, en.postcard_text,
                          en.photo_urls, en.created_at
                   from entries en join users u on u.id = en.user_id
                   where en.place_id = p.id
                 ) e), '[]'::json
              ) as entries
       from places p
       join users cu on cu.id = p.created_by
       where ${VISIBLE}
       order by p.created_at desc`,
      [user.id]
    );
    res.status(200).json({ places: rows });
    return;
  }

  if (req.method === 'POST') {
    const { name, lat, lng } = body<{ name?: string; lat?: number; lng?: number }>(req);
    if (!name || typeof lat !== 'number' || typeof lng !== 'number') {
      return bad(res, 400, 'name, lat and lng are required');
    }
    const rows = await query(
      `insert into places (name, lat, lng, created_by)
       values ($1, $2, $3, $4)
       returning id, name, lat, lng, created_by, created_at`,
      [name, lat, lng, user.id]
    );
    res.status(201).json({ place: { ...rows[0], entries: [] } });
    return;
  }

  bad(res, 405, 'Method not allowed');
}
