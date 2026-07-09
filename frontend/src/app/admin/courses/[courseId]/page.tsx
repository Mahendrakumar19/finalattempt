'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ChevronLeft, Plus, Trash2, Edit3, Save, CheckCircle, 
  HelpCircle, BookOpen, Clock, FileText, Layout, Play, ExternalLink
} from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'quiz' | 'assignment';
  videoUrl?: string;
  duration: string;
  isFree?: boolean;
}

interface Section {
  id: string;
  title: string;
  lessons: Lesson[];
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  timeLimitMins: number;
  passingScore: number;
  isPublished: boolean;
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
  explanation: string;
  marks: number;
  negativeMarks: number;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  maxMarks: number;
  submissionType: 'pdf' | 'text';
  isPublished: boolean;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export default function CourseEditorPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const [activeTab, setActiveTab] = useState<'curriculum' | 'quizzes' | 'assignments'>('curriculum');
  const [loading, setLoading] = useState(true);

  // Course metadata state
  const [courseTitle, setCourseTitle] = useState('');

  // Curriculum State
  const [sections, setSections] = useState<Section[]>([]);
  
  // Quizzes State
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);

  // Assignments State
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  // Modals / Form States
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizForm, setQuizForm] = useState<Partial<Quiz>>({ title: '', description: '', timeLimitMins: 30, passingScore: 40 });
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [questionForm, setQuestionForm] = useState<Partial<Question>>({ questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: 'A', explanation: '', marks: 1.0, negativeMarks: 0.33 });
  
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState<Partial<Assignment>>({ title: '', description: '', dueDate: '', maxMarks: 100, submissionType: 'pdf' });

  useEffect(() => {
    fetchCourseDetails();
  }, [courseId]);

  const fetchCourseDetails = async () => {
    setLoading(true);
    try {
      // 1. Get Course & Curriculum
      const curRes = await fetch(`${BACKEND_URL}/api/lms/courses/${courseId}/sections`);
      const curData = await curRes.json();
      if (curData.success) {
        setCourseTitle(curData.data.course.title);
        setSections(curData.data.sections || []);
      }

      // 2. Get Quizzes
      const quizRes = await fetch(`${BACKEND_URL}/api/lms/courses/${courseId}/quizzes`);
      const quizData = await quizRes.json();
      if (quizData.success) {
        setQuizzes(quizData.data || []);
      }

      // 3. Get Assignments
      const assignRes = await fetch(`${BACKEND_URL}/api/lms/courses/${courseId}/assignments`);
      const assignData = await assignRes.json();
      if (assignData.success) {
        setAssignments(assignData.data || []);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Section CRUD
  const handleAddSection = async () => {
    const title = window.prompt('Enter Section/Chapter Title:');
    if (!title) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/lms/courses/${courseId}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      });
      if (res.ok) fetchCourseDetails();
    } catch (err) { console.error(err); }
  };

  const handleUpdateSection = async (sectionId: string, currentTitle: string) => {
    const title = window.prompt('Update Section Title:', currentTitle);
    if (!title) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/lms/sections/${sectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      });
      if (res.ok) fetchCourseDetails();
    } catch (err) { console.error(err); }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!window.confirm('Delete this chapter and all its lessons?')) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/lms/sections/${sectionId}`, { method: 'DELETE' });
      if (res.ok) fetchCourseDetails();
    } catch (err) { console.error(err); }
  };

  // Lesson CRUD
  const handleAddLesson = async (sectionId: string) => {
    const title = window.prompt('Enter Lecture Title:');
    const videoUrl = window.prompt('Enter Video URL:', 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4');
    if (!title) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/lms/sections/${sectionId}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, title, type: 'video', videoUrl, duration: '15 mins' })
      });
      if (res.ok) fetchCourseDetails();
    } catch (err) { console.error(err); }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!window.confirm('Delete this lecture lesson?')) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/lms/lessons/${lessonId}`, { method: 'DELETE' });
      if (res.ok) fetchCourseDetails();
    } catch (err) { console.error(err); }
  };

  // Quiz CRUD
  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = quizForm.id ? 'PUT' : 'POST';
      const endpoint = quizForm.id 
        ? `${BACKEND_URL}/api/lms/quizzes/${quizForm.id}` 
        : `${BACKEND_URL}/api/lms/courses/${courseId}/quizzes`;

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quizForm)
      });
      if (res.ok) {
        setShowQuizModal(false);
        fetchCourseDetails();
      }
    } catch (err) { console.error(err); }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!window.confirm('Delete this quiz and all its questions?')) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/lms/quizzes/${quizId}`, { method: 'DELETE' });
      if (res.ok) {
        if (selectedQuiz?.id === quizId) setSelectedQuiz(null);
        fetchCourseDetails();
      }
    } catch (err) { console.error(err); }
  };

  const handleSelectQuiz = async (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    try {
      const res = await fetch(`${BACKEND_URL}/api/lms/quizzes/${quiz.id}/questions`);
      const data = await res.json();
      if (data.success) {
        setQuestions(data.data || []);
      }
    } catch (err) { console.error(err); }
  };

  // Question CRUD
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuiz) return;
    try {
      const method = questionForm.id ? 'PUT' : 'POST';
      const endpoint = questionForm.id 
        ? `${BACKEND_URL}/api/lms/questions/${questionForm.id}` 
        : `${BACKEND_URL}/api/lms/quizzes/${selectedQuiz.id}/questions`;

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questionForm)
      });
      if (res.ok) {
        setShowQuestionModal(false);
        handleSelectQuiz(selectedQuiz);
      }
    } catch (err) { console.error(err); }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/lms/questions/${questionId}`, { method: 'DELETE' });
      if (res.ok && selectedQuiz) handleSelectQuiz(selectedQuiz);
    } catch (err) { console.error(err); }
  };

  // Assignment CRUD
  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = assignmentForm.id ? 'PUT' : 'POST';
      const endpoint = assignmentForm.id 
        ? `${BACKEND_URL}/api/lms/assignments/${assignmentForm.id}` 
        : `${BACKEND_URL}/api/lms/courses/${courseId}/assignments`;

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignmentForm)
      });
      if (res.ok) {
        setShowAssignmentModal(false);
        fetchCourseDetails();
      }
    } catch (err) { console.error(err); }
  };

  const handleDeleteAssignment = async (assignId: string) => {
    if (!window.confirm('Delete this assignment?')) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/lms/assignments/${assignId}`, { method: 'DELETE' });
      if (res.ok) fetchCourseDetails();
    } catch (err) { console.error(err); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            <ChevronLeft className="w-4 h-4 text-slate-700" />
          </Link>
          <div>
            <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">LMS Program Editor</span>
            <h1 className="text-xl font-bold text-slate-950 mt-0.5">{courseTitle}</h1>
          </div>
        </div>

        {/* Tabs switcher */}
        <div className="flex gap-1 p-1 bg-white border border-slate-200 rounded-2xl w-fit">
          {[
            { id: 'curriculum', label: 'Curriculum (Chapters & Lectures)' },
            { id: 'quizzes', label: 'Quizzes' },
            { id: 'assignments', label: 'Assignments' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === tab.id 
                  ? 'bg-slate-900 text-white' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Curriculum Tab ── */}
        {activeTab === 'curriculum' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-3xl border border-slate-200">
              <div>
                <h3 className="font-bold text-sm text-slate-950">Course Outline</h3>
                <p className="text-[10px] text-slate-500">Create chapters and populate them with video lectures.</p>
              </div>
              <button 
                onClick={handleAddSection} 
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Chapter
              </button>
            </div>

            <div className="space-y-4">
              {sections.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400">
                  No chapters or sections have been created for this course yet.
                </div>
              ) : (
                sections.map((sec, sIdx) => (
                  <div key={sec.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
                    
                    {/* Chapter Header */}
                    <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-slate-200 text-slate-800 flex items-center justify-center text-[10px] font-bold">
                          {sIdx + 1}
                        </span>
                        <h4 className="font-bold text-xs text-slate-900">{sec.title}</h4>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleUpdateSection(sec.id, sec.title)}
                          className="p-1.5 border border-slate-200 bg-white rounded-lg text-slate-500 hover:bg-slate-100"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteSection(sec.id)}
                          className="p-1.5 border border-slate-200 bg-white rounded-lg text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleAddLesson(sec.id)}
                          className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-bold hover:bg-slate-800 flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Add Lecture
                        </button>
                      </div>
                    </div>

                    {/* Chapter Lectures */}
                    <div className="p-4 divide-y divide-slate-100">
                      {(!sec.lessons || sec.lessons.length === 0) ? (
                        <div className="text-center py-6 text-slate-400 text-xs italic">
                          No lecture contents inside this chapter.
                        </div>
                      ) : (
                        sec.lessons.map(les => (
                          <div key={les.id} className="py-3 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                                <Play className="w-3.5 h-3.5 fill-current" />
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-slate-800">{les.title}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">{les.duration}</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => handleDeleteLesson(les.id)}
                              className="p-1.5 border border-slate-200 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── Quizzes Tab ── */}
        {activeTab === 'quizzes' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Quiz Directory */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white p-4 rounded-3xl border border-slate-200 flex justify-between items-center">
                <h3 className="font-bold text-xs text-slate-900">Quizzes</h3>
                <button 
                  onClick={() => {
                    setQuizForm({ title: '', description: '', timeLimitMins: 30, passingScore: 40 });
                    setShowQuizModal(true);
                  }}
                  className="p-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {quizzes.length === 0 ? (
                  <p className="text-center py-6 text-xs text-slate-400">No quizzes configured.</p>
                ) : (
                  quizzes.map(q => (
                    <div 
                      key={q.id}
                      onClick={() => handleSelectQuiz(q)}
                      className={`p-4 bg-white rounded-2xl border transition-all cursor-pointer ${
                        selectedQuiz?.id === q.id ? 'border-amber-500 shadow-sm' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h4 className="font-bold text-xs text-slate-900">{q.title}</h4>
                          <p className="text-[10px] text-slate-400 mt-1">{q.timeLimitMins} mins &bull; {q.passingScore}% passing score</p>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setQuizForm(q);
                              setShowQuizModal(true);
                            }}
                            className="p-1 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-655"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteQuiz(q.id);
                            }}
                            className="p-1 border border-red-100 rounded-lg hover:bg-red-50 text-red-500"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Column: Questions List Editor */}
            <div className="lg:col-span-2 space-y-4">
              {selectedQuiz ? (
                <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-6">
                  
                  {/* Title & Add Question Header */}
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                    <div>
                      <h3 className="font-bold text-sm text-slate-950">{selectedQuiz.title}</h3>
                      <p className="text-[10px] text-slate-500">Configure Multiple Choice Questions below.</p>
                    </div>
                    <button
                      onClick={() => {
                        setQuestionForm({ questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: 'A', explanation: '', marks: 1.0, negativeMarks: 0.33 });
                        setShowQuestionModal(true);
                      }}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Question
                    </button>
                  </div>

                  {/* Questions Directory */}
                  <div className="space-y-4">
                    {questions.length === 0 ? (
                      <p className="text-center py-10 text-slate-400 text-xs italic">
                        This quiz has no questions yet. Click "Add Question" to begin.
                      </p>
                    ) : (
                      questions.map((q, idx) => (
                        <div key={q.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 relative">
                          <div className="flex justify-between items-start gap-4">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Q{idx + 1}</span>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => {
                                  setQuestionForm(q);
                                  setShowQuestionModal(true);
                                }}
                                className="p-1 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-655"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                              <button 
                                onClick={() => handleDeleteQuestion(q.id)}
                                className="p-1 bg-white border border-red-100 rounded-lg hover:bg-red-50 text-red-500"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          
                          <p className="text-xs font-semibold text-slate-900 mt-2">{q.questionText}</p>
                          
                          {/* Options grid */}
                          <div className="grid grid-cols-2 gap-3 mt-4">
                            {['A', 'B', 'C', 'D'].map(opt => (
                              <div 
                                key={opt} 
                                className={`p-2.5 rounded-xl border text-[11px] font-medium ${
                                  q.correctAnswer === opt 
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold' 
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                <span className="font-bold mr-1.5">{opt}.</span>
                                {(q as any)[`option${opt}`]}
                              </div>
                            ))}
                          </div>
                          
                          {/* Explanation if present */}
                          {q.explanation && (
                            <div className="mt-3 p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl text-[10px] text-amber-800">
                              <span className="font-bold">Explanation:</span> {q.explanation}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                </div>
              ) : (
                <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400">
                  Select a quiz from the list to manage its questions.
                </div>
              )}
            </div>

          </div>
        )}

        {/* ── Assignments Tab ── */}
        {activeTab === 'assignments' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-3xl border border-slate-200">
              <div>
                <h3 className="font-bold text-sm text-slate-950">Assignments</h3>
                <p className="text-[10px] text-slate-500">Configure descriptive tests, essay prompts, or PDF submissions.</p>
              </div>
              <button 
                onClick={() => {
                  setAssignmentForm({ title: '', description: '', dueDate: '', maxMarks: 100, submissionType: 'pdf' });
                  setShowAssignmentModal(true);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Assignment
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {assignments.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 md:col-span-2">
                  No assignments configured yet for this course.
                </div>
              ) : (
                assignments.map(a => (
                  <div key={a.id} className="bg-white p-6 rounded-3xl border border-slate-200 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex justify-between items-start gap-4">
                        <h4 className="font-bold text-xs text-slate-900 leading-tight">{a.title}</h4>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              setAssignmentForm(a);
                              setShowAssignmentModal(true);
                            }}
                            className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-655"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteAssignment(a.id)}
                            className="p-1.5 border border-red-100 rounded-lg hover:bg-red-50 text-red-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-[9px] text-amber-500 font-bold uppercase mt-1">Due: {a.dueDate || 'No Due Date'} &bull; Max Marks: {a.maxMarks}</p>
                      <p className="text-slate-600 text-xs mt-2 line-clamp-3">{a.description}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>

      {/* ── Quiz Modal ── */}
      {showQuizModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveQuiz} className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-sm text-slate-900">{quizForm.id ? 'Edit Quiz' : 'Add New Quiz'}</h3>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Quiz Title</label>
              <input 
                type="text" required value={quizForm.title} 
                onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Description</label>
              <textarea 
                rows={3} value={quizForm.description || ''} 
                onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Time Limit (mins)</label>
                <input 
                  type="number" required value={quizForm.timeLimitMins} 
                  onChange={(e) => setQuizForm({ ...quizForm, timeLimitMins: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Passing Score (%)</label>
                <input 
                  type="number" required value={quizForm.passingScore} 
                  onChange={(e) => setQuizForm({ ...quizForm, passingScore: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowQuizModal(false)} className="px-4 py-2 border rounded-xl text-xs font-semibold">Cancel</button>
              <button type="submit" className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold">Save Quiz</button>
            </div>
          </form>
        </div>
      )}

      {/* ── Question Modal ── */}
      {showQuestionModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleSaveQuestion} className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 p-6 space-y-4 my-8 shadow-xl">
            <h3 className="font-bold text-sm text-slate-900">{questionForm.id ? 'Edit Question' : 'Add Question'}</h3>
            
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Question Text</label>
              <textarea 
                rows={3} required value={questionForm.questionText} 
                onChange={(e) => setQuestionForm({ ...questionForm, questionText: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Option A</label>
                <input 
                  type="text" required value={questionForm.optionA} 
                  onChange={(e) => setQuestionForm({ ...questionForm, optionA: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Option B</label>
                <input 
                  type="text" required value={questionForm.optionB} 
                  onChange={(e) => setQuestionForm({ ...questionForm, optionB: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Option C</label>
                <input 
                  type="text" required value={questionForm.optionC} 
                  onChange={(e) => setQuestionForm({ ...questionForm, optionC: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Option D</label>
                <input 
                  type="text" required value={questionForm.optionD} 
                  onChange={(e) => setQuestionForm({ ...questionForm, optionD: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Correct Answer</label>
                <select 
                  value={questionForm.correctAnswer} 
                  onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white"
                >
                  <option value="A">Option A</option>
                  <option value="B">Option B</option>
                  <option value="C">Option C</option>
                  <option value="D">Option D</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Marks</label>
                <input 
                  type="number" step="0.1" required value={questionForm.marks} 
                  onChange={(e) => setQuestionForm({ ...questionForm, marks: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Neg. Marks</label>
                <input 
                  type="number" step="0.01" required value={questionForm.negativeMarks} 
                  onChange={(e) => setQuestionForm({ ...questionForm, negativeMarks: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Explanation (Optional)</label>
              <textarea 
                rows={2} value={questionForm.explanation || ''} 
                onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowQuestionModal(false)} className="px-4 py-2 border rounded-xl text-xs font-semibold">Cancel</button>
              <button type="submit" className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold">Save Question</button>
            </div>
          </form>
        </div>
      )}

      {/* ── Assignment Modal ── */}
      {showAssignmentModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveAssignment} className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-sm text-slate-900">{assignmentForm.id ? 'Edit Assignment' : 'Add Assignment'}</h3>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Assignment Title</label>
              <input 
                type="text" required value={assignmentForm.title} 
                onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Description / Instruction Prompt</label>
              <textarea 
                rows={4} required value={assignmentForm.description || ''} 
                onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Max Marks</label>
                <input 
                  type="number" required value={assignmentForm.maxMarks} 
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, maxMarks: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Due Date</label>
                <input 
                  type="text" placeholder="e.g. 15th July 2026" required value={assignmentForm.dueDate} 
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, dueDate: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAssignmentModal(false)} className="px-4 py-2 border rounded-xl text-xs font-semibold">Cancel</button>
              <button type="submit" className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold">Save Assignment</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
