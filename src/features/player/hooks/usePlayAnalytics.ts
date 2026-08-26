'use client';

import { useEffect, useRef } from 'react';
import { track } from '@/shared/lib/analytics/track';
import type { PlaySource } from '@/shared/lib/analytics/events';
import { recordPlayEvent, updatePlayCompletion } from '../lib/recordPlayEvent';
import { usePlayerStore } from '../stores/playerStore';
import { selectCurrentTrack, selectPlaySource, useQueueStore } from '../stores/queueStore';

function completionRatio(position: number, duration: number): number {
  if (duration <= 0) return 0;
  return Math.min(1, Math.max(0, position / duration));
}

/**
 * Logs one `play_events` row per track when playback starts (`status ===
 * 'playing'`). Updates completion on pause or track change.
 */
export function usePlayAnalytics() {
  const recordedSlugRef = useRef<string | null>(null);
  const lastEventIdRef = useRef<string | null>(null);
  const lastTrackRef = useRef<{ slug: string; trackId?: string; source: string } | null>(null);

  useEffect(() => {
    const flushCompletion = async () => {
      const pending = lastTrackRef.current;
      const eventId = lastEventIdRef.current;
      if (!pending || !eventId) return;

      const { position, duration } = usePlayerStore.getState();
      const completion = completionRatio(position, duration);
      await updatePlayCompletion({ eventId, completion });
      lastEventIdRef.current = null;
      lastTrackRef.current = null;
    };

    const maybeRecord = () => {
      const status = usePlayerStore.getState().status;
      const trackItem = selectCurrentTrack(useQueueStore.getState());
      const source = selectPlaySource(useQueueStore.getState());

      if (status !== 'playing') return;
      if (!trackItem?.slug) return;
      if (trackItem.slug === recordedSlugRef.current) return;

      void flushCompletion();

      recordedSlugRef.current = trackItem.slug;
      const payload = {
        ...(trackItem.id ? { trackId: trackItem.id } : {}),
        slug: trackItem.slug,
        source,
      };

      track('play', { track_slug: trackItem.slug, source: source as PlaySource });

      void recordPlayEvent(payload).then((eventId) => {
        if (eventId) {
          lastEventIdRef.current = eventId;
          lastTrackRef.current = { slug: trackItem.slug, source, ...(trackItem.id ? { trackId: trackItem.id } : {}) };
        }
      });
    };

    const onStatusChange = (status: ReturnType<typeof usePlayerStore.getState>['status']) => {
      if (status === 'paused' || status === 'idle') {
        void flushCompletion();
      }
      if (status === 'playing') maybeRecord();
    };

    const onTrackChange = (slug: string | null) => {
      if (slug !== recordedSlugRef.current) {
        void flushCompletion();
        recordedSlugRef.current = null;
        maybeRecord();
      }
    };

    const unsubStatus = usePlayerStore.subscribe((s) => s.status, onStatusChange, {
      fireImmediately: true,
    });
    const unsubTrack = useQueueStore.subscribe(
      (s) => selectCurrentTrack(s)?.slug ?? null,
      onTrackChange,
      { fireImmediately: true },
    );

    return () => {
      void flushCompletion();
      unsubStatus();
      unsubTrack();
    };
  }, []);
}
