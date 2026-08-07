'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Calendar, ArrowLeft, ArrowRight } from 'lucide-react';
import { db, DynamicCurrentAffairEdition } from '@/services/db';

const MONTH_LABELS: Record<string, string> = {
  '01': 'January', '02': 'February', '03': 'March', '04': 'April',
  '05': 'May',     '06': 'June',     '07': 'July',   '08': 'August',
  '09': 'September','10': 'October', '11': 'November','12': 'December',
};

export default function DailyEditionsList() {
  const [editions, setEditions] = useState<DynamicCurrentAffairEdition[]>([]);
  const [loading, setLoading]   = useState(true);

  const [selectedYear,  setSelectedYear]  = useState<string>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');

  useEffect(() => {
    db.getDynamicCurrentAffairsEditions(false)
      .then(list => setEditions(list || []))
      .catch(err => console.error('Error loading daily editions:', err))
      .finally(() => setLoading(false));
  }, []);

  // ── derive available years & months from actual data ──────────────────────
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    editions.forEach(ed => years.add(ed.publishDate.split('-')[0]));
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [editions]);

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    editions.forEach(ed => {
      const [yr, mo] = ed.publishDate.split('-');
      if (selectedYear === 'ALL' || yr === selectedYear) months.add(mo);
    });
    return Array.from(months).sort();
  }, [editions, selectedYear]);

  // ── filtered editions ─────────────────────────────────────────────────────
  const filteredEditions = useMemo(() => editions.filter(ed => {
    const [yr, mo] = ed.publishDate.split('-');
    if (selectedYear  !== 'ALL' && yr !== selectedYear)  return false;
    if (selectedMonth !== 'ALL' && mo !== selectedMonth) return false;
    return true;
  }), [editions, selectedYear, selectedMonth]);

  const handleYearChange = (yr: string) => {
    setSelectedYear(yr);
    setSelectedMonth('ALL'); // reset month when year changes
  };

  const hasFilters = selectedYear !== 'ALL' || selectedMonth !== 'ALL';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 font-body space-y-8">
      {/* Back */}
      <Link
        href="/current-affairs"
        className="text-xs font-bold text-amber-500 hover:text-amber-600 transition-colors flex items-center gap-1 w-fit"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Current Affairs</span>
      </Link>

      {/* Header + Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 dark:border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-heading font-black text-slate-900 dark:text-white leading-tight">
            Daily Current Affairs
          </h1>
          <p className="text-xs text-slate-500 max-w-xl mt-1">
            {loading
              ? 'Loading editions…'
              : editions.length === 0
              ? 'No editions published yet.'
              : `${editions.length} edition${editions.length === 1 ? '' : 's'} available — filter by year or month.`}
          </p>
        </div>

        {/* Dynamic filters — only shown when data exists */}
        {!loading && availableYears.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-white/10">
            <Calendar className="w-4 h-4 text-amber-500 shrink-0" />

            {/* Year */}
            <select
              value={selectedYear}
              onChange={e => handleYearChange(e.target.value)}
              className="px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none text-slate-900 dark:text-white font-bold cursor-pointer"
            >
              <option value="ALL">All Years</option>
              {availableYears.map(yr => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>

            {/* Month — only years with data */}
            {availableMonths.length > 0 && (
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none text-slate-900 dark:text-white font-bold cursor-pointer"
              >
                <option value="ALL">All Months</option>
                {availableMonths.map(mo => (
                  <option key={mo} value={mo}>{MONTH_LABELS[mo] || mo}</option>
                ))}
              </select>
            )}

            {hasFilters && (
              <button
                onClick={() => { setSelectedYear('ALL'); setSelectedMonth('ALL'); }}
                className="px-3 py-2 text-xs font-bold text-amber-600 hover:text-amber-700 bg-amber-500/10 rounded-xl cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-slate-500 text-xs font-semibold">Loading daily editions…</div>
      ) : filteredEditions.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/[0.06] rounded-3xl space-y-3">
          <Calendar className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="font-heading font-bold text-sm text-slate-700 dark:text-slate-300">
            {editions.length === 0 ? 'No editions published yet.' : 'No editions for this filter.'}
          </h3>
          {hasFilters && (
            <button
              onClick={() => { setSelectedYear('ALL'); setSelectedMonth('ALL'); }}
              className="text-xs font-bold text-amber-500 hover:underline cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredEditions.map(ed => {
            const dateObj      = new Date(ed.publishDate + 'T00:00:00');
            const formattedDate = dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
            const nationalCount      = ed.articles?.filter(a => a.category === 'NATIONAL').length || 0;
            const internationalCount = ed.articles?.filter(a => a.category === 'INTERNATIONAL').length || 0;
            const biharCount         = ed.articles?.filter(a => a.category === 'BIHAR').length || 0;

            return (
              <div
                key={ed.id}
                className="bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/[0.06] rounded-3xl p-6 flex flex-col justify-between hover:border-amber-500/20 hover:shadow-md transition-all group"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                      <Calendar className="w-4 h-4" />
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{ed.publishDate}</span>
                  </div>

                  <h3 className="font-heading font-black text-base text-slate-950 dark:text-white group-hover:text-amber-500 transition-colors">
                    {formattedDate} Edition
                  </h3>

                  <p className="text-[11px] text-slate-500 line-clamp-3 leading-relaxed">
                    {ed.summary || "Summary of today's important issues curated for high-weightage exams."}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-2">
                    <span className="px-2 py-0.5 rounded-lg bg-amber-500/5 text-amber-600 dark:text-amber-400 text-[9px] font-bold">National ({nationalCount})</span>
                    <span className="px-2 py-0.5 rounded-lg bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 text-[9px] font-bold">International ({internationalCount})</span>
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold">Bihar ({biharCount})</span>
                  </div>
                </div>

                <div className="pt-5 mt-5 border-t border-slate-50 dark:border-white/[0.02]">
                  <Link
                    href={`/current-affairs/daily/${ed.publishDate}`}
                    className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-all cursor-pointer border border-slate-100 dark:border-white/[0.04]"
                  >
                    <span>Read Edition</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
