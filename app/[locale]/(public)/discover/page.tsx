import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { DiscoverPageClient } from '@/features/discover/components/DiscoverPageClient';
import { FEATURED_CATEGORIES } from '@/features/discover/lib/featured-categories';
import {
  getAllTracks,
  getActiveCategorySlugs,
  getCatalogLanguages,
} from '@/server/data/catalog';

type Params = Promise<{ locale: string }>;

export default async function DiscoverPage({ params }: { params: Params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [catalogLanguages, activeCategorySlugs, allTracks] = await Promise.all([
    getCatalogLanguages(),
    getActiveCategorySlugs(),
    getAllTracks(),
  ]);

  const activeSet = new Set(activeCategorySlugs);
  const featuredCategorySlugs = FEATURED_CATEGORIES.filter((slug) => activeSet.has(slug));

  return (
    <Suspense>
      <DiscoverPageClient
        catalogLanguages={catalogLanguages}
        featuredCategorySlugs={featuredCategorySlugs}
        allTracks={allTracks}
      />
    </Suspense>
  );
}
