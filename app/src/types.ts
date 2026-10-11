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
  tip?: string;
  visibility: Visibility;
  status: PublishStatus;
  createdAt: string;
  /** ISO time after which a public postcard leaves discovery. */
  expiresAt: string | null;
  /** Chosen expiry while still a draft; applied when published. */
  expiryOption?: ExpiryOption;
}

/** One image in a scrapbook. Scrapbooks hold their own media, not postcards. */
export interface ScrapbookMedia {
  id: string;
  photo: Photo;
  caption?: string;
  /** Optional link to a place so the scrapbook can be shown on the map. */
  placeId?: string;
  /** Who added the photo, for shared scrapbooks. */
  authorId?: string;
}

export interface Scrapbook {
  id: string;
  title: string;
  description: string;
  city: string;
  authorId: string;
  /** Null means "use the first image". */
  cover: Photo | null;
  categories: CategoryId[];
  media: ScrapbookMedia[];
  visibility: Visibility;
  status: PublishStatus;
  createdAt: string;
  featured?: boolean;
  /** Saved on the server, so it can be shared. Local scrapbooks and drafts leave this unset. */
  remote?: boolean;
  /** 6-character code friends enter to collaborate. Only visible to members. */
  accessCode?: string;
  /** Everyone who can add photos, owner included. */
  collaboratorIds?: string[];
}
