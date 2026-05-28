import { describe, expect, it } from 'vitest';
import {
  getAllTracks,
  getTrackBySlug,
  getTracksByArtist,
  getTracksByCategory,
  getRecentTracks,
  getTracksByLanguage,
  getTrackNeighbours,
  getActiveCategorySlugs,
} from './catalog';

describe('catalog server loader', () => {
  it('exposes 140 published tracks', async () => {
    expect(await getAllTracks()).toHaveLength(140);
  });

  it('returns a known track by slug', async () => {
    const track = await getTrackBySlug('mi-meta-es-servir');
    expect(track).not.toBeNull();
    expect(track?.title).toBe('Mi meta es servir');
    expect(track?.artistSlug).toBe('comunidad-bahai');
  });

  it('returns null for an unknown slug', async () => {
    expect(await getTrackBySlug('definitely-not-a-real-slug')).toBeNull();
  });

  it('groups every track under the default artist', async () => {
    const tracks = await getTracksByArtist('comunidad-bahai');
    const all = await getAllTracks();
    expect(tracks.length).toBe(all.length);
  });

  it('filters by category', async () => {
    const prayers = await getTracksByCategory('oracion');
    expect(prayers.length).toBeGreaterThan(0);
    for (const t of prayers) {
      expect(t.categorySlugs).toContain('oracion');
    }
  });

  it('returns most-recent tracks first', async () => {
    const recent = await getRecentTracks(5);
    expect(recent).toHaveLength(5);
    for (let i = 1; i < recent.length; i++) {
      const a = recent[i - 1]?.publishedAt ?? '';
      const b = recent[i]?.publishedAt ?? '';
      expect(a >= b).toBe(true);
    }
  });

  it('filters by language', async () => {
    const en = await getTracksByLanguage('en');
    expect(en.every((t) => t.language === 'en')).toBe(true);
  });

  it('returns valid prev/next neighbours', async () => {
    const { prev, next } = await getTrackNeighbours('mi-meta-es-servir');
    expect(prev ?? next).not.toBeNull();
  });

  it('exposes active category slugs sorted', async () => {
    const slugs = await getActiveCategorySlugs();
    const sorted = [...slugs].sort();
    expect(slugs).toEqual(sorted);
    expect(slugs).toContain('cancion');
    expect(slugs).toContain('oracion');
  });
});
