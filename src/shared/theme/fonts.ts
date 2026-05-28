import { Inter, Outfit } from 'next/font/google';

export const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--bs-font-sans',
  weight: ['300', '400', '500', '600', '700'],
});

export const outfit = Outfit({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--bs-font-display',
  weight: ['400', '500', '600', '700', '800'],
});
