'use client';

import { useMemo, type ReactNode } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useTheme } from 'next-themes';
import { useThemeMounted } from '@/shared/hooks/useThemeMounted';
import { BsThemeModeProvider, useSsrThemeMode } from './BsThemeModeContext';
import { resolveThemeModeForPaint } from './resolveThemeModeForPaint';
import { ThemeCookieSync } from './ThemeCookieSync';
import { createBsTheme } from './theme';
import { THEME_STORAGE_KEY, type ThemePreference } from './themeStorage';
import type { ThemeMode } from './tokens';

function MuiThemeBridge({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();
  const mounted = useThemeMounted();
  const ssrMode = useSsrThemeMode();

  const mode = resolveThemeModeForPaint(mounted, resolvedTheme, ssrMode);

  const muiTheme = useMemo(() => createBsTheme(mode), [mode]);

  return (
    <MuiThemeProvider theme={muiTheme}>
      <CssBaseline enableColorScheme />
      {children}
    </MuiThemeProvider>
  );
}

export function BsThemeProvider({
  children,
  initialMode,
  themePreference,
}: {
  children: ReactNode;
  initialMode: ThemeMode;
  themePreference?: ThemePreference;
}) {
  return (
    <BsThemeModeProvider initialMode={initialMode}>
      <NextThemesProvider
        attribute="class"
        defaultTheme={themePreference ?? 'system'}
        enableSystem
        storageKey={THEME_STORAGE_KEY}
        themes={['light', 'dark']}
        disableTransitionOnChange
      >
        <ThemeCookieSync />
        <MuiThemeBridge>{children}</MuiThemeBridge>
      </NextThemesProvider>
    </BsThemeModeProvider>
  );
}
