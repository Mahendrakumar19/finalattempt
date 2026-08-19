'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Award, Timer, Layers, Clock,
  BookOpen, BarChart2, Play, RefreshCw, FileText
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/context/LocaleContext';
import StudentPortalShell from '@/components/StudentPortalShell';
import { db, ExamData, TestSeriesItem } from '@/services/db';
import { getMyQuizAttempts } from '@/services/auth';

interface QuizItem {
  id: string;
  title: string;
  courseId?: string;
  description?: string;
  timeLimitMins?: number;
  passingScore?: number;
  isPublished?: boolean;
  seriesTitle?: string;
  maxMarks?: number;
  durationMinutes?: number;
}

interface AttemptItem {
  id: string;
  quizId: string;
  quizTitle?: string;
  testSeriesTitle?: string;
  examName?: string;
  score: number;
  maxScore: number;
  passed: boolean;
  timeTakenSecs: number;
  submittedAt: string;
}

export default function StudentPrelimsPage() {
  const { accessToken } = useAuth();
  const { t } = useTranslation();

  const [exams, setExams] = useState<ExamData[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('ALL');

  const [testSeriesList, setTestSeriesList] = useState<TestSeriesItem[]>([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>('ALL');

  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [loadingTests, setLoadingTests] = useState(true);

  const [attempts, setAttempts] = useState<AttemptItem[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(true);

  const [analytics, setAnalytics] = useState<{
    totalAttempts: number;
    avgScore: number;
    accuracy: number;
    passRate: number;
  }>({ totalAttempts: 0, avgScore: 0, accuracy: 0, passRate: 0 });

  // Load Exam Hierarchy & Prelims Test Series
  useEffect(() => {
    const loadHierarchy = async () => {
      try {
        const series = await db.getTestSeries(false);
        const prelimsSeries = (series || []).filter(s => 
          !s.category || s.category.toLowerCase().includes('prelims')
        );
        setTestSeriesList(prelimsSeries as TestSeriesItem[]);

        const exList = await db.getExamsHierarchy(false);
        if (exList && Array.isArray(exList)) {
          const validPrelimsExams = exList.filter(ex => {
            // For exams with stages, ensure a Prelims stage exists
            if (ex.hasStages && Array.isArray(ex.stages) && ex.stages.length > 0) {
              return ex.stages.some(st => 
                st.slug?.toLowerCase().includes('prelims') || 
                st.name?.toLowerCase().includes('prelims')
              );
            }
            // For stage-less exams, include if it contains Prelims test series
            const hasPrelimsSeries = prelimsSeries.some(s => s.examId === ex.id);
            return hasPrelimsSeries || ex.hasStages === false;
          });
          setExams(validPrelimsExams);
        }
      } catch (err) {
        console.error('Error loading hierarchy:', err);
      }
    };
    loadHierarchy();
  }, []);

  // Load Quizzes in parallel using Promise.all
  useEffect(() => {
    let ignore = false;
    const loadQuizzes = async () => {
      if (testSeriesList.length === 0) {
        setLoadingTests(false);
        return;
      }
      setLoadingTests(true);
      try {
        const seriesToFetch = selectedSeriesId !== 'ALL'
          ? testSeriesList.filter(s => s.id === selectedSeriesId)
          : testSeriesList;

        const results = await Promise.all(
          seriesToFetch.map(s => db.getTestSeriesQuizzes(s.id))
        );

        if (!ignore) {
          const allQuizzes: QuizItem[] = [];
          results.forEach((qList, idx) => {
            const seriesTitle = seriesToFetch[idx]?.title || 'Prelims Series';
            qList.forEach((q: QuizItem) => {
              allQuizzes.push({
                ...q,
                seriesTitle,
                maxMarks: q.maxMarks || 150,
                durationMinutes: q.durationMinutes || 120,
              });
            });
          });

          const uniqueQuizzes = Array.from(new Map(allQuizzes.map(q => [q.id, q])).values());
          setQuizzes(uniqueQuizzes);
        }
      } catch (err) {
        console.error('Error loading quizzes:', err);
      } finally {
        if (!ignore) setLoadingTests(false);
      }
    };
    loadQuizzes();
    return () => { ignore = true; };
  }, [selectedSeriesId, testSeriesList]);

  // Load Attempt History & Compute Real Analytics
  const loadAttempts = useCallback(async () => {
    if (!accessToken) return;
    setLoadingAttempts(true);
    try {
      const res = await getMyQuizAttempts(accessToken);
      if (res.success && res.data) {
        setAttempts(res.data);

        const list: AttemptItem[] = res.data;
        if (list.length > 0) {
          const totalAttempts = list.length;
          const totalScore = list.reduce((acc: number, item: AttemptItem) => acc + (item.score || 0), 0);
          const totalMax = list.reduce((acc: number, item: AttemptItem) => acc + (item.maxScore || 150), 0);
          const passedCount = list.filter((item: AttemptItem) => item.passed).length;

          setAnalytics({
            totalAttempts,
            avgScore: totalScore / totalAttempts,
            accuracy: totalMax > 0 ? (totalScore / totalMax) * 100 : 0,
            passRate: (passedCount / totalAttempts) * 100
          });
        }
      }
    } catch (err) {
      console.error('Error loading attempts:', err);
    } finally {
      setLoadingAttempts(false);
    }
  }, [accessToken]);

  useEffect(() => {
    let ignore = false;
    if (accessToken) {
      loadAttempts();
    } else {
      setLoadingAttempts(false);
    }
    return () => { ignore = true; };
  }, [accessToken, loadAttempts]);

  // Filter series by selected exam
  const filteredSeries = testSeriesList.filter(s => {
    if (selectedExamId === 'ALL') return true;
    return s.examId === selectedExamId;
  });

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}m ${remainingSecs < 10 ? '0' : ''}${remainingSecs}s`;
  };

  return (
    <StudentPortalShell activeNav="prelims">
      <div className="min-h-screen bg-[var(--bg-color)] py-10 px-4 sm:px-6 lg:px-8 font-body space-y-10">
        
        {/* ── 1. HEADER BANNER ───────────────────────────────────────────────────── */}
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--card-border)] pb-8">
            <div className="space-y-1">
              <span className="px-3.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-full text-xs font-black uppercase tracking-widest inline-block">
                {t('prelims.subtitle')}
              </span>
              <h1 className="text-3xl sm:text-4xl font-heading font-black text-[var(--text-color)] tracking-tight">
                {t('prelims.title')}
              </h1>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="p-4 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                  <BarChart2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total CBT Attempted</span>
                  <span className="text-base font-black text-[var(--text-color)]">{analytics.totalAttempts} Tests</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* ── 2. REAL PERFORMANCE ANALYTICS SUMMARY CARDS ─────────────────────── */}
          {analytics.totalAttempts > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">{t('student.testsAttempted')}</span>
                <p className="text-2xl font-black text-[var(--text-color)]">{analytics.totalAttempts}</p>
              </div>

              <div className="p-5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">{t('prelims.averageScore')}</span>
                <p className="text-2xl font-black text-amber-500">{analytics.avgScore.toFixed(1)} <span className="text-xs text-slate-400 font-normal">{t('prelims.marks')}</span></p>
              </div>

              <div className="p-5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">{t('prelims.accuracy')}</span>
                <p className="text-2xl font-black text-indigo-500">{analytics.accuracy.toFixed(1)}%</p>
              </div>

              <div className="p-5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">{t('prelims.bestScore')}</span>
                <p className={`text-2xl font-black ${analytics.passRate >= 50 ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {analytics.passRate.toFixed(1)}%
                </p>
              </div>
            </div>
          )}

          {/* ── 3. EXAM FILTER TABS ────────────────────────────────────────────── */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[var(--card-border)]">
            <span className="text-xs font-bold text-slate-400 uppercase mr-2 shrink-0">Filter Exam:</span>
            <button
              onClick={() => setSelectedExamId('ALL')}
              className={`px-4 py-2 text-xs font-extrabold rounded-xl border transition-all shrink-0 cursor-pointer ${
                selectedExamId === 'ALL'
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md'
                  : 'bg-[var(--card-bg)] text-slate-400 border-[var(--card-border)] hover:text-[var(--text-color)]'
              }`}
            >
              All Prelims Exams
            </button>
            {exams.map(ex => (
              <button
                key={ex.id}
                onClick={() => setSelectedExamId(ex.id)}
                className={`px-4 py-2 text-xs font-extrabold rounded-xl border transition-all shrink-0 cursor-pointer ${
                  selectedExamId === ex.id
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md'
                    : 'bg-[var(--card-bg)] text-slate-400 border-[var(--card-border)] hover:text-[var(--text-color)]'
                }`}
              >
                {ex.name}
              </button>
            ))}
          </div>

          {/* ── 4. PRELIMS TEST SERIES CARDS SELECTION ─────────────────────────── */}
          <div className="space-y-3">
            <h2 className="text-sm font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">
              Available Prelims Test Series ({filteredSeries.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <button
                onClick={() => setSelectedSeriesId('ALL')}
                className={`p-4 text-left rounded-2xl border transition-all cursor-pointer ${
                  selectedSeriesId === 'ALL'
                    ? 'bg-amber-500/10 border-amber-500/50 text-[var(--text-color)] shadow-xs'
                    : 'bg-[var(--card-bg)] border-[var(--card-border)] text-slate-400 hover:border-amber-500/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[var(--text-color)]">All Prelims Series</span>
                  <Layers className="w-4 h-4 text-amber-500" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Show CBT tests across all series</p>
              </button>

              {filteredSeries.map(ts => (
                <button
                  key={ts.id}
                  onClick={() => setSelectedSeriesId(ts.id)}
                  className={`p-4 text-left rounded-2xl border transition-all cursor-pointer ${
                    selectedSeriesId === ts.id
                      ? 'bg-amber-500/10 border-amber-500/50 text-[var(--text-color)] shadow-xs'
                      : 'bg-[var(--card-bg)] border-[var(--card-border)] text-slate-400 hover:border-amber-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[var(--text-color)] truncate">{ts.title}</span>
                    <BookOpen className="w-4 h-4 text-amber-500 shrink-0" />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 truncate">
                    {ts.totalTests || 0} CBT Mock Papers
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* ── 5. CBT MOCK TESTS LIST ─────────────────────────────────────────── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-heading font-black text-[var(--text-color)]">
                Prelims CBT Practice Tests ({quizzes.length})
              </h2>
              <span className="text-xs font-bold text-slate-400">
                Pattern: Multiple Choice Questions (MCQ)
              </span>
            </div>

            {loadingTests ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-44 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] animate-pulse" />
                ))}
              </div>
            ) : quizzes.length === 0 ? (
              <div className="p-12 text-center bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl space-y-3">
                <FileText className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="text-[var(--text-color)] font-bold text-base">{t('prelims.noTests')}</h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {quizzes.map((quiz, idx) => {
                  const userAttempt = attempts.find(a => a.quizId === quiz.id);

                  return (
                    <div
                      key={quiz.id || idx}
                      className="p-6 bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-amber-500/40 rounded-3xl transition-all shadow-xs space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 inline-block">
                              Prelims CBT Mock Test #{idx + 1}
                            </span>
                            <h3 className="text-lg font-heading font-black text-[var(--text-color)] leading-snug">
                              {quiz.title}
                            </h3>
                          </div>

                          {userAttempt && (
                            <span
                              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border shrink-0 ${
                                userAttempt.passed
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                  : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30'
                              }`}
                            >
                              {userAttempt.passed ? 'PASSED' : 'ATTEMPTED'}
                            </span>
                          )}
                        </div>

                        {quiz.description && (
                          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                            {quiz.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-400 pt-1">
                          <span className="flex items-center gap-1"><Timer className="w-3.5 h-3.5 text-amber-500" /> {quiz.timeLimitMins || 60} Mins</span>
                          <span>Pattern: CBT MCQ</span>
                        </div>

                        {/* Display user attempt score if completed */}
                        {userAttempt && (
                          <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-2xl space-y-1 text-xs">
                            <div className="flex items-center justify-between font-black text-amber-600 dark:text-amber-400">
                              <span>Your Last Score: {userAttempt.score.toFixed(2)} / {userAttempt.maxScore} Marks</span>
                              <span>Time: {formatTime(userAttempt.timeTakenSecs)}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t border-[var(--card-border)] flex items-center justify-between gap-3">
                        <span className="text-xs font-semibold text-slate-400">
                          {userAttempt ? 'Completed' : 'Ready for CBT'}
                        </span>

                        <Link
                          href={`/student/course/cbt/quiz/${quiz.id}`}
                          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl transition-all shadow-md cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-slate-950" />
                          {userAttempt ? t('prelims.retake') : t('prelims.startTest')}
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── 6. ATTEMPT HISTORY SECTION ───────────────────────────────────────── */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
              <h2 className="text-lg font-heading font-black text-[var(--text-color)] flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                <span>Prelims CBT Attempt History ({attempts.length})</span>
              </h2>

              <button
                onClick={loadAttempts}
                className="p-2 rounded-xl text-slate-400 hover:text-[var(--text-color)] hover:bg-slate-500/10 cursor-pointer"
                title="Refresh Attempts History"
              >
                <RefreshCw className={`w-4 h-4 ${loadingAttempts ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loadingAttempts ? (
              <div className="p-8 text-center text-xs text-slate-400 font-bold space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500" />
                <p>Loading attempt records…</p>
              </div>
            ) : attempts.length === 0 ? (
              <div className="p-8 text-center space-y-3 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl">
                <Award className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-500 font-medium">
                  No CBT test attempts submitted yet. Select a mock test above to start your first Prelims attempt.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {attempts.map((att) => (
                  <div
                    key={att.id}
                    className="p-4 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-amber-500 uppercase">
                          {att.examName || 'Prelims Stage'}
                        </span>
                        <span className="text-[10px] text-slate-400">•</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(att.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <h4 className="font-heading font-extrabold text-sm text-[var(--text-color)]">
                        {att.quizTitle || 'Prelims Mock Test'}
                      </h4>
                    </div>

                    <div className="flex items-center gap-6">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Score</span>
                        <span className="font-black text-amber-500 text-sm">{att.score.toFixed(2)} / {att.maxScore}</span>
                      </div>

                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Time Taken</span>
                        <span className="font-bold text-[var(--text-color)]">{formatTime(att.timeTakenSecs)}</span>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border shrink-0 ${
                          att.passed
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30'
                        }`}
                      >
                        {att.passed ? 'PASSED' : 'ATTEMPTED'}
                      </span>

                      <Link
                        href={`/student/course/cbt/quiz/${att.quizId}`}
                        className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 font-bold rounded-xl text-xs transition-all text-center"
                      >
                        Review
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </StudentPortalShell>
  );
}
