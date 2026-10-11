import { useMemo } from 'react';

import { seedContent } from '@/data/content-source';
import { useApiContent } from '@/lib/api-content';
import type { Photo, Place, Postcard, Scrapbook, User } from '@/types';

import { useAppStore } from './app-store';

export interface Content {
  users: User[];
  places: Place[];
  postcards: Postcard[];
  scrapbooks: Scrapbook[];
  userById: Map<string, User>;
  placeById: Map<string, Place>;
  postcardById: Map<string, Postcard>;
  scrapbookById: Map<string, Scrapbook>;
}

/**
 * Bundled image ids are not stable across builds, so an edited copy of a seed
 * item always takes its photo from the seed.
 */
function keepSeedPhoto(seedPhoto: Photo | null | undefined, photo: Photo | null): Photo | null {
  return photo && typeof photo.source === 'number' && seedPhoto !== undefined ? seedPhoto : photo;
}

function merge<T extends { id: string }>(seed: T[], overrides: T[], fix: (override: T, seedItem: T | undefined) => T): T[] {
  const byId = new Map(seed.map((item) => [item.id, item]));
  for (const override of overrides) byId.set(override.id, fix(override, byId.get(override.id)));
  return [...byId.values()];
}

/**
 * Live API content, merged with everything created or edited on this device.
 *
 * The bundled seed is only a fallback: as soon as the API returns a single
 * place it takes over completely, so the app never shows a mix of real and
 * invented content. With no API (not configured, offline) the seed keeps every
 * screen populated instead of blank.
 */
export function useContent(): Content {
  const api = useApiContent();
  const userPlaces = useAppStore((s) => s.userPlaces);
  const userPostcards = useAppStore((s) => s.userPostcards);
  const userScrapbooks = useAppStore((s) => s.userScrapbooks);
  const deletedIds = useAppStore((s) => s.deletedIds);

  return useMemo(() => {
    const live = api.places.length > 0 || api.scrapbooks.some((s) => s.remote);
    const base = live ? api : seedContent;
    const places = merge(base.places, userPlaces, (p) => p);
    const deleted = new Set(deletedIds);
    const postcards = merge(base.postcards, userPostcards, (p, seed) => ({
      ...p,
      photo: keepSeedPhoto(seed?.photo, p.photo),
    })).filter((p) => !deleted.has(p.id));
    const scrapbooks = merge(base.scrapbooks, userScrapbooks, (s, seed) => ({
      ...s,
      cover: keepSeedPhoto(seed?.cover, s.cover),
      media: s.media.map((m) => {
        const seedPhoto = seed?.media.find((x) => x.id === m.id)?.photo;
        return { ...m, photo: keepSeedPhoto(seedPhoto, m.photo) ?? m.photo };
      }),
    })).filter((s) => !deleted.has(s.id));
    const users = live ? api.users : seedContent.users;

    return {
      users,
      places,
      postcards,
      scrapbooks,
      userById: new Map(users.map((u) => [u.id, u])),
      placeById: new Map(places.map((p) => [p.id, p])),
      postcardById: new Map(postcards.map((p) => [p.id, p])),
      scrapbookById: new Map(scrapbooks.map((s) => [s.id, s])),
    };
  }, [api, deletedIds, userPlaces, userPostcards, userScrapbooks]);
}
