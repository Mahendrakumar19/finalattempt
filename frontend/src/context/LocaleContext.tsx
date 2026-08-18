'use client';

/**
 * LocaleContext.tsx
 * Provides locale state, cookie persistence, and the `t()` translation function
 * to the entire Final Attempt application.
 *
 * Architecture:
 *  - Mirrors the existing ThemeContext pattern.
 *  - Reads NEXT_LOCALE cookie on mount (SSR-compatible via js-cookie).
 *  - On locale change: updates cookie + state + document.documentElement.lang.
 *  - Exposes `useLocale()` for locale/setLocale access.
 *  - Exposes `useTranslation()` for t() function.
 *  - Dictionaries are imported statically — no async loading needed (client-only).
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import Cookies from 'js-cookie';
import {
  Locale,
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  toLocale,
  resolveKey,
  TFunction,
} from '@/i18n/index';

// Static dictionary imports — bundled with client JS, loaded once per build.
import enDict from '@/i18n/en.json';
import hiDict from '@/i18n/hi.json';

const DICTS: Record<Locale, Record<string, unknown>> = {
  en: enDict as Record<string, unknown>,
  hi: hiDict as Record<string, unknown>,
};

/* ──────────────────────────────────────────────────────────
   Context shape
─────────────────────────────────────────────────────────── */
interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TFunction;
  isLocaleSelected: boolean; // false = first visit, show language selection modal
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

/* ──────────────────────────────────────────────────────────
   Provider
─────────────────────────────────────────────────────────── */
export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  // null = not yet resolved (prevents flash)
  const [isLocaleSelected, setIsLocaleSelected] = useState(false);
  const [mounted, setMounted] = useState(false);

  // On mount: read cookie to restore locale
  useEffect(() => {
    const saved = Cookies.get(LOCALE_COOKIE);
    if (saved && (saved === 'en' || saved === 'hi')) {
      setLocaleState(saved as Locale);
      setIsLocaleSelected(true);
    } else {
      // No cookie: first visit — show language selection modal
      setIsLocaleSelected(false);
    }
    setMounted(true);
  }, []);

  // Keep document.documentElement.lang & locale-hi class in sync
  useEffect(() => {
    if (mounted) {
      document.documentElement.lang = locale;
      document.documentElement.classList.toggle('locale-hi', locale === 'hi');
    }
  }, [locale, mounted]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    setIsLocaleSelected(true);
    Cookies.set(LOCALE_COOKIE, newLocale, {
      expires: LOCALE_COOKIE_MAX_AGE / 86400, // js-cookie uses days
      path: '/',
      sameSite: 'lax',
    });
    document.documentElement.lang = newLocale;
    document.documentElement.classList.toggle('locale-hi', newLocale === 'hi');
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }, []);

  // Translation function — resolves nested dot-notation keys
  const t: TFunction = useCallback(
    (key: string, fallback?: string): string => {
      const dict = DICTS[locale];
      const resolved = resolveKey(dict, key);
      // If resolved equals the key (not found), try English fallback
      if (resolved === key && locale !== DEFAULT_LOCALE) {
        const enResolved = resolveKey(DICTS[DEFAULT_LOCALE], key);
        return enResolved !== key ? enResolved : (fallback ?? key);
      }
      return resolved !== key ? resolved : (fallback ?? key);
    },
    [locale]
  );

  const value = useMemo(
    () => ({ locale, setLocale, t, isLocaleSelected }),
    [locale, setLocale, t, isLocaleSelected]
  );

  // Prevent hydration mismatch: render children immediately (SSR uses default),
  // then hydrate from cookie on client.
  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}

/* ──────────────────────────────────────────────────────────
   Hooks
─────────────────────────────────────────────────────────── */

/** Access locale state and setLocale. */
export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}

/** Access translation function t(). */
export function useTranslation() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useTranslation must be used within LocaleProvider');
  return { t: ctx.t, locale: ctx.locale };
}
