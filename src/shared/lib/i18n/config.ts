export const locales = ['es', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'es';

export const localePrefix = 'as-needed' as const;

export const localeLabels: Record<Locale, string> = {
  es: 'Español',
  en: 'English',
};
