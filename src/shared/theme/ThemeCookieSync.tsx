'use client';

import { useLayoutEffect } from 'react';
import { useTheme } from 'next-themes';
import { useThemeMounted } from '@/shared/hooks/useThemeMounted';
import {
  isThemePreference,
  themePreferenceCookie,
  THEME_STORAGE_KEY,
  type ThemePreference,
} from './themeStorage';

function writeThemeCookie(preference: ThemePreference) {
  document.cookie = themePreferenceCookie(preference);
}

/** Keeps `bs-theme` cookie aligned with next-themes localStorage for SSR. */
export function ThemeCookieSync() {
  const { theme } = useTheme();
  const mounted = useThemeMounted();

  useLayoutEffect(() => {
    if (!mounted) return;

    if (isThemePreference(theme)) {
      writeThemeCookie(theme);
      return;
    }

    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) ?? undefined;
      if (isThemePreference(stored)) writeThemeCookie(stored);
    } catch {
      /* ignore */
    }
  }, [theme, mounted]);

  return null;
}
