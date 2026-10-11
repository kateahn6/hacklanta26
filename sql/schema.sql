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
  name        text,   -- unused: real names are not stored, see username
  email       text,
  avatar_url  text,
  is_demo     boolean not null default false,
  created_at  timestamptz not null default now()
);
alter table users add column if not exists is_demo boolean not null default false;

-- Privacy: people are shown only by a random Reddit-style username such as
-- "Sunny-Otter-4821", assigned on first sign-in. Real names are never stored.
create or replace function random_username() returns text language sql volatile as $$
  select (array['Sunny','Quiet','Brave','Lucky','Mellow','Witty','Gentle','Cosmic','Rusty','Velvet',
                'Breezy','Sleepy','Golden','Misty','Clever','Humble','Jolly','Wild','Tiny','Bold'])[1 + floor(random() * 20)::int]
      || '-' ||
         (array['Otter','Heron','Fox','Maple','Comet','Pigeon','Badger','Falcon','Willow','Panda',
                'Lark','Moose','Koala','Raven','Cedar','Finch','Bison','Gecko','Robin','Walrus'])[1 + floor(random() * 20)::int]
      || '-' || lpad(floor(random() * 10000)::int::text, 4, '0')
$$;
alter table users add column if not exists username text;
update users set username = random_username() where username is null;
alter table users alter column username set default random_username();
alter table users alter column username set not null;
create unique index if not exists users_username_key on users (username);
update users set name = null where name is not null;

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
