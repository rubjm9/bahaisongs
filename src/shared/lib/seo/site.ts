/** Canonical production origin (apex only, no www). */
function normalizeSiteUrl(raw: string): string {
  const trimmed = raw.replace(/\/$/, '');
  try {
    const url = new URL(trimmed);
    if (url.hostname === 'www.bahaisongs.org') {
      url.hostname = 'bahaisongs.org';
    }
    return url.origin;
  } catch {
    return trimmed;
  }
}

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL
  ? normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL)
  : 'https://bahaisongs.org';
