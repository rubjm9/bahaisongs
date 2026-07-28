import { Inter, Outfit, Noto_Sans_Arabic } from 'next/font/google';

export const inter = Inter({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
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

/** Loaded for Arabic / Farsi UI (RTL). Applied via `--bs-font-arabic` when dir=rtl. */
export const notoSansArabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  display: 'swap',
  variable: '--bs-font-arabic',
  weight: ['300', '400', '500', '600', '700'],
});
