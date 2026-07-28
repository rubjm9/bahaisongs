export const locales = ['es', 'en', 'fr', 'de', 'pt', 'ru', 'ar', 'fa'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'es';

export const localePrefix = 'as-needed' as const;

/** Native display names — order matches `locales` (es, en, fr, de, pt, ru, ar, fa). */
export const localeLabels: Record<Locale, string> = {
  es: 'Español',
  en: 'English',
  fr: 'Français',
  de: 'Deutsch',
  pt: 'Português',
  ru: 'Русский',
  ar: 'العربية',
  fa: 'فارسی',
};

export const rtlLocales = ['ar', 'fa'] as const;
export type RtlLocale = (typeof rtlLocales)[number];

export function isRtlLocale(locale: string): locale is RtlLocale {
  return (rtlLocales as readonly string[]).includes(locale);
}

export function localeDirection(locale: string): 'ltr' | 'rtl' {
  return isRtlLocale(locale) ? 'rtl' : 'ltr';
}
