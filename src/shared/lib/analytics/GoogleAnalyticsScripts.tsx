import { GA_MEASUREMENT_ID, isGoogleAnalyticsEnabled } from './gtag';

/** Inline consent defaults in <head> — must run before any GA tag loads. */
export function GoogleAnalyticsConsentScript() {
  if (!isGoogleAnalyticsEnabled()) return null;

  const script = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('consent', 'default', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
  `.trim();

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

/** Async gtag loader — mounted by default (tacit analytics consent). */
export function GoogleAnalyticsTagScripts() {
  if (!isGoogleAnalyticsEnabled()) return null;

  const initScript = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GA_MEASUREMENT_ID}');
  `.trim();

  return (
    <>
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} />
      <script dangerouslySetInnerHTML={{ __html: initScript }} />
    </>
  );
}
