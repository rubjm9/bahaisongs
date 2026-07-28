import { locales, type Locale } from '@/shared/lib/i18n/config';
import { appPath } from '@/shared/lib/seo/paths';
import { SITE_URL } from '@/shared/lib/seo/site';

/**
 * Map of hreflang codes → absolute URLs for a locale-aware app path.
 * Pass `path` without leading slash (e.g. `library`, `category/oracion`, `` for home).
 */
export function languagesAlternates(path = ''): Record<Locale, string> {
  const result = {} as Record<Locale, string>;
  for (const locale of locales) {
    result[locale] = `${SITE_URL}${appPath(locale, path)}`;
  }
  return result;
}
