export const locales = [
  'es',
  'en',
  'fr',
  'de',
  'it',
  'pt',
  'hu',
  'ru',
  'zh',
  'hi',
  'sw',
  'ar',
  'fa',
] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'es';

export const localePrefix = 'as-needed' as const;

/** Native display names — order matches `locales`. */
export const localeLabels: Record<Locale, string> = {
  es: 'Español',
  en: 'English',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  pt: 'Português',
  hu: 'Magyar',
  ru: 'Русский',
  zh: '中文',
  hi: 'हिन्दी',
  sw: 'Kiswahili',
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
