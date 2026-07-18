'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Calendar, ArrowLeft, Award, BookOpen, Layers, ArrowRight, Grid } from 'lucide-react';
import { db, DynamicCurrentAffairEdition, DynamicCurrentAffairArticle } from '@/services/db';

export default function YearlyCompendiumViewer() {
  const params = useParams();
  const yearStr = params.year as string; // 2026
  const targetYear = parseInt(yearStr, 10);
  const [editions, setEditions] = useState<DynamicCurrentAffairEdition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEditions() {
      try {
        const list = await db.getDynamicCurrentAffairsEditions(false);
        setEditions(list);
      } catch (err) {
        console.error('Error loading editions for yearly:', err);
      } finally {
        setLoading(false);
      }
    }
    loadEditions();
  }, []);

  const monthsList = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Helper map to count articles by month index (e.g. "07" is July)
  const monthsMap: Record<string, string> = {
    january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
    july: '07', august: '08', september: '09', october: '10', november: '11', december: '12'
  };

  // Group and count how many articles were published for each month in this year
  const getMonthStats = (monthName: string) => {
    const code = monthsMap[monthName.toLowerCase()];
    let count = 0;
    
    editions.forEach(ed => {
      const parts = ed.publishDate.split('-'); // YYYY-MM-DD
      const edYear = parseInt(parts[0], 10);
      const edMonth = parts[1];
      
      if (edYear === targetYear && edMonth === code) {
        count += ed.articles?.length || 0;
      }
    });
    
    return count;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 font-body space-y-8">
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
        <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg w-fit flex items-center gap-1">
          <Award className="w-4 h-4" />
          <span>Yearly Compendium Booklets</span>
        </span>
        <h1 className="text-3xl font-heading font-black tracking-tight">{targetYear} Compendium Index</h1>
        <p className="text-xs text-slate-350 max-w-2xl leading-relaxed">
          Aggregated annual booklet directories. Click a month to read consolidated digests for that specific period.
        </p>
      </div>

      {loading ? (
        <div className="text-slate-500 text-xs font-semibold">Generating yearly index...</div>
      ) : (
        <div className="space-y-6">
          <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-white/[0.06] pb-2">
            <Grid className="w-4 h-4 text-amber-500" />
            <span>Monthly Booklets of {targetYear}</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {monthsList.map(month => {
              const count = getMonthStats(month);
              const paramName = `${month.toLowerCase()}-${targetYear}`;

              return (
                <div
                  key={month}
                  className="bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/[0.06] rounded-3xl p-6 flex flex-col justify-between hover:border-amber-500/20 hover:shadow-md transition-all group"
                >
                  <div className="space-y-2">
                    <span className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                      <Calendar className="w-4 h-4" />
                    </span>
                    <h3 className="font-heading font-black text-lg text-slate-950 dark:text-white group-hover:text-amber-500 transition-colors">
                      {month} {targetYear}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {count > 0 
                        ? `Contains ${count} published current affairs analyses mapping high-yield syllabus points.`
                        : 'No editorial entries published yet for this month.'}
                    </p>
                  </div>

                  <div className="pt-5 mt-5 border-t border-slate-50 dark:border-white/[0.02]">
                    <Link
                      href={`/current-affairs/monthly/${paramName}`}
                      className={`w-full py-2.5 font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        count > 0
                          ? 'bg-slate-900 text-white hover:bg-slate-850 dark:bg-slate-800 dark:hover:bg-slate-700'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                      }`}
                      onClick={(e) => {
                        if (count === 0) e.preventDefault();
                      }}
                    >
                      <span>{count > 0 ? 'Access Booklet' : 'No Data'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
