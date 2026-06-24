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
      // #region agent log
      fetch('http://127.0.0.1:7856/ingest/8cec6073-f88c-47fc-b763-1794242c957e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'95fed2'},body:JSON.stringify({sessionId:'95fed2',location:'usePlayAnalytics.ts:maybeRecord',message:'maybeRecord invoked',data:{status,slug:track?.slug??null,recordedSlug:recordedSlugRef.current,hasTrackId:Boolean(track?.id)},timestamp:Date.now(),hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      if (status !== 'playing') return;

      if (!track?.slug) return;
      if (track.slug === recordedSlugRef.current) return;

      recordedSlugRef.current = track.slug;
      // #region agent log
      fetch('http://127.0.0.1:7856/ingest/8cec6073-f88c-47fc-b763-1794242c957e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'95fed2'},body:JSON.stringify({sessionId:'95fed2',location:'usePlayAnalytics.ts:record',message:'recording play event',data:{slug:track.slug,hasTrackId:Boolean(track.id)},timestamp:Date.now(),hypothesisId:'C'})}).catch(()=>{});
      // #endregion
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
