import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Photo, Place, Postcard, SavedKind, SavedRef, Scrapbook, ScrapbookStop, Visibility } from '@/types';

export const savedKey = (ref: SavedRef) => `${ref.kind}:${ref.id}`;

/** Working state of the scrapbook form, shared with the "add postcards" screens. */
export interface ScrapbookComposer {
  editingId: string | null;
  title: string;
  description: string;
  city: string;
  cover: Photo | null;
  visibility: Visibility;
  stops: ScrapbookStop[];
}

interface AppState {
  /** Content created or edited on this device. Entries override seed items with the same id. */
  userPlaces: Place[];
  userPostcards: Postcard[];
  userScrapbooks: Scrapbook[];
  saved: string[];
  defaultVisibility: Visibility;
  composer: ScrapbookComposer | null;

  toggleSaved: (ref: SavedRef) => void;
  upsertPlace: (place: Place) => void;
  upsertPostcard: (postcard: Postcard) => void;
  upsertScrapbook: (scrapbook: Scrapbook) => void;
  setDefaultVisibility: (visibility: Visibility) => void;

  startComposer: (composer: ScrapbookComposer) => void;
  updateComposer: (patch: Partial<ScrapbookComposer>) => void;
  addComposerStops: (postcardIds: string[]) => void;
  removeComposerStop: (index: number) => void;
  moveComposerStop: (index: number, direction: -1 | 1) => void;
  clearComposer: () => void;
}

const upsert = <T extends { id: string }>(list: T[], item: T): T[] =>
  list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item];

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      userPlaces: [],
      userPostcards: [],
      userScrapbooks: [],
      saved: ['scrapbook:sb-quiet-afternoon', 'postcard:pc-variety-front-row', 'postcard:pc-garden-bloom'],
      defaultVisibility: 'public',
      composer: null,

      toggleSaved: (ref) =>
        set((s) => {
          const key = savedKey(ref);
          return { saved: s.saved.includes(key) ? s.saved.filter((k) => k !== key) : [key, ...s.saved] };
        }),
      upsertPlace: (place) => set((s) => ({ userPlaces: upsert(s.userPlaces, place) })),
      upsertPostcard: (postcard) => set((s) => ({ userPostcards: upsert(s.userPostcards, postcard) })),
      upsertScrapbook: (scrapbook) => set((s) => ({ userScrapbooks: upsert(s.userScrapbooks, scrapbook) })),
      setDefaultVisibility: (defaultVisibility) => set({ defaultVisibility }),

      startComposer: (composer) => set({ composer }),
      updateComposer: (patch) => set((s) => (s.composer ? { composer: { ...s.composer, ...patch } } : {})),
      addComposerStops: (postcardIds) =>
        set((s) => {
          if (!s.composer) return {};
          const existing = new Set(s.composer.stops.map((stop) => stop.postcardId));
          const added = postcardIds.filter((id) => !existing.has(id)).map((postcardId) => ({ postcardId }));
          return { composer: { ...s.composer, stops: [...s.composer.stops, ...added] } };
        }),
      removeComposerStop: (index) =>
        set((s) => (s.composer ? { composer: { ...s.composer, stops: s.composer.stops.filter((_, i) => i !== index) } } : {})),
      moveComposerStop: (index, direction) =>
        set((s) => {
          if (!s.composer) return {};
          const target = index + direction;
          if (target < 0 || target >= s.composer.stops.length) return {};
          const stops = [...s.composer.stops];
          [stops[index], stops[target]] = [stops[target], stops[index]];
          return { composer: { ...s.composer, stops } };
        }),
      clearComposer: () => set({ composer: null }),
    }),
    {
      name: 'noted.app-state.v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ userPlaces, userPostcards, userScrapbooks, saved, defaultVisibility }) => ({
        userPlaces,
        userPostcards,
        userScrapbooks,
        saved,
        defaultVisibility,
      }),
    },
  ),
);

export function useIsSaved(kind: SavedKind, id: string): boolean {
  return useAppStore((s) => s.saved.includes(savedKey({ kind, id })));
}
