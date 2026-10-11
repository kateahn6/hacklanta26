import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { ApiError, api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { ApiScrapbook, Entry, Place, ReturningPlace } from '@/lib/types';

type DataValue = {
  places: Place[];
  returning: ReturningPlace[];
  scrapbooks: ApiScrapbook[];
  /** My random public username, assigned by the API on first sign-in. */
  username: string | null;
  /** When I first signed in, from GET /api/me. */
  memberSince: string | null;
  friendCount: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  findEntry: (entryId: string) => { entry: Entry; place: Place } | null;
};

const DataContext = createContext<DataValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { session, profile, getAccessToken, signOut } = useAuth();
  const [places, setPlaces] = useState<Place[]>([]);
  const [returning, setReturning] = useState<ReturningPlace[]>([]);
  const [scrapbooks, setScrapbooks] = useState<ApiScrapbook[]>([]);
  const [username, setUsername] = useState<string | null>(null);
  const [memberSince, setMemberSince] = useState<string | null>(null);
  const [friendCount, setFriendCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!session) {
      setPlaces([]);
      setReturning([]);
      setScrapbooks([]);
      setUsername(null);
      setMemberSince(null);
      setFriendCount(0);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      // Loaded independently: the ranking depends on the continuous aggregate,
      // and a missing aggregate must not blank out the map's pins.
      const [placesRes, returningRes, scrapbooksRes, meRes] = await Promise.allSettled([
        api<{ places: Place[] }>('/api/places', { token, profile }),
        api<{ returning: ReturningPlace[] }>('/api/returning', { token, profile }),
        api<{ scrapbooks: ApiScrapbook[] }>('/api/scrapbooks', { token, profile }),
        api<{ user: { username?: string; created_at?: string }; friends?: unknown[] }>('/api/me', { token, profile }),
      ]);
      if (meRes.status === 'fulfilled') {
        setUsername(meRes.value.user.username ?? null);
        setMemberSince(meRes.value.user.created_at ?? null);
        setFriendCount(meRes.value.friends?.length ?? 0);
      }
      // Shared scrapbooks are optional: an API without them must not break the map.
      setScrapbooks(scrapbooksRes.status === 'fulfilled' ? (scrapbooksRes.value.scrapbooks ?? []) : []);
      if (placesRes.status === 'fulfilled') {
        setPlaces(placesRes.value.places ?? []);
      } else {
        throw placesRes.reason;
      }
      if (returningRes.status === 'fulfilled') {
        setReturning(returningRes.value.returning ?? []);
      } else {
        setReturning([]);
        setError(
          `Places loaded, but the returning ranking failed: ${
            returningRes.reason?.message ?? 'unknown error'
          }`
        );
      }
    } catch (err: any) {
      setError(err?.message ?? 'Could not load the map');
      // An expired or revoked token that could not be refreshed: drop back to
      // the login screen instead of sitting on a dead session.
      if (err instanceof ApiError && err.status === 401) await signOut();
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, profile, session, signOut]);

  // Nothing fetches on mount: the map screen calls refresh() from a focus
  // effect, which also covers coming back from the new-entry screen.
  const findEntry = useCallback(
    (entryId: string) => {
      for (const place of places) {
        const entry = place.entries.find((e) => e.id === entryId);
        if (entry) return { entry, place };
      }
      return null;
    },
    [places]
  );

  const value = useMemo<DataValue>(
    () => ({ places, returning, scrapbooks, username, memberSince, friendCount, loading, error, refresh, findEntry }),
    [error, findEntry, friendCount, loading, memberSince, places, refresh, returning, scrapbooks, username]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataValue {
  const value = useContext(DataContext);
  if (!value) throw new Error('useData must be used inside DataProvider');
  return value;
}
