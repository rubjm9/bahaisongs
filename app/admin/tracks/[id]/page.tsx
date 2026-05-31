import { notFound } from 'next/navigation';
import { Box } from '@mui/material';
import { getSupabaseServerClient } from '@/shared/lib/supabase/server';
import { AdminTopBar } from '@/features/admin/components/AdminTopBar';
import { TrackForm } from './TrackForm';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  return { title: id === 'new' ? 'Nueva canción' : 'Editar canción' };
}

export default async function TrackDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await getSupabaseServerClient();
  const isNew = id === 'new';

  const [{ data: categories }, { data: artists }] = await Promise.all([
    supabase.from('categories').select('id, slug, name_es, kind').order('kind' as never),
    supabase.from('artists').select('id, name, slug').order('name' as never),
  ]);

  let track = null;
  let trackCategories: string[] = [];
  let trackLyrics: { locale: string; body_plain: string | null; body_chordpro: string | null; has_chords: boolean } | null = null;
  let trackSources: { id: string; kind: string; source_ref: string; is_primary: boolean }[] = [];

  if (!isNew) {
    const { data } = await supabase
      .from('tracks')
      .select(`
        id, slug, title, language, published_at, primary_artist_id, duration_seconds,
        track_categories (category_id),
        lyrics (locale, body_plain, body_chordpro, has_chords),
        track_sources (id, kind, source_ref, is_primary)
      `)
      .eq('id' as never, id)
      .single();

    if (!data) notFound();

    interface TrackData {
      id: string;
      slug: string;
      title: string;
      language: string;
      published_at: string | null;
      primary_artist_id: string | null;
      duration_seconds: number | null;
      track_categories: { category_id: string }[] | null;
      lyrics: { locale: string; body_plain: string | null; body_chordpro: string | null; has_chords: boolean }[] | null;
      track_sources: { id: string; kind: string; source_ref: string; is_primary: boolean }[] | null;
    }

    const d = data as TrackData;
    track = { id: d.id, slug: d.slug, title: d.title, language: d.language, published_at: d.published_at, primary_artist_id: d.primary_artist_id, duration_seconds: d.duration_seconds };
    trackCategories = (d.track_categories ?? []).map((tc) => tc.category_id);
    trackLyrics = (d.lyrics ?? [])[0] ?? null;
    trackSources = d.track_sources ?? [];
  }

  return (
    <>
      <AdminTopBar title={isNew ? 'Nueva canción' : 'Editar canción'} />
      <Box sx={{ px: { xs: 2.5, md: 4 }, py: 3, maxWidth: 1280, mx: 'auto', width: '100%' }}>
        <TrackForm
          track={track}
          trackCategories={trackCategories}
          trackLyrics={trackLyrics}
          trackSources={trackSources}
          categories={categories ?? []}
          artists={artists ?? []}
        />
      </Box>
    </>
  );
}
