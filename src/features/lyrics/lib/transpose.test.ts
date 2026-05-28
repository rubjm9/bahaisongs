import { describe, it, expect } from 'vitest';
import {
  transposeNote,
  transposeChordToken,
  transposeChordLine,
  getCapoAdjustedDisplay,
  detectNotation,
} from './transpose';

describe('transposeNote', () => {
  it('transposes Do up by 2 semitones → Re', () => {
    expect(transposeNote('Do', 2)).toBe('Re');
  });

  it('transposes Sol up by 1 semitone → Sol#', () => {
    expect(transposeNote('Sol', 1)).toBe('Sol#');
  });

  it('transposes Si up by 1 semitone → Do (wraps around)', () => {
    expect(transposeNote('Si', 1)).toBe('Do');
  });

  it('transposes down (negative semitones)', () => {
    expect(transposeNote('Re', -2)).toBe('Do');
  });

  it('transposes by 0 returns same note', () => {
    expect(transposeNote('La', 0)).toBe('La');
  });

  it('transposes accidental note: Do# up by 1 → Re', () => {
    expect(transposeNote('Do#', 1)).toBe('Re');
  });

  it('uses flats when original note is flat: Sib → produces flats', () => {
    // Sib = semitone 10, +1 = 11 = Si
    expect(transposeNote('Sib', 1)).toBe('Si');
    // Sib up 2 = semitone 10 + 2 = 0 = Do
    expect(transposeNote('Sib', 2)).toBe('Do');
  });

  it('returns unknown note unchanged', () => {
    expect(transposeNote('Xyz', 3)).toBe('Xyz');
  });
});

describe('transposeChordToken', () => {
  it('transposes note and preserves quality suffix', () => {
    expect(transposeChordToken('Solm', 2)).toBe('Lam');
    expect(transposeChordToken('Do7', 5)).toBe('Fa7');
    expect(transposeChordToken('Remaj7', 1)).toBe('Re#maj7');
  });

  it('returns unknown token unchanged', () => {
    expect(transposeChordToken('Xyz', 2)).toBe('Xyz');
  });

  it('transposes simple token (no suffix)', () => {
    expect(transposeChordToken('Sol', 5)).toBe('Do');
  });
});

describe('transposeChordLine', () => {
  it('transposes all tokens in a line', () => {
    expect(transposeChordLine('Sol Mim', 2)).toBe('La Fa#m');
  });

  it('returns line unchanged when semitones = 0', () => {
    expect(transposeChordLine('Sol Mim', 0)).toBe('Sol Mim');
  });

  it('preserves extra whitespace', () => {
    const result = transposeChordLine('Do  Re', 2);
    expect(result).toBe('Re  Mi');
  });
});

describe('getCapoAdjustedDisplay', () => {
  it('no transpose, no capo → original chords', () => {
    expect(getCapoAdjustedDisplay('Sol Mim', 0, 0)).toBe('Sol Mim');
  });

  it('capo 2, no transpose → chords lowered by 2 (player shapes)', () => {
    expect(getCapoAdjustedDisplay('La Fa#m', 0, 2)).toBe('Sol Mim');
  });

  it('transpose +2, capo 2 → no net change in shapes', () => {
    expect(getCapoAdjustedDisplay('Sol Mim', 2, 2)).toBe('Sol Mim');
  });

  it('transpose +5, capo 0 → transposes by +5', () => {
    expect(getCapoAdjustedDisplay('Do', 5, 0)).toBe('Fa');
  });
});

describe('detectNotation', () => {
  it('detects Spanish notation', () => {
    expect(detectNotation('Sol')).toBe('spanish');
    expect(detectNotation('Mim')).toBe('spanish');
    expect(detectNotation('DO')).toBe('spanish');
    expect(detectNotation('LAm')).toBe('spanish');
  });

  it('detects English notation', () => {
    expect(detectNotation('A')).toBe('english');
    expect(detectNotation('F#m')).toBe('english');
    expect(detectNotation('Bm')).toBe('english');
    expect(detectNotation('D/F#')).toBe('english');
  });

  it('returns null for tokens starting with non-note characters', () => {
    expect(detectNotation('Xyz')).toBeNull();
    expect(detectNotation('123')).toBeNull();
    expect(detectNotation('!')).toBeNull();
  });
});

describe('transposeChordToken — English', () => {
  it('transposes English root note', () => {
    expect(transposeChordToken('A', 2)).toBe('B');
    expect(transposeChordToken('G', 2)).toBe('A');
    expect(transposeChordToken('B', 1)).toBe('C');
  });

  it('transposes English chord with quality', () => {
    expect(transposeChordToken('Am', 2)).toBe('Bm');
    expect(transposeChordToken('F#m', 2)).toBe('G#m');
    expect(transposeChordToken('Cmaj7', 2)).toBe('Dmaj7');
    expect(transposeChordToken('A7', 3)).toBe('C7');
  });

  it('transposes slash chord bass note too', () => {
    expect(transposeChordToken('D/F#', 2)).toBe('E/G#');
  });

  it('returns 0-semitone token unchanged', () => {
    expect(transposeChordToken('Am', 0)).toBe('Am');
  });
});

describe('transposeChordLine — mixed and English', () => {
  it('transposes an English chord line', () => {
    expect(transposeChordLine('A F#m', 2)).toBe('B G#m');
    expect(transposeChordLine('D G', 5)).toBe('G C');
  });

  it('preserves whitespace in English chord line', () => {
    const result = transposeChordLine('D   G', 2);
    expect(result).toBe('E   A');
  });
});
