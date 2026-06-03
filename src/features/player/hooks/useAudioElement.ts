'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { usePlayerStore } from '../stores/playerStore';
import { selectCurrentTrack, useQueueStore } from '../stores/queueStore';
import { resolvePlaybackUrl } from '../lib/resolveAudioUrl';
import { resolveSource } from '../lib/sourceResolver';

/**
 * Glue between the single global `<audio>` element and the Zustand stores.
 *
 *  - Updates `audio.src` whenever the active track changes
 *  - Mirrors `audio.volume` / `audio.muted` from the player store
 *  - Forwards `play` / `pause` / `timeupdate` / `loadedmetadata` / `ended` /
 *    `error` events back into the store (timeupdate throttled via rAF)
 *  - Implements auto-advance on `ended` respecting `repeat` mode
 *
 * Mounted exactly once in `<PlayerBar>`; no other component reads from / writes
 * to the `<audio>` element directly. This preserves the "single audio
 * instance" rule from `PLAYER_SURFACE` (legacy doc) and `docs/architecture/`.
 */
export function useAudioElement(audioRef: RefObject<HTMLAudioElement | null>) {
  const lastSrcRef = useRef<string | null>(null);
  const rafRef = useRef<number | null>(null);

  // === Track changes: update src and attempt playback ===
  useEffect(() => {
    let cancelled = false;

    const unsub = useQueueStore.subscribe(
      (state) => selectCurrentTrack(state),
      (track) => {
        void (async () => {
          const audio = audioRef.current;
          if (!audio || cancelled) return;
          if (!track) {
            audio.pause();
            audio.removeAttribute('src');
            audio.load();
            lastSrcRef.current = null;
            usePlayerStore.getState().reset();
            return;
          }
          const source = resolveSource(track);
          if (source.kind === 'youtube') {
            // YouTube tracks are handled by YoutubeFloatingPlayer; keep the
            // native audio element silent and reset its src.
            audio.pause();
            audio.removeAttribute('src');
            audio.load();
            lastSrcRef.current = null;
            usePlayerStore.getState().setError(null);
            // Setting 'loading' triggers the YoutubeFloatingPlayer to start
            // playback (playing prop = true while loading or playing).
            usePlayerStore.getState().setStatus('loading');
            return;
          }
          if (source.kind !== 'mp3') {
            usePlayerStore
              .getState()
              .setError('no-source-available');
            usePlayerStore.getState().setStatus('error');
            return;
          }

          usePlayerStore.getState().setError(null);
          usePlayerStore.getState().setStatus('loading');

          const playbackUrl = await resolvePlaybackUrl(track.slug, source.url);
          if (cancelled || !audio) return;
          if (!playbackUrl) {
            usePlayerStore.getState().setError('no-source-available');
            usePlayerStore.getState().setStatus('error');
            return;
          }
          if (playbackUrl === lastSrcRef.current) return;
          lastSrcRef.current = playbackUrl;
          audio.src = playbackUrl;
          audio.load();
          void audio.play().catch((err) => {
            // Browsers may refuse autoplay without user interaction. Stay in
            // 'paused' state so the play button is visible.
            if (err instanceof DOMException && err.name === 'NotAllowedError') {
              usePlayerStore.getState().setStatus('paused');
            } else {
              usePlayerStore.getState().setStatus('error');
              usePlayerStore
                .getState()
                .setError(err instanceof Error ? err.message : 'playback-failed');
            }
          });
        })();
      },
      { fireImmediately: true },
    );

    return () => {
      cancelled = true;
      unsub();
    };
  }, [audioRef]);

  // === Volume / muted mirroring ===
  useEffect(() => {
    return usePlayerStore.subscribe(
      (s) => ({ volume: s.volume, muted: s.muted }),
      ({ volume, muted }) => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.volume = volume;
        audio.muted = muted;
      },
      { fireImmediately: true, equalityFn: (a, b) => a.volume === b.volume && a.muted === b.muted },
    );
  }, [audioRef]);

  // === DOM event listeners ===
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => usePlayerStore.getState().setStatus('playing');
    const onPause = () => {
      if (usePlayerStore.getState().status !== 'error') {
        usePlayerStore.getState().setStatus('paused');
      }
    };
    const onLoadedMetadata = () => {
      usePlayerStore.getState().setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    };
    const onWaiting = () => usePlayerStore.getState().setStatus('loading');
    const onPlaying = () => usePlayerStore.getState().setStatus('playing');
    const onError = () => {
      usePlayerStore.getState().setStatus('error');
      usePlayerStore.getState().setError('audio-error');
    };
    const onTimeUpdate = () => {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        usePlayerStore.getState().setPosition(audio.currentTime);
      });
    };
    const onEnded = () => {
      const { repeat } = usePlayerStore.getState();
      if (repeat === 'one') {
        audio.currentTime = 0;
        void audio.play();
        return;
      }
      const nextTrack = useQueueStore.getState().next();
      if (!nextTrack && repeat === 'all') {
        useQueueStore.getState().jumpTo(0);
      } else if (!nextTrack) {
        usePlayerStore.getState().setStatus('idle');
      }
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('error', onError);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [audioRef]);
}
