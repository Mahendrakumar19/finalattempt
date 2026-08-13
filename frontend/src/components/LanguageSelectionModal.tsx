'use client';

/**
 * LanguageSelectionModal.tsx
 * Full-screen language selection overlay shown on first visit (when no NEXT_LOCALE
 * cookie is present). After the user selects a language, the cookie is set and the
 * modal disappears — it never shows again on subsequent visits/refreshes.
 *
 * Behavior:
 * - Rendered inside LocaleProvider (reads isLocaleSelected).
 * - Shown only when isLocaleSelected === false (no cookie on first render).
 * - On selection: calls setLocale() → sets cookie → hides modal.
 * - Language switch does NOT reload the page — the LocaleContext update triggers
 *   a React re-render across all components using useTranslation().
 */

import { useState, useEffect } from 'react';
import { useLocale } from '@/context/LocaleContext';
import type { Locale } from '@/i18n/index';
// import { Sparkles, Globe } from 'lucide-react';

export default function LanguageSelectionModal() {
  const { isLocaleSelected, setLocale } = useLocale();
  const [visible, setVisible] = useState(false);
  const [animateOut, setAnimateOut] = useState(false);

  // Only show after mount (prevents SSR/hydration flash)
  useEffect(() => {
    if (!isLocaleSelected) {
      // Small delay so the page renders first — avoids blocking initial paint
      const timer = setTimeout(() => setVisible(true), 200);
      return () => clearTimeout(timer);
    }
  }, [isLocaleSelected]);

  if (!visible) return null;

  const handleSelect = (lang: Locale) => {
    setAnimateOut(true);
    // Short delay for the exit animation, then hide and set locale
    setTimeout(() => {
      setVisible(false);
      setLocale(lang);
    }, 350);
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-opacity duration-300 ${
        animateOut ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        background: 'linear-gradient(135deg, #020617 0%, #0F172A 40%, #1a1200 70%, #0F172A 100%)',
        backdropFilter: 'blur(12px)',
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Select your preferred language"
    >
      {/* Background decorative glows */}
      <div
        className="absolute -left-20 -top-20 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(245,158,11,0.18) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        className="absolute -right-20 -bottom-20 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Modal card */}
      <div
        className={`relative z-10 w-full max-w-lg rounded-3xl border border-white/10 p-8 sm:p-10 shadow-2xl transition-all duration-300 ${
          animateOut ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
        style={{ background: 'rgba(2,6,23,0.92)', backdropFilter: 'blur(32px)' }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          {/* <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-5 mx-auto">
            <Globe className="w-7 h-7 text-amber-400" />
          </div> */}

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4">
            {/* <Sparkles className="w-3.5 h-3.5 text-amber-400" /> */}
            <span className="text-amber-300 font-inlander text-s font-bold uppercase tracking-widest">
              Final Attempt
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 leading-tight">
            Choose Your Language
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            अपनी भाषा चुनें — Select your preferred language to continue.
          </p>
        </div>

        {/* Language cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* English */}
          <button
            id="lang-select-en"
            onClick={() => handleSelect('en')}
            className="group relative flex flex-col items-center gap-4 p-6 rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-amber-500/40 transition-all duration-200 hover:scale-[1.02] active:scale-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          >
            {/* <span className="text-4xl" role="img" aria-label="English">EN</span> */}
            <div className="text-center">
              <p className="text-white font-bold text-base mb-1">English</p>
              <p className="text-slate-400 text-xs leading-relaxed">
                View website in English
              </p>
            </div>
            <div className="absolute bottom-3 right-3 w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-amber-400 text-[10px]">→</span>
            </div>
          </button>

          {/* Hindi */}
          <button
            id="lang-select-hi"
            onClick={() => handleSelect('hi')}
            className="group relative flex flex-col items-center gap-4 p-6 rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-amber-500/40 transition-all duration-200 hover:scale-[1.02] active:scale-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          >
            {/* <span className="text-4xl" role="img" aria-label="Hindi">HI</span> */}
            <div className="text-center">
              <p className="text-white font-bold text-base mb-1">हिंदी</p>
              <p className="text-slate-400 text-xs leading-relaxed">
                वेबसाइट हिंदी में देखें
              </p>
            </div>
            <div className="absolute bottom-3 right-3 w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-amber-400 text-[10px]">→</span>
            </div>
          </button>
        </div>

        {/* Footer note */}
        <p className="mt-6 text-center text-slate-600 text-xs">
          You can change your language preference anytime from the header.
          <br />
          <span className="text-slate-700">भाषा को हेडर से कभी भी बदला जा सकता है।</span>
        </p>
      </div>
    </div>
  );
}
