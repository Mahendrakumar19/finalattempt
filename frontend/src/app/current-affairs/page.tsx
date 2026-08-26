'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  Clock, Layers, BookOpen, Award, ArrowRight, ChevronRight, ChevronLeft,
  Flame, Globe, MapPin, Newspaper, RefreshCw, TrendingUp,
  Calendar, Zap, BookMarked, FileText, Search, X, Filter, ChevronDown
} from 'lucide-react';
import { db, DynamicCurrentAffairEdition } from '@/services/db';
import { useTranslation } from '@/context/LocaleContext';

/* ── helpers ─────────────────────────────────────────────────── */
function getISOWeek(dateStr: string): { week: number; year: number } {
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return { week: 0, year: 0 };
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const ys = new Date(d.getFullYear(), 0, 1);
  return { week: Math.ceil((((d.getTime() - ys.getTime()) / 86400000) + 1) / 7), year: d.getFullYear() };
}

const MONTH_NAMES = ['january','february','march','april','may','june','july','august','september','october','november','december'];
const MONTH_DISPLAY = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

/* ── Badge component ─────────────────────────────────────────── */
function Badge({ label, variant }: { label: string; variant: 'popular' | 'premium' | 'new' | 'hot' }) {
  const styles = {
    popular: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
    premium: 'bg-violet-500/20 text-violet-600 dark:text-violet-400 border-violet-500/30',
    new:     'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    hot:     'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30',
  };
  return (
    <span className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider border ${styles[variant]}`}>
      {label}
    </span>
  );
}

/* ── Sidebar nav item ────────────────────────────────────────── */
function SidebarItem({
  label, href, badge, isActive
}: { label: string; href: string; badge?: { label: string; variant: 'popular'|'premium'|'new'|'hot' }; isActive?: boolean }) {
  return (
    <Link
      href={href}
      className={`group flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
        isActive
          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25'
          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white border border-transparent'
      }`}
    >
      <span className="flex items-center gap-2 min-w-0">
        <ChevronRight className={`w-3 h-3 shrink-0 transition-transform ${isActive ? 'text-amber-500' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 group-hover:translate-x-0.5'}`} />
        <span className="truncate">{label}</span>
      </span>
      {badge && <Badge label={badge.label} variant={badge.variant} />}
    </Link>
  );
}

