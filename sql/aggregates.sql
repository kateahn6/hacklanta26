-- noted!: the continuous aggregate behind "friends keep coming back".
-- Run with:  psql "$DATABASE_URL" -f sql/aggregates.sql
--
-- IMPORTANT: a continuous aggregate cannot be created inside a transaction
-- block. Run this file on its own, in autocommit (plain `psql -f`, never
-- `psql -1` / --single-transaction, and not pasted into a GUI that wraps
-- statements in BEGIN/COMMIT).

-- One row per place, person and day. The friendship join stays OUT of the
-- aggregate (continuous aggregates cannot join); it happens in the query that
-- reads this view -- see api/src/index.ts, GET /api/returning.
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
-- seconds ago already ranks during the demo.

select add_continuous_aggregate_policy('daily_place_visits',
  start_offset      => interval '90 days',
  end_offset        => interval '1 hour',
  schedule_interval => interval '15 minutes',
  if_not_exists     => true);

call refresh_continuous_aggregate('daily_place_visits', null, null);
