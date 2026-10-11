export const Colors = {
  ink: '#1C1A17',
  inkSoft: '#6B6256',
  paper: '#FAF6EF',
  card: '#FFFFFF',
  line: '#E6DED0',
  accent: '#C4552B',
  accentSoft: '#F6E3D8',
  returning: '#1F7A5A',
} as const;

export const Spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const Radius = { sm: 8, md: 14, lg: 22 } as const;

/** Atlanta — the demo city the seed data lives in. */
export const DEMO_REGION = {
  latitude: 33.7556,
  longitude: -84.3626,
  latitudeDelta: 0.09,
  longitudeDelta: 0.09,
} as const;
