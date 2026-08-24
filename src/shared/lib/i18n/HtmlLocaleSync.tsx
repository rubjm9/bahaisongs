'use client';

import { useLayoutEffect } from 'react';
import { useLocale } from 'next-intl';
import { localeDirection } from '@/shared/lib/i18n/config';

/**
 * Keeps <html lang/dir> in sync on client navigations.
 * Root layout cannot read NEXT_LOCALE (Cloudflare), and the
 * beforeInteractive bootstrap only runs on full page loads.
 */
export function HtmlLocaleSync() {
  const locale = useLocale();

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.lang = locale;
    root.dir = localeDirection(locale);
  }, [locale]);

  return null;
}
