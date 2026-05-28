import { describe, it, expect } from 'vitest';
import { isChordLine, parseLyrics } from './chordParser';

describe('isChordLine', () => {
  it('returns true for single chord token', () => {
    expect(isChordLine('Sol')).toBe(true);
  });

  it('returns true for multiple chord tokens', () => {
    expect(isChordLine('Sol Mim')).toBe(true);
    expect(isChordLine('Do Re Mi')).toBe(true);
  });

  it('returns true for chord with quality suffix', () => {
    expect(isChordLine('Mim')).toBe(true);
    expect(isChordLine('Do7')).toBe(true);
    expect(isChordLine('Solmaj7')).toBe(true);
    expect(isChordLine('Resus4')).toBe(true);
    expect(isChordLine('Ladim')).toBe(true);
    expect(isChordLine('Faaugm')).toBe(false); // augm isn't a quality
  });

  it('returns true for accidentals', () => {
    expect(isChordLine('Do# Re#')).toBe(true);
    expect(isChordLine('Sib Lab')).toBe(true);
  });

  it('returns false for lyric lines', () => {
    expect(isChordLine('¡oh hijo del hombre!')).toBe(false);
    expect(isChordLine('Si me amas olvídate de ti mismo')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isChordLine('')).toBe(false);
    expect(isChordLine('   ')).toBe(false);
  });

  it('returns false for mixed chord/lyric', () => {
    expect(isChordLine('Sol y amor')).toBe(false);
  });

  it('returns true for English chord tokens', () => {
    expect(isChordLine('A F#m')).toBe(true);
    expect(isChordLine('Am F C G')).toBe(true);
    expect(isChordLine('D G')).toBe(true);
    expect(isChordLine('Bm')).toBe(true);
    expect(isChordLine('D/F#')).toBe(true);
    expect(isChordLine('Cmaj7')).toBe(true);
    expect(isChordLine('A A7')).toBe(true);
  });

  it('returns true for uppercase Spanish tokens (DO, SOL, LAm)', () => {
    expect(isChordLine('DO')).toBe(true);
    expect(isChordLine('SOL')).toBe(true);
    expect(isChordLine('MI LAm MI LAm')).toBe(true);
    expect(isChordLine('LAm')).toBe(true);
  });

  it('returns false for English lyric-like lines', () => {
    expect(isChordLine('A mi lado')).toBe(false);
    expect(isChordLine('Am , F , C , G (bis)')).toBe(false);
    expect(isChordLine('Intro: Am F')).toBe(false);
    expect(isChordLine('CORO')).toBe(false);
  });
});

describe('parseLyrics', () => {
  it('returns empty array for empty input', () => {
    expect(parseLyrics('')).toEqual([]);
    expect(parseLyrics('   ')).toEqual([]);
  });

  it('parses paired chord+lyric lines', () => {
    const text = 'Sol Mim\n¡oh hijo del hombre!';
    const result = parseLyrics(text);
    expect(result).toHaveLength(1);
    expect(result[0]?.blocks).toHaveLength(1);
    expect(result[0]?.blocks[0]).toEqual({
      chords: 'Sol Mim',
      lyric: '¡oh hijo del hombre!',
    });
  });

  it('parses chord+lyric pairs separated by blank lines (format B)', () => {
    // In the catalog, every line is its own blank-line-separated paragraph.
    // Both pairs end up in the same stanza since there is no section header.
    const text = [
      'Sol Mim',
      '¡oh hijo del hombre!',
      '',
      'Do Re',
      'Si me amas olvídate de ti mismo',
    ].join('\n');

    const result = parseLyrics(text);
    expect(result).toHaveLength(1);
    expect(result[0]?.blocks[0]?.chords).toBe('Sol Mim');
    expect(result[0]?.blocks[0]?.lyric).toBe('¡oh hijo del hombre!');
    expect(result[0]?.blocks[1]?.chords).toBe('Do Re');
    expect(result[0]?.blocks[1]?.lyric).toBe('Si me amas olvídate de ti mismo');
  });

  it('splits into stanzas at section header lines (CORO, ESTROFA…)', () => {
    const text = ['Am F', 'Primera línea', 'CORO', 'G C', 'Segunda línea'].join('\n');

    const result = parseLyrics(text);
    expect(result).toHaveLength(2);
    expect(result[0]?.blocks[0]?.chords).toBe('Am F');
    expect(result[1]?.blocks[0]?.lyric).toBe('CORO');
    expect(result[1]?.blocks[1]?.chords).toBe('G C');
  });

  it('parses plain lyric lines without chords', () => {
    const text = 'Línea sin acordes\nOtra línea';
    const result = parseLyrics(text);
    expect(result).toHaveLength(1);
    expect(result[0]?.blocks).toHaveLength(2);
    expect(result[0]?.blocks[0]).toEqual({ lyric: 'Línea sin acordes' });
    expect(result[0]?.blocks[1]).toEqual({ lyric: 'Otra línea' });
  });

  it('handles consecutive chord lines as plain lyric blocks', () => {
    // Two chord lines in a row — the second has no following lyric
    const text = 'Sol\nMim\nLetra aquí';
    const result = parseLyrics(text);
    // Sol is a chord line, Mim is next and also a chord line → Sol treated as plain lyric
    // Mim pairs with "Letra aquí"
    expect(result[0]?.blocks[0]).toEqual({ lyric: 'Sol' });
    expect(result[0]?.blocks[1]).toEqual({ chords: 'Mim', lyric: 'Letra aquí' });
  });

  it('handles stanza with mixed chord-paired and plain lines', () => {
    const text = ['Sol Mim', 'Primera línea', 'Segunda línea sin acorde'].join('\n');
    const result = parseLyrics(text);
    expect(result[0]?.blocks).toHaveLength(2);
    expect(result[0]?.blocks[0]).toEqual({ chords: 'Sol Mim', lyric: 'Primera línea' });
    expect(result[0]?.blocks[1]).toEqual({ lyric: 'Segunda línea sin acorde' });
  });
});
