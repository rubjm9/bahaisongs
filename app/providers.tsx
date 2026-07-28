'use client';

import { useState, type ReactNode } from 'react';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { QueryClientProvider } from '@tanstack/react-query';
import rtlPlugin from '@mui/stylis-plugin-rtl';
import { BsThemeProvider } from '@/shared/theme/ThemeProvider';
import { ThemeColorMeta } from '@/shared/theme/ThemeColorMeta';
import { makeQueryClient } from '@/shared/lib/query/queryClient';
import type { ThemePreference } from '@/shared/theme/themeStorage';
import type { ThemeMode } from '@/shared/theme/tokens';

export function Providers({
  children,
  initialMode,
  themePreference,
  direction = 'ltr',
}: {
  children: ReactNode;
  initialMode: ThemeMode;
  themePreference?: ThemePreference;
  direction?: 'ltr' | 'rtl';
}) {
  const [queryClient] = useState(makeQueryClient);
  const isRtl = direction === 'rtl';

  return (
    <AppRouterCacheProvider
      options={{
        key: isRtl ? 'muirtl' : 'mui',
        enableCssLayer: true,
        // Omit stylis `prefixer` — it crashes Emotion SSR (`undefined.push`).
        ...(isRtl ? { stylisPlugins: [rtlPlugin] } : {}),
      }}
    >
      <BsThemeProvider
        initialMode={initialMode}
        direction={direction}
        {...(themePreference ? { themePreference } : {})}
      >
        <ThemeColorMeta />
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </BsThemeProvider>
    </AppRouterCacheProvider>
  );
}
