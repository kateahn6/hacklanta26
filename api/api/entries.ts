import type { VercelRequest, VercelResponse } from '@vercel/node';
import { bad, body, cors } from '../lib/http.js';
import { requireUser } from '../lib/auth.js';
import { db } from '../lib/db.js';

type Payload = {
  place_id?: string;
  /** When no place_id is given, a place is created from this and used. */
  place?: { name: string; lat: number; lng: number };
  caption?: string;
  story?: string;
  tags?: string[];
  postcard_text?: string;
  photo_urls?: string[];
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return bad(res, 405, 'Method not allowed');
  const user = await requireUser(req, res);
  if (!user) return;

  const p = body<Payload>(req);
  if (!p.place_id && !p.place) return bad(res, 400, 'place_id or place is required');

  const client = await db().connect();
  try {
    await client.query('begin');

    let placeId = p.place_id;
    if (!placeId) {
      const { name, lat, lng } = p.place!;
      if (!name || typeof lat !== 'number' || typeof lng !== 'number') {
        await client.query('rollback');
        return bad(res, 400, 'place needs name, lat and lng');
      }
      const created = await client.query(
        `insert into places (name, lat, lng, created_by) values ($1,$2,$3,$4) returning id`,
        [name, lat, lng, user.id]
      );
      placeId = created.rows[0].id;
    }

    const entry = await client.query(
      `insert into entries (place_id, user_id, caption, story, tags, postcard_text, photo_urls)
       values ($1,$2,$3,$4,$5,$6,$7)
       returning id, place_id, user_id, caption, story, tags, postcard_text, photo_urls, created_at`,
      [
        placeId,
        user.id,
        p.caption ?? null,
        p.story ?? null,
        p.tags ?? [],
        p.postcard_text ?? null,
        p.photo_urls ?? [],
      ]
    );

    // Every entry is also a visit — that is what the "friends keep returning" layer reads.
    await client.query(
      `insert into visits (user_id, place_id, visited_at) values ($1,$2,now())`,
      [user.id, placeId]
    );

    await client.query('commit');
    res.status(201).json({ entry: entry.rows[0], place_id: placeId });
  } catch (err: any) {
    await client.query('rollback').catch(() => {});
    bad(res, 500, err?.message ?? 'Failed to save entry');
  } finally {
    client.release();
  }
}
