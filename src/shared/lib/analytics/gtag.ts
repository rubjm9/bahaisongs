/** Public GA4 ID — overridable via env (e.g. staging). */
export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? 'G-52YQGDNQBS';

export function isGoogleAnalyticsEnabled(): boolean {
  return GA_MEASUREMENT_ID.length > 0;
}

export function pageview(url: string): void {
  if (!isGoogleAnalyticsEnabled() || typeof window === 'undefined') return;
  if (typeof window.gtag !== 'function') return;
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: url,
  });
}

export function gtagEvent(
  action: string,
  params?: Record<string, string | number | boolean>
): void {
  if (!isGoogleAnalyticsEnabled() || typeof window === 'undefined') return;
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', action, params);
}

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}
