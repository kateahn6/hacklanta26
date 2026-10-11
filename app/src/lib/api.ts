import { API_URL } from '@/lib/config';
import type { IdTokenClaims } from '@/lib/jwt';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type Options = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  token: string | null;
  /** Forwards the email for the user row. Name and photo are never sent, for privacy. */
  profile?: IdTokenClaims;
  timeoutMs?: number;
};

export async function api<T>(path: string, options: Options): Promise<T> {
  if (!API_URL) {
    throw new ApiError(
      0,
      'EXPO_PUBLIC_API_URL is not set — put your tunnel URL in app/.env and restart Expo with -c'
    );
  }
  if (!options.token) throw new ApiError(401, 'Not signed in');

  const headers: Record<string, string> = {
    Authorization: `Bearer ${options.token}`,
    'Content-Type': 'application/json',
  };
  if (options.profile?.email) headers['x-user-email'] = options.profile.email;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 30_000);
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body == null ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    if (!res.ok) throw new ApiError(res.status, data?.error ?? `Request failed (${res.status})`);
    return data as T;
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    if (err?.name === 'AbortError') throw new ApiError(408, 'The request timed out');
    throw new ApiError(0, err?.message ?? 'Network error');
  } finally {
    clearTimeout(timer);
  }
}
