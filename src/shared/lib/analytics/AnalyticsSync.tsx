'use client';

import { useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useUser } from '@/features/auth/hooks/useUser';
import { setUserProperties } from '@/shared/lib/analytics/track';
import { isAnalyticsConsented, ANALYTICS_CONSENT_EVENT } from '@/shared/lib/analytics/consent';

/** Keeps GA4 user_properties in sync with locale and auth state. */
export function AnalyticsSync() {
  const locale = useLocale();
  const { user, loading } = useUser();

  useEffect(() => {
    function sync() {
      if (!isAnalyticsConsented()) return;
      setUserProperties({
        locale,
        authenticated: !loading && user !== null,
      });
    }

    sync();
    window.addEventListener(ANALYTICS_CONSENT_EVENT, sync);
    return () => window.removeEventListener(ANALYTICS_CONSENT_EVENT, sync);
  }, [locale, user, loading]);

  return null;
}
