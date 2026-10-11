import type { VercelRequest, VercelResponse } from '@vercel/node';
import { bad, body, cors } from '../lib/http.js';
import { requireUser } from '../lib/auth.js';
import { analyzePhotos, CANNED } from '../lib/gemini.js';

const TIMEOUT_MS = 20_000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return bad(res, 405, 'Method not allowed');
  const user = await requireUser(req, res);
  if (!user) return;

  const { photos, hint } = body<{ photos?: string[]; hint?: string }>(req);
  if (!Array.isArray(photos) || photos.length === 0) {
    return bad(res, 400, 'photos (base64 or data URLs) are required');
  }

  const demoMode = process.env.DEMO_MODE === '1';
  try {
    const page = await Promise.race([
      analyzePhotos(photos, hint),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini timed out')), TIMEOUT_MS)
      ),
    ]);
    res.status(200).json({ ...page, source: 'gemini' });
  } catch (err: any) {
    const message = err?.message ?? 'Gemini failed';
    if (demoMode) {
      // The demo never dies: canned page, flagged so the UI can say so.
      res.status(200).json({ ...CANNED, source: 'demo', note: message });
      return;
    }
    bad(res, 502, message);
  }
}
