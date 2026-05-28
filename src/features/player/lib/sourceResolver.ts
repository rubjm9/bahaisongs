import type { PlayableTrack, ResolvedSource } from './types';

/**
 * Decide which audio source the player should use for a given track.
 * Preference order: direct MP3 → YouTube → unavailable.
 *
 * Centralising this here means the player UI never has to know about the
 * legacy / R2 / signed-URL mechanics — it always receives a tagged result.
 */
export function resolveSource(track: PlayableTrack): ResolvedSource {
  if (track.audioUrl) return { kind: 'mp3', url: track.audioUrl };
  if (track.youtubeId) return { kind: 'youtube', videoId: track.youtubeId };
  return { kind: 'unavailable' };
}

export function hasPlayableSource(track: PlayableTrack): boolean {
  return resolveSource(track).kind !== 'unavailable';
}
