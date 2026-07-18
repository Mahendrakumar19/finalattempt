'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Calendar, BookOpen, Layers, Award, Clock, ArrowRight, Grid } from 'lucide-react';
import { db, DynamicCurrentAffairEdition, DynamicCurrentAffairArticle } from '@/services/db';

// Compute current ISO week number
function getCurrentISOWeek(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

const MONTH_NAMES = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

export default function CurrentAffairsLanding() {
  const [editions, setEditions] = useState<DynamicCurrentAffairEdition[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedExam, setSelectedExam] = useState('All');
  const [searchResults, setSearchResults] = useState<DynamicCurrentAffairArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const list = await db.getDynamicCurrentAffairsEditions(false);
        setEditions(list);
      } catch (err) {
        console.error('Error loading current affairs editions:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery && selectedSubject === 'All' && selectedExam === 'All') {
      setSearchResults([]);
      return;
    }
    const params: Record<string, string> = {};
    if (searchQuery) params.keyword = searchQuery;
    if (selectedSubject !== 'All') params.subject = selectedSubject;
    if (selectedExam !== 'All') params.exam = selectedExam;

    const res = await db.getDynamicCurrentAffairsSearch(params);
    setSearchResults(res);
  };

  const subjects = ['All', 'Polity', 'Economy', 'Geography', 'History', 'Environment', 'Science & Technology', 'Agriculture', 'Culture', 'Governance', 'International Relations'];
  const exams = ['All', 'UPSC', 'BPSC', 'BSSC', 'SSC', 'Railway'];

  // Calculate quick stats
  const totalArticles = editions.reduce((acc, ed) => acc + (ed.articles?.length || 0), 0);
  const nationalCount = editions.reduce((acc, ed) => acc + (ed.articles?.filter(a => a.category === 'NATIONAL').length || 0), 0);
  const internationalCount = editions.reduce((acc, ed) => acc + (ed.articles?.filter(a => a.category === 'INTERNATIONAL').length || 0), 0);
  const biharCount = editions.reduce((acc, ed) => acc + (ed.articles?.filter(a => a.category === 'BIHAR').length || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 font-body space-y-12">
      {/* Hero Header */}
      <div className="bg-linear-to-br from-slate-900 via-slate-950 to-indigo-950 text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-xl border border-white/[0.06]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.12),transparent_45%)]" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-lg">
            Final Attempt Portal
          </span>
          <h1 className="text-3xl sm:text-5xl font-heading font-black tracking-tight leading-tight">
            Dynamic Current Affairs
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Every day, our editorial desk updates Bihar-specific, National, and International current events.
            These daily updates aggregate automatically into weekly, monthly, and yearly compendiums.
          </p>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/10 mt-6">
            <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-2xl">
              <span className="block text-[10px] uppercase font-bold text-slate-400">Total Updates</span>
              <span className="text-xl font-heading font-black text-white">{totalArticles}</span>
            </div>
            <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-2xl">
              <span className="block text-[10px] uppercase font-bold text-slate-400">National</span>
              <span className="text-xl font-heading font-black text-amber-500">{nationalCount}</span>
            </div>
            <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-2xl">
              <span className="block text-[10px] uppercase font-bold text-slate-400">International</span>
              <span className="text-xl font-heading font-black text-indigo-400">{internationalCount}</span>
            </div>
            <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-2xl">
              <span className="block text-[10px] uppercase font-bold text-slate-400">Bihar Special</span>
              <span className="text-xl font-heading font-black text-emerald-400">{biharCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Global Search Card */}
      <div className="bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/[0.06] rounded-3xl p-6 shadow-xs">
        <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-4">
          Global Archives Query Engine
        </h3>
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search across titles, summaries, and article content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-2xl text-xs transition-all shadow-md cursor-pointer"
            >
              Search Database
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subject Filter</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                {subjects.map(sub => (
                  <option key={sub}>{sub}</option>
                ))}
              </select>
            </div>
          </div>
        </form>
      </div>

      {/* Global Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
            <span>Query Results ({searchResults.length} articles found)</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {searchResults.map(art => (
              <Link
                key={art.id}
                href={`/current-affairs/daily/${art.publishedDate}/${art.category.toLowerCase()}/${art.slug}`}
                className="block p-5 bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/[0.06] rounded-2xl hover:border-amber-500/30 hover:shadow-md transition-all group"
              >
                <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 mb-2">
                  <span className="text-amber-500 uppercase tracking-widest">{art.category}</span>
                  <span>{art.publishedDate}</span>
                </div>
                <h4 className="font-heading font-black text-sm text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors line-clamp-1">
                  {art.title}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
                  {art.summary}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Primary Category Compilation Directories */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Daily card */}
        <Link
          href="/current-affairs/daily"
          className="bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/[0.06] p-6 rounded-3xl space-y-4 hover:border-amber-500/30 hover:-translate-y-1 transition-all shadow-xs group"
        >
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-black text-lg text-slate-950 dark:text-white group-hover:text-amber-500 transition-colors">
              Daily Feed
            </h3>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Explore micro-articles mapped directly to current date parameters and national headings.
            </p>
          </div>
          <span className="text-[10px] font-bold uppercase text-amber-500 tracking-wider flex items-center gap-1">
            <span>Access Daily</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </span>
        </Link>

        {/* Weekly card */}
        <Link
          href={`/current-affairs/weekly/week-${getCurrentISOWeek()}-${new Date().getFullYear()}`}
          className="bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/[0.06] p-6 rounded-3xl space-y-4 hover:border-amber-500/30 hover:-translate-y-1 transition-all shadow-xs group"
        >
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-black text-lg text-slate-950 dark:text-white group-hover:text-amber-500 transition-colors">
              Weekly Digest
            </h3>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Automated ISO weekly digests grouping all daily uploads with statistical counters.
            </p>
          </div>
          <span className="text-[10px] font-bold uppercase text-amber-500 tracking-wider flex items-center gap-1">
            <span>Access Weekly</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </span>
        </Link>

        {/* Monthly card */}
        <Link
          href={`/current-affairs/monthly/${MONTH_NAMES[new Date().getMonth()]}-${new Date().getFullYear()}`}
          className="bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/[0.06] p-6 rounded-3xl space-y-4 hover:border-amber-500/30 hover:-translate-y-1 transition-all shadow-xs group"
        >
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-black text-lg text-slate-950 dark:text-white group-hover:text-amber-500 transition-colors">
              Monthly Compendium
            </h3>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Consolidated summaries by month. PDF downloads available for quick printing.
            </p>
          </div>
          <span className="text-[10px] font-bold uppercase text-amber-500 tracking-wider flex items-center gap-1">
            <span>Access Monthly</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </span>
        </Link>

        {/* Yearly card */}
        <Link
          href={`/current-affairs/yearly/${new Date().getFullYear()}`}
          className="bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/[0.06] p-6 rounded-3xl space-y-4 hover:border-amber-500/30 hover:-translate-y-1 transition-all shadow-xs group"
        >
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-550">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-black text-lg text-slate-950 dark:text-white group-hover:text-amber-500 transition-colors">
              Yearly Booklets
            </h3>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Annual consolidated indices mapping high-weightage topics for upcoming exams.
            </p>
          </div>
          <span className="text-[10px] font-bold uppercase text-amber-500 tracking-wider flex items-center gap-1">
            <span>Access Yearly</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </span>
        </Link>
      </div>

      {/* Latest Daily Editions List */}
      <div className="space-y-6">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/[0.06] pb-4">
          <h2 className="text-xl font-heading font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Grid className="w-5 h-5 text-amber-500" />
            <span>Latest Editorial Editions</span>
          </h2>
          <Link
            href="/current-affairs/daily"
            className="text-xs font-bold text-amber-500 hover:text-amber-600 transition-colors flex items-center gap-1"
          >
            <span>View Calendar Archive</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <p className="text-slate-500 text-xs">Loading latest editions...</p>
        ) : editions.length === 0 ? (
          <p className="text-slate-500 text-xs">No current affairs editions uploaded yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {editions.slice(0, 3).map(ed => {
              const dateObj = new Date(ed.publishDate);
              const formattedDate = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });

              return (
                <div
                  key={ed.id}
                  className="bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/[0.06] rounded-3xl p-6 space-y-4 hover:border-amber-500/20 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formattedDate}</span>
                    </span>
                    <h4 className="font-heading font-black text-md text-slate-950 dark:text-white leading-tight">
                      Daily Edition Summary
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                      {ed.summary || 'Editorial brief with complete category analysis for BPSC aspirants.'}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-50 dark:border-white/[0.02] flex items-center justify-between mt-4">
                    <span className="text-[10px] font-bold text-slate-400">
                      {ed.articles?.length || 0} Articles
                    </span>
                    <Link
                      href={`/current-affairs/daily/${ed.publishDate}`}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold rounded-xl text-[10px] transition-all cursor-pointer"
                    >
                      Read Edition
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
