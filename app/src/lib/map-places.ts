import { categoryById } from '@/data/categories';
import type { Content } from '@/store/content';
import type { CategoryId, Coordinate, Place } from '@/types';

import { type PostcardItem, toPostcardItem } from './feed';
import { canViewPostcard } from './visibility';

export interface MapPlace {
  place: Place;
  coordinate: Coordinate;
  /** Every postcard at this place the viewer can see, newest first. One marker per place. */
  postcards: PostcardItem[];
}

/** Places that have a location and at least one visible, published postcard. */
export function buildMapPlaces(content: Content, now: number, onlyPostcardIds?: Set<string>): MapPlace[] {
  const byPlace = new Map<string, PostcardItem[]>();
  for (const postcard of content.postcards) {
    if (postcard.status !== 'published' || !canViewPostcard(postcard, now)) continue;
    if (onlyPostcardIds && !onlyPostcardIds.has(postcard.id)) continue;
    const item = toPostcardItem(content, postcard);
    if (!item) continue;
    byPlace.set(postcard.placeId, [...(byPlace.get(postcard.placeId) ?? []), item]);
  }

  return [...byPlace.entries()].flatMap(([placeId, postcards]) => {
    const place = content.placeById.get(placeId);
    if (!place?.coordinate) return [];
    postcards.sort((a, b) => b.postcard.createdAt.localeCompare(a.postcard.createdAt));
    return [{ place, coordinate: place.coordinate, postcards }];
  });
}

export function filterMapPlaces(places: MapPlace[], category: CategoryId | null, query: string): MapPlace[] {
  const q = query.trim().toLowerCase();
  return places.filter(({ place }) => {
    if (category && !place.categories.includes(category)) return false;
    if (!q) return true;
    return [place.name, place.neighborhood, ...place.categories.map((c) => categoryById(c).label)].some((field) =>
      field.toLowerCase().includes(q),
    );
  });
}
