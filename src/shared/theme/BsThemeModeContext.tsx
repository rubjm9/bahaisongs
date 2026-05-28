'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { ThemeMode } from './tokens';

const BsThemeModeContext = createContext<ThemeMode>('dark');

export function BsThemeModeProvider({
  initialMode,
  children,
}: {
  initialMode: ThemeMode;
  children: ReactNode;
}) {
  return <BsThemeModeContext.Provider value={initialMode}>{children}</BsThemeModeContext.Provider>;
}

export function useSsrThemeMode(): ThemeMode {
  return useContext(BsThemeModeContext);
}
