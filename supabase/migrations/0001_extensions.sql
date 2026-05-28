-- 0001_extensions.sql
-- Extensions used across the schema. All idempotent.

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;
create extension if not exists citext;
create extension if not exists pg_trgm;
create extension if not exists unaccent;
