import { categoryById } from '@/data/categories';
import type { Content } from '@/store/content';
import type { CategoryId, Photo, Place, Postcard, Scrapbook, ScrapbookMedia, User } from '@/types';

import { isPostcardPublic, isScrapbookPublic } from './visibility';

export interface PostcardItem {
  kind: 'postcard';
  key: string;
  postcard: Postcard;
  place: Place;
  author: User;
  photo: Photo | null;
  categories: CategoryId[];
}

export interface ScrapbookItem {
  kind: 'scrapbook';
  key: string;
  scrapbook: Scrapbook;
  author: User;
  cover: Photo | null;
  media: ScrapbookMedia[];
  categories: CategoryId[];
}

export type FeedItem = PostcardItem | ScrapbookItem;

const UNKNOWN_USER: User = { id: 'unknown', name: 'Someone', handle: 'someone', neighborhood: '' };

export function toPostcardItem(content: Content, postcard: Postcard): PostcardItem | null {
  const place = content.placeById.get(postcard.placeId);
  if (!place) return null;
  return {
    kind: 'postcard',
    key: `postcard:${postcard.id}`,
    postcard,
    place,
    author: content.userById.get(postcard.authorId) ?? UNKNOWN_USER,
    photo: postcard.photo,
    categories: place.categories,
  };
}

export function toScrapbookItem(content: Content, scrapbook: Scrapbook): ScrapbookItem {
  return {
    kind: 'scrapbook',
    key: `scrapbook:${scrapbook.id}`,
    scrapbook,
    author: content.userById.get(scrapbook.authorId) ?? UNKNOWN_USER,
    cover: scrapbook.cover ?? scrapbook.media[0]?.photo ?? null,
    media: scrapbook.media,
    categories: scrapbook.categories,
  };
}

/** Places linked from a scrapbook's media, for showing it on the map. */
export const scrapbookPlaceIds = (scrapbook: Scrapbook) =>
  new Set(scrapbook.media.flatMap((m) => (m.placeId ? [m.placeId] : [])));

const newestFirst = (a: FeedItem, b: FeedItem) =>
  (b.kind === 'postcard' ? b.postcard.createdAt : b.scrapbook.createdAt).localeCompare(
    a.kind === 'postcard' ? a.postcard.createdAt : a.scrapbook.createdAt,
  );

/** Everything visible in public discovery, newest first. */
export function buildPublicFeed(content: Content, now: number): FeedItem[] {
  const postcards = content.postcards
    .filter((p) => isPostcardPublic(p, now))
    .flatMap((p) => toPostcardItem(content, p) ?? []);
  const scrapbooks = content.scrapbooks
    .filter(isScrapbookPublic)
    .map((s) => toScrapbookItem(content, s))
    .filter((s) => s.media.length > 0);
  return [...postcards, ...scrapbooks].sort(newestFirst);
}

export const matchesCategory = (item: FeedItem, category: CategoryId | null) =>
  category === null || item.categories.includes(category);

export function matchesQuery(item: FeedItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const fields =
    item.kind === 'postcard'
      ? [item.place.name, item.place.neighborhood, item.place.city, item.postcard.note, item.author.name]
      : [
          item.scrapbook.title,
          item.scrapbook.description,
          item.scrapbook.city,
          item.author.name,
          ...item.media.map((m) => m.caption ?? ''),
        ];
  fields.push(...item.categories.map((c) => categoryById(c).label));
  return fields.some((field) => field.toLowerCase().includes(q));
}

export function filterFeed(items: FeedItem[], category: CategoryId | null, query: string): FeedItem[] {
  return items.filter((item) => matchesCategory(item, category) && matchesQuery(item, query));
}

export const itemTitle = (item: FeedItem) => (item.kind === 'postcard' ? item.place.name : item.scrapbook.title);
export const itemAspect = (item: FeedItem) => (item.kind === 'postcard' ? item.photo?.aspect : item.cover?.aspect) ?? 1;
