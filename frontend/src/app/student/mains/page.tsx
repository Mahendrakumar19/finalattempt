'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText, Download, Eye, Award, CheckCircle, Clock,
  ArrowRight, BookOpen, Layers, ShieldCheck, ChevronRight, Upload, Sparkles
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/context/LocaleContext';
import StudentPortalShell from '@/components/StudentPortalShell';
import { db } from '@/services/db';
import { getMainsTests, getMyMainsSubmissions } from '@/services/auth';

interface ExamItem {
  id: string;
  name: string;
  code: string;
  slug: string;
}

interface TestSeriesItem {
  id: string;
  title: string;
  slug: string;
  examId?: string;
  category?: string;
  totalTests?: number;
  validityDays?: number;
  description?: string;
}

interface MainsTestItem {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  maxMarks?: number;
  questionPaperUrl?: string;
  syllabus?: string;
  testSeriesId?: string;
}

interface StudentSubmission {
  id: string;
  assignmentId: string;
  grade?: number;
  feedback?: string;
  status?: string;
  evaluatedCopyUrl?: string;
  submissionUrl?: string;
  submittedAt: string;
}

export default function StudentMainsPage() {
  const { accessToken } = useAuth();
  const { t } = useTranslation();

  const [exams, setExams] = useState<ExamItem[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('ALL');

  const [testSeriesList, setTestSeriesList] = useState<TestSeriesItem[]>([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>('ALL');

  const [mainsTests, setMainsTests] = useState<MainsTestItem[]>([]);
  const [loadingTests, setLoadingTests] = useState(true);

  const [mySubmissions, setMySubmissions] = useState<Record<string, StudentSubmission>>({});

  // Active Test Detail Modal
  const [activeTestDetail, setActiveTestDetail] = useState<MainsTestItem | null>(null);

  // Load Exam Hierarchy & Mains Test Series
  useEffect(() => {
    const loadHierarchy = async () => {
      try {
        const exList = await db.getExamsHierarchy(false);
        if (exList && Array.isArray(exList)) {
          setExams(exList);
        }
        const series = await db.getTestSeries(false);
        if (series && Array.isArray(series)) {
          const mainsSeries = series.filter(s => (s as any).category?.toLowerCase().includes('mains') || true);
          setTestSeriesList(mainsSeries as any);
        }
      } catch (err) {
        console.error('Error loading hierarchy:', err);
      }
    };
    loadHierarchy();
  }, []);

  // Load Mains Tests
  useEffect(() => {
    const loadTests = async () => {
      setLoadingTests(true);
      try {
        const querySeriesId = selectedSeriesId !== 'ALL' ? selectedSeriesId : undefined;
        const res = await getMainsTests(querySeriesId);
        if (res.success && res.data) {
          setMainsTests(res.data);
        }
      } catch (err) {
        console.error('Error loading mains tests:', err);
      } finally {
        setLoadingTests(false);
      }
    };
    loadTests();
  }, [selectedSeriesId]);

  // Load My Submissions to display results/scores inline
  useEffect(() => {
    const loadSubmissions = async () => {
      if (!accessToken) return;
      try {
        const res = await getMyMainsSubmissions(accessToken);
        if (res.success && res.data) {
          const map: Record<string, StudentSubmission> = {};
          res.data.forEach((sub: StudentSubmission) => {
            map[sub.assignmentId] = sub;
          });
          setMySubmissions(map);
        }
      } catch (err) {
        console.error('Error loading my submissions:', err);
      }
    };
    loadSubmissions();
  }, [accessToken]);

  // Filter series by exam
  const filteredSeries = testSeriesList.filter(s => {
    if (selectedExamId === 'ALL') return true;
    return s.examId === selectedExamId;
  });

  return (
    <StudentPortalShell activeNav="mains">
      <div className="min-h-screen bg-[var(--bg-color)] py-10 px-4 sm:px-6 lg:px-8 font-body space-y-10">
        {/* Header Banner */}
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--card-border)] pb-8">
            <div className="space-y-1">
              <span className="px-3.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-full text-xs font-black uppercase tracking-widest inline-block">
                {t('mains.subtitle')}
              </span>
              <h1 className="text-3xl sm:text-4xl font-heading font-black text-[var(--text-color)] tracking-tight">
                {t('mains.title')}
              </h1>
            </div>

            {/* Standalone Upload Mains Copy Call-to-Action Banner */}
            <Link
              href="/student/upload-mains"
              className="group p-4 bg-gradient-to-br from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-2xl transition-all shadow-lg flex items-center gap-3 shrink-0"
            >
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider block text-indigo-200">
                  Ready to submit?
                </span>
                <span className="font-heading font-black text-sm flex items-center gap-1">
                  Upload Mains Copy &rarr;
                </span>
              </div>
            </Link>
          </div>
        </div>

        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* EXAM FILTER TABS */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[var(--card-border)]">
            <span className="text-xs font-bold text-slate-400 uppercase mr-2 shrink-0">Exam:</span>
            <button
              onClick={() => setSelectedExamId('ALL')}
              className={`px-4 py-2 text-xs font-extrabold rounded-xl border transition-all shrink-0 ${
                selectedExamId === 'ALL'
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md'
                  : 'bg-[var(--card-bg)] text-slate-400 border-[var(--card-border)] hover:text-[var(--text-color)]'
              }`}
            >
              All Exams
            </button>
            {exams.map(ex => (
              <button
                key={ex.id}
                onClick={() => setSelectedExamId(ex.id)}
                className={`px-4 py-2 text-xs font-extrabold rounded-xl border transition-all shrink-0 ${
                  selectedExamId === ex.id
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md'
                    : 'bg-[var(--card-bg)] text-slate-400 border-[var(--card-border)] hover:text-[var(--text-color)]'
                }`}
              >
                {ex.name}
              </button>
            ))}
          </div>

          {/* TEST SERIES SELECTION */}
          <div className="space-y-3">
            <h2 className="text-sm font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">
              Available Mains Test Series ({filteredSeries.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <button
                onClick={() => setSelectedSeriesId('ALL')}
                className={`p-4 text-left rounded-2xl border transition-all ${
                  selectedSeriesId === 'ALL'
                    ? 'bg-amber-500/10 border-amber-500/50 text-[var(--text-color)] shadow-sm'
                    : 'bg-[var(--card-bg)] border-[var(--card-border)] text-slate-400 hover:border-amber-500/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[var(--text-color)]">All Mains Series</span>
                  <Layers className="w-4 h-4 text-amber-500" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Show tests across all series</p>
              </button>

              {filteredSeries.map(ts => (
                <button
                  key={ts.id}
                  onClick={() => setSelectedSeriesId(ts.id)}
                  className={`p-4 text-left rounded-2xl border transition-all ${
                    selectedSeriesId === ts.id
                      ? 'bg-amber-500/10 border-amber-500/50 text-[var(--text-color)] shadow-sm'
                      : 'bg-[var(--card-bg)] border-[var(--card-border)] text-slate-400 hover:border-amber-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[var(--text-color)] truncate">{ts.title}</span>
                    <BookOpen className="w-4 h-4 text-amber-500 shrink-0" />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 truncate">
                    {ts.totalTests || 0} Mains Tests
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* MAINS TESTS GRID */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-heading font-black text-[var(--text-color)]">
                Mains Test Papers ({mainsTests.length})
              </h2>
              <Link
                href="/student/upload-mains"
                className="text-xs font-extrabold text-indigo-500 hover:underline flex items-center gap-1"
              >
                <Upload className="w-3.5 h-3.5" /> Submit Answer Copy Here &rarr;
              </Link>
            </div>

            {loadingTests ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-44 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] animate-pulse" />
                ))}
              </div>
            ) : mainsTests.length === 0 ? (
              <div className="p-12 text-center bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl space-y-3">
                <FileText className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="text-[var(--text-color)] font-bold text-base">{t('mains.noTests')}</h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mainsTests.map((test) => {
                  const sub = mySubmissions[test.id];
                  const isEvaluated = sub?.status === 'Evaluated';

                  return (
                    <div
                      key={test.id}
                      className="p-6 bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-amber-500/40 rounded-3xl transition-all shadow-xs space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 inline-block">
                              Mains Subjective Test
                            </span>
                            <h3 className="text-lg font-heading font-black text-[var(--text-color)] leading-snug">
                              {test.title}
                            </h3>
                          </div>

                          {sub && (
                            <span
                              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border shrink-0 ${
                                isEvaluated
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                  : sub.status === 'Under Evaluation'
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                  : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
                              }`}
                            >
                              {sub.status || 'Submitted'}
                            </span>
                          )}
                        </div>

                        {test.description && (
                          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                            {test.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-xs font-bold text-slate-400 pt-1">
                          <span>{t('mains.marks')}: {test.maxMarks || 100}</span>
                        </div>

                        {isEvaluated && (
                          <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl space-y-1.5 text-xs">
                            <div className="flex items-center justify-between font-black text-emerald-600 dark:text-emerald-400">
                              <span>Score: {sub.grade} / {test.maxMarks || 100} Marks</span>
                              {sub.evaluatedCopyUrl && (
                                <a
                                  href={sub.evaluatedCopyUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-extrabold hover:underline"
                                >
                                  <Download className="w-3.5 h-3.5" /> Evaluated Copy PDF
                                </a>
                              )}
                            </div>
                            {sub.feedback && (
                              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                                <span className="font-bold">Feedback:</span> {sub.feedback}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t border-[var(--card-border)] flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          {test.questionPaperUrl ? (
                            <a
                              href={test.questionPaperUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-500 text-xs font-bold rounded-xl transition-colors border border-indigo-500/20"
                            >
                              <Download className="w-3.5 h-3.5" /> Question Paper
                            </a>
                          ) : (
                            <button
                              onClick={() => setActiveTestDetail(test)}
                              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-500/10 text-slate-400 text-xs font-bold rounded-xl cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" /> Instructions &amp; Syllabus
                            </button>
                          )}
                        </div>

                        <Link
                          href="/student/upload-mains"
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          {sub ? 'View / Resubmit Copy' : 'Upload Copy'}
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* DETAIL MODAL */}
        {activeTestDetail && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
                <h3 className="font-heading font-black text-lg text-[var(--text-color)]">
                  {activeTestDetail.title}
                </h3>
                <button onClick={() => setActiveTestDetail(null)} className="p-1 rounded-xl text-slate-400 hover:text-white cursor-pointer">
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                <div>
                  <span className="font-bold text-[var(--text-color)] block mb-1">Max Marks:</span>
                  <p>{activeTestDetail.maxMarks || 100} Marks</p>
                </div>
                {activeTestDetail.description && (
                  <div>
                    <span className="font-bold text-[var(--text-color)] block mb-1">Instructions:</span>
                    <p>{activeTestDetail.description}</p>
                  </div>
                )}
                {activeTestDetail.syllabus && (
                  <div>
                    <span className="font-bold text-[var(--text-color)] block mb-1">Syllabus Coverage:</span>
                    <p>{activeTestDetail.syllabus}</p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-[var(--card-border)] flex justify-end">
                <Link
                  href="/student/upload-mains"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl"
                >
                  Go to Upload Mains Copy &rarr;
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </StudentPortalShell>
  );
}
