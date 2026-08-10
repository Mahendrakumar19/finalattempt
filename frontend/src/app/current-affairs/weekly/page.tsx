'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronRight, Layers } from 'lucide-react';
import { db, DynamicCurrentAffairEdition } from '@/services/db';

const MONTH_NAMES = ['january','february','march','april','may','june','july','august','september','october','november','december'];
const MONTH_DISPLAY = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function getISOWeek(dateStr: string): { week: number; year: number; month: string } {
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return { week: 0, year: 0, month: '01' };
  const month = String(d.getMonth() + 1).padStart(2, '0');
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const ys = new Date(d.getFullYear(), 0, 1);
  return { week: Math.ceil((((d.getTime() - ys.getTime()) / 86400000) + 1) / 7), year: d.getFullYear(), month };
}

export default function WeeklyEditionsLanding() {
  const [editions, setEditions] = useState<DynamicCurrentAffairEdition[]>([]);
  const [loading, setLoading] = useState(true);

  // Default active year & month or selected from accordions
  const [activeYear, setActiveYear] = useState<string>('');
  const [activeMonth, setActiveMonth] = useState<string>('');

  useEffect(() => {
    db.getDynamicCurrentAffairsEditions(false)
      .then(list => {
        setEditions(list || []);
        if (list && list.length > 0) {
          const latest = [...list].sort((a, b) => b.publishDate.localeCompare(a.publishDate))[0];
          const [yr, mo] = latest.publishDate.split('-');
          setActiveYear(yr);
          setActiveMonth(mo);
        } else {
          setActiveYear(String(new Date().getFullYear()));
          setActiveMonth(String(new Date().getMonth() + 1).padStart(2, '0'));
        }
      })
      .catch(err => console.error('Error loading weekly editions:', err))
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

  const weeklyGroups = useMemo(() => {
    const map = new Map<string, { week: number; year: number; month: string; editionsCount: number; sampleDate: string }>();
    editions.forEach(ed => {
      const { week, year, month } = getISOWeek(ed.publishDate);
      if (week > 0 && year > 0) {
        const key = `week-${week}-${year}`;
        if (map.has(key)) {
          map.get(key)!.editionsCount++;
        } else {
          map.set(key, { week, year, month, editionsCount: 1, sampleDate: ed.publishDate });
        }
      }
    });
    return Array.from(map.values());
  }, [editions]);

  // Current month active weekly digests
  const currentMonthWeeks = useMemo(() => {
    return weeklyGroups.filter(w => String(w.year) === activeYear && w.month === activeMonth);
  }, [weeklyGroups, activeYear, activeMonth]);

  const activeMonthIdx = parseInt(activeMonth, 10) - 1;
  const activeMonthName = MONTH_DISPLAY[activeMonthIdx] || 'Month';

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
          Weekly Focus / Weekly Current Affairs
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Browse weekly compilations by year and month.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Left Sidebar Menu */}
        <aside className="lg:col-span-1 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-3xl p-5 space-y-4">
          <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Downloads / Archives</h3>
          <nav className="space-y-1">
            {[
              { name: 'News Today', href: '/current-affairs/daily' },
              { name: 'Weekly Focus', href: '/current-affairs/weekly', active: true },
              { name: 'Monthly Magazine', href: '/current-affairs/monthly' },
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

        {/* Right Main Content */}
        <main className="lg:col-span-3 space-y-8">
          {loading ? (
            <div className="text-slate-500 text-xs font-semibold py-8">Loading weekly digests…</div>
          ) : (
            availableYears.map(yr => {
              const yrEditions = editions.filter(ed => ed.publishDate.startsWith(yr));
              const isYearActive = yr === activeYear;

              return (
                <div key={yr} className="space-y-4">
                  {/* Year Header / Toggle */}
                  <button
                    onClick={() => {
                      setActiveYear(yr);
                      setActiveMonth('08');
                    }}
                    className="w-full flex items-center justify-between py-2 border-b border-slate-200 dark:border-white/10 cursor-pointer group text-left"
                  >
                    <h2 className="text-2xl font-heading font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                      {yr} {isYearActive && activeMonthName ? `- ${activeMonthName}` : ''}
                    </h2>
                    <span className="text-xl font-bold text-slate-400 group-hover:text-slate-600">
                      {isYearActive ? '−' : '+'}
                    </span>
                  </button>

                  {/* If Year Active -> Show Weekly Cards for selected Month + Month Buttons */}
                  {isYearActive && (
                    <div className="space-y-6 pt-2">
                      {currentMonthWeeks.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          {currentMonthWeeks.map(item => (
                            <div
                              key={`week-${item.week}-${item.year}`}
                              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex flex-col justify-between shadow-xs hover:border-blue-500/40 transition-all space-y-3"
                            >
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-slate-400">
                                  <Layers className="w-4 h-4 text-blue-500 shrink-0" />
                                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white line-clamp-1">
                                    Weekly Focus (Week {item.week})
                                  </h4>
                                </div>
                                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                                  Consolidated weekly analysis covering {item.editionsCount} edition(s).
                                </p>
                              </div>

                              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/5 text-[11px] font-bold">
                                <Link
                                  href={`/current-affairs/weekly/week-${item.week}-${item.year}`}
                                  className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                >
                                  📖 Read
                                </Link>
                                <Link
                                  href={`/current-affairs/weekly/week-${item.week}-${item.year}`}
                                  className="text-slate-400 hover:text-slate-600 flex items-center gap-1"
                                >
                                  📥 Download
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 rounded-2xl space-y-2">
                          <p className="text-xs text-slate-500 font-semibold">No weekly data published for {activeMonthName} {yr} yet.</p>
                        </div>
                      )}

                      {/* Month Buttons Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                        {MONTH_DISPLAY.map((mName, mIdx) => {
                          const mNum = String(mIdx + 1).padStart(2, '0');
                          const isMonthActive = activeMonth === mNum;
                          const hasEditions = yrEditions.some(ed => ed.publishDate.split('-')[1] === mNum);

                          return (
                            <button
                              key={mName}
                              onClick={() => {
                                setActiveYear(yr);
                                setActiveMonth(mNum);
                              }}
                              className={`p-3 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                                isMonthActive
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                  : hasEditions
                                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white hover:border-blue-500'
                                  : 'bg-slate-50 dark:bg-slate-900/30 border-slate-100 dark:border-white/5 text-slate-400'
                              }`}
                            >
                              {mName}
                            </button>
                          );
                        })}
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
