import createNextIntlPlugin from 'next-intl/plugin';
import withSerwistInit from '@serwist/next';

const withNextIntl = createNextIntlPlugin('./src/shared/lib/i18n/request.ts');

const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  // Service worker only runs in production builds.
  disable: process.env.NODE_ENV === 'development',
});

const PRODUCTION_ORIGIN = 'https://bahaisongs.org';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  typedRoutes: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.bahaisongs.org' },
    ],
  },
  async redirects() {
    return [
      // Canonical host: apex only (no www)
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.bahaisongs.org' }],
        destination: `${PRODUCTION_ORIGIN}/:path*`,
        permanent: true,
      },
      // Staging/dev host → production (path + query preserved by Next.js)
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'dev.bahaisongs.org' }],
        destination: `${PRODUCTION_ORIGIN}/:path*`,
        permanent: true,
      },
      {
        source: '/category/canciones',
        destination: '/category/cancion',
        permanent: true,
      },
      {
        source: '/category/oraciones',
        destination: '/category/oracion',
        permanent: true,
      },
      {
        source: '/category/canciones-espanol',
        destination: '/library?language=es',
        permanent: true,
      },
      {
        source: '/category/english',
        destination: '/library?language=en',
        permanent: true,
      },
      {
        source: '/contribuir-con-una-nueva-cancion',
        destination: '/suggest',
        permanent: true,
      },
      {
        source: '/page/:n',
        destination: '/library',
        permanent: true,
      },
      {
        source: '/:locale(es|en|fr|de|pt|ar|ru|fa)/song/:slug',
        destination: '/:slug',
        permanent: true,
      },
      {
        source: '/song/:slug',
        destination: '/:slug',
        permanent: true,
      },
      // Trailing-slash variants (legacy WordPress)
      {
        source: '/category/canciones/',
        destination: '/category/cancion',
        permanent: true,
      },
      {
        source: '/category/oraciones/',
        destination: '/category/oracion',
        permanent: true,
      },
      {
        source: '/category/canciones-espanol/',
        destination: '/library?language=es',
        permanent: true,
      },
      {
        source: '/category/english/',
        destination: '/library?language=en',
        permanent: true,
      },
      {
        source: '/contribuir-con-una-nueva-cancion/',
        destination: '/suggest',
        permanent: true,
      },
      {
        source: '/page/:n/',
        destination: '/library',
        permanent: true,
      },
      {
        source: '/song/:slug/',
        destination: '/:slug',
        permanent: true,
      },
      {
        source: '/:locale(es|en|fr|de|pt|ar|ru|fa)/song/:slug/',
        destination: '/:slug',
        permanent: true,
      },
    ];
  },
};

export default withSerwist(withNextIntl(nextConfig));
