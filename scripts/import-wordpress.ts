#!/usr/bin/env -S npx tsx
/**
 * scripts/import-wordpress.ts
 *
 * ETL from `scripts/data/wordpress-export.xml` into the BahaiSongs Postgres
 * schema (Supabase). Idempotent. Designed to be re-run safely as the WP
 * export gets refreshed.
 *
 * Modes
 * -----
 *   --dry-run        Parse XML, produce a normalised JSON report, no DB writes.
 *                    Useful in CI / locally without any Supabase setup.
 *
 *   --no-audio       Skip downloading MP3s from canciones.bahai.es; only
 *                    upserts metadata and lyrics.
 *
 *   (default)        Full ETL: upserts artists, albums, tracks, lyrics,
 *                    track_sources, track_categories. Requires SUPABASE_URL +
 *                    SUPABASE_SERVICE_ROLE_KEY + R2_* env vars.
 *
 * Conservative choices
 * --------------------
 *   - Chord positions are NOT parsed from legacy HTML — `lyrics.has_chords`
 *     is set heuristically; `lyrics.body_chordpro` stays null until an admin
 *     authors the ChordPro version. See `scripts/lib/chord-detection.ts`.
 *   - Every track is attributed to a generic "Comunidad Bahá'í" artist; real
 *     attribution will come from later admin edits or future imports.
 */

import { parseArgs } from 'node:util';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseWordpressExport, type ParsedTrack } from './lib/wordpress-parser';

const XML_PATH = resolve(__dirname, 'data', 'wordpress-export.xml');
const DRY_RUN_OUT = resolve(__dirname, 'data', 'dry-run-output.json');

interface CliOpts {
  dryRun: boolean;
  noAudio: boolean;
  limit: number | undefined;
}

function parseCli(): CliOpts {
  const { values } = parseArgs({
    options: {
      'dry-run': { type: 'boolean', default: false },
      'no-audio': { type: 'boolean', default: false },
      limit: { type: 'string' },
    },
    allowPositionals: false,
  });
  return {
    dryRun: Boolean(values['dry-run']),
    noAudio: Boolean(values['no-audio']),
    limit: typeof values.limit === 'string' ? Number(values.limit) : undefined,
  };
}

interface Stats {
  total: number;
  withAudio: number;
  withChords: number;
  byLanguage: Record<string, number>;
  byCategory: Record<string, number>;
  unknownTaxonomies: Record<string, number>;
  duplicates: string[];
}

function buildStats(tracks: readonly ParsedTrack[]): Stats {
  const stats: Stats = {
    total: tracks.length,
    withAudio: 0,
    withChords: 0,
    byLanguage: {},
    byCategory: {},
    unknownTaxonomies: {},
    duplicates: [],
  };
  const seen = new Set<string>();

  for (const t of tracks) {
    if (t.enclosureUrl) stats.withAudio++;
    if (t.hasChords) stats.withChords++;
    stats.byLanguage[t.language] = (stats.byLanguage[t.language] ?? 0) + 1;
    for (const c of t.categorySlugs) {
      stats.byCategory[c] = (stats.byCategory[c] ?? 0) + 1;
    }
    if (seen.has(t.slug)) stats.duplicates.push(t.slug);
    seen.add(t.slug);
  }
  return stats;
}

function printStats(stats: Stats): void {
  const fmt = (obj: Record<string, number>) =>
    Object.entries(obj)
      .sort(([, a], [, b]) => b - a)
      .map(([k, v]) => `    ${k.padEnd(28)} ${v}`)
      .join('\n');

  console.log('');
  console.log('  ─── WordPress import report ───────────────────────────────');
  console.log(`  Total parsed tracks:   ${stats.total}`);
  console.log(`  With audio (MP3):      ${stats.withAudio}`);
  console.log(`  With chord hints:      ${stats.withChords}`);
  console.log('');
  console.log('  By language:');
  console.log(fmt(stats.byLanguage));
  console.log('');
  console.log('  By category:');
  console.log(fmt(stats.byCategory));

  if (stats.duplicates.length > 0) {
    console.log('');
    console.warn(`  ⚠ Duplicate slugs detected (${stats.duplicates.length}):`);
    for (const s of stats.duplicates.slice(0, 10)) console.warn(`    ${s}`);
  }
  console.log('');
}

async function main(): Promise<void> {
  const opts = parseCli();
  console.log(`Parsing ${XML_PATH} …`);
  let tracks = await parseWordpressExport(XML_PATH);
  if (opts.limit && opts.limit > 0) tracks = tracks.slice(0, opts.limit);

  const stats = buildStats(tracks);
  printStats(stats);

  if (opts.dryRun) {
    await writeFile(DRY_RUN_OUT, JSON.stringify({ stats, tracks }, null, 2), 'utf8');
    console.log(`Dry run complete → ${DRY_RUN_OUT}`);
    return;
  }

  // Real ETL pathway. Lazy-loaded so --dry-run does not require Supabase env.
  const { runEtl } = await import('./lib/run-etl');
  await runEtl(tracks, { noAudio: opts.noAudio });
}

main().catch((err: unknown) => {
  console.error('ETL failed:', err);
  process.exit(1);
});
