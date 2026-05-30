import { toPlayableList } from './playable';
import { hasPlayableSource } from './sourceResolver';
import type { PlayableTrack } from './types';

interface CatalogRow {
  slug: string;
  title: string;
  artist: string;
  artistSlug: string;
  language: PlayableTrack['language'];
  legacyAudioUrl?: string;
}

let cachedPlayable: PlayableTrack[] | null = null;

async function loadPlayableTracks(): Promise<PlayableTrack[]> {
  if (cachedPlayable) return cachedPlayable;
  const mod = await import('@/data/catalog.json');
  const rows = mod.default as CatalogRow[];
  cachedPlayable = toPlayableList(rows).filter(hasPlayableSource);
  return cachedPlayable;
}

/** Picks a random playable track and starts the queue at that index. */
export async function playRandomTrack(
  playList: (tracks: readonly PlayableTrack[], startIndex: number) => void,
): Promise<boolean> {
  const tracks = await loadPlayableTracks();
  if (tracks.length === 0) return false;
  const index = Math.floor(Math.random() * tracks.length);
  playList(tracks, index);
  return true;
}
