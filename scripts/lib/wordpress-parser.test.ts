import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseWordpressExport } from './wordpress-parser';

const XML_PATH = resolve(process.cwd(), 'scripts/data/wordpress-export.xml');

describe('parseWordpressExport — real WP export', () => {
  it('parses at least 130 tracks (the export has 140 posts, some draft)', async () => {
    const tracks = await parseWordpressExport(XML_PATH);
    expect(tracks.length).toBeGreaterThanOrEqual(130);
  }, 30_000);

  it('every parsed track has a non-empty title and slug', async () => {
    const tracks = await parseWordpressExport(XML_PATH);
    for (const t of tracks) {
      expect(t.title.length).toBeGreaterThan(0);
      expect(t.slug.length).toBeGreaterThan(0);
    }
  }, 30_000);

  it('finds enclosure MP3 URLs on the majority of tracks (≥ 60)', async () => {
    const tracks = await parseWordpressExport(XML_PATH);
    const withAudio = tracks.filter((t) => t.enclosureUrl?.endsWith('.mp3'));
    expect(withAudio.length).toBeGreaterThanOrEqual(60);
  }, 30_000);

  it('flags chord availability on the majority of tagged tracks', async () => {
    const tracks = await parseWordpressExport(XML_PATH);
    const withChords = tracks.filter((t) => t.hasChords);
    // The `con-acordes` WP tag is the authoritative signal. The export has
    // ~70 such tracks; the prose heuristic adds a few more not tagged.
    expect(withChords.length).toBeGreaterThanOrEqual(60);
  }, 30_000);

  it('classifies the majority of tracks as Spanish', async () => {
    const tracks = await parseWordpressExport(XML_PATH);
    const es = tracks.filter((t) => t.language === 'es').length;
    expect(es / tracks.length).toBeGreaterThan(0.8);
  }, 30_000);
});
