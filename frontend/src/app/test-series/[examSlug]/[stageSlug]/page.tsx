'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Layers, ArrowRight, ArrowLeft, BookOpen, CheckCircle, FileText } from 'lucide-react';
import { db, ExamData, ExamStageData, TestSeriesItem } from '@/services/db';
import { useTranslation } from '@/context/LocaleContext';

export default function StageFolderPage() {
  const { t } = useTranslation();
  const params = useParams();
  const examSlug = params.examSlug as string;
  const stageSlug = params.stageSlug as string;

  const [exam, setExam] = useState<ExamData | null>(null);
  const [stage, setStage] = useState<ExamStageData | null>(null);
  const [seriesList, setSeriesList] = useState<TestSeriesItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStageFolder() {
      setLoading(true);
      try {
        const hierarchy = await db.getExamsHierarchy(false);
        const allSeries = hierarchy.flatMap((ex) => ex.testSeries || []);

        const foundExam = hierarchy.find(
          (e) => e.slug.toLowerCase() === examSlug.toLowerCase() || e.id === examSlug || e.code?.toLowerCase() === examSlug.toLowerCase()
        );

        if (foundExam) {
          setExam(foundExam);
          const foundStage = (foundExam.stages || []).find(
            (s) => s.slug.toLowerCase() === stageSlug.toLowerCase() || s.id === stageSlug
          );
          setStage(foundStage || null);

          const examKey = (foundExam.code || foundExam.name || foundExam.slug || '').toLowerCase();
          const stageKey = (foundStage?.name || stageSlug || '').toLowerCase();

          // Filter series belonging to this exam and stage
          const seriesPool = (foundExam.testSeries && foundExam.testSeries.length > 0) ? foundExam.testSeries : allSeries;
          const filtered = seriesPool.filter((s) => {
            const sExam = (s.exam || s.examId || s.category || s.title || '').toLowerCase();
            const sStage = (s.stageId || s.category || s.title || '').toLowerCase();

            const isExamMatch = s.examId === foundExam.id || sExam.includes(examKey);
            const isStageMatch = !foundStage || s.stageId === foundStage.id || sStage.includes(stageKey);

            return isExamMatch && isStageMatch;
          });

          setSeriesList(filtered);
        }
      } catch (err) {
        console.error('Error loading stage folder:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStageFolder();
  }, [examSlug, stageSlug]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 space-y-6">
        <div className="h-8 w-32 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
        <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (!exam || !stage) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4 font-body">
        <BookOpen className="w-16 h-16 text-slate-400 mx-auto" />
        <h2 className="text-2xl font-heading font-black text-[var(--text-color)]">{t('testSeriesHub.folderNotFound')}</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          {t('testSeriesHub.folderNotFoundDesc')}
        </p>
        <Link
          href={`/test-series/${examSlug}`}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-amber-500 text-slate-950 font-bold rounded-2xl text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('testSeriesHub.backToAllExams')}</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-color)] py-10 px-4 sm:px-6 lg:px-8 font-body space-y-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Breadcrumb Links */}
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
          <Link href="/test-series" className="hover:text-amber-500 transition-colors">
            {t('nav.testSeries')}
          </Link>
          <span>/</span>
          <Link href={`/test-series/${exam.slug}`} className="hover:text-amber-500 transition-colors">
            {exam.name}
          </Link>
          <span>/</span>
          <span className="text-amber-500">{stage.name}</span>
        </div>

        {/* Header Title Banner */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 sm:p-8 space-y-2 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/20">
              {exam.name}
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-md border border-indigo-500/20">
              {stage.name} {t('testSeriesHub.stageFolder')}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-heading font-black text-[var(--text-color)]">
            {exam.name} {stage.name} {t('nav.testSeries')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {exam.description || t('testSeriesHub.officialCBT')}
          </p>
        </div>

        {/* Series Cards Grid */}
        <div className="space-y-6">
          <h2 className="font-heading font-black text-lg text-[var(--text-color)] uppercase tracking-wider">
            {t('testSeriesHub.availablePrograms')} ({seriesList.length})
          </h2>

          {seriesList.length === 0 ? (
            <div className="p-12 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl text-center space-y-2 max-w-md mx-auto">
              <FileText className="w-10 h-10 text-slate-400 mx-auto" />
              <h4 className="font-bold text-sm text-[var(--text-color)]">No Test Series Published Yet</h4>
              <p className="text-xs text-slate-500">New test series for {exam.name} {stage.name} will be uploaded soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {seriesList.map((series) => {
                const hasDiscount = series.discountedPrice && series.discountedPrice < series.price;
                const displayPrice = hasDiscount ? series.discountedPrice : series.price;

                return (
                  <div
                    key={series.id}
                    className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl overflow-hidden hover:border-amber-500/40 shadow-xs hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group relative"
                  >
                    <div className="p-6 space-y-4">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-white/5 pb-3">
                        <span className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          {exam.name} • {stage.name}
                        </span>
                        <span className="px-3 py-1 rounded-xl text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Enrollment Open
                        </span>
                      </div>

                      <div className="space-y-2">
                        <h3 className="font-heading font-black text-lg text-[var(--text-color)] group-hover:text-amber-500 transition-colors leading-snug">
                          {series.title}
                        </h3>
                        {series.moduleCode && (
                          <span className="inline-block px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[10px] font-bold rounded-md border border-[var(--card-border)]">
                            Module Code - {series.moduleCode.replace(/^Module Code\s*-\s*/i, '')}
                          </span>
                        )}
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {series.description}
                        </p>
                      </div>

                      {/* Additional Key Attributes: Medium, Enrolled Aspirants, Start Date, Program Details */}
                      <div className="space-y-1.5 pt-2 border-t border-[var(--card-border)] text-xs font-semibold text-[var(--text-color)]">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase text-slate-400">{t('testSeriesHub.medium')}</span>
                          <span className="text-amber-600 dark:text-amber-400 font-extrabold">{series.medium || series.language || 'English'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase text-slate-400">Enrolled Aspirants</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{Math.max(600, Number(series.enrolledCount) || 600)}+ Aspirants</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase text-slate-400">{t('testSeriesHub.startDate')}</span>
                          <span className="font-bold">{series.batchStartDate || '09 August 2026'}</span>
                        </div>
                        {series.programDetails && (
                          <div className="flex items-start justify-between gap-2 pt-0.5">
                            <span className="text-[10px] font-bold uppercase text-slate-400 shrink-0">{t('testSeriesHub.details')}</span>
                            <span className="text-[11px] text-right font-medium text-slate-600 dark:text-slate-300">{series.programDetails}</span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="flex items-center gap-2.5 p-2.5 bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-xs">
                          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                            <Layers className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">{t('testSeriesHub.totalMocks')}</span>
                            <span className="text-xs font-black text-slate-900 dark:text-white">{series.totalTests} {t('testSeriesHub.tests')}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5 p-2.5 bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-xs">
                          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                            <BookOpen className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">{t('testSeriesHub.questions')}</span>
                            <span className="text-xs font-black text-slate-900 dark:text-white">{series.totalQuestions} {t('testSeriesHub.qs')}</span>
                          </div>
                        </div>
                      </div>

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

                    <div className="p-5 bg-white dark:bg-slate-900/60 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">{t('testSeriesHub.fee')}</span>
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

                        {Boolean(series.schedulePdfUrl) && (
                          <a
                            href={series.schedulePdfUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline block mt-0.5"
                          >
                            {t('testSeriesHub.downloadSchedule')}
                          </a>
                        )}
                      </div>

                      <Link
                        href={`/test-series/program/${series.slug}`}
                        className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-2xl text-xs flex items-center gap-1.5 transition-all shadow-md group-hover:scale-[1.03]"
                      >
                        <span>{t('testSeriesHub.exploreProgram')}</span>
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
    </div>
  );
}
