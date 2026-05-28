/**
 * Transpose utilities for chord names in both Spanish and English notation.
 *
 * Spanish: Do Re Mi Fa Sol La Si  (case-insensitive in parser; canonical output is title-case)
 * English: C  D  E  F  G  A  B
 *
 * Semitone mapping (0 = C / Do):
 *   0=Do/C  1=Do#/C#  2=Re/D  3=Re#/D#  4=Mi/E  5=Fa/F
 *   6=Fa#/F#  7=Sol/G  8=Sol#/G#  9=La/A  10=La#/A#  11=Si/B
 */

// ── Spanish ──────────────────────────────────────────────────────────────────

const ES_NOTE_TO_SEMITONE: Record<string, number> = {
  Do: 0,
  'Do#': 1,
  Reb: 1,
  Re: 2,
  'Re#': 3,
  Mib: 3,
  Mi: 4,
  Fa: 5,
  'Fa#': 6,
  Solb: 6,
  Sol: 7,
  'Sol#': 8,
  Lab: 8,
  La: 9,
  'La#': 10,
  Sib: 10,
  Si: 11,
};

const ES_SHARP: readonly string[] = [
  'Do',
  'Do#',
  'Re',
  'Re#',
  'Mi',
  'Fa',
  'Fa#',
  'Sol',
  'Sol#',
  'La',
  'La#',
  'Si',
];
const ES_FLAT: readonly string[] = [
  'Do',
  'Reb',
  'Re',
  'Mib',
  'Mi',
  'Fa',
  'Solb',
  'Sol',
  'Lab',
  'La',
  'Sib',
  'Si',
];
const ES_FLAT_NOTES = new Set(['Reb', 'Mib', 'Solb', 'Lab', 'Sib']);

/** Regex to split a Spanish chord token into note+accidental and quality suffix. */
const ES_CHORD_NOTE_REGEX = /^(Sol|Do|Re|Mi|Fa|La|Si)([#b]?)(.*)/i;

// ── English ───────────────────────────────────────────────────────────────────

const EN_NOTE_TO_SEMITONE: Record<string, number> = {
  C: 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
};

const EN_SHARP: readonly string[] = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
];
const EN_FLAT: readonly string[] = [
  'C',
  'Db',
  'D',
  'Eb',
  'E',
  'F',
  'Gb',
  'G',
  'Ab',
  'A',
  'Bb',
  'B',
];
const EN_FLAT_NOTES = new Set(['Db', 'Eb', 'Gb', 'Ab', 'Bb']);

/** Regex to split an English chord token into note+accidental and quality suffix. */
const EN_CHORD_NOTE_REGEX = /^([A-G])([#b]?)(.*)/;

// ── Shared utilities ──────────────────────────────────────────────────────────

type NotationSystem = 'spanish' | 'english';

/**
 * Detect which notation system a chord token uses.
 * Spanish notes (Sol, Do, Re, Mi, Fa, La, Si) are checked first because they
 * are multi-character and cannot be confused with single-letter English notes.
 */
export function detectNotation(token: string): NotationSystem | null {
  if (/^(?:Sol|Do|Re|Mi|Fa|La|Si)/i.test(token)) return 'spanish';
  if (/^[A-G]/.test(token)) return 'english';
  return null;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Transpose a single Spanish note name (without quality) by `semitones`.
 * Returns the note unchanged if it isn't recognised.
 */
export function transposeNote(note: string, semitones: number): string {
  // Normalise: look up with canonical title-case first, then lowercase
  const canonical = note.charAt(0).toUpperCase() + note.slice(1).toLowerCase();
  const base = ES_NOTE_TO_SEMITONE[canonical] ?? ES_NOTE_TO_SEMITONE[note];
  if (base === undefined) return note;
  const newSemitone = (((base + semitones) % 12) + 12) % 12;
  const useFlats = ES_FLAT_NOTES.has(canonical) || ES_FLAT_NOTES.has(note);
  return (useFlats ? ES_FLAT[newSemitone] : ES_SHARP[newSemitone]) ?? note;
}

/**
 * Transpose a full chord token (note + optional quality suffix) by `semitones`.
 * Automatically detects Spanish or English notation and preserves it in output.
 * The quality suffix (m, 7, maj7, sus4, …) is always preserved.
 */
export function transposeChordToken(token: string, semitones: number): string {
  if (semitones === 0) return token;

  const system = detectNotation(token);

  if (system === 'spanish') {
    const m = ES_CHORD_NOTE_REGEX.exec(token);
    if (!m) return token;
    // Normalise note to title-case before lookup
    const noteName = (m[1] ?? '').charAt(0).toUpperCase() + (m[1] ?? '').slice(1).toLowerCase();
    const accidental = m[2] ?? '';
    const quality = m[3] ?? '';
    const noteFull = noteName + accidental;
    const newNote = transposeNote(noteFull, semitones);
    return newNote + quality;
  }

  if (system === 'english') {
    const m = EN_CHORD_NOTE_REGEX.exec(token);
    if (!m) return token;
    const noteFull = (m[1] ?? '') + (m[2] ?? ''); // e.g. "A", "F#", "Bb"
    const quality = m[3] ?? ''; // e.g. "m", "maj7", ""

    // Handle slash bass note separately (e.g. D/F#)
    const slashIdx = quality.indexOf('/');
    if (slashIdx !== -1) {
      const rootQuality = quality.slice(0, slashIdx);
      const bassNote = quality.slice(slashIdx + 1);
      const newRoot = transposeEnglishNote(noteFull, semitones);
      const newBass = transposeEnglishNote(bassNote, semitones);
      return newRoot + rootQuality + '/' + newBass;
    }

    const newNote = transposeEnglishNote(noteFull, semitones);
    return newNote + quality;
  }

  return token;
}

function transposeEnglishNote(note: string, semitones: number): string {
  const base = EN_NOTE_TO_SEMITONE[note];
  if (base === undefined) return note;
  const newSemitone = (((base + semitones) % 12) + 12) % 12;
  const useFlats = EN_FLAT_NOTES.has(note);
  return (useFlats ? EN_FLAT[newSemitone] : EN_SHARP[newSemitone]) ?? note;
}

/**
 * Transpose every chord token in a chord line string.
 * Whitespace structure (including large gaps used for chord positioning) is preserved.
 */
export function transposeChordLine(line: string, semitones: number): string {
  if (semitones === 0) return line;
  return line
    .split(/(\s+)/)
    .map((part) => (/^\s+$/.test(part) ? part : transposeChordToken(part, semitones)))
    .join('');
}

/**
 * Returns the "shapes" chord line a player would use on a capo guitar.
 *
 * The guitar with capo at fret N sounds N semitones higher than fretted.
 * So the player's fingered shapes are: effectiveSemitones = transposeAmount - capo.
 */
export function getCapoAdjustedDisplay(
  chords: string,
  transposeAmount: number,
  capo: number,
): string {
  return transposeChordLine(chords, transposeAmount - capo);
}