/* ── Sidebar section heading ─────────────────────────────────── */
function SidebarSection({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 px-1 pt-1 pb-1">
      <span className="text-amber-500">{icon}</span>
      <p className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{title}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════ */
export default function CurrentAffairsLanding() {
  const { t } = useTranslation();
  const [editions, setEditions] = useState<DynamicCurrentAffairEdition[]>([]);
  const [activeTopic, setActiveTopic] = useState<'all' | 'national' | 'international' | 'bihar' | 'arunachal'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showDateDropdown, setShowDateDropdown] = useState<boolean>(false);
  const [bannerCalDate, setBannerCalDate] = useState<Date>(new Date());

  const dateDropdownRef = useRef<HTMLDivElement>(null);

  // ── Date Navigator state ─────────────────────────────────────
  const [navYear,  setNavYear]  = useState<string>('');
  const [navMonth, setNavMonth] = useState<string>('');
  const [navWeek,  setNavWeek]  = useState<string>('');
  const [navDay,   setNavDay]   = useState<string>('');

  useEffect(() => {
    db.getDynamicCurrentAffairsEditions(false)
      .then(list => setEditions(list || []))
      .catch(err => console.error('Error loading current affairs editions:', err));
  }, []);

  // Close Date Dropdown on Outside Click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(e.target as Node)) {
        setShowDateDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const publishedDatesList = useMemo(() => {
    const datesSet = new Set<string>();
    if (Array.isArray(editions)) {
      editions.forEach(ed => {
        if (ed.publishDate) datesSet.add(ed.publishDate);
      });
    }
    return Array.from(datesSet).sort((a, b) => b.localeCompare(a));
  }, [editions]);

  const heroCalendarDays = useMemo(() => {
    const year = bannerCalDate.getFullYear();
    const month = bannerCalDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days: Array<{ day: number | null; dateStr: string | null; hasEdition: boolean; isSelected: boolean }> = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ day: null, dateStr: null, hasEdition: false, isSelected: false });
    }

    for (let d = 1; d <= totalDays; d++) {
      const mStr = String(month + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      const formatted = `${year}-${mStr}-${dStr}`;
      days.push({
        day: d,
        dateStr: formatted,
        hasEdition: publishedDatesList.includes(formatted),
        isSelected: formatted === selectedDate
      });
    }

    return days;
  }, [bannerCalDate, publishedDatesList, selectedDate]);

  // ── Derived hrefs ──────────────────────────────────────────
  const latestDailyHref = useMemo(() => {
    if (!Array.isArray(editions) || editions.length === 0) return '/current-affairs/daily';
    const latest = [...editions].sort((a, b) => (b.publishDate || '').localeCompare(a.publishDate || ''))[0];
    if (!latest || !latest.publishDate) return '/current-affairs/daily';
    return `/current-affairs/daily?date=${latest.publishDate}`;
  }, [editions]);

  const latestWeekHref = useMemo(() => {
    let bestWeek = 0, bestYear = 0;
    if (Array.isArray(editions)) {
      editions.forEach(ed => {
        if (!ed.publishDate) return;
        const { week, year } = getISOWeek(ed.publishDate);
        if (year > bestYear || (year === bestYear && week > bestWeek)) { bestWeek = week; bestYear = year; }
      });
    }
    if (bestWeek === 0) return '/current-affairs/weekly/week-1-2026';
    return `/current-affairs/weekly/week-${bestWeek}-${bestYear}`;
  }, [editions]);

  const latestMonthHref = useMemo(() => {
    let bestDate = '';
    if (Array.isArray(editions)) {
      editions.forEach(ed => { if (ed.publishDate && (!bestDate || ed.publishDate > bestDate)) bestDate = ed.publishDate; });
    }
    if (!bestDate || !bestDate.includes('-')) return `/current-affairs/monthly/january-${new Date().getFullYear()}`;
    const parts = bestDate.split('-');
    const moIdx = parseInt(parts[1] || '1', 10) - 1;
    return `/current-affairs/monthly/${MONTH_NAMES[moIdx] || 'january'}-${parts[0]}`;
  }, [editions]);

  const latestYearHref = useMemo(() => {
    let bestYear = new Date().getFullYear();
    if (Array.isArray(editions)) {
      editions.forEach(ed => {
        if (!ed.publishDate) return;
        const yr = parseInt(ed.publishDate.split('-')[0], 10);
        if (yr > bestYear) bestYear = yr;
      });
    }
    return `/current-affairs/yearly/${bestYear}`;
  }, [editions]);

  // ── Date Navigator computed options ──────────────────────────
  const availableYears = useMemo(() => {
    const yrs = new Set<string>();
    const currentYear = new Date().getFullYear();

    // Include range of past years up to current year (2020 to currentYear)
    for (let y = currentYear; y >= 2020; y--) {
      yrs.add(String(y));
    }

    if (Array.isArray(editions)) {
      editions.forEach(ed => {
        if (ed.publishDate && ed.publishDate.includes('-')) {
          yrs.add(ed.publishDate.split('-')[0]);
        }
      });
    }
    return Array.from(yrs).sort((a, b) => b.localeCompare(a));
  }, [editions]);

  const availableMonths = useMemo(() => {
    if (!navYear || !Array.isArray(editions)) return [];
    const months = new Set<string>();
    editions.filter(ed => ed.publishDate && ed.publishDate.startsWith(navYear))
      .forEach(ed => {
        const parts = ed.publishDate.split('-');
        if (parts[1]) months.add(parts[1]);
      });
    return Array.from(months).sort();
  }, [editions, navYear]);

  const availableWeeks = useMemo(() => {
    if (!navYear || !Array.isArray(editions)) return [];
    const weeks = new Set<string>();
    editions
      .filter(ed => ed.publishDate && ed.publishDate.startsWith(navYear) && (!navMonth || ed.publishDate.split('-')[1] === navMonth))
      .forEach(ed => {
        const { week } = getISOWeek(ed.publishDate);
        if (week > 0) weeks.add(String(week).padStart(2, '0'));
      });
    return Array.from(weeks).sort();
  }, [editions, navYear, navMonth]);

  const availableDays = useMemo(() => {
    if (!navYear || !Array.isArray(editions)) return [];
    return [...editions]
      .filter(ed => {
        if (!ed.publishDate || !ed.publishDate.startsWith(navYear)) return false;
        if (navMonth && ed.publishDate.split('-')[1] !== navMonth) return false;
        if (navWeek) {
          const { week } = getISOWeek(ed.publishDate);
          if (String(week).padStart(2, '0') !== navWeek) return false;
        }
        return true;
      })
      .map(ed => ed.publishDate)
      .sort((a, b) => b.localeCompare(a));
  }, [editions, navYear, navMonth, navWeek]);

  // Build the navigation href from selected dropdowns
  const navHref = useMemo(() => {
    if (navDay) return `/current-affairs/daily?date=${navDay}`;
    if (navWeek && navYear) return `/current-affairs/weekly/week-${parseInt(navWeek, 10)}-${navYear}`;
    if (navMonth && navYear) return `/current-affairs/monthly/${MONTH_NAMES[parseInt(navMonth, 10) - 1]}-${navYear}`;
    if (navYear) return `/current-affairs/yearly/${navYear}`;
    return null;
  }, [navDay, navWeek, navMonth, navYear]);

  // ── Recent / Filtered articles from editions ─────────────────────────
  const recentArticles = useMemo(() => {
    const all: Array<{ title: string; date: string; category: string; slug: string; editionId: string }> = [];
    const query = searchQuery.trim().toLowerCase();

    if (Array.isArray(editions)) {
      [...editions]
        .sort((a, b) => (b.publishDate || '').localeCompare(a.publishDate || ''))
        .forEach(ed => {
          if (selectedDate && ed.publishDate !== selectedDate) {
            return;
          }
          (ed.articles || []).forEach(art => {
            const cat = art.category?.toLowerCase() || '';
            const titleText = (art.title || '').toLowerCase();
            const tagsText = (art.tags || []).join(' ').toLowerCase();

            const matchesTopic = activeTopic === 'all' || cat === activeTopic || (activeTopic === 'arunachal' && cat === 'arunachal');
            const matchesQuery = !query || titleText.includes(query) || cat.includes(query) || tagsText.includes(query);

            if (matchesTopic && matchesQuery) {
              all.push({
                title: art.title || 'Current Affairs Article',
                date: ed.publishDate || '',
                category: art.category || 'NATIONAL',
                slug: art.slug || '',
                editionId: ed.id || '',
              });
            }
          });
        });
    }
    return all.slice(0, 18);
  }, [editions, activeTopic, searchQuery, selectedDate]);

  const today = new Date();
  const todayStr = today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const catStyle: Record<string, string> = {
    NATIONAL:      'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    INTERNATIONAL: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
    BIHAR:         'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    ARUNACHAL:     'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  };

  return (
    <div className="min-h-screen bg-[var(--bg-color)]">

      {/* ── Hero Banner ───────────────────────────────────────── */}
      <div
        className="relative z-20 border-b border-slate-200 dark:border-white/[0.07]"
        style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 60%, #1E40AF 100%)' }}
      >
        {/* Ambient glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 py-7 sm:py-9 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2 flex-1 max-w-xl">
              {/* Live pulse badge */}
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-[0.2em]">Updated Daily</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-heading font-black text-white leading-tight">
                {t('currentAffairs.title')}
              </h1>

              {/* 🔍 TOPIC SEARCH INPUT BAR */}
              <div className="relative max-w-md pt-1">
                <Search className="w-4 h-4 text-amber-400 absolute left-3.5 top-[18px] -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search Current Affairs by topic or keyword (e.g. SEBI, Bihar, Gorkha)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-9 py-2.5 bg-white/10 border border-white/20 focus:border-amber-400 text-white placeholder-slate-300 text-xs font-semibold rounded-2xl outline-none backdrop-blur-md transition-all shadow-inner"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-[18px] -translate-y-1/2 text-slate-300 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
              {/* 📅 CLEAN THEME-MATCHED DATE CALENDAR BUTTON */}
              <div className="relative" ref={dateDropdownRef}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setShowDateDropdown(prev => !prev)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowDateDropdown(prev => !prev); } }}
                  className="bg-white/10 hover:bg-white/15 border border-white/20 backdrop-blur-md rounded-2xl px-4 py-2.5 flex items-center gap-2.5 transition-all cursor-pointer shadow-md select-none group"
                >
                  <Calendar className="w-4 h-4 text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
                  <div className="flex items-center gap-2">
                    <div className="text-left">
                      <p className="text-[9px] font-extrabold text-blue-300 uppercase tracking-wider leading-none">
                        {selectedDate ? 'Filter Date' : 'Today'}
                      </p>
                      <p className="text-xs font-black text-white whitespace-nowrap mt-0.5">
                        {selectedDate ? formatDisplayDate(selectedDate) : todayStr}
                      </p>
                    </div>
                    {selectedDate ? (
                      <span
                        role="button"
                        onClick={(e) => { e.stopPropagation(); setSelectedDate(''); }}
                        className="text-amber-400 hover:text-white p-1 rounded-full transition-colors ml-1 cursor-pointer"
                        title="Reset Date Filter"
                      >
                        <X className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <ChevronDown className={`w-3.5 h-3.5 text-amber-400/80 group-hover:text-amber-400 transition-transform ml-1 ${showDateDropdown ? 'rotate-180' : ''}`} />
                    )}
                  </div>
                </div>

                {/* 🎨 CUSTOM THEME-HARMONIOUS CALENDAR POPUP */}
                {showDateDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-[260px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/20 backdrop-blur-2xl rounded-2xl p-3.5 shadow-2xl z-50 text-slate-900 dark:text-white space-y-3 select-none">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-2.5">
                      <div className="flex items-center gap-1 min-w-0">
                        <button
                          type="button"
                          onClick={() => setBannerCalDate(new Date(bannerCalDate.getFullYear(), bannerCalDate.getMonth() - 1, 1))}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer shrink-0"
                          title="Previous Month"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>

                        {/* Month Selector */}
                        <select
                          value={String(bannerCalDate.getMonth())}
                          onChange={(e) => setBannerCalDate(new Date(bannerCalDate.getFullYear(), parseInt(e.target.value, 10), 1))}
                          className="bg-slate-100 dark:bg-slate-800 text-amber-600 dark:text-amber-400 font-black text-xs rounded-lg px-1 py-0.5 border border-slate-200 dark:border-white/10 outline-none cursor-pointer"
                        >
                          {MONTH_DISPLAY.map((mName, idx) => (
                            <option key={idx} value={String(idx)}>
                              {mName.slice(0, 3)}
                            </option>
                          ))}
                        </select>

                        {/* Year Selector */}
                        <select
                          value={String(bannerCalDate.getFullYear())}
                          onChange={(e) => setBannerCalDate(new Date(parseInt(e.target.value, 10), bannerCalDate.getMonth(), 1))}
                          className="bg-slate-100 dark:bg-slate-800 text-amber-600 dark:text-amber-400 font-black text-xs rounded-lg px-1 py-0.5 border border-slate-200 dark:border-white/10 outline-none cursor-pointer"
                        >
                          {availableYears.map(yr => (
                            <option key={yr} value={yr}>
                              {yr}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => setBannerCalDate(new Date(bannerCalDate.getFullYear(), bannerCalDate.getMonth() + 1, 1))}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer shrink-0"
                          title="Next Month"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {selectedDate && (
                        <button
                          type="button"
                          onClick={() => { setSelectedDate(''); setShowDateDropdown(false); }}
                          className="text-[9px] font-black text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20 hover:bg-amber-500/20 transition-all flex items-center gap-0.5 cursor-pointer shrink-0 ml-1"
                        >
                          <X className="w-3 h-3" /> Reset
                        </button>
                      )}
                    </div>

                    {/* Weekday headers */}
                    <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-extrabold text-slate-400 dark:text-blue-300">
                      <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
                    </div>

                    {/* Calendar grid */}
                    <div className="grid grid-cols-7 gap-1 text-center">
                      {heroCalendarDays.map((item, idx) => {
                        if (!item.day) return <div key={idx} className="h-8" />;
                        const isSel = item.isSelected;
                        const hasEd = item.hasEdition;

                        let dayClass = 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white border-transparent';
                        if (isSel) {
                          dayClass = 'bg-amber-500 text-slate-950 font-black shadow-md ring-2 ring-amber-400/50 border-amber-400';
                        } else if (hasEd) {
                          dayClass = 'bg-amber-500/15 dark:bg-blue-500/20 text-amber-800 dark:text-blue-300 font-extrabold border-amber-500/30 dark:border-blue-500/40 hover:bg-amber-500/25 dark:hover:bg-blue-500/30';
                        }

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              if (item.dateStr) {
                                setSelectedDate(item.dateStr);
                                setShowDateDropdown(false);
                              }
                            }}
                            className={`h-8 w-full rounded-xl text-xs font-bold flex flex-col items-center justify-center transition-all cursor-pointer border relative ${dayClass}`}
                          >
                            <span>{item.day}</span>
                            {hasEd && !isSel && (
                              <span className="w-1 h-1 rounded-full bg-amber-500 dark:bg-amber-400 absolute bottom-1" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* CTA */}
              <Link
                href={latestDailyHref}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-2xl transition-all hover:scale-[1.02] shadow-md shadow-amber-500/20"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{t('nav.todaysCA')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body: Sidebar + Main ──────────────────────────────── */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 py-8">
        <div className="flex gap-8">

          {/* ════ LEFT SIDEBAR ════ */}
          <aside className="hidden lg:block w-60 xl:w-64 shrink-0">
            <div className="sticky top-20 space-y-1">

              {/* Card wrapper */}
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-3 space-y-4 shadow-xs">

                {/* DAILY UPDATES */}
                <div className="space-y-0.5">
                  <SidebarSection icon={<Flame className="w-3.5 h-3.5" />} title={t('currentAffairs.dailyUpdates') || 'Daily Updates'} />
                  <SidebarItem label={t('currentAffairs.newsToday') || 'News Today'} href="/current-affairs/daily" />
                </div>

                <div className="h-px bg-slate-100 dark:bg-white/[0.06]" />

                {/* WEEKLY & MONTHLY */}
                <div className="space-y-0.5">
                  <SidebarSection icon={<Layers className="w-3.5 h-3.5" />} title={t('currentAffairs.weeklyMonthly') || 'Weekly & Monthly'} />
                  <SidebarItem label={t('currentAffairs.weekly') || 'Weekly'} href="/current-affairs/weekly" />
                  <SidebarItem label={t('currentAffairs.monthlyMagazine') || 'Monthly Magazine'} href="/current-affairs/monthly" />
                </div>

                <div className="h-px bg-slate-100 dark:bg-white/[0.06]" />

                {/* PERIODIC REVIEWS */}
                <div className="space-y-0.5">
                  <SidebarSection icon={<RefreshCw className="w-3.5 h-3.5" />} title={t('currentAffairs.periodicReviews') || 'Periodic Reviews'} />
                  <SidebarItem label={t('currentAffairs.yearly') || 'Yearly'} href="/current-affairs/yearly" />
                  <SidebarItem label={t('currentAffairs.bihar') || 'Bihar'} href="/current-affairs/daily?topic=bihar" />
                  <SidebarItem label={t('currentAffairs.arunachal') || 'Arunachal'} href="/current-affairs/daily?topic=arunachal" />
                </div>

                <div className="h-px bg-slate-100 dark:bg-white/[0.06]" />

                {/* TOPICS */}
                <div className="space-y-0.5">
                  <SidebarSection icon={<TrendingUp className="w-3.5 h-3.5" />} title={t('currentAffairs.topics') || 'Topics'} />
                  <SidebarItem label={t('currentAffairs.nationalAffairs') || 'National Affairs'} href="/current-affairs/daily?topic=national" />
                  <SidebarItem label={t('currentAffairs.internationalAffairs') || 'International Affairs'} href="/current-affairs/daily?topic=international" />
                  <SidebarItem label={t('currentAffairs.biharState') || 'Bihar & State'} href="/current-affairs/daily?topic=bihar" />
                </div>
              </div>
            </div>
          </aside>

          {/* ════ MAIN CONTENT ════ */}
          <main className="flex-1 min-w-0 space-y-10">

            {/* Topic Filter Chips & Recent Articles */}
            <div className="space-y-4 pt-4 border-t border-[var(--card-border)]">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-heading font-black text-[var(--text-color)]">
                  {t('currentAffairs.articlesByRegionTopic') || 'Articles by Region & Topic'}
                </h2>
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'all',           label: t('currentAffairs.allTopics') || 'All Topics',           color: 'bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-white/10' },
                  { key: 'national',      label: t('currentAffairs.national') || 'National',             color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
                  { key: 'international', label: t('currentAffairs.international') || 'International',         color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20' },
                  { key: 'bihar',         label: t('currentAffairs.biharSpecial') || 'Bihar Special',         color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
                  { key: 'arunachal',     label: t('currentAffairs.arunachalSpecial') || 'Arunachal Special',     color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => setActiveTopic(item.key as any)}
                    className={`px-4 py-2 rounded-full border text-xs font-extrabold tracking-wide transition-all duration-150 cursor-pointer ${item.color} ${activeTopic === item.key ? 'ring-2 ring-offset-1 ring-amber-400/50 dark:ring-offset-slate-900' : 'opacity-80 hover:opacity-100'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Active Filters Bar */}
              {(searchQuery || selectedDate) && (
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  <span className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
                    <Filter className="w-3 h-3 text-amber-500" /> Active Filters:
                  </span>
                  {searchQuery && (
                    <span className="px-3 py-1 bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 rounded-xl font-bold flex items-center gap-1.5">
                      <span>Search: &ldquo;{searchQuery}&rdquo;</span>
                      <button type="button" onClick={() => setSearchQuery('')} className="hover:text-red-500 cursor-pointer">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  )}
                  {selectedDate && (
                    <span className="px-3 py-1 bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 rounded-xl font-bold flex items-center gap-1.5">
                      <span>Date: {formatDisplayDate(selectedDate)}</span>
                      <button type="button" onClick={() => setSelectedDate('')} className="hover:text-red-500 cursor-pointer">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); setSelectedDate(''); }}
                    className="text-[10px] font-black text-slate-400 hover:text-amber-500 hover:underline ml-1 cursor-pointer"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}

              {recentArticles.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {recentArticles.map((art, i) => (
                    <Link
                      key={i}
                      href={`/current-affairs/daily/${art.date}/${art.category.toLowerCase()}/${art.slug}`}
                      className="group bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden hover:border-amber-500/30 hover:-translate-y-1 transition-all duration-200 shadow-xs"
                    >
                      <div className={`h-1 w-full ${art.category === 'BIHAR' ? 'bg-amber-500' : art.category === 'ARUNACHAL' ? 'bg-emerald-500' : art.category === 'INTERNATIONAL' ? 'bg-violet-500' : 'bg-blue-500'}`} />
                      <div className="p-4 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${catStyle[art.category] || catStyle.NATIONAL}`}>
                            {art.category}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDisplayDate(art.date)}
                          </span>
                        </div>
                        <h3 className="text-xs font-bold text-[var(--text-color)] leading-relaxed line-clamp-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                          {art.title}
                        </h3>
                        <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          {t('currentAffairs.readMore')} <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl">
                  <Newspaper className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-500 font-semibold">{t('currentAffairs.noArticles')}</p>
                </div>
              )}
            </div>

            {/* Mobile sidebar quick-nav (shown only on mobile) */}
            <section className="lg:hidden space-y-3">
              <h2 className="text-base font-heading font-black text-[var(--text-color)]">Quick Navigation</h2>
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-4 space-y-2">
                {[
                  { label: 'News Today',           href: '/current-affairs/daily',                    badge: { label: 'Popular', variant: 'popular' as const } },
                  { label: 'Weekly Focus',          href: latestWeekHref,                              badge: { label: 'Popular', variant: 'popular' as const } },
                  { label: 'Monthly Magazine',      href: latestMonthHref,                             badge: { label: 'Premium', variant: 'premium' as const } },
                  { label: 'Bihar Special Edition', href: '/current-affairs/daily?topic=bihar',        badge: { label: 'New', variant: 'new' as const } },
                  { label: 'Yearly Compilations',   href: latestYearHref,                              undefined },
                  { label: 'Video Updates',         href: '/current-affairs/videos',                   undefined },
                ].map(item => (
                  <SidebarItem key={item.label} label={item.label} href={item.href} badge={item.badge} />
                ))}
              </div>
            </section>

          </main>
        </div>
      </div>
    </div>
  );
}
