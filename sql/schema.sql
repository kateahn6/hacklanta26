-- Unfold schema (Tiger Data / TimescaleDB)
-- Run once:  psql "$DATABASE_URL" -f sql/schema.sql

create extension if not exists timescaledb;
create extension if not exists "pgcrypto";

-- Auth0 `sub` is the primary key, so there is no separate signup step.
create table if not exists users (
  id          text primary key,
  name        text,
  email       text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- Stored in both directions on accept, so every read is a plain equality join.
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

-- photo_urls holds base64 JPEG data URLs (see README: no blob store for the demo).
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
create index if not exists invites_created_by_idx on invites (created_by) where accepted_by is null;

-- ---------------------------------------------------------------------------
-- visits: hypertable on visited_at. Note any unique constraint on a hypertable
-- must include the time column, so the key is (user_id, place_id, visited_at).
-- ---------------------------------------------------------------------------
create table if not exists visits (
  user_id    text not null references users(id) on delete cascade,
  place_id   uuid not null references places(id) on delete cascade,
  visited_at timestamptz not null default now(),
  primary key (user_id, place_id, visited_at)
);

select create_hypertable('visits', 'visited_at', if_not_exists => true, migrate_data => true);
create index if not exists visits_place_time_idx on visits (place_id, visited_at desc);

-- One row per place, person and day. The friendship join stays OUT of the
-- aggregate (continuous aggregates cannot join), and happens in the query that
-- reads this view -- see /api/api/returning.ts.
create materialized view if not exists daily_place_visits
with (timescaledb.continuous, timescaledb.materialized_only = false) as
select
  place_id,
  user_id,
  time_bucket('1 day', visited_at) as day,
  count(*) as visit_count
from visits
group by place_id, user_id, day
with no data;

-- materialized_only = false keeps real-time aggregation on, so a visit written
-- seconds ago already shows up in the ranking during the demo.

select add_continuous_aggregate_policy('daily_place_visits',
  start_offset => interval '90 days',
  end_offset   => interval '1 hour',
  schedule_interval => interval '15 minutes',
  if_not_exists => true);

call refresh_continuous_aggregate('daily_place_visits', null, null);
