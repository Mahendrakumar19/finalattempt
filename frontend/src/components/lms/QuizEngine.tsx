'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ShieldCheck, Timer, ShieldAlert, Award, FileText, Check, X, Users, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { startQuiz, submitQuizAnswers, getQuizLeaderboard } from '@/services/auth';

interface QuizEngineProps {
  quizId: string;
}

export default function QuizEngine({ quizId }: QuizEngineProps) {
  const { accessToken } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [quizInfo, setQuizInfo] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  
  // Timer states
  const [timeLeft, setTimeLeft] = useState(0);
  const [timeTaken, setTimeTaken] = useState(0);
  const [quizState, setQuizState] = useState<'intro' | 'active' | 'result' | 'leaderboard'>('intro');

  // Result states
  const [results, setResults] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  // Load Quiz Metadata & Questions
  useEffect(() => {
    if (!accessToken) return;
    const init = async () => {
      try {
        const res = await startQuiz(quizId, accessToken);
        if (res.success && res.data) {
          setQuizInfo(res.data.quiz);
          setQuestions(res.data.questions);
          setTimeLeft(res.data.quiz.timeLimitMins * 60);
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

  // Active quiz timer count
  useEffect(() => {
    if (quizState !== 'active' || timeLeft <= 0) {
      if (timeLeft === 0 && quizState === 'active') {
        handleSubmit();
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
      setTimeTaken(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [quizState, timeLeft]);

  const handleSelectOption = (option: string) => {
    const qId = questions[currentIndex].id;
    setSelectedAnswers(prev => ({
      ...prev,
      [qId]: option
    }));
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

  const handleSubmit = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await submitQuizAnswers(quizId, { answers: selectedAnswers, timeTakenSecs: timeTaken }, accessToken);
      if (res.success && res.data) {
        setResults(res.data);
        setQuizState('result');
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
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  if (loading && quizState === 'intro') {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-slate-900 border border-white/10 rounded-3xl animate-pulse">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 text-xs font-semibold">Initializing test environment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-3xl flex gap-3 text-red-400 text-xs max-w-md mx-auto">
        <ShieldAlert className="w-5 h-5 shrink-0" />
        <div>
          <p className="font-bold">Error Occurred</p>
          <p className="mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto bg-slate-900 border border-white/10 rounded-3xl shadow-xl overflow-hidden relative">
      {/* Decorative gradient top bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

      {/* ── 1. Intro Screen ── */}
      {quizState === 'intro' && (
        <div className="p-8 sm:p-10 space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-2">
            <FileText className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{quizInfo?.title}</h2>
            <p className="text-slate-400 text-xs mt-2 max-w-md mx-auto">{quizInfo?.description}</p>
          </div>

          <div className="grid grid-cols-3 gap-4 py-4 border-y border-white/5 max-w-md mx-auto text-xs">
            <div className="space-y-1">
              <p className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Questions</p>
              <p className="text-white font-extrabold text-sm">{questions.length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Time Limit</p>
              <p className="text-white font-extrabold text-sm">{quizInfo?.timeLimitMins} Mins</p>
            </div>
            <div className="space-y-1">
              <p className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Passing Score</p>
              <p className="text-white font-extrabold text-sm">{quizInfo?.passingScore}%</p>
            </div>
          </div>

          <div className="p-4 bg-slate-800/40 border border-slate-700/30 rounded-2xl max-w-md mx-auto text-left space-y-2 text-[11px] text-slate-400">
            <p className="font-bold text-slate-300">Rules & Warnings:</p>
            <p>• Correct answer adds +1.0 Marks.</p>
            <p>• Incorrect answer deducts -0.33 Marks (BPSC negative marking pattern).</p>
            <p>• Do not reload the page or navigate away, or your test will submit automatically.</p>
          </div>

          <button
            onClick={() => setQuizState('active')}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition-all hover:-translate-y-0.5 shadow-lg shadow-blue-900/30"
          >
            Start Attempt
          </button>
        </div>
      )}

      {/* ── 2. Active Quiz Attempt Screen ── */}
      {quizState === 'active' && (
        <div>
          {/* Active Quiz Header / Progress Bar */}
          <div className="p-4 bg-slate-800/40 border-b border-white/5 flex items-center justify-between px-6">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-blue-400 animate-pulse" />
              <span className="text-white font-bold text-sm tracking-wider font-mono">{formatTime(timeLeft)}</span>
            </div>
            <div className="text-[11px] font-bold text-slate-400">
              Question {currentIndex + 1} of {questions.length}
            </div>
          </div>
          <div className="h-1 bg-slate-800 w-full">
            <div className="h-1 bg-blue-500 transition-all duration-300" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
          </div>

          {/* Question Box */}
          <div className="p-8 sm:p-10 space-y-6">
            <p className="text-white font-bold text-base leading-relaxed">
              {currentIndex + 1}. {questions[currentIndex]?.questionText}
            </p>

            {/* Options */}
            <div className="space-y-3">
              {['A', 'B', 'C', 'D'].map((opt) => {
                const optKey = `option${opt}`;
                const optionText = questions[currentIndex]?.[optKey];
                if (!optionText) return null;
                const isSelected = selectedAnswers[questions[currentIndex].id] === opt;

                return (
                  <button
                    key={opt}
                    onClick={() => handleSelectOption(opt)}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left text-xs font-semibold transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500/10 text-white'
                        : 'border-slate-800 bg-slate-800/30 text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 ${isSelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-700 text-slate-400'}`}>
                      {opt}
                    </div>
                    <span>{optionText}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Controls footer */}
          <div className="p-4 bg-slate-800/40 border-t border-white/5 flex items-center justify-between px-6">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              ← Previous
            </button>

            {currentIndex === questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-md"
              >
                Submit Answers
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all shadow-md"
              >
                Next Question →
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── 3. Results Summary Screen ── */}
      {quizState === 'result' && (
        <div className="p-8 sm:p-10 space-y-6">
          <div className="text-center space-y-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto ${results?.passed ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
              <Award className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Attempt Review</h2>
              <p className="text-slate-400 text-xs mt-1">
                {results?.passed ? 'Congratulations! You cleared the cut-off.' : 'You did not clear the cut-off this time.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 py-4 border-y border-white/5 text-center text-xs">
            <div className="space-y-1">
              <p className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Your Score</p>
              <p className={`font-extrabold text-sm ${results?.passed ? 'text-emerald-400' : 'text-red-400'}`}>{results?.score.toFixed(2)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Max Marks</p>
              <p className="text-white font-extrabold text-sm">{results?.maxScore}</p>
            </div>
            <div className="space-y-1">
              <p className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Accuracy</p>
              <p className="text-white font-extrabold text-sm">{results?.percentage.toFixed(1)}%</p>
            </div>
            <div className="space-y-1">
              <p className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Cut-off</p>
              <p className="text-white font-extrabold text-sm">{quizInfo?.passingScore}%</p>
            </div>
          </div>

          {/* Details Q&A Review */}
          <div className="space-y-4 pt-2">
            <h3 className="text-white font-bold text-sm">Detailed Answers Key:</h3>
            <div className="space-y-4 max-h-60 overflow-y-auto pr-2 styled-scrollbar">
              {results?.details.map((det: any, i: number) => (
                <div key={det.questionId} className="p-4 bg-slate-800/40 border border-white/5 rounded-2xl space-y-2 text-xs">
                  <div className="flex justify-between items-start gap-3">
                    <p className="text-white font-bold leading-relaxed">{i + 1}. {det.questionText}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase shrink-0 ${det.isCorrect ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {det.isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 font-medium pt-1">
                    <p className="flex items-center gap-1"><span className="text-slate-500">Your Answer:</span> <span className={det.isCorrect ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>{det.studentAnswer || 'Skipped'}</span></p>
                    <p className="flex items-center gap-1"><span className="text-slate-500">Correct Option:</span> <span className="text-emerald-400 font-bold">{det.correctAnswer}</span></p>
                  </div>
                  {det.explanation && (
                    <div className="p-3 bg-slate-800 rounded-xl text-[10px] text-slate-400 leading-relaxed mt-2">
                      <span className="font-bold text-slate-300">Explanation: </span>
                      {det.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.push('/student/dashboard')}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-all text-center"
            >
              Exit to Portal
            </button>
            <button
              onClick={loadLeaderboard}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all text-center flex items-center justify-center gap-1.5 shadow-lg shadow-blue-900/30"
            >
              <Users className="w-3.5 h-3.5" />
              <span>View Leaderboard</span>
            </button>
          </div>
        </div>
      )}

      {/* ── 4. Leaderboard Screen ── */}
      {quizState === 'leaderboard' && (
        <div className="p-8 sm:p-10 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <Award className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-white">Quiz Leaderboard</h2>
            <p className="text-slate-400 text-xs">Top performing students in this mini mock test.</p>
          </div>

          <div className="space-y-2">
            {leaderboard.length === 0 ? (
              <p className="text-center text-slate-500 text-xs py-8">No attempts submitted yet. Be the first!</p>
            ) : (
              <div className="border border-white/5 rounded-2xl overflow-hidden bg-slate-800/20">
                {leaderboard.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border-b border-white/5 last:border-0 text-xs font-semibold">
                    <div className="flex items-center gap-3">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${index === 0 ? 'bg-amber-400 text-slate-900' : index === 1 ? 'bg-slate-300 text-slate-900' : index === 2 ? 'bg-orange-400 text-slate-900' : 'text-slate-400'}`}>
                        {index + 1}
                      </span>
                      <span className="text-white">{item.fullName}</span>
                    </div>
                    <div className="flex items-center gap-4 text-slate-400">
                      <span>{item.score.toFixed(1)} Marks</span>
                      <span className="text-[10px] text-slate-500 font-medium">{formatTime(item.timeTakenSecs)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setQuizState('result')}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-all text-center"
            >
              ← Back to Review
            </button>
            <button
              onClick={() => router.push('/student/dashboard')}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all text-center shadow-lg shadow-blue-900/30"
            >
              Back to Portal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
