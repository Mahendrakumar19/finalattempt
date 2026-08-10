'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronRight, FileText } from 'lucide-react';
import { db, DynamicCurrentAffairEdition } from '@/services/db';

export default function YearlyEditionsLanding() {
  const [editions, setEditions] = useState<DynamicCurrentAffairEdition[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeYear, setActiveYear] = useState<string>('');

  useEffect(() => {
    db.getDynamicCurrentAffairsEditions(false)
      .then(list => {
        setEditions(list || []);
        if (list && list.length > 0) {
          const latest = [...list].sort((a, b) => b.publishDate.localeCompare(a.publishDate))[0];
          setActiveYear(latest.publishDate.split('-')[0]);
        } else {
          setActiveYear(String(new Date().getFullYear()));
        }
      })
      .catch(err => console.error('Error loading yearly editions:', err))
      .finally(() => setLoading(false));
  }, []);

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    editions.forEach(ed => years.add(ed.publishDate.split('-')[0]));
    if (years.size === 0) {
      years.add('2026'); years.add('2025'); years.add('2024');
    }
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [editions]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-body space-y-8">
      {/* Back link */}
      <button
        onClick={() => typeof window !== 'undefined' && window.history.length > 1 ? window.history.back() : window.location.href = '/current-affairs'}
        className="text-xs font-bold text-amber-500 hover:text-amber-600 transition-colors flex items-center gap-1 w-fit cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Previous Page</span>
      </button>

      {/* Page Title */}
      <div className="border-b border-slate-200 dark:border-white/10 pb-4">
        <h1 className="text-3xl font-heading font-black text-slate-900 dark:text-white leading-tight">
          Year End Reviews / Yearly Compilations
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Browse annual current affairs round-ups and reviews by year.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Left Sidebar Menu */}
        <aside className="lg:col-span-1 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-3xl p-5 space-y-4">
          <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Downloads / Archives</h3>
          <nav className="space-y-1">
            {[
              { name: 'News Today', href: '/current-affairs/daily' },
              { name: 'Weekly Focus', href: '/current-affairs/weekly' },
              { name: 'Monthly Magazine', href: '/current-affairs/monthly' },
              { name: 'Year End Reviews', href: '/current-affairs/yearly', active: true },
            ].map(item => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  item.active
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                <span>{item.name}</span>
                <ChevronRight className="w-3.5 h-3.5 opacity-70" />
              </Link>
            ))}
          </nav>
        </aside>

        {/* Right Main Accordions */}
        <main className="lg:col-span-3 space-y-8">
          {loading ? (
            <div className="text-slate-500 text-xs font-semibold py-8">Loading year end reviews…</div>
          ) : (
            availableYears.map(yr => {
              const isYearActive = yr === activeYear;

              return (
                <div key={yr} className="space-y-4">
                  {/* Year Header / Collapsible */}
                  <button
                    onClick={() => setActiveYear(yr === activeYear ? '' : yr)}
                    className="w-full flex items-center justify-between py-2 border-b border-slate-200 dark:border-white/10 cursor-pointer group text-left"
                  >
                    <h2 className="text-2xl font-heading font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                      {yr}
                    </h2>
                    <span className="text-xl font-bold text-slate-400 group-hover:text-slate-600">
                      {isYearActive ? '−' : '+'}
                    </span>
                  </button>

                  {/* Year Content Cards — Real links to year archive */}
                  {isYearActive && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 space-y-4 shadow-xs hover:border-blue-500/40 transition-all">
                        <div className="flex items-start gap-3">
                          <FileText className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-xs font-black text-slate-900 dark:text-white leading-snug">
                              Annual Current Affairs Review & Compilation: {yr}
                            </h4>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/5 text-xs font-bold text-blue-600 dark:text-blue-400">
                          <Link href={`/current-affairs/yearly/${yr}`} className="hover:underline flex items-center gap-1">
                            📖 Read
                          </Link>
                          <Link href={`/current-affairs/yearly/${yr}`} className="text-slate-400 hover:text-slate-600 flex items-center gap-1">
                            📥 Download
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </main>
      </div>
    </div>
  );
}
