/**
 * Palette and map region carried over from the frontend prototype that landed
 * on main (src/app/index.tsx). Keeping the names short (C) as it had them, so
 * ported markup reads the same.
 */
export const C = {
  cream: '#F1E8D8',
  paper: '#FFFCF7',
  ink: '#211F1C',
  cherry: '#4A1018',
  olive: '#292E1E',
  muted: '#59633A',
  sage: '#C8CDB7',
  caramel: '#D4B38B',
  chocolate: '#4A3027',
  rose: '#E7D5D0',
  line: '#DED3C2',
  white: '#FFFFFF',
  /** Added for the "friends keep returning" layer, which the prototype predates. */
  returning: '#1F7A5A',
  returningSoft: '#DFF1E9',
} as const;

/** Atlanta — the demo city the seed data lives in. */
export const DEMO_REGION = {
  latitude: 33.765,
  longitude: -84.377,
  latitudeDelta: 0.075,
  longitudeDelta: 0.075,
} as const;
