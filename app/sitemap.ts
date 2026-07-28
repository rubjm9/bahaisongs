import type { MetadataRoute } from 'next';
import { getAllTracks, getActiveCategorySlugs } from '@/server/data/catalog';
import { SITE_URL } from '@/shared/lib/seo/site';
import { knownCategorySlugs } from '@/features/catalog/lib/category-labels';
import { locales, defaultLocale, type Locale } from '@/shared/lib/i18n/config';
import { appPath } from '@/shared/lib/seo/paths';

const STATIC_SEGMENTS = ['', 'library', 'discover', 'suggest', 'artist/comunidad-bahai'] as const;

function localeUrl(locale: Locale, path: string): string {
  return `${SITE_URL}${appPath(locale, path)}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [tracks, activeCats] = await Promise.all([getAllTracks(), getActiveCategorySlugs()]);
  const categories = activeCats.filter((slug) => knownCategorySlugs().includes(slug));

  const staticPages: MetadataRoute.Sitemap = STATIC_SEGMENTS.flatMap((segment) =>
    locales.map((locale) => ({
      url: localeUrl(locale, segment),
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority:
        locale === defaultLocale
          ? segment === ''
            ? 1
            : segment === 'library' || segment === 'discover'
              ? 0.9
              : 0.5
          : segment === ''
            ? 0.8
            : segment === 'library' || segment === 'discover'
              ? 0.7
              : 0.4,
    })),
  );

  // Primary track pages — flat, locale-independent
  const DUPLICATE_RE = /(-v?-?\d+)$/;
  const trackPages: MetadataRoute.Sitemap = tracks.map((track) => {
    const parsed = track.publishedAt ? new Date(track.publishedAt) : null;
    const lastModified = parsed && !Number.isNaN(parsed.getTime()) ? parsed : now;
    const isDuplicate = DUPLICATE_RE.test(track.slug);
    return {
      url: `${SITE_URL}/${track.slug}`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: isDuplicate ? 0.3 : 0.8,
    };
  });

  const categoryPages: MetadataRoute.Sitemap = categories.flatMap((slug) =>
    locales.map((locale) => ({
      url: localeUrl(locale, `category/${slug}`),
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: locale === defaultLocale ? 0.6 : 0.5,
    })),
  );

  return [...staticPages, ...trackPages, ...categoryPages];
}
