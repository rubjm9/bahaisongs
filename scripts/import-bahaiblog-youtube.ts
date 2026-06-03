#!/usr/bin/env -S npx tsx
/**
 * Import Baha'i Blog YouTube batch from scripts/data/bahaiblog-youtube.json
 *
 *   --dry-run   Validate payload and print summary (no DB writes)
 *   (default)   Upsert into Supabase (requires service role key)
 */

import { parseArgs } from 'node:util';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { BahaiblogNormalizedTrack } from './lib/bahaiblog';

const DATA_PATH = resolve(__dirname, 'data', 'bahaiblog-youtube.json');

interface Payload {
  tracks: BahaiblogNormalizedTrack[];
  skipped?: { titulo: string; reason: string }[];
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: { 'dry-run': { type: 'boolean', default: false } },
  });
  const dryRun = values['dry-run'] ?? false;

  const payload = JSON.parse(readFileSync(DATA_PATH, 'utf8')) as Payload;
  const tracks = payload.tracks ?? [];

  console.log(`Loaded ${tracks.length} tracks from ${DATA_PATH}`);
  if (payload.skipped?.length) {
    console.warn('Skipped at normalize time:', payload.skipped);
  }

  const summary = tracks.map((t) => ({
    slug: t.slug,
    title: t.title,
    artist: t.artistName,
    youtubeId: t.youtubeId,
    language: t.language,
    categories: t.categorySlugs.length,
    hasLyrics: Boolean(t.lyricsPlain),
  }));
  console.table(summary);

  if (dryRun) {
    console.log('\nDry run — no database writes.');
    return;
  }

  const { runBahaiblogEtl } = await import('./lib/run-bahaiblog-etl');
  await runBahaiblogEtl(tracks);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
