'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Layers, ArrowLeft, ArrowRight, Calendar } from 'lucide-react';
import { db, DynamicCurrentAffairEdition, DynamicCurrentAffairArticle } from '@/services/db';

// ── ISO week helper ────────────────────────────────────────────────────────
function getISOWeekAndYear(dateStr: string): { week: number; year: number } {
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return { week: 0, year: 0 };
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { week: weekNo, year: d.getFullYear() };
}

export default function WeeklyCompendiumViewer() {
  const params   = useParams();
  const router   = useRouter();
  const weekStr  = params.week as string; // week-29-2026

  const [editions, setEditions] = useState<DynamicCurrentAffairEdition[]>([]);
  const [loading, setLoading]   = useState(true);

  // Parse current URL params
  const urlParts   = weekStr.split('-');
  const targetWeek = parseInt(urlParts[1], 10);
  const targetYear = parseInt(urlParts[2], 10);

  // Filter UI state (starts from URL)
  const [selectedYear, setSelectedYear] = useState<number>(targetYear);
  const [selectedWeek, setSelectedWeek] = useState<number>(targetWeek);

  useEffect(() => {
    db.getDynamicCurrentAffairsEditions(false)
      .then(list => setEditions(list || []))
      .catch(err => console.error('Error loading editions for weekly:', err))
      .finally(() => setLoading(false));
  }, []);

  // ── derive available years from actual data ───────────────────────────────
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    editions.forEach(ed => {
      const { year } = getISOWeekAndYear(ed.publishDate);
      if (year > 0) years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [editions]);

  // ── derive available weeks for selected year (only weeks with real data) ──
  const availableWeeks = useMemo(() => {
    const weeks = new Set<number>();
    editions.forEach(ed => {
      const { week, year } = getISOWeekAndYear(ed.publishDate);
      if (year === selectedYear && week > 0) weeks.add(week);
    });
    return Array.from(weeks).sort((a, b) => b - a);
  }, [editions, selectedYear]);

  // ── articles for the currently viewed week ────────────────────────────────
  const weeklyEditions = useMemo(() =>
    editions.filter(ed => {
      const { week, year } = getISOWeekAndYear(ed.publishDate);
      return week === selectedWeek && year === selectedYear;
    }), [editions, selectedWeek, selectedYear]);

  const allArticles: DynamicCurrentAffairArticle[] = weeklyEditions.flatMap(ed => ed.articles || []);

  // Navigate to the selected week URL
  const navigate = (yr: number, wk: number) => {
    router.push(`/current-affairs/weekly/week-${wk}-${yr}`);
  };

  const handleYearChange = (yr: number) => {
    setSelectedYear(yr);
    setSelectedWeek(0); // will be resolved below once availableWeeks recomputes
  };

  // Auto-select first available week when year changes
  useEffect(() => {
    if (availableWeeks.length > 0 && !availableWeeks.includes(selectedWeek)) {
      setSelectedWeek(availableWeeks[0]);
    }
  }, [availableWeeks]);

  // Sync URL whenever selection changes
  useEffect(() => {
    if (selectedWeek > 0) {
      navigate(selectedYear, selectedWeek);
    }
  }, [selectedYear, selectedWeek]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 font-body space-y-8">
      {/* Back */}
      <Link
        href="/current-affairs"
        className="text-xs font-bold text-amber-500 hover:text-amber-600 transition-colors flex items-center gap-1 w-fit"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Current Affairs</span>
      </Link>

      {/* Header + Dynamic Filters */}
      <div className="bg-linear-to-br from-slate-900 via-indigo-950 to-slate-950 text-white rounded-3xl p-8 sm:p-10 border border-white/[0.06] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg w-fit flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            <span>Weekly Current Affairs</span>
          </span>
          <h1 className="text-3xl font-heading font-black tracking-tight">
            {selectedWeek > 0 ? `Week ${selectedWeek}, ${selectedYear}` : `${selectedYear}`}
          </h1>
          <p className="text-xs text-slate-400 max-w-xl">
            {loading
              ? 'Loading…'
              : availableYears.length === 0
              ? 'No weekly content published yet.'
              : `Showing content from Week ${selectedWeek}, ${selectedYear}.`}
          </p>
        </div>

        {/* Dynamic selectors — only show when data is present */}
        {!loading && availableYears.length > 0 && (
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-3 shrink-0 min-w-[180px]">
            {/* Year selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Year</label>
              <select
                value={selectedYear}
                onChange={e => handleYearChange(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-900 border border-white/20 rounded-xl text-xs font-bold text-white outline-none cursor-pointer"
              >
                {availableYears.map(yr => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>

            {/* Week selector — only weeks that have real data */}
            {availableWeeks.length > 0 && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Week</label>
                <select
                  value={selectedWeek}
                  onChange={e => setSelectedWeek(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/20 rounded-xl text-xs font-bold text-white outline-none cursor-pointer"
                >
                  {availableWeeks.map(wk => (
                    <option key={wk} value={wk}>Week {wk}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-slate-500 text-xs font-semibold">Loading weekly view…</div>
      ) : availableYears.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/[0.06] rounded-3xl space-y-3">
          <Layers className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="font-heading font-bold text-sm text-slate-700 dark:text-slate-300">No weekly content published yet.</h3>
          <p className="text-xs text-slate-400">Content will appear here once the admin publishes daily current affairs.</p>
        </div>
      ) : weeklyEditions.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/[0.06] rounded-3xl space-y-3">
          <Layers className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="font-heading font-bold text-sm text-slate-700 dark:text-slate-300">
            No updates for Week {selectedWeek}, {selectedYear}
          </h3>
          {availableWeeks.length > 0 && (
            <p className="text-xs text-slate-400">
              Try selecting a different week from the dropdown above.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Daily edition links */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/[0.06] p-6 rounded-3xl shadow-xs space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider border-b border-slate-50 dark:border-white/[0.02] pb-2">
              Daily Editions This Week
            </h3>
            <div className="space-y-3">
              {weeklyEditions.map(ed => {
                const dateObj       = new Date(ed.publishDate + 'T00:00:00');
                const formattedDate = dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                return (
                  <Link
                    key={ed.id}
                    href={`/current-affairs/daily/${ed.publishDate}`}
                    className="flex justify-between items-center p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/40 dark:hover:bg-slate-900 rounded-xl transition-all group"
                  >
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-amber-500 transition-colors">
                      {formattedDate} Edition
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Compiled articles */}
          <div className="lg:col-span-8 space-y-6">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex justify-between items-center">
              <span>All Articles ({allArticles.length})</span>
              <span className="text-[10px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-lg font-bold">Weekly Digest</span>
            </h3>

            <div className="space-y-4">
              {allArticles.map(art => (
                <Link
                  key={art.id}
                  href={`/current-affairs/daily/${art.publishedDate}/${art.category.toLowerCase()}/${art.slug}`}
                  className="block p-6 bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/[0.06] rounded-3xl hover:border-amber-500/20 hover:shadow-xs transition-all group"
                >
                  <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 mb-2">
                    <span className="text-amber-500 uppercase tracking-widest">{art.category}</span>
                    <span>{art.publishedDate}</span>
                  </div>
                  <h4 className="font-heading font-black text-sm text-slate-950 dark:text-white group-hover:text-amber-500 transition-colors">
                    {art.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {art.summary}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
