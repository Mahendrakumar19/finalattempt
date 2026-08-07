'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Award, ArrowLeft, ArrowRight, Calendar } from 'lucide-react';
import { db, DynamicCurrentAffairEdition } from '@/services/db';

const MONTH_NAMES_LIST = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const MONTH_CODE: Record<string, string> = {
  January:'01', February:'02', March:'03', April:'04', May:'05', June:'06',
  July:'07', August:'08', September:'09', October:'10', November:'11', December:'12',
};

export default function YearlyCompendiumViewer() {
  const params   = useParams();
  const router   = useRouter();
  const yearStr  = params.year as string;

  const [editions, setEditions] = useState<DynamicCurrentAffairEdition[]>([]);
  const [loading, setLoading]   = useState(true);
  const [selectedYear, setSelectedYear] = useState<number>(parseInt(yearStr, 10));

  useEffect(() => {
    db.getDynamicCurrentAffairsEditions(false)
      .then(list => setEditions(list || []))
      .catch(err => console.error('Error loading yearly editions:', err))
      .finally(() => setLoading(false));
  }, []);

  // ── derive years that actually have content ───────────────────────────────
  const availableYears = useMemo(() => {
    const yrs = new Set<number>();
    editions.forEach(ed => yrs.add(Number(ed.publishDate.split('-')[0])));
    return Array.from(yrs).sort((a, b) => b - a);
  }, [editions]);

  // Sync URL when year changes
  const handleYearChange = (yr: number) => {
    setSelectedYear(yr);
    router.push(`/current-affairs/yearly/${yr}`);
  };

  // ── per-month article count for this year ─────────────────────────────────
  const monthStats = useMemo(() => {
    const stats: Record<string, number> = {};
    MONTH_NAMES_LIST.forEach(m => { stats[m] = 0; });
    editions.forEach(ed => {
      const [yr, mo] = ed.publishDate.split('-');
      if (Number(yr) === selectedYear) {
        const monthIdx = parseInt(mo, 10) - 1;
        const monthName = MONTH_NAMES_LIST[monthIdx];
        if (monthName) stats[monthName] = (stats[monthName] || 0) + (ed.articles?.length || 0);
      }
    });
    return stats;
  }, [editions, selectedYear]);

  // Only months that have content
  const monthsWithContent = MONTH_NAMES_LIST.filter(m => (monthStats[m] || 0) > 0);

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

      {/* Header + Year Selector */}
      <div className="bg-linear-to-br from-slate-900 via-indigo-950 to-slate-950 text-white rounded-3xl p-8 sm:p-10 border border-white/[0.06] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg w-fit flex items-center gap-1">
            <Award className="w-4 h-4" />
            <span>Yearly Current Affairs</span>
          </span>
          <h1 className="text-3xl font-heading font-black tracking-tight">{selectedYear} — Monthly Index</h1>
          <p className="text-xs text-slate-400 max-w-2xl">
            {loading
              ? 'Loading…'
              : availableYears.length === 0
              ? 'No content published yet.'
              : `${monthsWithContent.length} month${monthsWithContent.length === 1 ? '' : 's'} with content in ${selectedYear}.`}
          </p>
        </div>

        {/* Dynamic year selector */}
        {!loading && availableYears.length > 0 && (
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-1.5 shrink-0">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Select Year</label>
            <select
              value={selectedYear}
              onChange={e => handleYearChange(Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-slate-900 border border-white/20 rounded-xl text-xs font-bold text-white outline-none cursor-pointer"
            >
              {availableYears.map(yr => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Month Grid */}
      {loading ? (
        <div className="text-slate-500 text-xs font-semibold">Generating yearly index…</div>
      ) : availableYears.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/[0.06] rounded-3xl space-y-3">
          <Award className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="font-heading font-bold text-sm text-slate-700 dark:text-slate-300">No content published yet.</h3>
        </div>
      ) : (
        <div className="space-y-6">
          <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-white/[0.06] pb-2">
            <Calendar className="w-4 h-4 text-amber-500" />
            <span>Months in {selectedYear}</span>
          </h2>

          {monthsWithContent.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/[0.06] rounded-3xl">
              <p className="text-sm text-slate-500">No content published for {selectedYear} yet.</p>
              {availableYears.filter(y => y !== selectedYear).length > 0 && (
                <p className="text-xs text-slate-400 mt-2">
                  Try selecting a different year from the dropdown above.
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {monthsWithContent.map(month => {
                const count    = monthStats[month] || 0;
                const paramName = `${month.toLowerCase()}-${selectedYear}`;

                return (
                  <Link
                    key={month}
                    href={`/current-affairs/monthly/${paramName}`}
                    className="bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/[0.06] rounded-3xl p-6 flex flex-col justify-between hover:border-amber-500/20 hover:shadow-md hover:-translate-y-0.5 transition-all group"
                  >
                    <div className="space-y-2">
                      <span className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                        <Calendar className="w-4 h-4" />
                      </span>
                      <h3 className="font-heading font-black text-lg text-slate-950 dark:text-white group-hover:text-amber-500 transition-colors">
                        {month} {selectedYear}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {count} article{count === 1 ? '' : 's'} published
                      </p>
                    </div>

                    <div className="pt-5 mt-5 border-t border-slate-50 dark:border-white/[0.02]">
                      <span className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all cursor-pointer">
                        <span>Read Month</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
