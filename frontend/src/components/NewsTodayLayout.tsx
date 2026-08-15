'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/context/LocaleContext';
import {
  Calendar as CalendarIcon, ArrowLeft, Clock,
  ChevronRight, ChevronLeft, FileText,
  ListOrdered, ChevronDown, ChevronUp, Tag, X, Menu
} from 'lucide-react';
import { db, DynamicCurrentAffairEdition, DynamicCurrentAffairArticle } from '@/services/db';

interface NewsTodayLayoutProps {
  currentDateStr?: string;
  currentArticleSlug?: string;
  categorySlug?: string;
}

interface TocItem {
  id: string;
  text: string;
  level: number;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function NewsTodayLayout({
  currentDateStr,
  currentArticleSlug,
  categorySlug
}: NewsTodayLayoutProps) {
  const router = useRouter();
  const { locale } = useLocale();

  const [editions, setEditions] = useState<DynamicCurrentAffairEdition[]>([]);
  const [currentEdition, setCurrentEdition] = useState<DynamicCurrentAffairEdition | null>(null);
  const [activeArticle, setActiveArticle] = useState<DynamicCurrentAffairArticle | null>(null);
  const [loading, setLoading] = useState(true);

  // UI state toggles
  const [tocExpanded, setTocExpanded] = useState(true);
  const [calendarExpanded, setCalendarExpanded] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Calendar Date State
  const [calendarDate, setCalendarDate] = useState<Date>(() => {
    if (currentDateStr) {
      const parts = currentDateStr.split('-');
      if (parts.length === 3) {
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      }
    }
    return new Date();
  });

  // In-memory article cache to enable instant 0ms topic switching
  const articleCacheRef = useRef<Map<string, DynamicCurrentAffairArticle>>(new Map());

  // Fetch All Editions
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const initialDate = currentDateStr;
        // 1. Parallel fetch: Fetch editions list and target date edition concurrently
        const [list, ed] = await Promise.all([
          db.getDynamicCurrentAffairsEditions(false),
          initialDate ? db.getDynamicCurrentAffairsEditionByDate(initialDate, false) : Promise.resolve(null)
        ]);

        setEditions(list || []);

        let resolvedEdition = ed;
        let targetDate = initialDate;

        if (!targetDate && list && list.length > 0) {
          const sorted = [...list].sort((a, b) => b.publishDate.localeCompare(a.publishDate));
          targetDate = sorted[0].publishDate;
          resolvedEdition = await db.getDynamicCurrentAffairsEditionByDate(targetDate, false);
        }

        setCurrentEdition(resolvedEdition);

        if (resolvedEdition && resolvedEdition.articles && resolvedEdition.articles.length > 0) {
          let matched = currentArticleSlug
            ? resolvedEdition.articles.find(a => a.slug === currentArticleSlug || a.id === currentArticleSlug)
            : resolvedEdition.articles[0];

          if (!matched) matched = resolvedEdition.articles[0];

          // Set active article immediately for 0ms initial render
          setActiveArticle(matched);

          if (matched && matched.slug) {
            const cacheKey = `${matched.slug}_${locale}`;
            if (articleCacheRef.current.has(cacheKey)) {
              setActiveArticle(articleCacheRef.current.get(cacheKey)!);
            } else if (!matched.content) {
              db.getDynamicCurrentAffairArticle(matched.slug, false).then(fullArt => {
                if (fullArt) {
                  articleCacheRef.current.set(cacheKey, fullArt);
                  setActiveArticle(fullArt);
                }
              }).catch(() => {});
            }
          }
        }
      } catch (err) {
        console.error('Error loading News Today data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentDateStr, currentArticleSlug, locale]);

  // Set of dates that have published editions (YYYY-MM-DD)
  const publishedDatesSet = useMemo(() => {
    return new Set(editions.map(e => e.publishDate));
  }, [editions]);

  // Unique Years available in DB
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    editions.forEach(ed => {
      const yr = ed.publishDate.split('-')[0];
      if (yr) yearsSet.add(yr);
    });
    const currYr = String(calendarDate.getFullYear());
    yearsSet.add(currYr);
    return Array.from(yearsSet).sort((a, b) => Number(b) - Number(a));
  }, [editions, calendarDate]);

