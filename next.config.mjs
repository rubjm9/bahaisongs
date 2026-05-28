import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/shared/lib/i18n/request.ts');

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
        source: '/:locale(es|en)/song/:slug',
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
        source: '/:locale(es|en)/song/:slug/',
        destination: '/:slug',
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
