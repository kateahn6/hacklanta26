export type Entry = {
  id: string;
  user_id: string;
  user_name: string | null;
  avatar_url: string | null;
  caption: string | null;
  story: string | null;
  tags: string[];
  postcard_text: string | null;
  photo_urls: string[];
  created_at: string;
};

export type Place = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  created_by: string;
  created_by_name: string | null;
  created_at: string;
  entries: Entry[];
};

export type ReturningPlace = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  return_days: number;
  friend_count: number;
  repeat_friends: number;
  total_visits: number;
  last_day: string;
  who: string[];
};

export type ScrapbookPage = {
  place_type: string;
  caption: string;
  story: string;
  tags: string[];
  postcard_text: string;
  source?: 'gemini' | 'demo';
  note?: string;
};

export type ApiScrapbookMedia = {
  id: string;
  author_id: string;
  photo_url: string;
  aspect: number;
  caption: string | null;
};

export type ApiScrapbook = {
  id: string;
  owner_id: string;
  owner_name: string | null;
  title: string;
  description: string;
  city: string;
  categories: string[];
  cover_url: string | null;
  cover_aspect: number | null;
  visibility: 'public' | 'private';
  access_code: string | null;
  members: { id: string; name: string | null }[];
  media: ApiScrapbookMedia[];
  created_at: string;
  updated_at: string;
};
