'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { isAnalyticsConsented } from './consent';
import { isGoogleAnalyticsEnabled, pageview } from './gtag';

/** Sends GA4 page_view on client navigations (initial view is handled by layout scripts). */
export function GoogleAnalyticsPageViews() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstView = useRef(true);

  useEffect(() => {
    if (!isGoogleAnalyticsEnabled() || !isAnalyticsConsented()) return;
    if (isFirstView.current) {
      isFirstView.current = false;
      return;
    }

    const query = searchParams.toString();
    const url = query ? `${pathname}?${query}` : pathname;

    const send = () => pageview(url);
    if (typeof window.gtag === 'function') {
      send();
      return;
    }

    const id = window.setInterval(() => {
      if (typeof window.gtag === 'function') {
        window.clearInterval(id);
        send();
      }
    }, 50);
    return () => window.clearInterval(id);
  }, [pathname, searchParams]);

  return null;
}
