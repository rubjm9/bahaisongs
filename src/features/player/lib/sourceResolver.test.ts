import { describe, expect, it } from 'vitest';
import { hasPlayableSource, resolveSource } from './sourceResolver';
import type { PlayableTrack } from './types';

const base: PlayableTrack = {
  slug: 't',
  title: 'T',
  artist: 'A',
  artistSlug: 'a',
  language: 'es',
};

describe('resolveSource', () => {
  it('prefers an MP3 URL when available', () => {
    expect(resolveSource({ ...base, audioUrl: 'https://example.org/t.mp3' })).toEqual({
      kind: 'mp3',
      url: 'https://example.org/t.mp3',
    });
  });

  it('falls back to YouTube when there is no MP3', () => {
    expect(resolveSource({ ...base, youtubeId: 'dQw4w9WgXcQ' })).toEqual({
      kind: 'youtube',
      videoId: 'dQw4w9WgXcQ',
    });
  });

  it('returns unavailable when no source is configured', () => {
    expect(resolveSource(base)).toEqual({ kind: 'unavailable' });
  });

  it('prefers MP3 over YouTube when both exist', () => {
    const both = { ...base, audioUrl: 'https://x/y.mp3', youtubeId: 'abc' };
    expect(resolveSource(both).kind).toBe('mp3');
  });
});

describe('hasPlayableSource', () => {
  it('is true when there is any kind of source', () => {
    expect(hasPlayableSource({ ...base, audioUrl: 'x' })).toBe(true);
    expect(hasPlayableSource({ ...base, youtubeId: 'x' })).toBe(true);
  });
  it('is false when no source is configured', () => {
    expect(hasPlayableSource(base)).toBe(false);
  });
});
