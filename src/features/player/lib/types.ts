export type PlayerStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error';
export type RepeatMode = 'off' | 'one' | 'all';

/**
 * Minimal shape consumed by the player. Server components project a
 * CatalogTrack to a PlayableTrack before passing to client components, so the
 * full lyrics never reach the player code.
 */
export interface PlayableTrack {
  /** Supabase track uuid — required to log play_events. */
  id?: string;
  slug: string;
  title: string;
  artist: string;
  artistSlug: string;
  language: 'es' | 'en' | 'pt' | 'hu';
  /** Direct MP3 URL — Phase 4 uses the legacy https URL; Phase 7 replaces it
   * with the Edge Function call that returns a signed R2 URL. */
  audioUrl?: string;
  /** YouTube video id (no full URL). Used as a fallback when present. */
  youtubeId?: string;
}

export interface ResolvedSourceMp3 {
  kind: 'mp3';
  url: string;
}
export interface ResolvedSourceYoutube {
  kind: 'youtube';
  videoId: string;
}
export interface ResolvedSourceUnavailable {
  kind: 'unavailable';
}
export type ResolvedSource = ResolvedSourceMp3 | ResolvedSourceYoutube | ResolvedSourceUnavailable;
