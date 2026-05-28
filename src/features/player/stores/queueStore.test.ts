import { beforeEach, describe, expect, it } from 'vitest';
import { selectCurrentTrack, useQueueStore } from './queueStore';
import type { PlayableTrack } from '../lib/types';

const t = (slug: string): PlayableTrack => ({
  slug,
  title: slug.toUpperCase(),
  artist: 'A',
  artistSlug: 'a',
  language: 'es',
  audioUrl: `https://x/${slug}.mp3`,
});

beforeEach(() => {
  useQueueStore.getState().clear();
});

describe('queueStore', () => {
  it('starts empty', () => {
    const s = useQueueStore.getState();
    expect(s.queue).toHaveLength(0);
    expect(s.index).toBe(-1);
    expect(selectCurrentTrack(s)).toBeNull();
  });

  describe('playNow', () => {
    it('replaces the queue with a single track and sets index 0', () => {
      const track = t('a');
      useQueueStore.getState().playNow(track);
      const s = useQueueStore.getState();
      expect(s.queue).toEqual([track]);
      expect(s.originalQueue).toEqual([track]);
      expect(s.index).toBe(0);
      expect(selectCurrentTrack(s)?.slug).toBe('a');
    });
  });

  describe('playList', () => {
    it('clamps startIndex into range', () => {
      useQueueStore.getState().playList([t('a'), t('b')], 99);
      expect(useQueueStore.getState().index).toBe(1);
      useQueueStore.getState().playList([t('a'), t('b')], -3);
      expect(useQueueStore.getState().index).toBe(0);
    });

    it('handles the empty case', () => {
      useQueueStore.getState().playList([], 0);
      expect(useQueueStore.getState().index).toBe(-1);
    });
  });

  describe('next / prev', () => {
    it('advances and stops at the end', () => {
      useQueueStore.getState().playList([t('a'), t('b'), t('c')], 0);
      expect(useQueueStore.getState().next()?.slug).toBe('b');
      expect(useQueueStore.getState().next()?.slug).toBe('c');
      expect(useQueueStore.getState().next()).toBeNull();
      expect(useQueueStore.getState().index).toBe(2);
    });

    it('goes back without underflowing past 0', () => {
      useQueueStore.getState().playList([t('a'), t('b')], 1);
      expect(useQueueStore.getState().prev()?.slug).toBe('a');
      expect(useQueueStore.getState().prev()?.slug).toBe('a');
      expect(useQueueStore.getState().index).toBe(0);
    });
  });

  describe('addNext / addToQueue', () => {
    it('addNext inserts immediately after the current index', () => {
      useQueueStore.getState().playList([t('a'), t('c')], 0);
      useQueueStore.getState().addNext(t('b'));
      expect(useQueueStore.getState().queue.map((q) => q.slug)).toEqual(['a', 'b', 'c']);
    });

    it('addToQueue appends to the end', () => {
      useQueueStore.getState().playList([t('a')], 0);
      useQueueStore.getState().addToQueue(t('z'));
      expect(useQueueStore.getState().queue.map((q) => q.slug)).toEqual(['a', 'z']);
    });
  });

  describe('removeAt', () => {
    it('decrements the index when removing an earlier track', () => {
      useQueueStore.getState().playList([t('a'), t('b'), t('c')], 2);
      useQueueStore.getState().removeAt(0);
      const s = useQueueStore.getState();
      expect(s.queue.map((q) => q.slug)).toEqual(['b', 'c']);
      expect(s.index).toBe(1);
    });

    it('keeps the active track aligned when removing the current one', () => {
      useQueueStore.getState().playList([t('a'), t('b'), t('c')], 1);
      useQueueStore.getState().removeAt(1);
      expect(useQueueStore.getState().queue.map((q) => q.slug)).toEqual(['a', 'c']);
    });
  });

  describe('move', () => {
    it('keeps the current track index after a drag-reorder', () => {
      useQueueStore.getState().playList([t('a'), t('b'), t('c'), t('d')], 1);
      // Drag a (idx 0) to position 2 → [b, c, a, d]; current `b` moves from idx 1 to idx 0
      useQueueStore.getState().move(0, 2);
      const s = useQueueStore.getState();
      expect(s.queue.map((q) => q.slug)).toEqual(['b', 'c', 'a', 'd']);
      expect(s.index).toBe(0);
    });
  });

  describe('applyShuffle', () => {
    it('puts the current track first when shuffling on', () => {
      useQueueStore.getState().playList([t('a'), t('b'), t('c'), t('d'), t('e')], 2);
      useQueueStore.getState().applyShuffle(true);
      const s = useQueueStore.getState();
      expect(s.queue[0]?.slug).toBe('c');
      expect(s.index).toBe(0);
      expect(s.queue).toHaveLength(5);
    });

    it('restores the original order and relocates the current track', () => {
      useQueueStore.getState().playList([t('a'), t('b'), t('c')], 1);
      useQueueStore.getState().applyShuffle(true);
      useQueueStore.getState().applyShuffle(false);
      const s = useQueueStore.getState();
      expect(s.queue.map((q) => q.slug)).toEqual(['a', 'b', 'c']);
      expect(s.index).toBe(1);
    });
  });
});
