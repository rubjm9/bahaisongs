import type { MetadataRoute } from 'next';
import { getAllTracks, getActiveCategorySlugs } from '@/server/data/catalog';
import { SITE_URL } from '@/shared/lib/seo/site';
import { knownCategorySlugs } from '@/features/catalog/lib/category-labels';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [tracks, activeCats] = await Promise.all([getAllTracks(), getActiveCategorySlugs()]);
  const categories = activeCats.filter((slug) => knownCategorySlugs().includes(slug));

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/library`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/discover`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/suggest`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/en`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/en/library`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/en/discover`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/artist/comunidad-bahai`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/en/artist/comunidad-bahai`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
  ];

  // Primary (ES) track pages — duplicate slugs (-2, -v-2) get lower priority
  // since their canonical points to the primary version
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

  // ES + EN category pages
  const categoryPages: MetadataRoute.Sitemap = categories.flatMap((slug) => [
    { url: `${SITE_URL}/category/${slug}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.6 },
    { url: `${SITE_URL}/en/category/${slug}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.5 },
  ]);

  return [...staticPages, ...trackPages, ...categoryPages];
}
