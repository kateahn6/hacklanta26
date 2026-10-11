const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Minimal base64 decode — avoids depending on atob being present in Hermes. */
function decodeBase64(input: string): string {
  const clean = input.replace(/[^A-Za-z0-9+/]/g, '');
  let bits = 0;
  let acc = 0;
  let out = '';
  for (const ch of clean) {
    const value = B64.indexOf(ch);
    if (value < 0) continue;
    acc = (acc << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out += String.fromCharCode((acc >> bits) & 0xff);
    }
  }
  return out;
}

/** Turns a latin1 byte string into UTF-8 text, so accented names survive. */
function utf8(bytes: string): string {
  try {
    return decodeURIComponent(
      bytes
        .split('')
        .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join('')
    );
  } catch {
    return bytes;
  }
}

export type IdTokenClaims = {
  sub?: string;
  name?: string;
  email?: string;
  picture?: string;
  exp?: number;
};

/**
 * Reads the claims out of an ID token without verifying it. Safe here: the
 * token came straight from Auth0's token endpoint over TLS, and the API
 * verifies the access token properly before trusting anything.
 */
export function readIdToken(idToken: string | null | undefined): IdTokenClaims {
  if (!idToken) return {};
  const parts = idToken.split('.');
  if (parts.length < 2) return {};
  try {
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(utf8(decodeBase64(payload))) as IdTokenClaims;
  } catch {
    return {};
  }
}
