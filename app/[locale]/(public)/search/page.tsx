import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/shared/lib/i18n/config';
import { appPath } from '@/shared/lib/seo/paths';

type Params = Promise<{ locale: string }>;
type SearchParams = Promise<{ q?: string; language?: string }>;

/** Legacy `/search` → `/discover` (query string preserved). */
export default async function SearchRedirectPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const next = new URLSearchParams();
  if (sp.q) next.set('q', sp.q);
  if (sp.language) next.set('language', sp.language);
  const qs = next.size > 0 ? `?${next.toString()}` : '';
  redirect(`${appPath(locale as Locale, 'discover')}${qs}`);
}
