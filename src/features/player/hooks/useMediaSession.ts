'use client';

import { useEffect, type RefObject } from 'react';
import { usePlayerStore } from '../stores/playerStore';
import { selectCurrentTrack, useQueueStore } from '../stores/queueStore';
import { usePlayerActions } from './usePlayerActions';

/**
 * Wire the global Media Session API so lockscreen widgets, smartwatches and
 * desktop multimedia keys reflect the player state and can control it.
 *
 * Idempotent: setting the metadata or action handlers repeatedly is cheap.
 */
export function useMediaSession(audioRef: RefObject<HTMLAudioElement | null>) {
  const actions = usePlayerActions(audioRef);

  // Metadata mirror
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;
    return useQueueStore.subscribe(
      (state) => selectCurrentTrack(state),
      (track) => {
        if (!track) {
          navigator.mediaSession.metadata = null;
          navigator.mediaSession.playbackState = 'none';
          return;
        }
        navigator.mediaSession.metadata = new window.MediaMetadata({
          title: track.title,
          artist: track.artist,
          album: 'BahaiSongs',
        });
      },
      { fireImmediately: true },
    );
  }, []);

  // Status mirror
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;
    return usePlayerStore.subscribe(
      (s) => s.status,
      (status) => {
        navigator.mediaSession.playbackState =
          status === 'playing' ? 'playing' : status === 'paused' ? 'paused' : 'none';
      },
      { fireImmediately: true },
    );
  }, []);

  // Action handlers (register once)
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;
    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ['play', () => actions.togglePlayPause()],
      ['pause', () => actions.togglePlayPause()],
      ['nexttrack', () => actions.next()],
      ['previoustrack', () => actions.prev()],
      [
        'seekto',
        (event) => {
          if (typeof event.seekTime === 'number') actions.seekTo(event.seekTime);
        },
      ],
    ];
    for (const [action, handler] of handlers) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        // Some browsers don't implement every action; skip silently.
      }
    }
    return () => {
      for (const [action] of handlers) {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch {
          // ignore
        }
      }
    };
  }, [actions]);
}
