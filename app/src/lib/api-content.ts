import { useMemo } from 'react';

import { DEMO_USER_ID } from '@/data/content-source';
import { useAuth } from '@/lib/auth';
import { useData } from '@/lib/data';
import type { ApiScrapbook, Entry, Place as ApiPlace, ReturningPlace } from '@/lib/types';
import type { CategoryId, Place, Postcard, Scrapbook, User } from '@/types';

/**
 * Adapts the live API's shape (places, each holding entries) to the frontend's
 * domain model (places, postcards, scrapbooks, users).
 *
 * One entry becomes one postcard. A place that several friends have written
 * about becomes a scrapbook whose stops are those postcards, which is how the
 * "shared scrapbook" idea maps onto the schema without a scrapbooks table.
 */

const CATEGORY_RULES: [CategoryId, RegExp][] = [
  ['food', /coffee|cafe|espresso|tea|food|dinner|lunch|taco|pizza|market|bakery|brunch|bar/],
  ['art', /art|mural|gallery|museum|design|paint/],
  ['music', /music|show|band|loud|concert|vinyl/],
  ['nature', /park|trail|garden|nature|bench|outside|walk|river/],
  ['culture', /book|history|theatre|theater|film|read|cemetery/],
];

function categoriesFor(entries: Entry[]): CategoryId[] {
  const text = entries
    .flatMap((e) => [...e.tags, e.caption ?? '', e.story ?? ''])
    .join(' ')
    .toLowerCase();
  const found = CATEGORY_RULES.filter(([, re]) => re.test(text)).map(([id]) => id);
  return found.length > 0 ? found : ['hidden'];
}

function toPlace(place: ApiPlace): Place {
  return {
    id: place.id,
    name: place.name,
    neighborhood: '',
    city: 'Atlanta, GA',
    categories: categoriesFor(place.entries),
    coordinate: { latitude: Number(place.lat), longitude: Number(place.lng) },
  };
}

/**
 * The rest of the app recognizes the signed-in person by DEMO_USER_ID (seed
 * data, device-local posts, isOwn). Their API rows are mapped onto it so "your
 * posts", editing, and deleting work the same with live data.
 */
const asAuthor = (userId: string, me: string | undefined) => (me && userId === me ? DEMO_USER_ID : userId);

function toPostcard(entry: Entry, placeId: string, me: string | undefined): Postcard {
  const photo = entry.photo_urls[0];
  return {
    id: entry.id,
    placeId,
    authorId: asAuthor(entry.user_id, me),
    // Remote URLs and base64 data URLs both work as { uri }.
    photo: photo ? { source: { uri: photo }, aspect: 0.8 } : null,
    note: entry.story ?? entry.caption ?? '',
    // The postcard message Gemini wrote, which the postcard view shows.
    tip: entry.postcard_text ?? undefined,
    visibility: 'public',
    status: 'published',
    createdAt: entry.created_at,
    expiresAt: null,
  };
}

const KNOWN_CATEGORIES: CategoryId[] = ['food', 'art', 'music', 'nature', 'culture', 'hidden'];

function toSharedScrapbook(s: ApiScrapbook, me: string | undefined): Scrapbook {
  return {
    id: s.id,
    title: s.title,
    description: s.description,
    city: s.city,
    authorId: asAuthor(s.owner_id, me),
    cover: s.cover_url ? { source: { uri: s.cover_url }, aspect: s.cover_aspect ?? 1 } : null,
    categories: s.categories.filter((c): c is CategoryId => KNOWN_CATEGORIES.includes(c as CategoryId)),
    media: s.media.map((m) => ({
      id: m.id,
      photo: { source: { uri: m.photo_url }, aspect: m.aspect },
      caption: m.caption ?? undefined,
      authorId: asAuthor(m.author_id, me),
    })),
    visibility: s.visibility,
    status: 'published',
    createdAt: s.created_at,
    remote: true,
    accessCode: s.access_code ?? undefined,
    collaboratorIds: s.members.map((member) => asAuthor(member.id, me)),
  };
}

