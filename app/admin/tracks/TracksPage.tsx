import { getSupabaseServerClient } from '@/shared/lib/supabase/server';
import { getPlayCountsByTrackId } from '@/server/data/play-counts';
import { AdminPage } from '@/features/admin/components/AdminPage';
import { TracksClient } from './TracksClient';

interface TrackRow {
  id: string;
  slug: string;
  title: string;
  language: string;
  published_at: string | null;
  primary_artist_id: string | null;
  artists: { name: string } | null;
  _count_sources: number;
  _has_chords: boolean;
  _has_lyrics: boolean;
  _play_count: number;
}

export default async function TracksPage() {
  const supabase = await getSupabaseServerClient();

  // Fetch tracks with artist name and source count
  const { data: tracks } = await supabase
    .from('tracks')
    .select(`
      id, slug, title, language, published_at, primary_artist_id,
      artists:primary_artist_id (name),
      track_sources (id),
      lyrics (has_chords, body_plain, body_chordpro)
    `)
    .order('title' as never)
    .limit(200);

  const { data: categories } = await supabase
    .from('categories')
    .select('id, slug, name_es, kind')
    .order('kind' as never);

  const { data: artists } = await supabase
    .from('artists')
    .select('id, name, slug')
    .order('name' as never);

  const playCounts = await getPlayCountsByTrackId();

  interface RawTrack {
    id: string;
    slug: string;
    title: string;
    language: string;
    published_at: string | null;
    primary_artist_id: string | null;
    artists: { name: string } | { name: string }[] | null;
    track_sources: { id: string }[] | null;
    lyrics: { has_chords: boolean; body_plain: string | null; body_chordpro: string | null }[] | null;
  }

  const mapped: TrackRow[] = ((tracks ?? []) as RawTrack[]).map((t) => {
    const artistName = Array.isArray(t.artists)
      ? (t.artists[0]?.name ?? null)
      : (t.artists?.name ?? null);

    const hasChords = (t.lyrics ?? []).some((l) => l.has_chords);
    const hasLyrics = (t.lyrics ?? []).some((l) =>
      [l.body_plain, l.body_chordpro].some((text) => Boolean(text?.trim())),
    );

    return {
      id: t.id,
      slug: t.slug,
      title: t.title,
      language: t.language,
      published_at: t.published_at,
      primary_artist_id: t.primary_artist_id,
      artists: artistName ? { name: artistName } : null,
      _count_sources: (t.track_sources ?? []).length,
      _has_chords: hasChords,
      _has_lyrics: hasLyrics,
      _play_count: playCounts.get(t.id) ?? 0,
    };
  });

  return (
    <AdminPage title="Canciones">
      <TracksClient
        initialTracks={mapped}
        categories={categories ?? []}
        artists={artists ?? []}
      />
    </AdminPage>
  );
}
