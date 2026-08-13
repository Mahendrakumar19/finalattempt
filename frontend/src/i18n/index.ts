/**
 * i18n/index.ts
 * Locale types, helpers, and dictionary loader for Final Attempt bilingual system.
 */

export type Locale = 'en' | 'hi';

export const LOCALES: readonly Locale[] = ['en', 'hi'] as const;
export const DEFAULT_LOCALE: Locale = 'en';

/** Cookie name used to persist locale preference. */
export const LOCALE_COOKIE = 'NEXT_LOCALE';

/** Cookie max-age in seconds: 1 year */
export const LOCALE_COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

/** Narrow a string to a supported Locale. */
export function hasLocale(s: string | undefined | null): s is Locale {
  return s === 'en' || s === 'hi';
}

/** Safely coerce a string to Locale, falling back to default. */
export function toLocale(s: string | undefined | null): Locale {
  return hasLocale(s) ? s : DEFAULT_LOCALE;
}

/**
 * Nested key accessor — resolves 'nav.home' → dictionary['nav']['home'].
 * Returns the key itself as a fallback so the UI never shows undefined.
 */
export function resolveKey(
  dict: Record<string, unknown>,
  key: string
): string {
  const parts = key.split('.');
  let cursor: unknown = dict;
  for (const part of parts) {
    if (cursor !== null && typeof cursor === 'object') {
      cursor = (cursor as Record<string, unknown>)[part];
    } else {
      return key; // fallback: show the key
    }
  }
  return typeof cursor === 'string' ? cursor : key;
}

// Type for the translation function
export type TFunction = (key: string, fallback?: string) => string;
