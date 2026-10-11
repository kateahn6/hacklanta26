import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';

import { requireUser, user } from './lib/auth.js';
import { db, query } from './lib/db.js';
import { audience, DEMO_MODE, env, issuer, reportEnv } from './lib/env.js';
import { analyzePhotos, CANNED, polishText } from './lib/gemini.js';

const app = express();

app.use(cors({ origin: '*', allowedHeaders: ['Authorization', 'Content-Type', 'x-user-email', 'x-user-avatar'] }));
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
    audience: env('AUTH0_AUDIENCE') ? audience() : null,
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
    `select u.id, u.username, u.avatar_url, u.is_demo
     from friendships f join users u on u.id = f.friend_id
     where f.user_id = $1
     order by u.username`,
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
            cu.username as created_by_name,
            coalesce(
              (select json_agg(e order by e.created_at desc)
               from (
                 select en.id, en.user_id, u.username as user_name, u.avatar_url,
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

/** Deletes one of my own entries. Visits stay: the trip still happened, it just has no postcard. */
authed.delete('/entries/:id', route(async (req, res) => {
  const me = user(req);
  const id = String(req.params.id);
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    res.status(404).json({ error: 'Entry not found' });
    return;
  }
  const rows = await query<{ id: string }>(
    `delete from entries where id = $1 and user_id = $2 returning id`,
    [id, me.id]
  );
  if (rows.length === 0) {
    res.status(404).json({ error: 'Entry not found, or it is not yours to delete' });
    return;
  }
  res.json({ deleted: rows[0].id });
}));

// ---------------------------------------------------------------------------
// Shared scrapbooks. The owner can change everything; members (anyone who
// joined with the access code) can add photos and edit or remove their own.
// ---------------------------------------------------------------------------

const UUID = /^[0-9a-f-]{36}$/i;
const MAX_PHOTO_CHARS = 3_000_000; // ~2 MB of base64 per photo

type MediaInput = { id?: unknown; photo_url?: unknown; aspect?: unknown; caption?: unknown };

const isPhotoUrl = (v: unknown): v is string =>
  typeof v === 'string' && v.length <= MAX_PHOTO_CHARS && (v.startsWith('data:image/') || v.startsWith('https://'));
const cleanCaption = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 80) : null);
const cleanAspect = (v: unknown) => (typeof v === 'number' && v > 0.1 && v < 10 ? v : 1);
const cleanText = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const cleanCategories = (v: unknown) =>
  Array.isArray(v) ? v.filter((c): c is string => typeof c === 'string').slice(0, 6) : [];

/** One scrapbook with members and ordered media. The code is only revealed to members. */
const SCRAPBOOK_SELECT = `
  select s.id, s.owner_id, o.username as owner_name, s.title, s.description, s.city, s.categories,
         s.cover_url, s.cover_aspect, s.visibility, s.created_at, s.updated_at,
         case when exists (select 1 from scrapbook_members m where m.scrapbook_id = s.id and m.user_id = $1)
              then s.access_code end as access_code,
         coalesce((select json_agg(json_build_object('id', m.user_id, 'name', u.username) order by m.joined_at)
                   from scrapbook_members m join users u on u.id = m.user_id
                   where m.scrapbook_id = s.id), '[]') as members,
         coalesce((select json_agg(json_build_object(
                     'id', md.id, 'author_id', md.author_id, 'photo_url', md.photo_url,
                     'aspect', md.aspect, 'caption', md.caption) order by md.position, md.created_at)
                   from scrapbook_media md where md.scrapbook_id = s.id), '[]') as media
  from scrapbooks s join users o on o.id = s.owner_id`;

async function loadScrapbook(meId: string, id: string) {
  const rows = await query(`${SCRAPBOOK_SELECT} where s.id = $2`, [meId, id]);
  return rows[0] ?? null;
}

async function membership(meId: string, id: string) {
  const rows = await query<{ owner_id: string; is_member: boolean }>(
    `select s.owner_id,
            exists (select 1 from scrapbook_members m where m.scrapbook_id = s.id and m.user_id = $1) as is_member
     from scrapbooks s where s.id = $2`,
    [meId, id]
  );
  return rows[0] ?? null;
}

/** Scrapbooks I belong to, plus public ones by me or my friends. */
authed.get('/scrapbooks', route(async (req, res) => {
  const me = user(req);
  const scrapbooks = await query(
    `${SCRAPBOOK_SELECT}
     where exists (select 1 from scrapbook_members m where m.scrapbook_id = s.id and m.user_id = $1)
        or (s.visibility = 'public'
            and (s.owner_id = $1 or s.owner_id in (select friend_id from friendships where user_id = $1)))
     order by s.created_at desc`,
    [me.id]
  );
  res.json({ scrapbooks });
}));

