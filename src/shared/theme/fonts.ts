import { Inter, Outfit, Noto_Sans_Arabic, Noto_Sans_SC, Noto_Sans_Devanagari } from 'next/font/google';

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

/** Simplified Chinese UI. Applied via `--bs-font-cjk` when lang=zh. */
export const notoSansSc = Noto_Sans_SC({
  subsets: ['latin'],
  display: 'swap',
  variable: '--bs-font-cjk',
  weight: ['300', '400', '500', '700'],
});

/** Hindi (Devanagari) UI. Applied via `--bs-font-devanagari` when lang=hi. */
export const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  display: 'swap',
  variable: '--bs-font-devanagari',
  weight: ['300', '400', '500', '600', '700'],
});
