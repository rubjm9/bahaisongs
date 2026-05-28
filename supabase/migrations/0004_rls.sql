-- 0004_rls.sql
-- Row Level Security from day one. Default deny; explicit allow per concern.

------------------------------------------------------------------------
-- Enable RLS on every public table
------------------------------------------------------------------------
alter table public.profiles         enable row level security;
alter table public.artists          enable row level security;
alter table public.albums           enable row level security;
alter table public.categories       enable row level security;
alter table public.tracks           enable row level security;
alter table public.track_sources    enable row level security;
alter table public.track_artists    enable row level security;
alter table public.track_categories enable row level security;
alter table public.lyrics           enable row level security;
alter table public.playlists        enable row level security;
alter table public.playlist_tracks  enable row level security;
alter table public.likes            enable row level security;
alter table public.play_events      enable row level security;
alter table public.suggestions      enable row level security;

------------------------------------------------------------------------
-- Helper: is the caller an admin?
------------------------------------------------------------------------
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public, auth
as $$
  select coalesce(
    (select role = 'admin' from public.profiles where id = auth.uid()),
    false
  )
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

------------------------------------------------------------------------
-- profiles: public minimal read; owner update; admin update of role
------------------------------------------------------------------------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (true);

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = 'user');  -- can't self-promote

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

------------------------------------------------------------------------
-- Catalog: public read on everything published-related.
-- Writes restricted to admin (via service role in Edge Functions for
-- approval flow; admins via this policy for direct edits).
------------------------------------------------------------------------
do $$ declare t text; begin
  for t in select unnest(array[
    'artists','albums','categories','tracks','track_sources',
    'track_artists','track_categories','lyrics'
  ]) loop
    execute format('drop policy if exists %I_public_read on public.%I', t || '_public', t);
    execute format(
      'create policy %I_public_read on public.%I for select using (true)',
      t || '_public', t
    );
    execute format('drop policy if exists %I_admin_write on public.%I', t || '_admin', t);
    execute format(
      'create policy %I_admin_write on public.%I for all to authenticated
       using (public.is_admin()) with check (public.is_admin())',
      t || '_admin', t
    );
  end loop;
end $$;

------------------------------------------------------------------------
-- playlists: public-visibility readable by anon, owner read all own
------------------------------------------------------------------------
drop policy if exists playlists_public_read on public.playlists;
create policy playlists_public_read on public.playlists
  for select using (visibility = 'public' or visibility = 'unlisted');

drop policy if exists playlists_owner_read on public.playlists;
create policy playlists_owner_read on public.playlists
  for select to authenticated using (owner_id = auth.uid());

drop policy if exists playlists_owner_write on public.playlists;
create policy playlists_owner_write on public.playlists
  for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists playlists_admin_all on public.playlists;
create policy playlists_admin_all on public.playlists
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

------------------------------------------------------------------------
-- playlist_tracks: visibility inherits the parent playlist
------------------------------------------------------------------------
drop policy if exists playlist_tracks_read on public.playlist_tracks;
create policy playlist_tracks_read on public.playlist_tracks
  for select using (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_id
        and (
          p.visibility in ('public','unlisted')
          or p.owner_id = auth.uid()
          or public.is_admin()
        )
    )
  );

drop policy if exists playlist_tracks_owner_write on public.playlist_tracks;
create policy playlist_tracks_owner_write on public.playlist_tracks
  for all to authenticated using (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_id and p.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_id and p.owner_id = auth.uid()
    )
  );

------------------------------------------------------------------------
-- likes: strictly per-user
------------------------------------------------------------------------
drop policy if exists likes_owner_read on public.likes;
create policy likes_owner_read on public.likes
  for select to authenticated using (user_id = auth.uid());

drop policy if exists likes_owner_write on public.likes;
create policy likes_owner_write on public.likes
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

------------------------------------------------------------------------
-- play_events: anyone can insert (anonymous tracking), only owner reads
------------------------------------------------------------------------
drop policy if exists play_events_insert on public.play_events;
create policy play_events_insert on public.play_events
  for insert with check (user_id is null or user_id = auth.uid());

drop policy if exists play_events_owner_read on public.play_events;
create policy play_events_owner_read on public.play_events
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

------------------------------------------------------------------------
-- suggestions: authenticated insert; owner read own; admin everything
------------------------------------------------------------------------
drop policy if exists suggestions_insert on public.suggestions;
create policy suggestions_insert on public.suggestions
  for insert to authenticated
  with check (submitted_by = auth.uid());

drop policy if exists suggestions_owner_read on public.suggestions;
create policy suggestions_owner_read on public.suggestions
  for select to authenticated
  using (submitted_by = auth.uid() or public.is_admin());

drop policy if exists suggestions_owner_withdraw on public.suggestions;
create policy suggestions_owner_withdraw on public.suggestions
  for update to authenticated
  using (submitted_by = auth.uid() and status = 'pending')
  with check (submitted_by = auth.uid() and status in ('pending', 'withdrawn'));

drop policy if exists suggestions_admin_all on public.suggestions;
create policy suggestions_admin_all on public.suggestions
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
