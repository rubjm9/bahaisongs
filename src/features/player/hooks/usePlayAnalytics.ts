'use client';

import { useEffect, useRef } from 'react';
import { recordPlayEvent } from '../lib/recordPlayEvent';
import { usePlayerStore } from '../stores/playerStore';
import { selectCurrentTrack, useQueueStore } from '../stores/queueStore';

/**
 * Logs one `play_events` row per track when playback starts (`status ===
 * 'playing'`). No minimum completion ratio — a single play click counts.
 */
export function usePlayAnalytics() {
  const recordedSlugRef = useRef<string | null>(null);

  useEffect(() => {
    const maybeRecord = () => {
      const status = usePlayerStore.getState().status;
      const track = selectCurrentTrack(useQueueStore.getState());
      if (status !== 'playing') return;

      if (!track?.slug) return;
      if (track.slug === recordedSlugRef.current) return;

      recordedSlugRef.current = track.slug;
      void recordPlayEvent({
        ...(track.id ? { trackId: track.id } : {}),
        slug: track.slug,
        source: 'player',
      });
    };

    const unsubStatus = usePlayerStore.subscribe((s) => s.status, maybeRecord, {
      fireImmediately: true,
    });
    const unsubTrack = useQueueStore.subscribe(
      (s) => selectCurrentTrack(s)?.slug ?? null,
      maybeRecord,
      { fireImmediately: true },
    );

    return () => {
      unsubStatus();
      unsubTrack();
    };
  }, []);
}
