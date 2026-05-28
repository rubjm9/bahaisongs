'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { getSupabaseServerClient } from '@/shared/lib/supabase/server';
import { trackMetaSchema, lyricsSchema, type TrackMetaFormValues, type LyricsFormValues } from '../lib/schemas';

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

export async function createTrack(
  meta: TrackMetaFormValues,
  categoryIds: string[],
  lyrics?: LyricsFormValues,
  sourceRef?: { kind: 'mp3_r2' | 'youtube'; source_ref: string },
) {
  const parsedMeta = trackMetaSchema.safeParse(meta);
  if (!parsedMeta.success) throw new Error('Invalid track data');

  const supabase = await requireAdmin();

  const { data: track, error: trackError } = await supabase
    .from('tracks')
    .insert(parsedMeta.data as never)
    .select('id, slug')
    .single();

  if (trackError || !track) throw new Error(trackError?.message ?? 'Failed to create track');
  const trackData = track as { id: string; slug: string };

  // Insert categories
  if (categoryIds.length > 0) {
    await supabase
      .from('track_categories')
      .insert(categoryIds.map((cid) => ({ track_id: trackData.id, category_id: cid })) as never);
  }

  // Insert source
  if (sourceRef) {
    await supabase.from('track_sources').insert({
      track_id: trackData.id,
      kind: sourceRef.kind,
      source_ref: sourceRef.source_ref,
      is_primary: true,
    } as never);
  }

  // Insert lyrics
  if (lyrics) {
    const parsedLyrics = lyricsSchema.safeParse(lyrics);
    if (parsedLyrics.success) {
      await supabase
        .from('lyrics')
        .insert({ ...parsedLyrics.data, track_id: trackData.id } as never);
    }
  }

  revalidateTag('catalog');
  revalidateTag(`track:${trackData.slug}`);
  revalidatePath('/admin/tracks');

  return trackData;
}

export async function updateTrack(id: string, meta: Partial<TrackMetaFormValues>) {
  const supabase = await requireAdmin();

  const { data: updated, error } = await supabase
    .from('tracks')
    .update({ ...meta, updated_at: new Date().toISOString() } as never)
    .eq('id' as never, id)
    .select('slug')
    .single();

  if (error) throw new Error(error.message);

  const slug = (updated as { slug: string } | null)?.slug;
  revalidateTag('catalog');
  if (slug) revalidateTag(`track:${slug}`);
  revalidatePath('/admin/tracks');
}

export async function deleteTrack(id: string, slug: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from('tracks').delete().eq('id' as never, id);
  if (error) throw new Error(error.message);

  revalidateTag('catalog');
  revalidateTag(`track:${slug}`);
  revalidatePath('/admin/tracks');
}

export async function upsertLyrics(trackId: string, lyrics: LyricsFormValues) {
  const parsed = lyricsSchema.safeParse(lyrics);
  if (!parsed.success) throw new Error('Invalid lyrics data');

  const supabase = await requireAdmin();
  const { error } = await supabase
    .from('lyrics')
    .upsert({ ...parsed.data, track_id: trackId } as never, {
      onConflict: 'track_id,locale',
    });
  if (error) throw new Error(error.message);

  revalidateTag('catalog');
}

export async function updateTrackCategories(trackId: string, categoryIds: string[]) {
  const supabase = await requireAdmin();

  await supabase.from('track_categories').delete().eq('track_id' as never, trackId);

  if (categoryIds.length > 0) {
    await supabase
      .from('track_categories')
      .insert(categoryIds.map((cid) => ({ track_id: trackId, category_id: cid })) as never);
  }

  revalidateTag('catalog');
}
