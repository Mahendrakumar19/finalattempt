'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Layers, ArrowRight, ArrowLeft, BookOpen, CheckCircle, FileText } from 'lucide-react';
import { db, ExamData, TestSeriesItem } from '@/services/db';

export default function ExamFolderPage() {
  const params = useParams();
  const examSlug = params.examSlug as string;

  const [exam, setExam] = useState<ExamData | null>(null);
  const [seriesList, setSeriesList] = useState<TestSeriesItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadExam() {
      setLoading(true);
      try {
        const [hierarchy, allSeries] = await Promise.all([
          db.getExamsHierarchy(false),
          db.getTestSeries(false)
        ]);

        const found = hierarchy.find(
          (e) => e.slug.toLowerCase() === examSlug.toLowerCase() || e.id === examSlug || e.code?.toLowerCase() === examSlug.toLowerCase()
        );

        if (found) {
          const resolvedStages = (found.hasStages && (!found.stages || found.stages.length === 0))
            ? [
                { id: `stage-${found.id}-prelims`, examId: found.id, name: 'Prelims', slug: 'prelims', sortOrder: 1, isActive: true },
                { id: `stage-${found.id}-mains`, examId: found.id, name: 'Mains', slug: 'mains', sortOrder: 2, isActive: true }
              ]
            : (found.stages || []);

          setExam({
            ...found,
            stages: resolvedStages
          });

          const examKey = (found.code || found.name || found.slug || found.id || '').toLowerCase();
          const matched = allSeries.filter((s) => {
            const sExam = (s.exam || s.examId || s.category || s.title || '').toLowerCase();
            return (
              s.examId === found.id ||
              sExam.includes(examKey) ||
              (examKey.includes('bpsc') && sExam.includes('bpsc')) ||
              ((examKey.includes('appsc') || examKey.includes('appcs')) && (sExam.includes('appsc') || sExam.includes('appcs'))) ||
              (examKey.includes('apssb') && sExam.includes('apssb'))
            );
          });
          setSeriesList(matched);
        }
      } catch (err) {
        console.error('Error loading exam folder:', err);
      } finally {
        setLoading(false);
      }
    }
    loadExam();
  }, [examSlug]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 space-y-6">
        <div className="h-8 w-32 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
        <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4 font-body">
        <BookOpen className="w-16 h-16 text-slate-400 mx-auto" />
        <h2 className="text-2xl font-heading font-black text-[var(--text-color)]">Exam Folder Not Found</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          The exam category you requested does not exist or has been removed.
        </p>
        <Link
          href="/test-series"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-amber-500 text-slate-950 font-bold rounded-2xl text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Exams</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-color)] py-10 px-4 sm:px-6 lg:px-8 font-body space-y-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Breadcrumb / Back Link */}
        <Link
          href="/test-series"
          className="text-xs font-bold text-amber-500 hover:text-amber-600 transition-colors inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Exam Selection</span>
        </Link>

        {/* Header Title Banner */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 sm:p-8 space-y-3 shadow-xs">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-white text-amber-600 font-heading font-black text-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden p-1.5 shrink-0">
                {exam.logoUrl ? (
                  <img src={exam.logoUrl} alt={exam.name} className="w-full h-full object-contain drop-shadow-xs" />
                ) : (
                  <span className="text-amber-600 font-extrabold">{exam.code || exam.name}</span>
                )}
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 block">Exam Folder</span>
                <h1 className="text-2xl sm:text-3xl font-heading font-black text-[var(--text-color)]">
                  {exam.name}
                </h1>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 bg-amber-50/80 dark:bg-amber-950/40 text-slate-700 dark:text-slate-200 rounded-full border border-amber-200/50 dark:border-amber-500/20">
              {exam.hasStages ? 'STAGE WISE' : 'DIRECT SERIES'}
            </span>
          </div>
          {exam.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-3xl leading-relaxed">
              {exam.description}
            </p>
          )}
        </div>

        {/* ── CASE 1: EXAM WITH STAGES (e.g. BPSC, APPSC) ─────────────────────────── */}
        {exam.hasStages && (
          <div className="space-y-6">
            <h2 className="font-heading font-black text-lg text-[var(--text-color)] uppercase tracking-wider">
              Select Examination Stage
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {(exam.stages || []).map((stg) => {
                const stageKey = stg.name.toLowerCase();
                const count = seriesList.filter((s) => {
                  const sStage = (s.stageId || s.category || s.title || '').toLowerCase();
                  return sStage.includes(stageKey) || (stageKey === 'prelims' && (sStage.includes('pre') || sStage.includes('prelims')));
                }).length;

                return (
                  <Link
                    key={stg.id}
                    href={`/test-series/${exam.slug}/${stg.slug}`}
                    className="group p-8 rounded-3xl bg-[var(--card-bg)] border-2 border-[var(--card-border)] hover:border-amber-500/50 shadow-xs hover:shadow-2xl transition-all space-y-4 relative overflow-hidden flex justify-between items-center"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/20 inline-block">
                          STAGE FOLDER
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20 inline-block">
                          {count} {count === 1 ? 'Program' : 'Programs'}
                        </span>
                      </div>
                      <h3 className="text-2xl font-heading font-black text-[var(--text-color)] group-hover:text-amber-500 transition-colors">
                        {stg.name}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {count > 0 ? `${count} Test Series available in ${stg.name}` : `No programs uploaded yet for ${stg.name}`}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ── CASE 2: DIRECT TEST SERIES FOR EXAMS WITHOUT STAGES (e.g. APSSB) ────── */}
        {!exam.hasStages && (
          <div className="space-y-6">
            <h2 className="font-heading font-black text-lg text-[var(--text-color)] uppercase tracking-wider">
              Available Test Series Programs ({seriesList.length})
            </h2>

            {seriesList.length === 0 ? (
              <div className="p-12 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl text-center space-y-2 max-w-md mx-auto">
                <FileText className="w-10 h-10 text-slate-400 mx-auto" />
                <h4 className="font-bold text-sm text-[var(--text-color)]">No Test Series Published Yet</h4>
                <p className="text-xs text-slate-500">New test series for {exam.name} will be uploaded soon.</p>
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
                            {exam.name}
                          </span>
                          <span className="px-3 py-1 rounded-xl text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Enrollment Open
                          </span>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="font-heading font-black text-lg text-[var(--text-color)] group-hover:text-amber-500 transition-colors leading-snug">
                              {series.title}
                            </h3>
                          </div>
                          {series.moduleCode && (
                            <span className="inline-block px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[10px] font-bold rounded-md border border-[var(--card-border)]">
                              Module Code - {series.moduleCode.replace(/^Module Code\s*-\s*/i, '')}
                            </span>
                          )}
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                            {series.description}
                          </p>
                        </div>

                        {/* Additional Key Attributes: Medium, Start Date, Program Details */}
                        <div className="space-y-1.5 pt-2 border-t border-[var(--card-border)] text-xs font-semibold text-[var(--text-color)]">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase text-slate-400">Medium</span>
                            <span className="text-amber-600 dark:text-amber-400 font-extrabold">{series.medium || series.language || 'English'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase text-slate-400">Start Date</span>
                            <span className="font-bold">{series.batchStartDate || '09 August 2026'}</span>
                          </div>
                          {series.programDetails && (
                            <div className="flex items-start justify-between gap-2 pt-0.5">
                              <span className="text-[10px] font-bold uppercase text-slate-400 shrink-0">Details</span>
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
                              <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Total Mocks</span>
                              <span className="text-xs font-black text-slate-900 dark:text-white">{series.totalTests} Tests</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2.5 p-2.5 bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-xs">
                            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                              <BookOpen className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Questions</span>
                              <span className="text-xs font-black text-slate-900 dark:text-white">{series.totalQuestions} Qs</span>
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
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Fee</span>
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
                              Download Schedule
                            </a>
                          )}
                        </div>

                        <Link
                          href={`/test-series/program/${series.slug}`}
                          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-2xl text-xs flex items-center gap-1.5 transition-all shadow-md group-hover:scale-[1.03]"
                        >
                          <span>Explore Program</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
