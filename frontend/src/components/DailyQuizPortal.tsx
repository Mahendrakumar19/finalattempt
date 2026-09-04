'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { db } from '@/services/db';
import { useTranslation } from '@/context/LocaleContext';
import { renderFormattedQuestionText } from '@/utils/questionFormatter';
import FormattedExplanation from '@/components/FormattedExplanation';
import { 
  Sparkles, Calendar, Clock, HelpCircle, Trophy, Award, ArrowLeft, ArrowRight,
  CheckCircle2, XCircle, AlertCircle, RefreshCw, Bookmark, ChevronRight,
  Search, Play, Check, BarChart2, User
} from 'lucide-react';

interface Question {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE?: string;
  marks?: number;
}

interface QuestionDetail extends Question {
  questionId?: string;
  options: { A: string; B: string; C: string; D: string; E?: string };
  studentAnswer: string | null;
  correctAnswer: string;
  explanation: string;
  isCorrect: boolean;
}

interface QuizMeta {
  id: string;
  title: string;
  description: string;
  publishDate: string;
  timeLimitMins: number;
  totalQuestions: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HIGH' | string;
  category?: string;
  attemptsCount?: number;
  passingScore?: number;
}

interface QuizResultData {
  attemptId: string;
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  timeTakenSecs: number;
  details: QuestionDetail[];
}

interface LeaderboardEntry {
  id?: string;
  rank: number;
  name: string;
  userName?: string;
  userId?: string;
  score: number;
  timeTakenSecs: number;
  attemptDate: string;
}

