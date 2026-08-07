'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { BookOpen, Layers, Award, Clock, ArrowRight } from 'lucide-react';
import { db, DynamicCurrentAffairEdition } from '@/services/db';

// Compute ISO week for a date string
function getISOWeek(dateStr: string): { week: number; year: number } {
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return { week: 0, year: 0 };
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const ys = new Date(d.getFullYear(), 0, 1);
  return { week: Math.ceil((((d.getTime() - ys.getTime()) / 86400000) + 1) / 7), year: d.getFullYear() };
}

const MONTH_NAMES = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

export default function CurrentAffairsLanding() {
  const [editions, setEditions] = useState<DynamicCurrentAffairEdition[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    db.getDynamicCurrentAffairsEditions(false)
      .then(list => setEditions(list || []))
      .catch(err => console.error('Error loading current affairs editions:', err))
      .finally(() => setLoading(false));
  }, []);

  // ── Derive dynamic links from real data ─────────────────────────────────
  // Most recent daily edition date
  const latestDailyHref = '/current-affairs/daily';

  // Most recent week with content
  const latestWeekHref = useMemo(() => {
    let bestWeek = 0, bestYear = 0;
    editions.forEach(ed => {
      const { week, year } = getISOWeek(ed.publishDate);
      if (year > bestYear || (year === bestYear && week > bestWeek)) {
        bestWeek = week; bestYear = year;
      }
    });
    if (bestWeek === 0) return '/current-affairs/weekly/week-1-2026';
    return `/current-affairs/weekly/week-${bestWeek}-${bestYear}`;
  }, [editions]);

  // Most recent month with content
  const latestMonthHref = useMemo(() => {
    let bestDate = '';
    editions.forEach(ed => {
      if (!bestDate || ed.publishDate > bestDate) bestDate = ed.publishDate;
    });
    if (!bestDate) return `/current-affairs/monthly/january-${new Date().getFullYear()}`;
    const [yr, mo] = bestDate.split('-');
    return `/current-affairs/monthly/${MONTH_NAMES[parseInt(mo, 10) - 1]}-${yr}`;
  }, [editions]);

  // Most recent year with content
  const latestYearHref = useMemo(() => {
    let bestYear = new Date().getFullYear();
    editions.forEach(ed => {
      const yr = parseInt(ed.publishDate.split('-')[0], 10);
      if (yr > bestYear) bestYear = yr;
    });
    return `/current-affairs/yearly/${bestYear}`;
  }, [editions]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 font-body space-y-12">
      {/* Page Title */}
      <div className="border-b border-slate-200 dark:border-white/10 pb-6">
        <h1 className="text-3xl sm:text-4xl font-heading font-black text-slate-900 dark:text-white tracking-tight">
          Current Affairs
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Select a frequency below to browse current affairs.
        </p>
      </div>

      {/* 4 Simple Frequency Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {/* Daily card */}
        <Link
          href="/current-affairs/daily"
          className="bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/[0.06] p-6 rounded-3xl space-y-4 hover:border-amber-500/30 hover:-translate-y-1 transition-all shadow-xs group"
        >
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-black text-lg text-slate-950 dark:text-white group-hover:text-amber-500 transition-colors">
              Daily
            </h3>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Read current affairs updated every day.
            </p>
          </div>
          <span className="text-[10px] font-bold uppercase text-amber-500 tracking-wider flex items-center gap-1">
            <span>View Daily</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </span>
        </Link>

        {/* Weekly card */}
        <Link
          href={latestWeekHref}
          className="bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/[0.06] p-6 rounded-3xl space-y-4 hover:border-amber-500/30 hover:-translate-y-1 transition-all shadow-xs group"
        >
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-black text-lg text-slate-950 dark:text-white group-hover:text-amber-500 transition-colors">
              Weekly
            </h3>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Weekly summary of all daily news updates.
            </p>
          </div>
          <span className="text-[10px] font-bold uppercase text-amber-500 tracking-wider flex items-center gap-1">
            <span>View Weekly</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </span>
        </Link>

        {/* Monthly card */}
        <Link
          href={latestMonthHref}
          className="bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/[0.06] p-6 rounded-3xl space-y-4 hover:border-amber-500/30 hover:-translate-y-1 transition-all shadow-xs group"
        >
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-black text-lg text-slate-950 dark:text-white group-hover:text-amber-500 transition-colors">
              Monthly
            </h3>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Monthly current affairs PDF summaries.
            </p>
          </div>
          <span className="text-[10px] font-bold uppercase text-amber-500 tracking-wider flex items-center gap-1">
            <span>View Monthly</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </span>
        </Link>

        {/* Yearly card */}
        <Link
          href={latestYearHref}
          className="bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/[0.06] p-6 rounded-3xl space-y-4 hover:border-amber-500/30 hover:-translate-y-1 transition-all shadow-xs group"
        >
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-550">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-black text-lg text-slate-950 dark:text-white group-hover:text-amber-500 transition-colors">
              Yearly
            </h3>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Full year news highlights and notes.
            </p>
          </div>
          <span className="text-[10px] font-bold uppercase text-amber-500 tracking-wider flex items-center gap-1">
            <span>View Yearly</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </span>
        </Link>
      </div>
    </div>
  );
}
