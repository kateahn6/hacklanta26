import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';

import { requireUser, user } from './lib/auth.js';
import { db, query } from './lib/db.js';
import { DEMO_MODE, env, issuer, reportEnv } from './lib/env.js';
import { analyzePhotos, CANNED } from './lib/gemini.js';

const app = express();

app.use(cors({ origin: '*', allowedHeaders: ['Authorization', 'Content-Type', 'x-user-name', 'x-user-email', 'x-user-avatar'] }));
// Photos arrive as base64 data URLs, so the default 100kb limit is far too low.
app.use(express.json({ limit: '15mb' }));

/** Wraps an async route so a rejected promise becomes a 500, not a hang. */
const route =
  (handler: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    handler(req, res).catch(next);
  };

// ---------------------------------------------------------------------------
// Health — no token required, so it can be curl'd through the tunnel.
// ---------------------------------------------------------------------------
app.get('/health', route(async (_req, res) => {
  const out: Record<string, unknown> = {
    ok: true,
    issuer: env('AUTH0_DOMAIN') ? issuer() : null,
    audience: env('AUTH0_AUDIENCE') ?? null,
    gemini_key: Boolean(env('GEMINI_API_KEY')),
    demo_mode: DEMO_MODE(),
  };
  try {
    const rows = await query<{ places: string; entries: string; users: string }>(
      `select (select count(*) from places)::text as places,
              (select count(*) from entries)::text as entries,
              (select count(*) from users)::text as users`
    );
    out.db = 'ok';
    out.counts = {
      places: Number(rows[0].places),
      entries: Number(rows[0].entries),
      users: Number(rows[0].users),
    };
  } catch (err) {
    out.ok = false;
    out.db = err instanceof Error ? err.message : 'database error';
  }
  res.json(out);
}));

// ---------------------------------------------------------------------------
// Everything below requires a verified Auth0 access token.
// ---------------------------------------------------------------------------
const authed = express.Router();
authed.use(requireUser);

authed.get('/me', route(async (req, res) => {
  const me = user(req);
  const friends = await query(
    `select u.id, u.name, u.email, u.avatar_url, u.is_demo
     from friendships f join users u on u.id = f.friend_id
     where f.user_id = $1
     order by u.name nulls last`,
    [me.id]
  );
  res.json({ user: me, friends });
}));

/** Places I can see: mine plus my friends'. Entries are inlined so the map
 *  screen needs one request. */
