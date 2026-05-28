import { describe, expect, it } from 'vitest';
import { aggregateCategories, mapWpTaxonomy } from './category-mapping';

describe('mapWpTaxonomy', () => {
  it('maps known WP categories', () => {
    expect(mapWpTaxonomy('canciones-espanol')).toEqual({ slug: 'cancion', language: 'es' });
    expect(mapWpTaxonomy('english')).toEqual({ slug: 'cancion', language: 'en' });
    expect(mapWpTaxonomy('oraciones')).toEqual({ slug: 'oracion' });
  });

  it('maps known WP tags', () => {
    expect(mapWpTaxonomy('con-acordes')).toEqual({ slug: 'con-acordes' });
    expect(mapWpTaxonomy('tranquila')).toEqual({ slug: 'tranquila' });
    expect(mapWpTaxonomy('texto-sagrado')).toEqual({ slug: 'texto-sagrado' });
  });

  it('returns null for unknown taxonomies', () => {
    expect(mapWpTaxonomy('press')).toBeNull();
    expect(mapWpTaxonomy('uncategorized')).toBeNull();
    expect(mapWpTaxonomy('garbage')).toBeNull();
  });

  it('is case-insensitive', () => {
    expect(mapWpTaxonomy('Canciones-Espanol')).toEqual({ slug: 'cancion', language: 'es' });
  });
});

describe('aggregateCategories', () => {
  it('aggregates unique slugs and infers Spanish from canciones-espanol', () => {
    const { categorySlugs, language } = aggregateCategories([
      'canciones-espanol',
      'con-audio',
      'con-acordes',
      'press', // unknown — dropped
      'canciones', // also maps to cancion → deduped
    ]);
    expect(language).toBe('es');
    expect(new Set(categorySlugs)).toEqual(new Set(['cancion', 'con-audio', 'con-acordes']));
  });

  it('infers English from the english tag', () => {
    const { language } = aggregateCategories(['english', 'con-audio']);
    expect(language).toBe('en');
  });

  it('returns no language when no mapping carries one', () => {
    const { language } = aggregateCategories(['con-audio', 'tranquila']);
    expect(language).toBeUndefined();
  });
});
