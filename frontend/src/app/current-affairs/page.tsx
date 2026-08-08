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

  useEffect(() => {
    db.getDynamicCurrentAffairsEditions(false)
      .then(list => setEditions(list || []))
      .catch(err => console.error('Error loading current affairs editions:', err));
  }, []);

  // ── Derive dynamic links from real data ─────────────────────────────────


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
          Browse by topic or select a frequency below.
        </p>
      </div>

      {/* ── Featured Topic Sections ──────────────────────────────────────── */}
      <div className="space-y-3">
        <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          Featured Topics
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* National */}
          <Link
            href="/current-affairs/daily?topic=national"
            className="group flex items-center gap-4 p-5 rounded-2xl border border-blue-500/25 bg-blue-500/5 hover:bg-blue-500/10 hover:border-blue-500/50 transition-all"
          >
            <div className="w-11 h-11 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0 text-lg">
              🇮🇳
            </div>
            <div className="min-w-0">
              <h3 className="font-heading font-black text-slate-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                National
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">India-focused news &amp; policy</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all ml-auto shrink-0" />
          </Link>

          {/* International */}
          <Link
            href="/current-affairs/daily?topic=international"
            className="group flex items-center gap-4 p-5 rounded-2xl border border-violet-500/25 bg-violet-500/5 hover:bg-violet-500/10 hover:border-violet-500/50 transition-all"
          >
            <div className="w-11 h-11 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center shrink-0 text-lg">
              🌐
            </div>
            <div className="min-w-0">
              <h3 className="font-heading font-black text-slate-900 dark:text-white text-sm group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                International
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Global affairs &amp; world events</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-violet-500 group-hover:translate-x-1 transition-all ml-auto shrink-0" />
          </Link>

          {/* Bihar Special */}
          <Link
            href="/current-affairs/daily?topic=bihar"
            className="group flex items-center gap-4 p-5 rounded-2xl border border-amber-500/25 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/50 transition-all"
          >
            <div className="w-11 h-11 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center shrink-0 text-lg">
              📍
            </div>
            <div className="min-w-0">
              <h3 className="font-heading font-black text-slate-900 dark:text-white text-sm group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                Bihar Special
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Bihar-specific news &amp; BPSC focus</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-1 transition-all ml-auto shrink-0" />
          </Link>
        </div>
      </div>

      {/* ── By Frequency ─────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          Browse by Frequency
        </p>
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
                Monthly current affairs notes and PDFs.
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
    </div>
  );
}
