'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Award, FileText, Timer, Users, Maximize2, AlertOctagon, CheckSquare, Square, Bookmark, Sun, Moon, Grid, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/context/LocaleContext';
import { startQuiz, saveQuizProgress, submitQuizAnswers, getQuizLeaderboard } from '@/services/auth';
import { sanitizeAndRepairQuestion } from '@/utils/questionFormatter';

interface QuizEngineProps {
  quizId: string;
}

export default function QuizEngine({ quizId }: QuizEngineProps) {
  const { accessToken, user } = useAuth();
  const { t, locale } = useTranslation();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [quizInfo, setQuizInfo] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [visitedQuestions, setVisitedQuestions] = useState<Record<string, boolean>>({});
  const [activeLang, setActiveLang] = useState<'en' | 'hi'>('en');
  const [showMobilePalette, setShowMobilePalette] = useState(false);
  
  // Fullscreen exam flow states
  const [instructionsRead, setInstructionsRead] = useState(false);
  const [fullscreenError, setFullscreenError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [fullscreenExitCount, setFullscreenExitCount] = useState(0);
  const [isConfirmSubmitOpen, setIsConfirmSubmitOpen] = useState(false);

  // CBT intro-screen independent dark/light toggle
  // (independent of the site's global theme — avoids dark: variant conflicts)
  const [cbtDark, setCbtDark] = useState(false);

  // Timer states
  const [timeLeft, setTimeLeft] = useState(0);
  const [timeTaken, setTimeTaken] = useState(0);
  const [quizState, setQuizState] = useState<'intro' | 'active' | 'result' | 'leaderboard'>('intro');

  // Result states
  const [results, setResults] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  // Synchronize language from locale context on load
  useEffect(() => {
    if (locale === 'hi') setActiveLang('hi');
  }, [locale]);

  // Load Quiz Metadata & Questions & Persistent Session (Timer DOES NOT auto-start here)
  useEffect(() => {
    if (!accessToken) return;
    const init = async () => {
      try {
        const res = await startQuiz(quizId, accessToken);
        if (res.success && res.data) {
          setQuizInfo(res.data.quiz);
          setSession(res.data.session);
          setQuestions(res.data.questions);
          
          if (res.data.session?.savedAnswers) {
            setSelectedAnswers(res.data.session.savedAnswers);
          }

          if (res.data.session?.expiresAt) {
            const exp = new Date(res.data.session.expiresAt).getTime();
            const now = Date.now();
            const secsLeft = Math.max(0, Math.floor((exp - now) / 1000));
            setTimeLeft(secsLeft);
          } else {
            setTimeLeft((res.data.quiz.timeLimitMins || 60) * 60);
          }
        } else {
          setError(res.error || 'Failed to load quiz details.');
        }
      } catch (err) {
        setError('Connection error. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [quizId, accessToken]);

  // Listen to browser Fullscreen Change events (document.fullscreenElement)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = !!document.fullscreenElement;
      if (!isFs && quizState === 'active') {
        setIsPaused(true);
        setFullscreenExitCount(prev => prev + 1);
      } else if (isFs && quizState === 'active') {
        setIsPaused(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [quizState]);

  // Active quiz timer count (Only runs when quizState === 'active')
  useEffect(() => {
    if (quizState !== 'active' || timeLeft <= 0) {
      if (timeLeft === 0 && quizState === 'active') {
        executeFinalSubmit();
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
      setTimeTaken(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [quizState, timeLeft]);

  // Enter Fullscreen and Begin CBT Session
  const enterFullscreenAndStart = async () => {
    setFullscreenError(null);
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
      setQuizState('active');
      setIsPaused(false);
      if (questions[0]?.id) {
        setVisitedQuestions(prev => ({ ...prev, [questions[0].id]: true }));
      }
    } catch (err: any) {
      setFullscreenError('Fullscreen mode is required to start this examination. Please allow fullscreen access.');
    }
  };

  // Track visited questions whenever user navigates to a question
  useEffect(() => {
    if (quizState === 'active' && questions[currentIndex]?.id) {
      setVisitedQuestions(prev => ({
        ...prev,
        [questions[currentIndex].id]: true
      }));
    }
  }, [currentIndex, quizState, questions]);

  // Re-enter Fullscreen from warning overlay
  const reEnterFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
      setIsPaused(false);
    } catch (e) {
      // Browser blocked gesture
    }
  };

  const handleSelectOption = async (option: string) => {
    const q = questions[currentIndex];
    if (!q) return;
    const qId = q.id;

    setSelectedAnswers(prev => ({
      ...prev,
      [qId]: option
    }));

    if (accessToken && session?.id) {
      try {
        await saveQuizProgress(quizId, session.id, qId, option, accessToken);
      } catch (e) {
        console.error('Answer auto-save error:', e);
      }
    }
  };

  const toggleMarkForReview = () => {
    const q = questions[currentIndex];
    if (!q) return;
    setMarkedForReview(prev => ({
      ...prev,
      [q.id]: !prev[q.id]
    }));
  };

  const clearResponse = () => {
    const q = questions[currentIndex];
    if (!q) return;
    setSelectedAnswers(prev => {
      const next = { ...prev };
      delete next[q.id];
      return next;
    });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const executeFinalSubmit = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen().catch(() => {});
      }
    } catch (_) {}

    try {
      const res = await submitQuizAnswers(
        quizId,
        { answers: selectedAnswers, timeTakenSecs: timeTaken, attemptId: session?.id, setCode: session?.setCode },
        accessToken
      );
      if (res.success && res.data) {
        setResults(res.data);
        setQuizState('result');
        setIsConfirmSubmitOpen(false);
      } else {
        setError(res.error || 'Submission failed.');
      }
    } catch (err) {
      setError('Failed to submit answers.');
    } finally {
      setLoading(false);
    }
  };

  const loadLeaderboard = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await getQuizLeaderboard(quizId, accessToken);
      if (res.success && res.data) {
        setLeaderboard(res.data);
        setQuizState('leaderboard');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  if (loading && quizState === 'intro') {
    return (
      <div className="min-h-screen cbt-exam-wrapper flex flex-col items-center justify-center p-12">
        <div className="w-10 h-10 border-2 border-current border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-bold uppercase tracking-widest">Initializing CBT Examination Environment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen cbt-exam-wrapper flex items-center justify-center p-6">
        <div className="p-8 border-2 border-current rounded-3xl max-w-md w-full text-center space-y-4">
          <ShieldAlert className="w-10 h-10 mx-auto" />
          <h2 className="text-lg font-bold">Exam System Warning</h2>
          <p className="text-xs">{error}</p>
          <button
            onClick={() => router.back()}
            className="w-full py-3 bg-current text-reverse font-bold text-xs rounded-xl"
          >
            Return to Portal
          </button>
        </div>
      </div>
    );
  }

  const currentQ = sanitizeAndRepairQuestion(questions[currentIndex], activeLang);

  const getDisplayQuestionText = (q: any) => {
    if (activeLang === 'hi' && q?.questionTextHi) return q.questionTextHi;
    return q?.questionText || '';
  };

  const getDisplayOptionText = (q: any, optKey: string) => {
    if (activeLang === 'hi') {
      const hiKey = `${optKey}Hi`;
      if (q?.[hiKey]) return q[hiKey];
    }
    return q?.[optKey] || '';
  };

  const attemptedCount = Object.keys(selectedAnswers).length;
  const unattemptedCount = questions.length - attemptedCount;
  const markedCount = Object.values(markedForReview).filter(Boolean).length;

  return (
    <div className="min-h-screen cbt-exam-wrapper w-full flex flex-col font-sans select-none">
      
      {/* ── 1. EXAM INSTRUCTIONS & CAUTION SCREEN ── */}
      {quizState === 'intro' && (
        <div
          className="flex-1 flex flex-col justify-between p-6 sm:p-10 w-full min-h-screen transition-colors duration-200"
          style={{
            backgroundColor: cbtDark ? '#0A0A0A' : '#FFFFFF',
            color: cbtDark ? '#FFFFFF' : '#000000',
          }}
        >
          <div className="space-y-6 max-w-6xl mx-auto w-full">
            {/* Header Row */}
            <div
              className="pb-4 flex justify-between items-end"
              style={{ borderBottom: `1px solid ${cbtDark ? '#262626' : '#E5E5E5'}` }}
            >
              <div>
                <h1 className="text-2xl font-black uppercase tracking-wider" style={{ color: cbtDark ? '#FFFFFF' : '#000000' }}>
                  EXAM INSTRUCTIONS & CAUTION
                </h1>
                <p className="text-xs font-bold mt-1" style={{ color: cbtDark ? '#A3A3A3' : '#525252' }}>
                  {quizInfo?.title} {session?.setCode ? `[${session.setCode}]` : ''}
                </p>
              </div>

              {/* Right side: STRICT CBT badge + Dark/Light toggle */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-black uppercase border border-amber-500/40 bg-amber-500/10 text-amber-600 px-3.5 py-1.5 rounded-full">
                  Strict CBT Mode
                </span>
                <button
                  type="button"
                  onClick={() => setCbtDark((d) => !d)}
                  title={cbtDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  className="p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-bold"
                  style={{
                    backgroundColor: cbtDark ? '#171717' : '#F5F5F5',
                    borderColor: cbtDark ? '#404040' : '#D4D4D4',
                    color: cbtDark ? '#FACC15' : '#171717',
                  }}
                >
                  {cbtDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
                  <span>{cbtDark ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
              </div>
            </div>

            {/* Test Stats Header */}
            <div
              className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl text-center text-xs font-bold"
              style={{
                backgroundColor: cbtDark ? '#141414' : '#F8FAFC',
                border: `1px solid ${cbtDark ? '#262626' : '#E2E8F0'}`,
              }}
            >
              <div>
                <p className="text-[10px] uppercase font-bold" style={{ color: cbtDark ? '#A3A3A3' : '#64748B' }}>Total Questions</p>
                <p className="text-lg font-black mt-0.5" style={{ color: cbtDark ? '#FFFFFF' : '#0F172A' }}>{questions.length}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold" style={{ color: cbtDark ? '#A3A3A3' : '#64748B' }}>Time Allowed</p>
                <p className="text-lg font-black mt-0.5" style={{ color: cbtDark ? '#FFFFFF' : '#0F172A' }}>{quizInfo?.timeLimitMins || 60} Mins</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold" style={{ color: cbtDark ? '#A3A3A3' : '#64748B' }}>Exam Mode</p>
                <p className="text-lg font-black mt-0.5" style={{ color: cbtDark ? '#FFFFFF' : '#0F172A' }}>Bilingual</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold" style={{ color: cbtDark ? '#A3A3A3' : '#64748B' }}>Marking Scheme</p>
                <p className="text-lg font-black mt-0.5" style={{ color: cbtDark ? '#FFFFFF' : '#0F172A' }}>+1.0 / -0.33</p>
              </div>
            </div>

            {/* Caution Banner */}
            <div
              className="p-5 rounded-2xl space-y-2"
              style={{
                backgroundColor: cbtDark ? 'rgba(245, 158, 11, 0.10)' : '#FFFBEB',
                border: `1px solid ${cbtDark ? 'rgba(245, 158, 11, 0.40)' : '#FDE68A'}`,
              }}
            >
              <div className="flex items-center gap-2 font-black text-sm uppercase tracking-wider text-amber-600 dark:text-amber-400">
                <AlertOctagon className="w-5 h-5 shrink-0" />
                <span>IMPORTANT CAUTION & RULES</span>
              </div>
              <ul
                className="text-xs space-y-2 list-disc list-inside font-semibold leading-relaxed"
                style={{ color: cbtDark ? '#F3F4F6' : '#1E293B' }}
              >
                <li>The timer will <strong>NOT</strong> start until you click "START EXAM (FULLSCREEN)" below.</li>
                <li>Fullscreen browser mode is mandatory for this examination.</li>
                <li>Exiting fullscreen or switching browser tabs will trigger a security pause warning.</li>
                <li>All selected answers are automatically saved to the server during the attempt.</li>
                <li>The test will automatically submit when the allowed timer expires.</li>
              </ul>
            </div>

            {fullscreenError && (
              <div className="p-4 border border-red-500/40 bg-red-500/10 text-red-600 rounded-2xl text-xs font-bold flex items-center justify-between">
                <span>{fullscreenError}</span>
                <button
                  onClick={enterFullscreenAndStart}
                  className="px-4 py-1.5 bg-red-500 text-white font-black rounded-lg text-[10px] uppercase"
                >
                  TRY AGAIN
                </button>
              </div>
            )}

            {/* General Instructions Text */}
            <div
              className="space-y-3 text-xs leading-relaxed font-semibold"
              style={{ color: cbtDark ? '#E2E8F0' : '#334155' }}
            >
              <h3 className="font-black text-sm uppercase" style={{ color: cbtDark ? '#FFFFFF' : '#0F172A' }}>General Instructions:</h3>
              <p>1. Ensure a stable internet connection. In case of disruption, your saved answers remain safe on the server.</p>
              <p>2. You can navigate between questions using the Next, Previous, or Question Palette buttons.</p>
              <p>3. You can toggle between English and Hindi languages at any time during the test.</p>
              <p>4. You can Mark Questions for Review to revisit them before final submission.</p>
            </div>
          </div>

          {/* Student Confirmation & Launch Footer */}
          <div
            className="pt-6 mt-6 space-y-4 max-w-6xl mx-auto w-full"
            style={{ borderTop: `1px solid ${cbtDark ? '#262626' : '#E2E8F0'}` }}
          >
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <button
                type="button"
                onClick={() => setInstructionsRead(!instructionsRead)}
                className="shrink-0 text-amber-500"
              >
                {instructionsRead ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-neutral-400" />}
              </button>
              <span className="text-xs font-bold" style={{ color: cbtDark ? '#FFFFFF' : '#0F172A' }}>
                I have read and fully understood all the examination instructions and cautions above.
              </span>
            </label>

            <button
              disabled={!instructionsRead}
              onClick={enterFullscreenAndStart}
              className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-black font-black text-sm uppercase tracking-widest rounded-2xl disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              <Maximize2 className="w-4 h-4" />
              <span>START EXAM (FULLSCREEN)</span>
            </button>
          </div>
        </div>
      )}

      {/* ── 2. FULLSCREEN WARNING OVERLAY (When student exits fullscreen) ── */}
      {isPaused && quizState === 'active' && (
        <div className="fixed inset-0 z-50 bg-black/90 text-white flex items-center justify-center p-6 backdrop-blur-md">
          <div className="max-w-md w-full border-2 border-white p-8 rounded-3xl text-center space-y-6">
            <AlertOctagon className="w-12 h-12 text-white mx-auto animate-bounce" />
            <div>
              <h2 className="text-xl font-black uppercase tracking-wider">EXAMINATION PAUSED</h2>
              <p className="text-xs text-white/80 mt-2 leading-relaxed">
                You have exited browser fullscreen mode. For security and examination integrity, you must return to fullscreen to resume answering.
              </p>
              {fullscreenExitCount > 0 && (
                <p className="text-[10px] uppercase font-bold text-white/60 mt-2">
                  Fullscreen Warning Count: {fullscreenExitCount}
                </p>
              )}
            </div>
            <button
              onClick={reEnterFullscreen}
              className="w-full py-3.5 bg-white text-black font-black text-xs uppercase tracking-wider rounded-2xl transition-all hover:bg-white/90 cursor-pointer"
            >
              RETURN TO EXAM (FULLSCREEN)
            </button>
          </div>
        </div>
      )}

      {/* ── 3. ACTUAL CBT SCREEN (FULL VIEWPORT - TESTBOOK STANDARD STYLE) ── */}
      {quizState === 'active' && (
        <div
          className="flex-1 flex flex-col h-dvh max-h-dvh w-screen overflow-hidden select-none font-sans transition-colors duration-200"
          style={{
            backgroundColor: cbtDark ? '#0B0B0B' : '#FFFFFF',
            color: cbtDark ? '#FFFFFF' : '#000000',
          }}
        >
          
          {/* ── Top Bar: Logo, Title, Section Timer & Utility Buttons ── */}
          <div
            className="px-3 sm:px-6 py-2 sm:py-2.5 border-b flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 shrink-0 shadow-xs"
            style={{
              backgroundColor: cbtDark ? '#141414' : '#FFFFFF',
              borderColor: cbtDark ? '#262626' : '#E5E7EB',
            }}
          >
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <img
                src={cbtDark ? "/lightlogofull.png" : "/darklogofull.png"}
                alt="Final Attempt"
                className="h-6 sm:h-8 object-contain shrink-0"
              />
              <span className="hidden sm:inline-block bg-sky-600 text-white font-black text-[9px] uppercase px-1.5 py-0.5 rounded tracking-wider shrink-0">
                TestSeries
              </span>
              <div className="h-4 w-px hidden sm:block shrink-0" style={{ backgroundColor: cbtDark ? '#404040' : '#E5E7EB' }} />
              <h2 className="font-bold text-xs sm:text-sm truncate max-w-[130px] xs:max-w-[200px] sm:max-w-none" style={{ color: cbtDark ? '#E5E5E5' : '#111827' }}>
                {quizInfo?.title} {session?.setCode ? `(${session.setCode})` : ''}
              </h2>
            </div>

            {/* Timer & Controls */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <div
                className="flex items-center gap-1.5 sm:gap-2 border px-2.5 py-1 rounded"
                style={{
                  backgroundColor: cbtDark ? '#1C1C1C' : '#FFFFFF',
                  borderColor: cbtDark ? '#404040' : '#E5E7EB',
                }}
              >
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Time Left:</span>
                <span className="font-mono text-sm sm:text-base font-black text-sky-600">
                  {formatTime(timeLeft)}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCbtDark((d) => !d)}
                  title={cbtDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  className="px-2.5 py-1 border font-bold text-xs rounded transition-all cursor-pointer flex items-center gap-1"
                  style={{
                    backgroundColor: cbtDark ? '#1F1F1F' : '#FFFFFF',
                    borderColor: cbtDark ? '#404040' : '#E5E7EB',
                    color: cbtDark ? '#FACC15' : '#111827',
                  }}
                >
                  {cbtDark ? <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" /> : <Moon className="w-3.5 h-3.5 text-slate-700 shrink-0" />}
                  <span className="hidden sm:inline">{cbtDark ? 'Light' : 'Dark'}</span>
                </button>

                {/* Mobile Question Palette Drawer Trigger */}
                <button
                  type="button"
                  onClick={() => setShowMobilePalette((p) => !p)}
                  className="md:hidden px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                  title="Toggle Question Palette"
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>{showMobilePalette ? 'Hide Qs' : 'Palette'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── Secondary Bar: Sections Bar & Language Switcher ── */}
          <div
            className="px-3 sm:px-6 py-2 border-b flex flex-wrap items-center justify-between gap-2 text-xs font-bold shrink-0"
            style={{
              backgroundColor: cbtDark ? '#161616' : '#FFFFFF',
              borderColor: cbtDark ? '#262626' : '#E5E7EB',
            }}
          >
            <div className="flex items-center gap-2 overflow-x-auto min-w-0">
              <span className="uppercase text-[10px] sm:text-[11px] font-black shrink-0" style={{ color: cbtDark ? '#A3A3A3' : '#6B7280' }}>SECTIONS:</span>
              <button className="px-2.5 py-1 bg-sky-600 text-white rounded font-bold text-[11px] sm:text-xs shrink-0 shadow-xs truncate">
                General Studies / Main Section
              </button>
            </div>

            {/* View Language Switcher */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] sm:text-xs" style={{ color: cbtDark ? '#A3A3A3' : '#6B7280' }}>View in:</span>
              <select
                value={activeLang}
                onChange={(e) => setActiveLang(e.target.value as 'en' | 'hi')}
                className="text-xs font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded cursor-pointer border outline-none"
                style={{
                  backgroundColor: cbtDark ? '#1C1C1C' : '#FFFFFF',
                  borderColor: cbtDark ? '#404040' : '#E5E7EB',
                  color: cbtDark ? '#FFFFFF' : '#111827',
                }}
              >
                <option value="en">English</option>
                <option value="hi">Hindi (हिन्दी)</option>
              </select>
            </div>
          </div>

          {/* ── Main Viewport Split (Question & Options vs Testbook Sidebar Palette) ── */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
            
            {/* Left Main Question Box */}
            <div
              className="flex-1 p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6 overflow-y-auto"
              style={{ backgroundColor: cbtDark ? '#0B0B0B' : '#FFFFFF' }}
            >
              <div
                className="flex items-center justify-between border-b pb-3 gap-2"
                style={{ borderColor: cbtDark ? '#262626' : '#E5E7EB' }}
              >
                <span className="font-black text-xs sm:text-sm tracking-wide" style={{ color: cbtDark ? '#E2E8F0' : '#111827' }}>
                  Question No. {currentIndex + 1}
                </span>
                <div className="flex items-center gap-2 text-[11px] sm:text-xs font-bold">
                  <span
                    className={`px-2.5 py-1 rounded-md font-bold border transition-colors shadow-2xs ${activeLang === 'hi' ? 'cbt-devanagari-text' : ''}`}
                    style={{
                      backgroundColor: cbtDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
                      borderColor: cbtDark ? 'rgba(16, 185, 129, 0.4)' : '#A7F3D0',
                      color: cbtDark ? '#34D399' : '#047857',
                    }}
                  >
                    Marks: +{currentQ?.marks || 1.0}
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-md font-bold border transition-colors shadow-2xs ${activeLang === 'hi' ? 'cbt-devanagari-text' : ''}`}
                    style={{
                      backgroundColor: cbtDark ? 'rgba(244, 63, 94, 0.15)' : '#FFF1F2',
                      borderColor: cbtDark ? 'rgba(244, 63, 94, 0.4)' : '#FECDD3',
                      color: cbtDark ? '#FB7185' : '#BE123C',
                    }}
                  >
                    Negative: -{currentQ?.negativeMarks || 0.33}
                  </span>
                </div>
              </div>

              {/* Question Text - 18px Desktop / 16px Mobile, font-semibold (600), line-height ~1.6, max readable width */}
              <div
                className={`text-base md:text-[18px] font-semibold leading-[1.6] max-w-4xl whitespace-pre-wrap break-words ${activeLang === 'hi' ? 'cbt-devanagari-text' : ''}`}
                style={{ color: cbtDark ? '#FFFFFF' : '#111827' }}
              >
                {getDisplayQuestionText(currentQ).includes('<') && getDisplayQuestionText(currentQ).includes('>') ? (
                  <div dangerouslySetInnerHTML={{ __html: getDisplayQuestionText(currentQ) }} />
                ) : (
                  getDisplayQuestionText(currentQ)
                )}
              </div>

              {/* Options - ~64-72px high desktop cards, high readability & click targets */}
              <div className="space-y-3.5 pt-2 max-w-4xl">
                {['A', 'B', 'C', 'D', 'E'].map((opt) => {
                  const optKey = `option${opt}`;
                  const optionText = getDisplayOptionText(currentQ, optKey);
                  if (!optionText) return null;
                  const isSelected = selectedAnswers[currentQ?.id] === opt;

                  return (
                    <label
                      key={opt}
                      onClick={() => handleSelectOption(opt)}
                      className="flex items-center gap-4 p-4 sm:p-5 min-h-[64px] sm:min-h-[72px] border-2 rounded-2xl text-sm sm:text-base font-medium transition-all cursor-pointer select-none shadow-xs"
                      style={{
                        backgroundColor: isSelected
                          ? (cbtDark ? 'rgba(14, 165, 233, 0.18)' : '#F0F9FF')
                          : (cbtDark ? '#141414' : '#FFFFFF'),
                        borderColor: isSelected
                          ? '#0EA5E9'
                          : (cbtDark ? '#262626' : '#E5E7EB'),
                        color: cbtDark ? '#FFFFFF' : '#111827',
                      }}
                    >
                      <input
                        type="radio"
                        name={`question-${currentQ?.id}`}
                        checked={isSelected}
                        onChange={() => {}}
                        className="mt-0.5 accent-sky-600 w-5 h-5 shrink-0 cursor-pointer"
                      />
                      <span className={`flex-1 leading-relaxed ${activeLang === 'hi' ? 'cbt-devanagari-text' : ''}`}>{optionText}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Desktop Question Palette Sidebar (Hidden on Mobile) */}
            <div
              className="hidden md:flex w-80 p-5 border-l flex-col justify-between space-y-4 shrink-0 overflow-y-auto"
              style={{
                backgroundColor: cbtDark ? '#121824' : '#FFFFFF',
                borderColor: cbtDark ? '#262626' : '#E5E7EB',
              }}
            >
              <div className="space-y-5">
                
                {/* SECTION */}
                <div
                  className="space-y-1 border-b pb-3"
                  style={{ borderColor: cbtDark ? '#262626' : '#E5E7EB' }}
                >
                  <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: cbtDark ? '#94A3B8' : '#6B7280' }}>
                    SECTION
                  </p>
                  <p className="text-xs font-black truncate" style={{ color: cbtDark ? '#FFFFFF' : '#111827' }}>
                    General Studies
                  </p>
                </div>

                {/* QUESTION STATUS */}
                <div
                  className="space-y-2 border-b pb-3"
                  style={{ borderColor: cbtDark ? '#262626' : '#E5E7EB' }}
                >
                  <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: cbtDark ? '#94A3B8' : '#6B7280' }}>
                    QUESTION STATUS
                  </p>
                  
                  <div className="space-y-2 text-xs font-bold" style={{ color: cbtDark ? '#F1F5F9' : '#111827' }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                        <span>Answered</span>
                      </div>
                      <span className="font-black px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                        {attemptedCount}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
                        <span>Not Answered</span>
                      </div>
                      <span className="font-black px-2 py-0.5 rounded bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300">
                        {questions.filter(q => visitedQuestions[q.id] && !selectedAnswers[q.id]).length}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-purple-600 shrink-0" />
                        <span>Marked</span>
                      </div>
                      <span className="font-black px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300">
                        {markedCount}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full border-2 border-slate-400 shrink-0" />
                        <span>Not Visited</span>
                      </div>
                      <span className="font-black px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700">
                        {questions.filter(q => !visitedQuestions[q.id]).length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* QUESTION PALETTE */}
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: cbtDark ? '#94A3B8' : '#6B7280' }}>
                    QUESTION PALETTE
                  </p>
                  <div
                    className="grid grid-cols-5 gap-2 max-h-72 overflow-y-auto pr-1 pt-1"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {questions.map((q, idx) => {
                      const isAns = !!selectedAnswers[q.id];
                      const isMkd = !!markedForReview[q.id];
                      const isVst = !!visitedQuestions[q.id];
                      const isCur = idx === currentIndex;

                      let style = "border-2 rounded-lg font-black";
                      let inlineStyle: React.CSSProperties = {
                        backgroundColor: cbtDark ? '#1C1C1C' : '#FFFFFF',
                        borderColor: cbtDark ? '#404040' : '#E5E7EB',
                        color: cbtDark ? '#FFFFFF' : '#111827',
                      };

                      if (isAns && isMkd) {
                        style = "bg-purple-600 text-white font-black rounded-full border-2 border-emerald-400 shadow-xs";
                        inlineStyle = {};
                      } else if (isAns) {
                        style = "bg-emerald-500 text-white font-black rounded-lg border-2 border-emerald-600 shadow-xs";
                        inlineStyle = {};
                      } else if (isMkd) {
                        style = "bg-purple-600 text-white font-black rounded-full border-2 border-purple-700 shadow-xs";
                        inlineStyle = {};
                      } else if (isVst && !isAns) {
                        style = "bg-red-500 text-white font-black rounded-lg border-2 border-red-600 shadow-xs";
                        inlineStyle = {};
                      }

                      if (isCur) style += " ring-2 ring-sky-500 ring-offset-2 scale-105";

                      return (
                        <button
                          key={q.id}
                          onClick={() => setCurrentIndex(idx)}
                          className={`h-9 w-full text-xs flex items-center justify-center transition-all cursor-pointer ${style}`}
                          style={inlineStyle}
                        >
                          {String(idx + 1).padStart(2, '0')}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Submit Test Button */}
              <div className="pt-3 border-t" style={{ borderColor: cbtDark ? '#262626' : '#E5E7EB' }}>
                <button
                  onClick={() => setIsConfirmSubmitOpen(true)}
                  className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow cursor-pointer transition-all"
                >
                  Submit Test
                </button>
              </div>
            </div>

            {/* Mobile Question Palette Slide-up Drawer Modal */}
            {showMobilePalette && (
              <div className="md:hidden absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-xs flex flex-col justify-end p-3 animate-in fade-in slide-in-from-bottom-5 duration-200">
                <div
                  className="rounded-3xl p-5 border space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl"
                  style={{
                    backgroundColor: cbtDark ? '#141E2E' : '#FFFFFF',
                    borderColor: cbtDark ? '#334155' : '#E5E7EB',
                    color: cbtDark ? '#FFFFFF' : '#111827'
                  }}
                >
                  <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: cbtDark ? '#334155' : '#E5E7EB' }}>
                    <div>
                      <h3 className="font-black text-sm uppercase">Question Palette</h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">Select any question number to jump</p>
                    </div>
                    <button
                      onClick={() => setShowMobilePalette(false)}
                      className="p-1.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Legend Grid */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-tl-lg rounded-tr-lg bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black">{attemptedCount}</span>
                      <span>Answered</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-bl-lg rounded-br-lg bg-red-500 text-white flex items-center justify-center text-[10px] font-black">
                        {questions.filter(q => visitedQuestions[q.id] && !selectedAnswers[q.id]).length}
                      </span>
                      <span>Not Answered</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-black">{markedCount}</span>
                      <span>Marked</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 border flex items-center justify-center text-[10px]" style={{ backgroundColor: cbtDark ? '#1C1C1C' : '#FFFFFF', borderColor: cbtDark ? '#404040' : '#E5E7EB' }}>
                        {questions.filter(q => !visitedQuestions[q.id]).length}
                      </span>
                      <span>Not Visited</span>
                    </div>
                  </div>

                  {/* Question Grid */}
                  <div className="grid grid-cols-5 gap-2.5 max-h-60 overflow-y-auto pt-2">
                    {questions.map((q, idx) => {
                      const isAns = !!selectedAnswers[q.id];
                      const isMkd = !!markedForReview[q.id];
                      const isVst = !!visitedQuestions[q.id];
                      const isCur = idx === currentIndex;

                      let style = "border rounded font-black";
                      let inlineStyle: React.CSSProperties = {
                        backgroundColor: cbtDark ? '#1C1C1C' : '#FFFFFF',
                        borderColor: cbtDark ? '#404040' : '#E5E7EB',
                        color: cbtDark ? '#FFFFFF' : '#111827',
                      };

                      if (isAns && isMkd) {
                        style = "bg-purple-600 text-white font-black rounded-full border-2 border-emerald-400";
                        inlineStyle = {};
                      } else if (isAns) {
                        style = "bg-emerald-500 text-white font-black rounded-tl-xl rounded-tr-xl border-emerald-600";
                        inlineStyle = {};
                      } else if (isMkd) {
                        style = "bg-purple-600 text-white font-black rounded-full border-purple-700";
                        inlineStyle = {};
                      } else if (isVst && !isAns) {
                        style = "bg-red-500 text-white font-black rounded-bl-xl rounded-br-xl border-red-600";
                        inlineStyle = {};
                      }

                      if (isCur) style += " ring-2 ring-sky-500 ring-offset-1 scale-105";

                      return (
                        <button
                          key={q.id}
                          onClick={() => {
                            setCurrentIndex(idx);
                            setShowMobilePalette(false);
                          }}
                          className={`h-9 w-full text-xs flex items-center justify-center transition-all cursor-pointer ${style}`}
                          style={inlineStyle}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setShowMobilePalette(false);
                        setIsConfirmSubmitOpen(true);
                      }}
                      className="w-full py-3 bg-sky-500 hover:bg-sky-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow cursor-pointer"
                    >
                      Submit Test Now
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Testbook Responsive Bottom Action Bar (Elevated z-30 to prevent overlap) ── */}
          <div
            className="px-3 sm:px-6 py-2.5 sm:py-3 border-t flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0 z-30 relative shadow-xs"
            style={{
              backgroundColor: cbtDark ? '#141414' : '#FFFFFF',
              borderColor: cbtDark ? '#262626' : '#E5E7EB',
            }}
          >
            {/* Action Row 1 / Left Controls (pl-14 on mobile to stay clear of floating badges) */}
            <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto pl-12 sm:pl-0">
              <button
                onClick={toggleMarkForReview}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2.5 font-bold text-xs rounded-xl border-2 transition-all cursor-pointer text-center hover:bg-slate-50 dark:hover:bg-slate-800"
                style={{
                  backgroundColor: cbtDark ? '#1E293B' : '#FFFFFF',
                  borderColor: cbtDark ? '#334155' : '#D1D5DB',
                  color: cbtDark ? '#F1F5F9' : '#111827',
                }}
              >
                {markedForReview[currentQ?.id] ? 'Unmark Review' : 'Mark for Review & Next'}
              </button>
              <button
                onClick={clearResponse}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2.5 font-bold text-xs rounded-xl border-2 transition-all cursor-pointer text-center hover:bg-slate-50 dark:hover:bg-slate-800"
                style={{
                  backgroundColor: cbtDark ? '#1E293B' : '#FFFFFF',
                  borderColor: cbtDark ? '#334155' : '#D1D5DB',
                  color: cbtDark ? '#F1F5F9' : '#111827',
                }}
              >
                Clear Response
              </button>
            </div>

            {/* Action Row 2 / Right Controls */}
            <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="flex-1 sm:flex-none px-4 py-2.5 font-bold text-xs rounded-xl border-2 transition-all disabled:opacity-40 cursor-pointer text-center hover:bg-slate-50 dark:hover:bg-slate-800"
                style={{
                  backgroundColor: cbtDark ? '#1E293B' : '#FFFFFF',
                  borderColor: cbtDark ? '#334155' : '#D1D5DB',
                  color: cbtDark ? '#F1F5F9' : '#111827',
                }}
              >
                Previous
              </button>
              <button
                onClick={handleNext}
                className="flex-1 sm:flex-none px-5 sm:px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-black text-xs rounded-xl shadow cursor-pointer uppercase text-center"
              >
                Save & Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. SUBMIT CONFIRMATION DIALOG ── */}
      {isConfirmSubmitOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full border-2 border-white p-8 rounded-3xl space-y-6 text-center">
            <h2 className="text-xl font-black uppercase tracking-wider">SUBMIT EXAMINATION?</h2>
            
            <div className="grid grid-cols-3 gap-2 p-4 border border-white text-xs font-bold rounded-2xl">
              <div>
                <p className="text-[10px] uppercase opacity-70">Answered</p>
                <p className="text-base font-black mt-0.5">{attemptedCount}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase opacity-70">Unattempted</p>
                <p className="text-base font-black mt-0.5">{unattemptedCount}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase opacity-70">Marked</p>
                <p className="text-base font-black mt-0.5">{markedCount}</p>
              </div>
            </div>

            <p className="text-xs opacity-80 leading-relaxed">
              Are you sure you want to finalize and submit your examination? Once submitted, you cannot change your answers.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setIsConfirmSubmitOpen(false)}
                className="flex-1 py-3 border border-white text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                GO BACK
              </button>
              <button
                onClick={executeFinalSubmit}
                className="flex-1 py-3 bg-white text-black font-black text-xs rounded-xl cursor-pointer uppercase"
              >
                CONFIRM & SUBMIT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. RESULTS SUMMARY SCREEN ── */}
      {quizState === 'result' && (() => {
        const correctCount  = results?.details?.filter((d: any) => d.isCorrect).length ?? 0;
        const incorrectCount = results?.details?.filter((d: any) => !d.isCorrect && d.studentAnswer).length ?? 0;
        const unattemptedCount = results?.details?.filter((d: any) => !d.studentAnswer).length ?? 0;
        const scorePercent = (Number(results?.percentage) || 0);
        const passed = !!results?.passed;

        const bg       = cbtDark ? '#0B0B0B' : '#FFFFFF';
        const surface  = cbtDark ? '#111111' : '#F8F8F8';
        const surface2 = cbtDark ? '#181818' : '#F0F0F0';
        const text     = cbtDark ? '#FFFFFF'  : '#000000';
        const textSec  = cbtDark ? '#D4D4D4'  : '#333333';
        const border   = cbtDark ? '#2A2A2A'  : '#D9D9D9';
        const accent   = '#F59E0B';
        const successBg = cbtDark ? 'rgba(21,128,61,0.15)'  : '#F0FDF4';
        const successBorder = cbtDark ? '#15803D' : '#86EFAC';
        const successText   = cbtDark ? '#4ADE80'  : '#15803D';
        const errorBg  = cbtDark ? 'rgba(185,28,28,0.15)' : '#FEF2F2';
        const errorBorder = cbtDark ? '#B91C1C' : '#FECACA';
        const errorText   = cbtDark ? '#F87171' : '#B91C1C';

        return (
          <div
            className="min-h-dvh w-full flex flex-col"
            style={{ backgroundColor: bg, color: text }}
          >
            {/* ── RESULT HEADER BAR ── */}
            <div
              className="w-full px-5 py-3 flex items-center justify-between shrink-0"
              style={{ borderBottom: `1px solid ${border}`, backgroundColor: surface }}
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 shrink-0" style={{ color: accent }} />
                <span className="text-xs font-black uppercase tracking-widest" style={{ color: textSec }}>
                  Examination Result
                </span>
              </div>
              {/* Language switcher */}
              <div
                className="flex items-center text-[11px] font-bold rounded-lg overflow-hidden"
                style={{ border: `1px solid ${border}` }}
              >
                <button
                  onClick={() => setActiveLang('en')}
                  className="px-3 py-1.5 cursor-pointer transition-colors"
                  style={{
                    backgroundColor: activeLang === 'en' ? accent : 'transparent',
                    color: activeLang === 'en' ? '#000' : textSec,
                  }}
                >EN</button>
                <button
                  onClick={() => setActiveLang('hi')}
                  className="px-3 py-1.5 cursor-pointer transition-colors"
                  style={{
                    backgroundColor: activeLang === 'hi' ? accent : 'transparent',
                    color: activeLang === 'hi' ? '#000' : textSec,
                  }}
                >हिन्दी</button>
              </div>
            </div>

            {/* ── SCROLLABLE BODY ── */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-[1150px] mx-auto px-4 sm:px-8 py-8 space-y-8">

                {/* ── SCORECARD HERO ── */}
                <div
                  className="rounded-2xl p-6 sm:p-8 space-y-5"
                  style={{ backgroundColor: surface, border: `1px solid ${border}` }}
                >
                  {/* Exam meta */}
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: textSec }}>
                      Examination Result
                    </p>
                    <h1 className="text-lg sm:text-xl font-black" style={{ color: text }}>
                      {quizInfo?.title || 'CBT Mock Examination'}
                    </h1>
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs font-semibold" style={{ color: textSec }}>
                      {session?.setCode && <span>Set: <strong style={{ color: text }}>{session.setCode}</strong></span>}
                      <span>Time Taken: <strong style={{ color: text }} className="font-mono">{formatTime(timeTaken)}</strong></span>
                    </div>
                  </div>

                  {/* Pass / Fail status badge */}
                  <div
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black uppercase tracking-wider"
                    style={{
                      backgroundColor: passed ? successBg : errorBg,
                      border: `1.5px solid ${passed ? successBorder : errorBorder}`,
                      color: passed ? successText : errorText,
                    }}
                  >
                    {passed ? '✓ QUALIFIED' : '✕ NOT CLEARED'}
                  </div>

                  {/* Score progress bar */}
                  <div className="space-y-2">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: textSec }}>YOUR SCORE</p>
                        <p className="text-3xl sm:text-4xl font-black mt-0.5" style={{ color: text }}>
                          {(Number(results?.score) || 0).toFixed(2)}
                          <span className="text-base font-bold ml-1" style={{ color: textSec }}>/ {results?.maxScore}</span>
                        </p>
                      </div>
                      <p className="text-2xl font-black font-mono" style={{ color: scorePercent >= 50 ? successText : errorText }}>
                        {scorePercent.toFixed(1)}%
                      </p>
                    </div>
                    <div className="h-2 w-full rounded-full overflow-hidden" style={{ backgroundColor: surface2 }}>
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min(scorePercent, 100)}%`,
                          backgroundColor: scorePercent >= 60 ? '#15803D' : scorePercent >= 40 ? accent : '#B91C1C',
                        }}
                      />
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
                    {[
                      { label: 'Correct',      value: correctCount,      color: successText },
                      { label: 'Incorrect',    value: incorrectCount,    color: errorText },
                      { label: 'Unattempted',  value: unattemptedCount,  color: textSec },
                      { label: 'Accuracy',     value: `${scorePercent.toFixed(1)}%`, color: text },
                      { label: 'Time Taken',   value: formatTime(timeTaken), color: text, mono: true },
                    ].map(s => (
                      <div
                        key={s.label}
                        className="text-center py-3 px-2 rounded-xl"
                        style={{ backgroundColor: surface2, border: `1px solid ${border}` }}
                      >
                        <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: textSec }}>{s.label}</p>
                        <p className={`text-lg font-black ${s.mono ? 'font-mono' : ''}`} style={{ color: s.color }}>
                          {s.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── DETAILED SOLUTIONS ── */}
                <div className="space-y-3">
                  <h2 className="text-xs font-black uppercase tracking-widest" style={{ color: textSec }}>
                    Detailed Solutions
                  </h2>

                  {results?.details?.map((det: any, i: number) => {
                    const isCorrect    = det.isCorrect;
                    const isSkipped    = !det.studentAnswer;
                    const statusColor  = isCorrect ? successText : isSkipped ? textSec : errorText;
                    const statusBg     = isCorrect ? successBg   : isSkipped ? surface2 : errorBg;
                    const statusBorder = isCorrect ? successBorder : isSkipped ? border : errorBorder;
                    const statusLabel  = isCorrect ? 'CORRECT' : isSkipped ? 'UNATTEMPTED' : 'INCORRECT';
                    const qText = activeLang === 'hi' && det.questionTextHi ? det.questionTextHi : det.questionText;
                    const explanation = activeLang === 'hi' && det.explanationHi ? det.explanationHi : det.explanation;

                    return (
                      <div
                        key={det.questionId}
                        className="rounded-xl overflow-hidden"
                        style={{ border: `1px solid ${border}` }}
                      >
                        {/* Question header row */}
                        <div
                          className="flex items-center justify-between px-5 py-3"
                          style={{ backgroundColor: surface2, borderBottom: `1px solid ${border}` }}
                        >
                          <span className="text-xs font-black uppercase" style={{ color: textSec }}>
                            Q{i + 1}
                          </span>
                          <span
                            className="text-[10px] font-black uppercase px-3 py-1 rounded-full"
                            style={{ backgroundColor: statusBg, border: `1px solid ${statusBorder}`, color: statusColor }}
                          >
                            {statusLabel}
                          </span>
                        </div>

                        {/* Question body */}
                        <div className="px-5 py-4 space-y-5" style={{ backgroundColor: bg }}>
                          {/* Question text — never clipped */}
                          <p
                            className="leading-relaxed"
                            style={{ fontSize: '15px', color: text, lineHeight: '1.7', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                          >
                            {qText}
                          </p>

                          {/* Answer comparison */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Your answer */}
                            <div
                              className="px-4 py-3 rounded-xl space-y-1"
                              style={{
                                backgroundColor: isSkipped ? surface2 : isCorrect ? successBg : errorBg,
                                border: `1.5px solid ${isSkipped ? border : isCorrect ? successBorder : errorBorder}`,
                              }}
                            >
                              <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: textSec }}>Your Answer</p>
                              <p className="text-lg font-black" style={{ color: isSkipped ? textSec : isCorrect ? successText : errorText }}>
                                {det.studentAnswer
                                  ? `${det.studentAnswer} ${isCorrect ? '✓' : '✕'}`
                                  : 'Not Attempted'}
                              </p>
                            </div>

                            {/* Correct answer */}
                            <div
                              className="px-4 py-3 rounded-xl space-y-1"
                              style={{ backgroundColor: successBg, border: `1.5px solid ${successBorder}` }}
                            >
                              <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: textSec }}>Correct Answer</p>
                              <p className="text-lg font-black" style={{ color: successText }}>
                                {det.correctAnswer} ✓
                              </p>
                            </div>
                          </div>

                          {/* Explanation */}
                          {explanation && (
                            <div
                              className="rounded-xl px-4 py-4 space-y-2"
                              style={{ backgroundColor: surface, border: `1px solid ${border}` }}
                            >
                              <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: textSec }}>Explanation</p>
                              <p
                                className="leading-relaxed"
                                style={{ fontSize: '14px', color: textSec, lineHeight: '1.75', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                              >
                                {explanation}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ── BOTTOM ACTIONS ── */}
                <div
                  className="flex flex-col sm:flex-row gap-3 pt-4 pb-8"
                >
                  <button
                    onClick={loadLeaderboard}
                    className="flex-1 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest cursor-pointer transition-colors"
                    style={{ border: `2px solid ${accent}`, color: accent, backgroundColor: 'transparent' }}
                  >
                    View Leaderboard
                  </button>
                  <button
                    onClick={() => router.push('/student/prelims')}
                    className="flex-1 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest cursor-pointer transition-colors"
                    style={{ border: `2px solid ${border}`, color: textSec, backgroundColor: 'transparent' }}
                  >
                    Back to Tests
                  </button>
                  <button
                    onClick={() => router.push('/student/dashboard')}
                    className="flex-1 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest cursor-pointer"
                    style={{ backgroundColor: text, color: bg }}
                  >
                    Exit to Dashboard
                  </button>
                </div>

              </div>
            </div>
          </div>
        );
      })()}

      {/* ── 6. LEADERBOARD SCREEN ── */}
      {quizState === 'leaderboard' && (() => {
        const bg      = cbtDark ? '#0B0B0B' : '#FFFFFF';
        const surface = cbtDark ? '#111111' : '#F8F8F8';
        const surface2= cbtDark ? '#181818' : '#F0F0F0';
        const text    = cbtDark ? '#FFFFFF'  : '#000000';
        const textSec = cbtDark ? '#D4D4D4'  : '#444444';
        const border  = cbtDark ? '#2A2A2A'  : '#E5E5E5';
        const accent  = '#F59E0B';
        const successText = cbtDark ? '#4ADE80' : '#15803D';
        const errorText   = cbtDark ? '#F87171' : '#B91C1C';

        // Identify current user
        const currentUserId = user?.id || '';
        const myEntry = leaderboard.find((item: any) => item.userId === currentUserId);
        const myRank  = myEntry ? leaderboard.findIndex((item: any) => item.userId === currentUserId) + 1 : null;
        const totalParticipants = leaderboard[0]?.totalParticipants ? Number(leaderboard[0].totalParticipants) : leaderboard.length;

        const medalColors: Record<number, { bg: string; text: string; label: string }> = {
          1: { bg: '#F59E0B', text: '#000', label: '🥇' },
          2: { bg: '#9CA3AF', text: '#000', label: '🥈' },
          3: { bg: '#CD7C2F', text: '#fff', label: '🥉' },
        };

        const getInitials = (name: string) =>
          name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

        const fmtTime = (secs: number) => {
          const m = Math.floor(secs / 60);
          const s = secs % 60;
          return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
        };

        // Build display rows: top 3 + current user (if not in top 3)
        const top3 = leaderboard.slice(0, 3);
        const showMyRow = myRank !== null && myRank > 3;
        const displayRows = top3;

        return (
          <div className="min-h-dvh w-full flex flex-col" style={{ backgroundColor: bg, color: text }}>

            {/* Header bar */}
            <div
              className="w-full px-5 py-3 flex items-center justify-between shrink-0"
              style={{ borderBottom: `1px solid ${border}`, backgroundColor: surface }}
            >
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4" style={{ color: accent }} />
                <span className="text-xs font-black uppercase tracking-widest" style={{ color: textSec }}>Official Quiz Leaderboard</span>
              </div>
              <button
                onClick={() => setQuizState('result')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black uppercase cursor-pointer"
                style={{ backgroundColor: text, color: bg }}
              >
                ← Back to Review
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-[1150px] mx-auto px-4 sm:px-8 py-8 space-y-6">

                {/* Hero */}
                <div className="text-center space-y-2 py-4">
                  <div className="text-4xl">🏆</div>
                  <h1 className="text-xl font-black uppercase tracking-wider" style={{ color: text }}>Official Quiz Leaderboard</h1>
                  <p className="text-sm" style={{ color: textSec }}>See how you performed among all test takers.</p>
                </div>

                {/* Stats cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    {
                      icon: '👥', label: 'Total Participants',
                      value: totalParticipants.toLocaleString('en-IN'),
                      sub: 'Students'
                    },
                    {
                      icon: '📊', label: 'Your Rank',
                      value: myRank ? myRank.toLocaleString('en-IN') : '—',
                      sub: myRank ? `Out of ${totalParticipants.toLocaleString('en-IN')}` : 'Not ranked'
                    },
                    {
                      icon: '🎯', label: 'Your Score',
                      value: myEntry ? `${(Number(myEntry.score) || 0).toFixed(2)} / ${myEntry.maxScore || results?.maxScore || '—'}` : (results ? `${(Number(results.score) || 0).toFixed(2)} / ${results.maxScore}` : '—'),
                      sub: myEntry ? `${myEntry.maxScore ? ((Number(myEntry.score) / Number(myEntry.maxScore)) * 100).toFixed(1) : (Number(results?.percentage) || 0).toFixed(1)}%` : `${(Number(results?.percentage) || 0).toFixed(1)}%`
                    },
                    {
                      icon: '⏱', label: 'Time Taken',
                      value: fmtTime(timeTaken),
                      sub: 'HH:MM'
                    },
                  ].map(card => (
                    <div key={card.label} className="flex items-start gap-3 p-4 rounded-xl" style={{ backgroundColor: surface, border: `1px solid ${border}` }}>
                      <span className="text-2xl mt-0.5">{card.icon}</span>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: textSec }}>{card.label}</p>
                        <p className="text-lg font-black mt-0.5" style={{ color: text }}>{card.value}</p>
                        <p className="text-[10px] font-semibold" style={{ color: textSec }}>{card.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Leaderboard table */}
                <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${border}` }}>
                  {/* Table header */}
                  <div
                    className="grid text-[10px] font-black uppercase tracking-widest px-4 py-3"
                    style={{ backgroundColor: surface2, borderBottom: `1px solid ${border}`, color: textSec, gridTemplateColumns: '80px 1fr 140px 110px 110px' }}
                  >
                    <span>Rank</span>
                    <span>Student</span>
                    <span className="text-center">Score</span>
                    <span className="text-center">Accuracy</span>
                    <span className="text-right">Time Taken</span>
                  </div>

                  {/* Top 3 rows */}
                  {displayRows.map((item: any, index: number) => {
                    const rank = index + 1;
                    const medal = medalColors[rank];
                    const maxSc = Number(item.maxScore) || Number(results?.maxScore) || 1;
                    const sc    = Number(item.score) || 0;
                    const acc   = maxSc > 0 ? (sc / maxSc) * 100 : 0;
                    const isMe  = item.userId === currentUserId;
                    return (
                      <div
                        key={index}
                        className="grid items-center px-4 py-3.5"
                        style={{
                          gridTemplateColumns: '80px 1fr 140px 110px 110px',
                          borderBottom: `1px solid ${border}`,
                          backgroundColor: isMe ? (cbtDark ? 'rgba(245,158,11,0.08)' : '#FFFBEB') : bg,
                        }}
                      >
                        {/* Rank + medal */}
                        <div className="flex items-center gap-2">
                          {medal ? (
                            <span
                              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black"
                              style={{ backgroundColor: medal.bg, color: medal.text }}
                            >{rank}</span>
                          ) : (
                            <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black" style={{ backgroundColor: surface2, color: textSec }}>{rank}</span>
                          )}
                        </div>
                        {/* Avatar + Name */}
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black shrink-0"
                            style={{ backgroundColor: isMe ? accent : surface2, color: isMe ? '#000' : textSec }}
                          >
                            {getInitials(item.fullName)}
                          </div>
                          <div>
                            <p className="text-sm font-bold" style={{ color: isMe ? accent : text }}>
                              {isMe ? 'You' : item.fullName}
                            </p>
                            {item.setCode && <p className="text-[10px]" style={{ color: textSec }}>SET-{item.setCode}</p>}
                          </div>
                        </div>
                        {/* Score */}
                        <div className="text-center">
                          <p className="text-sm font-black" style={{ color: rank === 1 ? successText : text }}>{sc.toFixed(2)} / {maxSc}</p>
                          <p className="text-[10px]" style={{ color: textSec }}>{acc.toFixed(1)}%</p>
                        </div>
                        {/* Accuracy */}
                        <div className="text-center">
                          <p className="text-sm font-semibold" style={{ color: textSec }}>{acc.toFixed(1)}%</p>
                        </div>
                        {/* Time */}
                        <div className="text-right">
                          <p className="text-sm font-mono font-semibold" style={{ color: textSec }}>{fmtTime(Number(item.timeTakenSecs) || 0)}</p>
                        </div>
                      </div>
                    );
                  })}

                  {/* Separator + current user row if not in top 3 */}
                  {showMyRow && myEntry && (() => {
                    const maxSc = Number(myEntry.maxScore) || Number(results?.maxScore) || 1;
                    const sc    = Number(myEntry.score) || 0;
                    const acc   = maxSc > 0 ? (sc / maxSc) * 100 : 0;
                    return (
                      <>
                        <div className="flex items-center gap-2 px-4 py-2" style={{ borderTop: `1px dashed ${border}`, backgroundColor: surface2 }}>
                          <span className="text-[10px]" style={{ color: textSec }}>· · ·</span>
                        </div>
                        <div
                          className="grid items-center px-4 py-3.5"
                          style={{
                            gridTemplateColumns: '80px 1fr 140px 110px 110px',
                            backgroundColor: cbtDark ? 'rgba(245,158,11,0.08)' : '#FFFBEB',
                          }}
                        >
                          <div>
                            <span className="text-sm font-black" style={{ color: accent }}>{myRank}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black shrink-0" style={{ backgroundColor: accent, color: '#000' }}>
                              {getInitials(myEntry.fullName)}
                            </div>
                            <div>
                              <p className="text-sm font-bold" style={{ color: accent }}>You</p>
                              {myEntry.setCode && <p className="text-[10px]" style={{ color: textSec }}>SET-{myEntry.setCode}</p>}
                            </div>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-black" style={{ color: errorText }}>{sc.toFixed(2)} / {maxSc}</p>
                            <p className="text-[10px]" style={{ color: textSec }}>{acc.toFixed(1)}%</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-semibold" style={{ color: textSec }}>{acc.toFixed(1)}%</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-mono font-semibold" style={{ color: textSec }}>{fmtTime(timeTaken)}</p>
                          </div>
                        </div>
                      </>
                    );
                  })()}

                  {/* Footer note */}
                  <div
                    className="flex items-center gap-2 px-4 py-3 text-[10px] font-semibold"
                    style={{ borderTop: `1px solid ${border}`, color: textSec, backgroundColor: surface }}
                  >
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    Showing your position. Top 3 ranks and your rank are displayed.
                  </div>
                </div>

                {/* Info banner */}
                <div
                  className="flex items-start gap-2 px-4 py-3 rounded-xl text-xs font-medium"
                  style={{ backgroundColor: cbtDark ? 'rgba(245,158,11,0.06)' : '#FFFBEB', border: `1px solid ${cbtDark ? 'rgba(245,158,11,0.2)' : '#FDE68A'}`, color: textSec }}
                >
                  <span className="text-amber-500 shrink-0 mt-0.5">ℹ</span>
                  Leaderboard updates may take a few minutes. Scores are calculated as per the official marking scheme.
                </div>

                {/* Action button */}
                <div className="pb-8">
                  <button
                    onClick={() => router.push('/student/dashboard')}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest cursor-pointer"
                    style={{ backgroundColor: text, color: bg }}
                  >
                    Exit to Dashboard
                  </button>
                </div>

              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
