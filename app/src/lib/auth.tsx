import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  AUTH0_AUDIENCE,
  AUTH0_CLIENT_ID,
  AUTH0_CONNECTION,
  AUTH0_ISSUER,
} from '@/lib/config';
import { readIdToken, type IdTokenClaims } from '@/lib/jwt';

const KEY_ACCESS = 'unfold.access_token';
const KEY_ID = 'unfold.id_token';
const KEY_REFRESH = 'unfold.refresh_token';
const KEY_EXPIRES = 'unfold.expires_at';

/**
 * In Expo Go this resolves to exp://<host>:8081/--/redirect, which must be
 * listed in the Auth0 application's Allowed Callback URLs. It is logged and
 * shown on the login screen so it can be copied over.
 */
export const REDIRECT_URI = AuthSession.makeRedirectUri({
  scheme: 'unfold',
  path: 'redirect',
});

type Session = {
  accessToken: string;
  idToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
};

type AuthValue = {
  ready: boolean;
  session: Session | null;
  profile: IdTokenClaims;
  busy: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  redirectUri: string;
};

const AuthContext = createContext<AuthValue | null>(null);

async function store(session: Session | null) {
  if (!session) {
    await Promise.all(
      [KEY_ACCESS, KEY_ID, KEY_REFRESH, KEY_EXPIRES].map((k) =>
        SecureStore.deleteItemAsync(k).catch(() => {})
      )
    );
    return;
  }
  await SecureStore.setItemAsync(KEY_ACCESS, session.accessToken);
  await SecureStore.setItemAsync(KEY_ID, session.idToken ?? '');
  await SecureStore.setItemAsync(KEY_REFRESH, session.refreshToken ?? '');
  await SecureStore.setItemAsync(KEY_EXPIRES, String(session.expiresAt ?? 0));
}

async function load(): Promise<Session | null> {
  const accessToken = await SecureStore.getItemAsync(KEY_ACCESS);
  if (!accessToken) return null;
  const [idToken, refreshToken, expiresAt] = await Promise.all([
    SecureStore.getItemAsync(KEY_ID),
    SecureStore.getItemAsync(KEY_REFRESH),
    SecureStore.getItemAsync(KEY_EXPIRES),
  ]);
  return {
    accessToken,
    idToken: idToken || null,
    refreshToken: refreshToken || null,
    expiresAt: Number(expiresAt) || null,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const discovery = AuthSession.useAutoDiscovery(AUTH0_ISSUER);
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[unfold] Auth0 redirect URI (add this to Allowed Callback URLs):', REDIRECT_URI);
  }, []);

  useEffect(() => {
    load()
      .then(setSession)
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const extraParams: Record<string, string> = useMemo(() => {
    const params: Record<string, string> = {};
    // `audience` is what makes Auth0 issue a JWT access token our API accepts.
    if (AUTH0_AUDIENCE) params.audience = AUTH0_AUDIENCE;
    if (AUTH0_CONNECTION) params.connection = AUTH0_CONNECTION;
    return params;
  }, []);

  const [request, , promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: AUTH0_CLIENT_ID,
      redirectUri: REDIRECT_URI,
      responseType: AuthSession.ResponseType.Code,
      scopes: ['openid', 'profile', 'email', 'offline_access'],
      usePKCE: true,
      extraParams,
    },
    discovery ?? null
  );

  const signIn = useCallback(async () => {
    if (!discovery || !request) {
      setError('Still reaching Auth0 — check EXPO_PUBLIC_AUTH0_DOMAIN and try again.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await promptAsync();
      if (result.type !== 'success') {
        if (result.type === 'error') {
          setError(result.error?.message ?? 'Auth0 returned an error');
        }
        return;
      }
      const tokens = await AuthSession.exchangeCodeAsync(
        {
          clientId: AUTH0_CLIENT_ID,
          code: result.params.code,
          redirectUri: REDIRECT_URI,
          extraParams: request.codeVerifier
            ? { code_verifier: request.codeVerifier }
            : undefined,
        },
        discovery
      );
      const next: Session = {
        accessToken: tokens.accessToken,
        idToken: tokens.idToken ?? null,
        refreshToken: tokens.refreshToken ?? null,
        expiresAt: tokens.expiresIn ? Date.now() + tokens.expiresIn * 1000 : null,
      };
      await store(next);
      setSession(next);
    } catch (err: any) {
      console.warn('[unfold] sign-in failed', err);
      setError(err?.message ?? 'Sign-in failed');
    } finally {
      setBusy(false);
    }
  }, [discovery, promptAsync, request]);

  const signOut = useCallback(async () => {
    await store(null);
    setSession(null);
  }, []);

  const getAccessToken = useCallback(async () => {
    if (!session) return null;
    const stale = session.expiresAt != null && session.expiresAt - 60_000 < Date.now();
    if (!stale || !session.refreshToken || !discovery) return session.accessToken;
    try {
      const refreshed = await AuthSession.refreshAsync(
        {
          clientId: AUTH0_CLIENT_ID,
          refreshToken: session.refreshToken,
          extraParams: AUTH0_AUDIENCE ? { audience: AUTH0_AUDIENCE } : undefined,
        },
        discovery
      );
      const next: Session = {
        accessToken: refreshed.accessToken,
        idToken: refreshed.idToken ?? session.idToken,
        refreshToken: refreshed.refreshToken ?? session.refreshToken,
        expiresAt: refreshed.expiresIn ? Date.now() + refreshed.expiresIn * 1000 : null,
      };
      await store(next);
      setSession(next);
      return next.accessToken;
    } catch (err) {
      console.warn('[unfold] token refresh failed, using the existing token', err);
      return session.accessToken;
    }
  }, [discovery, session]);

  const value = useMemo<AuthValue>(
    () => ({
      ready,
      session,
      profile: readIdToken(session?.idToken),
      busy,
      error,
      signIn,
      signOut,
      getAccessToken,
      redirectUri: REDIRECT_URI,
    }),
    [busy, error, getAccessToken, ready, session, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
