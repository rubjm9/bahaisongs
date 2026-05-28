/** Canonical production origin for sitemaps, canonical URLs, and Open Graph. */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'https://bahaisongs.org';
