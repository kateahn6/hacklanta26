import { useMemo } from 'react';

import { seedContent } from '@/data/content-source';
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

/** Seed content merged with everything created or edited on this device. */
export function useContent(): Content {
  const userPlaces = useAppStore((s) => s.userPlaces);
  const userPostcards = useAppStore((s) => s.userPostcards);
  const userScrapbooks = useAppStore((s) => s.userScrapbooks);

  return useMemo(() => {
    const places = merge(seedContent.places, userPlaces, (p) => p);
    const postcards = merge(seedContent.postcards, userPostcards, (p, seed) => ({
      ...p,
      photo: keepSeedPhoto(seed?.photo, p.photo),
    }));
    const scrapbooks = merge(seedContent.scrapbooks, userScrapbooks, (s, seed) => ({
      ...s,
      cover: keepSeedPhoto(seed?.cover, s.cover),
      media: s.media.map((m) => {
        const seedPhoto = seed?.media.find((x) => x.id === m.id)?.photo;
        return { ...m, photo: keepSeedPhoto(seedPhoto, m.photo) ?? m.photo };
      }),
    }));
    const users = seedContent.users;

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
  }, [userPlaces, userPostcards, userScrapbooks]);
}
