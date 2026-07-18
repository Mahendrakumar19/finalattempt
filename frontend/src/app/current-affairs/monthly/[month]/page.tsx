'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Calendar, ArrowLeft, BookOpen, Layers, Award, Clock, ArrowRight, Download } from 'lucide-react';
import { db, DynamicCurrentAffairEdition, DynamicCurrentAffairArticle } from '@/services/db';

export default function MonthlyCompendiumViewer() {
  const params = useParams();
  const monthStr = params.month as string; // july-2026
  const [editions, setEditions] = useState<DynamicCurrentAffairEdition[]>([]);
  const [loading, setLoading] = useState(true);

  // Parse month and year
  const parts = monthStr.split('-');
  const targetMonthName = parts[0].toLowerCase(); // july
  const targetYear = parseInt(parts[1], 10);      // 2026

  useEffect(() => {
    async function loadEditions() {
      try {
        const list = await db.getDynamicCurrentAffairsEditions(false);
        setEditions(list);
      } catch (err) {
        console.error('Error loading editions for monthly:', err);
      } finally {
        setLoading(false);
      }
    }
    loadEditions();
  }, []);

  // Filter articles belonging to the target month and year
  const monthsMap: Record<string, string> = {
    january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
    july: '07', august: '08', september: '09', october: '10', november: '11', december: '12'
  };
  const targetMonthCode = monthsMap[targetMonthName];

  const monthlyArticles: DynamicCurrentAffairArticle[] = [];
  editions.forEach(ed => {
    const edParts = ed.publishDate.split('-'); // YYYY-MM-DD
    const edYear = parseInt(edParts[0], 10);
    const edMonth = edParts[1];

    if (edYear === targetYear && edMonth === targetMonthCode) {
      if (ed.articles) {
        monthlyArticles.push(...ed.articles);
      }
    }
  });

  // Separate monthly articles by category
  const nationalArticles = monthlyArticles.filter(a => a.category === 'NATIONAL');
  const internationalArticles = monthlyArticles.filter(a => a.category === 'INTERNATIONAL');
  const biharArticles = monthlyArticles.filter(a => a.category === 'BIHAR');

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
      <div className="bg-linear-to-br from-slate-900 via-indigo-950 to-slate-950 text-white rounded-3xl p-8 sm:p-10 border border-white/[0.06] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-3">
          <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg w-fit flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Monthly Compendium Portal</span>
          </span>
          <h1 className="text-3xl font-heading font-black tracking-tight uppercase">
            {targetMonthName} {targetYear} Compendium
          </h1>
          <p className="text-xs text-slate-350 max-w-xl leading-relaxed">
            Consolidated monthly compendium automatically generated from daily editor uploads.
          </p>
        </div>

        {monthlyArticles.length > 0 && (
          <button
            onClick={() => alert('PDF Booklet compilation is being generated. It will start downloading automatically.')}
            className="px-5 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-2xl text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Download Monthly PDF</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-slate-500 text-xs font-semibold">Generating monthly compilation...</div>
      ) : monthlyArticles.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/[0.06] rounded-3xl space-y-4">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto" />
          <div className="space-y-1">
            <h3 className="font-heading font-bold text-sm text-slate-700 dark:text-slate-350">No Articles Uploaded in {targetMonthName} {targetYear}</h3>
            <p className="text-[11px] text-slate-550 max-w-xs mx-auto">
              Please check daily updates or verify another month index.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Bihar Section */}
          {biharArticles.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xs font-black uppercase text-emerald-500 tracking-wider flex items-center gap-2 border-b border-emerald-500/10 pb-2">
                <Award className="w-4 h-4" />
                <span>Bihar Special Section ({biharArticles.length})</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {biharArticles.map(art => (
                  <Link
                    key={art.id}
                    href={`/current-affairs/daily/${art.publishedDate}/bihar/${art.slug}`}
                    className="block p-5 bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/[0.06] rounded-2xl hover:border-emerald-500/30 hover:shadow-xs transition-all group"
                  >
                    <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 mb-1.5">
                      <span>{art.publishedDate}</span>
                      <span>{art.readingTime}</span>
                    </div>
                    <h3 className="font-heading font-black text-sm text-slate-950 dark:text-white group-hover:text-emerald-500 transition-colors leading-snug">
                      {art.title}
                    </h3>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* National Section */}
          {nationalArticles.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xs font-black uppercase text-amber-500 tracking-wider flex items-center gap-2 border-b border-amber-500/10 pb-2">
                <BookOpen className="w-4 h-4" />
                <span>National Affairs ({nationalArticles.length})</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {nationalArticles.map(art => (
                  <Link
                    key={art.id}
                    href={`/current-affairs/daily/${art.publishedDate}/national/${art.slug}`}
                    className="block p-5 bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/[0.06] rounded-2xl hover:border-amber-500/30 hover:shadow-xs transition-all group"
                  >
                    <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 mb-1.5">
                      <span>{art.publishedDate}</span>
                      <span>{art.readingTime}</span>
                    </div>
                    <h3 className="font-heading font-black text-sm text-slate-950 dark:text-white group-hover:text-amber-500 transition-colors leading-snug">
                      {art.title}
                    </h3>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* International Section */}
          {internationalArticles.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xs font-black uppercase text-indigo-500 tracking-wider flex items-center gap-2 border-b border-indigo-500/10 pb-2">
                <Layers className="w-4 h-4" />
                <span>International Relations ({internationalArticles.length})</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {internationalArticles.map(art => (
                  <Link
                    key={art.id}
                    href={`/current-affairs/daily/${art.publishedDate}/international/${art.slug}`}
                    className="block p-5 bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/[0.06] rounded-2xl hover:border-indigo-500/30 hover:shadow-xs transition-all group"
                  >
                    <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 mb-1.5">
                      <span>{art.publishedDate}</span>
                      <span>{art.readingTime}</span>
                    </div>
                    <h3 className="font-heading font-black text-sm text-slate-950 dark:text-white group-hover:text-indigo-500 transition-colors leading-snug">
                      {art.title}
                    </h3>
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
