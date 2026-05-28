'use client';

import { useMemo } from 'react';
import { useTheme } from 'next-themes';
import { useThemeMounted } from '@/shared/hooks/useThemeMounted';
import { useSsrThemeMode } from './BsThemeModeContext';
import { resolveThemeModeForPaint } from './resolveThemeModeForPaint';
import { accent, getGradients, getSemanticPalette, getShadows } from './tokens';

export function useBsTheme() {
  const { theme, resolvedTheme, setTheme, systemTheme } = useTheme();
  const mounted = useThemeMounted();
  const ssrMode = useSsrThemeMode();

  const mode = resolveThemeModeForPaint(mounted, resolvedTheme, ssrMode);

  const semantic = useMemo(() => getSemanticPalette(mode), [mode]);
  const gradients = useMemo(() => getGradients(mode), [mode]);
  const shadows = useMemo(() => getShadows(mode), [mode]);

  return {
    /** User preference: 'light' | 'dark' | 'system' */
    preference: theme,
    /** Resolved appearance */
    mode,
    systemTheme,
    accent,
    semantic,
    gradients,
    shadows,
    setTheme,
  };
}
