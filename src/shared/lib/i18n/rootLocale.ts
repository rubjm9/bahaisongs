import 'server-only';

import { cookies } from 'next/headers';
import { defaultLocale, locales, type Locale } from './config';

const LOCALE_COOKIE = 'NEXT_LOCALE';

/**
 * Locale for the root `<html lang>` attribute.
 * Avoids `getLocale()` from next-intl, which requires the intl middleware
 * and breaks routes outside `[locale]` (e.g. `/admin`).
 */
export async function getRootHtmlLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(LOCALE_COOKIE)?.value;
  if (cookie && (locales as readonly string[]).includes(cookie)) {
    return cookie as Locale;
  }
  return defaultLocale;
}
