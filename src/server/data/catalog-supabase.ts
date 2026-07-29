import 'server-only';
import { unstable_cache } from 'next/cache';
import { getSupabaseAnonClient, getSupabaseServiceClient } from '@/shared/lib/supabase/server';
import { hasServiceRoleKey } from '@/shared/lib/supabase/env';
import { type CatalogTrack, type TrendingTrack } from './catalog';
import { mapTrackRowToCatalogTrack, type TrackDbRow } from './mappers/track';

const CATALOG_JOIN = `
  id, slug, title, language, published_at, cover_path,
  artists:primary_artist_id (name, slug),
  track_sources (kind, source_ref, is_primary),
  lyrics (body_plain, body_chordpro, has_chords, locale, synced_json),
  track_categories (
    categories:category_id (slug)
  )
`;

async function fetchAllTracksFromSupabase(): Promise<CatalogTrack[]> {
  const supabase = getSupabaseAnonClient();

  const { data, error } = await supabase
    .from('tracks')
    .select(CATALOG_JOIN)
    .not('published_at' as never, 'is', null)
    .order('title' as never);

  if (error || !data) return [];

  return (data as unknown as TrackDbRow[]).map(mapTrackRowToCatalogTrack);
}

async function fetchTrackBySlugFromSupabase(slug: string): Promise<CatalogTrack | null> {
  const supabase = getSupabaseAnonClient();

  const { data, error } = await supabase
    .from('tracks')
    .select(CATALOG_JOIN)
    .eq('slug' as never, slug)
    .single();

  if (error || !data) return null;

  return mapTrackRowToCatalogTrack(data);
}

/**
 * All published tracks from Supabase, cached with tag-based invalidation.
 * The admin panel calls revalidateTag('catalog') after any track mutation.
 */
export const getAllTracksSupabase = unstable_cache(fetchAllTracksFromSupabase, ['catalog-all'], {
  tags: ['catalog'],
  revalidate: 300, // 5 min fallback; invalidated immediately by admin actions
});

/**
 * Single track by slug, cached per-slug.
 */
export function getTrackBySlugSupabase(slug: string) {
  return unstable_cache(
    () => fetchTrackBySlugFromSupabase(slug),
    [`track-${slug}`],
    { tags: [`track:${slug}`, 'catalog'], revalidate: 300 },
  )();
}

/**
 * Tracks filtered by artist slug.
 */
export const getTracksByArtistSupabase = unstable_cache(
  async (artistSlug: string) => {
    const all = await fetchAllTracksFromSupabase();
    return all.filter((t) => t.artistSlug === artistSlug);
  },
  ['catalog-by-artist'],
  { tags: ['catalog'], revalidate: 300 },
);

/**
 * Tracks filtered by category slug.
 */
export const getTracksByCategorySupabase = unstable_cache(
  async (categorySlug: string) => {
    const all = await fetchAllTracksFromSupabase();
    return all.filter((t) => t.categorySlugs.includes(categorySlug));
  },
  ['catalog-by-category'],
  { tags: ['catalog'], revalidate: 300 },
);

/**
 * Most recently published tracks.
 */
export function getRecentTracksSupabase(limit = 12) {
  return unstable_cache(
    async () => {
      const all = await fetchAllTracksFromSupabase();
      return [...all]
        .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
        .slice(0, limit);
    },
    [`catalog-recent-${limit}`],
    { tags: ['catalog'], revalidate: 300 },
  )();
}

/**
 * Most-played published tracks with audio in the last `days` days.
 * Uses the service role to read play_events (not publicly readable under RLS).
 */
export function getTrendingTracksSupabase(limit = 16, days = 30) {
  return unstable_cache(
    async () => {
      if (!hasServiceRoleKey) return [] as TrendingTrack[];

      const statsClient = getSupabaseServiceClient();
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      const { data: events } = await statsClient
        .from('play_events')
        .select('track_id')
        .gte('played_at' as never, since);

      if (!events?.length) return [] as TrendingTrack[];

      const counts = new Map<string, number>();
      for (const row of events as { track_id: string }[]) {
        counts.set(row.track_id, (counts.get(row.track_id) ?? 0) + 1);
      }

      const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);

      const catalog = await fetchAllTracksFromSupabase();
      const byId = new Map(
        catalog.filter((t): t is CatalogTrack & { id: string } => !!t.id).map((t) => [t.id, t]),
      );

      const result: TrendingTrack[] = [];
      for (const [id, playCount] of ranked) {
        const track = byId.get(id);
        if (!track?.hasAudio) continue;
        result.push({ ...track, playCount });
        if (result.length >= limit) break;
      }
      return result;
    },
    [`trending-${limit}-${days}`],
    { tags: ['trending'], revalidate: 900 },
  )();
}