export default function DailyQuizPortal() {
  const { t } = useTranslation();

  // Page mode: 'landing' | 'playing' | 'result' | 'leaderboard'
  const [viewMode, setViewMode] = useState<'landing' | 'playing' | 'result' | 'leaderboard'>('landing');

  // Loading & error states
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Data states
  const [todayQuiz, setTodayQuiz] = useState<QuizMeta | null>(null);
  const [previousQuizzes, setPreviousQuizzes] = useState<QuizMeta[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<QuizMeta | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  // User authentication check (lazy initializer for purity)
  const [currentUser] = useState<{ userId?: string; name?: string; email?: string } | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedUser = localStorage.getItem('finalattempt_user');
        return storedUser ? JSON.parse(storedUser) : null;
      } catch (_) {}
    }
    return null;
  });

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ALL');

  // Player state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [reviewMarked, setReviewMarked] = useState<Record<string, boolean>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(600); // 10 mins default
  const [timerActive, setTimerActive] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);

  // Result state
  const [resultData, setResultData] = useState<QuizResultData | null>(null);
  const [showReviewMode, setShowReviewMode] = useState(false);
  const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState(false);

  // Fetch lightweight landing page metadata
  const loadLandingData = useCallback(async () => {
    setLoadingMeta(true);
    setErrorMsg(null);
    try {
      const [today, prev] = await Promise.all([
        db.getTodayDailyQuiz(),
        db.getPreviousDailyQuizzes()
      ]);
      setTodayQuiz(today);
      setPreviousQuizzes(prev || []);
    } catch (err) {
      console.error('Failed loading daily quiz metadata:', err);
      setErrorMsg('Unable to load today\'s daily quiz. Please check your network connection.');
    } finally {
      setLoadingMeta(false);
    }
  }, []);

  // Mount effect
  useEffect(() => {
    let isMounted = true;
    Promise.all([
      db.getTodayDailyQuiz(),
      db.getPreviousDailyQuizzes()
    ]).then(([today, prev]) => {
      if (isMounted) {
        setTodayQuiz(today);
        setPreviousQuizzes(prev || []);
      }
    }).catch((err) => {
      if (isMounted) {
        console.error('Failed loading daily quiz metadata:', err);
        setErrorMsg('Unable to load today\'s daily quiz. Please check your network connection.');
      }
    }).finally(() => {
      if (isMounted) setLoadingMeta(false);
    });

    return () => { isMounted = false; };
  }, []);

  // Start a Quiz
  const handleStartQuiz = async (quizMeta: QuizMeta) => {
    setActiveQuiz(quizMeta);
    setLoadingQuestions(true);
    setErrorMsg(null);
    setUserAnswers({});
    setReviewMarked({});
    setCurrentQuestionIndex(0);
    setResultData(null);
    setShowReviewMode(false);

    try {
      const data = await db.startDailyQuiz(quizMeta.id);
      if (data && data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        setTimeRemaining((quizMeta.timeLimitMins || 10) * 60);
        setStartTime(Date.now());
        setTimerActive(true);
        setViewMode('playing');
      } else {
        setErrorMsg('No questions found for this quiz. Please try another quiz.');
      }
    } catch (err) {
      console.error('Failed starting quiz:', err);
      setErrorMsg('Unable to start quiz session. Please try again.');
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Option select handler
  const handleSelectOption = useCallback((questionId: string, optionKey: string) => {
    if (viewMode !== 'playing') return;
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: optionKey
    }));
  }, [viewMode]);

  // Toggle mark for review
  const handleToggleReview = (questionId: string) => {
    setReviewMarked(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  // Execute quiz submission
  const executeSubmitQuiz = useCallback(async () => {
    if (!activeQuiz) return;
    setSubmitting(true);
    setErrorMsg(null);
    setShowSubmitConfirmModal(false);

    const elapsedSecs = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;

    try {
      const res = await db.submitDailyQuiz(activeQuiz.id, userAnswers, elapsedSecs);
      if (res) {
        setResultData(res);
        setTimerActive(false);
        setViewMode('result');
      } else {
        setErrorMsg('Failed to process quiz submission. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting daily quiz:', err);
      setErrorMsg('Network error while submitting quiz.');
    } finally {
      setSubmitting(false);
    }
  }, [activeQuiz, userAnswers, startTime]);

  // Auto submit when time runs out
  const handleAutoSubmitOnTimeOut = useCallback(() => {
    alert('Time has expired! Submitting your answers automatically.');
    executeSubmitQuiz();
  }, [executeSubmitQuiz]);

  // Timer countdown hook for Quiz Player
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (timerActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setTimerActive(false);
            handleAutoSubmitOnTimeOut();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, timeRemaining, handleAutoSubmitOnTimeOut]);

  // Load Leaderboard
  const handleLoadLeaderboard = async (quizId?: string) => {
    const targetId = quizId || activeQuiz?.id || todayQuiz?.id || 'daily-quiz-today';
    setLoadingLeaderboard(true);
    try {
      const list = await db.getDailyQuizLeaderboard(targetId);
      setLeaderboard(list || []);
      setViewMode('leaderboard');
    } catch (err) {
      console.error('Error loading leaderboard:', err);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    if (viewMode !== 'playing' || showSubmitConfirmModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const currentQ = questions[currentQuestionIndex];
      if (!currentQ) return;

      if (['1', 'a', 'A'].includes(e.key)) handleSelectOption(currentQ.id, 'A');
      else if (['2', 'b', 'B'].includes(e.key)) handleSelectOption(currentQ.id, 'B');
      else if (['3', 'c', 'C'].includes(e.key)) handleSelectOption(currentQ.id, 'C');
      else if (['4', 'd', 'D'].includes(e.key)) handleSelectOption(currentQ.id, 'D');
      else if (e.key === 'ArrowRight' && currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else if (e.key === 'ArrowLeft' && currentQuestionIndex > 0) {
        setCurrentQuestionIndex(prev => prev - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, currentQuestionIndex, questions, showSubmitConfirmModal, handleSelectOption]);

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Filtered previous quizzes
  const filteredPreviousQuizzes = useMemo(() => {
    return previousQuizzes.filter(q => {
      const matchesSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            q.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDiff = selectedDifficulty === 'ALL' || q.difficulty === selectedDifficulty;
      return matchesSearch && matchesDiff;
    });
  }, [previousQuizzes, searchQuery, selectedDifficulty]);

  // Answered count for progress
  const answeredCount = useMemo(() => {
    return Object.keys(userAnswers).length;
  }, [userAnswers]);

  return (
    <div className="w-full bg-[var(--bg-color)] text-[var(--text-color)] font-body transition-colors">
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
        
        {/* Error Alert Header if any */}
        {errorMsg && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-between gap-4 text-xs font-bold text-red-600 dark:text-red-400">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => { setErrorMsg(null); loadLandingData(); }}
              className="px-3 py-1.5 bg-red-500 text-white rounded-xl font-black hover:bg-red-600 transition-all cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}

        {/* ── MODE 1: LANDING PAGE ─────────────────────────────────────────── */}
        {viewMode === 'landing' && (
          <div className="space-y-12">
            
            {/* Daily Quiz Hero Section */}
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 sm:p-12 shadow-xl relative overflow-hidden space-y-6">
              <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-600/5 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 space-y-4 max-w-3xl">
                {/* <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-black uppercase tracking-wider">
                  <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
                  <span>{t('dailyQuiz.tagline', 'Daily Practice Quiz')} • BPSC & State PCS</span>
                </div> */}

                <h1 className="text-3xl sm:text-5xl font-heading font-black text-[var(--text-color)] leading-tight tracking-tight">
                  {t('dailyQuiz.title', 'Daily Current Affairs & GS Practice Hub')}
                </h1>

                {/* Specs Pill Bar */}
                {loadingMeta ? (
                  <div className="h-10 w-full max-w-md bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
                ) : todayQuiz ? (
                  <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-500 dark:text-slate-400 pt-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                      <Calendar className="w-3.5 h-3.5 text-amber-500" />
                      <span>{new Date(todayQuiz.publishDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                      <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                      <span>{todayQuiz.totalQuestions} {t('dailyQuiz.questions', 'Questions')}</span>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>{todayQuiz.timeLimitMins} {t('common.minutes', 'Mins')}</span>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-500/20 font-black">
                      <Award className="w-3.5 h-3.5" />
                      <span>{todayQuiz.difficulty} {t('dailyQuiz.passingScore', 'DIFFICULTY')}</span>
                    </div>
                  </div>
                ) : null}

                {/* Obvious Primary CTA */}
                <div className="pt-4 flex flex-wrap items-center gap-4">
                  {todayQuiz && (
                    <button
                      onClick={() => handleStartQuiz(todayQuiz)}
                      disabled={loadingQuestions}
                      className="inline-flex items-center gap-2.5 px-8 py-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-2xl text-sm uppercase tracking-wider shadow-lg shadow-amber-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
                    >
                      {loadingQuestions ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <Play className="w-5 h-5 fill-current" />
                      )}
                      <span>{t('dailyQuiz.startQuiz', "Start Today's Quiz")}</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleLoadLeaderboard()}
                    className="inline-flex items-center gap-2 px-6 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[var(--text-color)] font-bold rounded-2xl text-xs uppercase tracking-wider border border-[var(--card-border)] transition-all cursor-pointer"
                  >
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span>{t('dailyQuiz.viewLeaderboard', 'View Leaderboard')}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Today's Quiz Highlight Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-heading font-black text-xl text-[var(--text-color)] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span>{t('dailyQuiz.todaysQuiz', "Today's Featured Practice Quiz")}</span>
                </h2>
                {/* <span className="text-xs font-bold text-amber-600 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20">
                  Updated Daily @ 08:00 AM
                </span> */}
              </div>

              {loadingMeta ? (
                <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-8 space-y-4 animate-pulse">
                  <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-xl w-1/3" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-xl w-2/3" />
                  <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl w-48" />
                </div>
              ) : todayQuiz ? (
                <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 sm:p-8 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-amber-500/40 transition-all">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] font-black uppercase tracking-wider">
                        ● Live Today
                      </span>
                      <span className="text-xs font-bold text-slate-400">
                        {todayQuiz.attemptsCount || 140}+ Aspirants Attempted
                      </span>
                    </div>

                    <h3 className="text-xl font-heading font-bold text-[var(--text-color)]">
                      {todayQuiz.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                      {todayQuiz.description}
                    </p>

                    <div className="flex items-center gap-4 text-xs font-semibold text-slate-400 pt-1">
                      <span>10 Qs • 10 Mins</span>
                      <span>•</span>
                      <span>Negative Marking: -0.33</span>
                    </div>
                  </div>

                  <div className="shrink-0 w-full md:w-auto">
                    <button
                      onClick={() => handleStartQuiz(todayQuiz)}
                      className="w-full md:w-auto px-8 py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>{t('dailyQuiz.startQuiz', 'Attempt Quiz Now')}</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Intentional Empty State for Today Quiz */
                <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-10 text-center space-y-4 shadow-sm">
                  <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
                  <h3 className="text-lg font-heading font-bold text-[var(--text-color)]">{t('dailyQuiz.noQuizzes', 'No Daily Quiz Published Yet Today')}</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Today&apos;s daily set is undergoing editorial review. You can practice from our archive of previous daily quizzes below.
                  </p>
                </div>
              )}
            </div>

            {/* Previous Daily Quizzes List */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-heading font-black text-xl text-[var(--text-color)]">
                    {t('dailyQuiz.previousQuizzes', 'Previous Daily Quizzes Archive')}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Browse past daily practice sets to reinforce your revision.
                  </p>
                </div>

                {/* Filter Controls */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder={t('downloads.searchPlaceholder', 'Search quiz topic...')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 text-xs bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-color)] rounded-xl outline-none focus:border-amber-500 w-48 sm:w-64"
                    />
                  </div>

                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="px-3 py-2 text-xs bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-color)] font-bold rounded-xl outline-none"
                  >
                    <option value="ALL">{t('dailyQuiz.allDifficulties', 'All Difficulties')}</option>
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High Yield</option>
                  </select>
                </div>
              </div>

              {loadingMeta ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-48 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl animate-pulse" />
                  ))}
                </div>
              ) : filteredPreviousQuizzes.length === 0 ? (
                /* Intentional Empty State for Previous Quizzes */
                <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-12 text-center space-y-3">
                  <Search className="w-10 h-10 text-slate-400 mx-auto" />
                  <h3 className="text-base font-heading font-bold text-[var(--text-color)]">{t('dailyQuiz.noQuizzes', 'No Previous Quizzes Available')}</h3>
                  <p className="text-xs text-slate-500">No daily quizzes matched your search query.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPreviousQuizzes.map((quiz) => (
                    <div
                      key={quiz.id}
                      className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 flex flex-col justify-between space-y-4 shadow-sm hover:border-amber-500/50 hover:shadow-md transition-all"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg">
                            {new Date(quiz.publishDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                          <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg ${
                            quiz.difficulty === 'HIGH' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                          }`}>
                            {quiz.difficulty}
                          </span>
                        </div>

                        <h3 className="font-heading font-bold text-base text-[var(--text-color)] leading-snug">
                          {quiz.title}
                        </h3>

                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {quiz.description}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-[var(--card-border)] flex items-center justify-between gap-2">
                        <span className="text-xs text-slate-400 font-semibold">
                          {quiz.totalQuestions} Qs • {quiz.timeLimitMins}m
                        </span>

                        <button
                          onClick={() => handleStartQuiz(quiz)}
                          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-[var(--text-color)] font-bold rounded-xl text-xs transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <span>{t('dailyQuiz.startQuiz', 'Take Quiz')}</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Leaderboard Teaser Section */}
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-md">
              <div className="space-y-3 max-w-xl text-center md:text-left">
                <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-600 bg-amber-500/10 px-3 py-1 rounded-xl">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>Competitive Aspirant Ranks</span>
                </div>
                <h3 className="text-2xl font-heading font-black text-[var(--text-color)]">
                  {t('dailyQuiz.leaderboard', 'Compare Your Daily Score on the State Leaderboard')}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Track your speed and accuracy against thousands of Serious Civil Services aspirants across Bihar & Arunachal.
                </p>
              </div>

              <div className="shrink-0 flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                <button
                  onClick={() => handleLoadLeaderboard()}
                  className="w-full sm:w-auto px-6 py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
                >
                  {t('dailyQuiz.viewLeaderboard', 'See Leaderboard Ranks')}
                </button>

                {!currentUser && (
                  <Link
                    href="/auth/register"
                    className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[var(--text-color)] font-bold rounded-2xl text-xs uppercase tracking-wider text-center border border-[var(--card-border)] transition-all"
                  >
                    {t('auth.noAccount', 'Create Free Profile')}
                  </Link>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ── MODE 2: QUIZ PLAYER (CONCENTRATION MODE) ──────────────────────── */}
        {viewMode === 'playing' && activeQuiz && (
          <div className="space-y-6 max-w-4xl mx-auto">
            
            {/* Top Bar Navigation & Timer */}
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 sm:p-6 shadow-md flex flex-wrap items-center justify-between gap-4 sticky top-4 z-30 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to exit the quiz? Your current progress will be lost.')) {
                      setTimerActive(false);
                      setViewMode('landing');
                    }
                  }}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-500 cursor-pointer"
                  title="Exit Quiz"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div>
                  <h3 className="font-heading font-black text-sm sm:text-base text-[var(--text-color)] line-clamp-1">
                    {activeQuiz.title}
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400">
                    {t('dailyQuiz.questions', 'Question')} {currentQuestionIndex + 1} of {questions.length}
                  </span>
                </div>
              </div>

              {/* Timer Pill */}
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-mono font-black ${
                timeRemaining < 120 ? 'bg-red-500/10 text-red-500 border-red-500/30 animate-pulse' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
              }`}>
                <Clock className="w-4 h-4" />
                <span>{formatTime(timeRemaining)}</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              />
            </div>

            {/* Question Palette Drawer Grid (Iconic + Border Distinct States) */}
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>{t('dailyQuiz.questionPalette', 'Question Palette')} ({answeredCount}/{questions.length} {t('prelims.attempted', 'Answered')})</span>
                
                {/* Status Legend */}
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> {t('prelims.attempted', 'Answered')}</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" /> {t('prelims.notAttempted', 'Unanswered')}</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> {t('prelims.marked', 'Review')}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {questions.map((q, idx) => {
                  const isAnswered = Boolean(userAnswers[q.id]);
                  const isCurrent = idx === currentQuestionIndex;
                  const isReview = Boolean(reviewMarked[q.id]);

                  let btnClass = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
                  if (isCurrent) {
                    btnClass = 'bg-amber-500 text-slate-950 border-amber-600 font-black ring-2 ring-amber-500/40';
                  } else if (isReview) {
                    btnClass = 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/40 font-bold';
                  } else if (isAnswered) {
                    btnClass = 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 font-bold';
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestionIndex(idx)}
                      className={`w-9 h-9 rounded-xl border text-xs flex items-center justify-center transition-all cursor-pointer ${btnClass}`}
                    >
                      {isAnswered && !isCurrent ? (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      ) : (
                        idx + 1
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Current Question Card */}
            {questions[currentQuestionIndex] && (
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 sm:p-10 shadow-lg space-y-6">
                
                {/* Question Header */}
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-black text-amber-600 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20 uppercase tracking-wider">
                    {t('dailyQuiz.questions', 'Question')} {currentQuestionIndex + 1}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleToggleReview(questions[currentQuestionIndex].id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      reviewMarked[questions[currentQuestionIndex].id]
                        ? 'bg-purple-500 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-[var(--text-color)]'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>{reviewMarked[questions[currentQuestionIndex].id] ? t('dailyQuiz.markForReview', 'Marked for Review') : t('dailyQuiz.markForReview', 'Mark for Review')}</span>
                  </button>
                </div>

                {/* Question Text */}
                {(() => {
                  const raw = questions[currentQuestionIndex].questionText || '';
                  const { isHtml, formatted } = renderFormattedQuestionText(raw);
                  if (isHtml) {
                    return <div className="text-lg sm:text-xl font-heading font-extrabold text-[var(--text-color)] leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted }} />;
                  }
                  return (
                    <h3 className="text-lg sm:text-xl font-heading font-extrabold text-[var(--text-color)] leading-relaxed">
                      {raw}
                    </h3>
                  );
                })()}

                {/* Option Cards Grid */}
                <div className="space-y-3 pt-2">
                  {[
                    { key: 'A', text: questions[currentQuestionIndex].optionA },
                    { key: 'B', text: questions[currentQuestionIndex].optionB },
                    { key: 'C', text: questions[currentQuestionIndex].optionC },
                    { key: 'D', text: questions[currentQuestionIndex].optionD },
                    { key: 'E', text: questions[currentQuestionIndex].optionE }
                  ].filter(o => o.text).map((opt) => {
                    const selected = userAnswers[questions[currentQuestionIndex].id] === opt.key;

                    let optClass = 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-amber-500/50 hover:bg-amber-500/5 text-slate-800 dark:text-slate-200';
                    if (selected) {
                      optClass = 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-400 font-bold shadow-xs';
                    }

                    return (
                      <button
                        key={opt.key}
                        onClick={() => handleSelectOption(questions[currentQuestionIndex].id, opt.key)}
                        className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between gap-4 transition-all min-h-[52px] cursor-pointer ${optClass}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-heading font-black text-xs shrink-0 transition-colors ${
                            selected ? 'bg-amber-500 text-slate-950' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:bg-slate-800/80'
                          }`}>
                            {opt.key}
                          </span>
                          <span className="text-sm font-medium leading-normal">{opt.text}</span>
                        </div>

                        {selected && (
                          <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

              </div>
            )}

            {/* Bottom Controls Bar */}
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 flex items-center justify-between gap-4 shadow-md">
              <button
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[var(--text-color)] font-bold rounded-xl text-xs disabled:opacity-30 cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t('dailyQuiz.prevQuestion', 'Previous')}</span>
              </button>

              <div className="flex items-center gap-3">
                {currentQuestionIndex < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <span>{t('dailyQuiz.nextQuestion', 'Next Question')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setShowSubmitConfirmModal(true)}
                    className="px-8 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-xs cursor-pointer flex items-center gap-1.5 shadow-md uppercase tracking-wider"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t('dailyQuiz.submitAnswers', 'Submit Quiz')}</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ── SUBMIT CONFIRMATION MODAL ────────────────────────────────────── */}
        {showSubmitConfirmModal && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl">
              <HelpCircle className="w-12 h-12 text-amber-500 mx-auto" />
              
              <div className="space-y-2">
                <h3 className="text-xl font-heading font-black text-[var(--text-color)]">{t('dailyQuiz.confirmSubmit', 'Ready to Submit Quiz?')}</h3>
                <p className="text-xs text-slate-500">
                  You have answered <span className="font-bold text-amber-500">{answeredCount}</span> of <span className="font-bold">{questions.length}</span> questions.
                </p>

                {questions.length - answeredCount > 0 && (
                  <p className="text-xs text-red-500 font-bold bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
                    ⚠️ {questions.length - answeredCount} unanswered questions remaining.
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowSubmitConfirmModal(false)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-[var(--text-color)] font-bold rounded-2xl text-xs cursor-pointer"
                >
                  Continue Test
                </button>
                
                <button
                  onClick={executeSubmitQuiz}
                  disabled={submitting}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-2xl text-xs shadow-md cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : t('common.confirm', 'Confirm & Submit')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── MODE 3: RESULT & SCORE PAGE ─────────────────────────────────── */}
        {viewMode === 'result' && resultData && (
          <div className="space-y-10 max-w-4xl mx-auto">
            
            {/* Score Banner Header */}
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-8 sm:p-12 shadow-xl text-center space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-black uppercase tracking-wider mx-auto">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>{t('dailyQuiz.scoreSummary', 'Quiz Performance Evaluation')}</span>
              </div>

              {/* Big Reward Score Display */}
              <div className="space-y-2">
                <div className="text-5xl sm:text-7xl font-heading font-black text-amber-500 tracking-tight">
                  {resultData.score} <span className="text-2xl sm:text-4xl text-slate-400">/ {resultData.maxScore}</span>
                </div>

                <div className="text-lg sm:text-xl font-extrabold text-[var(--text-color)]">
                  {t('prelims.accuracy', 'Accuracy Score')}: <span className="text-amber-500">{resultData.percentage}%</span>
                </div>
              </div>

              {/* Motivation Message */}
              <div className="max-w-xl mx-auto p-4 bg-slate-50 dark:bg-slate-900/60 border border-[var(--card-border)] rounded-2xl text-xs font-medium text-slate-600 dark:text-slate-300">
                {resultData.percentage >= 80 ? (
                  <span className="text-emerald-500 font-extrabold">🌟 Exceptional Score! You are performing well within the high cutoff margin. Keep up this daily streak!</span>
                ) : resultData.percentage >= 50 ? (
                  <span className="text-amber-500 font-extrabold">👍 Good Effort! Review the detailed explanations below to polish weak concepts.</span>
                ) : (
                  <span className="text-slate-400 font-bold">💪 Keep Practicing! Consistency is key in Civil Services preparation. Analyze your errors below.</span>
                )}
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[var(--card-border)]">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center">
                  <span className="text-2xl font-black text-emerald-500 block">{resultData.correctCount}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('prelims.correct', 'Correct')}</span>
                </div>

                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
                  <span className="text-2xl font-black text-red-500 block">{resultData.incorrectCount}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('prelims.incorrect', 'Incorrect')}</span>
                </div>

                <div className="p-4 bg-slate-100 dark:bg-slate-800 border border-[var(--card-border)] rounded-2xl text-center">
                  <span className="text-2xl font-black text-slate-500 block">{resultData.unansweredCount}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('prelims.unattempted', 'Unanswered')}</span>
                </div>

                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-center">
                  <span className="text-2xl font-black text-amber-500 block">{formatTime(resultData.timeTakenSecs)}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('prelims.timeLimit', 'Time Taken')}</span>
                </div>
              </div>

              {/* Actions Bar */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                <button
                  onClick={() => setShowReviewMode(!showReviewMode)}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{showReviewMode ? 'Hide Explanations' : t('dailyQuiz.detailedSolutions', 'Review Answers & Explanations')}</span>
                </button>

                <button
                  onClick={() => handleLoadLeaderboard()}
                  className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-[var(--text-color)] font-bold rounded-2xl text-xs uppercase tracking-wider border border-[var(--card-border)] transition-all cursor-pointer flex items-center gap-2"
                >
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>{t('dailyQuiz.viewLeaderboard', 'View Leaderboard')}</span>
                </button>

                <button
                  onClick={() => setViewMode('landing')}
                  className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-[var(--text-color)] font-bold rounded-2xl text-xs uppercase tracking-wider border border-[var(--card-border)] transition-all cursor-pointer flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{t('dailyQuiz.backToQuizzes', 'Back to Daily Quiz Hub')}</span>
                </button>
              </div>
            </div>

            {/* Detailed Question Review & Explanations */}
            {showReviewMode && resultData.details && (
              <div className="space-y-6">
                <h3 className="text-xl font-heading font-black text-[var(--text-color)] flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-amber-500" />
                  <span>{t('dailyQuiz.detailedSolutions', 'Detailed Solutions & Rationales')}</span>
                </h3>

                <div className="space-y-6">
                  {resultData.details.map((detail, idx) => (
                    <div
                      key={detail.questionId}
                      className={`bg-[var(--card-bg)] border rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm ${
                        detail.isCorrect ? 'border-emerald-500/40' : detail.studentAnswer ? 'border-red-500/40' : 'border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-black text-amber-600 bg-amber-500/10 px-3 py-1 rounded-xl">
                          {t('dailyQuiz.questions', 'Question')} {idx + 1}
                        </span>

                        <span className={`text-xs font-bold flex items-center gap-1.5 px-3 py-1 rounded-xl ${
                          detail.isCorrect
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                            : detail.studentAnswer
                            ? 'bg-red-500/10 text-red-500 border border-red-500/30'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}>
                          {detail.isCorrect ? (
                            <><CheckCircle2 className="w-4 h-4" /> {t('prelims.correct', 'Correct')} (+1.00)</>
                          ) : detail.studentAnswer ? (
                            <><XCircle className="w-4 h-4" /> {t('prelims.incorrect', 'Incorrect')} (-0.33)</>
                          ) : (
                            <span>{t('prelims.unattempted', 'Unanswered')} (0.00)</span>
                          )}
                        </span>
                      </div>

                      {(() => {
                        const raw = detail.questionText || '';
                        const { isHtml, formatted } = renderFormattedQuestionText(raw);
                        if (isHtml) {
                          return <div className="text-base font-heading font-bold text-[var(--text-color)] leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted }} />;
                        }
                        return (
                          <h4 className="text-base font-heading font-bold text-[var(--text-color)] leading-relaxed">
                            {raw}
                          </h4>
                        );
                      })()}

                      {/* Options with clear Correct / Incorrect Identification */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        {Object.entries(detail.options).map(([optKey, optVal]) => {
                          const isCorrectOpt = detail.correctAnswer === optKey;
                          const isUserSelect = detail.studentAnswer === optKey;

                          let cardStyle = 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400';
                          if (isCorrectOpt) {
                            cardStyle = 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold';
                          } else if (isUserSelect && !isCorrectOpt) {
                            cardStyle = 'bg-red-500/15 border-red-500 text-red-700 dark:text-red-300 font-bold';
                          }

                          return (
                            <div
                              key={optKey}
                              className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs transition-all ${cardStyle}`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-[10px] shrink-0 ${
                                  isCorrectOpt ? 'bg-emerald-500 text-slate-950' : isUserSelect ? 'bg-red-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                                }`}>
                                  {optKey}
                                </span>
                                <span>{optVal}</span>
                              </div>

                              {isCorrectOpt && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                              {isUserSelect && !isCorrectOpt && <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation Section */}
                      {detail.explanation && (
                        <div className="p-4 sm:p-5 bg-amber-500/5 border border-amber-500/20 rounded-2xl space-y-2">
                          <span className="font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider block text-xs">
                            📖 {t('dailyQuiz.explanation', 'Exam Rationale & Explanation')}
                          </span>
                          <FormattedExplanation content={detail.explanation} />
                        </div>
                      )}

                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ── MODE 4: LEADERBOARD ─────────────────────────────────────────── */}
        {viewMode === 'leaderboard' && (
          <div className="space-y-8 max-w-4xl mx-auto">
            
            <div className="flex items-center justify-between">
              <button
                onClick={() => setViewMode('landing')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-[var(--text-color)] font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t('dailyQuiz.backToQuizzes', 'Back to Daily Quiz Hub')}</span>
              </button>

              <span className="text-xs font-bold text-amber-600 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20">
                Official Ranking Table
              </span>
            </div>

            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-8 shadow-xl space-y-6">
              
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-2">
                  <Trophy className="w-6 h-6" />
                </div>

                <h2 className="text-2xl sm:text-3xl font-heading font-black text-[var(--text-color)]">
                  {t('dailyQuiz.leaderboard', 'Daily Aspirant Leaderboard')}
                </h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Ranks evaluated automatically based on accuracy score and completion speed.
                </p>
              </div>

              {/* Guest Profile Prompt Banner */}
              {!currentUser && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-amber-700 dark:text-amber-300">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-amber-700 font-semibold shrink-0" />
                    <span>Create a free profile to appear on the leaderboard after taking quizzes.</span>
                  </div>
                  
                  <Link
                    href="/auth/register"
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shrink-0 transition-all"
                  >
                    {t('auth.noAccount', 'Register Profile')}
                  </Link>
                </div>
              )}

              {/* Leaderboard Table */}
              {loadingLeaderboard ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : leaderboard.length === 0 ? (
                /* Intentional Empty State for Leaderboard */
                <div className="p-12 text-center space-y-3 border border-[var(--card-border)] rounded-2xl">
                  <Trophy className="w-10 h-10 text-slate-400 mx-auto" />
                  <h3 className="font-heading font-bold text-sm text-[var(--text-color)]">{t('dailyQuiz.noAttempts', 'No Leaderboard Entries Yet Today')}</h3>
                  <p className="text-xs text-slate-500">Be the first aspirant to complete today&apos;s daily quiz!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[var(--card-border)] font-bold text-slate-400 uppercase text-[10px] tracking-wider">
                        <th className="p-4">{t('dailyQuiz.attemptRank', 'Rank')}</th>
                        <th className="p-4">{t('auth.studentPortal', 'Aspirant')}</th>
                        <th className="p-4">{t('prelims.yourScore', 'Score')}</th>
                        <th className="p-4">{t('prelims.timeLimit', 'Time Taken')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((item, idx) => {
                        const rank = idx + 1;
                        const isSelf = currentUser?.userId && item.userId === currentUser.userId;

                        let rankBadge = <span className="font-bold text-slate-500">#{rank}</span>;
                        if (rank === 1) rankBadge = <span className="px-2.5 py-1 bg-amber-500 text-slate-950 rounded-lg font-black shadow-xs">🥇 1st</span>;
                        else if (rank === 2) rankBadge = <span className="px-2.5 py-1 bg-slate-300 text-slate-900 rounded-lg font-black shadow-xs">🥈 2nd</span>;
                        else if (rank === 3) rankBadge = <span className="px-2.5 py-1 bg-amber-700 text-white rounded-lg font-black shadow-xs">🥉 3rd</span>;

                        return (
                          <tr
                            key={item.id || idx}
                            className={`border-b border-[var(--card-border)] transition-colors ${
                              isSelf ? 'bg-amber-500/15 border-amber-500/50 font-bold' : 'hover:bg-slate-50/50 dark:hover:bg-slate-900/50'
                            }`}
                          >
                            <td className="p-4">{rankBadge}</td>
                            <td className="p-4 font-bold flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-xs">
                                {(item.userName || item.name || 'Aspirant').charAt(0).toUpperCase()}
                              </div>
                              <span>{item.userName || item.name || 'Aspirant'}</span>
                              {isSelf && <span className="text-[9px] bg-amber-500 text-slate-950 px-2 py-0.5 rounded-md font-black uppercase">(You)</span>}
                            </td>
                            <td className="p-4 font-black text-amber-500">{item.score || 0} Pts</td>
                            <td className="p-4 font-mono text-slate-400">{formatTime(item.timeTakenSecs || 0)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
