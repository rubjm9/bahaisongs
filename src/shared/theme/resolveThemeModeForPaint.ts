import type { ThemeMode } from './tokens';

/**
 * Theme mode used for MUI / gradient paint.
 * - After mount: trust next-themes `resolvedTheme`.
 * - Before mount on the client: read `html` class (set by next-themes script).
 * - On the server: use the mode resolved from the cookie / OS hint.
 */
export function resolveThemeModeForPaint(
  mounted: boolean,
  resolvedTheme: string | undefined,
  ssrMode: ThemeMode,
): ThemeMode {
  if (mounted) {
    return resolvedTheme === 'light' ? 'light' : 'dark';
  }
  if (typeof document !== 'undefined') {
    return document.documentElement.classList.contains('light') ? 'light' : 'dark';
  }
  return ssrMode;
}
