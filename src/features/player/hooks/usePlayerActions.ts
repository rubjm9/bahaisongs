'use client';

import { useCallback, type RefObject } from 'react';
import { usePlayerStore } from '../stores/playerStore';
import { selectCurrentTrack, useQueueStore } from '../stores/queueStore';
import { resolveSource } from '../lib/sourceResolver';
import type { PlayableTrack } from '../lib/types';

/**
 * High-level commands the UI dispatches. They coordinate the two stores and
 * the single `<audio>` element. Callers never touch the element directly.
 */
export function usePlayerActions(audioRef: RefObject<HTMLAudioElement | null>) {
  const togglePlayPause = useCallback(() => {
    const current = selectCurrentTrack(useQueueStore.getState());
    if (current && resolveSource(current).kind === 'youtube') {
      const s = usePlayerStore.getState().status;
      if (s === 'playing') {
        usePlayerStore.getState().setStatus('paused');
      } else if (s === 'paused' || s === 'idle' || s === 'error') {
        usePlayerStore.getState().setStatus('playing');
      }
      return;
    }
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      void audio.play().catch(() => {
        /* swallow: status mirrored by event listeners */
      });
    } else {
      audio.pause();
    }
  }, [audioRef]);

  const seekTo = useCallback(
    (seconds: number) => {
      const current = selectCurrentTrack(useQueueStore.getState());
      if (current && resolveSource(current).kind === 'youtube') {
        usePlayerStore.getState().setSeekTrigger(seconds);
        usePlayerStore.getState().setPosition(seconds);
        return;
      }
      const audio = audioRef.current;
      if (!audio) return;
      const clamped = Math.max(0, Math.min(seconds, audio.duration || seconds));
      audio.currentTime = clamped;
      usePlayerStore.getState().setPosition(clamped);
    },
    [audioRef],
  );

  const playNow = useCallback((track: PlayableTrack) => {
    useQueueStore.getState().playNow(track);
  }, []);

  const playList = useCallback((tracks: readonly PlayableTrack[], startIndex: number) => {
    useQueueStore.getState().playList(tracks, startIndex);
  }, []);

  const next = useCallback(() => {
    useQueueStore.getState().next();
  }, []);

  const prev = useCallback(() => {
    const current = selectCurrentTrack(useQueueStore.getState());
    if (current && resolveSource(current).kind === 'youtube') {
      const position = usePlayerStore.getState().position;
      if (position > 3) {
        usePlayerStore.getState().setSeekTrigger(0);
        usePlayerStore.getState().setPosition(0);
        return;
      }
      useQueueStore.getState().prev();
      return;
    }
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      // Restart the current track on prev when more than 3s have elapsed
      audio.currentTime = 0;
      return;
    }
    useQueueStore.getState().prev();
  }, [audioRef]);

  /** Toggle play if this track is already current; otherwise start it. */
  const toggleForTrack = useCallback(
    (track: PlayableTrack) => {
      const current = selectCurrentTrack(useQueueStore.getState());
      if (current?.slug === track.slug) {
        togglePlayPause();
        return;
      }
      useQueueStore.getState().playNow(track);
    },
    [togglePlayPause],
  );

  /** Toggle play if `track` is current and within `tracks`; otherwise start
   *  the list at `startIndex`. */
  const toggleForList = useCallback(
    (tracks: readonly PlayableTrack[], startIndex: number) => {
      const current = selectCurrentTrack(useQueueStore.getState());
      const requested = tracks[startIndex];
      if (requested && current?.slug === requested.slug) {
        togglePlayPause();
        return;
      }
      useQueueStore.getState().playList(tracks, startIndex);
    },
    [togglePlayPause],
  );

  return {
    togglePlayPause,
    seekTo,
    playNow,
    playList,
    next,
    prev,
    toggleForTrack,
    toggleForList,
  };
}
