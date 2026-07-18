'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, ArrowLeft, ArrowRight, Grid, Filter } from 'lucide-react';
import { db, DynamicCurrentAffairEdition } from '@/services/db';

export default function DailyEditionsList() {
  const [editions, setEditions] = useState<DynamicCurrentAffairEdition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEditions() {
      try {
        const list = await db.getDynamicCurrentAffairsEditions(false);
        setEditions(list);
      } catch (err) {
        console.error('Error loading daily editions:', err);
      } finally {
        setLoading(false);
      }
    }
    loadEditions();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 font-body space-y-8">
      {/* Back to landing */}
      <Link
        href="/current-affairs"
        className="text-xs font-bold text-amber-500 hover:text-amber-600 transition-colors flex items-center gap-1 w-fit"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Current Affairs Portal</span>
      </Link>

      <div className="space-y-2 border-b border-slate-100 dark:border-white/[0.06] pb-6">
        <h1 className="text-3xl font-heading font-black text-slate-900 dark:text-white leading-tight">
          Daily Current Affairs Feed
        </h1>
        <p className="text-xs text-slate-500 max-w-xl">
          Track syllabus updates day-by-day. Select a date below to read daily articles mapped to National, International, and Bihar categories.
        </p>
      </div>

      {loading ? (
        <div className="text-slate-500 text-xs font-semibold">Loading feed history...</div>
      ) : editions.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/[0.06] rounded-3xl">
          <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="font-heading font-bold text-sm text-slate-700 dark:text-slate-350">No Daily Editions Found</h3>
          <p className="text-[11px] text-slate-550 mt-1 max-w-xs mx-auto">
            Please log into the Admin portal and create a new daily current affairs edition.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {editions.map(ed => {
            const dateObj = new Date(ed.publishDate);
            const formattedDate = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
            
            const nationalCount = ed.articles?.filter(a => a.category === 'NATIONAL').length || 0;
            const internationalCount = ed.articles?.filter(a => a.category === 'INTERNATIONAL').length || 0;
            const biharCount = ed.articles?.filter(a => a.category === 'BIHAR').length || 0;

            return (
              <div
                key={ed.id}
                className="bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/[0.06] rounded-3xl p-6 flex flex-col justify-between hover:border-amber-500/20 hover:shadow-md transition-all group"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                      <Calendar className="w-4 h-4" />
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{ed.publishDate}</span>
                  </div>
                  
                  <h3 className="font-heading font-black text-base text-slate-950 dark:text-white group-hover:text-amber-500 transition-colors">
                    {formattedDate} Edition
                  </h3>
                  
                  <p className="text-[11px] text-slate-500 line-clamp-3 leading-relaxed">
                    {ed.summary || 'Summary briefing of today\'s important issues, curated for high weightage exams.'}
                  </p>
                  
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    <span className="px-2 py-0.5 rounded-lg bg-amber-500/5 text-amber-600 dark:text-amber-400 text-[9px] font-bold">
                      National ({nationalCount})
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 text-[9px] font-bold">
                      International ({internationalCount})
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold">
                      Bihar ({biharCount})
                    </span>
                  </div>
                </div>

                <div className="pt-5 mt-5 border-t border-slate-50 dark:border-white/[0.02]">
                  <Link
                    href={`/current-affairs/daily/${ed.publishDate}`}
                    className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-all cursor-pointer border border-slate-100 dark:border-white/[0.04]"
                  >
                    <span>Read Full Edition</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
