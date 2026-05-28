-- 0005_search.sql
-- Full-text search index on tracks + trigram indexes for fuzzy match.
-- Spanish is the default config (most of the catalogue); English content is
-- searchable too because to_tsvector('spanish') still indexes English words,
-- just with weaker stemming. We add a separate english-config column later
-- only if metrics show poor recall.

------------------------------------------------------------------------
-- search_tsv maintenance trigger
------------------------------------------------------------------------
create or replace function public.tracks_search_tsv_update() returns trigger
language plpgsql as $$
declare
  artist_name text;
  album_title text;
  lyric_body  text;
begin
  select a.name into artist_name
    from public.artists a
    where a.id = new.primary_artist_id;
  select al.title into album_title
    from public.albums al
    where al.id = new.album_id;
  select string_agg(l.body_plain, ' ') into lyric_body
    from public.lyrics l
    where l.track_id = new.id;

  new.search_tsv :=
    setweight(to_tsvector('spanish', unaccent(coalesce(new.title, ''))), 'A')
    || setweight(to_tsvector('spanish', unaccent(coalesce(artist_name, ''))), 'B')
    || setweight(to_tsvector('spanish', unaccent(coalesce(album_title, ''))), 'C')
    || setweight(to_tsvector('spanish', unaccent(coalesce(lyric_body, ''))), 'D');
  return new;
end
$$;

drop trigger if exists trg_tracks_search_tsv on public.tracks;
create trigger trg_tracks_search_tsv
  before insert or update of title, album_id, primary_artist_id
  on public.tracks
  for each row execute function public.tracks_search_tsv_update();

-- When lyrics change, refresh the parent track's tsv
create or replace function public.tracks_refresh_search_on_lyric_change() returns trigger
language plpgsql as $$
declare target uuid;
begin
  target := coalesce(new.track_id, old.track_id);
  if target is not null then
    update public.tracks set updated_at = now() where id = target;
  end if;
  return null;
end
$$;

drop trigger if exists trg_lyrics_refresh on public.lyrics;
create trigger trg_lyrics_refresh
  after insert or update or delete on public.lyrics
  for each row execute function public.tracks_refresh_search_on_lyric_change();

------------------------------------------------------------------------
-- Indexes
------------------------------------------------------------------------
create index if not exists idx_tracks_search_tsv on public.tracks using gin (search_tsv);

create index if not exists idx_tracks_title_trgm
  on public.tracks using gin (title gin_trgm_ops);
create index if not exists idx_artists_name_trgm
  on public.artists using gin (name gin_trgm_ops);
create index if not exists idx_lyrics_plain_trgm
  on public.lyrics using gin (body_plain gin_trgm_ops);

create index if not exists idx_tracks_published_at on public.tracks (published_at desc);
create index if not exists idx_tracks_album on public.tracks (album_id);
create index if not exists idx_tracks_artist on public.tracks (primary_artist_id);
create index if not exists idx_track_categories_cat on public.track_categories (category_id);
create index if not exists idx_track_sources_track on public.track_sources (track_id);
create index if not exists idx_lyrics_track on public.lyrics (track_id);
create index if not exists idx_playlist_tracks_track on public.playlist_tracks (track_id);
create index if not exists idx_likes_track on public.likes (track_id);
create index if not exists idx_play_events_track_time on public.play_events (track_id, played_at desc);
create index if not exists idx_play_events_user_time on public.play_events (user_id, played_at desc);

-- partial index for public playlist discovery
create index if not exists idx_playlists_public_recent
  on public.playlists (updated_at desc) where visibility = 'public';