authed.get('/places', route(async (req, res) => {
  const me = user(req);
  const places = await query(
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
     where p.created_by = $1
        or p.created_by in (select friend_id from friendships where user_id = $1)
     order by p.created_at desc`,
    [me.id]
  );
  res.json({ places });
}));

authed.post('/places', route(async (req, res) => {
  const me = user(req);
  const { name, lat, lng } = req.body ?? {};
  if (!name || typeof lat !== 'number' || typeof lng !== 'number') {
    res.status(400).json({ error: 'name, lat and lng are required' });
    return;
  }
  const rows = await query(
    `insert into places (name, lat, lng, created_by) values ($1,$2,$3,$4)
     returning id, name, lat, lng, created_by, created_at`,
    [name, lat, lng, me.id]
  );
  res.status(201).json({ place: { ...rows[0], entries: [] } });
}));

/** Saves a scrapbook entry and records the visit that feeds the ranking. */
authed.post('/entries', route(async (req, res) => {
  const me = user(req);
  const payload = req.body ?? {};
  if (!payload.place_id && !payload.place) {
    res.status(400).json({ error: 'place_id or place is required' });
    return;
  }

  const client = await db().connect();
  try {
    await client.query('begin');

    let placeId: string | undefined = payload.place_id;
    if (!placeId) {
      const { name, lat, lng } = payload.place;
      if (!name || typeof lat !== 'number' || typeof lng !== 'number') {
        await client.query('rollback');
        res.status(400).json({ error: 'place needs name, lat and lng' });
        return;
      }
      const created = await client.query<{ id: string }>(
        `insert into places (name, lat, lng, created_by) values ($1,$2,$3,$4) returning id`,
        [name, lat, lng, me.id]
      );
      placeId = created.rows[0].id;
    }

    const entry = await client.query(
      `insert into entries (place_id, user_id, caption, story, tags, postcard_text, photo_urls)
       values ($1,$2,$3,$4,$5,$6,$7)
       returning id, place_id, user_id, caption, story, tags, postcard_text, photo_urls, created_at`,
      [
        placeId,
        me.id,
        payload.caption ?? null,
        payload.story ?? null,
        Array.isArray(payload.tags) ? payload.tags : [],
        payload.postcard_text ?? null,
        Array.isArray(payload.photo_urls) ? payload.photo_urls : [],
      ]
    );

    await client.query(
      `insert into visits (user_id, place_id, visited_at) values ($1,$2,now())
       on conflict do nothing`,
      [me.id, placeId]
    );

    await client.query('commit');
    res.status(201).json({ entry: entry.rows[0], place_id: placeId });
  } catch (err) {
    await client.query('rollback').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}));

/**
 * "Friends keep coming back": reads the daily_place_visits continuous aggregate
 * and joins friendships OUTSIDE the aggregate. A place scores on return days —
 * every day someone showed up after their first — summed across my circle.
 */
authed.get('/returning', route(async (req, res) => {
  const me = user(req);
  const returning = await query(
    `with circle as (
       select $1::text as user_id
       union
       select friend_id from friendships where user_id = $1
     ),
     per_user as (
       select d.place_id, d.user_id,
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
              (count(*) filter (where days > 1))::int as repeat_friends,
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
    [me.id]
  );
  res.json({ returning });
}));

const ANALYZE_TIMEOUT_MS = 8_000;

/** Photos in, structured scrapbook page out. Falls back to a canned page in
 *  DEMO_MODE on any failure or after 8 seconds. */
authed.post('/analyze', route(async (req, res) => {
  const { photos, hint } = req.body ?? {};
  if (!Array.isArray(photos) || photos.length === 0) {
    res.status(400).json({ error: 'photos (base64 or data URLs) are required' });
    return;
  }
  try {
    const page = await Promise.race([
      analyzePhotos(photos, typeof hint === 'string' ? hint : undefined),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini timed out after 8s')), ANALYZE_TIMEOUT_MS)
      ),
    ]);
    res.json({ ...page, source: 'gemini' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gemini failed';
    console.warn('[unfold] analyze fell back:', message);
    if (DEMO_MODE()) {
      res.json({ ...CANNED, source: 'demo', note: message });
      return;
    }
    res.status(502).json({ error: message });
  }
}));

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const newCode = () =>
  Array.from({ length: 6 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('');

authed.post('/friends/invite', route(async (req, res) => {
  const me = user(req);
  const existing = await query<{ code: string }>(
    `select code from invites where created_by = $1 and accepted_by is null
     order by created_at desc limit 1`,
    [me.id]
  );
  if (existing.length > 0) {
    res.json({ code: existing[0].code, reused: true });
    return;
  }
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const rows = await query<{ code: string }>(
        `insert into invites (code, created_by) values ($1,$2) returning code`,
        [newCode(), me.id]
      );
      res.status(201).json({ code: rows[0].code, reused: false });
      return;
    } catch (err) {
      if ((err as { code?: string }).code !== '23505') throw err;
    }
  }
  res.status(500).json({ error: 'Could not allocate an invite code' });
}));

/** Redeems a share code; the friendship is written in both directions. */
authed.post('/friends/accept', route(async (req, res) => {
  const me = user(req);
  const code = String(req.body?.code ?? '').trim().toUpperCase();
  if (!code) {
    res.status(400).json({ error: 'code is required' });
    return;
  }

  const client = await db().connect();
  try {
    await client.query('begin');
    const found = await client.query<{ created_by: string }>(
      `select created_by from invites where code = $1 for update`,
      [code]
    );
    if (found.rows.length === 0) {
      await client.query('rollback');
      res.status(404).json({ error: 'That code does not exist' });
      return;
    }
    const inviter = found.rows[0].created_by;
    if (inviter === me.id) {
      await client.query('rollback');
      res.status(400).json({ error: 'That is your own invite code' });
      return;
    }
    await client.query(
      `insert into friendships (user_id, friend_id) values ($1,$2), ($2,$1)
       on conflict do nothing`,
      [me.id, inviter]
    );
    await client.query(
      `update invites set accepted_by = $1, accepted_at = now()
       where code = $2 and accepted_by is null`,
      [me.id, code]
    );
    const friend = await client.query(
      `select id, name, email, avatar_url from users where id = $1`,
      [inviter]
    );
    await client.query('commit');
    res.json({ friend: friend.rows[0] });
  } catch (err) {
    await client.query('rollback').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}));

/**
 * Demo convenience: makes the caller a friend of every seeded demo account, so
 * a freshly logged-in real Auth0 user immediately sees the Atlanta map.
 */
authed.post('/demo/befriend', route(async (req, res) => {
  const me = user(req);
  const demo = await query<{ id: string; name: string | null }>(
    `select id, name from users where is_demo = true and id <> $1`,
    [me.id]
  );
  if (demo.length === 0) {
    res.status(404).json({ error: 'No demo accounts found — run sql/seed.sql first' });
    return;
  }
  await query(
    `insert into friendships (user_id, friend_id)
     select $1, id from users where is_demo = true and id <> $1
     union all
     select id, $1 from users where is_demo = true and id <> $1
     on conflict do nothing`,
    [me.id]
  );
  res.json({ friends: demo });
}));

app.use('/api', authed);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[unfold] unhandled error:', err);
  res.status(500).json({ error: err.message ?? 'Server error' });
});

const port = Number(process.env.PORT ?? 8787);
const { missing } = reportEnv();

app.listen(port, () => {
  console.log(`[unfold] API listening on http://localhost:${port}`);
  console.log(`[unfold] health: http://localhost:${port}/health`);
  if (missing.length > 0) {
    console.error(`[unfold] missing env: ${missing.join(', ')}`);
  }
  console.log(
    '[unfold] expose this port with a tunnel and set EXPO_PUBLIC_API_URL to the tunnel URL'
  );
});
