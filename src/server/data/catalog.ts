import 'server-only';
import { cache } from 'react';
import catalogJson from '@/data/catalog.json';
import {
  TRACK_LANGUAGES,
  isTrackLanguage,
  type TrackLanguage,
} from '@/features/catalog/lib/track-languages';
import type { SyncedLyricLine } from '@/entities/lyrics';
import { supabaseEnabled } from '@/shared/lib/supabase/env';
import {
  getAllTracksSupabase,
  getTrackBySlugSupabase,
  getTracksByArtistSupabase,
  getTracksByCategorySupabase,
  getRecentTracksSupabase,
  getTrendingTracksSupabase,
} from './catalog-supabase';
import { getSupabaseAnonClient } from '@/shared/lib/supabase/server';

/**
 * Full catalogue track shape. Mirrors the output of
 * `scripts/build-search-index.ts`. Server-only so the ~190 KB JSON never ships
 * to the client bundle.
 */
export interface CatalogTrack {
  /** Present when loaded from Supabase; required for play analytics. */
  id?: string;
  slug: string;
  title: string;
  artistSlug: string;
  artist: string;
  language: 'es' | 'en' | 'pt' | 'hu';
  hasChords: boolean;
  hasAudio: boolean;
  categorySlugs: string[];
  snippet: string;
  lyrics: string;
  /** ChordPro-formatted lyrics (inline [Am]text format). Preferred over `lyrics` when present. */
  lyricsChordPro?: string;
  /** Timed lyric lines for karaoke / follow mode. */
  syncedLyrics?: SyncedLyricLine[];
  legacyAudioUrl?: string;
  youtubeId?: string;
  publishedAt?: string;
}

/** Catalog track ranked by plays in a trending window. */
export interface TrendingTrack extends CatalogTrack {
  playCount: number;
}

const jsonCatalog = catalogJson as CatalogTrack[];

/**
 * Every published track, sorted by title.
 * Uses Supabase when configured, otherwise falls back to the static JSON.
 */
export const getAllTracks = cache(async (): Promise<CatalogTrack[]> => {
  if (supabaseEnabled) {
    const tracks = await getAllTracksSupabase();
    if (tracks.length > 0) return tracks;
  }
  return jsonCatalog;
});

/** Resolve a track by its slug. Returns `null` when not found. */
export async function getTrackBySlug(slug: string): Promise<CatalogTrack | null> {
  if (supabaseEnabled) {
    const track = await getTrackBySlugSupabase(slug);
    if (track) return track;
  }
  return jsonCatalog.find((t) => t.slug === slug) ?? null;
}

/** Tracks attributed to the given artist slug. */
export async function getTracksByArtist(artistSlug: string): Promise<CatalogTrack[]> {
  if (supabaseEnabled) return getTracksByArtistSupabase(artistSlug);
  return jsonCatalog.filter((t) => t.artistSlug === artistSlug);
}

/** Tracks that include the given category slug. */
export async function getTracksByCategory(categorySlug: string): Promise<CatalogTrack[]> {
  if (supabaseEnabled) return getTracksByCategorySupabase(categorySlug);
  return jsonCatalog.filter((t) => t.categorySlugs.includes(categorySlug));
}

/** Most recently published tracks first, capped at `limit`. */
export async function getRecentTracks(limit = 12): Promise<CatalogTrack[]> {
  if (supabaseEnabled) return getRecentTracksSupabase(limit);
  return [...jsonCatalog]
    .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
    .slice(0, limit);
}

/**
 * Most-played tracks with audio in the last `days` days, with play counts.
 * Returns [] when Supabase / plays are unavailable (section stays hidden).
 */
export async function getTrendingTracks(limit = 16, days = 30): Promise<TrendingTrack[]> {
  if (!supabaseEnabled) return [];
  return getTrendingTracksSupabase(limit, days);
}

/** Tracks for a specific language code. */
export async function getTracksByLanguage(
  language: 'es' | 'en' | 'pt' | 'hu',
): Promise<CatalogTrack[]> {
  const all = await getAllTracks();
  return all.filter((t) => t.language === language);
}

/** Sibling tracks for navigation (previous / next inside the catalogue). */
export async function getTrackNeighbours(
  slug: string,
): Promise<{ prev: CatalogTrack | null; next: CatalogTrack | null }> {
  const catalog = await getAllTracks();
  const idx = catalog.findIndex((t) => t.slug === slug);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: idx > 0 ? (catalog[idx - 1] ?? null) : null,
    next: idx < catalog.length - 1 ? (catalog[idx + 1] ?? null) : null,
  };
}

/** Unique list of category slugs that appear at least once in the catalogue. */
export async function getActiveCategorySlugs(): Promise<string[]> {
  const catalog = await getAllTracks();
  const set = new Set<string>();
  for (const t of catalog) for (const c of t.categorySlugs) set.add(c);
  return [...set].sort();
}

export interface CatalogLanguageOption {
  code: TrackLanguage;
  count: number;
}

/** Distinct track languages present in the catalogue (from Supabase or static JSON). */
export const getCatalogLanguages = cache(async (): Promise<CatalogLanguageOption[]> => {
  const catalog = await getAllTracks();
  const counts = new Map<TrackLanguage, number>();
  for (const t of catalog) {
    if (!isTrackLanguage(t.language)) continue;
    counts.set(t.language, (counts.get(t.language) ?? 0) + 1);
  }
  return TRACK_LANGUAGES.filter((code) => counts.has(code)).map((code) => ({
    code,
    count: counts.get(code)!,
  }));
});

/** Sorted unique artist names for autocomplete in suggestion form. */
export const getArtistNames = cache(async (): Promise<string[]> => {
  if (supabaseEnabled) {
    const supabase = getSupabaseAnonClient();
    const { data } = await supabase.from('artists').select('name').order('name' as never);
    if (data?.length) {
      const names = data
        .map((row) => (row as { name: string | null }).name)
        .filter((name): name is string => !!name?.trim());
      return [...new Set(names)].sort((a, b) => a.localeCompare(b, 'es'));
    }
  }
  const names = new Set<string>();
  for (const track of jsonCatalog) {
    if (track.artist.trim()) names.add(track.artist.trim());
  }
  return [...names].sort((a, b) => a.localeCompare(b, 'es'));
});
