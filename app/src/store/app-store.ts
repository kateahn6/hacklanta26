import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Place, Postcard, Scrapbook } from '@/types';

interface AppState {
  /** Content created or edited on this device. Entries override seed items with the same id. */
  userPlaces: Place[];
  userPostcards: Postcard[];
  userScrapbooks: Scrapbook[];

  upsertPlace: (place: Place) => void;
  upsertPostcard: (postcard: Postcard) => void;
  upsertScrapbook: (scrapbook: Scrapbook) => void;
}

type PersistedState = Pick<AppState, 'userPlaces' | 'userPostcards' | 'userScrapbooks'>;

const upsert = <T extends { id: string }>(list: T[], item: T): T[] =>
  list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item];

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      userPlaces: [],
      userPostcards: [],
      userScrapbooks: [],

      upsertPlace: (place) => set((s) => ({ userPlaces: upsert(s.userPlaces, place) })),
      upsertPostcard: (postcard) => set((s) => ({ userPostcards: upsert(s.userPostcards, postcard) })),
      upsertScrapbook: (scrapbook) => set((s) => ({ userScrapbooks: upsert(s.userScrapbooks, scrapbook) })),
    }),
    {
      name: 'noted.app-state.v1',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ userPlaces, userPostcards, userScrapbooks }): PersistedState => ({
        userPlaces,
        userPostcards,
        userScrapbooks,
      }),
      // Version 1 scrapbooks were lists of postcards; they can't be shown as photo scrapbooks, so drop them.
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Partial<PersistedState>;
        const userScrapbooks = (state.userScrapbooks ?? []).filter(
          (s) => version >= 2 || Array.isArray((s as Partial<Scrapbook>).media),
        );
        return { userPlaces: state.userPlaces ?? [], userPostcards: state.userPostcards ?? [], userScrapbooks };
      },
    },
  ),
);
