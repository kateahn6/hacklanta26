import { DEMO_USER_ID } from '@/data/content-source';
import type { Postcard, Scrapbook } from '@/types';

/** Published, public, and not expired. The only postcards shown in public discovery. */
export function isPostcardPublic(postcard: Postcard, now: number): boolean {
  return (
    postcard.status === 'published' &&
    postcard.visibility === 'public' &&
    (postcard.expiresAt === null || Date.parse(postcard.expiresAt) > now)
  );
}

export function isScrapbookPublic(scrapbook: Scrapbook): boolean {
  return scrapbook.status === 'published' && scrapbook.visibility === 'public';
}

export const isOwn = (item: { authorId: string }) => item.authorId === DEMO_USER_ID;

/** What the signed-in user may open: public content plus everything they own. */
export const canViewPostcard = (postcard: Postcard, now: number) => isPostcardPublic(postcard, now) || isOwn(postcard);
export const canViewScrapbook = (scrapbook: Scrapbook) => isScrapbookPublic(scrapbook) || isOwn(scrapbook);

export function isExpired(postcard: Postcard, now: number): boolean {
  return postcard.expiresAt !== null && Date.parse(postcard.expiresAt) <= now;
}

/** "Expires in 20h", "Expires in 3d", or "Expired". */
export function expiryLabel(expiresAt: string, now: number): string {
  const remaining = Date.parse(expiresAt) - now;
  if (remaining <= 0) return 'Expired';
  const hours = Math.ceil(remaining / (60 * 60 * 1000));
  if (hours < 48) return `Expires in ${hours}h`;
  return `Expires in ${Math.ceil(hours / 24)}d`;
}
