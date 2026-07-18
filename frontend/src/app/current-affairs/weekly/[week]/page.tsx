'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Calendar, ArrowLeft, Layers, ArrowRight, Clock, HelpCircle } from 'lucide-react';
import { db, DynamicCurrentAffairEdition, DynamicCurrentAffairArticle } from '@/services/db';

export default function WeeklyCompendiumViewer() {
  const params = useParams();
  const weekStr = params.week as string; // week-29-2026
  const [editions, setEditions] = useState<DynamicCurrentAffairEdition[]>([]);
  const [loading, setLoading] = useState(true);

  // Parse week number and year
  const parts = weekStr.split('-');
  const targetWeek = parseInt(parts[1], 10);
  const targetYear = parseInt(parts[2], 10);

  useEffect(() => {
    async function loadEditions() {
      try {
        const list = await db.getDynamicCurrentAffairsEditions(false);
        setEditions(list);
      } catch (err) {
        console.error('Error loading editions for weekly:', err);
      } finally {
        setLoading(false);
      }
    }
    loadEditions();
  }, []);

  // ISO Week calculator
  function getISOWeekAndYear(dateStr: string) {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { week: 0, year: 0 };
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return { week: weekNo, year: d.getFullYear() };
  }

  // Filter editions belonging to the target ISO week
  const weeklyEditions = editions.filter(ed => {
    const { week, year } = getISOWeekAndYear(ed.publishDate);
    return week === targetWeek && year === targetYear;
  });

  const allArticles: DynamicCurrentAffairArticle[] = [];
  weeklyEditions.forEach(ed => {
    if (ed.articles) {
      allArticles.push(...ed.articles);
    }
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 font-body space-y-8">
      {/* Back button */}
      <Link
        href="/current-affairs"
        className="text-xs font-bold text-amber-500 hover:text-amber-600 transition-colors flex items-center gap-1 w-fit"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Current Affairs Portal</span>
      </Link>

      {/* Header */}
      <div className="bg-linear-to-br from-slate-900 via-indigo-950 to-slate-950 text-white rounded-3xl p-8 sm:p-10 border border-white/[0.06] space-y-3">
        <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg w-fit flex items-center gap-1">
          <Layers className="w-3.5 h-3.5" />
          <span>Weekly Digest Portal</span>
        </span>
        <h1 className="text-3xl font-heading font-black tracking-tight">Week {targetWeek}, {targetYear} Compendium</h1>
        <p className="text-xs text-slate-350 max-w-2xl leading-relaxed">
          Aggregated weekly view of all daily affairs. This compilation is generated automatically from daily editorial publications.
        </p>
      </div>

      {loading ? (
        <div className="text-slate-500 text-xs font-semibold">Generating weekly view...</div>
      ) : weeklyEditions.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/[0.06] rounded-3xl space-y-4">
          <Layers className="w-12 h-12 text-slate-400 mx-auto" />
          <div className="space-y-1">
            <h3 className="font-heading font-bold text-sm text-slate-700 dark:text-slate-350">No Editions Registered in ISO Week {targetWeek}</h3>
            <p className="text-[11px] text-slate-550 max-w-xs mx-auto">
              Choose another weekly compendium or check our daily uploads feed.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Daily Links Left */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/[0.06] p-6 rounded-3xl shadow-xs space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider border-b border-slate-50 dark:border-white/[0.02] pb-2">
              Daily Feed Links
            </h3>
            <div className="space-y-3">
              {weeklyEditions.map(ed => {
                const dateObj = new Date(ed.publishDate);
                const formattedDate = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
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

          {/* Compiled Articles List Right */}
          <div className="lg:col-span-8 space-y-6">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex justify-between items-center">
              <span>Compiled Articles ({allArticles.length})</span>
              <span className="text-[10px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-lg font-bold">Auto Digest</span>
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
                  <h4 className="font-heading font-black text-sm text-slate-955 dark:text-white group-hover:text-amber-500 transition-colors">
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
