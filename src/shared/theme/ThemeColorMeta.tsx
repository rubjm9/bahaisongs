'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { themeColorMeta } from './tokens';

export function ThemeColorMeta() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const mode = resolvedTheme === 'light' ? 'light' : 'dark';
    const color = themeColorMeta[mode];
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', color);
  }, [resolvedTheme]);

  return null;
}