  // Calendar Day Generation Helper
  const calendarDays = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days: Array<{ day: number | null; dateStr: string | null; hasEdition: boolean; isSelected: boolean }> = [];

    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ day: null, dateStr: null, hasEdition: false, isSelected: false });
    }

    const selectedStr = currentDateStr || (currentEdition?.publishDate || '');

    for (let d = 1; d <= totalDays; d++) {
      const mStr = String(month + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      const formatted = `${year}-${mStr}-${dStr}`;

      days.push({
        day: d,
        dateStr: formatted,
        hasEdition: publishedDatesSet.has(formatted),
        isSelected: formatted === selectedStr
      });
    }

    return days;
  }, [calendarDate, publishedDatesSet, currentDateStr, currentEdition]);

  // Dropdown Change Handlers
  const handleYearChange = (newYearStr: string) => {
    const yr = parseInt(newYearStr, 10);
    const mo = calendarDate.getMonth();
    setCalendarDate(new Date(yr, mo, 1));
    const mStr = String(mo + 1).padStart(2, '0');
    router.push(`/current-affairs/daily/${yr}-${mStr}-01`);
  };

  const handleMonthChange = (newMonthIdxStr: string) => {
    const yr = calendarDate.getFullYear();
    const mo = parseInt(newMonthIdxStr, 10);
    setCalendarDate(new Date(yr, mo, 1));
    const mStr = String(mo + 1).padStart(2, '0');
    router.push(`/current-affairs/daily/${yr}-${mStr}-01`);
  };

  const handleDayChange = (newDayStr: string) => {
    const yr = calendarDate.getFullYear();
    const mo = calendarDate.getMonth();
    const d = parseInt(newDayStr, 10);
    const mStr = String(mo + 1).padStart(2, '0');
    const dStr = String(d).padStart(2, '0');
    router.push(`/current-affairs/daily/${yr}-${mStr}-${dStr}`);
  };

  const prevMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
  };

  // ══════════════════════════════════════════════════════════════════════════
  // DYNAMIC HTML HEADING & UNIQUE ID TOC PARSER
  // Parses activeArticle.content to extract H2/H3 headings and assign stable IDs
  // ══════════════════════════════════════════════════════════════════════════
  const { processedHtml, tocItems } = useMemo(() => {
    if (!activeArticle?.content) {
      return { processedHtml: '', tocItems: [] };
    }

    if (typeof window === 'undefined') {
      return { processedHtml: activeArticle.content, tocItems: [] };
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(activeArticle.content, 'text/html');
      const headings = doc.querySelectorAll('h1, h2, h3, h4');

      const items: TocItem[] = [];
      const idCounts: Record<string, number> = {};

      headings.forEach((heading) => {
        const text = heading.textContent?.trim() || '';
        if (!text) return;

        let baseId = text
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

        if (!baseId) baseId = 'heading';

        let uniqueId = baseId;
        if (idCounts[baseId]) {
          idCounts[baseId] += 1;
          uniqueId = `${baseId}-${idCounts[baseId]}`;
        } else {
          idCounts[baseId] = 1;
        }

        heading.setAttribute('id', uniqueId);

        const level = parseInt(heading.tagName.replace('H', ''), 10) || 2;
        items.push({ id: uniqueId, text, level });
      });

      return {
        processedHtml: doc.body.innerHTML,
        tocItems: items
      };
    } catch (err) {
      console.error('Error parsing headings for dynamic TOC:', err);
      return { processedHtml: activeArticle.content, tocItems: [] };
    }
  }, [activeArticle?.content]);

  // Selected date formatted dynamically (No hardcoded fallback)
  const activeDateFormatted = useMemo(() => {
    const dStr = currentDateStr || currentEdition?.publishDate;
    if (!dStr) return null;
    const parts = dStr.split('-');
    if (parts.length !== 3) return dStr;
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }, [currentDateStr, currentEdition]);

  const currentDayVal = useMemo(() => {
    const dStr = currentDateStr || currentEdition?.publishDate;
    if (dStr) {
      const parts = dStr.split('-');
      if (parts.length === 3) return String(parseInt(parts[2], 10));
    }
    return '1';
  }, [currentDateStr, currentEdition]);

  // Smooth Scroll Helper
  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (mobileDrawerOpen) setMobileDrawerOpen(false);
    }
  };

  // Reusable Left Sidebar Component
  const SidebarContent = () => (
    <div className="space-y-6">
      
      {/* 1. DYNAMIC CALENDAR WIDGET */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 p-4 sm:p-5 shadow-xs space-y-4 overflow-hidden">
        <div
          onClick={() => setCalendarExpanded(!calendarExpanded)}
          className="flex items-center justify-between cursor-pointer border-b border-slate-100 dark:border-white/5 pb-3 select-none"
        >
          <span className="text-xs font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider flex items-center gap-1.5">
            <CalendarIcon className="w-4 h-4" />
            <span>Select Date</span>
          </span>
          {calendarExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>

        {calendarExpanded && (
          <div className="space-y-3 pt-1">
            {/* Integrated Month/Year Dropdown Controls & Arrows (Zero Duplication & No Overflow) */}
            <div className="flex items-center justify-between gap-1 w-full min-w-0">
              <button
                onClick={prevMonth}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-600 dark:text-slate-300 cursor-pointer shrink-0"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="grid grid-cols-3 gap-1 min-w-0 flex-1">
                <select
                  value={String(calendarDate.getMonth())}
                  onChange={(e) => handleMonthChange(e.target.value)}
                  className="w-full min-w-0 px-1 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-extrabold text-[11px] outline-none focus:border-amber-500 cursor-pointer truncate"
                >
                  {MONTH_NAMES.map((mName, idx) => (
                    <option key={idx} value={String(idx)}>
                      {mName.slice(0, 3)}
                    </option>
                  ))}
                </select>

                <select
                  value={String(calendarDate.getFullYear())}
                  onChange={(e) => handleYearChange(e.target.value)}
                  className="w-full min-w-0 px-1 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-extrabold text-[11px] outline-none focus:border-amber-500 cursor-pointer truncate"
                >
                  {availableYears.map(yr => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>

                <select
                  value={currentDayVal}
                  onChange={(e) => handleDayChange(e.target.value)}
                  className="w-full min-w-0 px-1 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-extrabold text-[11px] outline-none focus:border-amber-500 cursor-pointer truncate"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                    <option key={d} value={String(d)}>
                      {String(d).padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={nextMonth}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-600 dark:text-slate-300 cursor-pointer shrink-0"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Interactive Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400">
              <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {calendarDays.map((item, idx) => {
                if (!item.day) return <div key={idx} className="h-8" />;

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      if (item.dateStr) {
                        router.push(`/current-affairs/daily/${item.dateStr}`);
                        if (mobileDrawerOpen) setMobileDrawerOpen(false);
                      }
                    }}
                    className={`h-8 w-full rounded-xl text-xs font-bold flex flex-col items-center justify-center transition-all cursor-pointer relative ${
                      item.isSelected
                        ? 'bg-amber-500 text-slate-950 font-black shadow-md scale-105'
                        : item.hasEdition
                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 hover:bg-amber-500/25 border border-amber-500/30'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{item.day}</span>
                    {item.hasEdition && !item.isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 absolute bottom-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2. DYNAMIC INDEX / TABLE OF CONTENTS (PARSED FROM ARTICLE HTML HEADINGS) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 p-5 shadow-xs space-y-3">
        <div
          onClick={() => setTocExpanded(!tocExpanded)}
          className="flex items-center justify-between cursor-pointer border-b border-slate-100 dark:border-white/5 pb-2.5 select-none"
        >
          <div className="flex items-center gap-2">
            <ListOrdered className="w-4 h-4 text-amber-500" />
            <h3 className="font-heading font-black text-xs uppercase tracking-wider text-slate-900 dark:text-white">
              Article Headings Index
            </h3>
          </div>
          {tocExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>

        {tocExpanded && (
          <div className="space-y-1 pt-1 text-xs">
            {tocItems.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic px-2 py-1">
                Sub-headings will appear automatically as you read.
              </p>
            ) : (
              tocItems.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => scrollToHeading(item.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl font-medium transition-all flex items-start gap-2 leading-snug cursor-pointer ${
                    item.level === 3
                      ? 'pl-6 text-[11px] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      : 'text-slate-800 dark:text-slate-200 hover:bg-amber-500/10 hover:text-amber-700 dark:hover:text-amber-400 font-bold'
                  }`}
                >
                  <span className="text-[10px] font-black text-amber-500 shrink-0 mt-0.5">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className="line-clamp-2">{item.text}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* 3. SAME-DAY ARTICLES NAVIGATION (TODAY'S CA TOPICS) */}
      {currentEdition?.articles && currentEdition.articles.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2.5">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-500" />
              <h3 className="font-heading font-black text-xs uppercase tracking-wider text-slate-900 dark:text-white">
                Today&apos;s Topics ({currentEdition.articles.length})
              </h3>
            </div>
            {activeDateFormatted && (
              <span className="text-[9px] font-extrabold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                {activeDateFormatted}
              </span>
            )}
          </div>

          <div className="space-y-1.5 pt-1 text-xs">
            {currentEdition.articles.map((art, idx) => {
              const isSelected = activeArticle?.id === art.id || (activeArticle?.slug && activeArticle.slug === art.slug);
              return (
                <button
                  key={art.id || idx}
                  onClick={async () => {
                    setActiveArticle(art);
                    if (art.slug) {
                      const cacheKey = `${art.slug}_${locale}`;
                      if (articleCacheRef.current.has(cacheKey)) {
                        setActiveArticle(articleCacheRef.current.get(cacheKey)!);
                      } else {
                        const fullArt = await db.getDynamicCurrentAffairArticle(art.slug, false);
                        if (fullArt) {
                          articleCacheRef.current.set(cacheKey, fullArt);
                          setActiveArticle(fullArt);
                        }
                      }
                    }
                    if (art.slug && currentDateStr) {
                      const cat = art.category ? art.category.toLowerCase().replace(/\s+/g, '-') : 'general';
                      router.push(`/current-affairs/daily/${currentDateStr}/${cat}/${art.slug}`);
                    }
                    if (mobileDrawerOpen) setMobileDrawerOpen(false);
                  }}
                  className={`w-full text-left p-3 rounded-2xl font-bold transition-all flex items-start gap-2.5 leading-snug cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 shadow-md scale-[1.01]'
                      : 'text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-500/10 hover:text-amber-600 border border-slate-200/60 dark:border-white/5'
                  }`}
                >
                  <span className={`text-[10px] font-black shrink-0 px-2 py-0.5 rounded-lg ${isSelected ? 'bg-slate-950 text-amber-400' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'}`}>
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="line-clamp-2">{art.title}</span>
                    {art.category && (
                      <span className={`text-[9px] font-extrabold block mt-0.5 uppercase tracking-wider ${isSelected ? 'text-slate-900/80' : 'text-slate-400 dark:text-slate-500'}`}>
                        {art.category}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-body py-8 px-3 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Top Breadcrumbs */}
        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold border-b border-slate-200 dark:border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Link href="/" className="hover:text-amber-500 transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-350" />
            <Link href="/current-affairs" className="hover:text-amber-500 transition-colors">Current Affairs</Link>
            {activeDateFormatted && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-350" />
                <span className="text-slate-900 dark:text-white font-bold">{activeDateFormatted}</span>
              </>
            )}
          </div>

          <Link
            href="/current-affairs/daily"
            className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 hover:underline font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Daily Archives</span>
          </Link>
        </div>

        {/* ═════════════════════════════════════════════════════════════════════
            MAIN LAYOUT GRID (DESKTOP: SIDEBAR + MAIN CONTENT)
        ═════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ════ LEFT SIDEBAR (DESKTOP) ════ */}
          <aside className="hidden lg:block lg:col-span-4 xl:col-span-4 lg:sticky lg:top-24 space-y-6">
            <SidebarContent />
          </aside>

          {/* ════ MAIN ARTICLE CONTENT ════ */}
          <main className="lg:col-span-8 xl:col-span-8 space-y-6 max-w-4xl">

            {/* 1. ARTICLE HEADER BANNER */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 p-6 sm:p-8 space-y-4 shadow-xs">
              <div className="flex flex-wrap gap-2 items-center text-xs">
                {activeArticle?.category && (
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider border border-amber-500/20">
                    {activeArticle.category}
                  </span>
                )}
                {activeDateFormatted && (
                  <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 border border-slate-200 dark:border-white/5">
                    <CalendarIcon className="w-3.5 h-3.5 text-amber-500" />
                    <span>{activeDateFormatted}</span>
                  </span>
                )}
                {activeArticle?.readingTime && (
                  <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 border border-slate-200 dark:border-white/5">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>{activeArticle.readingTime}</span>
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-heading font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                {activeArticle?.title || (loading ? 'Loading Article...' : 'Current Affairs Article')}
              </h1>
            </div>

            {/* 2. CMS ARTICLE BODY CONTENT (PARSED HTML WITH DYNAMIC HEADING IDS) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 p-6 sm:p-10 space-y-6 shadow-xs">
              {processedHtml ? (
                <div
                  className="article-prose-container prose prose-slate dark:prose-invert max-w-none
                    prose-headings:font-heading prose-headings:font-black prose-headings:scroll-mt-28
                    prose-headings:text-slate-950 dark:prose-headings:text-white
                    prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
                    prose-p:leading-relaxed prose-p:my-3.5 prose-p:font-medium
                    prose-li:my-1 prose-li:font-medium
                    prose-blockquote:border-l-4 prose-blockquote:border-amber-500
                    prose-blockquote:bg-amber-50 dark:prose-blockquote:bg-amber-500/10
                    prose-blockquote:rounded-r-2xl prose-blockquote:p-4 prose-blockquote:not-italic
                    prose-a:text-amber-600 prose-a:font-bold hover:prose-a:underline"
                  dangerouslySetInnerHTML={{ __html: processedHtml }}
                />
              ) : (
                <div className="py-12 text-center space-y-3">
                  <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
                  <p className="text-xs text-slate-500 font-semibold">
                    {loading ? 'Fetching article content...' : 'Content for this article is being published shortly.'}
                  </p>
                </div>
              )}

              {/* 3. TAGS AT BOTTOM (EXCLUSIVELY) */}
              {activeArticle?.tags && activeArticle.tags.length > 0 && (
                <div className="pt-6 border-t border-slate-100 dark:border-white/5 flex flex-wrap gap-2 items-center text-xs">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0 flex items-center gap-1">
                    <Tag className="w-3 h-3" /> Tags:
                  </span>
                  {activeArticle.tags.map(t => (
                    <span
                      key={t}
                      className="px-3 py-1 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold border border-amber-500/20 text-xs"
                    >
                      #{t.replace(/^#/, '')}
                    </span>
                  ))}
                </div>
              )}
            </div>

          </main>

        </div>

      </div>

      {/* ═════════════════════════════════════════════════════════════════════
          MOBILE FLOATING NAVIGATION TRIGGER & DRAWER
      ═════════════════════════════════════════════════════════════════════ */}
      <div className="lg:hidden fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setMobileDrawerOpen(true)}
          className="px-5 py-3 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-heading font-black text-xs shadow-xl flex items-center gap-2 transition-all hover:scale-105 cursor-pointer border border-amber-400"
        >
          <Menu className="w-4 h-4" />
          <span>Calendar &amp; Index</span>
        </button>
      </div>

      {/* Mobile Drawer Modal Overlay */}
      {mobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-sm bg-white dark:bg-slate-950 h-full overflow-y-auto p-6 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4">
              <span className="font-heading font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                Article Navigation
              </span>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <SidebarContent />
          </div>
        </div>
      )}

    </div>
  );
}
