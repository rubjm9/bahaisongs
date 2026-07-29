import { describe, expect, it } from 'vitest';
import { appPath, isAppPathActive, trackCanonicalUrl, trackPath } from './paths';

describe('seo paths', () => {
  it('trackPath is flat', () => {
    expect(trackPath('halcon-real')).toBe('/halcon-real');
  });

  it('trackCanonicalUrl uses production origin', () => {
    expect(trackCanonicalUrl('halcon-real')).toBe('https://bahaisongs.org/halcon-real');
  });

  it('appPath omits locale prefix for default locale', () => {
    expect(appPath('es')).toBe('/');
    expect(appPath('es', 'library')).toBe('/library');
    expect(appPath('es', 'category/cancion')).toBe('/category/cancion');
  });

  it('appPath prefixes non-default locale', () => {
    expect(appPath('en')).toBe('/en');
    expect(appPath('en', 'library')).toBe('/en/library');
    expect(appPath('fr', 'discover')).toBe('/fr/discover');
    expect(appPath('ar', 'library')).toBe('/ar/library');
    expect(appPath('zh', 'library')).toBe('/zh/library');
    expect(appPath('hu', 'suggest')).toBe('/hu/suggest');
  });

  it('isAppPathActive matches as-needed URLs', () => {
    expect(isAppPathActive('es', 'library', '/library')).toBe(true);
    expect(isAppPathActive('es', 'library', '/library/extra')).toBe(true);
    expect(isAppPathActive('en', 'library', '/en/library')).toBe(true);
    expect(isAppPathActive('es', 'discover', '/discover')).toBe(true);
    expect(isAppPathActive('en', 'discover', '/en/discover')).toBe(true);
    expect(isAppPathActive('es', '', '/')).toBe(true);
  });
});
