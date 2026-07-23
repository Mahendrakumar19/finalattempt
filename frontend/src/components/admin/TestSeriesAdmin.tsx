'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight, FileText, BookOpen, X, Check } from 'lucide-react';

interface Quiz {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  timeLimitMins?: number;
  passingScore?: number;
}

interface Question {
  id: string;
  quizId: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  marks?: number;
  negativeMarks?: number;
}

interface Course {
  id: string;
  title: string;
}

const BLANK_QUIZ = {
  title: '',
  description: '',
  timeLimitMins: 30,
  passingScore: 40,
};

const BLANK_QUESTION = {
  questionText: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  correctAnswer: 'A' as const,
  explanation: '',
  marks: 1,
  negativeMarks: 0.33,
};

export default function TestSeriesAdmin({ BACKEND_URL }: { BACKEND_URL: string }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);

  // Quiz form
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [quizForm, setQuizForm] = useState({ ...BLANK_QUIZ });
  const [savingQuiz, setSavingQuiz] = useState(false);

  // Per-quiz expanded state + questions
  const [expandedQuiz, setExpandedQuiz] = useState<string | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<Record<string, Question[]>>({});
  const [loadingQuestions, setLoadingQuestions] = useState<string | null>(null);

  // Question form
  const [showQForm, setShowQForm] = useState<string | null>(null); // quizId
  const [qForm, setQForm] = useState({ ...BLANK_QUESTION });
  const [savingQ, setSavingQ] = useState(false);

  // Load courses on mount
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/lms/courses`)
      .then(r => r.json())
      .then(d => { if (d.success) setCourses(d.data || []); })
      .catch(() => {});
  }, [BACKEND_URL]);

  // Load quizzes when course selected
  useEffect(() => {
    if (!selectedCourseId) { setQuizzes([]); return; }
    setLoadingQuizzes(true);
    fetch(`${BACKEND_URL}/api/lms/courses/${selectedCourseId}/quizzes`)
      .then(r => r.json())
      .then(d => { if (d.success) setQuizzes(d.data || []); })
      .catch(() => {})
      .finally(() => setLoadingQuizzes(false));
  }, [selectedCourseId, BACKEND_URL]);

  // Load questions when quiz expanded
  const toggleQuiz = async (quizId: string) => {
    if (expandedQuiz === quizId) { setExpandedQuiz(null); return; }
    setExpandedQuiz(quizId);
    if (quizQuestions[quizId]) return;
    setLoadingQuestions(quizId);
    try {
      const res = await fetch(`${BACKEND_URL}/api/lms/quizzes/${quizId}/questions`);
      const d = await res.json();
      if (d.success) setQuizQuestions(prev => ({ ...prev, [quizId]: d.data || [] }));
    } finally {
      setLoadingQuestions(null);
    }
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) return;
    setSavingQuiz(true);
    try {
      const id = `quiz-${selectedCourseId}-${Date.now()}`;
      const payload = { id, ...quizForm, courseId: selectedCourseId };
      const res = await fetch(`${BACKEND_URL}/api/lms/courses/${selectedCourseId}/quizzes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (d.success && d.data) {
        setQuizzes(prev => [...prev, d.data]);
        setShowQuizForm(false);
        setQuizForm({ ...BLANK_QUIZ });
      }
    } finally {
      setSavingQuiz(false);
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm('Delete this quiz and ALL its questions?')) return;
    await fetch(`${BACKEND_URL}/api/lms/quizzes/${quizId}`, { method: 'DELETE' });
    setQuizzes(prev => prev.filter(q => q.id !== quizId));
    if (expandedQuiz === quizId) setExpandedQuiz(null);
  };

  const handleCreateQuestion = async (e: React.FormEvent, quizId: string) => {
    e.preventDefault();
    setSavingQ(true);
    try {
      const id = `q-${quizId}-${Date.now()}`;
      const payload = { id, ...qForm, quizId };
      const res = await fetch(`${BACKEND_URL}/api/lms/quizzes/${quizId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (d.success && d.data) {
        setQuizQuestions(prev => ({
          ...prev,
          [quizId]: [...(prev[quizId] || []), d.data],
        }));
        setShowQForm(null);
        setQForm({ ...BLANK_QUESTION });
      }
    } finally {
      setSavingQ(false);
    }
  };

  const handleDeleteQuestion = async (quizId: string, questionId: string) => {
    if (!confirm('Delete this question?')) return;
    await fetch(`${BACKEND_URL}/api/lms/questions/${questionId}`, { method: 'DELETE' });
    setQuizQuestions(prev => ({
      ...prev,
      [quizId]: (prev[quizId] || []).filter(q => q.id !== questionId),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-md p-5 rounded-3xl border border-slate-200 shadow-xs">
        <h3 className="font-extrabold text-sm text-slate-900 mb-1">Test Series Manager</h3>
        <p className="text-[10px] text-slate-500 font-medium">
          Create and manage quizzes and questions for each course. Students see these in their Tests tab.
        </p>
      </div>

      {/* Course Selector */}
      <div className="bg-white/70 backdrop-blur-md p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Select Course</label>
        <select
          value={selectedCourseId}
          onChange={e => setSelectedCourseId(e.target.value)}
          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-2xl focus:outline-none focus:border-amber-400"
        >
          <option value="">— Choose a course —</option>
          {courses.map(c => (
            <option key={c.id} value={c.id}>{c.title} ({c.id})</option>
          ))}
        </select>
      </div>

      {/* Quiz List */}
      {selectedCourseId && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-extrabold text-sm text-slate-900">Quizzes</h4>
              <p className="text-[10px] text-slate-500 font-medium">{quizzes.length} quiz{quizzes.length !== 1 ? 'zes' : ''} for this course</p>
            </div>
            <button
              onClick={() => { setShowQuizForm(true); setQuizForm({ ...BLANK_QUIZ }); }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold rounded-xl transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> New Quiz
            </button>
          </div>

          {loadingQuizzes ? (
            <div className="space-y-3">
              {[1, 2].map(i => <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />)}
            </div>
          ) : quizzes.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 text-xs font-medium">No quizzes yet. Click &quot;New Quiz&quot; to create one.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {quizzes.map(quiz => (
                <div key={quiz.id} className="bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                  {/* Quiz Header */}
                  <div className="flex items-center justify-between p-4">
                    <button
                      onClick={() => toggleQuiz(quiz.id)}
                      className="flex items-center gap-3 text-left flex-1 min-w-0"
                    >
                      <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-amber-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{quiz.title}</p>
                        <p className="text-[10px] text-slate-500 font-medium">
                          {quiz.timeLimitMins ? `${quiz.timeLimitMins} mins` : 'No time limit'} · Pass: {quiz.passingScore || 40}%
                        </p>
                      </div>
                      <div className="ml-2 shrink-0">
                        {expandedQuiz === quiz.id ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                      </div>
                    </button>
                    <button
                      onClick={() => handleDeleteQuiz(quiz.id)}
                      className="ml-3 p-2 rounded-xl text-red-400 hover:bg-red-50 hover:text-red-600 transition-all shrink-0"
                      title="Delete quiz"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Questions Panel */}
                  {expandedQuiz === quiz.id && (
                    <div className="border-t border-slate-200 p-4 space-y-3 bg-slate-50/50">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                          Questions ({(quizQuestions[quiz.id] || []).length})
                        </p>
                        <button
                          onClick={() => { setShowQForm(quiz.id); setQForm({ ...BLANK_QUESTION }); }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-xl hover:bg-slate-700 transition-all"
                        >
                          <Plus className="w-3 h-3" /> Add Question
                        </button>
                      </div>

                      {loadingQuestions === quiz.id ? (
                        <div className="h-10 bg-slate-200 rounded-xl animate-pulse" />
                      ) : (quizQuestions[quiz.id] || []).length === 0 ? (
                        <p className="text-[10px] text-slate-400 font-medium text-center py-4">No questions yet. Add some!</p>
                      ) : (
                        <div className="space-y-2">
                          {(quizQuestions[quiz.id] || []).map((q, idx) => (
                            <div key={q.id} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-200">
                              <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-[9px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">{idx + 1}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-slate-900 font-medium">{q.questionText}</p>
                                <div className="grid grid-cols-2 gap-1 mt-1.5 text-[10px] text-slate-500">
                                  {(['A', 'B', 'C', 'D'] as const).map(opt => (
                                    <span key={opt} className={`flex items-center gap-1 ${q.correctAnswer === opt ? 'text-emerald-600 font-bold' : ''}`}>
                                      {q.correctAnswer === opt && <Check className="w-3 h-3" />}
                                      <span className="font-bold">{opt}.</span> {q[`option${opt}` as keyof Question] as string}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <button
                                onClick={() => handleDeleteQuestion(quiz.id, q.id)}
                                className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-all shrink-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Question Form */}
                      {showQForm === quiz.id && (
                        <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-[10px] font-bold uppercase text-slate-700 tracking-wider">New Question</p>
                            <button onClick={() => setShowQForm(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700"><X className="w-4 h-4" /></button>
                          </div>
                          <form onSubmit={e => handleCreateQuestion(e, quiz.id)} className="space-y-3">
                            <div>
                              <label className="text-[9px] font-bold uppercase text-slate-400">Question Text *</label>
                              <textarea
                                required
                                value={qForm.questionText}
                                onChange={e => setQForm({ ...qForm, questionText: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl focus:outline-none focus:border-amber-400 min-h-16 mt-1"
                                placeholder="Type the question here..."
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              {(['A', 'B', 'C', 'D'] as const).map(opt => (
                                <div key={opt}>
                                  <label className="text-[9px] font-bold uppercase text-slate-400">Option {opt} *</label>
                                  <input
                                    required
                                    type="text"
                                    value={qForm[`option${opt}` as keyof typeof qForm] as string}
                                    onChange={e => setQForm({ ...qForm, [`option${opt}`]: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl focus:outline-none focus:border-amber-400 mt-1"
                                    placeholder={`Option ${opt}`}
                                  />
                                </div>
                              ))}
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="text-[9px] font-bold uppercase text-slate-400">Correct Answer *</label>
                                <select
                                  value={qForm.correctAnswer}
                                  onChange={e => setQForm({ ...qForm, correctAnswer: e.target.value as any })}
                                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl focus:outline-none focus:border-amber-400 mt-1"
                                >
                                  {(['A', 'B', 'C', 'D'] as const).map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="text-[9px] font-bold uppercase text-slate-400">Marks</label>
                                <input
                                  type="number" step="0.5" min="0.5"
                                  value={qForm.marks}
                                  onChange={e => setQForm({ ...qForm, marks: Number(e.target.value) })}
                                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl focus:outline-none focus:border-amber-400 mt-1"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] font-bold uppercase text-slate-400">Negative</label>
                                <input
                                  type="number" step="0.01" min="0"
                                  value={qForm.negativeMarks}
                                  onChange={e => setQForm({ ...qForm, negativeMarks: Number(e.target.value) })}
                                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl focus:outline-none focus:border-amber-400 mt-1"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-[9px] font-bold uppercase text-slate-400">Explanation (optional)</label>
                              <textarea
                                value={qForm.explanation}
                                onChange={e => setQForm({ ...qForm, explanation: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl focus:outline-none focus:border-amber-400 min-h-12 mt-1"
                                placeholder="Shown to student after submission..."
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <button type="button" onClick={() => setShowQForm(null)} className="px-4 py-2 border border-slate-200 text-slate-600 text-[10px] font-bold rounded-xl">Cancel</button>
                              <button type="submit" disabled={savingQ} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold rounded-xl transition-all disabled:opacity-60">
                                {savingQ ? 'Saving…' : 'Save Question'}
                              </button>
                            </div>
                          </form>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Quiz Modal */}
      {showQuizForm && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateQuiz} className="bg-white border border-slate-200 p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900">Create New Quiz</h3>
              <button type="button" onClick={() => setShowQuizForm(false)} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700"><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase">Quiz Title *</label>
              <input
                type="text" required value={quizForm.title}
                onChange={e => setQuizForm({ ...quizForm, title: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-2xl focus:outline-none focus:border-amber-400"
                placeholder="e.g. BPSC Prelims Mock Test 1"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase">Description</label>
              <textarea
                value={quizForm.description}
                onChange={e => setQuizForm({ ...quizForm, description: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-2xl focus:outline-none focus:border-amber-400 min-h-16"
                placeholder="Optional quiz description..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Time Limit (mins)</label>
                <input
                  type="number" min="1" value={quizForm.timeLimitMins}
                  onChange={e => setQuizForm({ ...quizForm, timeLimitMins: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-2xl focus:outline-none focus:border-amber-400"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Passing Score (%)</label>
                <input
                  type="number" min="1" max="100" value={quizForm.passingScore}
                  onChange={e => setQuizForm({ ...quizForm, passingScore: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-2xl focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowQuizForm(false)} className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-2xl">Cancel</button>
              <button type="submit" disabled={savingQuiz} className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-2xl transition-all disabled:opacity-60">
                {savingQuiz ? 'Creating…' : 'Create Quiz'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
