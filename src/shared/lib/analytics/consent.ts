/** Analytics notice acknowledgment (tacit consent — tracking on by default). */

export const ANALYTICS_CONSENT_KEY = 'bahaisongs:analytics-consent';

/** `granted` = notice dismissed; `denied` reserved if we ever offer opt-out. */
export type AnalyticsConsent = 'granted' | 'denied';

export const ANALYTICS_CONSENT_EVENT = 'bahaisongs:analytics-consent-change';

export function readAnalyticsConsent(): AnalyticsConsent | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = localStorage.getItem(ANALYTICS_CONSENT_KEY);
    if (value === 'granted' || value === 'denied') return value;
  } catch {
    /* private browsing */
  }
  return null;
}

export function writeAnalyticsConsent(value: AnalyticsConsent): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ANALYTICS_CONSENT_KEY, value);
  } catch {
    /* private browsing */
  }
  window.dispatchEvent(new CustomEvent(ANALYTICS_CONSENT_EVENT, { detail: value }));
}

/** Tacit consent: analytics runs unless the user has explicitly denied. */
export function isAnalyticsConsented(): boolean {
  return readAnalyticsConsent() !== 'denied';
}

/** Banner stays until the user accepts or closes the notice. */
export function hasAcknowledgedAnalyticsNotice(): boolean {
  return readAnalyticsConsent() !== null;
}
