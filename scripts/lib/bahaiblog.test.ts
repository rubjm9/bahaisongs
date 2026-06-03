import { describe, expect, it } from 'vitest';
import {
  mapCategories,
  mapLanguage,
  normalizeTitle,
  parseYoutubeId,
  slugifyArtist,
  slugFromPageUrl,
  type BahaiblogRawEntry,
} from './bahaiblog';

describe('parseYoutubeId', () => {
  it('extracts v= param', () => {
    expect(parseYoutubeId('https://www.youtube.com/watch?v=g2IgWLCoQMA')).toBe('g2IgWLCoQMA');
  });

  it('returns null for invalid url', () => {
    expect(parseYoutubeId(null)).toBeNull();
    expect(parseYoutubeId('https://example.com')).toBeNull();
  });
});

describe('slugFromPageUrl', () => {
  it('uses last path segment', () => {
    expect(
      slugFromPageUrl(
        'https://www.bahaiblog.net/music/studio-session/o-son-of-earth-by-jonathon-bryan/',
      ),
    ).toBe('o-son-of-earth-by-jonathon-bryan');
  });
});

describe('slugifyArtist', () => {
  it('slugifies names with special chars', () => {
    expect(slugifyArtist("Priya Williams & Keivan Abtahi")).toBe('priya-williams-and-keivan-abtahi');
  });
});

describe('mapLanguage', () => {
  it('maps Spanish and Hungarian', () => {
    expect(mapLanguage('Spanish')).toBe('es');
    expect(mapLanguage('Hungarian')).toBe('hu');
    expect(mapLanguage('English, Hungarian')).toBe('en');
  });
});

describe('normalizeTitle', () => {
  it('strips quotes and by-artist suffix', () => {
    expect(normalizeTitle('"O Son of the Supreme" by Carsten Oostema', 'Carsten Oostema')).toBe(
      'O Son of the Supreme',
    );
  });

  it('extracts 2AM from hip-hop title', () => {
    expect(
      normalizeTitle(
        '2AM – Ashraf Rushdy ft. Karim Rushdy & Haifa – HIP HOP SESSIONS',
        'Ashraf Rushdy ft. Karim Rushdy & Haifa',
      ),
    ).toBe('2AM');
  });
});

describe('mapCategories', () => {
  const base: BahaiblogRawEntry = {
    titulo: 'Test',
    artista: 'Artist',
    youtube_url: 'https://www.youtube.com/watch?v=abcdefghijk',
    letra: null,
    acordes: null,
    categoria: 'Hip Hop Session',
    estilo: 'Hip Hop',
    idioma: 'English',
    fuente: "Baha'u'llah",
    url_pagina: 'https://www.bahaiblog.net/music/hip-hop-session/test/',
  };

  it('includes core, fuente, estilo and bahaiblog tags', () => {
    const cats = mapCategories(base);
    expect(cats).toContain('cancion');
    expect(cats).toContain('con-audio');
    expect(cats).toContain('bahaullah');
    expect(cats).toContain('muy-ritmica');
    expect(cats).toContain('bahaiblog-hip-hop');
  });
});
