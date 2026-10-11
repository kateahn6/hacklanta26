import type { VercelRequest, VercelResponse } from '@vercel/node';
import { bad, cors } from '../lib/http.js';
import { requireUser } from '../lib/auth.js';
import { query } from '../lib/db.js';

/**
 * "Friends keep coming back": reads the daily_place_visits continuous aggregate
 * and joins friendships outside the aggregate. A place scores on *return* days —
 * every day a person showed up after their first one — summed across my friend
 * circle. No likes, no ratings.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return;
  if (req.method !== 'GET') return bad(res, 405, 'Method not allowed');
  const user = await requireUser(req, res);
  if (!user) return;

  const rows = await query(
    `with circle as (
       select $1::text as user_id
       union
       select friend_id from friendships where user_id = $1
     ),
     per_user as (
       select d.place_id,
              d.user_id,
              count(*)::int as days,
              sum(d.visit_count)::int as visits,
              max(d.day) as last_day
       from daily_place_visits d
       join circle c on c.user_id = d.user_id
       group by d.place_id, d.user_id
     ),
     per_place as (
       select place_id,
              sum(greatest(days - 1, 0))::int as return_days,
              count(*)::int as friend_count,
              count(*) filter (where days > 1)::int as repeat_friends,
              sum(visits)::int as total_visits,
              max(last_day) as last_day
       from per_user
       group by place_id
     )
     select p.id, p.name, p.lat, p.lng,
            a.return_days, a.friend_count, a.repeat_friends, a.total_visits, a.last_day,
            (select coalesce(json_agg(u.name), '[]'::json)
             from per_user pu join users u on u.id = pu.user_id
             where pu.place_id = p.id) as who
     from per_place a
     join places p on p.id = a.place_id
     order by a.return_days desc, a.repeat_friends desc, a.total_visits desc, p.name
     limit 20`,
    [user.id]
  );
  res.status(200).json({ returning: rows });
}
