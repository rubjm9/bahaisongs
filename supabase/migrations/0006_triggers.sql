-- 0006_triggers.sql
-- Glue triggers: auto-create profile on signup; bump updated_at on every row write.

------------------------------------------------------------------------
-- handle_new_user: create profile when a new auth.users row appears
------------------------------------------------------------------------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public, auth
as $$
begin
  insert into public.profiles (id, display_name, locale)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'locale', 'es')
  )
  on conflict (id) do nothing;
  return new;
end
$$;

drop trigger if exists trg_auth_user_created on auth.users;
create trigger trg_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

------------------------------------------------------------------------
-- touch_updated_at: keep updated_at honest
------------------------------------------------------------------------
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end
$$;

do $$ declare t text; begin
  for t in select unnest(array[
    'profiles','artists','albums','tracks','lyrics','playlists','suggestions'
  ]) loop
    execute format('drop trigger if exists trg_touch_updated_at on public.%I', t);
    execute format(
      'create trigger trg_touch_updated_at before update on public.%I
       for each row execute function public.touch_updated_at()',
      t
    );
  end loop;
end $$;
