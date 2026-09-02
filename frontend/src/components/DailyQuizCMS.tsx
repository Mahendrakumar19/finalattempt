'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Flame, Plus, Trash2, Edit3, ChevronDown, ChevronRight, Check, X, 
  HelpCircle, Eye, Calendar, Clock, Award, Play, Sparkles, RefreshCw, AlertCircle 
} from 'lucide-react';
import { db } from '@/services/db';
import { renderFormattedQuestionText } from '@/utils/questionFormatter';

interface DailyQuiz {
  id: string;
  title: string;
  title_hi?: string;
  description: string;
  description_hi?: string;
  publishDate: string;
  publish_target?: 'english' | 'hindi' | 'both' | string;
  timeLimitMins: number;
  totalQuestions: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HIGH' | string;
  category?: string;
  attemptsCount?: number;
  passingScore?: number;
  isFree?: boolean;
}

interface Question {
  id: string;
  questionText: string;
  questionTextHi?: string;
  optionA: string;
  optionAHi?: string;
  optionB: string;
  optionBHi?: string;
  optionC: string;
  optionCHi?: string;
  optionD: string;
  optionDHi?: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D' | string;
  explanation: string;
  explanationHi?: string;
  marks?: number;
  negativeMarks?: number;
}

const BLANK_DAILY_QUIZ: Partial<DailyQuiz> = {
  title: 'Daily Practice: Current Affairs & Bihar GS',
  description: '10 high-yield questions covering National & Bihar Current Affairs, Polity, and Bihar Special static GS.',
  publishDate: new Date().toISOString().split('T')[0],
  publish_target: 'both',
  timeLimitMins: 10,
  totalQuestions: 10,
  difficulty: 'MEDIUM',
  category: 'Daily Practice',
  passingScore: 40,
  isFree: true
};

const BLANK_QUESTION: Partial<Question> = {
  questionText: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  correctAnswer: 'A',
  explanation: '',
  marks: 1.0,
  negativeMarks: 0.33
};

