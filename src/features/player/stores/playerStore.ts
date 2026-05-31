'use client';

import { create } from 'zustand';
import { persist, createJSONStorage, subscribeWithSelector } from 'zustand/middleware';
import type { PlayerStatus, RepeatMode } from '../lib/types';

interface PlayerState {
  // Persisted slice (user preferences)
  volume: number; // 0..1
  muted: boolean;
  repeat: RepeatMode;
  shuffle: boolean;

  // Ephemeral playback state (never persisted)
  status: PlayerStatus;
  position: number;
  duration: number;
  error: string | null;

  // YouTube floating player controls
  youtubePlayerOpen: boolean;
  /** Imperative seek trigger. The YouTube player watches this and seeks when it changes. */
  seekTrigger: { seconds: number; ts: number } | null;
}

interface PlayerActions {
  setVolume: (v: number) => void;
  toggleMuted: () => void;
  cycleRepeat: () => void;
  toggleShuffle: () => void;

  setStatus: (s: PlayerStatus) => void;
  setPosition: (p: number) => void;
  setDuration: (d: number) => void;
  setError: (e: string | null) => void;
  setSeekTrigger: (seconds: number) => void;
  setYoutubePlayerOpen: (open: boolean) => void;

  reset: () => void;
}

const ephemeral = (): Pick<PlayerState, 'status' | 'position' | 'duration' | 'error' | 'youtubePlayerOpen' | 'seekTrigger'> => ({
  status: 'idle',
  position: 0,
  duration: 0,
  error: null,
  youtubePlayerOpen: true,
  seekTrigger: null,
});

export const usePlayerStore = create<PlayerState & PlayerActions>()(
  subscribeWithSelector(
    persist(
      (set) => ({
        volume: 0.85,
        muted: false,
        repeat: 'off',
        shuffle: false,
        ...ephemeral(),

        setVolume: (volume) =>
          set({ volume: Math.min(1, Math.max(0, volume)), muted: volume === 0 ? true : false }),
        toggleMuted: () => set((s) => ({ muted: !s.muted })),
        cycleRepeat: () =>
          set((s) => ({
            repeat: s.repeat === 'off' ? 'all' : s.repeat === 'all' ? 'one' : 'off',
          })),
        toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),

        setStatus: (status) => set({ status }),
        setPosition: (position) => set({ position }),
        setDuration: (duration) => set({ duration }),
        setError: (error) => set({ error }),
        setSeekTrigger: (seconds) => set({ seekTrigger: { seconds, ts: Date.now() } }),
        setYoutubePlayerOpen: (youtubePlayerOpen) => set({ youtubePlayerOpen }),

        reset: () => set(ephemeral()),
      }),
      {
        name: 'bahaisongs:player',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          volume: state.volume,
          muted: state.muted,
          repeat: state.repeat,
          shuffle: state.shuffle,
        }),
        // We hydrate manually post-mount to avoid SSR / hydration mismatches.
        skipHydration: true,
      },
    ),
  ),
);
