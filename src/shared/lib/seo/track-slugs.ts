import catalog from '@/data/catalog.json';

/** Slugs of published tracks — safe to import from middleware (no server-only). */
export const TRACK_SLUGS = new Set(
  (catalog as { slug: string }[]).map((t) => t.slug),
);

/** First-path segments used by the app router (not track slugs). */
export const RESERVED_SEGMENTS = new Set([
  'search',
  'discover',
  'library',
  'favorites',
  'playlists',
  'suggest',
  'category',
  'artist',
  'playlist',
  'present',
  'song',
  'en',
  'es',
  'api',
  'auth',
  'admin',
  'page',
]);

export function isKnownTrackSlug(segment: string): boolean {
  return TRACK_SLUGS.has(segment);
}

export function isReservedSegment(segment: string): boolean {
  return RESERVED_SEGMENTS.has(segment);
}
