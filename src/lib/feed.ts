import { categoryById } from '@/data/categories';
import type { Content } from '@/store/content';
import type { CategoryId, Photo, Place, Postcard, Scrapbook, User } from '@/types';

import { canViewPostcard, isPostcardPublic, isScrapbookPublic } from './visibility';

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
  /** Stops the viewer is allowed to see, in order. */
  stops: { postcard: Postcard; place: Place; time?: string }[];
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

export function toScrapbookItem(content: Content, scrapbook: Scrapbook, now: number): ScrapbookItem {
  const stops = scrapbook.stops.flatMap((stop) => {
    const postcard = content.postcardById.get(stop.postcardId);
    const place = postcard && content.placeById.get(postcard.placeId);
    return postcard && place && canViewPostcard(postcard, now) ? [{ postcard, place, time: stop.time }] : [];
  });
  return {
    kind: 'scrapbook',
    key: `scrapbook:${scrapbook.id}`,
    scrapbook,
    author: content.userById.get(scrapbook.authorId) ?? UNKNOWN_USER,
    cover: scrapbook.cover ?? stops.find((s) => s.postcard.photo)?.postcard.photo ?? null,
    stops,
    categories: [...new Set(stops.flatMap((s) => s.place.categories))],
  };
}

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
    .map((s) => toScrapbookItem(content, s, now))
    .filter((s) => s.stops.length > 0);
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
          ...item.stops.flatMap((s) => [s.place.name, s.place.neighborhood]),
        ];
  fields.push(...item.categories.map((c) => categoryById(c).label));
  return fields.some((field) => field.toLowerCase().includes(q));
}

export function filterFeed(items: FeedItem[], category: CategoryId | null, query: string): FeedItem[] {
  return items.filter((item) => matchesCategory(item, category) && matchesQuery(item, query));
}

export const itemTitle = (item: FeedItem) => (item.kind === 'postcard' ? item.place.name : item.scrapbook.title);
export const itemAspect = (item: FeedItem) => (item.kind === 'postcard' ? item.photo?.aspect : item.cover?.aspect) ?? 1;
