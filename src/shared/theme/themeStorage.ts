import type { ThemeMode } from './tokens';

export const THEME_STORAGE_KEY = 'bs-theme';
export const THEME_COOKIE_NAME = 'bs-theme';

export type ThemePreference = 'light' | 'dark' | 'system';

export function isThemePreference(value: string | undefined): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

/** Map stored preference + OS hint to the palette mode used by MUI / gradients. */
export function resolveThemeMode(
  preference: ThemePreference | null | undefined,
  systemPrefersLight: boolean,
): ThemeMode {
  if (preference === 'light') return 'light';
  if (preference === 'dark') return 'dark';
  return systemPrefersLight ? 'light' : 'dark';
}

export function themePreferenceCookie(value: ThemePreference): string {
  return `${THEME_COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; Max-Age=31536000; SameSite=Lax`;
}
