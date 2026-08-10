'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { 
  Clock, ShieldCheck, ArrowLeft,
  Check, X, FileText, ChevronRight,
  Maximize2, CheckSquare, Square
} from 'lucide-react';
import { db, TestSeriesItem } from '@/services/db';

export interface CBTQuestion {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  marks: number;
  negativeMarks: number;
}

export type QuestionStatus = 'not_visited' | 'not_answered' | 'answered' | 'marked_for_review' | 'answered_and_marked';

// High-Yield Sample BPSC Questions for dynamic fallback
const SAMPLE_BPSC_QUESTIONS: CBTQuestion[] = [
  {
    id: 'q-1',
    questionText: 'Which Article of the Indian Constitution grants the Governor the power to promulgate Ordinances during recess of the State Legislature?',
    optionA: 'Article 123',
    optionB: 'Article 213',
    optionC: 'Article 200',
    optionD: 'Article 161',
    correctAnswer: 'B',
    explanation: 'Article 213 of the Constitution deals with the power of the Governor to promulgate Ordinances during legislative recess. Article 123 relates to the President of India.',
    marks: 1,
    negativeMarks: 0.33
  },
  {
    id: 'q-2',
    questionText: 'Who led the famous Bakasht Land Movement in Bihar during 1937–1938 under the banner of the Bihar Pradesh Kisan Sabha?',
    optionA: 'Swami Sahajanand Saraswati',
    optionB: 'Karyanand Sharma',
    optionC: 'Rahul Sankrityayan',
    optionD: 'Yadunandan Sharma',
    correctAnswer: 'B',
    explanation: 'Karyanand Sharma led the Bakasht Movement in Barahiya Tal (Monghyr district) in 1937–38 demanding the restoration of lands confiscated by landlords.',
    marks: 1,
    negativeMarks: 0.33
  },
  {
    id: 'q-3',
    questionText: 'With reference to the Bihar Economy 2024-25, which sector contributes the highest share to the Gross State Value Added (GSVA)?',
    optionA: 'Primary Sector (Agriculture)',
    optionB: 'Secondary Sector (Manufacturing & Construction)',
    optionC: 'Tertiary Sector (Services)',
    optionD: 'Mining & Quarrying',
    correctAnswer: 'C',
    explanation: 'The Tertiary (Services) sector contributes over 55% of Bihar GSVA, driven by trade, real estate, financial services, and transport.',
    marks: 1,
    negativeMarks: 0.33
  },
  {
    id: 'q-4',
    questionText: 'The Champaran Satyagraha of 1917 was launched primarily against which oppressive system imposed by British Indigo Planters?',
    optionA: 'Zat-Sawar System',
    optionB: 'Tinkathia System (3/20th land cultivation)',
    optionC: 'Ryotwari Revenue Demand',
    optionD: 'Sunset Law System',
    correctAnswer: 'B',
    explanation: 'Under the Tinkathia system, peasants in Champaran were legally bound to cultivate indigo on 3 out of every 20 kathas of their landholding.',
    marks: 1,
    negativeMarks: 0.33
  },
  {
    id: 'q-5',
    questionText: 'Which river enters Bihar in Buxar district at Chausa after originating from Amarkantak plateau?',
    optionA: 'Son River',
    optionB: 'Kosi River',
    optionC: 'Gandak River',
    optionD: 'Karmanasa River',
    correctAnswer: 'D',
    explanation: 'Karmanasa River enters Bihar at Chausa (Buxar district). The Ganga also enters near Chausa, whereas Son originates from Amarkantak and joins Ganga near Patna.',
    marks: 1,
    negativeMarks: 0.33
  }
];

function CBTTestEngineContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const targetQuizIdParam = searchParams.get('quiz');

  const [series, setSeries] = useState<TestSeriesItem | null>(null);
  const [questions, setQuestions] = useState<CBTQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  // Disclaimer / Instructions state
  const [hasAgreedDisclaimer, setHasAgreedDisclaimer] = useState(false);
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [examLanguage, setExamLanguage] = useState<'English' | 'Hindi'>('English');

  // CBT State Management
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  const [questionStatuses, setQuestionStatuses] = useState<Record<string, QuestionStatus>>({});
  const [timeLeftSecs, setTimeLeftSecs] = useState<number>(3600); // 60 mins default
  const [isTestSubmitted, setIsTestSubmitted] = useState(false);
  const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState(false);



  // Dynamic quiz & question loader
  useEffect(() => {
    async function loadTestAndQuestions() {
      setLoading(true);
      try {
        const item = await db.getTestSeriesBySlug(slug);
        setSeries(item);

        let loadedQs: CBTQuestion[] = [];

        if (item && item.id) {
          // Fetch quizzes linked to this test series program from db
          const quizzes = await db.getTestSeriesQuizzes(item.id);
          if (quizzes && quizzes.length > 0) {
            const quizToLoad = targetQuizIdParam
              ? quizzes.find((q: { id: string }) => q.id === targetQuizIdParam) || quizzes[0]
              : quizzes[0];

            if (quizToLoad && quizToLoad.timeLimitMins) {
              setTimeLeftSecs(quizToLoad.timeLimitMins * 60);
            }

            const questData = await db.getQuizQuestions(quizToLoad.id);
            if (questData && questData.length > 0) {
              loadedQs = questData.map((q: CBTQuestion) => ({
                id: q.id,
                questionText: q.questionText,
                optionA: q.optionA,
                optionB: q.optionB,
                optionC: q.optionC,
                optionD: q.optionD,
                correctAnswer: q.correctAnswer || 'A',
                explanation: q.explanation || 'Refer to BPSC official syllabus notes.',
                marks: Number(q.marks) || 1,
                negativeMarks: Number(q.negativeMarks) || 0.33
              }));
            }
          }
        }

        // Fallback to sample question bank if no questions exist in DB
        const finalQuestions = loadedQs.length > 0 ? loadedQs : SAMPLE_BPSC_QUESTIONS;
        setQuestions(finalQuestions);

        // Initial status map setup
        const initialStatuses: Record<string, QuestionStatus> = {};
        finalQuestions.forEach((q, idx) => {
          initialStatuses[q.id] = idx === 0 ? 'not_answered' : 'not_visited';
        });
        setQuestionStatuses(initialStatuses);
      } catch (err) {
        console.error('Error loading CBT test engine:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTestAndQuestions();
  }, [slug, targetQuizIdParam]);



  // Countdown timer (only runs when exam is started and not submitted)
  useEffect(() => {
    if (!isExamStarted || isTestSubmitted || loading) return;

    const interval = setInterval(() => {
      setTimeLeftSecs(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFinalSubmission();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isExamStarted, isTestSubmitted, loading]);

  // Enter In-App Exam Workbench Mode
  const handleStartExam = () => {
    if (!hasAgreedDisclaimer) {
      alert('Please check the declaration checkbox to confirm you have read the instructions.');
      return;
    }
    setIsExamStarted(true);
  };

  // Current question helper
  const currentQuestion = questions[currentIndex] || SAMPLE_BPSC_QUESTIONS[0];

  // Option selection
  const handleSelectOption = (opt: 'A' | 'B' | 'C' | 'D') => {
    if (isTestSubmitted) return;
    const qId = currentQuestion.id;
    setSelectedAnswers(prev => ({ ...prev, [qId]: opt }));
  };

  // Clear Response
  const handleClearResponse = () => {
    if (isTestSubmitted) return;
    const qId = currentQuestion.id;
    setSelectedAnswers(prev => {
      const copy = { ...prev };
      delete copy[qId];
      return copy;
    });
    setQuestionStatuses(prev => ({ ...prev, [qId]: 'not_answered' }));
  };

  // Save & Next
  const handleSaveAndNext = () => {
    const qId = currentQuestion.id;
    const hasAnswer = selectedAnswers[qId];

    setQuestionStatuses(prev => ({
      ...prev,
      [qId]: hasAnswer ? 'answered' : 'not_answered'
    }));

    if (currentIndex < questions.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      const nextQId = questions[nextIdx].id;
      if (questionStatuses[nextQId] === 'not_visited') {
        setQuestionStatuses(prev => ({ ...prev, [nextQId]: 'not_answered' }));
      }
    }
  };

  // Mark for Review & Next
  const handleMarkForReviewAndNext = () => {
    const qId = currentQuestion.id;
    const hasAnswer = selectedAnswers[qId];

    setQuestionStatuses(prev => ({
      ...prev,
      [qId]: hasAnswer ? 'answered_and_marked' : 'marked_for_review'
    }));

    if (currentIndex < questions.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      const nextQId = questions[nextIdx].id;
      if (questionStatuses[nextQId] === 'not_visited') {
        setQuestionStatuses(prev => ({ ...prev, [nextQId]: 'not_answered' }));
      }
    }
  };

  // Direct Jump from Question Palette
  const handleJumpToQuestion = (idx: number) => {
    setCurrentIndex(idx);
    const targetQId = questions[idx].id;
    if (questionStatuses[targetQId] === 'not_visited') {
      setQuestionStatuses(prev => ({ ...prev, [targetQId]: 'not_answered' }));
    }
  };

  // Final Submit
  const handleFinalSubmission = () => {
    setShowSubmitConfirmModal(false);
    setIsTestSubmitted(true);
  };

  // Aggregated status summary counts
  const summaryCounts = useMemo(() => {
    let answered = 0;
    let notAnswered = 0;
    let markedForReview = 0;
    let answeredAndMarked = 0;
    let notVisited = 0;

    questions.forEach(q => {
      const st = questionStatuses[q.id] || 'not_visited';
      if (st === 'answered') answered++;
      else if (st === 'not_answered') notAnswered++;
      else if (st === 'marked_for_review') markedForReview++;
      else if (st === 'answered_and_marked') answeredAndMarked++;
      else notVisited++;
    });

    return { answered, notAnswered, markedForReview, answeredAndMarked, notVisited };
  }, [questions, questionStatuses]);

  // Score Analytics calculation post-submission
  const scoreReport = useMemo(() => {
    if (!isTestSubmitted) return null;

    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;
    let totalScore = 0;
    let maxPossibleScore = 0;

    questions.forEach(q => {
      maxPossibleScore += q.marks;
      const userChoice = selectedAnswers[q.id];

      if (!userChoice) {
        unattemptedCount++;
      } else if (userChoice === q.correctAnswer) {
        correctCount++;
        totalScore += q.marks;
      } else {
        incorrectCount++;
        totalScore -= q.negativeMarks;
      }
    });

    const attemptedCount = correctCount + incorrectCount;
    const accuracyPercentage = attemptedCount > 0 ? ((correctCount / attemptedCount) * 100).toFixed(1) : '0.0';
    const finalScore = Math.max(0, parseFloat(totalScore.toFixed(2)));

    return {
      correctCount,
      incorrectCount,
      unattemptedCount,
      attemptedCount,
      accuracyPercentage,
      finalScore,
      maxPossibleScore
    };
  }, [isTestSubmitted, questions, selectedAnswers]);

  // Timer format (MM:SS)
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-color)] flex items-center justify-center text-[var(--text-color)] font-body">
        <div className="text-center space-y-3">
          <Clock className="w-10 h-10 text-amber-500 animate-spin mx-auto" />
          <p className="text-xs font-bold uppercase tracking-wider">Launching Computer Based Test (CBT) Interface...</p>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SCREEN 1: PRE-TEST DISCLAIMER & INSTRUCTIONS SCREEN
  // ──────────────────────────────────────────────────────────────────────────
  if (!isExamStarted) {
    return (
      <div className="min-h-screen bg-[var(--bg-color)] text-[var(--text-color)] font-body py-10 px-4 sm:px-6 lg:px-8 space-y-8 flex flex-col items-center justify-center">
        <div className="max-w-4xl w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 sm:p-10 space-y-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="border-b border-[var(--card-border)] pb-6 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-lg">
                OFFICIAL CBT EXAM DISCLAIMER & INSTRUCTIONS
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Language:</span>
                <select
                  value={examLanguage}
                  onChange={e => setExamLanguage(e.target.value as 'English' | 'Hindi')}
                  className="bg-[var(--bg-color)] text-[var(--text-color)] text-xs font-bold px-3 py-1.5 rounded-xl border border-[var(--card-border)] outline-none cursor-pointer"
                >
                  <option value="English">English</option>
                  <option value="Hindi">Hindi (हिंदी)</option>
                </select>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-heading font-black text-[var(--text-color)]">
              {series?.title || 'BPSC Computer Based Test (CBT)'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Total Questions: <span className="font-bold text-[var(--text-color)]">{questions.length} Qs</span> • Total Time: <span className="font-bold text-amber-500">60 Minutes</span> • Negative Marking: <span className="font-bold text-red-500">-0.33 per wrong answer</span>
            </p>
          </div>

          {/* General Instructions Box */}
          <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-h-72 overflow-y-auto pr-2 border-b border-[var(--card-border)] pb-6">
            <h3 className="font-heading font-extrabold text-sm text-[var(--text-color)] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              <span>General Examination Instructions:</span>
            </h3>

            <ol className="list-decimal list-inside space-y-2 pl-2 text-slate-600 dark:text-slate-300">
              <li>The clock will be set at the server. The countdown timer at the top right of your screen will display the remaining time available to complete the examination.</li>
              <li>When the timer reaches zero, the examination will automatically end. You do not need to submit or end your test manually if time runs out.</li>
              <li>The Question Palette displayed on the right side of screen will show the status of each question using one of the following symbols:
                <ul className="grid grid-cols-2 gap-2 my-2 text-[11px] font-bold">
                  <li className="flex items-center gap-2 p-2 bg-[var(--bg-color)] rounded-xl border border-[var(--card-border)]">
                    <span className="w-3 h-3 rounded-full bg-slate-400 dark:bg-slate-700" /> Not Visited Yet
                  </li>
                  <li className="flex items-center gap-2 p-2 bg-[var(--bg-color)] rounded-xl border border-[var(--card-border)]">
                    <span className="w-3 h-3 rounded-full bg-red-500" /> Visited but Not Answered
                  </li>
                  <li className="flex items-center gap-2 p-2 bg-[var(--bg-color)] rounded-xl border border-[var(--card-border)]">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" /> Answered & Saved
                  </li>
                  <li className="flex items-center gap-2 p-2 bg-[var(--bg-color)] rounded-xl border border-[var(--card-border)]">
                    <span className="w-3 h-3 rounded-full bg-purple-500" /> Marked for Review
                  </li>
                </ul>
              </li>
              <li>Clicking on a question number in the question palette will take you directly to that question.</li>
              <li>You can click <strong>Save & Next</strong> to save your answer for the current question and then move to the next question.</li>
            </ol>
          </div>

          {/* Declaration Checkbox */}
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3">
            <button
              type="button"
              onClick={() => setHasAgreedDisclaimer(!hasAgreedDisclaimer)}
              className="mt-0.5 text-amber-500 shrink-0 cursor-pointer"
            >
              {hasAgreedDisclaimer ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-slate-400" />}
            </button>
            <label
              onClick={() => setHasAgreedDisclaimer(!hasAgreedDisclaimer)}
              className="text-xs text-slate-600 dark:text-slate-300 leading-snug cursor-pointer select-none font-medium"
            >
              I have read and understood all the official examination instructions. I declare that I am taking this test under genuine exam conditions without any unfair assistance.
            </label>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <Link
              href={`/test-series/${slug}`}
              className="text-xs font-bold text-slate-500 hover:text-amber-500 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Cancel & Exit to Program</span>
            </Link>

            <button
              type="button"
              onClick={handleStartExam}
              className={`w-full sm:w-auto px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-wider shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                hasAgreedDisclaimer
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 scale-[1.02]'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-60'
              }`}
            >
              <Maximize2 className="w-4 h-4" />
              <span>Begin Examination Workspace</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SCREEN 2: POST-SUBMISSION SOLUTION REVIEW SCREEN
  // ──────────────────────────────────────────────────────────────────────────
  if (isTestSubmitted && scoreReport) {
    return (
      <div className="min-h-screen bg-[var(--bg-color)] py-10 px-4 sm:px-6 lg:px-8 font-body space-y-8">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--card-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-xs">
            <div>
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 uppercase tracking-widest">
                OFFICIAL SCORE REPORT & SOLUTION REVIEW
              </span>
              <h1 className="text-2xl font-heading font-black text-[var(--text-color)] mt-1">
                {series?.title || 'BPSC CBT Mock Test'}
              </h1>
            </div>

            <Link
              href={`/test-series/${slug}`}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-2xl text-xs flex items-center gap-1.5 transition-all shadow-md shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Test Series</span>
            </Link>
          </div>

          {/* Performance Radar Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-6 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl space-y-1 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Your Final Score</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-heading font-black text-amber-500">{scoreReport.finalScore}</span>
                <span className="text-xs font-bold text-slate-400">/ {scoreReport.maxPossibleScore}</span>
              </div>
            </div>

            <div className="p-6 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl space-y-1 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Accuracy Rate</span>
              <span className="text-3xl font-heading font-black text-emerald-500">{scoreReport.accuracyPercentage}%</span>
            </div>

            <div className="p-6 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl space-y-1 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Correct Answers</span>
              <span className="text-3xl font-heading font-black text-emerald-500">{scoreReport.correctCount} Qs</span>
            </div>

            <div className="p-6 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl space-y-1 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Incorrect Penalty</span>
              <span className="text-3xl font-heading font-black text-red-500">{scoreReport.incorrectCount} Qs</span>
            </div>
          </div>

          {/* Detailed Question Solution Review */}
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
            <h3 className="font-heading font-black text-lg text-[var(--text-color)] flex items-center gap-2 border-b border-[var(--card-border)] pb-4">
              <FileText className="w-5 h-5 text-amber-500" />
              <span>Question-by-Question Solution Breakdown ({questions.length} Questions)</span>
            </h3>

            <div className="space-y-6">
              {questions.map((q, idx) => {
                const userChoice = selectedAnswers[q.id];
                const isCorrect = userChoice === q.correctAnswer;
                const isUnattempted = !userChoice;

                return (
                  <div
                    key={q.id}
                    className={`p-6 rounded-2xl border transition-all space-y-4 ${
                      isCorrect
                        ? 'bg-emerald-500/5 border-emerald-500/30'
                        : isUnattempted
                        ? 'bg-slate-50 dark:bg-slate-900/40 border-[var(--card-border)]'
                        : 'bg-red-500/5 border-red-500/30'
                    }`}
                  >
                    {/* Header line */}
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-black text-amber-500">Question {idx + 1}</span>
                      {isCorrect ? (
                        <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Correct (+{q.marks})
                        </span>
                      ) : isUnattempted ? (
                        <span className="px-2.5 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-500 font-bold">
                          Unattempted (0)
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-lg bg-red-500/20 text-red-600 dark:text-red-400 font-extrabold flex items-center gap-1">
                          <X className="w-3.5 h-3.5" /> Incorrect (-{q.negativeMarks})
                        </span>
                      )}
                    </div>

                    {/* Question text */}
                    <p className="font-bold text-sm text-[var(--text-color)]">{q.questionText}</p>

                    {/* Options list */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium">
                      {(['A', 'B', 'C', 'D'] as const).map(optKey => {
                        const isThisCorrect = optKey === q.correctAnswer;
                        const isThisUserChoice = optKey === userChoice;

                        return (
                          <div
                            key={optKey}
                            className={`p-3 rounded-xl border flex items-center justify-between ${
                              isThisCorrect
                                ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold'
                                : isThisUserChoice
                                ? 'bg-red-500/15 border-red-500 text-red-700 dark:text-red-300 font-bold'
                                : 'bg-[var(--card-bg)] border-[var(--card-border)] text-slate-500'
                            }`}
                          >
                            <span><span className="font-black mr-2">{optKey}.</span> {q[`option${optKey}` as keyof CBTQuestion]}</span>
                            {isThisCorrect && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
                            {isThisUserChoice && !isThisCorrect && <X className="w-4 h-4 text-red-500 shrink-0" />}
                          </div>
                        );
                      })}
                    </div>

                    {/* Solution Explanation Box */}
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1 text-xs text-[var(--text-color)]">
                      <span className="font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider text-[10px] block">
                        Official Solution Explanation:
                      </span>
                      <p className="leading-relaxed font-medium">{q.explanation}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SCREEN 3: LIVE CBT EXAM INTERFACE (DYNAMIC IN-APP FULLSCREEN WORKBENCH)
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 bg-[var(--bg-color)] text-[var(--text-color)] font-body flex flex-col justify-between select-none overflow-hidden">
      
      {/* ── TOP HEADER BAR ──────────────────────────────────────────────── */}
      <header className="bg-[var(--card-bg)] border-b border-[var(--card-border)] px-4 sm:px-8 py-3 flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs shadow-xs">
            CBT
          </div>
          <div>
            <h1 className="font-heading font-extrabold text-xs sm:text-sm text-[var(--text-color)] truncate max-w-xs sm:max-w-md">
              {series?.title || 'BPSC All India Mock Test'}
            </h1>
            <span className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider block">
              Official CBT Exam Mode ({examLanguage})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Countdown Clock */}
          <div className={`px-4 py-2 rounded-2xl border flex items-center gap-2 font-mono font-black text-sm sm:text-base ${
            timeLeftSecs < 300 ? 'bg-red-500/20 text-red-500 border-red-500/40 animate-pulse' : 'bg-[var(--bg-color)] text-amber-500 border-[var(--card-border)]'
          }`}>
            <Clock className="w-4 h-4 shrink-0" />
            <span>{formatTime(timeLeftSecs)}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowSubmitConfirmModal(true)}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer transition-all"
          >
            Submit Test
          </button>
        </div>
      </header>

      {/* ── MAIN WORKBENCH (TWO COLUMNS) ────────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* LEFT: QUESTION WORKBENCH */}
        <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto space-y-6">
          
          {/* Question Meta Bar */}
          <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-4">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-black rounded-lg">
                Question No. {currentIndex + 1} of {questions.length}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-extrabold">
              <span className="text-emerald-500">Marks: +{currentQuestion.marks}</span>
              <span className="text-red-500">Negative: -{currentQuestion.negativeMarks}</span>
            </div>
          </div>

          {/* Question Statement */}
          <div className="space-y-6 flex-1">
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-color)] leading-relaxed">
              {currentQuestion.questionText}
            </h2>

            {/* Options Choices */}
            <div className="space-y-3 max-w-3xl">
              {(['A', 'B', 'C', 'D'] as const).map(optKey => {
                const isSelected = selectedAnswers[currentQuestion.id] === optKey;
                return (
                  <button
                    key={optKey}
                    type="button"
                    onClick={() => handleSelectOption(optKey)}
                    className={`w-full p-4 rounded-2xl border text-left flex items-center gap-4 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500 text-amber-600 dark:text-amber-400 font-bold shadow-md'
                        : 'bg-[var(--card-bg)] border-[var(--card-border)] text-slate-700 dark:text-slate-300 hover:border-amber-500/40'
                    }`}
                  >
                    <span className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}>
                      {optKey}
                    </span>
                    <span className="text-xs sm:text-sm font-medium">{currentQuestion[`option${optKey}` as keyof CBTQuestion]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* BOTTOM ACTION BUTTONS */}
          <div className="pt-6 border-t border-[var(--card-border)] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleMarkForReviewAndNext}
                className="px-4 py-2.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-xs font-bold rounded-xl cursor-pointer"
              >
                Mark for Review & Next
              </button>

              <button
                type="button"
                onClick={handleClearResponse}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl cursor-pointer border border-[var(--card-border)]"
              >
                Clear Response
              </button>
            </div>

            <button
              type="button"
              onClick={handleSaveAndNext}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <span>Save & Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* RIGHT: TESTBOOK-STYLE QUESTION PALETTE SIDEBAR */}
        <div className="w-full lg:w-80 bg-[var(--card-bg)] border-t lg:border-t-0 lg:border-l border-[var(--card-border)] p-6 space-y-6 flex flex-col justify-between shrink-0">
          <div className="space-y-6">
            
            {/* Candidate Info Box */}
            <div className="p-4 bg-[var(--bg-color)] rounded-2xl border border-[var(--card-border)] flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-500 font-black flex items-center justify-center text-sm">
                BPSC
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Candidate Name</span>
                <span className="text-xs font-extrabold text-[var(--text-color)] truncate block">Civil Services Aspirant</span>
              </div>
            </div>

            {/* Status Legend */}
            <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
              <div className="flex items-center gap-2 p-2 bg-[var(--bg-color)] rounded-xl border border-[var(--card-border)]">
                <span className="w-3.5 h-3.5 rounded-md bg-emerald-500 shrink-0" />
                <span className="text-[var(--text-color)]">Answered ({summaryCounts.answered})</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-[var(--bg-color)] rounded-xl border border-[var(--card-border)]">
                <span className="w-3.5 h-3.5 rounded-md bg-red-500 shrink-0" />
                <span className="text-[var(--text-color)]">Not Answered ({summaryCounts.notAnswered})</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-[var(--bg-color)] rounded-xl border border-[var(--card-border)]">
                <span className="w-3.5 h-3.5 rounded-md bg-purple-500 shrink-0" />
                <span className="text-[var(--text-color)]">Marked Review ({summaryCounts.markedForReview})</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-[var(--bg-color)] rounded-xl border border-[var(--card-border)]">
                <span className="w-3.5 h-3.5 rounded-md bg-slate-300 dark:bg-slate-700 shrink-0" />
                <span className="text-[var(--text-color)]">Not Visited ({summaryCounts.notVisited})</span>
              </div>
            </div>

            {/* Question Palette Grid */}
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                Choose a Question Palette
              </span>
              <div className="grid grid-cols-5 gap-2 max-h-64 overflow-y-auto pr-1">
                {questions.map((q, idx) => {
                  const status = questionStatuses[q.id] || 'not_visited';
                  const isCurrent = idx === currentIndex;

                  let colorClass = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-[var(--card-border)]';
                  if (status === 'answered') colorClass = 'bg-emerald-500 text-slate-950 border-emerald-400 font-black';
                  else if (status === 'not_answered') colorClass = 'bg-red-500 text-white border-red-400 font-black';
                  else if (status === 'marked_for_review') colorClass = 'bg-purple-500 text-white border-purple-400 font-black';
                  else if (status === 'answered_and_marked') colorClass = 'bg-purple-600 text-emerald-300 border-emerald-400 font-black';

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => handleJumpToQuestion(idx)}
                      className={`h-10 rounded-xl border text-xs flex items-center justify-center transition-all cursor-pointer ${colorClass} ${
                        isCurrent ? 'ring-2 ring-amber-500 scale-105' : ''
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* SUBMIT CONFIRMATION MODAL */}
      {showSubmitConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider">Test Submission Summary</span>
              <h3 className="font-heading font-black text-xl text-[var(--text-color)]">Are you sure you want to submit?</h3>
              <p className="text-xs text-slate-400">Once submitted, your answers cannot be changed.</p>
            </div>

            <div className="p-4 bg-[var(--bg-color)] rounded-2xl border border-[var(--card-border)] space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[var(--card-border)]">
                <span className="text-slate-400">Total Questions:</span>
                <span className="font-bold text-[var(--text-color)]">{questions.length}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--card-border)]">
                <span className="text-emerald-500">Answered:</span>
                <span className="font-bold text-emerald-500">{summaryCounts.answered + summaryCounts.answeredAndMarked}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--card-border)]">
                <span className="text-red-500">Not Answered:</span>
                <span className="font-bold text-red-500">{summaryCounts.notAnswered}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-purple-500">Marked for Review:</span>
                <span className="font-bold text-purple-500">{summaryCounts.markedForReview}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowSubmitConfirmModal(false)}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs cursor-pointer border border-[var(--card-border)]"
              >
                Resume Test
              </button>
              <button
                type="button"
                onClick={handleFinalSubmission}
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-md cursor-pointer"
              >
                Confirm Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CBTTestEnginePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white text-xs font-bold uppercase tracking-wider">
        Loading CBT Test Engine...
      </div>
    }>
      <CBTTestEngineContent />
    </Suspense>
  );
}

