import { useMemo } from 'react';

import { useAuth } from '@/lib/auth';
import { useData } from '@/lib/data';
import type { Entry, Place as ApiPlace, ReturningPlace } from '@/lib/types';
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

function toPostcard(entry: Entry, placeId: string): Postcard {
  const photo = entry.photo_urls[0];
  return {
    id: entry.id,
    placeId,
    authorId: entry.user_id,
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
  const { places: apiPlaces, returning, loading, error } = useData();
  const { profile } = useAuth();

  return useMemo(() => {
    const places: Place[] = [];
    const postcards: Postcard[] = [];
    const scrapbooks: Scrapbook[] = [];
    const users = new Map<string, User>();

    for (const apiPlace of apiPlaces) {
      places.push(toPlace(apiPlace));

      for (const entry of apiPlace.entries) {
        postcards.push(toPostcard(entry, apiPlace.id));
        if (!users.has(entry.user_id)) {
          users.set(entry.user_id, {
            id: entry.user_id,
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
            authorId: apiPlace.created_by,
            cover: media[0].photo,
            categories: categoriesFor(apiPlace.entries),
            media,
            visibility: 'public',
            status: 'published',
            createdAt: first.created_at,
          });
        }
      }

      if (!users.has(apiPlace.created_by)) {
        users.set(apiPlace.created_by, {
          id: apiPlace.created_by,
          name: apiPlace.created_by_name ?? 'A friend',
          handle: handleFor(apiPlace.created_by_name, apiPlace.created_by),
          neighborhood: 'Atlanta',
        });
      }
    }

    // The signed-in user may have written nothing yet, but still has to appear
    // in the directory: the create screen shows them as the author in preview.
    if (profile.sub && !users.has(profile.sub)) {
      users.set(profile.sub, {
        id: profile.sub,
        name: profile.name ?? 'You',
        handle: handleFor(profile.name ?? null, profile.sub),
        neighborhood: 'Atlanta',
      });
    }

    postcards.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return {
      users: [...users.values()],
      places,
      postcards,
      scrapbooks,
      returningByPlace: new Map(returning.map((r) => [r.id, r])),
      loading,
      error,
    };
  }, [apiPlaces, error, loading, profile, returning]);
}
