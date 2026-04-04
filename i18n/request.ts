import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';

export const locales = ['en', 'nl', 'tr'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

function detectLocale(): Locale {
  // 1. Cookie takes priority (explicit user choice)
  const cookieLocale = cookies().get('NEXT_LOCALE')?.value;
  if (cookieLocale && locales.includes(cookieLocale as Locale)) {
    return cookieLocale as Locale;
  }

  // 2. Browser Accept-Language header
  const acceptLang = headers().get('accept-language') ?? '';
  for (const part of acceptLang.split(',')) {
    const tag = part.split(';')[0].trim().toLowerCase();
    // Match full tag first (e.g. "nl-NL" → "nl"), then short tag
    const short = tag.split('-')[0] as Locale;
    if (locales.includes(short)) return short;
  }

  return defaultLocale;
}

export default getRequestConfig(async () => {
  const locale = detectLocale();
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
