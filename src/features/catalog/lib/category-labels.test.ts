import { describe, expect, it } from 'vitest';
import { categoryKind, categoryLabel, knownCategorySlugs } from './category-labels';

describe('category labels', () => {
  it('returns Spanish labels by default', () => {
    expect(categoryLabel('oracion', 'es')).toBe('Oraciones');
    expect(categoryLabel('tranquila', 'es')).toBe('Tranquila');
    expect(categoryLabel('con-acordes', 'es')).toBe('Con acordes');
  });

  it('returns English labels', () => {
    expect(categoryLabel('oracion', 'en')).toBe('Prayers');
    expect(categoryLabel('tranquila', 'en')).toBe('Calm');
  });

  it('falls back to a titlecased slug for unknown categories', () => {
    expect(categoryLabel('un-known-thing', 'es')).toBe('Un Known Thing');
  });

  it('exposes a kind for every known slug', () => {
    for (const slug of knownCategorySlugs()) {
      expect(['genre', 'mood', 'theme', 'tag']).toContain(categoryKind(slug));
    }
  });
});
