import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { ApiError, api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Entry, Place, ReturningPlace } from '@/lib/types';

type DataValue = {
  places: Place[];
  returning: ReturningPlace[];
  /** My random public username, assigned by the API on first sign-in. */
  username: string | null;
  /** When I first signed in, from GET /api/me. */
  memberSince: string | null;
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
  const [username, setUsername] = useState<string | null>(null);
  const [memberSince, setMemberSince] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!session) {
      setPlaces([]);
      setReturning([]);
      setUsername(null);
      setMemberSince(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      // Loaded independently: the ranking depends on the continuous aggregate,
      // and a missing aggregate must not blank out the map's pins.
      const [placesRes, returningRes, meRes] = await Promise.allSettled([
        api<{ places: Place[] }>('/api/places', { token, profile }),
        api<{ returning: ReturningPlace[] }>('/api/returning', { token, profile }),
        api<{ user: { username?: string; created_at?: string } }>('/api/me', { token, profile }),
      ]);
      if (meRes.status === 'fulfilled') {
        setUsername(meRes.value.user.username ?? null);
        setMemberSince(meRes.value.user.created_at ?? null);
      }
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
    () => ({ places, returning, username, memberSince, loading, error, refresh, findEntry }),
    [error, findEntry, loading, memberSince, places, refresh, returning, username]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataValue {
  const value = useContext(DataContext);
  if (!value) throw new Error('useData must be used inside DataProvider');
  return value;
}
