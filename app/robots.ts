import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/shared/lib/seo/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Internal/auth routes + legacy WordPress paths that add no SEO value
      disallow: [
        '/api/',
        '/auth/',
        '/page/',
        '/__trashed',
        '/bahaisongs.org/',
        '/?s=',
        '/wp-',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
