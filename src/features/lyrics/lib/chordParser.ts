/**
 * Parses raw lyrics text into structured stanzas.
 *
 * Supports two chord notation systems used in the catalog:
 *   - Spanish: Do Re Mi Fa Sol La Si (case-insensitive, e.g. DO, SOL, LAm)
 *   - English: A B C D E F G (uppercase root, e.g. Am, F#m, D/F#)
 *
 * Chord lines appear on their own line above the corresponding lyric line.
 * Stanzas are separated by one or more blank lines.
 */

export interface LyricBlock {
  /** Raw chord line (e.g. "Sol Mim" or "A F#m"), absent for plain lyric lines. */
  chords?: string;
  /** Lyric text. */
  lyric: string;
}

export interface LyricStanza {
  blocks: LyricBlock[];
}

/**
 * Spanish chord token (case-insensitive).
 * Handles: Sol, DO, LAm, Mib, Fa#, Re7, Solmaj7, SOL#, etc.
 * Note order: Sol before La/Si to avoid partial matches.
 */
const SPANISH_CHORD_TOKEN =
  /^(?:Sol|Do|Re|Mi|Fa|La|Si)(?:[#b]?)(?:m(?:aj7?|in|7)?|7|maj7|sus[24]|add(?:9|11)|dim|aug|\d+)?(?:\/(?:Sol|Do|Re|Mi|Fa|La|Si)[#b]?)?$/i;

/**
 * English chord token (case-sensitive root A-G).
 * Handles: A, Am, F#m, Bm, D/F#, Cmaj7, G7, Esus4, etc.
 */
const ENGLISH_CHORD_TOKEN =
  /^[A-G][#b]?(?:m(?:aj7?|in|7)?|7|maj7|sus[24]|add(?:9|11)|dim|aug|\d+)?(?:\/[A-G][#b]?)?$/;

function isChordToken(token: string): boolean {
  return SPANISH_CHORD_TOKEN.test(token) || ENGLISH_CHORD_TOKEN.test(token);
}

/**
 * Returns true if every space-separated token on the line is a valid
 * chord token (Spanish or English), and the line is non-empty.
 */
export function isChordLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  const tokens = trimmed.split(/\s+/);
  return tokens.every((t) => isChordToken(t));
}

/**
 * Parse raw lyrics text into stanzas of blocks.
 *
 * The catalog uses two formats:
 *  A) Chord and lyric on consecutive lines, stanzas separated by blank lines
 *     "Sol Mim\n¡oh hijo!\n\nDo Re\nSi me amas..."
 *  B) Every line (chord AND lyric) is its own blank-line-separated paragraph
 *     "Sol Mim\n\n¡oh hijo!\n\nDo Re\n\nSi me amas..."
 *
 * Strategy: flatten all non-empty lines, then pair chord lines with the
 * immediately following lyric line. Group into stanzas by detecting
 * "section boundary" lines — non-chord lines that break a run of chord-pairs.
 */
export function parseLyrics(text: string): LyricStanza[] {
  if (!text?.trim()) return [];

  // Flatten: split by any newline(s), drop empty lines
  const lines = text
    .split(/\n+/)
    .map((l) => l.trimEnd())
    .filter((l) => l.trim().length > 0);

  if (lines.length === 0) return [];

  // Build a flat list of blocks by pairing chord+lyric
  const blocks: LyricBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? '';
    const nextLine: string | null = i + 1 < lines.length ? (lines[i + 1] ?? '') : null;

    if (isChordLine(line) && nextLine !== null && !isChordLine(nextLine)) {
      blocks.push({ chords: line.trim(), lyric: nextLine.trim() });
      i += 2;
    } else {
      blocks.push({ lyric: line.trim() });
      i++;
    }
  }

  if (blocks.length === 0) return [];

  // Group into stanzas: start a new stanza when a lyric-only block appears
  // between runs of chord-paired blocks (section headers, CORO, etc.)
  const stanzas: LyricStanza[] = [];
  let currentBlocks: LyricBlock[] = [];

  for (const block of blocks) {
    const isHeader = !block.chords && isSectionHeader(block.lyric);

    if (isHeader && currentBlocks.length > 0) {
      stanzas.push({ blocks: currentBlocks });
      currentBlocks = [block];
    } else {
      currentBlocks.push(block);
    }
  }

  if (currentBlocks.length > 0) {
    stanzas.push({ blocks: currentBlocks });
  }

  return stanzas;
}

/**
 * Heuristic: section headers like CORO, ESTROFA, INTRO, PUENTE, VERSO, BRIDGE
 * appear as short all-caps-ish lines or known Spanish section words.
 */
function isSectionHeader(line: string): boolean {
  const t = line.trim();
  if (t.length === 0 || t.length > 30) return false;
  const upper = t.toUpperCase();
  return (
    upper === t || // all caps line
    /^(CORO|ESTROFA|INTRO|PUENTE|VERSO|BRIDGE|CHORUS|VERSE|PRE-CORO|PRECORO)\b/i.test(t)
  );
}
