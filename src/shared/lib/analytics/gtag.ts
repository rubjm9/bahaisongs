/** Public GA4 ID — overridable via env (e.g. staging). */
export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? 'G-52YQGDNQBS';

import type { UserAnalyticsProperties, AnalyticsEventParams, AnalyticsEventName } from './events';

export function isGoogleAnalyticsEnabled(): boolean {
  return GA_MEASUREMENT_ID.length > 0;
}

function canSend(): boolean {
  return isGoogleAnalyticsEnabled() && typeof window !== 'undefined' && typeof window.gtag === 'function';
}

export function pageview(url: string): void {
  if (!canSend()) return;
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: url,
  });
}

export function gtagEvent(
  action: string,
  params?: Record<string, string | number | boolean> | AnalyticsEventParams<AnalyticsEventName>,
): void {
  if (!canSend()) return;
  window.gtag('event', action, params);
}

export function setUserProperties(props: UserAnalyticsProperties): void {
  if (!canSend()) return;
  const payload: Record<string, string | boolean> = {};
  if (props.locale !== undefined) payload.locale = props.locale;
  if (props.authenticated !== undefined) payload.authenticated = props.authenticated;
  if (Object.keys(payload).length === 0) return;
  window.gtag('set', 'user_properties', payload);
}

/** Consent Mode v2 — tacit analytics consent (storage granted by default). */
export function setConsentDefault(): void {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer ?? [];
  if (typeof window.gtag !== 'function') {
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer.push(args);
    };
  }
  window.gtag('consent', 'default', {
    analytics_storage: 'granted',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
}

export function grantAnalyticsConsent(): void {
  if (typeof window === 'undefined') return;
  if (typeof window.gtag !== 'function') setConsentDefault();
  window.gtag('consent', 'update', {
    analytics_storage: 'granted',
  });
}

export function denyAnalyticsConsent(): void {
  if (typeof window === 'undefined') return;
  if (typeof window.gtag !== 'function') setConsentDefault();
  window.gtag('consent', 'update', {
    analytics_storage: 'denied',
  });
}

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}
