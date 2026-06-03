'use client';

import { useQueueStore, selectCurrentTrack } from '../stores/queueStore';
import { usePlayerStore } from '../stores/playerStore';

export function useIsCurrentTrack(slug: string): { isCurrent: boolean; isPlaying: boolean } {
  const current = useQueueStore((s) => selectCurrentTrack(s));
  const status = usePlayerStore((s) => s.status);
  const isCurrent = current?.slug === slug;
  return { isCurrent, isPlaying: isCurrent && status === 'playing' };
}
