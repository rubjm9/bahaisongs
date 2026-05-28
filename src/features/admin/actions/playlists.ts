'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { getSupabaseServerClient } from '@/shared/lib/supabase/server';
import { playlistSchema, type PlaylistFormValues } from '../lib/schemas';

async function requireAdmin() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Unauthorized');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id' as never, session.user.id)
    .single();

  if (!profile || (profile as { role: string }).role !== 'admin') {
    throw new Error('Forbidden');
  }
  return supabase;
}

export async function createCuratedPlaylist(values: PlaylistFormValues) {
  const parsed = playlistSchema.safeParse(values);
  if (!parsed.success) throw new Error('Invalid data');

  const supabase = await requireAdmin();
  const { data, error } = await supabase
    .from('playlists')
    .insert({ ...parsed.data, is_curated: true, owner_id: null } as never)
    .select('id, slug')
    .single();

  if (error) throw new Error(error.message);

  revalidateTag('playlists');
  revalidatePath('/admin/playlists');

  return data as { id: string; slug: string };
}

export async function updatePlaylist(id: string, values: Partial<PlaylistFormValues>) {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from('playlists')
    .update({ ...values, updated_at: new Date().toISOString() } as never)
    .eq('id' as never, id);
  if (error) throw new Error(error.message);

  revalidateTag('playlists');
  revalidatePath('/admin/playlists');
}

export async function deletePlaylist(id: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from('playlists').delete().eq('id' as never, id);
  if (error) throw new Error(error.message);

  revalidateTag('playlists');
  revalidatePath('/admin/playlists');
}

export async function setPlaylistTracks(playlistId: string, trackIds: string[]) {
  const supabase = await requireAdmin();

  // Replace all tracks
  await supabase.from('playlist_tracks').delete().eq('playlist_id' as never, playlistId);

  if (trackIds.length > 0) {
    await supabase.from('playlist_tracks').insert(
      trackIds.map((tid, pos) => ({
        playlist_id: playlistId,
        track_id: tid,
        position: pos,
      })) as never,
    );
  }

  revalidateTag('playlists');
}
