/**
 * Supported locales for transactional emails.
 * "nl" is the default (the business operates in the Netherlands).
 */
export type Locale = 'en' | 'nl' | 'tr';

export const DEFAULT_LOCALE: Locale = 'nl';

/**
 * Normalise an arbitrary locale string coming from Accept-Language or
 * Stripe metadata into one of our supported Locale values.
 * Falls back to DEFAULT_LOCALE when the input is unknown / absent.
 *
 * Examples:
 *   "nl-NL" → "nl"
 *   "tr"    → "tr"
 *   "de"    → "nl"  (unsupported, falls back)
 */
export function resolveLocale(raw: string | null | undefined): Locale {
  if (!raw) return DEFAULT_LOCALE;
  const tag = raw.split(/[_\-]/)[0].toLowerCase();
  if (tag === 'en') return 'en';
  if (tag === 'tr') return 'tr';
  if (tag === 'nl') return 'nl';
  return DEFAULT_LOCALE;
}

/**
 * Parse the Accept-Language header and return the best-matching supported
 * locale. The header may look like "nl,en-US;q=0.9,tr;q=0.8".
 */
export function localeFromAcceptLanguage(header: string | null | undefined): Locale {
  if (!header) return DEFAULT_LOCALE;

  // Parse each tag and its quality value
  const entries = header
    .split(',')
    .map((part) => {
      const [tag, q] = part.trim().split(';q=');
      return { tag: tag.trim(), q: q ? parseFloat(q) : 1.0 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of entries) {
    const locale = resolveLocale(tag);
    if (locale !== DEFAULT_LOCALE) return locale;
    // If the first entry maps to default, return it immediately
    if (resolveLocale(tag) === DEFAULT_LOCALE) return DEFAULT_LOCALE;
  }

  return DEFAULT_LOCALE;
}
