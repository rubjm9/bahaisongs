import { GA_MEASUREMENT_ID, isGoogleAnalyticsEnabled } from './gtag';

/** Inline + async gtag in <head> so GA loads on first paint (SSR, no hydration wait). */
export function GoogleAnalyticsScripts() {
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
