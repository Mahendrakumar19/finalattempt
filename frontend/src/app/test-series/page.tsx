'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, Award, Clock, FileText, CheckCircle, ArrowRight, BookOpen, Layers } from 'lucide-react';
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
        // Filters items that are Prelims or Mains test series / writing programs
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
        <h1 className="text-4xl font-heading font-black text-[var(--text-color)] tracking-tight leading-tight">
          Premium BPSC Test Series
        </h1>
        <p className="text-slate-500 text-sm leading-relaxed">
          Take full-length mock tests and daily answer challenges evaluated by selected BPSC officers. Dynamic micro-analytics diagnostic maps will help focus your practice.
        </p>
      </div>

      {/* Tabs Selector */}
      <div className="flex justify-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4 max-w-md mx-auto">
        {(['All', 'Prelims', 'Mains'] as SeriesType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === tab
                ? 'bg-amber-500 text-slate-950 shadow-md scale-[1.02]'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {tab === 'All' ? 'All Test Series' : tab === 'Prelims' ? 'Prelims Mock Tests' : 'Mains Evaluation'}
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
              className="bg-white dark:bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-100 dark:border-white/[0.06] p-8 shadow-xs flex flex-col justify-between hover:shadow-lg dark:hover:border-amber-500/20 transition-all duration-300 relative overflow-hidden group"
            >
              {/* Category tag */}
              <div className="absolute top-6 right-6">
                <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-md border ${
                  series.category === 'Prelims'
                    ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-950/60'
                    : 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-950/60'
                }`}>
                  {series.category} Series
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
