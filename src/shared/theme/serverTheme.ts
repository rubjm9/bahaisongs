import 'server-only';

import { cookies, headers } from 'next/headers';
import {
  isThemePreference,
  resolveThemeMode,
  THEME_COOKIE_NAME,
  type ThemePreference,
} from './themeStorage';
import type { ThemeMode } from './tokens';

function systemPrefersLightFromHeaders(headerList: Headers): boolean {
  const secCh = headerList.get('sec-ch-prefers-color-scheme');
  if (secCh === 'light') return true;
  if (secCh === 'dark') return false;

  const accept = headerList.get('accept');
  if (accept?.includes('prefers-color-scheme: light')) return true;
  if (accept?.includes('prefers-color-scheme: dark')) return false;

  return false;
}

export async function getServerThemePreference(): Promise<ThemePreference | undefined> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(THEME_COOKIE_NAME)?.value;
  return isThemePreference(raw) ? raw : undefined;
}

/** Resolved light/dark mode for SSR (MUI, atmosphere gradients). */
export async function getServerThemeMode(): Promise<ThemeMode> {
  const preference = await getServerThemePreference();
  const headerList = await headers();
  return resolveThemeMode(preference ?? 'system', systemPrefersLightFromHeaders(headerList));
}
