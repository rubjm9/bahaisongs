-- 0003_tables.sql
-- Core schema. All tables in the `public` schema. RLS is enabled in 0004.

------------------------------------------------------------------------
-- profiles — extends auth.users 1:1
------------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  citext,
  avatar_path   text,
  role          user_role not null default 'user',
  locale        text not null default 'es' check (locale ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

------------------------------------------------------------------------
-- artists
------------------------------------------------------------------------
create table if not exists public.artists (
  id          uuid primary key default gen_random_uuid(),
  slug        citext not null unique,
  name        text not null,
  bio         text,
  country     text,
  avatar_path text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

------------------------------------------------------------------------
-- albums
------------------------------------------------------------------------
create table if not exists public.albums (
  id         uuid primary key default gen_random_uuid(),
  slug       citext not null unique,
  title      text not null,
  year       smallint check (year between 1900 and 2100),
  cover_path text,
  artist_id  uuid references public.artists(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

------------------------------------------------------------------------
-- categories — genres, moods, themes and free-form tags
------------------------------------------------------------------------
create table if not exists public.categories (
  id        uuid primary key default gen_random_uuid(),
  slug      citext not null unique,
  name_es   text not null,
  name_en   text not null,
  kind      category_kind not null
);

------------------------------------------------------------------------
-- tracks — the catalogue's central entity
------------------------------------------------------------------------
create table if not exists public.tracks (
  id                 uuid primary key default gen_random_uuid(),
  slug               citext not null unique,
  title              text not null,
  duration_seconds   integer check (duration_seconds is null or duration_seconds > 0),
  language           text not null default 'es' check (language ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  album_id           uuid references public.albums(id) on delete set null,
  primary_artist_id  uuid references public.artists(id) on delete set null,
  cover_path         text,
  published_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  -- search index column maintained by trigger (0005)
  search_tsv         tsvector
);

------------------------------------------------------------------------
-- track_sources — many audio sources per track (MP3 in R2, YouTube)
------------------------------------------------------------------------
create table if not exists public.track_sources (
  id          uuid primary key default gen_random_uuid(),
  track_id    uuid not null references public.tracks(id) on delete cascade,
  kind        track_source_kind not null,
  source_ref  text not null,   -- R2 object key or YouTube video id
  is_primary  boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Only one primary source per track
create unique index if not exists track_sources_primary_unique
  on public.track_sources (track_id)
  where is_primary = true;

------------------------------------------------------------------------
-- track_artists — M2M with role
------------------------------------------------------------------------
create table if not exists public.track_artists (
  track_id   uuid not null references public.tracks(id) on delete cascade,
  artist_id  uuid not null references public.artists(id) on delete cascade,
  role       track_artist_role not null default 'lead',
  position   smallint not null default 0,
  primary key (track_id, artist_id, role)
);

------------------------------------------------------------------------
-- track_categories — M2M
------------------------------------------------------------------------
create table if not exists public.track_categories (
  track_id     uuid not null references public.tracks(id) on delete cascade,
  category_id  uuid not null references public.categories(id) on delete cascade,
  primary key (track_id, category_id)
);

------------------------------------------------------------------------
-- lyrics — one row per (track, locale)
------------------------------------------------------------------------
create table if not exists public.lyrics (
  id             uuid primary key default gen_random_uuid(),
  track_id       uuid not null references public.tracks(id) on delete cascade,
  locale         text not null check (locale ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  body_chordpro  text,                   -- canonical authoring format
  body_plain     text,                   -- denormalised plain text for search
  synced_json    jsonb,                  -- SyncedLyricLine[] when available
  has_chords     boolean not null default false,
  source         text,                   -- 'wordpress', 'admin', 'suggestion'
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (track_id, locale)
);

------------------------------------------------------------------------
-- playlists
------------------------------------------------------------------------
create table if not exists public.playlists (
  id          uuid primary key default gen_random_uuid(),
  slug        citext not null unique,
  title       text not null,
  description text,
  visibility  playlist_visibility not null default 'private',
  owner_id    uuid references public.profiles(id) on delete cascade,
  cover_path  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.playlist_tracks (
  playlist_id  uuid not null references public.playlists(id) on delete cascade,
  position     integer not null,
  track_id     uuid not null references public.tracks(id) on delete cascade,
  added_at     timestamptz not null default now(),
  primary key (playlist_id, position)
);

------------------------------------------------------------------------
-- likes (favorites)
------------------------------------------------------------------------
create table if not exists public.likes (
  user_id   uuid not null references public.profiles(id) on delete cascade,
  track_id  uuid not null references public.tracks(id) on delete cascade,
  liked_at  timestamptz not null default now(),
  primary key (user_id, track_id)
);

------------------------------------------------------------------------
-- play_events — append-only, anonymous-friendly
------------------------------------------------------------------------
create table if not exists public.play_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete set null,
  track_id    uuid not null references public.tracks(id) on delete cascade,
  played_at   timestamptz not null default now(),
  completion  real check (completion between 0 and 1),
  source      text                              -- 'home', 'search', 'playlist:<id>'
);

------------------------------------------------------------------------
-- suggestions — user-submitted contributions awaiting moderation
------------------------------------------------------------------------
create table if not exists public.suggestions (
  id            uuid primary key default gen_random_uuid(),
  submitted_by  uuid not null references public.profiles(id) on delete cascade,
  status        suggestion_status not null default 'pending',
  payload       jsonb not null,            -- title, artist, lyrics, chords, tags, source kind+ref
  upload_path   text,                      -- R2 key under incoming/ when MP3 uploaded
  review_notes  text,
  reviewed_by   uuid references public.profiles(id) on delete set null,
  reviewed_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
