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

// ─── ChordPro inline parser ────────────────────────────────────────────────

/**
 * Detect whether a string uses ChordPro inline format ([Am]text).
 * Used to auto-select the correct parser.
 */
export function isChordProFormat(text: string): boolean {
  return /\[[A-G][^\]]{0,10}\]|\[(?:Do|Re|Mi|Fa|Sol|La|Si)[^\]]{0,10}\]/i.test(text);
}

/**
 * Parse a single ChordPro line like "[G]Amazing [C]grace how [G]sweet"
 * into a LyricBlock with a space-separated chord string and plain lyric text.
 *
 * ChordPro directives ({title: …}, {start_of_chorus}, etc.) are treated as
 * section headers so the viewer can render them as such.
 */
function parseChordProLine(line: string): LyricBlock {
  // Directives: {title: …}, {start_of_chorus}, {comment: …}, etc.
  const directiveRe = /^\{([^:}]+)(?::\s*([^}]*))?\}/;
  const directive = directiveRe.exec(line);
  if (directive) {
    const name = directive[1]?.trim().toLowerCase() ?? '';
    const value = directive[2]?.trim() ?? '';
    if (name === 'title' || name === 't') return { lyric: value };
    if (name === 'comment' || name === 'c') return { lyric: value };
    if (name.startsWith('start_of_') || name.startsWith('end_of_')) {
      const sectionName = (name.startsWith('start_of_') ? name.slice(9) : name.slice(7)).toUpperCase();
      return { lyric: value || sectionName };
    }
    // Other directives (subtitle, artist, key, tempo, etc.) — skip silently
    return { lyric: '' };
  }

  if (!line.trim()) return { lyric: '' };

  // Scan for [chord] tokens inline
  const chords: string[] = [];
  const lyricParts: string[] = [];

  let rest = line;
  while (rest.length > 0) {
    const bracketIdx = rest.indexOf('[');
    if (bracketIdx === -1) {
      lyricParts.push(rest);
      break;
    }
    // Text before the bracket
    if (bracketIdx > 0) lyricParts.push(rest.slice(0, bracketIdx));

    const closeIdx = rest.indexOf(']', bracketIdx);
    if (closeIdx === -1) {
      // Malformed — treat remaining as lyric
      lyricParts.push(rest);
      break;
    }
    chords.push(rest.slice(bracketIdx + 1, closeIdx));
    rest = rest.slice(closeIdx + 1);
  }

  const lyric = lyricParts.join('').trimEnd();
  const chordLine = chords.length > 0 ? chords.join(' ') : undefined;

  return chordLine !== undefined ? { chords: chordLine, lyric } : { lyric };
}

/**
 * Parse a ChordPro-formatted song into stanzas of LyricBlocks.
 *
 * Blank lines separate stanzas; directives are turned into section headers.
 */
export function parseChordProLyrics(text: string): LyricStanza[] {
  if (!text?.trim()) return [];

  const rawLines = text.split('\n');
  const stanzas: LyricStanza[] = [];
  let currentBlocks: LyricBlock[] = [];

  for (const raw of rawLines) {
    const line = raw.trimEnd();

    if (!line.trim()) {
      // Blank line — flush stanza
      if (currentBlocks.length > 0) {
        stanzas.push({ blocks: currentBlocks });
        currentBlocks = [];
      }
      continue;
    }

    const block = parseChordProLine(line);

    // Skip silent directives
    if (block.lyric === '' && !block.chords) continue;

    // Section headers split stanzas
    if (!block.chords && isSectionHeader(block.lyric)) {
      if (currentBlocks.length > 0) stanzas.push({ blocks: currentBlocks });
      currentBlocks = [block];
      continue;
    }

    currentBlocks.push(block);
  }

  if (currentBlocks.length > 0) stanzas.push({ blocks: currentBlocks });
  return stanzas;
}