function handleFor(name: string | null, id: string): string {
  const base = (name ?? id).toLowerCase().replace(/[^a-z0-9]+/g, '');
  return `@${base.slice(0, 16) || 'friend'}`;
}

export interface ApiContent {
  users: User[];
  places: Place[];
  postcards: Postcard[];
  scrapbooks: Scrapbook[];
  /** Return-visit stats per place id, for the "they keep going back" layer. */
  returningByPlace: Map<string, ReturningPlace>;
  loading: boolean;
  error: string | null;
}

export function useApiContent(): ApiContent {
  const { places: apiPlaces, returning, scrapbooks: apiScrapbooks, loading, error } = useData();
  const { profile } = useAuth();
  const me = profile?.sub;
  const myName = profile?.name;

  return useMemo(() => {
    const places: Place[] = [];
    const postcards: Postcard[] = [];
    const scrapbooks: Scrapbook[] = [];
    const users = new Map<string, User>();

    for (const apiPlace of apiPlaces) {
      places.push(toPlace(apiPlace));

      for (const entry of apiPlace.entries) {
        postcards.push(toPostcard(entry, apiPlace.id, me));
        const authorId = asAuthor(entry.user_id, me);
        if (!users.has(authorId)) {
          users.set(authorId, {
            id: authorId,
            name: entry.user_name ?? 'A friend',
            handle: handleFor(entry.user_name, entry.user_id),
            neighborhood: 'Atlanta',
          });
        }
      }

      // A place several people have written about reads as a shared scrapbook,
      // whose media is every photo they left there.
      if (apiPlace.entries.length > 1) {
        const first = apiPlace.entries[0];
        const media = apiPlace.entries.flatMap((entry) =>
          entry.photo_urls.map((uri, i) => ({
            id: `${entry.id}-${i}`,
            photo: { source: { uri }, aspect: 0.8 },
            caption: entry.caption ?? undefined,
            placeId: apiPlace.id,
          }))
        );
        if (media.length > 0) {
          scrapbooks.push({
            id: `sb-${apiPlace.id}`,
            title: apiPlace.name,
            description: `${apiPlace.entries.length} entries from your friends.`,
            city: 'Atlanta, GA',
            authorId: asAuthor(apiPlace.created_by, me),
            cover: media[0].photo,
            categories: categoriesFor(apiPlace.entries),
            media,
            visibility: 'public',
            status: 'published',
            createdAt: first.created_at,
          });
        }
      }

      const creatorId = asAuthor(apiPlace.created_by, me);
      if (!users.has(creatorId)) {
        users.set(creatorId, {
          id: creatorId,
          name: apiPlace.created_by_name ?? 'A friend',
          handle: handleFor(apiPlace.created_by_name, apiPlace.created_by),
          neighborhood: 'Atlanta',
        });
      }
    }

    postcards.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    for (const apiScrapbook of apiScrapbooks) {
      scrapbooks.push(toSharedScrapbook(apiScrapbook, me));
      for (const member of [{ id: apiScrapbook.owner_id, name: apiScrapbook.owner_name }, ...apiScrapbook.members]) {
        const id = asAuthor(member.id, me);
        if (!users.has(id) && id !== DEMO_USER_ID) {
          users.set(id, { id, name: member.name ?? 'A friend', handle: handleFor(member.name, member.id), neighborhood: 'Atlanta' });
        }
      }
    }

    // Always know who "you" are, even before your first post, so create and preview have an author.
    if (me && !users.has(DEMO_USER_ID)) {
      users.set(DEMO_USER_ID, {
        id: DEMO_USER_ID,
        name: myName ?? 'You',
        handle: handleFor(myName ?? null, me),
        neighborhood: 'Atlanta',
      });
    }

    return {
      users: [...users.values()],
      places,
      postcards,
      scrapbooks,
      returningByPlace: new Map(returning.map((r) => [r.id, r])),
      loading,
      error,
    };
  }, [apiPlaces, apiScrapbooks, error, loading, me, myName, returning]);
}
