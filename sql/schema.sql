-- noted!: tables and the visits hypertable.
-- Run with:  psql "$DATABASE_URL" -f sql/schema.sql
-- Then run aggregates.sql, then seed.sql. See sql/README.md.
-- Re-runnable: every statement is IF NOT EXISTS.

create extension if not exists timescaledb;
create extension if not exists pgcrypto;

-- The Auth0 `sub` is the primary key, so there is no separate signup step.
-- Real ids look like 'google-oauth2|1078...'; seeded demo accounts are flagged
-- with is_demo so /api/demo/befriend can find them.
create table if not exists users (
  id          text primary key,
  name        text,
  email       text,
  avatar_url  text,
  is_demo     boolean not null default false,
  created_at  timestamptz not null default now()
);
alter table users add column if not exists is_demo boolean not null default false;

-- Written in both directions on accept, so every read is a plain equality join.
create table if not exists friendships (
  user_id    text not null references users(id) on delete cascade,
  friend_id  text not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  check (user_id <> friend_id)
);

create table if not exists places (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  lat        double precision not null,
  lng        double precision not null,
  created_by text not null references users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists places_created_by_idx on places (created_by);

-- photo_urls holds base64 JPEG data URLs written by the app, or plain https
-- URLs in the seed. The app renders either.
create table if not exists entries (
  id            uuid primary key default gen_random_uuid(),
  place_id      uuid not null references places(id) on delete cascade,
  user_id       text not null references users(id) on delete cascade,
  caption       text,
  story         text,
  tags          text[] not null default '{}',
  postcard_text text,
  photo_urls    text[] not null default '{}',
  created_at    timestamptz not null default now()
);
create index if not exists entries_place_idx on entries (place_id, created_at desc);
create index if not exists entries_user_idx on entries (user_id);

-- Share codes: the whole invite flow is "send someone this code".
create table if not exists invites (
  code        text primary key,
  created_by  text not null references users(id) on delete cascade,
  accepted_by text references users(id) on delete set null,
  created_at  timestamptz not null default now(),
  accepted_at timestamptz
);
create index if not exists invites_open_idx on invites (created_by) where accepted_by is null;

-- ---------------------------------------------------------------------------
-- Shared scrapbooks: a themed set of photos that several people can add to.
-- Anyone with the 6-character access_code can join as a member; members see
-- the scrapbook even when it is private. Photos are data URLs, like entries.
-- ---------------------------------------------------------------------------
create table if not exists scrapbooks (
  id            uuid primary key default gen_random_uuid(),
  owner_id      text not null references users(id) on delete cascade,
  title         text not null,
  description   text not null default '',
  city          text not null default 'Atlanta',
  categories    text[] not null default '{}',
  cover_url     text,
  cover_aspect  real,
  visibility    text not null default 'public' check (visibility in ('public', 'private')),
  access_code   text not null unique,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists scrapbooks_owner_idx on scrapbooks (owner_id);

create table if not exists scrapbook_members (
  scrapbook_id uuid not null references scrapbooks(id) on delete cascade,
  user_id      text not null references users(id) on delete cascade,
  joined_at    timestamptz not null default now(),
  primary key (scrapbook_id, user_id)
);
create index if not exists scrapbook_members_user_idx on scrapbook_members (user_id);

create table if not exists scrapbook_media (
  id           uuid primary key default gen_random_uuid(),
  scrapbook_id uuid not null references scrapbooks(id) on delete cascade,
  author_id    text not null references users(id) on delete cascade,
  photo_url    text not null,
  aspect       real not null default 1,
  caption      text,
  position     int not null default 0,
  created_at   timestamptz not null default now()
);
create index if not exists scrapbook_media_order_idx on scrapbook_media (scrapbook_id, position);

-- ---------------------------------------------------------------------------
-- visits: a hypertable on visited_at. A unique constraint on a hypertable must
-- include the time column, so the primary key is (user_id, place_id, visited_at).
-- ---------------------------------------------------------------------------
create table if not exists visits (
  user_id    text not null references users(id) on delete cascade,
  place_id   uuid not null references places(id) on delete cascade,
  visited_at timestamptz not null default now(),
  primary key (user_id, place_id, visited_at)
);

select create_hypertable('visits', 'visited_at', if_not_exists => true, migrate_data => true);
create index if not exists visits_place_time_idx on visits (place_id, visited_at desc);
