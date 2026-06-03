import type { SupabaseClient } from '@supabase/supabase-js';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Slug from the UI or a tracks.id UUID for playlist_tracks.track_id. */
export async function resolveTrackUuid(
  supabase: SupabaseClient,
  slugOrId: string,
): Promise<string | null> {
  if (UUID_RE.test(slugOrId)) return slugOrId;

  const { data, error } = await supabase
    .from('tracks')
    .select('id')
    .eq('slug' as never, slugOrId)
    .maybeSingle();

  if (error || !data) return null;
  return (data as { id: string }).id;
}

export type AddTrackToPlaylistResult =
  | { ok: true; trackUuid: string; position: number }
  | { ok: false; reason: 'disabled' | 'track_not_found' | 'db_error'; message?: string };

export async function addTrackToPlaylist(
  supabase: SupabaseClient,
  playlistId: string,
  slugOrId: string,
): Promise<AddTrackToPlaylistResult> {
  const trackUuid = await resolveTrackUuid(supabase, slugOrId);
  if (!trackUuid) {
    return { ok: false, reason: 'track_not_found' };
  }

  const { data: existing } = await supabase
    .from('playlist_tracks')
    .select('position')
    .eq('playlist_id' as never, playlistId)
    .order('position' as never, { ascending: false })
    .limit(1);

  const nextPos =
    ((existing as { position: number }[] | null)?.[0]?.position ?? -1) + 1;

  const { error } = await supabase.from('playlist_tracks').insert({
    playlist_id: playlistId,
    track_id: trackUuid,
    position: nextPos,
  } as never);

  if (error) {
    return { ok: false, reason: 'db_error', message: error.message };
  }

  return { ok: true, trackUuid, position: nextPos };
}
