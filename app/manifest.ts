import type { MetadataRoute } from 'next';

/**
 * Web App Manifest. Next links it automatically as
 * `<link rel="manifest" href="/manifest.webmanifest">`.
 * Background/theme use the dark brand background (#050B1A).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BahaiSongs',
    short_name: 'BahaiSongs',
    description:
      "Letras, acordes y audio de más de 140 canciones bahá'ís. El cancionero bahá'í digital.",
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    lang: 'es',
    dir: 'ltr',
    background_color: '#050B1A',
    theme_color: '#050B1A',
    categories: ['music', 'lifestyle', 'education'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      {
        src: '/icons/maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      { name: 'Biblioteca', short_name: 'Biblioteca', url: '/library' },
      { name: 'Descubrir', short_name: 'Descubrir', url: '/discover' },
    ],
  };
}
