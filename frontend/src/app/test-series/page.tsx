'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, FileText, CheckCircle, ArrowRight } from 'lucide-react';
import { db } from '@/services/db';

type SeriesType = 'All' | 'Prelims' | 'Mains';

export default function TestSeriesPage() {
  const [testSeries, setTestSeries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<SeriesType>('All');

  useEffect(() => {
    const loadTestSeries = async () => {
      setLoading(true);
      try {
        const courses = await db.getCourses();
        const filtered = courses.filter(
          (c: any) => c.category === 'Prelims' || c.category === 'Mains'
        );
        setTestSeries(filtered);
      } catch (err) {
        console.error('Failed loading test series:', err);
      }
      setLoading(false);
    };
    loadTestSeries();
  }, []);

  const displayedSeries = testSeries.filter(
    (s) => activeTab === 'All' || s.category === activeTab
  );

  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl uppercase tracking-widest">
          Evaluation Workbench
        </span>
        <h1 className="text-4xl font-heading font-black text-slate-900 dark:text-white tracking-tight leading-tight">
          Premium BPSC Test Series
        </h1>
        <p className="text-slate-500 text-sm leading-relaxed">
          Take full-length mock tests and daily answer challenges evaluated by selected BPSC officers. Dynamic micro-analytics diagnostic maps will help focus your practice.
        </p>
      </div>

      {/* Tabs Selector */}
      <div className="flex justify-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4 max-w-lg mx-auto">
        {(['All', 'Prelims', 'Mains'] as SeriesType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === tab
                ? 'bg-amber-500 text-slate-950 shadow-md scale-[1.02]'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {tab === 'All' ? 'All Test Series' : tab === 'Prelims' ? 'Prelims Test Series' : 'Mains Test Series'}
            {tab === 'Prelims' && (
              <span className="text-[8px] font-extrabold uppercase tracking-wider bg-orange-500 text-white px-1.5 py-0.5 rounded-md">
                Soon
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-80 rounded-3xl bg-slate-100 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04] animate-pulse"
            />
          ))}
        </div>
      ) : displayedSeries.length === 0 ? (
        <div className="p-16 rounded-3xl bg-slate-50 dark:bg-white/[0.01] border border-slate-100 dark:border-white/[0.04] text-center max-w-md mx-auto">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No active test series found</h3>
          <p className="text-xs text-slate-500 mt-1">Check back later or contact helpdesk for details.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {displayedSeries.map((series) => (
            <div
              key={series.id}
              className="course-card-premium rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden group"
            >
              {/* Coming Soon overlay for Prelims */}
              {series.category === 'Prelims' && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 dark:bg-slate-950/80 backdrop-blur-[3px] rounded-3xl">
                  <div className="text-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-400/30 flex items-center justify-center mx-auto">
                      <Clock className="w-7 h-7 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-orange-500">Launching Soon</p>
                      <h4 className="font-heading font-black text-lg text-slate-900 dark:text-white mt-1">Coming Soon</h4>
                      <p className="text-xs text-slate-500 max-w-[200px] mx-auto mt-1 leading-relaxed">
                        Prelims Test Series is under preparation. Stay tuned!
                      </p>
                    </div>
                    <Link
                      href="/contact?enquiry=enroll"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs transition-all"
                    >
                      <span>Get Notified</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              )}

              {/* Category tag */}
              <div className="absolute top-6 right-6">
                <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-md border ${
                  series.category === 'Prelims'
                    ? 'bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-950/60'
                    : 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-950/60'
                }`}>
                  {series.category === 'Prelims' ? 'Prelims Series' : 'Mains Series'}
                </span>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-heading font-extrabold text-xl text-slate-900 dark:text-white leading-tight">
                    {series.title}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed max-w-md">
                    {series.description}
                  </p>
                </div>

                {/* Features List */}
                <ul className="space-y-2.5 pt-4 border-t border-slate-50 dark:border-white/[0.04]">
                  {(series.features || []).map((feat: string, idx: number) => (
                    <li key={idx} className="flex gap-2.5 items-start text-xs font-semibold text-slate-650 dark:text-slate-300">
                      <CheckCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Price & Action */}
              <div className="flex items-center justify-between pt-8 mt-8 border-t border-slate-50 dark:border-white/[0.04]">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Course Fee</span>
                  <span className="text-xl font-black text-slate-900 dark:text-white">{series.fee}</span>
                </div>

                <Link
                  href={`/courses/${series.id}`}
                  className="px-5 py-3 bg-slate-950 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-600 text-white dark:text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all group-hover:translate-x-1"
                >
                  <span>Explore Program</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
