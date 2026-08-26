'use client';

import { GoogleAnalyticsTagScripts } from '@/shared/lib/analytics/GoogleAnalyticsScripts';
import { grantAnalyticsConsent, isGoogleAnalyticsEnabled } from '@/shared/lib/analytics/gtag';
import { useEffect } from 'react';

/**
 * Loads gtag.js by default (tacit consent). Syncs Consent Mode to granted on mount.
 */
export function GoogleAnalyticsLoader() {
  useEffect(() => {
    if (!isGoogleAnalyticsEnabled()) return;
    grantAnalyticsConsent();
  }, []);

  if (!isGoogleAnalyticsEnabled()) return null;
  return <GoogleAnalyticsTagScripts />;
}
