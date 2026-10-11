import type { Place } from '@/types';

const atl = (
  id: string,
  name: string,
  neighborhood: string,
  categories: Place['categories'],
  latitude: number,
  longitude: number,
): Place => ({ id, name, neighborhood, city: 'Atlanta', categories, coordinate: { latitude, longitude } });

export const places: Place[] = [
  atl('p-ponce', 'Ponce City Market', 'Old Fourth Ward', ['food'], 33.7726, -84.3655),
  atl('p-krog-market', 'Krog Street Market', 'Inman Park', ['food'], 33.7573, -84.3636),
  atl('p-krog-tunnel', 'Krog Street Tunnel', 'Cabbagetown', ['art', 'hidden'], 33.7536, -84.364),
  atl('p-beltline', 'BeltLine Eastside Trail', 'Old Fourth Ward', ['nature', 'art'], 33.7685, -84.3627),
  atl('p-piedmont', 'Piedmont Park', 'Midtown', ['nature'], 33.7851, -84.3738),
  atl('p-botanical', 'Atlanta Botanical Garden', 'Midtown', ['nature'], 33.79, -84.3727),
  atl('p-high', 'High Museum of Art', 'Midtown', ['art', 'culture'], 33.7901, -84.3856),
  atl('p-contemporary', 'Atlanta Contemporary', 'Westside', ['art', 'hidden'], 33.7835, -84.4126),
  atl('p-fox', 'Fox Theatre', 'Midtown', ['music', 'culture'], 33.7726, -84.3856),
  atl('p-variety', 'Variety Playhouse', 'Little Five Points', ['music'], 33.7656, -84.3486),
  atl('p-l5p', 'Little Five Points', 'Little Five Points', ['culture', 'hidden'], 33.7642, -84.3496),
  atl('p-sweet-auburn', 'Sweet Auburn Curb Market', 'Sweet Auburn', ['food', 'culture'], 33.7542, -84.379),
  atl('p-oakland', 'Oakland Cemetery', 'Grant Park', ['nature', 'culture', 'hidden'], 33.7484, -84.3716),
  atl('p-jackson', 'Jackson Street Bridge', 'Old Fourth Ward', ['hidden'], 33.7591, -84.3756),
  atl('p-condesa', 'Condesa Coffee', 'Old Fourth Ward', ['food', 'hidden'], 33.7577, -84.3725),
  atl('p-criminal', 'Criminal Records', 'Little Five Points', ['music', 'hidden'], 33.765, -84.3497),
];

/** The region the map recenters to. */
export const CITY_REGION = {
  latitude: 33.7705,
  longitude: -84.3735,
  latitudeDelta: 0.075,
  longitudeDelta: 0.06,
};
