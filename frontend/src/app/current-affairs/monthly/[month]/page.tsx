'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { BookOpen, ArrowLeft, ArrowRight, Award, Layers, Download } from 'lucide-react';
import { db, DynamicCurrentAffairEdition, DynamicCurrentAffairArticle } from '@/services/db';

const MONTH_NAMES_LIST = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const MONTH_CODE: Record<string, string> = {
  january:'01', february:'02', march:'03', april:'04', may:'05', june:'06',
  july:'07', august:'08', september:'09', october:'10', november:'11', december:'12',
};
const CODE_MONTH: Record<string, string> = Object.fromEntries(
  Object.entries(MONTH_CODE).map(([name, code]) => [code, name])
);

export default function MonthlyCompendiumViewer() {
  const params   = useParams();
  const router   = useRouter();
  const monthStr = params.month as string; // july-2026

  const urlParts        = monthStr.split('-');
  const urlMonthName    = urlParts[0].toLowerCase();
  const urlYear         = parseInt(urlParts[1], 10);

  const [editions, setEditions] = useState<DynamicCurrentAffairEdition[]>([]);
  const [loading, setLoading]   = useState(true);

  const [selectedYear,  setSelectedYear]  = useState<number>(urlYear);
  const [selectedMonth, setSelectedMonth] = useState<string>(urlMonthName); // e.g. 'july'

  useEffect(() => {
    db.getDynamicCurrentAffairsEditions(false)
      .then(list => setEditions(list || []))
      .catch(err => console.error('Error loading monthly editions:', err))
      .finally(() => setLoading(false));
  }, []);

  // ── derive years that actually have content ───────────────────────────────
  const availableYears = useMemo(() => {
    const yrs = new Set<number>();
    editions.forEach(ed => yrs.add(Number(ed.publishDate.split('-')[0])));
    return Array.from(yrs).sort((a, b) => b - a);
  }, [editions]);

  // ── derive months that actually have content for the selected year ─────────
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    editions.forEach(ed => {
      const [yr, mo] = ed.publishDate.split('-');
      if (Number(yr) === selectedYear) months.add(CODE_MONTH[mo]);
    });
    // Sort by calendar order
    return MONTH_NAMES_LIST.map(m => m.toLowerCase()).filter(m => months.has(m));
  }, [editions, selectedYear]);

  // ── collect articles for the selected month/year ───────────────────────────
  const monthlyArticles = useMemo<DynamicCurrentAffairArticle[]>(() => {
    const targetCode = MONTH_CODE[selectedMonth];
    const articles: DynamicCurrentAffairArticle[] = [];
    editions.forEach(ed => {
      const [yr, mo] = ed.publishDate.split('-');
      if (Number(yr) === selectedYear && mo === targetCode) {
        articles.push(...(ed.articles || []));
      }
    });
    return articles;
  }, [editions, selectedYear, selectedMonth]);

  const nationalArticles      = monthlyArticles.filter(a => a.category === 'NATIONAL');
  const internationalArticles = monthlyArticles.filter(a => a.category === 'INTERNATIONAL');
  const biharArticles         = monthlyArticles.filter(a => a.category === 'BIHAR');

  const navigate = (yr: number, mo: string) => {
    router.push(`/current-affairs/monthly/${mo}-${yr}`);
  };

  const handleYearChange = (yr: number) => {
    setSelectedYear(yr);
    // Reset month — will auto-select first available
    setSelectedMonth('');
  };

  // Auto-select first available month when year changes
  useEffect(() => {
    if (availableMonths.length > 0 && !availableMonths.includes(selectedMonth)) {
      setSelectedMonth(availableMonths[0]);
    }
  }, [availableMonths]);

  // Sync URL
  useEffect(() => {
    if (selectedMonth) navigate(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

  const displayMonth = selectedMonth
    ? selectedMonth.charAt(0).toUpperCase() + selectedMonth.slice(1)
    : '';

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

      {/* Header + Filters */}
      <div className="bg-linear-to-br from-slate-900 via-indigo-950 to-slate-950 text-white rounded-3xl p-8 sm:p-10 border border-white/[0.06] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg w-fit flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Monthly Current Affairs</span>
          </span>
          <h1 className="text-3xl font-heading font-black tracking-tight uppercase">
            {displayMonth} {selectedYear}
          </h1>
          <p className="text-xs text-slate-400 max-w-xl">
            {loading
              ? 'Loading…'
              : availableYears.length === 0
              ? 'No monthly content published yet.'
              : `${monthlyArticles.length} article${monthlyArticles.length === 1 ? '' : 's'} for ${displayMonth} ${selectedYear}.`}
          </p>
        </div>

        {/* Dynamic filters */}
        {!loading && availableYears.length > 0 && (
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-3 shrink-0 min-w-[180px]">
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

            {availableMonths.length > 0 && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Month</label>
                <select
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/20 rounded-xl text-xs font-bold text-white outline-none cursor-pointer"
                >
                  {availableMonths.map(mo => (
                    <option key={mo} value={mo}>
                      {mo.charAt(0).toUpperCase() + mo.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {monthlyArticles.length > 0 && (
          <button
            onClick={() => alert('PDF compilation is being generated.')}
            className="px-5 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-2xl text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-slate-500 text-xs font-semibold">Loading monthly compilation…</div>
      ) : availableYears.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/[0.06] rounded-3xl space-y-3">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="font-heading font-bold text-sm text-slate-700 dark:text-slate-300">No monthly content published yet.</h3>
        </div>
      ) : monthlyArticles.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/[0.06] rounded-3xl space-y-3">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="font-heading font-bold text-sm text-slate-700 dark:text-slate-300">
            No articles for {displayMonth} {selectedYear}
          </h3>
          {availableMonths.length > 0 && (
            <p className="text-xs text-slate-400">Try selecting a different month from the filter above.</p>
          )}
        </div>
      ) : (
        <div className="space-y-12">
          {biharArticles.length > 0 && (
            <ArticleSection title="Bihar Special" count={biharArticles.length} color="emerald" icon={<Award className="w-4 h-4" />} articles={biharArticles} />
          )}
          {nationalArticles.length > 0 && (
            <ArticleSection title="National" count={nationalArticles.length} color="amber" icon={<BookOpen className="w-4 h-4" />} articles={nationalArticles} />
          )}
          {internationalArticles.length > 0 && (
            <ArticleSection title="International" count={internationalArticles.length} color="indigo" icon={<Layers className="w-4 h-4" />} articles={internationalArticles} />
          )}
        </div>
      )}
    </div>
  );
}

function ArticleSection({ title, count, color, icon, articles }: {
  title: string; count: number; color: string; icon: React.ReactNode;
  articles: DynamicCurrentAffairArticle[];
}) {
  const colorMap: Record<string, string> = {
    emerald: 'text-emerald-500 border-emerald-500/10 hover:border-emerald-500/30 group-hover:text-emerald-500',
    amber:   'text-amber-500   border-amber-500/10   hover:border-amber-500/30   group-hover:text-amber-500',
    indigo:  'text-indigo-500  border-indigo-500/10  hover:border-indigo-500/30  group-hover:text-indigo-500',
  };
  const cls = colorMap[color] || colorMap.amber;
  return (
    <div className="space-y-4">
      <h2 className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b pb-2 ${cls}`}>
        {icon}<span>{title} ({count})</span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {articles.map(art => (
          <Link
            key={art.id}
            href={`/current-affairs/daily/${art.publishedDate}/${art.category.toLowerCase()}/${art.slug}`}
            className={`block p-5 bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/[0.06] rounded-2xl transition-all group ${cls}`}
          >
            <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 mb-1.5">
              <span>{art.publishedDate}</span>
              <span>{art.readingTime}</span>
            </div>
            <h3 className={`font-heading font-black text-sm text-slate-950 dark:text-white transition-colors leading-snug ${cls}`}>
              {art.title}
            </h3>
          </Link>
        ))}
      </div>
    </div>
  );
}
