export type CategoryId = 'food' | 'art' | 'music' | 'nature' | 'culture' | 'hidden';
export type Visibility = 'public' | 'private';
export type PublishStatus = 'draft' | 'published';
export type ExpiryOption = 'never' | '24h' | '7d';

/** A bundled image (require() id) or a local/remote file URI, with its aspect ratio (width / height). */
export interface Photo {
  source: number | { uri: string };
  aspect: number;
}

export interface User {
  id: string;
  name: string;
  handle: string;
  neighborhood: string;
}

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface Place {
  id: string;
  name: string;
  neighborhood: string;
  city: string;
  categories: CategoryId[];
  /** Places created by users without picking a known location have no coordinate. */
  coordinate: Coordinate | null;
}

export interface Postcard {
  id: string;
  placeId: string;
  authorId: string;
  photo: Photo | null;
  note: string;
  visitedOn?: string;
  cost?: string;
  tip?: string;
  visibility: Visibility;
  status: PublishStatus;
  createdAt: string;
  /** ISO time after which a public postcard leaves discovery. */
  expiresAt: string | null;
  /** Chosen expiry while still a draft; applied when published. */
  expiryOption?: ExpiryOption;
}

export interface ScrapbookStop {
  postcardId: string;
  /** Optional itinerary time label, e.g. "10:00". */
  time?: string;
}

export interface Scrapbook {
  id: string;
  title: string;
  description: string;
  city: string;
  authorId: string;
  /** Null means "use the first stop's photo". */
  cover: Photo | null;
  stops: ScrapbookStop[];
  visibility: Visibility;
  status: PublishStatus;
  createdAt: string;
  featured?: boolean;
}

export interface Recommendation {
  placeId: string;
  reason: string;
  postcardId?: string;
  scrapbookId?: string;
}

export interface RecommendationResult {
  prompt: string;
  summary: string;
  items: Recommendation[];
  /** 'sample' until a backend endpoint calls Gemini. */
  source: 'sample';
}
