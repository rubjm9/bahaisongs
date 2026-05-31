#!/usr/bin/env -S npx tsx
/**
 * scripts/migrate-to-chordpro.ts
 *
 * One-shot ETL: converts legacy "chords-over-lyrics" body_plain format
 * to ChordPro inline format ([Am]letra) and writes it to lyrics.body_chordpro.
 *
 * Only processes rows where body_chordpro IS NULL and has_chords IS TRUE.
 *
 * Usage:
 *   npx tsx scripts/migrate-to-chordpro.ts              # dry-run (no DB writes)
 *   npx tsx scripts/migrate-to-chordpro.ts --apply      # write to Supabase
 *   npx tsx scripts/migrate-to-chordpro.ts --sample 15  # show N samples (dry-run)
 *
 * Requirements:
 *   NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

// Load .env.local manually (tsx does not auto-load it)
try {
  const envPath = resolve(__dirname, '..', '.env.local');
  const envContent = readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key) process.env[key] = value;
  }
} catch {
  // .env.local not found — rely on existing environment variables
}

// ─── Args ────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const DRY_RUN = !args.includes('--apply');
const SAMPLE_SIZE = (() => {
  const idx = args.indexOf('--sample');
  if (idx !== -1) return parseInt(args[idx + 1] ?? '10', 10);
  return DRY_RUN ? 10 : Infinity;
})();

// ─── Supabase client ─────────────────────────────────────────────────────────

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    '❌  Missing Supabase credentials in .env.local.\n' +
      '    Required: NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY',
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

// ─── Chord-line detection (mirrors chordParser.ts) ───────────────────────────

const SPANISH_CHORD_TOKEN =
  /^(?:Sol|Do|Re|Mi|Fa|La|Si)(?:[#b]?)(?:m(?:aj7?|in|7)?|7|maj7|sus[24]|add(?:9|11)|dim|aug|\d+)?(?:\/(?:Sol|Do|Re|Mi|Fa|La|Si)[#b]?)?$/i;

const ENGLISH_CHORD_TOKEN =
  /^[A-G][#b]?(?:m(?:aj7?|in|7)?|7|maj7|sus[24]|add(?:9|11)|dim|aug|\d+)?(?:\/[A-G][#b]?)?$/;

function isChordToken(token: string): boolean {
  return SPANISH_CHORD_TOKEN.test(token) || ENGLISH_CHORD_TOKEN.test(token);
}

function isChordLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  return trimmed.split(/\s+/).every((t) => isChordToken(t));
}

// ─── Converter ───────────────────────────────────────────────────────────────

/**
 * Convert dual-line chord-over-lyric format to ChordPro inline.
 *
 * Input:
 *   Sol  Mim
 *   ¡oh hijo!
 *
 * Output:
 *   [Sol]¡oh [Mim]hijo!
 *
 * Strategy: match each chord token's column position to the lyric text below.
 * When the lyric is shorter than the chord line, append remaining chords at end.
 */
function dualLineToChordPro(chordLine: string, lyricLine: string): string {
  // Parse chord tokens with their column positions
  const tokens: { chord: string; col: number }[] = [];
  const chordRe = /\S+/g;
  let m: RegExpExecArray | null;
  while ((m = chordRe.exec(chordLine)) !== null) {
    tokens.push({ chord: m[0]!, col: m.index });
  }

  if (tokens.length === 0) return lyricLine;

  let result = '';
  let lyricIdx = 0;

  for (let i = 0; i < tokens.length; i++) {
    const { chord, col } = tokens[i]!;
    const nextCol = i + 1 < tokens.length ? tokens[i + 1]!.col : Infinity;

    // Insert text from lyricIdx up to this chord's column
    const textEnd = Math.min(col, lyricLine.length);
    if (textEnd > lyricIdx) {
      result += lyricLine.slice(lyricIdx, textEnd);
      lyricIdx = textEnd;
    }

    result += `[${chord}]`;

    // Advance lyric index to next chord column (or end)
    const advanceTo = Math.min(nextCol, lyricLine.length);
    if (advanceTo > lyricIdx) {
      result += lyricLine.slice(lyricIdx, advanceTo);
      lyricIdx = advanceTo;
    }
  }

  // Remaining lyric text after all chords
  if (lyricIdx < lyricLine.length) {
    result += lyricLine.slice(lyricIdx);
  }

  return result.trimEnd();
}