export default function DailyQuizCMS({ BACKEND_URL }: { BACKEND_URL: string }) {
  const [quizzes, setQuizzes] = useState<DailyQuiz[]>([]);
  const [loading, setLoading] = useState(true);

  // Quiz Modal State
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Partial<DailyQuiz>>({ ...BLANK_DAILY_QUIZ });
  const [savingQuiz, setSavingQuiz] = useState(false);
  const [quizModalLangTab, setQuizModalLangTab] = useState<'en' | 'hi'>('en');

  // Question Management State
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Question Modal State
  const [isQModalOpen, setIsQModalOpen] = useState(false);
  const [editingQ, setEditingQ] = useState<Partial<Question>>({ ...BLANK_QUESTION });
  const [savingQ, setSavingQ] = useState(false);
  const [qModalLangTab, setQModalLangTab] = useState<'en' | 'hi'>('en');

  // Fetch all daily quizzes
  const loadQuizzes = async () => {
    setLoading(true);
    try {
      const data = await db.getPreviousDailyQuizzes();
      setQuizzes(data || []);
    } catch (err) {
      console.error('Failed loading daily quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, []);

  // Fetch questions for a selected quiz
  const handleSelectQuizForQuestions = async (quizId: string) => {
    setSelectedQuizId(quizId);
    setLoadingQuestions(true);
    try {
      const data = await db.startDailyQuiz(quizId);
      if (data && data.questions) {
        setQuestions(data.questions);
      } else {
        setQuestions([]);
      }
    } catch (err) {
      console.error('Failed loading questions:', err);
      setQuestions([]);
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Save / Update Daily Quiz Metadata
  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingQuiz(true);

    try {
      const newQuiz: DailyQuiz = {
        id: editingQuiz.id || `dq-${Date.now()}`,
        title: editingQuiz.title || 'Daily Practice Quiz',
        title_hi: editingQuiz.title_hi || undefined,
        description: editingQuiz.description || '',
        description_hi: editingQuiz.description_hi || undefined,
        publishDate: editingQuiz.publishDate || new Date().toISOString().split('T')[0],
        timeLimitMins: Number(editingQuiz.timeLimitMins || 10),
        totalQuestions: Number(editingQuiz.totalQuestions || 10),
        difficulty: editingQuiz.difficulty || 'MEDIUM',
        category: editingQuiz.category || 'Daily Practice',
        attemptsCount: editingQuiz.attemptsCount || 0,
        passingScore: Number(editingQuiz.passingScore || 40),
        isFree: true
      };

      await db.saveDailyQuiz(newQuiz);
      await loadQuizzes();
      setIsQuizModalOpen(false);
      alert('Daily Quiz saved and published to users successfully!');
    } catch (err) {
      console.error('Error saving quiz:', err);
      alert('Failed saving quiz.');
    } finally {
      setSavingQuiz(false);
    }
  };

  // Delete Daily Quiz
  const handleDeleteQuiz = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Daily Quiz?')) return;
    try {
      await db.deleteDailyQuiz(id);
      if (selectedQuizId === id) {
        setSelectedQuizId(null);
        setQuestions([]);
      }
      await loadQuizzes();
    } catch (err) {
      console.error('Error deleting quiz:', err);
    }
  };

  // Save Question to Quiz
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuizId) return;
    setSavingQ(true);

    try {
      const newQ: Question = {
        id: editingQ.id || `q-${Date.now()}`,
        questionText: editingQ.questionText || '',
        questionTextHi: editingQ.questionTextHi || undefined,
        optionA: editingQ.optionA || '',
        optionAHi: editingQ.optionAHi || undefined,
        optionB: editingQ.optionB || '',
        optionBHi: editingQ.optionBHi || undefined,
        optionC: editingQ.optionC || '',
        optionCHi: editingQ.optionCHi || undefined,
        optionD: editingQ.optionD || '',
        optionDHi: editingQ.optionDHi || undefined,
        correctAnswer: editingQ.correctAnswer || 'A',
        explanation: editingQ.explanation || '',
        explanationHi: editingQ.explanationHi || undefined,
        marks: Number(editingQ.marks || 1.0),
        negativeMarks: Number(editingQ.negativeMarks || 0.33)
      };

      await db.saveDailyQuizQuestion(selectedQuizId, newQ);
      await handleSelectQuizForQuestions(selectedQuizId);
      setIsQModalOpen(false);
      alert('Question saved and published to users successfully!');
    } catch (err) {
      console.error('Error saving question:', err);
      alert('Failed saving question.');
    } finally {
      setSavingQ(false);
    }
  };

  // Delete Question
  const handleDeleteQuestion = async (qId: string) => {
    if (!selectedQuizId) return;
    if (!confirm('Delete this question?')) return;
    try {
      await db.deleteDailyQuizQuestion(selectedQuizId, qId);
      await handleSelectQuizForQuestions(selectedQuizId);
    } catch (err) {
      console.error('Error deleting question:', err);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* CMS Header & Actions */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 sm:p-8 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-black uppercase tracking-wider mb-2">
            <Flame className="w-4 h-4 text-amber-500" />
            <span>Daily Practice Quiz CMS</span>
          </div>
          <h2 className="text-2xl font-heading font-black text-[var(--text-color)]">
            Manage Daily Practice Quizzes
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Create, schedule, and update daily MCQ sets and question rationales for BPSC aspirants.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/daily-quiz"
            target="_blank"
            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[var(--text-color)] font-bold rounded-xl text-xs flex items-center gap-1.5 border border-[var(--card-border)] transition-all"
          >
            <Eye className="w-4 h-4 text-amber-500" />
            <span>Preview Daily Quiz Portal</span>
          </Link>

          <button
            onClick={() => {
              setEditingQuiz({ ...BLANK_DAILY_QUIZ });
              setIsQuizModalOpen(true);
            }}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Daily Quiz</span>
          </button>
        </div>
      </div>

      {/* Grid: Quiz List & Question Manager */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Daily Quizzes List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-base text-[var(--text-color)]">
              Daily Sets ({quizzes.length})
            </h3>
            <button
              onClick={loadQuizzes}
              className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg hover:text-[var(--text-color)]"
              title="Refresh Quizzes"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-28 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : quizzes.length === 0 ? (
            <div className="p-8 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
              <p className="text-xs font-bold text-slate-500">No Daily Quizzes Created Yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {quizzes.map((q) => {
                const isSelected = selectedQuizId === q.id;
                return (
                  <div
                    key={q.id}
                    className={`bg-[var(--card-bg)] border rounded-2xl p-4 transition-all space-y-3 cursor-pointer ${
                      isSelected
                        ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-md'
                        : 'border-[var(--card-border)] hover:border-amber-500/40'
                    }`}
                    onClick={() => handleSelectQuizForQuestions(q.id)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-md">
                          {new Date(q.publishDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                        {q.title_hi ? (
                          <span className="text-[9px] font-black px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-md">
                            🌐 Bilingual (Both)
                          </span>
                        ) : (
                          <span className="text-[9px] font-black px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 rounded-md">
                            🇬🇧 EN (AI Hindi)
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-md">
                        {q.difficulty}
                      </span>
                    </div>

                    <h4 className="font-heading font-bold text-sm text-[var(--text-color)] line-clamp-2">
                      {q.title}
                    </h4>

                    <div className="flex items-center justify-between text-xs text-slate-400 border-t border-[var(--card-border)] pt-2">
                      <span>{q.totalQuestions || 10} Qs • {q.timeLimitMins || 10}m</span>
                      
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            setEditingQuiz(q);
                            setIsQuizModalOpen(true);
                          }}
                          className="p-1 hover:text-amber-500 transition-colors"
                          title="Edit Quiz"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuiz(q.id)}
                          className="p-1 hover:text-red-500 transition-colors"
                          title="Delete Quiz"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Questions Builder for Selected Quiz */}
        <div className="lg:col-span-2 space-y-4">
          {selectedQuizId ? (
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 sm:p-8 space-y-6 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--card-border)] pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase text-amber-500">Selected Quiz Questions</span>
                  <h3 className="text-xl font-heading font-bold text-[var(--text-color)]">
                    Question Bank ({questions.length} Questions)
                  </h3>
                </div>

                <button
                  onClick={() => {
                    setEditingQ({ ...BLANK_QUESTION });
                    setIsQModalOpen(true);
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Add Question</span>
                </button>
              </div>

              {loadingQuestions ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : questions.length === 0 ? (
                <div className="p-10 text-center space-y-3 border border-[var(--card-border)] rounded-2xl">
                  <HelpCircle className="w-10 h-10 text-slate-400 mx-auto" />
                  <h4 className="font-heading font-bold text-sm text-[var(--text-color)]">No Questions Added to this Daily Set</h4>
                  <p className="text-xs text-slate-500">Click &quot;Add Question&quot; above to create options and explanations.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {questions.map((q, idx) => (
                    <div
                      key={q.id || idx}
                      className="p-5 border border-[var(--card-border)] rounded-2xl space-y-3 bg-slate-50/50 dark:bg-slate-900/50 hover:border-amber-500/30 transition-all"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-black text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-lg">
                          Question {idx + 1}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingQ(q);
                              setIsQModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-amber-500 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="p-1.5 text-slate-500 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {(() => {
                        const raw = q.questionText || '';
                        const { isHtml, formatted } = renderFormattedQuestionText(raw);
                        if (isHtml) {
                          return <div className="font-heading font-bold text-sm text-[var(--text-color)]" dangerouslySetInnerHTML={{ __html: formatted }} />;
                        }
                        return (
                          <h4 className="font-heading font-bold text-sm text-[var(--text-color)]">
                            {raw}
                          </h4>
                        );
                      })()}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {[
                          { key: 'A', text: q.optionA },
                          { key: 'B', text: q.optionB },
                          { key: 'C', text: q.optionC },
                          { key: 'D', text: q.optionD }
                        ].map(opt => (
                          <div
                            key={opt.key}
                            className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                              q.correctAnswer === opt.key
                                ? 'bg-emerald-500/15 border-emerald-500/40 font-bold text-emerald-600 dark:text-emerald-400'
                                : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            <span className="w-5 h-5 rounded-md bg-slate-200 dark:bg-slate-700 text-[10px] font-black flex items-center justify-center">
                              {opt.key}
                            </span>
                            <span className="truncate">{opt.text}</span>
                          </div>
                        ))}
                      </div>

                      {q.explanation && (
                        <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl text-xs space-y-1">
                          <span className="font-extrabold text-amber-600 dark:text-amber-400 text-[10px] uppercase">Explanation Rationale</span>
                          <p className="text-slate-600 dark:text-slate-300">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-12 text-center space-y-3">
              <Sparkles className="w-10 h-10 text-amber-500 mx-auto" />
              <h3 className="font-heading font-bold text-base text-[var(--text-color)]">Select a Daily Quiz</h3>
              <p className="text-xs text-slate-500">Choose a daily set from the left panel to build and edit its questions.</p>
            </div>
          )}
        </div>

      </div>

      {/* ── MODAL 1: ADD / EDIT DAILY QUIZ ───────────────────────────────── */}
      {isQuizModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-8 max-w-lg w-full space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-4">
              <h3 className="text-lg font-heading font-bold text-[var(--text-color)]">
                {editingQuiz.id ? 'Edit Daily Quiz' : 'Add New Daily Quiz'}
              </h3>
              <button onClick={() => setIsQuizModalOpen(false)} className="p-1 text-slate-400 hover:text-[var(--text-color)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Language Switcher Tabs */}
            <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl">
              <button
                type="button"
                onClick={() => setQuizModalLangTab('en')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  quizModalLangTab === 'en'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-500 hover:text-[var(--text-color)]'
                }`}
              >
                🇬🇧 English Version
              </button>
              <button
                type="button"
                onClick={() => setQuizModalLangTab('hi')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  quizModalLangTab === 'hi'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-500 hover:text-[var(--text-color)]'
                }`}
              >
                🇮🇳 Hindi Version (हिन्दी)
              </button>
            </div>

            <form onSubmit={handleSaveQuiz} className="space-y-4 text-xs">
              {quizModalLangTab === 'en' ? (
                <>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500">English Quiz Title *</label>
                    <input
                      type="text"
                      required
                      value={editingQuiz.title || ''}
                      onChange={e => setEditingQuiz(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] rounded-xl outline-none text-[var(--text-color)] focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-500">English Short Description</label>
                    <textarea
                      rows={3}
                      value={editingQuiz.description || ''}
                      onChange={e => setEditingQuiz(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] rounded-xl outline-none text-[var(--text-color)] focus:border-amber-500"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="font-bold text-amber-500">Hindi Quiz Title (हिन्दी शीर्षक - Optional)</label>
                    <input
                      type="text"
                      placeholder="उदा. दैनिक समसामयिकी एवं बिहार सामान्य ज्ञान अभ्यास सेट..."
                      value={editingQuiz.title_hi || ''}
                      onChange={e => setEditingQuiz(prev => ({ ...prev, title_hi: e.target.value }))}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-amber-500/40 rounded-xl outline-none text-[var(--text-color)] focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-amber-500">Hindi Short Description (हिन्दी विवरण - Optional)</label>
                    <textarea
                      rows={3}
                      placeholder="राष्ट्रीय व बिहार करंट अफेयर्स, राजव्यवस्था, और बिहार विशेष सामान्य ज्ञान के 10 प्रश्न..."
                      value={editingQuiz.description_hi || ''}
                      onChange={e => setEditingQuiz(prev => ({ ...prev, description_hi: e.target.value }))}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-amber-500/40 rounded-xl outline-none text-[var(--text-color)] focus:border-amber-500"
                    />
                  </div>
                </>
              )}

              <div className="space-y-1">
                <label className="font-extrabold uppercase text-[10px] text-amber-500 tracking-wider">Where Do You Want To Publish?</label>
                <select
                  value={(editingQuiz as any).publish_target || 'both'}
                  onChange={e => setEditingQuiz(prev => ({ ...prev, publish_target: e.target.value as any }))}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-amber-500/40 rounded-xl outline-none text-[var(--text-color)] font-bold cursor-pointer"
                >
                  <option value="both">🌐 Both English & Hindi Pages (Default)</option>
                  <option value="english">🇬🇧 English Page Only (/daily-quiz)</option>
                  <option value="hindi">🇮🇳 Hindi Page Only (/daily-quiz in Hindi)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Publish Date</label>
                  <input
                    type="date"
                    required
                    value={editingQuiz.publishDate || ''}
                    onChange={e => setEditingQuiz(prev => ({ ...prev, publishDate: e.target.value }))}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] rounded-xl outline-none text-[var(--text-color)] focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Difficulty</label>
                  <select
                    value={editingQuiz.difficulty || 'MEDIUM'}
                    onChange={e => setEditingQuiz(prev => ({ ...prev, difficulty: e.target.value }))}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] rounded-xl outline-none text-[var(--text-color)] font-bold"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High Yield</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Time Limit (Mins)</label>
                  <input
                    type="number"
                    value={editingQuiz.timeLimitMins || 10}
                    onChange={e => setEditingQuiz(prev => ({ ...prev, timeLimitMins: Number(e.target.value) }))}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] rounded-xl outline-none text-[var(--text-color)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Total Questions</label>
                  <input
                    type="number"
                    value={editingQuiz.totalQuestions || 10}
                    onChange={e => setEditingQuiz(prev => ({ ...prev, totalQuestions: Number(e.target.value) }))}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] rounded-xl outline-none text-[var(--text-color)]"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsQuizModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-[var(--text-color)] font-bold rounded-xl"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingQuiz}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl uppercase tracking-wider"
                >
                  {savingQuiz ? 'Saving...' : 'Save Quiz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: ADD / EDIT QUESTION ───────────────────────────────── */}
      {isQModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-8 max-w-xl w-full space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-4">
              <h3 className="text-lg font-heading font-bold text-[var(--text-color)]">
                {editingQ.id ? 'Edit Question' : 'Add Question'}
              </h3>
              <button onClick={() => setIsQModalOpen(false)} className="p-1 text-slate-400 hover:text-[var(--text-color)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Language Switcher Tabs */}
            <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl">
              <button
                type="button"
                onClick={() => setQModalLangTab('en')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  qModalLangTab === 'en'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-500 hover:text-[var(--text-color)]'
                }`}
              >
                🇬🇧 English Question
              </button>
              <button
                type="button"
                onClick={() => setQModalLangTab('hi')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  qModalLangTab === 'hi'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-500 hover:text-[var(--text-color)]'
                }`}
              >
                🇮🇳 Hindi Question (हिन्दी)
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4 text-xs">
              {qModalLangTab === 'en' ? (
                <>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500">English Question Text *</label>
                    <textarea
                      rows={3}
                      required
                      value={editingQ.questionText || ''}
                      onChange={e => setEditingQ(prev => ({ ...prev, questionText: e.target.value }))}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] rounded-xl outline-none text-[var(--text-color)] focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-500">English Option A *</label>
                      <input
                        type="text"
                        required
                        value={editingQ.optionA || ''}
                        onChange={e => setEditingQ(prev => ({ ...prev, optionA: e.target.value }))}
                        className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] rounded-xl outline-none text-[var(--text-color)]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-500">English Option B *</label>
                      <input
                        type="text"
                        required
                        value={editingQ.optionB || ''}
                        onChange={e => setEditingQ(prev => ({ ...prev, optionB: e.target.value }))}
                        className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] rounded-xl outline-none text-[var(--text-color)]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-500">English Option C *</label>
                      <input
                        type="text"
                        required
                        value={editingQ.optionC || ''}
                        onChange={e => setEditingQ(prev => ({ ...prev, optionC: e.target.value }))}
                        className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] rounded-xl outline-none text-[var(--text-color)]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-500">English Option D *</label>
                      <input
                        type="text"
                        required
                        value={editingQ.optionD || ''}
                        onChange={e => setEditingQ(prev => ({ ...prev, optionD: e.target.value }))}
                        className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] rounded-xl outline-none text-[var(--text-color)]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-500">English Explanation & Rationale</label>
                    <textarea
                      rows={3}
                      value={editingQ.explanation || ''}
                      onChange={e => setEditingQ(prev => ({ ...prev, explanation: e.target.value }))}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] rounded-xl outline-none text-[var(--text-color)] focus:border-amber-500"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="font-bold text-amber-500">Hindi Question Text (हिन्दी प्रश्न - Optional)</label>
                    <textarea
                      rows={3}
                      placeholder="उदा. भारतीय संविधान के अनुच्छेद 213 के अंतर्गत राज्यपाल अध्यादेश कब जारी कर सकता है..."
                      value={editingQ.questionTextHi || ''}
                      onChange={e => setEditingQ(prev => ({ ...prev, questionTextHi: e.target.value }))}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-amber-500/40 rounded-xl outline-none text-[var(--text-color)] focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-amber-500">Hindi Option A (विकल्प A)</label>
                      <input
                        type="text"
                        value={editingQ.optionAHi || ''}
                        onChange={e => setEditingQ(prev => ({ ...prev, optionAHi: e.target.value }))}
                        className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-amber-500/40 rounded-xl outline-none text-[var(--text-color)]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-amber-500">Hindi Option B (विकल्प B)</label>
                      <input
                        type="text"
                        value={editingQ.optionBHi || ''}
                        onChange={e => setEditingQ(prev => ({ ...prev, optionBHi: e.target.value }))}
                        className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-amber-500/40 rounded-xl outline-none text-[var(--text-color)]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-amber-500">Hindi Option C (विकल्प C)</label>
                      <input
                        type="text"
                        value={editingQ.optionCHi || ''}
                        onChange={e => setEditingQ(prev => ({ ...prev, optionCHi: e.target.value }))}
                        className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-amber-500/40 rounded-xl outline-none text-[var(--text-color)]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-amber-500">Hindi Option D (विकल्प D)</label>
                      <input
                        type="text"
                        value={editingQ.optionDHi || ''}
                        onChange={e => setEditingQ(prev => ({ ...prev, optionDHi: e.target.value }))}
                        className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-amber-500/40 rounded-xl outline-none text-[var(--text-color)]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-amber-500">Hindi Explanation (हिन्दी व्याख्या)</label>
                    <textarea
                      rows={3}
                      placeholder="अनुच्छेद 213 के तहत राज्यपाल अध्यादेश केवल तभी प्रख्यापित कर सकता है जब विधानमंडल के सत्र न चल रहे हों..."
                      value={editingQ.explanationHi || ''}
                      onChange={e => setEditingQ(prev => ({ ...prev, explanationHi: e.target.value }))}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-amber-500/40 rounded-xl outline-none text-[var(--text-color)] focus:border-amber-500"
                    />
                  </div>
                </>
              )}

              <div className="space-y-1">
                <label className="font-bold text-slate-500">Correct Answer Key *</label>
                <select
                  value={editingQ.correctAnswer || 'A'}
                  onChange={e => setEditingQ(prev => ({ ...prev, correctAnswer: e.target.value }))}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] rounded-xl outline-none text-[var(--text-color)] font-black"
                >
                  <option value="A">Option A</option>
                  <option value="B">Option B</option>
                  <option value="C">Option C</option>
                  <option value="D">Option D</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500">Explanation & Rationale</label>
                <textarea
                  rows={3}
                  value={editingQ.explanation || ''}
                  onChange={e => setEditingQ(prev => ({ ...prev, explanation: e.target.value }))}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] rounded-xl outline-none text-[var(--text-color)] focus:border-amber-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsQModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-[var(--text-color)] font-bold rounded-xl"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingQ}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl uppercase tracking-wider"
                >
                  {savingQ ? 'Saving...' : 'Save Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
