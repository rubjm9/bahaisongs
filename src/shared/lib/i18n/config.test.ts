import { describe, expect, it } from 'vitest';
import {
  defaultLocale,
  isRtlLocale,
  localeDirection,
  localeLabels,
  locales,
} from './config';
import { languagesAlternates } from '@/shared/lib/seo/hreflang';

describe('i18n config', () => {
  it('includes eight locales with Spanish as default', () => {
    expect(locales).toEqual(['es', 'en', 'fr', 'de', 'pt', 'ru', 'ar', 'fa']);
    expect(defaultLocale).toBe('es');
  });

  it('exposes native labels for every locale', () => {
    for (const locale of locales) {
      expect(localeLabels[locale].length).toBeGreaterThan(0);
    }
  });

  it('marks Arabic and Farsi as RTL', () => {
    expect(isRtlLocale('ar')).toBe(true);
    expect(isRtlLocale('fa')).toBe(true);
    expect(isRtlLocale('es')).toBe(false);
    expect(localeDirection('ar')).toBe('rtl');
    expect(localeDirection('en')).toBe('ltr');
  });
});

describe('languagesAlternates', () => {
  it('maps every locale to a canonical absolute URL', () => {
    const map = languagesAlternates('library');
    expect(map.es).toBe('https://bahaisongs.org/library');
    expect(map.en).toBe('https://bahaisongs.org/en/library');
    expect(map.fr).toBe('https://bahaisongs.org/fr/library');
    expect(map.ar).toBe('https://bahaisongs.org/ar/library');
    expect(Object.keys(map)).toHaveLength(locales.length);
  });

  it('omits prefix for home on default locale', () => {
    const map = languagesAlternates();
    expect(map.es).toBe('https://bahaisongs.org/');
    expect(map.de).toBe('https://bahaisongs.org/de');
  });
});
