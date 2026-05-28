import { describe, expect, it } from 'vitest';
import { SearchEngine, type SearchEntry } from './search-engine';
import { normalizeForSearch } from './normalize';

function make(partial: Omit<SearchEntry, 'searchKey'>): SearchEntry {
  return {
    ...partial,
    searchKey: normalizeForSearch(
      `${partial.title} ${partial.artist} ${partial.snippet} ${partial.categorySlugs.join(' ')}`,
    ),
  };
}

const fixture: SearchEntry[] = [
  make({
    slug: 'mi-meta-es-servir',
    title: 'Mi meta es servir',
    artist: "Comunidad Bahá'í",
    language: 'es',
    hasChords: true,
    hasAudio: true,
    categorySlugs: ['cancion', 'con-audio', 'con-acordes'],
    snippet: 'Mientras pienso en mi futuro por venir mis talentos sé que debo descubrir',
  }),
  make({
    slug: 'bahaullah-arde-mi-anhelo-por-ti',
    title: "Bahá'u'lláh, arde mi anhelo por ti",
    artist: "Comunidad Bahá'í",
    language: 'es',
    hasChords: false,
    hasAudio: true,
    categorySlugs: ['cancion', 'con-audio'],
    snippet: 'Nacido para ser un gran señor pudiste conocer la dicha en tu juventud',
  }),
  make({
    slug: 'oh-dios-guiame',
    title: '¡Oh Dios! Guíame',
    artist: "Comunidad Bahá'í",
    language: 'es',
    hasChords: false,
    hasAudio: false,
    categorySlugs: ['oracion', 'tranquila'],
    snippet: 'Oh Dios guíame protégeme ilumina la lámpara de mi corazón',
  }),
  make({
    slug: 'sacrifice-of-self',
    title: 'Sacrifice of Self',
    artist: 'Anonymous',
    language: 'en',
    hasChords: true,
    hasAudio: false,
    categorySlugs: ['cancion'],
    snippet: 'I will sacrifice for you my Lord',
  }),
];

describe('SearchEngine', () => {
  const engine = new SearchEngine(fixture);

  it('returns all entries for an empty query', () => {
    const results = engine.search('');
    expect(results).toHaveLength(fixture.length);
  });

  it('matches by title with a single keystroke', () => {
    const results = engine.search('Mi');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.entry.slug).toBe('mi-meta-es-servir');
  });

  it('matches by lyric snippet', () => {
    const results = engine.search('descubrir');
    expect(results.some((r) => r.entry.slug === 'mi-meta-es-servir')).toBe(true);
  });

  it('returns Fuse match indices for highlight rendering', () => {
    const results = engine.search('servir');
    const top = results[0];
    expect(top).toBeDefined();
    const titleRanges = top?.matches.get('title');
    expect(titleRanges?.length).toBeGreaterThan(0);
  });

  it('matches diacritic-stripped queries via searchKey', () => {
    // "Bahaullah" (no apostrophes, no acute) finds the canonical entry.
    const results = engine.search('Bahaullah');
    expect(results.some((r) => r.entry.slug === 'bahaullah-arde-mi-anhelo-por-ti')).toBe(true);
  });

  it('matches diacritic-stripped Spanish words like "guiame" → "Guíame"', () => {
    const results = engine.search('guiame');
    expect(results[0]?.entry.slug).toBe('oh-dios-guiame');
  });

  it('applies the language filter without query', () => {
    const results = engine.search('', { language: 'en' });
    expect(results).toHaveLength(1);
    expect(results[0]?.entry.language).toBe('en');
  });

  it('applies the hasChords filter on a query', () => {
    const results = engine.search('servir', { hasChords: true });
    expect(results.every((r) => r.entry.hasChords)).toBe(true);
  });

  it('applies multi-category AND filter', () => {
    const results = engine.search('', {
      categorySlugs: ['cancion', 'con-acordes'],
    });
    for (const r of results) {
      expect(r.entry.categorySlugs).toContain('cancion');
      expect(r.entry.categorySlugs).toContain('con-acordes');
    }
  });

  it('honours the limit parameter', () => {
    const results = engine.search('', {}, 2);
    expect(results).toHaveLength(2);
  });

  it('returns no results when filters exclude everything', () => {
    const results = engine.search('servir', { language: 'pt' });
    expect(results).toHaveLength(0);
  });
});