/**
 * Convert a full body_plain (legacy format) to ChordPro inline text.
 * Returns null when the text has no chord lines (pure lyrics → skip).
 */
function convertToChordPro(bodyPlain: string): string | null {
  const lines = bodyPlain.split('\n').map((l) => l.trimEnd());

  let hasAnyChords = false;
  const outputLines: string[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? '';
    const next = lines[i + 1] ?? null;

    if (isChordLine(line) && next !== null && !isChordLine(next)) {
      hasAnyChords = true;
      outputLines.push(dualLineToChordPro(line, next));
      i += 2;
    } else {
      outputLines.push(line);
      i++;
    }
  }

  if (!hasAnyChords) return null;

  return outputLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

// ─── Main ────────────────────────────────────────────────────────────────────

interface LyricsRow {
  id: string;
  track_id: string;
  locale: string;
  body_plain: string | null;
  body_chordpro: string | null;
  has_chords: boolean;
}

async function main() {
  console.log(`\n🎸 ChordPro migration — ${DRY_RUN ? 'DRY RUN (no writes)' : 'APPLY MODE'}\n`);

  const { data, error } = await supabase
    .from('lyrics')
    .select('id, track_id, locale, body_plain, body_chordpro, has_chords')
    .is('body_chordpro', null)
    .eq('has_chords', true)
    .not('body_plain', 'is', null);

  if (error) {
    console.error('❌  Supabase query failed:', error.message);
    process.exit(1);
  }

  const rows = (data ?? []) as LyricsRow[];
  console.log(`Found ${rows.length} lyrics rows to process (has_chords=true, body_chordpro=null)\n`);

  if (rows.length === 0) {
    console.log('✅  Nothing to migrate.');
    return;
  }

  let converted = 0;
  let skipped = 0;
  let failed = 0;
  const sample: { track_id: string; locale: string; before: string; after: string }[] = [];

  for (const row of rows) {
    if (!row.body_plain?.trim()) {
      skipped++;
      continue;
    }

    let chordPro: string | null;
    try {
      chordPro = convertToChordPro(row.body_plain);
    } catch (err) {
      console.error(`❌  Convert failed for id=${row.id}:`, err);
      failed++;
      continue;
    }

    if (!chordPro) {
      skipped++;
      continue;
    }

    converted++;

    if (sample.length < SAMPLE_SIZE) {
      sample.push({
        track_id: row.track_id,
        locale: row.locale,
        before: row.body_plain.split('\n').slice(0, 6).join('\n'),
        after: chordPro.split('\n').slice(0, 6).join('\n'),
      });
    }

    if (!DRY_RUN) {
      const { error: updateErr } = await supabase
        .from('lyrics')
        .update({ body_chordpro: chordPro })
        .eq('id', row.id);
      if (updateErr) {
        console.error(`❌  Update failed for id=${row.id}:`, updateErr.message);
        failed++;
      }
    }
  }

  // ─── Sample preview ─────────────────────────────────────────────────────

  console.log(`\n── Sample preview (first ${sample.length}) ──────────────────────\n`);
  for (const s of sample) {
    console.log(`Track ${s.track_id} [${s.locale}]`);
    console.log('  BEFORE:');
    s.before.split('\n').forEach((l) => console.log(`    ${l}`));
    console.log('  AFTER (ChordPro):');
    s.after.split('\n').forEach((l) => console.log(`    ${l}`));
    console.log();
  }

  // ─── Summary ────────────────────────────────────────────────────────────

  console.log('── Summary ─────────────────────────────────────────────────────\n');
  console.log(`  Rows processed : ${rows.length}`);
  console.log(`  Converted      : ${converted}`);
  console.log(`  Skipped        : ${skipped} (no chord lines detected)`);
  console.log(`  Failed         : ${failed}`);
  if (DRY_RUN) {
    console.log('\n  ℹ️  DRY RUN — no changes written to the database.');
    console.log('  Run with --apply to apply the migration.\n');
  } else {
    console.log(`\n  ✅  ${converted - failed} rows updated in Supabase.\n`);
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
