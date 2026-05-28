import type { PlayableTrack } from '@/features/player/lib/types';

interface PlayableInputTrack {
  slug: string;
  title: string;
  artist: string;
  artistSlug: string;
  language: PlayableTrack['language'];
  legacyAudioUrl?: string;
}

/**
 * Project a catalogue-like track down to the minimal shape consumed by the
 * player. Keep this module framework-agnostic so it can be imported by both
 * server and client-facing components.
 */
export function toPlayable(track: PlayableInputTrack): PlayableTrack {
  const out: PlayableTrack = {
    slug: track.slug,
    title: track.title,
    artist: track.artist,
    artistSlug: track.artistSlug,
    language: track.language,
  };
  if (track.legacyAudioUrl) out.audioUrl = track.legacyAudioUrl;
  return out;
}

export function toPlayableList(tracks: readonly PlayableInputTrack[]): PlayableTrack[] {
  return tracks.map(toPlayable);
}