authed.post('/scrapbooks', route(async (req, res) => {
  const me = user(req);
  const body = req.body ?? {};
  const title = cleanText(body.title, 120);
  const media: MediaInput[] = Array.isArray(body.media) ? body.media : [];
  if (!title) {
    res.status(400).json({ error: 'A title is required' });
    return;
  }
  if (media.length > 30 || media.some((m) => !isPhotoUrl(m.photo_url))) {
    res.status(400).json({ error: 'Up to 30 photos, each a data:image or https URL' });
    return;
  }
  if (body.cover_url != null && !isPhotoUrl(body.cover_url)) {
    res.status(400).json({ error: 'cover_url must be a data:image or https URL' });
    return;
  }

  const client = await db().connect();
  try {
    await client.query('begin');
    let id: string | null = null;
    for (let attempt = 0; attempt < 5 && !id; attempt++) {
      await client.query('savepoint code');
      try {
        const created = await client.query<{ id: string }>(
          `insert into scrapbooks (owner_id, title, description, city, categories, cover_url, cover_aspect, visibility, access_code)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id`,
          [
            me.id,
            title,
            cleanText(body.description, 400),
            cleanText(body.city, 80) || 'Atlanta',
            cleanCategories(body.categories),
            body.cover_url ?? null,
            body.cover_url ? cleanAspect(body.cover_aspect) : null,
            body.visibility === 'private' ? 'private' : 'public',
            newCode(),
          ]
        );
        id = created.rows[0].id;
      } catch (err) {
        if ((err as { code?: string }).code !== '23505') throw err;
        await client.query('rollback to savepoint code');
      }
    }
    if (!id) throw new Error('Could not allocate an access code');

    await client.query(`insert into scrapbook_members (scrapbook_id, user_id) values ($1,$2)`, [id, me.id]);
    for (const [position, m] of media.entries()) {
      await client.query(
        `insert into scrapbook_media (scrapbook_id, author_id, photo_url, aspect, caption, position)
         values ($1,$2,$3,$4,$5,$6)`,
        [id, me.id, m.photo_url, cleanAspect(m.aspect), cleanCaption(m.caption), position]
      );
    }
    await client.query('commit');
    res.status(201).json({ scrapbook: await loadScrapbook(me.id, id) });
  } catch (err) {
    await client.query('rollback').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}));

/**
 * Saves the scrapbook form. `media` is the full ordered list: items with an id
 * are kept (caption updated if you may), items without one are new photos, and
 * existing photos left out are removed if they are yours (or you own the book).
 */
authed.put('/scrapbooks/:id', route(async (req, res) => {
  const me = user(req);
  const id = String(req.params.id);
  const access = UUID.test(id) ? await membership(me.id, id) : null;
  if (!access || !access.is_member) {
    res.status(404).json({ error: 'Scrapbook not found, or you have not joined it' });
    return;
  }
  const isOwner = access.owner_id === me.id;
  const body = req.body ?? {};
  const media: MediaInput[] = Array.isArray(body.media) ? body.media : [];
  if (media.length > 60 || media.some((m) => m.id == null && !isPhotoUrl(m.photo_url))) {
    res.status(400).json({ error: 'New photos need a data:image or https URL' });
    return;
  }

  const client = await db().connect();
  try {
    await client.query('begin');
    if (isOwner) {
      const title = cleanText(body.title, 120);
      if (!title) {
        await client.query('rollback');
        res.status(400).json({ error: 'A title is required' });
        return;
      }
      const coverChanged = body.cover_url !== undefined;
      if (coverChanged && body.cover_url !== null && !isPhotoUrl(body.cover_url)) {
        await client.query('rollback');
        res.status(400).json({ error: 'cover_url must be a data:image or https URL' });
        return;
      }
      await client.query(
        `update scrapbooks set title = $2, description = $3, city = $4, categories = $5,
                visibility = $6, updated_at = now(),
                cover_url = case when $7 then $8 else cover_url end,
                cover_aspect = case when $7 then $9 else cover_aspect end
         where id = $1`,
        [
          id,
          title,
          cleanText(body.description, 400),
          cleanText(body.city, 80) || 'Atlanta',
          cleanCategories(body.categories),
          body.visibility === 'private' ? 'private' : 'public',
          coverChanged,
          body.cover_url ?? null,
          body.cover_url ? cleanAspect(body.cover_aspect) : null,
        ]
      );
    } else {
      await client.query(`update scrapbooks set updated_at = now() where id = $1`, [id]);
    }

    const existing = await client.query<{ id: string; author_id: string }>(
      `select id, author_id from scrapbook_media where scrapbook_id = $1`,
      [id]
    );
    const mayEdit = (authorId: string) => isOwner || authorId === me.id;
    const keptIds = new Set(media.filter((m) => typeof m.id === 'string').map((m) => m.id as string));
    for (const row of existing.rows) {
      if (!keptIds.has(row.id) && mayEdit(row.author_id)) {
        await client.query(`delete from scrapbook_media where id = $1`, [row.id]);
      }
    }
    const authorById = new Map(existing.rows.map((row) => [row.id, row.author_id]));
    for (const [position, m] of media.entries()) {
      const authorId = typeof m.id === 'string' ? authorById.get(m.id) : undefined;
      if (authorId !== undefined) {
        if (mayEdit(authorId)) {
          await client.query(`update scrapbook_media set caption = $2, position = $3 where id = $1`, [
            m.id,
            cleanCaption(m.caption),
            position,
          ]);
        } else {
          await client.query(`update scrapbook_media set position = $2 where id = $1`, [m.id, position]);
        }
      } else if (m.id == null) {
        await client.query(
          `insert into scrapbook_media (scrapbook_id, author_id, photo_url, aspect, caption, position)
           values ($1,$2,$3,$4,$5,$6)`,
          [id, me.id, m.photo_url, cleanAspect(m.aspect), cleanCaption(m.caption), position]
        );
      }
    }
    await client.query('commit');
    res.json({ scrapbook: await loadScrapbook(me.id, id) });
  } catch (err) {
    await client.query('rollback').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}));

authed.delete('/scrapbooks/:id', route(async (req, res) => {
  const me = user(req);
  const id = String(req.params.id);
  const rows = UUID.test(id)
    ? await query<{ id: string }>(`delete from scrapbooks where id = $1 and owner_id = $2 returning id`, [id, me.id])
    : [];
  if (rows.length === 0) {
    res.status(404).json({ error: 'Scrapbook not found, or it is not yours to delete' });
    return;
  }
  res.json({ deleted: rows[0].id });
}));

/** Join a scrapbook with its access code. Joining twice is harmless. */
authed.post('/scrapbooks/join', route(async (req, res) => {
  const me = user(req);
  const code = typeof req.body?.code === 'string' ? req.body.code.trim().toUpperCase() : '';
  if (code.length !== 6) {
    res.status(400).json({ error: 'Access codes are 6 characters' });
    return;
  }
  const found = await query<{ id: string }>(`select id from scrapbooks where access_code = $1`, [code]);
  if (found.length === 0) {
    res.status(404).json({ error: 'No scrapbook has that code' });
    return;
  }
  await query(
    `insert into scrapbook_members (scrapbook_id, user_id) values ($1,$2) on conflict do nothing`,
    [found[0].id, me.id]
  );
  res.json({ scrapbook: await loadScrapbook(me.id, found[0].id) });
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
            (select coalesce(json_agg(u.username), '[]'::json)
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

/**
 * The brief said 8 seconds, but measured latency on this key is median 5.5s
 * with a long tail: 8 of 8 sampled calls finished under 15s, while a 8s budget
 * sent a third of them to the fallback. 15s keeps real Gemini output in the
 * demo; DEMO_MODE still covers anything slower.
 */
const ANALYZE_TIMEOUT_MS = Number(env('GEMINI_TIMEOUT_MS') ?? 15_000);

/** Photos in, structured scrapbook page out. Falls back to a canned page in
 *  DEMO_MODE on any failure or once the timeout above is hit. */
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
        setTimeout(
          () => reject(new Error(`Gemini timed out after ${ANALYZE_TIMEOUT_MS / 1000}s`)),
          ANALYZE_TIMEOUT_MS
        )
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

/**
 * Rewrites what the user wrote, for when the photos say little or they would
 * rather write it themselves. Unlike /api/analyze, the DEMO_MODE fallback here
 * returns their own text untouched: silently replacing someone's writing with
 * a canned paragraph would be worse than doing nothing.
 */
authed.post('/polish', route(async (req, res) => {
  const { text, hint } = req.body ?? {};
  if (typeof text !== 'string' || text.trim().length === 0) {
    res.status(400).json({ error: 'text is required' });
    return;
  }
  try {
    const page = await Promise.race([
      polishText(text.trim(), typeof hint === 'string' ? hint : undefined),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Gemini timed out after ${ANALYZE_TIMEOUT_MS / 1000}s`)),
          ANALYZE_TIMEOUT_MS
        )
      ),
    ]);
    res.json({ ...page, source: 'gemini' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gemini failed';
    console.warn('[unfold] polish fell back:', message);
    if (DEMO_MODE()) {
      res.json({
        place_type: '',
        caption: '',
        story: text.trim(),
        tags: [],
        postcard_text: '',
        source: 'demo',
        note: message,
      });
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
      `select id, username, avatar_url from users where id = $1`,
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
  const demo = await query<{ id: string; username: string }>(
    `select id, username from users where is_demo = true and id <> $1`,
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

// Render injects PORT; 8787 is the local default. Binding 0.0.0.0 (not
// loopback) is what makes the service reachable inside Render's network.
const port = Number(process.env.PORT ?? 8787);
const { missing } = reportEnv();

app.listen(port, '0.0.0.0', () => {
  console.log(`[unfold] API listening on port ${port} (health: /health)`);
  if (missing.length > 0) {
    console.error(`[unfold] missing env: ${missing.join(', ')}`);
  }
  if (!process.env.RENDER) {
    console.log(
      '[unfold] local dev: expose this port with ngrok and point EXPO_PUBLIC_API_URL at it'
    );
  }
});
