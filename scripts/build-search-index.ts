#!/usr/bin/env -S npx tsx
/**
 * scripts/build-search-index.ts
 *
 * Parses the WordPress export and emits a compact JSON catalogue at
 * `src/data/search-index.json`. The Next.js app dynamically imports this file
 * to power instant client-side search until Supabase is connected (Phase 3+).
 *
 * Shape of each entry:
 *   { slug, title, artist, language, hasChords, hasAudio, categorySlugs, snippet }
 *
 * `snippet` is the first ~140 characters of the plain lyrics — enough for the
 * search dropdown preview without bloating the bundle. Full lyrics live in the
 * dry-run output (and later in Postgres).
 */

import { resolve } from 'node:path';
import { writeFile } from 'node:fs/promises';
import { parseWordpressExport } from './lib/wordpress-parser';
import { normalizeForSearch } from '../src/features/catalog/lib/normalize';

const XML_PATH = resolve(__dirname, 'data', 'wordpress-export.xml');
const SEARCH_OUT = resolve(__dirname, '..', 'src', 'data', 'search-index.json');
const CATALOG_OUT = resolve(__dirname, '..', 'src', 'data', 'catalog.json');

const DEFAULT_ARTIST_SLUG = 'comunidad-bahai';
const DEFAULT_ARTIST = "Comunidad Bahá'í";

interface SearchEntry {
  slug: string;
  title: string;
  artist: string;
  language: 'es' | 'en' | 'pt';
  hasChords: boolean;
  hasAudio: boolean;
  categorySlugs: string[];
  snippet: string;
  /** Diacritic- and apostrophe-stripped form of title + artist + snippet. */
  searchKey: string;
}

/** Full catalogue record — server-only, used by RSC pages. */
interface CatalogTrack {
  slug: string;
  title: string;
  artistSlug: string;
  artist: string;
  language: 'es' | 'en' | 'pt';
  hasChords: boolean;
  hasAudio: boolean;
  categorySlugs: string[];
  snippet: string;
  /** Full plain-text lyrics, line-broken. */
  lyrics: string;
  /** Original WordPress MP3 URL — populated only when present in the export. */
  legacyAudioUrl?: string;
  /** ISO date string. */
  publishedAt?: string;
}

function buildSnippet(plain: string, max = 140): string {
  if (!plain) return '';
  const flat = plain.replace(/\s+/g, ' ').trim();
  if (flat.length <= max) return flat;
  return `${flat.slice(0, max).trimEnd()}…`;
}

async function main(): Promise<void> {
  console.log(`Parsing ${XML_PATH} …`);
  const tracks = await parseWordpressExport(XML_PATH);
  const published = tracks.filter((t) => t.status === 'publish' || t.status === 'pending');

  const catalog: CatalogTrack[] = published
    .map((t) => {
      const snippet = buildSnippet(t.lyricsPlain);
      const entry: CatalogTrack = {
        slug: t.slug,
        title: t.title,
        artistSlug: DEFAULT_ARTIST_SLUG,
        artist: DEFAULT_ARTIST,
        language: t.language,
        hasChords: t.hasChords,
        hasAudio: Boolean(t.enclosureUrl),
        categorySlugs: t.categorySlugs,
        snippet,
        lyrics: t.lyricsPlain,
      };
      if (t.enclosureUrl) {
        // Rewrite legacy http:// URLs to https:// so the audio loads under
        // a secure-context origin (mixed-content blocking otherwise). The
        // legacy host typically serves both schemes; when Supabase + R2
        // land, this field is replaced by the R2 object key.
        entry.legacyAudioUrl = t.enclosureUrl.replace(/^http:\/\//i, 'https://');
      }
      if (t.publishedAt) entry.publishedAt = t.publishedAt;
      return entry;
    })
    .sort((a, b) => a.title.localeCompare(b.title, 'es'));

  const entries: SearchEntry[] = catalog.map((t) => ({
    slug: t.slug,
    title: t.title,
    artist: t.artist,
    language: t.language,
    hasChords: t.hasChords,
    hasAudio: t.hasAudio,
    categorySlugs: t.categorySlugs,
    snippet: t.snippet,
    searchKey: normalizeForSearch(
      `${t.title} ${t.artist} ${t.snippet} ${t.categorySlugs.join(' ')}`,
    ),
  }));

  await writeFile(SEARCH_OUT, JSON.stringify(entries, null, 2), 'utf8');
  await writeFile(CATALOG_OUT, JSON.stringify(catalog, null, 2), 'utf8');
  console.log(`Wrote ${entries.length} entries → ${SEARCH_OUT}`);
  console.log(`Wrote ${catalog.length} full records → ${CATALOG_OUT}`);
}

main().catch((err: unknown) => {
  console.error('Build failed:', err);
  process.exit(1);
});
