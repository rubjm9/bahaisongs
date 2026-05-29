import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Suspense } from 'react';
import { getLocale } from 'next-intl/server';
import { GoogleAnalyticsPageViews } from '@/shared/lib/analytics/GoogleAnalytics';
import { GoogleAnalyticsScripts } from '@/shared/lib/analytics/GoogleAnalyticsScripts';
import { inter, outfit } from '@/shared/theme/fonts';
import { getServerThemeMode } from '@/shared/theme/serverTheme';
import { THEME_COOKIE_NAME, THEME_STORAGE_KEY } from '@/shared/theme/themeStorage';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'BahaiSongs', template: '%s · BahaiSongs' },
  description: "Music, prayers and chord sheets from the Bahá'í community.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f0f4fa' },
    { media: '(prefers-color-scheme: dark)', color: '#050b1a' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [locale, initialMode] = await Promise.all([getLocale(), getServerThemeMode()]);
  return (
    <html
      lang={locale}
      className={`${inter.variable} ${outfit.variable} ${initialMode}`}
      suppressHydrationWarning
    >
      <head>
        <GoogleAnalyticsScripts />
      </head>
      <body className={inter.className}>
        <Script id="bs-theme-cookie-bootstrap" strategy="beforeInteractive">
          {`(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var c=${JSON.stringify(THEME_COOKIE_NAME)};var p=localStorage.getItem(k);if(p==='light'||p==='dark'||p==='system'){document.cookie=c+'='+encodeURIComponent(p)+';path=/;max-age=31536000;SameSite=Lax';}}catch(e){}})();`}
        </Script>
        {children}
        <Suspense fallback={null}>
          <GoogleAnalyticsPageViews />
        </Suspense>
      </body>
    </html>
  );
}
