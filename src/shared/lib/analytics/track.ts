import type {
  AnalyticsEventName,
  AnalyticsEventParams,
  UserAnalyticsProperties,
} from './events';
import { isAnalyticsConsented } from './consent';
import { gtagEvent, setUserProperties as gtagSetUserProperties } from './gtag';

/** Send a typed GA4 event (tacit consent — skipped only if explicitly denied). */
export function track<E extends AnalyticsEventName>(
  event: E,
  params: AnalyticsEventParams<E>,
): void {
  if (!isAnalyticsConsented()) return;
  gtagEvent(event, params);
}

/** Sync user-scoped dimensions in GA4 (locale, auth state). */
export function setUserProperties(props: UserAnalyticsProperties): void {
  if (!isAnalyticsConsented()) return;
  gtagSetUserProperties(props);
}
