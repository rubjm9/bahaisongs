import { getRequestConfig } from 'next-intl/server';
import type { AbstractIntlMessages } from 'next-intl';
import { routing } from './routing';
import type { Locale } from './config';

function isLocale(value: string | undefined): value is Locale {
  return value !== undefined && (routing.locales as readonly string[]).includes(value);
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale: Locale = isLocale(requested) ? requested : routing.defaultLocale;

  const mod = (await import(`../../../../messages/${locale}.json`)) as {
    default: AbstractIntlMessages;
  };

  return {
    locale,
    messages: mod.default,
  };
});
