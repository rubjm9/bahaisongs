#!/usr/bin/env -S npx tsx
/**
 * Build scripts/data/bahaiblog-youtube.json from manifest + optional lyric files.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import {
  normalizeBatch,
  type BahaiblogRawEntry,
  type BahaiblogNormalizedTrack,
} from './lib/bahaiblog';

const DATA_DIR = resolve(__dirname, 'data');
const MANIFEST_PATH = join(DATA_DIR, 'bahaiblog-manifest.json');
const LYRICS_DIR = join(DATA_DIR, 'bahaiblog-lyrics');
const OUT_PATH = join(DATA_DIR, 'bahaiblog-youtube.json');
const DRY_RUN_OUT = join(DATA_DIR, 'bahaiblog-youtube-dry-run.json');

interface ManifestRow {
  titulo: string;
  artista: string;
  youtube_url: string;
  letraFile?: string;
  acordesFile?: string;
  categoria: string;
  estilo: string;
  idioma: string;
  fuente: string | null;
  url_pagina: string;
}

function readOptionalFile(name: string | undefined): string | null {
  if (!name) return null;
  const path = join(LYRICS_DIR, name);
  if (!existsSync(path)) return null;
  return readFileSync(path, 'utf8').trim() || null;
}

function manifestToRaw(rows: ManifestRow[]): BahaiblogRawEntry[] {
  return rows.map((row) => ({
    titulo: row.titulo,
    artista: row.artista,
    youtube_url: row.youtube_url,
    letra: readOptionalFile(row.letraFile),
    acordes: readOptionalFile(row.acordesFile),
    categoria: row.categoria,
    estilo: row.estilo,
    idioma: row.idioma,
    fuente: row.fuente,
    url_pagina: row.url_pagina,
  }));
}

function main(): void {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as ManifestRow[];
  const raw = manifestToRaw(manifest);
  const { tracks, skipped } = normalizeBatch(raw);

  const missingLyrics = manifest.filter(
    (m) => m.letraFile && !existsSync(join(LYRICS_DIR, m.letraFile)),
  );
  if (missingLyrics.length > 0) {
    console.warn(
      'Missing lyric files:',
      missingLyrics.map((m) => m.letraFile).join(', '),
    );
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    trackCount: tracks.length,
    skipped,
    tracks,
  };

  writeFileSync(OUT_PATH, `${JSON.stringify(payload, null, 2)}\n`);
  writeFileSync(DRY_RUN_OUT, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`Wrote ${tracks.length} tracks → ${OUT_PATH}`);
  if (skipped.length) console.warn('Skipped:', skipped);
}

main();
