-- Drops everything Unfold owns. Run before schema.sql to start clean.
drop materialized view if exists daily_place_visits cascade;
drop table if exists visits cascade;
drop table if exists entries cascade;
drop table if exists invites cascade;
drop table if exists places cascade;
drop table if exists friendships cascade;
drop table if exists users cascade;
