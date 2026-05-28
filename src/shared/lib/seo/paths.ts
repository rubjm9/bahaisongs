import { defaultLocale, type Locale } from '@/shared/lib/i18n/config';
import { SITE_URL } from '@/shared/lib/seo/site';

/**
 * Public URL for a song (flat, locale-independent — matches legacy WordPress URLs).
 */
export function trackPath(slug: string): string {
  return `/${slug}`;
}

/**
 * Locale-aware path for app routes (home, library, category, …).
 * Default locale (es) omits the prefix (`as-needed`).
 */
export function appPath(locale: Locale, path = ''): string {
  const normalized = path.replace(/^\//, '');
  if (locale === defaultLocale) {
    return normalized ? `/${normalized}` : '/';
  }
  return normalized ? `/${locale}/${normalized}` : `/${locale}`;
}

export function trackCanonicalUrl(slug: string): string {
  return `${SITE_URL}${trackPath(slug)}`;
}

/** Whether `pathname` matches an app route for the given locale and segment. */
export function isAppPathActive(locale: Locale, segment: string, pathname: string): boolean {
  const href = appPath(locale, segment);
  if (segment === '') {
    return pathname === href || pathname === `${href}/`;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
