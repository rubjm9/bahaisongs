import { setRequestLocale, getTranslations } from 'next-intl/server';
import { routing } from '@/shared/lib/i18n/routing';
import { OfflineNotice } from '@/features/pwa/components/OfflineNotice';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const dynamic = 'force-static';

export default async function OfflinePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('pwa.offline');

  return <OfflineNotice title={t('title')} description={t('description')} retry={t('retry')} />;
}
