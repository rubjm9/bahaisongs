'use client';

import { useState, type ReactNode } from 'react';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { BsThemeProvider } from '@/shared/theme/ThemeProvider';
import { ThemeColorMeta } from '@/shared/theme/ThemeColorMeta';
import { makeQueryClient } from '@/shared/lib/query/queryClient';
import type { ThemePreference } from '@/shared/theme/themeStorage';
import type { ThemeMode } from '@/shared/theme/tokens';

export function Providers({
  children,
  initialMode,
  themePreference,
}: {
  children: ReactNode;
  initialMode: ThemeMode;
  themePreference?: ThemePreference;
}) {
  const [queryClient] = useState(makeQueryClient);

  return (
    <AppRouterCacheProvider options={{ key: 'mui', enableCssLayer: true }}>
      <BsThemeProvider initialMode={initialMode} {...(themePreference ? { themePreference } : {})}>
        <ThemeColorMeta />
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </BsThemeProvider>
    </AppRouterCacheProvider>
  );
}
