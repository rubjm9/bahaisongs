import type { CatalogTrack } from '../catalog';

/**
 * Raw Supabase row returned by the catalog join query.
 * Keep in sync with the query in catalog-supabase.ts.
 */
export interface TrackDbRow {
  id: string;
  slug: string;
  title: string;
  language: string;
  published_at: string | null;
  cover_path: string | null;
  artists: { name: string; slug: string } | { name: string; slug: string }[] | null;
  track_sources: { kind: string; source_ref: string; is_primary: boolean }[] | null;
  lyrics: { body_plain: string | null; has_chords: boolean; locale: string }[] | null;
  track_categories: { categories: { slug: string } | { slug: string }[] | null }[] | null;
}

export function mapTrackRowToCatalogTrack(row: TrackDbRow): CatalogTrack {
  const artist = Array.isArray(row.artists) ? (row.artists[0] ?? null) : row.artists;

  const primarySource = (row.track_sources ?? []).find((s) => s.is_primary) ?? (row.track_sources ?? [])[0];
  const hasAudio = (row.track_sources ?? []).length > 0;

  const defaultLyrics = (row.lyrics ?? []).find((l) => l.locale === 'es') ?? (row.lyrics ?? [])[0];
  const hasChords = (row.lyrics ?? []).some((l) => l.has_chords);

  const categorySlugs = (row.track_categories ?? []).flatMap((tc) => {
    const cat = Array.isArray(tc.categories) ? (tc.categories[0] ?? null) : tc.categories;
    return cat ? [cat.slug] : [];
  });

  const mapped: CatalogTrack = {
    slug: row.slug,
    title: row.title,
    artistSlug: artist?.slug ?? '',
    artist: artist?.name ?? '',
    language: (row.language as CatalogTrack['language']) ?? 'es',
    hasChords,
    hasAudio,
    categorySlugs,
    snippet: (defaultLyrics?.body_plain ?? '').slice(0, 200),
    lyrics: defaultLyrics?.body_plain ?? '',
  };

  const audioUrl =
    primarySource?.kind === 'mp3_r2' ? primarySource.source_ref : undefined;
  if (audioUrl !== undefined) mapped.legacyAudioUrl = audioUrl;

  const publishedAt = row.published_at ?? undefined;
  if (publishedAt !== undefined) mapped.publishedAt = publishedAt;

  return mapped;
}
