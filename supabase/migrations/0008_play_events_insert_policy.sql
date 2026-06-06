-- Ensure anonymous and authenticated clients can insert play_events (RLS).
drop policy if exists play_events_insert on public.play_events;
create policy play_events_insert on public.play_events
  for insert
  to anon, authenticated
  with check (user_id is null or user_id = auth.uid());
