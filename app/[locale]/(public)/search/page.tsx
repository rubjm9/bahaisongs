import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { SearchPageClient } from '@/features/catalog/components/SearchPageClient';

type Params = Promise<{ locale: string }>;

export default async function SearchPage({ params }: { params: Params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Suspense>
      <SearchPageClient />
    </Suspense>
  );
}
