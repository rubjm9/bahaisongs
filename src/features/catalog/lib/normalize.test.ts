import { describe, expect, it } from 'vitest';
import { normalizeForSearch } from './normalize';

describe('normalizeForSearch', () => {
  it('strips Spanish diacritics', () => {
    expect(normalizeForSearch('Guíame')).toBe('guiame');
    expect(normalizeForSearch('Música y Oración')).toBe('musica y oracion');
    expect(normalizeForSearch('¿Cómo está usted?')).toBe('¿como esta usted?');
  });

  it('strips ASCII and typographic apostrophes', () => {
    expect(normalizeForSearch("Bahá'u'lláh")).toBe('bahaullah');
    expect(normalizeForSearch('‘Abdu’l-Bahá')).toBe('abdul-baha');
    expect(normalizeForSearch("d'amour")).toBe('damour');
  });

  it('lowercases everything', () => {
    expect(normalizeForSearch('Sí')).toBe('si');
    expect(normalizeForSearch('LÁZARO')).toBe('lazaro');
  });

  it('preserves spaces and inner punctuation other than apostrophes', () => {
    expect(normalizeForSearch('Hola, mundo — adiós.')).toBe('hola, mundo — adios.');
  });

  it('is idempotent', () => {
    const once = normalizeForSearch("Bahá'u'lláh");
    expect(normalizeForSearch(once)).toBe(once);
  });
});
