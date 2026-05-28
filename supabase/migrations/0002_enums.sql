-- 0002_enums.sql
-- Domain enums. The DO blocks make creation idempotent across re-runs.

do $$ begin
  create type user_role as enum ('user', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type track_source_kind as enum ('mp3_r2', 'youtube');
exception when duplicate_object then null; end $$;

do $$ begin
  create type category_kind as enum ('genre', 'mood', 'theme', 'tag');
exception when duplicate_object then null; end $$;

do $$ begin
  create type playlist_visibility as enum ('public', 'private', 'unlisted');
exception when duplicate_object then null; end $$;

do $$ begin
  create type suggestion_status as enum ('pending', 'approved', 'rejected', 'withdrawn');
exception when duplicate_object then null; end $$;

do $$ begin
  create type track_artist_role as enum ('lead', 'feat', 'composer', 'arranger');
exception when duplicate_object then null; end $$;

-- Language is stored as a 2–5 char text (BCP-47 short form) rather than an
-- enum so we can extend without a migration. Validated by check constraint.
