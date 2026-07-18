'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Calendar, ArrowLeft, BookOpen, Layers, Award, Clock, ArrowRight } from 'lucide-react';
import { db, DynamicCurrentAffairEdition, DynamicCurrentAffairArticle } from '@/services/db';

export default function DailyEditionViewer() {
  const params = useParams();
  const dateStr = params.date as string; // YYYY-MM-DD
  const [edition, setEdition] = useState<DynamicCurrentAffairEdition | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEdition() {
      try {
        const ed = await db.getDynamicCurrentAffairsEditionByDate(dateStr, false);
        setEdition(ed);
      } catch (err) {
        console.error('Error loading edition details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadEdition();
  }, [dateStr]);

  const dateObj = new Date(dateStr);
  const formattedDate = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });

  // Separate articles by category
  const nationalArticles = edition?.articles?.filter(a => a.category === 'NATIONAL') || [];
  const internationalArticles = edition?.articles?.filter(a => a.category === 'INTERNATIONAL') || [];
  const biharArticles = edition?.articles?.filter(a => a.category === 'BIHAR') || [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 font-body space-y-8">
      {/* Back button */}
      <Link
        href="/current-affairs/daily"
        className="text-xs font-bold text-amber-500 hover:text-amber-600 transition-colors flex items-center gap-1 w-fit"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Daily Editions</span>
      </Link>

      {/* Header */}
      <div className="bg-linear-to-br from-slate-900 via-indigo-950 to-slate-950 text-white rounded-3xl p-8 sm:p-10 border border-white/[0.06] space-y-3">
        <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg w-fit flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>{dateStr} Daily Edition</span>
        </span>
        <h1 className="text-3xl font-heading font-black tracking-tight">{formattedDate} Edition</h1>
        <p className="text-xs text-slate-350 max-w-2xl leading-relaxed">
          {edition?.summary || 'Consolidated syllabus analysis of the day\'s high importance news themes.'}
        </p>
      </div>

      {loading ? (
        <div className="text-slate-500 text-xs font-semibold">Loading daily articles...</div>
      ) : !edition || (edition.articles || []).length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/[0.06] rounded-3xl">
          <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="font-heading font-bold text-sm text-slate-700 dark:text-slate-350">Edition Not Uploaded</h3>
          <p className="text-[11px] text-slate-550 mt-1 max-w-xs mx-auto">
            No articles have been compiled for this date. Check another calendar date.
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* 1. BIHAR SPECIAL SECTION */}
          {biharArticles.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xs font-black uppercase text-emerald-500 tracking-wider flex items-center gap-2 border-b border-emerald-500/10 pb-2">
                <Award className="w-4 h-4" />
                <span>Bihar Special (State Focus)</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {biharArticles.map(art => (
                  <Link
                    key={art.id}
                    href={`/current-affairs/daily/${dateStr}/bihar/${art.slug}`}
                    className="block p-6 bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/[0.06] rounded-2xl hover:border-emerald-500/30 hover:shadow-xs transition-all group"
                  >
                    <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 mb-2">
                      <span className="text-emerald-500 uppercase tracking-widest">{art.importance} IMPORTANCE</span>
                      <span>{art.readingTime}</span>
                    </div>
                    <h3 className="font-heading font-black text-sm text-slate-950 dark:text-white group-hover:text-emerald-500 transition-colors leading-snug">
                      {art.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                      {art.summary}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 2. NATIONAL AFFAIRS SECTION */}
          {nationalArticles.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xs font-black uppercase text-amber-500 tracking-wider flex items-center gap-2 border-b border-amber-500/10 pb-2">
                <BookOpen className="w-4 h-4" />
                <span>National Affairs</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {nationalArticles.map(art => (
                  <Link
                    key={art.id}
                    href={`/current-affairs/daily/${dateStr}/national/${art.slug}`}
                    className="block p-6 bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/[0.06] rounded-2xl hover:border-amber-500/30 hover:shadow-xs transition-all group"
                  >
                    <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 mb-2">
                      <span className="text-amber-500 uppercase tracking-widest">{art.importance} IMPORTANCE</span>
                      <span>{art.readingTime}</span>
                    </div>
                    <h3 className="font-heading font-black text-sm text-slate-950 dark:text-white group-hover:text-amber-500 transition-colors leading-snug">
                      {art.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                      {art.summary}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 3. INTERNATIONAL RELATIONSHIPS SECTION */}
          {internationalArticles.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xs font-black uppercase text-indigo-500 tracking-wider flex items-center gap-2 border-b border-indigo-500/10 pb-2">
                <Layers className="w-4 h-4" />
                <span>International Relations</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {internationalArticles.map(art => (
                  <Link
                    key={art.id}
                    href={`/current-affairs/daily/${dateStr}/international/${art.slug}`}
                    className="block p-6 bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/[0.06] rounded-2xl hover:border-indigo-500/30 hover:shadow-xs transition-all group"
                  >
                    <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 mb-2">
                      <span className="text-indigo-500 uppercase tracking-widest">{art.importance} IMPORTANCE</span>
                      <span>{art.readingTime}</span>
                    </div>
                    <h3 className="font-heading font-black text-sm text-slate-950 dark:text-white group-hover:text-indigo-500 transition-colors leading-snug">
                      {art.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                      {art.summary}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
