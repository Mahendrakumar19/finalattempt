'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, ChevronRight } from 'lucide-react';
import { db, DynamicCurrentAffairEdition } from '@/services/db';

const MONTH_NAMES = ['january','february','march','april','may','june','july','august','september','october','november','december'];
const MONTH_DISPLAY = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function MonthlyEditionsLanding() {
  const [editions, setEditions] = useState<DynamicCurrentAffairEdition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db.getDynamicCurrentAffairsEditions(false)
      .then(list => setEditions(list || []))
      .catch(err => console.error('Error loading monthly editions:', err))
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
      {/* Back button */}
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
          Monthly Current Affairs Magazines
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Browse monthly magazine compilations and archives by year.
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
              { name: 'Monthly Magazine', href: '/current-affairs/monthly', active: true },
              { name: 'Year End Reviews', href: '/current-affairs/yearly' },
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

        {/* Right Main Grid */}
        <main className="lg:col-span-3 space-y-8">
          {loading ? (
            <div className="text-slate-500 text-xs font-semibold py-8">Loading monthly magazines…</div>
          ) : (
            <div className="space-y-8">
              {availableYears.map(yr => {
                const yrEditions = editions.filter(ed => ed.publishDate.startsWith(yr));

                return (
                  <div key={yr} className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/[0.08] rounded-3xl p-6 space-y-4 shadow-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-3">
                      <h2 className="font-heading font-black text-xl text-slate-900 dark:text-white">{yr} Monthly Magazines</h2>
                      <span className="text-xs font-bold text-slate-400">
                        {yrEditions.length} Daily Editions Included
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {MONTH_DISPLAY.map((moName, idx) => {
                        const moNum = String(idx + 1).padStart(2, '0');
                        const moSlug = MONTH_NAMES[idx];
                        const hasEditions = yrEditions.some(ed => ed.publishDate.split('-')[1] === moNum);

                        return (
                          <Link
                            key={moSlug}
                            href={`/current-affairs/monthly/${moSlug}-${yr}`}
                            className={`p-4 rounded-2xl border flex items-center justify-between transition-all group ${
                              hasEditions
                                ? 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/50 text-slate-900 dark:text-white'
                                : 'bg-slate-50/50 dark:bg-slate-900/20 border-slate-100 dark:border-white/[0.04] text-slate-400 hover:text-slate-600'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <BookOpen className={`w-4 h-4 ${hasEditions ? 'text-emerald-500' : 'text-slate-400'}`} />
                              <span className="font-bold text-xs">{moName}</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
