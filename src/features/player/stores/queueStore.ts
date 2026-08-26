'use client';

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { PlayableTrack } from '../lib/types';

interface QueueState {
  /** Visible queue order. Identical to `originalQueue` when shuffle is off. */
  queue: PlayableTrack[];
  /** Author-provided order; preserved so toggling shuffle off restores it. */
  originalQueue: PlayableTrack[];
  /** Index of the currently-playing track in `queue`, or -1 when idle. */
  index: number;
  /** Context for analytics — set when playback is initiated. */
  playSource: string | null;
}

interface QueueActions {
  /** Replace the queue with `[track]` and start playback at index 0. */
  playNow: (track: PlayableTrack, source?: string) => void;
  /** Replace the queue with `tracks` starting at `startIndex`. */
  playList: (tracks: readonly PlayableTrack[], startIndex: number, source?: string) => void;
  /** Insert `track` immediately after the current one. */
  addNext: (track: PlayableTrack) => void;
  /** Append `track` to the end of the queue. */
  addToQueue: (track: PlayableTrack) => void;
  /** Remove the track at `idx`. */
  removeAt: (idx: number) => void;
  /** Reorder via drag — moves entry from `from` to `to`. */
  move: (from: number, to: number) => void;
  /** Step forward; returns the next track or `null` if the queue is exhausted. */
  next: () => PlayableTrack | null;
  /** Step backward; returns the previous track or `null`. */
  prev: () => PlayableTrack | null;
  /** Jump directly to a queue position. */
  jumpTo: (idx: number) => PlayableTrack | null;
  /** Wipe the queue. */
  clear: () => void;
  /** Apply a shuffle to the queue (keeping the current track at index 0)
   *  or restore the original order. */
  applyShuffle: (shuffle: boolean) => void;
}

const initial: QueueState = { queue: [], originalQueue: [], index: -1, playSource: null };

/** Fisher-Yates that keeps the current track at index 0. */
function shuffleAround<T>(items: readonly T[], pivotIdx: number): T[] {
  if (items.length === 0 || pivotIdx < 0 || pivotIdx >= items.length) return [...items];
  const head = items[pivotIdx]!;
  const rest = items.filter((_, i) => i !== pivotIdx);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j]!, rest[i]!];
  }
  return [head, ...rest];
}

export const useQueueStore = create<QueueState & QueueActions>()(
  subscribeWithSelector((set, get) => ({
    ...initial,

    playNow: (track, source) =>
      set({
        queue: [track],
        originalQueue: [track],
        index: 0,
        playSource: source ?? 'player',
      }),

    playList: (tracks, startIndex, source) => {
      const arr = [...tracks];
      const safeIdx = arr.length === 0 ? -1 : Math.max(0, Math.min(startIndex, arr.length - 1));
      set({
        queue: arr,
        originalQueue: arr,
        index: safeIdx,
        playSource: source ?? 'player',
      });
    },

    addNext: (track) =>
      set((s) => {
        const insertAt = Math.max(0, s.index + 1);
        const queue = [...s.queue.slice(0, insertAt), track, ...s.queue.slice(insertAt)];
        const originalQueue = [...s.originalQueue, track];
        return { queue, originalQueue };
      }),

    addToQueue: (track) =>
      set((s) => ({
        queue: [...s.queue, track],
        originalQueue: [...s.originalQueue, track],
      })),

    removeAt: (idx) =>
      set((s) => {
        if (idx < 0 || idx >= s.queue.length) return {};
        const removed = s.queue[idx]!;
        const queue = s.queue.filter((_, i) => i !== idx);
        const originalQueue = s.originalQueue.filter((t) => t.slug !== removed.slug);
        let nextIndex = s.index;
        if (idx < s.index) nextIndex = s.index - 1;
        else if (idx === s.index) nextIndex = Math.min(s.index, queue.length - 1);
        return { queue, originalQueue, index: nextIndex };
      }),

    move: (from, to) =>
      set((s) => {
        if (from === to || from < 0 || from >= s.queue.length || to < 0 || to >= s.queue.length) {
          return {};
        }
        const queue = [...s.queue];
        const [moved] = queue.splice(from, 1);
        queue.splice(to, 0, moved!);
        // Track the moving index
        let nextIndex = s.index;
        if (from === s.index) nextIndex = to;
        else if (from < s.index && to >= s.index) nextIndex = s.index - 1;
        else if (from > s.index && to <= s.index) nextIndex = s.index + 1;
        return { queue, index: nextIndex };
      }),

    next: () => {
      const { queue, index } = get();
      if (queue.length === 0) return null;
      const nextIdx = index + 1;
      if (nextIdx >= queue.length) return null;
      set({ index: nextIdx });
      return queue[nextIdx] ?? null;
    },

    prev: () => {
      const { queue, index } = get();
      if (queue.length === 0) return null;
      const prevIdx = Math.max(0, index - 1);
      set({ index: prevIdx });
      return queue[prevIdx] ?? null;
    },

    jumpTo: (idx) => {
      const { queue } = get();
      if (idx < 0 || idx >= queue.length) return null;
      set({ index: idx });
      return queue[idx] ?? null;
    },

    clear: () => set(initial),

    applyShuffle: (shuffle) =>
      set((s) => {
        if (s.queue.length === 0) return {};
        if (shuffle) {
          const reshuffled = shuffleAround(s.queue, Math.max(0, s.index));
          return { queue: reshuffled, index: 0 };
        }
        // Restore the original order; relocate the current track inside it
        const current = s.queue[s.index];
        const newIndex = current ? s.originalQueue.findIndex((t) => t.slug === current.slug) : -1;
        return { queue: [...s.originalQueue], index: newIndex >= 0 ? newIndex : 0 };
      }),
  })),
);

/** Convenience selector: the currently active track or `null`. */
export function selectCurrentTrack(s: QueueState): PlayableTrack | null {
  return s.index >= 0 && s.index < s.queue.length ? (s.queue[s.index] ?? null) : null;
}

/** Convenience selector: analytics source for the active playback session. */
export function selectPlaySource(s: QueueState): string {
  return s.playSource ?? 'player';
}
