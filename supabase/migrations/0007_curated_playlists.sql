-- 0007_curated_playlists.sql
-- Adds is_curated flag to distinguish platform-curated playlists from user playlists.
-- Also adds missing admin write policy for playlist_tracks.

------------------------------------------------------------------------
-- Add is_curated column
------------------------------------------------------------------------
alter table public.playlists
  add column if not exists is_curated boolean not null default false;

-- Allow curated playlists to have no owner (null owner_id)
-- The existing FK allows NULL so no schema change needed.

-- Performance index for discovering curated playlists
create index if not exists playlists_curated_idx
  on public.playlists (is_curated, updated_at desc)
  where is_curated = true;

------------------------------------------------------------------------
-- Admin write policy for playlist_tracks
-- (Allows admins to manage tracks of any playlist, including curated ones
--  where owner_id is null so the owner_write policy wouldn't match.)
------------------------------------------------------------------------
drop policy if exists playlist_tracks_admin_write on public.playlist_tracks;
create policy playlist_tracks_admin_write on public.playlist_tracks
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
