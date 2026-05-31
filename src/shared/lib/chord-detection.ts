/**
 * Heuristic detection of chord hints inside plain-text or ChordPro lyrics.
 */

const SPANISH_NOTE = '(?:Do|Re|Mi|Fa|Sol|La|Si)';
const ENGLISH_NOTE = '[A-G]';
const QUALITY = '(?:[ \\t\\n]*(?:maj|min|sus2|sus4|dim|aug|7|9|11|13|m|M))?';
const ACCIDENTAL = '[#b]?';
const NOTE = `(?:(?:${SPANISH_NOTE}|${ENGLISH_NOTE})${ACCIDENTAL}${QUALITY})`;
const SEPARATOR = '(?:[ \\t\\n]*[,;][ \\t\\n]*|[ \\t\\n]+)';

const CHORD_PROLOGUE = new RegExp(
  `^\\s*\\([ \\t\\n]*${NOTE}(?:${SEPARATOR}${NOTE}){1,11}[ \\t\\n]*(?:\\.{3}|…)?[ \\t\\n]*\\)`,
  'm',
);

const BRACKETED_CHORDS = /\[(?:[A-G](?:m|maj|sus[24]|dim|aug|7|9|11|13)?[#b]?)\]/;

export function detectChords(plainText: string): boolean {
  if (!plainText) return false;
  if (BRACKETED_CHORDS.test(plainText)) return true;
  if (CHORD_PROLOGUE.test(plainText)) return true;
  return false;
}

export function deriveHasChords(bodyPlain?: string | null, bodyChordpro?: string | null): boolean {
  const chordpro = bodyChordpro?.trim() ?? '';
  if (chordpro) return detectChords(chordpro);
  const plain = bodyPlain?.trim() ?? '';
  return detectChords(plain);
}
