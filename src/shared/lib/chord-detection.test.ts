import { describe, expect, it } from 'vitest';
import { deriveHasChords } from '@/shared/lib/chord-detection';

describe('deriveHasChords', () => {
  it('detects chords in ChordPro body', () => {
    expect(deriveHasChords('', '[Am]Hola [G]mundo')).toBe(true);
  });

  it('falls back to plain text heuristics', () => {
    expect(deriveHasChords('(Do Re Sol Mim) Pedrito ha llegado', '')).toBe(true);
  });

  it('returns false when neither body has chord hints', () => {
    expect(deriveHasChords('Letra sin acordes', '')).toBe(false);
  });
});
