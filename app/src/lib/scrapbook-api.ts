import { Asset } from 'expo-asset';

import { api, ApiError } from '@/lib/api';
import type { IdTokenClaims } from '@/lib/jwt';
import { toDataUrl } from '@/lib/photos';
import type { ApiScrapbook } from '@/lib/types';
import type { CategoryId, Photo, Scrapbook, ScrapbookMedia, Visibility } from '@/types';

type Auth = { token: string | null; profile?: IdTokenClaims };

/** A photo the server can store: remote URLs pass through, local and bundled images are uploaded as data URLs. */
async function uploadable(photo: Photo): Promise<string> {
  if (typeof photo.source === 'number') {
    const [asset] = await Asset.loadAsync(photo.source);
    return toDataUrl(asset.localUri ?? asset.uri);
  }
  const { uri } = photo.source;
  return uri.startsWith('https://') || uri.startsWith('data:image/') ? uri : toDataUrl(uri);
}

export interface ScrapbookFields {
  title: string;
  description: string;
  city: string;
  categories: CategoryId[];
  visibility: Visibility;
  cover: Photo | null;
  media: ScrapbookMedia[];
}

/**
 * Creates or updates a shared scrapbook. `existing` is the server copy being
 * edited: photos it already has are sent by id, so only new photos upload.
 */
export async function saveSharedScrapbook(auth: Auth, fields: ScrapbookFields, existing?: Scrapbook): Promise<ApiScrapbook> {
  const known = new Set(existing?.remote ? existing.media.map((m) => m.id) : []);
  const media = [];
  for (const m of fields.media) {
    media.push(
      known.has(m.id)
        ? { id: m.id, caption: m.caption ?? null }
        : { photo_url: await uploadable(m.photo), aspect: m.photo.aspect, caption: m.caption ?? null },
    );
  }

  // Leave the cover alone unless it changed.
  const coverUnchanged = existing?.remote && fields.cover === existing.cover;
  const cover = coverUnchanged
    ? {}
    : { cover_url: fields.cover ? await uploadable(fields.cover) : null, cover_aspect: fields.cover?.aspect ?? null };

  const body = {
    title: fields.title,
    description: fields.description,
    city: fields.city,
    categories: fields.categories,
    visibility: fields.visibility,
    ...cover,
    media,
  };

  try {
    const res = existing?.remote
      ? await api<{ scrapbook: ApiScrapbook }>(`/api/scrapbooks/${existing.id}`, { method: 'PUT', body, ...auth, timeoutMs: 120_000 })
      : await api<{ scrapbook: ApiScrapbook }>('/api/scrapbooks', { method: 'POST', body, ...auth, timeoutMs: 120_000 });
    return res.scrapbook;
  } catch (err) {
    // An API deployed before shared scrapbooks has no such route (404), or no tables yet (500).
    if (!existing?.remote && err instanceof ApiError && (err.status === 404 || err.status === 500)) {
      throw new ApiError(err.status, 'The server isn’t set up for shared scrapbooks yet. It needs the latest API deployed and sql/schema.sql run.');
    }
    throw err;
  }
}

export async function joinScrapbook(auth: Auth, code: string): Promise<ApiScrapbook> {
  const res = await api<{ scrapbook: ApiScrapbook }>('/api/scrapbooks/join', {
    method: 'POST',
    body: { code: code.trim().toUpperCase() },
    ...auth,
  });
  return res.scrapbook;
}
