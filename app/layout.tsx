import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Suspense } from 'react';
import { GoogleAnalyticsPageViews } from '@/shared/lib/analytics/GoogleAnalytics';
import { GoogleAnalyticsScripts } from '@/shared/lib/analytics/GoogleAnalyticsScripts';
import { inter, outfit, notoSansArabic } from '@/shared/theme/fonts';
import { THEME_COOKIE_NAME, THEME_STORAGE_KEY } from '@/shared/theme/themeStorage';
import { SITE_URL } from '@/shared/lib/seo/site';
import { getRootHtmlLocale } from '@/shared/lib/i18n/rootLocale';
import { localeDirection } from '@/shared/lib/i18n/config';
import './globals.css';

export const runtime = 'edge';

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'BahaiSongs',
  url: SITE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/search?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

export const metadata: Metadata = {
  title: {
    default: "BahaiSongs – Letras, acordes y vídeos de canciones bahá'ís",
    template: '%s · BahaiSongs',
  },
  description:
    "Descubre más de 140 canciones bahá'ís con letra, acordes y audio integrado. El cancionero bahá'í digital en español.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  applicationName: 'BahaiSongs',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'BahaiSongs',
  },
  icons: {
    icon: [
      { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
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
  const locale = await getRootHtmlLocale();
  const dir = localeDirection(locale);

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${inter.variable} ${outfit.variable} ${notoSansArabic.variable}`}
      suppressHydrationWarning
    >
      <head>
        <GoogleAnalyticsScripts />
      </head>
      <body className={inter.className}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
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
