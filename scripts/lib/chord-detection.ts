/**
 * Heuristic detection of chord hints inside the legacy plain-text lyrics.
 *
 * The WordPress catalogue does NOT store chord positions inline. Instead it
 * sometimes opens a stanza with a parenthesised list of chord names — e.g.
 *   "(La M, Re M, Mi M, La M) Mientras pienso en mi futuro por venir…"
 *   "(Do Re Sol Mim) Pedrito ha llegado al barrio…"
 *   "(Fa Do Sol Lam) Glorificaré tu alabanza…"
 *
 * After htmlToText, <br> inside the parenthesis becomes "\n", so the literal
 * stored form is often "(La\nM, Re\nM, Mi\nM, La\nM)" — the regex must accept
 * whitespace (including newlines) between the note letter and its quality.
 *
 * This is *NOT* enough to render real chord positions over lyrics — we'd lose
 * placement information if we converted heuristically. So the ETL only sets a
 * boolean `hasChords` flag on the lyrics record; the actual chord positions
 * must be authored manually in ChordPro by an admin or volunteer in Phase 5.
 *
 * The heuristic is conservative on purpose. False negatives ("we missed a
 * chord chart") are preferable to false positives ("we marked a song as
 * having chords when it doesn't"). It still recovers ≥20 of the ~70
 * `con-acordes` tagged posts in the legacy export.
 */

// note: Spanish solfege or English letter
const SPANISH_NOTE = '(?:Do|Re|Mi|Fa|Sol|La|Si)';
const ENGLISH_NOTE = '[A-G]';

// Quality / suffix; optional and may be separated from the note by whitespace
// (the WP <br> noise inside parentheses produces "La<br>M" → "La\nM").
const QUALITY = '(?:[ \\t\\n]*(?:maj|min|sus2|sus4|dim|aug|7|9|11|13|m|M))?';
const ACCIDENTAL = '[#b]?';

const NOTE = `(?:(?:${SPANISH_NOTE}|${ENGLISH_NOTE})${ACCIDENTAL}${QUALITY})`;
const SEPARATOR = '(?:[ \\t\\n]*[,;][ \\t\\n]*|[ \\t\\n]+)';

// Parenthesised chord list at the very start of any paragraph.
// Demands ≥2 chord tokens to avoid matching phrases like "(bis)".
const CHORD_PROLOGUE = new RegExp(
  `^\\s*\\([ \\t\\n]*${NOTE}(?:${SEPARATOR}${NOTE}){1,11}[ \\t\\n]*(?:\\.{3}|…)?[ \\t\\n]*\\)`,
  'm',
);

// ChordPro inline brackets: [C], [Gm], [F#maj7], etc.
const BRACKETED_CHORDS = /\[(?:[A-G](?:m|maj|sus[24]|dim|aug|7|9|11|13)?[#b]?)\]/;

export function detectChords(plainText: string): boolean {
  if (!plainText) return false;
  if (BRACKETED_CHORDS.test(plainText)) return true;
  if (CHORD_PROLOGUE.test(plainText)) return true;
  return false;
}
