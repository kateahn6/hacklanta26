const required = (value: string | undefined, name: string): string => {
  if (!value) {
    console.warn(`[unfold] ${name} is not set — copy .env.example to .env and restart Expo`);
  }
  return value ?? '';
};

export const AUTH0_DOMAIN = required(
  process.env.EXPO_PUBLIC_AUTH0_DOMAIN,
  'EXPO_PUBLIC_AUTH0_DOMAIN'
);
export const AUTH0_CLIENT_ID = required(
  process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID,
  'EXPO_PUBLIC_AUTH0_CLIENT_ID'
);
export const AUTH0_AUDIENCE = required(
  process.env.EXPO_PUBLIC_AUTH0_AUDIENCE,
  'EXPO_PUBLIC_AUTH0_AUDIENCE'
);
export const AUTH0_CONNECTION = process.env.EXPO_PUBLIC_AUTH0_CONNECTION ?? '';
/**
 * The Express server's address. Never localhost: a phone running Expo Go
 * cannot reach the laptop's loopback, so this is an ngrok / Cloudflare tunnel
 * URL pointing at the API's PORT.
 */
export const API_URL = (
  required(process.env.EXPO_PUBLIC_API_URL, 'EXPO_PUBLIC_API_URL') || ''
).replace(/\/$/, '');

export const AUTH0_ISSUER = AUTH0_DOMAIN ? `https://${AUTH0_DOMAIN}` : '';
