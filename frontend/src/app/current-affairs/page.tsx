'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Clock, Layers, BookOpen, Award, ArrowRight, ChevronRight,
  Flame, Globe, MapPin, Newspaper, RefreshCw, TrendingUp,
  Calendar, Zap, BookMarked, FileText
} from 'lucide-react';
import { db, DynamicCurrentAffairEdition } from '@/services/db';

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
  const [editions, setEditions] = useState<DynamicCurrentAffairEdition[]>([]);
  const [activeTopic, setActiveTopic] = useState<'all' | 'national' | 'international' | 'bihar' | 'arunachal'>('all');

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

  // ── Derived hrefs ──────────────────────────────────────────
  const latestDailyHref = useMemo(() => {
    const latest = editions.sort((a, b) => b.publishDate.localeCompare(a.publishDate))[0];
    if (!latest) return '/current-affairs/daily';
    return `/current-affairs/daily?date=${latest.publishDate}`;
  }, [editions]);

  const latestWeekHref = useMemo(() => {
    let bestWeek = 0, bestYear = 0;
    editions.forEach(ed => {
      const { week, year } = getISOWeek(ed.publishDate);
      if (year > bestYear || (year === bestYear && week > bestWeek)) { bestWeek = week; bestYear = year; }
    });
    if (bestWeek === 0) return '/current-affairs/weekly/week-1-2026';
    return `/current-affairs/weekly/week-${bestWeek}-${bestYear}`;
  }, [editions]);

  const latestMonthHref = useMemo(() => {
    let bestDate = '';
    editions.forEach(ed => { if (!bestDate || ed.publishDate > bestDate) bestDate = ed.publishDate; });
    if (!bestDate) return `/current-affairs/monthly/january-${new Date().getFullYear()}`;
    const [yr, mo] = bestDate.split('-');
    return `/current-affairs/monthly/${MONTH_NAMES[parseInt(mo, 10) - 1]}-${yr}`;
  }, [editions]);

  const latestYearHref = useMemo(() => {
    let bestYear = new Date().getFullYear();
    editions.forEach(ed => { const yr = parseInt(ed.publishDate.split('-')[0], 10); if (yr > bestYear) bestYear = yr; });
    return `/current-affairs/yearly/${bestYear}`;
  }, [editions]);

  // ── Date Navigator computed options ──────────────────────────
  // All unique years that have editions
  const availableYears = useMemo(() => {
    const yrs = new Set<string>();
    editions.forEach(ed => yrs.add(ed.publishDate.split('-')[0]));
    return Array.from(yrs).sort((a, b) => b.localeCompare(a));
  }, [editions]);

  // All months in the selected year
  const availableMonths = useMemo(() => {
    if (!navYear) return [];
    const months = new Set<string>();
    editions.filter(ed => ed.publishDate.startsWith(navYear))
      .forEach(ed => months.add(ed.publishDate.split('-')[1]));
    return Array.from(months).sort();
  }, [editions, navYear]);

  // All ISO weeks in the selected year (+ optional month filter)
  const availableWeeks = useMemo(() => {
    if (!navYear) return [];
    const weeks = new Set<string>();
    editions
      .filter(ed => ed.publishDate.startsWith(navYear) && (!navMonth || ed.publishDate.split('-')[1] === navMonth))
      .forEach(ed => {
        const { week } = getISOWeek(ed.publishDate);
        if (week > 0) weeks.add(String(week).padStart(2, '0'));
      });
    return Array.from(weeks).sort();
  }, [editions, navYear, navMonth]);

  // All days (editions) for selected year+month+week
  const availableDays = useMemo(() => {
    if (!navYear) return [];
    return [...editions]
      .filter(ed => {
        if (!ed.publishDate.startsWith(navYear)) return false;
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

  // ── Recent articles from editions ─────────────────────────
  const recentArticles = useMemo(() => {
    const all: Array<{ title: string; date: string; category: string; slug: string; editionId: string }> = [];
    [...editions]
      .sort((a, b) => b.publishDate.localeCompare(a.publishDate))
      .slice(0, 5)
      .forEach(ed => {
        (ed.articles || []).forEach(art => {
          const cat = art.category?.toLowerCase() || '';
          if (activeTopic === 'all' || cat === activeTopic || (activeTopic === 'arunachal' && cat === 'arunachal')) {
            all.push({
              title: art.title,
              date: ed.publishDate,
              category: art.category || 'NATIONAL',
              slug: art.slug,
              editionId: ed.id,
            });
          }
        });
      });
    return all.slice(0, 6);
  }, [editions, activeTopic]);

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
        className="relative overflow-hidden border-b border-slate-200 dark:border-white/[0.07]"
        style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 60%, #1E40AF 100%)' }}
      >
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 py-5 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              {/* Live pulse badge */}
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-[0.2em]">Updated Daily</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-heading font-black text-white leading-tight">
                Current Affairs
              </h1>
            </div>

            <div className="flex flex-row items-center gap-3 shrink-0">
              {/* Date badge */}
              <div className="bg-white/10 border border-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-center">
                <p className="text-[9px] font-bold text-blue-300 uppercase tracking-wider">Today</p>
                <p className="text-xs font-black text-white">{todayStr}</p>
              </div>
              {/* CTA */}
              <Link
                href={latestDailyHref}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-xl transition-all hover:scale-[1.02] shadow-md shadow-amber-500/20"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Read Today's Current Affairs</span>
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
                  <SidebarSection icon={<Flame className="w-3.5 h-3.5" />} title="Daily Updates" />
                  <SidebarItem label="News Today"          href="/current-affairs/daily" />
                </div>

                <div className="h-px bg-slate-100 dark:bg-white/[0.06]" />

                {/* WEEKLY & MONTHLY */}
                <div className="space-y-0.5">
                  <SidebarSection icon={<Layers className="w-3.5 h-3.5" />} title="Weekly & Monthly" />
                  <SidebarItem label="Weekly"                href="/current-affairs/weekly" />
                  <SidebarItem label="Monthly Magazine"            href="/current-affairs/monthly" />
                </div>

                <div className="h-px bg-slate-100 dark:bg-white/[0.06]" />

                {/* PERIODIC REVIEWS */}
                <div className="space-y-0.5">
                  <SidebarSection icon={<RefreshCw className="w-3.5 h-3.5" />} title="Periodic Reviews" />
                  <SidebarItem label="Yearly"   href="/current-affairs/yearly" />
                  <SidebarItem label="Bihar" href="/current-affairs/daily?topic=bihar" />
                  <SidebarItem label="Arunachal"       href="/current-affairs/daily?topic=arunachal" />
                </div>

                <div className="h-px bg-slate-100 dark:bg-white/[0.06]" />

                {/* TOPICS */}
                <div className="space-y-0.5">
                  <SidebarSection icon={<TrendingUp className="w-3.5 h-3.5" />} title="Topics" />
                  <SidebarItem label="National Affairs"      href="/current-affairs/daily?topic=national" />
                  <SidebarItem label="International Affairs" href="/current-affairs/daily?topic=international" />
                  <SidebarItem label="Bihar & State"         href="/current-affairs/daily?topic=bihar" />
                </div>
              </div>
            </div>
          </aside>

          {/* ════ MAIN CONTENT ════ */}
          <main className="flex-1 min-w-0 space-y-10">

            {/* Topic Filter Chips & Recent Articles */}
            <div className="space-y-4 pt-4 border-t border-[var(--card-border)]">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-heading font-black text-[var(--text-color)]">Articles by Region & Topic</h2>
              </div>

              <div className="flex flex-wrap gap-2">
                {([
                  { key: 'all',           label: 'All Topics',           color: 'bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-white/10' },
                  { key: 'national',      label: 'National',             color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
                  { key: 'international', label: 'International',         color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20' },
                  { key: 'bihar',         label: 'Bihar Special',         color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
                  { key: 'arunachal',     label: 'Arunachal Special',     color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
                ] as const).map(t => (
                  <button
                    key={t.key}
                    onClick={() => setActiveTopic(t.key)}
                    className={`px-4 py-2 rounded-full border text-xs font-extrabold tracking-wide transition-all duration-150 cursor-pointer ${t.color} ${activeTopic === t.key ? 'ring-2 ring-offset-1 ring-amber-400/50 dark:ring-offset-slate-900' : 'opacity-80 hover:opacity-100'}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {recentArticles.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {recentArticles.map((art, i) => (
                    <Link
                      key={i}
                      href={`/current-affairs/article/${art.slug}`}
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
                          Read More <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl">
                  <Newspaper className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-500 font-semibold">No articles yet for this selection.</p>
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
