import type { VercelRequest, VercelResponse } from '@vercel/node';
import { cors } from '../lib/http.js';
import { query } from '../lib/db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return;
  const out: Record<string, unknown> = {
    ok: true,
    auth0_domain: Boolean(process.env.AUTH0_DOMAIN),
    auth0_audience: Boolean(process.env.AUTH0_AUDIENCE),
    gemini_key: Boolean(process.env.GEMINI_API_KEY),
    demo_mode: process.env.DEMO_MODE === '1',
  };
  try {
    const rows = await query<{ n: string }>('select count(*)::text as n from places');
    out.db = 'ok';
    out.places = Number(rows[0].n);
  } catch (err: any) {
    out.db = `error: ${err?.message}`;
  }
  res.status(200).json(out);
}
