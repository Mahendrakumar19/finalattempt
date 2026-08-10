'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  FileText, CheckCircle, ArrowRight, Layers, BookOpen, Search, Filter
} from 'lucide-react';
import { db, TestSeriesItem } from '@/services/db';

export default function TestSeriesPage() {
  const [seriesList, setSeriesList] = useState<TestSeriesItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedExam, setSelectedExam] = useState<string>('All');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadData = useCallback(async () => {
    try {
      const list = await db.getTestSeries(false);
      setSeriesList(list || []);
    } catch (err) {
      console.error('Error loading test series:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Real-time synchronization listeners
    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener('test_series_updated', handleUpdate);
    window.addEventListener('focus', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('test_series_updated', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [loadData]);

  // Dynamic category options — derived ONLY from published data that exists
  const availableCategories = useMemo(() => {
    const ALLOWED = new Set(['Prelims', 'Mains']);
    const categories = new Set<string>();
    seriesList.forEach(s => {
      if (s.category && ALLOWED.has(s.category)) categories.add(s.category);
    });
    return ['All', 'Prelims', 'Mains'].filter(c => c === 'All' || categories.has(c));
  }, [seriesList]);

  // Dynamic exams derived from data
  const availableExams = useMemo(() => {
    const exams = new Set<string>();
    seriesList.forEach(s => {
      if (s.exam) exams.add(s.exam);
    });
    return ['All', ...Array.from(exams)];
  }, [seriesList]);

  // Dynamic languages derived from data
  const availableLanguages = useMemo(() => {
    const langs = new Set<string>();
    seriesList.forEach(s => {
      if (s.language) langs.add(s.language);
    });
    return ['All', ...Array.from(langs)];
  }, [seriesList]);

  // Filtered series
  const filteredSeries = useMemo(() => {
    return seriesList.filter(s => {
      if (selectedCategory !== 'All' && s.category !== selectedCategory) return false;
      if (selectedExam !== 'All' && s.exam !== selectedExam) return false;
      if (selectedLanguage !== 'All' && s.language !== selectedLanguage) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = s.title.toLowerCase().includes(q);
        const matchDesc = s.description.toLowerCase().includes(q);
        const matchExam = s.exam.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchExam) return false;
      }
      return true;
    });
  }, [seriesList, selectedCategory, selectedExam, selectedLanguage, searchQuery]);

  return (
    <div className="min-h-screen bg-[var(--bg-color)] py-10 px-4 sm:px-6 lg:px-8 space-y-8 font-body">

      {/* ── Dynamic Category Filter Tabs & Filter Bar ───────────────────── */}
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Dynamic Category Pill Tabs */}
        {availableCategories.length > 1 && (
          <div className="flex flex-wrap justify-center sm:justify-start gap-2 border-b border-[var(--card-border)] pb-4">
            {availableCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${selectedCategory === cat
                    ? 'bg-amber-500 text-slate-950 shadow-md scale-[1.02]'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 bg-[var(--card-bg)] border border-[var(--card-border)]'
                  }`}
              >
                <span>{cat === 'All' ? 'All Test Series' : `${cat} Series`}</span>
              </button>
            ))}
          </div>
        )}

        {/* Inline Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search test series by exam, subject, or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 text-xs bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-[var(--text-color)] font-medium shadow-xs"
            />
          </div>

          {availableExams.length > 2 && (
            <div className="flex items-center gap-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl px-3 py-2 shrink-0">
              <Filter className="w-3.5 h-3.5 text-amber-500" />
              <select
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
                className="bg-transparent text-xs font-bold text-[var(--text-color)] outline-none cursor-pointer"
              >
                <option value="All">All Target Exams</option>
                {availableExams.filter(e => e !== 'All').map(ex => (
                  <option key={ex} value={ex}>{ex}</option>
                ))}
              </select>
            </div>
          )}

          {availableLanguages.length > 2 && (
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="px-4 py-3.5 text-xs font-bold bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl outline-none text-[var(--text-color)] cursor-pointer shadow-xs shrink-0"
            >
              <option value="All">All Languages</option>
              {availableLanguages.filter(l => l !== 'All').map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* ── Test Series Grid ────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] animate-pulse" />
            ))}
          </div>
        ) : filteredSeries.length === 0 ? (
          <div className="p-16 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] text-center max-w-md mx-auto space-y-3">
            <FileText className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="text-base font-heading font-bold text-[var(--text-color)]">No Test Series Found</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              No active test series matched your selected filter criteria. Try choosing &quot;All&quot; from the options above.
            </p>
            <button
              onClick={() => { setSelectedCategory('All'); setSelectedExam('All'); setSelectedLanguage('All'); setSearchQuery(''); }}
              className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredSeries.map((series) => {
              const hasDiscount = series.discountedPrice && series.discountedPrice < series.price;
              const displayPrice = hasDiscount ? series.discountedPrice : series.price;

              return (
                <div
                  key={series.id}
                  className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl overflow-hidden hover:border-amber-500/40 shadow-xs hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group relative"
                >
                  {/* Category & Status Badges Overlay */}
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-white/5 pb-3">
                      <span className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        {series.exam || series.category}
                      </span>
                      {series.status === 'coming_soon' ? (
                        <span className="px-3 py-1 rounded-xl text-[9px] font-extrabold uppercase tracking-wider bg-orange-500/10 text-orange-600 border border-orange-500/20">
                          Coming Soon
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-xl text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Enrollment Open
                        </span>
                      )}
                    </div>

                    {/* Title & Description */}
                    <div className="space-y-2">
                      <h3 className="font-heading font-black text-lg text-[var(--text-color)] group-hover:text-amber-500 transition-colors leading-snug">
                        {series.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                        {series.description}
                      </p>
                    </div>

                    {/* Quick Specs Metrics Pills */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="flex items-center gap-2.5 p-2.5 bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-xs">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Total Mocks</span>
                          <span className="text-xs font-black text-slate-900 dark:text-white">{series.totalTests} Tests</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 p-2.5 bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-xs">
                        <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Questions</span>
                          <span className="text-xs font-black text-slate-900 dark:text-white">{series.totalQuestions} Qs</span>
                        </div>
                      </div>
                    </div>

                    {/* Highlights Bullet List (Top 3) */}
                    {series.highlights && series.highlights.length > 0 && (
                      <ul className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/5">
                        {series.highlights.slice(0, 3).map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                            <CheckCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Pricing & Footer CTA */}
                  <div className="p-5 bg-white dark:bg-slate-900/60 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Course Fee</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-heading font-black text-slate-900 dark:text-white">
                          ₹{displayPrice?.toLocaleString()}
                        </span>
                        {hasDiscount && (
                          <span className="text-xs font-bold text-slate-400 line-through">
                            ₹{series.price.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <Link
                      href={`/test-series/${series.slug}`}
                      className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-2xl text-xs flex items-center gap-1.5 transition-all shadow-md group-hover:scale-[1.03]"
                    >
                      <span>Explore Program</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
