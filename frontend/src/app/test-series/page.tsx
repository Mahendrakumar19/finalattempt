'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Award, ArrowRight, Layers, ShieldCheck, ChevronRight } from 'lucide-react';
import { db, ExamData, TestSeriesItem } from '@/services/db';
import TestSeriesComparisonTable from '@/components/TestSeriesComparisonTable';
import { useTranslation } from '@/context/LocaleContext';

export default function TestSeriesRootPage() {
  const { t } = useTranslation();
  const [exams, setExams] = useState<ExamData[]>([]);
  const [allSeries, setAllSeries] = useState<TestSeriesItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const list = await db.getExamsHierarchy(false);
        setExams(list || []);
        const flattenedSeries = (list || []).flatMap((ex) => ex.testSeries || []);
        setAllSeries(flattenedSeries);
      } catch (err) {
        console.error('Error loading exams hierarchy:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-color)] pt-6 sm:pt-8 pb-16 px-4 sm:px-6 lg:px-8 font-body space-y-12">
      {/* Header Banner */}
      <div className="max-w-5xl mx-auto text-center space-y-4">
        <span className="px-3.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-full text-xs font-black uppercase tracking-widest inline-block">
          {t('testSeriesHub.tagline')}
        </span>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black text-[var(--text-color)] tracking-tight">
          {t('testSeriesHub.title')}
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          {t('testSeriesHub.subtitle')}
        </p>
      </div>

      {/* Exam Folder Cards */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {exams.map((ex) => {
              const seriesCount = ex.testSeries?.length || 0;
              return (
                <Link
                  key={ex.id}
                  href={`/test-series/${ex.slug}`}
                  className="group bg-[var(--card-bg)] border-2 border-[var(--card-border)] hover:border-amber-500/50 rounded-3xl p-8 transition-all duration-300 shadow-xs hover:shadow-2xl flex flex-col justify-between space-y-6 relative overflow-hidden"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-16 h-16 rounded-2xl bg-white text-amber-600 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-heading font-black text-lg tracking-tight shadow-sm group-hover:scale-105 transition-transform overflow-hidden p-1.5 shrink-0">
                        {ex.logoUrl ? (
                          <img src={ex.logoUrl} alt={ex.name} className="w-full h-full object-contain drop-shadow-xs" />
                        ) : (
                          <span className="text-amber-600 font-extrabold">{ex.code || ex.name}</span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 bg-amber-50/80 dark:bg-amber-950/40 text-slate-700 dark:text-slate-200 rounded-full border border-amber-200/50 dark:border-amber-500/20">
                        {ex.hasStages ? t('testSeriesHub.stageWise') : t('testSeriesHub.directSeries')}
                      </span>
                    </div>

                    <div>
                      <h2 className="text-2xl font-heading font-black text-[var(--text-color)] group-hover:text-amber-500 transition-colors">
                        {ex.name}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                        {ex.description || `${t('testSeriesHub.officialCBT')}`}
                      </p>
                    </div>

                    <div className="pt-2 flex items-center gap-4 text-xs font-bold text-slate-500 border-t border-[var(--card-border)]">
                      <span className="flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-amber-500" />
                        <span>{seriesCount} {t('testSeriesHub.programsCount')}</span>
                      </span>
                      {ex.hasStages && (
                        <span className="flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-indigo-500" />
                          <span>{t('testSeriesHub.prelimsAndMains')}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 text-xs font-extrabold text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform">
                    <span>{t('testSeriesHub.openPortal')} ({ex.name})</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Comparison Table Section */}
      <div className="max-w-7xl mx-auto pt-8 border-t border-[var(--card-border)]">
        <TestSeriesComparisonTable
          programs={allSeries}
          title={t('testSeriesHub.compareTitle')}
          subtitle={t('testSeriesHub.compareSubtitle')}
        />
      </div>

    </div>
  );
}
