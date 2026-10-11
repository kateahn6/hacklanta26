import { GoogleGenAI, Type } from '@google/genai';

import { env, require_ } from './env.js';

/**
 * Measured on this project's key with a 1024px photo and the schema below:
 *
 *   gemini-2.5-flash / 2.5-pro   404  — withdrawn for new keys
 *   gemini-3.1-pro-preview       429  — no pro quota on the free tier
 *   gemini-3.5-flash             503
 *   gemini-3.8-flash              ok  — 37s with thinking, 3-4s without
 *
 * Thinking is on by default and its latency swings wildly (6.7s to 37s on
 * identical input), which is what was blowing the 8s budget. The work here is
 * a short piece of descriptive writing, so there is nothing to think about:
 * thinkingBudget 0 makes it fast and predictable.
 *
 * Override with GEMINI_MODEL when a better model becomes available.
 */
const DEFAULT_MODEL = 'gemini-3.8-flash';

export type ScrapbookPage = {
  place_type: string;
  caption: string;
  story: string;
  tags: string[];
  postcard_text: string;
};

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    place_type: { type: Type.STRING },
    caption: { type: Type.STRING },
    story: { type: Type.STRING },
    tags: { type: Type.ARRAY, items: { type: Type.STRING } },
    postcard_text: { type: Type.STRING },
  },
  required: ['place_type', 'caption', 'story', 'tags', 'postcard_text'],
} as const;

const PROMPT = `You are writing a page for a shared travel scrapbook. Look at the photos
and write about the real place in them. Never invent ratings, stars or scores.

Return JSON only:
- place_type: 2-4 words, e.g. "neighborhood coffee bar"
- caption: one warm line, under 80 characters
- story: 2-3 sentences, first person, about being there
- tags: 3-5 lowercase tags, no "#"
- postcard_text: 1-2 sentences written to a friend, like the back of a postcard`;

export const CANNED: ScrapbookPage = {
  place_type: 'neighborhood coffee bar',
  caption: 'The corner table where the afternoon went missing.',
  story:
    'We ducked in out of the heat and ended up staying three hours. The barista remembered our order from last time, which felt like being let in on something. I will be back on Sunday.',
  tags: ['coffee', 'slow morning', 'corner table', 'walkable'],
  postcard_text:
    'Found your kind of place — tiny, loud, great cortado. Saving you the seat by the window.',
};

/** Strips a `data:image/...;base64,` prefix if present. */
function splitDataUrl(photo: string): { mimeType: string; data: string } {
  const match = /^data:([^;]+);base64,(.*)$/s.exec(photo.trim());
  if (match) return { mimeType: match[1], data: match[2] };
  return { mimeType: 'image/jpeg', data: photo.trim() };
}

function parse(text: string): ScrapbookPage {
  const cleaned = text.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const raw = JSON.parse(cleaned) as Partial<ScrapbookPage>;
  if (
    typeof raw.place_type !== 'string' ||
    typeof raw.caption !== 'string' ||
    typeof raw.story !== 'string' ||
    typeof raw.postcard_text !== 'string' ||
    !Array.isArray(raw.tags)
  ) {
    throw new Error('Gemini response did not match the schema');
  }
  return {
    place_type: raw.place_type,
    caption: raw.caption,
    story: raw.story,
    tags: raw.tags.filter((t): t is string => typeof t === 'string').slice(0, 5),
    postcard_text: raw.postcard_text,
  };
}

export async function analyzePhotos(
  photos: string[],
  hint?: string
): Promise<ScrapbookPage> {
  const ai = new GoogleGenAI({ apiKey: require_('GEMINI_API_KEY') });

  const parts: any[] = [{ text: hint ? `${PROMPT}\n\nThe place is called: ${hint}` : PROMPT }];
  for (const photo of photos.slice(0, 4)) {
    const { mimeType, data } = splitDataUrl(photo);
    parts.push({ inlineData: { mimeType, data } });
  }

  const result = await ai.models.generateContent({
    model: env('GEMINI_MODEL') ?? DEFAULT_MODEL,
    contents: [{ role: 'user', parts }],
    config: {
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA as any,
      thinkingConfig: { thinkingBudget: 0 },
    },
  });

  const text = result.text;
  if (!text) throw new Error('Gemini returned no text');
  return parse(text);
}
