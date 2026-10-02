'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Layers, ArrowRight, ChevronRight,
  Flame, Globe, TrendingUp,
  Calendar, Zap, Search, X
} from 'lucide-react';
import { db, DynamicCurrentAffairEdition } from '@/services/db';
import { useLocale } from '@/context/LocaleContext';

function formatDisplayDateHindi(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' });
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

export default function CurrentAffairsHindiLanding() {
  const { locale, setLocale } = useLocale();
  const [editions, setEditions] = useState<DynamicCurrentAffairEdition[]>([]);
  type TopicKey = 'all' | 'editorials' | 'national' | 'international' | 'bihar' | 'arunachal';
  const [activeTopic, setActiveTopic] = useState<TopicKey>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Sync locale to Hindi on page entry
  useEffect(() => {
    if (locale !== 'hi') {
      setLocale('hi', true);
    }
  }, [locale, setLocale]);

  useEffect(() => {
    db.getDynamicCurrentAffairsEditions(false)
      .then(list => setEditions(list || []))
      .catch(err => console.error('Error loading current affairs editions:', err));
  }, []);

  // Derived filtered articles specifically for Hindi Portal
  const recentArticles = useMemo(() => {
    const all: Array<{ title: string; date: string; category: string; slug: string; editionId: string; summary: string }> = [];
    const query = searchQuery.trim().toLowerCase();

    if (Array.isArray(editions)) {
      [...editions]
        .filter(ed => {
          const target = ed.publish_target || 'both';
          return target === 'both' || target === 'hindi';
        })
        .sort((a, b) => (b.publishDate || '').localeCompare(a.publishDate || ''))
        .forEach(ed => {
          (ed.articles || []).forEach(art => {
            const target = art.publish_target || 'both';
            if (target === 'english') return; // Skip English-only items

            const cat = art.category?.toLowerCase() || '';
            const titleHi = art.title_hi || art.title || '';
            const summaryHi = art.summary_hi || art.summary || '';
            const tagsText = (art.tags || []).join(' ').toLowerCase();

            const matchesTopic = activeTopic === 'all'
              || cat === activeTopic
              || (activeTopic === 'editorials' && (cat === 'editorial' || cat === 'editorials' || cat === 'mains'))
              || (activeTopic === 'arunachal' && cat === 'arunachal');

            const matchesQuery = !query || titleHi.toLowerCase().includes(query) || cat.includes(query) || tagsText.includes(query);

            if (matchesTopic && matchesQuery) {
              all.push({
                title: titleHi,
                summary: summaryHi,
                date: ed.publishDate || '',
                category: art.category || 'NATIONAL',
                slug: art.slug || '',
                editionId: ed.id || '',
              });
            }
          });
        });
    }
    return all.slice(0, 24);
  }, [editions, activeTopic, searchQuery]);

  const latestDailyHref = useMemo(() => {
    if (!Array.isArray(editions) || editions.length === 0) return '/current-affairs/daily';
    const latest = [...editions]
      .filter(e => (e.publish_target || 'both') !== 'english')
      .sort((a, b) => (b.publishDate || '').localeCompare(a.publishDate || ''))[0];
    if (!latest || !latest.publishDate) return '/current-affairs/daily';
    return `/current-affairs/daily?date=${latest.publishDate}`;
  }, [editions]);

  const today = new Date();
  const todayStrHi = today.toLocaleDateString('hi-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const catStyle: Record<string, string> = {
    NATIONAL:      'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    INTERNATIONAL: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
    BIHAR:         'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    ARUNACHAL:     'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  };

  const catHindiLabel: Record<string, string> = {
    NATIONAL:      'राष्ट्रीय घटनाक्रम',
    INTERNATIONAL: 'अंतर्राष्ट्रीय संबंध',
    BIHAR:         'बिहार विशेष',
    ARUNACHAL:     'अरुणाचल विशेष',
  };

  return (
    <div className="min-h-screen bg-[var(--bg-color)]">
      {/* ── Hero Banner ───────────────────────────────────────── */}
      <div
        className="relative z-20 border-b border-slate-200 dark:border-white/[0.07]"
        style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 60%, #1E40AF 100%)' }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 py-7 sm:py-9 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2 flex-1 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                </span>
                <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-[0.2em]">दैनिक हिन्दी सामयिकी पोर्टल</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-heading font-black text-white leading-tight">
                दैनिक समसामयिकी एवं संपादकीय विश्लेषण
              </h1>
              <p className="text-xs text-blue-100 font-medium">
                BPSC एवं राज्य सिविल सेवा परीक्षाओं हेतु प्रामाणिक राष्ट्रीय, अंतर्राष्ट्रीय व बिहार विशेष करेंट अफेयर्स।
              </p>

              {/* 🔍 TOPIC SEARCH INPUT BAR */}
              <div className="relative max-w-md pt-1">
                <Search className="w-4 h-4 text-amber-400 absolute left-3.5 top-[18px] -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="विषय या कीवर्ड खोजें (जैसे: बजट, बिहार, राज्यपाल, निर्वाचन)..."
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
              {/* Date Badge */}
              <div className="bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl px-4 py-2.5 flex items-center gap-2.5 shadow-md select-none">
                <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="text-left">
                  <p className="text-[9px] font-extrabold text-blue-300 uppercase tracking-wider leading-none">
                    आज की तिथि
                  </p>
                  <p className="text-xs font-black text-white whitespace-nowrap mt-0.5">
                    {todayStrHi}
                  </p>
                </div>
              </div>

              {/* Seamless Switch back to English Portal Button */}
              <Link
                href="/current-affairs"
                onClick={() => setLocale('en', true)}
                className="flex items-center justify-center gap-1.5 px-3.5 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold rounded-2xl transition-all hover:scale-[1.02] shadow-sm"
              >
                <Globe className="w-3.5 h-3.5 text-blue-300" />
                <span>Switch to English Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              {/* Read Today's Hindi CTA */}
              <Link
                href={latestDailyHref}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-2xl transition-all hover:scale-[1.02] shadow-md shadow-amber-500/20"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>आज का करेंट अफेयर्स</span>
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
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-3 space-y-4 shadow-xs">
                <div className="space-y-0.5">
                  <SidebarSection icon={<Flame className="w-3.5 h-3.5" />} title="दैनिक अपडेट्स" />
                  <SidebarItem label="आज के मुख्य समाचार" href="/current-affairs/daily" />
                </div>

                <div className="h-px bg-slate-100 dark:bg-white/[0.06]" />

                <div className="space-y-0.5">
                  <SidebarSection icon={<Layers className="w-3.5 h-3.5" />} title="साप्ताहिक व मासिक संग्रह" />
                  <SidebarItem label="साप्ताहिक संकलन" href="/current-affairs/weekly" />
                  <SidebarItem label="मासिक पत्रिका" href="/current-affairs/monthly" />
                </div>

                <div className="h-px bg-slate-100 dark:bg-white/[0.06]" />

                <div className="space-y-0.5">
                  <SidebarSection icon={<TrendingUp className="w-3.5 h-3.5" />} title="विषयवार संकलन" />
                  <SidebarItem label="राष्ट्रीय घटनाक्रम" href="/current-affairs/daily?topic=national" />
                  <SidebarItem label="अंतर्राष्ट्रीय मामले" href="/current-affairs/daily?topic=international" />
                  <SidebarItem label="बिहार विशेष परिप्रेक्ष्य" href="/current-affairs/daily?topic=bihar" />
                </div>
              </div>
            </div>
          </aside>

          {/* ════ MAIN CONTENT ════ */}
          <main className="flex-1 min-w-0 space-y-10">
            {/* Topic Filter Chips */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-heading font-black text-[var(--text-color)]">
                  हिंदी सामयिकी लेख एवं संपादकीय
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    { key: 'all',           label: 'सभी विषय (All Topics)', color: 'bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-white/10' },
                    { key: 'editorials',    label: '✍️ संपादकीय व मुख्य परीक्षा नोट्स', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },
                    { key: 'national',      label: 'राष्ट्रीय (National)', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
                    { key: 'international', label: 'अंतर्राष्ट्रीय (International)', color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20' },
                    { key: 'bihar',         label: 'बिहार विशेष (Bihar Special)', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
                  ] as const
                ).map(item => (
                  <button
                    key={item.key}
                    onClick={() => setActiveTopic(item.key)}
                    className={`px-4 py-2 rounded-full border text-xs font-extrabold tracking-wide transition-all duration-150 cursor-pointer ${item.color} ${activeTopic === item.key ? 'ring-2 ring-offset-1 ring-amber-400/50 dark:ring-offset-slate-900' : 'opacity-80 hover:opacity-100'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {recentArticles.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {recentArticles.map((art, i) => (
                    <Link
                      key={i}
                      href={`/current-affairs/daily/${art.date}/${art.category.toLowerCase()}/${art.slug}`}
                      className="group bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden hover:border-amber-500/30 hover:-translate-y-1 transition-all duration-200 shadow-xs flex flex-col justify-between"
                    >
                      <div className={`h-1.5 w-full ${art.category === 'BIHAR' ? 'bg-amber-500' : art.category === 'INTERNATIONAL' ? 'bg-violet-500' : 'bg-blue-500'}`} />
                      <div className="p-4 space-y-2.5 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${catStyle[art.category] || catStyle.NATIONAL}`}>
                            {catHindiLabel[art.category] || art.category}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDisplayDateHindi(art.date)}
                          </span>
                        </div>
                        <h3 className="text-xs font-bold text-[var(--text-color)] leading-relaxed line-clamp-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                          {art.title}
                        </h3>
                        {art.summary && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                            {art.summary}
                          </p>
                        )}
                      </div>
                      <div className="p-4 pt-0 text-[10px] font-bold text-amber-500 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        <span>पूरा लेख पढ़ें</span>
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-white/10">
                  <p className="text-xs text-slate-400">कोई लेख उपलब्ध नहीं है। कृपया फ़िल्टर बदलें।</p>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
