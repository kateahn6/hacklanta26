import 'dotenv/config';

type Key =
  | 'PORT'
  | 'AUTH0_DOMAIN'
  | 'AUTH0_AUDIENCE'
  | 'DATABASE_URL'
  | 'GEMINI_API_KEY'
  | 'GEMINI_MODEL'
  | 'GEMINI_TIMEOUT_MS'
  | 'DEMO_MODE';

/** Variables without which the server cannot answer a single request. */
const REQUIRED: Key[] = ['AUTH0_DOMAIN', 'AUTH0_AUDIENCE', 'DATABASE_URL'];

export function env(key: Key): string | undefined {
  const value = process.env[key];
  return value && value.length > 0 ? value : undefined;
}

export function require_(key: Key): string {
  const value = env(key);
  if (!value) {
    throw new Error(`${key} is not set — copy api/.env.example to api/.env and fill it in`);
  }
  return value;
}

export const DEMO_MODE = () => env('DEMO_MODE') === '1';

/** Issuer always carries the trailing slash Auth0 puts in the `iss` claim. */
export function issuer(): string {
  const domain = require_('AUTH0_DOMAIN')
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');
  return `https://${domain}/`;
}

/** Logged once at startup so a missing variable is obvious before the demo. */
export function reportEnv(): { missing: Key[] } {
  const missing = REQUIRED.filter((key) => !env(key));
  for (const key of missing) {
    console.error(`[unfold] MISSING ${key} — requests that need it will fail`);
  }
  if (!env('GEMINI_API_KEY')) {
    console.warn(
      `[unfold] GEMINI_API_KEY is not set — /api/analyze will ${
        DEMO_MODE() ? 'return the canned demo page' : 'fail'
      }`
    );
  }
  return { missing };
}
