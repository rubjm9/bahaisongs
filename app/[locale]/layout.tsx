import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { Providers } from '@/app/providers';
import { InstallPrompt } from '@/features/pwa/components/InstallPrompt';
import { routing } from '@/shared/lib/i18n/routing';
import { getServerThemeMode, getServerThemePreference } from '@/shared/theme/serverTheme';
import type { Locale } from '@/shared/lib/i18n/config';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Params = Promise<{ locale: string }>;

function isLocale(value: string): value is Locale {
  return (routing.locales as readonly string[]).includes(value);
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Params;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const messages = await getMessages();
  const [initialMode, themePreference] = await Promise.all([
    getServerThemeMode(),
    getServerThemePreference(),
  ]);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Providers initialMode={initialMode} {...(themePreference ? { themePreference } : {})}>
        {children}
        <InstallPrompt />
      </Providers>
    </NextIntlClientProvider>
  );
}
