'use client';

import { use, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  ChevronLeft, Plus, Trash2, Edit3, FileText, Play, FolderOpen, Save, 
  Check, User, Video, HelpCircle, BookOpen, Layers, Award, Sparkles, X, AlignLeft
} from 'lucide-react';
import MediaPicker from '@/components/MediaPicker';

interface Lesson {
  id: string;
  title: string;
  type: string;
  videoUrl?: string;
  duration: string;
  isFree?: boolean;
}

interface Section {
  id: string;
  title: string;
  lessons: Lesson[];
}

interface FacultyMember {
  id: string;
  name: string;
  role: string;
  experience: string;
  avatar: string;
  bio: string;
}

interface DemoLecture {
  title: string;
  teacher?: string;
  duration: string;
  url: string;
}

interface FaqItem {
  q: string;
  a: string;
}

interface SyllabusSubject {
  subject: string;
  topics: string[];
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
  const [activeTab, setActiveTab] = useState<'overview' | 'syllabus' | 'faculty' | 'demo' | 'faq' | 'quizzes' | 'assignments'>('overview');
  const [loading, setLoading] = useState(true);

  // Course metadata state
  const [courseData, setCourseData] = useState<any>({
    title: '',
    exam: 'BPSC',
    category: 'Prelims',
    description: '',
    overview: '',
    thumbnailUrl: '',
    fee: '0',
    originalPrice: '',
    discount: '',
    duration: '',
    schedule: '',
    isPublished: true,
    features: [] as string[],
    faculty: [] as FacultyMember[],
    demoLectures: [] as DemoLecture[],
    faq: [] as FaqItem[],
    syllabus: [] as SyllabusSubject[]
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Restore working tab on refresh and sync changes to URL & localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const urlTab = urlParams.get('tab') as any;
        const savedTab = localStorage.getItem(`course_editor_tab_${courseId}`) as any;
        const validTab = urlTab || savedTab;
        if (validTab && ['overview', 'syllabus', 'faculty', 'demo', 'faq', 'quizzes', 'assignments'].includes(validTab)) {
          setActiveTab(validTab);
        }
      } catch (_) {}
    }
  }, [courseId]);

  useEffect(() => {
    if (typeof window !== 'undefined' && activeTab) {
      try {
        localStorage.setItem(`course_editor_tab_${courseId}`, activeTab);
        const url = new URL(window.location.href);
        if (url.searchParams.get('tab') !== activeTab) {
          url.searchParams.set('tab', activeTab);
          window.history.replaceState(null, '', url.pathname + url.search);
        }
      } catch (_) {}
    }
  }, [activeTab, courseId]);

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

  const [showLessonModal, setShowLessonModal] = useState(false);
  const [lessonForm, setLessonForm] = useState({ id: '', sectionId: '', title: '', type: 'video', videoUrl: '', duration: '15 mins' });

  // Site Course Content Edit Modals
  const [showFacultyModal, setShowFacultyModal] = useState(false);
  const [facultyForm, setFacultyForm] = useState<FacultyMember>({ id: '', name: '', role: '', experience: '', avatar: '', bio: '' });
  
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoForm, setDemoForm] = useState<DemoLecture>({ title: '', teacher: '', duration: '15 mins', url: '' });

  const [showFaqModal, setShowFaqModal] = useState(false);
  const [faqForm, setFaqForm] = useState<{ index: number | null; q: string; a: string }>({ index: null, q: '', a: '' });

  const [showSyllabusSubjectModal, setShowSyllabusSubjectModal] = useState(false);
  const [syllabusSubjectForm, setSyllabusSubjectForm] = useState<{ index: number | null; subject: string; topicsStr: string }>({ index: null, subject: '', topicsStr: '' });

  const [newFeatureText, setNewFeatureText] = useState('');

  // Media picker target helper
  const [mediaPickerConfig, setMediaPickerConfig] = useState<{ isOpen: boolean; target: 'lesson' | 'faculty' | 'demo' | 'course_thumbnail' }>({ isOpen: false, target: 'lesson' });

  const fetchCourseDetails = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Get Course & Curriculum
      const curRes = await fetch(`${BACKEND_URL}/api/lms/courses/${courseId}/sections`);
      const curData = await curRes.json();
      if (curData.success && curData.data) {
        const c = curData.data.course || {};
        setCourseData({
          title: c.title || '',
          exam: c.exam || 'BPSC',
          category: c.category || 'Prelims',
          description: c.description || '',
          overview: c.overview || '',
          thumbnailUrl: c.thumbnailUrl || '',
          fee: c.fee !== undefined ? c.fee : '0',
          originalPrice: c.originalPrice || '',
          discount: c.discount || '',
          duration: c.duration || '',
          schedule: c.schedule || '',
          isPublished: c.isPublished !== false,
          features: Array.isArray(c.features) ? c.features : [],
          faculty: Array.isArray(c.faculty) ? c.faculty : [],
          demoLectures: Array.isArray(c.demoLectures) ? c.demoLectures : [],
          faq: Array.isArray(c.faq) ? c.faq : [],
          syllabus: Array.isArray(c.syllabus) ? c.syllabus : []
        });
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
  }, [courseId]);

  useEffect(() => {
    fetchCourseDetails();
  }, [fetchCourseDetails]);

  // Save whole Course Data parameters & tab contents to Backend DB
  const saveCourseDataToBackend = async (dataToSave?: any) => {
    setSavingSettings(true);
    const payload = dataToSave || courseData;
    try {
      const res = await fetch(`${BACKEND_URL}/api/lms/courses/${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert('Course content updated successfully!');
        fetchCourseDetails();
      } else {
        alert('Failed updating course. Check server logs.');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to backend server.');
    } finally {
      setSavingSettings(false);
    }
  };

  // ── Overview Tab Handlers ──
  const handleAddFeature = () => {
    if (!newFeatureText.trim()) return;
    const nextFeatures = [...(courseData.features || []), newFeatureText.trim()];
    const nextData = { ...courseData, features: nextFeatures };
    setCourseData(nextData);
    setNewFeatureText('');
    saveCourseDataToBackend(nextData);
  };

  const handleRemoveFeature = (idx: number) => {
    const nextFeatures = (courseData.features || []).filter((_: any, i: number) => i !== idx);
    const nextData = { ...courseData, features: nextFeatures };
    setCourseData(nextData);
    saveCourseDataToBackend(nextData);
  };

  // ── Faculty Tab Handlers ──
  const handleSaveFaculty = (e: React.FormEvent) => {
    e.preventDefault();
    const existing: FacultyMember[] = courseData.faculty || [];
    let updated: FacultyMember[] = [];
    if (facultyForm.id) {
      updated = existing.map(f => f.id === facultyForm.id ? facultyForm : f);
    } else {
      updated = [...existing, { ...facultyForm, id: `fac-${Date.now()}` }];
    }
    const nextData = { ...courseData, faculty: updated };
    setCourseData(nextData);
    setShowFacultyModal(false);
    saveCourseDataToBackend(nextData);
  };

  const handleDeleteFaculty = (id: string) => {
    if (!window.confirm('Remove this faculty member from the course?')) return;
    const updated = (courseData.faculty || []).filter((f: FacultyMember) => f.id !== id);
    const nextData = { ...courseData, faculty: updated };
    setCourseData(nextData);
    saveCourseDataToBackend(nextData);
  };

  // ── Demo Lectures Tab Handlers ──
  const handleSaveDemo = (e: React.FormEvent) => {
    e.preventDefault();
    const existing: DemoLecture[] = courseData.demoLectures || [];
    const updated = [...existing, demoForm];
    const nextData = { ...courseData, demoLectures: updated };
    setCourseData(nextData);
    setShowDemoModal(false);
    saveCourseDataToBackend(nextData);
  };

  const handleDeleteDemo = (idx: number) => {
    if (!window.confirm('Delete this demo lecture?')) return;
    const updated = (courseData.demoLectures || []).filter((_: any, i: number) => i !== idx);
    const nextData = { ...courseData, demoLectures: updated };
    setCourseData(nextData);
    saveCourseDataToBackend(nextData);
  };

  // ── FAQ Tab Handlers ──
  const handleSaveFaq = (e: React.FormEvent) => {
    e.preventDefault();
    const existing: FaqItem[] = courseData.faq || [];
    let updated: FaqItem[] = [];
    if (faqForm.index !== null) {
      updated = existing.map((item, i) => i === faqForm.index ? { q: faqForm.q, a: faqForm.a } : item);
    } else {
      updated = [...existing, { q: faqForm.q, a: faqForm.a }];
    }
    const nextData = { ...courseData, faq: updated };
    setCourseData(nextData);
    setShowFaqModal(false);
    saveCourseDataToBackend(nextData);
  };

  const handleDeleteFaq = (idx: number) => {
    if (!window.confirm('Delete this FAQ?')) return;
    const updated = (courseData.faq || []).filter((_: any, i: number) => i !== idx);
    const nextData = { ...courseData, faq: updated };
    setCourseData(nextData);
    saveCourseDataToBackend(nextData);
  };

  // ── Syllabus Subject/Topic Breakdown Handlers ──
  const handleSaveSyllabusSubject = (e: React.FormEvent) => {
    e.preventDefault();
    const topics = syllabusSubjectForm.topicsStr.split('\n').map(t => t.trim()).filter(Boolean);
    const existing: SyllabusSubject[] = courseData.syllabus || [];
    let updated: SyllabusSubject[] = [];
    if (syllabusSubjectForm.index !== null) {
      updated = existing.map((item, i) => i === syllabusSubjectForm.index ? { subject: syllabusSubjectForm.subject, topics } : item);
    } else {
      updated = [...existing, { subject: syllabusSubjectForm.subject, topics }];
    }
    const nextData = { ...courseData, syllabus: updated };
    setCourseData(nextData);
    setShowSyllabusSubjectModal(false);
    saveCourseDataToBackend(nextData);
  };

  const handleDeleteSyllabusSubject = (idx: number) => {
    if (!window.confirm('Delete this syllabus subject?')) return;
    const updated = (courseData.syllabus || []).filter((_: any, i: number) => i !== idx);
    const nextData = { ...courseData, syllabus: updated };
    setCourseData(nextData);
    saveCourseDataToBackend(nextData);
  };

  // ── Section CRUD ──
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

  // ── Lesson CRUD ──
  const handleAddLesson = (sectionId: string) => {
    setLessonForm({ id: '', sectionId, title: '', type: 'video', videoUrl: '', duration: '15 mins' });
    setShowLessonModal(true);
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = lessonForm.id ? 'PUT' : 'POST';
      const endpoint = lessonForm.id 
        ? `${BACKEND_URL}/api/lms/lessons/${lessonForm.id}` 
        : `${BACKEND_URL}/api/lms/sections/${lessonForm.sectionId}/lessons`;

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          title: lessonForm.title,
          type: lessonForm.type,
          videoUrl: lessonForm.videoUrl,
          duration: lessonForm.duration
        })
      });
      if (res.ok) {
        setShowLessonModal(false);
        fetchCourseDetails();
      }
    } catch (err) { console.error(err); }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!window.confirm('Delete this lecture lesson?')) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/lms/lessons/${lessonId}`, { method: 'DELETE' });
      if (res.ok) fetchCourseDetails();
    } catch (err) { console.error(err); }
  };

  // ── Quiz CRUD ──
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

  // ── Question CRUD ──
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

  // ── Assignment CRUD ──
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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors">
              <ChevronLeft className="w-4 h-4 text-slate-700" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-amber-500 font-extrabold uppercase tracking-wider">Admin CMS &bull; Course Content Editor</span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                  courseData.isPublished ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-600 border border-slate-300'
                }`}>
                  {courseData.isPublished ? 'Published' : 'Draft / Hidden'}
                </span>
              </div>
              <h1 className="text-xl font-black text-slate-950 mt-0.5">{courseData.title || 'Course Details'}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={savingSettings}
              onClick={() => saveCourseDataToBackend()}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 text-xs font-black uppercase tracking-wider rounded-2xl cursor-pointer shadow-xs transition-all flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingSettings ? 'Saving...' : 'Save All Changes'}</span>
            </button>
            <button
              type="button"
              onClick={async () => {
                const nextStatus = !courseData.isPublished;
                const nextData = { ...courseData, isPublished: nextStatus };
                setCourseData(nextData);
                await saveCourseDataToBackend(nextData);
              }}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-xs transition-all ${
                courseData.isPublished
                  ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white'
              }`}
            >
              {courseData.isPublished ? '⏸ Unpublish' : '🚀 Publish Live'}
            </button>
          </div>
        </div>

        {/* Navigation Tabs mirroring site course content sections */}
        <div className="flex border-b border-slate-200 overflow-x-auto gap-1 bg-white p-1 rounded-2xl border">
          {[
            { id: 'overview', label: '📌 Overview', desc: 'Summary & Key Features' },
            { id: 'syllabus', label: '📄 Syllabus', desc: 'Curriculum Chapters & Subjects' },
            { id: 'faculty', label: '👨‍🏫 Faculty', desc: 'Mentors & Faculty Board' },
            { id: 'demo', label: '🎥 Demo', desc: 'Free Demo Video Lectures' },
            { id: 'faq', label: '❓ FAQ', desc: 'Questions & Answers' },
            { id: 'quizzes', label: '📝 Quizzes', desc: 'MCQ Practice Tests' },
            { id: 'assignments', label: '📥 Assignments', desc: 'Mains Descriptive Tests' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-5 py-3 rounded-xl transition-all text-left whitespace-nowrap ${
                activeTab === t.id 
                  ? 'bg-slate-900 text-white shadow-xs font-bold' 
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-semibold'
              }`}
            >
              <div className="text-xs">{t.label}</div>
              <div className={`text-[9px] opacity-70 ${activeTab === t.id ? 'text-slate-200' : 'text-slate-400'}`}>{t.desc}</div>
            </button>
          ))}
        </div>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* ── TAB 1: OVERVIEW ── */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* Header Parameters Form */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex justify-between items-center border-b pb-4">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-950">Basic Program Parameters</h3>
                  <p className="text-[10px] text-slate-500">Target Exam, Pricing, Schedule & Duration details.</p>
                </div>
                <button
                  type="button"
                  onClick={() => saveCourseDataToBackend()}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" /> Save Overview
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase">Course Program Title</label>
                  <input
                    type="text"
                    value={courseData.title || ''}
                    onChange={(e) => setCourseData({ ...courseData, title: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none text-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase">Target Exam State</label>
                  <select
                    value={courseData.exam || 'BPSC'}
                    onChange={(e) => setCourseData({ ...courseData, exam: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none text-slate-900"
                  >
                    <option value="BPSC">BPSC (Bihar PCS)</option>
                    <option value="Arunachal PCS">Arunachal PCS (APPSC)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase">Stage Category Filter</label>
                  <select
                    value={courseData.category || 'Prelims'}
                    onChange={(e) => setCourseData({ ...courseData, category: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none text-slate-900"
                  >
                    <option value="Prelims">Prelims</option>
                    <option value="Mains">Mains</option>
                    <option value="Interview">Interview</option>
                    <option value="Foundation">Foundation</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase">Offer Price (₹ INR)</label>
                  <input
                    type="text"
                    value={courseData.fee || ''}
                    placeholder="e.g. ₹400 or ₹4,999"
                    onChange={(e) => setCourseData({ ...courseData, fee: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none text-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase">Original Price (₹ MRP)</label>
                  <input
                    type="text"
                    value={courseData.originalPrice || ''}
                    placeholder="e.g. ₹1,000"
                    onChange={(e) => setCourseData({ ...courseData, originalPrice: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none text-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase">Discount Tag Badge</label>
                  <input
                    type="text"
                    value={courseData.discount || ''}
                    placeholder="e.g. 60% OFF"
                    onChange={(e) => setCourseData({ ...courseData, discount: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none text-emerald-700"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase">Duration</label>
                  <input
                    type="text"
                    value={courseData.duration || ''}
                    placeholder="e.g. 6 Months"
                    onChange={(e) => setCourseData({ ...courseData, duration: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none text-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase">Schedule / Format</label>
                  <input
                    type="text"
                    value={courseData.schedule || ''}
                    placeholder="e.g. Hybrid (Patna + Online)"
                    onChange={(e) => setCourseData({ ...courseData, schedule: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none text-slate-900"
                  />
                </div>
              </div>

              {/* Course Thumbnail Cover Image */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase block">Course Cover / Thumbnail Image</label>
                    <span className="text-[10px] text-slate-400">Main header image displayed on courses page & course cards.</span>
                  </div>
                  {courseData.thumbnailUrl && (
                    <button
                      type="button"
                      onClick={() => setCourseData({ ...courseData, thumbnailUrl: '' })}
                      className="text-[10px] font-bold text-red-500 hover:underline cursor-pointer"
                    >
                      Remove Image
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  <div className="sm:col-span-8 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={courseData.thumbnailUrl || ''}
                        placeholder="https://example.com/course-banner.jpg or select from DAM below"
                        onChange={(e) => setCourseData({ ...courseData, thumbnailUrl: e.target.value })}
                        className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 outline-none focus:border-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => setMediaPickerConfig({ isOpen: true, target: 'course_thumbnail' })}
                        className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 shrink-0 transition-colors shadow-xs"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span>Select from DAM</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Or Upload File:</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const formData = new FormData();
                          formData.append('file', file);
                          try {
                            const res = await fetch(`${BACKEND_URL}/api/uploads`, {
                              method: 'POST',
                              body: formData
                            });
                            const data = await res.json();
                            if (data && data.url) {
                              setCourseData((prev: any) => ({ ...prev, thumbnailUrl: data.url }));
                              alert('Course image uploaded successfully!');
                            } else {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                if (ev.target?.result) {
                                  setCourseData((prev: any) => ({ ...prev, thumbnailUrl: ev.target?.result as string }));
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          } catch (_) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              if (ev.target?.result) {
                                setCourseData((prev: any) => ({ ...prev, thumbnailUrl: ev.target?.result as string }));
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-extrabold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-600 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Thumbnail Card Live Preview */}
                  <div className="sm:col-span-4 flex flex-col items-center">
                    <div className="w-full h-28 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden relative flex items-center justify-center shadow-xs">
                      {courseData.thumbnailUrl ? (
                        <img
                          src={courseData.thumbnailUrl}
                          alt="Course Banner Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="text-center p-3">
                          <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                          <span className="text-[10px] text-slate-400 font-bold block">No Cover Image</span>
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] text-slate-400 font-bold mt-1">Live Card Banner Preview</span>
                  </div>
                </div>
              </div>

              {/* Descriptions & Overview text */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase">Short Subtitle Description</label>
                  <input
                    type="text"
                    value={courseData.description || ''}
                    placeholder="Short course card subtitle..."
                    onChange={(e) => setCourseData({ ...courseData, description: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none text-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase">Full Program Overview Notes (Displayed under Overview Tab)</label>
                  <textarea
                    rows={4}
                    value={courseData.overview || ''}
                    placeholder="Detailed explanation of program objectives, mentorship approach, study materials provided..."
                    onChange={(e) => setCourseData({ ...courseData, overview: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none text-slate-900 leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* Features Bullet Points List Editor */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-950">Program Key Features (Checklist Items)</h3>
                  <p className="text-[10px] text-slate-500">Highlights displayed with checkmarks on the course overview page.</p>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newFeatureText}
                  onChange={(e) => setNewFeatureText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddFeature(); }}
                  placeholder="e.g. Full Access to mock tests and video recordings"
                  className="flex-grow px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none text-slate-900"
                />
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shrink-0 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Feature
                </button>
              </div>

              <div className="space-y-2">
                {(!courseData.features || courseData.features.length === 0) ? (
                  <p className="text-xs text-slate-400 italic py-2">No custom feature bullet points added yet.</p>
                ) : (
                  courseData.features.map((feat: string, idx: number) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="flex items-center gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3" />
                        </div>
                        <span className="text-xs font-semibold text-slate-800">{feat}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(idx)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* ── TAB 2: SYLLABUS ── */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeTab === 'syllabus' && (
          <div className="space-y-8">
            
            {/* Chapters & Video Lectures Builder */}
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
                <div>
                  <h3 className="font-bold text-sm text-slate-950">Curriculum Outline (Chapters & Lectures)</h3>
                  <p className="text-[10px] text-slate-500">Organize video lectures, notes, and study modules into chapters.</p>
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
                    No chapters created yet. Click &ldquo;Add Chapter&rdquo; to build your curriculum.
                  </div>
                ) : (
                  sections.map((sec, sIdx) => (
                    <div key={sec.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
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

                      <div className="p-4 divide-y divide-slate-100">
                        {(!sec.lessons || sec.lessons.length === 0) ? (
                          <div className="text-center py-6 text-slate-400 text-xs italic">
                            No lecture contents inside this chapter.
                          </div>
                        ) : (
                          sec.lessons.map(les => {
                            const isVideo = les.type !== 'pdf' && les.type !== 'resource';
                            return (
                              <div key={les.id} className="py-3 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                                    isVideo ? 'bg-amber-500/10 text-amber-600' : 'bg-blue-500/10 text-blue-600'
                                  }`}>
                                    {isVideo ? <Play className="w-3.5 h-3.5 fill-current" /> : <FileText className="w-3.5 h-3.5" />}
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold text-slate-800">{les.title}</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">{les.duration} &bull; <span className="uppercase text-[9px] font-bold text-slate-450">{les.type || 'video'}</span></p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => {
                                      setLessonForm({
                                        id: les.id,
                                        sectionId: sec.id,
                                        title: les.title,
                                        type: les.type || 'video',
                                        videoUrl: les.videoUrl || '',
                                        duration: les.duration || '15 mins'
                                      });
                                      setShowLessonModal(true);
                                    }}
                                    className="p-1.5 border border-slate-200 bg-white rounded-lg text-slate-550 hover:bg-slate-100 transition-colors"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteLesson(les.id)}
                                    className="p-1.5 border border-slate-200 bg-white rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Subject & Topics Structured Breakdown Builder */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-950">Subject & Micro-Topic Syllabus Breakdown</h3>
                  <p className="text-[10px] text-slate-500">Structured subjects and key topics listed on the Syllabus tab.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSyllabusSubjectForm({ index: null, subject: '', topicsStr: '' });
                    setShowSyllabusSubjectModal(true);
                  }}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Subject Group
                </button>
              </div>

              <div className="space-y-4">
                {(!courseData.syllabus || courseData.syllabus.length === 0) ? (
                  <p className="text-xs text-slate-400 italic py-2">No subject breakdown added yet.</p>
                ) : (
                  courseData.syllabus.map((item: any, idx: number) => {
                    const isObj = typeof item === 'object' && item !== null;
                    const subjectName = isObj ? item.subject : `Module ${idx + 1}`;
                    const topicsList = isObj ? (item.topics || []) : [String(item)];
                    return (
                      <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                        <div className="flex justify-between items-center">
                          <h5 className="font-extrabold text-xs text-slate-900">{subjectName}</h5>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSyllabusSubjectForm({
                                  index: idx,
                                  subject: subjectName,
                                  topicsStr: Array.isArray(topicsList) ? topicsList.join('\n') : String(topicsList)
                                });
                                setShowSyllabusSubjectModal(true);
                              }}
                              className="p-1 text-slate-600 hover:bg-slate-200 rounded"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSyllabusSubject(idx)}
                              className="p-1 text-red-500 hover:bg-red-100 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {topicsList.map((t: string, tIdx: number) => (
                            <span key={tIdx} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 text-[10px] font-semibold rounded-lg">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* ── TAB 3: FACULTY ── */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeTab === 'faculty' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-sm text-slate-950">Faculty & Mentorship Board</h3>
                <p className="text-[10px] text-slate-500">Assign course instructors, subject experts, and mentors.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFacultyForm({ id: '', name: '', role: 'Senior GS Mentor', experience: '8+ Yrs', avatar: '', bio: '' });
                  setShowFacultyModal(true);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add Faculty Member
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(!courseData.faculty || courseData.faculty.length === 0) ? (
                <div className="col-span-2 bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400">
                  No faculty members assigned to this course yet.
                </div>
              ) : (
                courseData.faculty.map((member: FacultyMember) => (
                  <div key={member.id} className="bg-white p-5 rounded-3xl border border-slate-200 flex gap-4 items-start shadow-xs">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                      <img src={member.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'} alt={member.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-grow space-y-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-900">{member.name}</h4>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{member.role} &bull; {member.experience} exp</p>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setFacultyForm(member);
                              setShowFacultyModal(true);
                            }}
                            className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteFaculty(member.id)}
                            className="p-1.5 border border-red-100 rounded-lg hover:bg-red-50 text-red-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mt-1">{member.bio}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* ── TAB 4: DEMO ── */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeTab === 'demo' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-sm text-slate-950">Free Demo Video Lectures</h3>
                <p className="text-[10px] text-slate-500">Lectures accessible freely on the course detail page.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDemoForm({ title: '', teacher: '', duration: '20 mins', url: '' });
                  setShowDemoModal(true);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add Demo Lecture
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(!courseData.demoLectures || courseData.demoLectures.length === 0) ? (
                <div className="col-span-2 bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400">
                  No demo lectures configured for this course yet.
                </div>
              ) : (
                courseData.demoLectures.map((lec: DemoLecture, idx: number) => (
                  <div key={idx} className="bg-white p-5 rounded-3xl border border-slate-200 flex justify-between items-center shadow-xs">
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-xs text-slate-900">{lec.title}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold">{lec.teacher ? `By ${lec.teacher} • ` : ''}{lec.duration || '15 mins'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={lec.url}
                        target="_blank"
                        rel="noreferrer"
                        className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs hover:bg-blue-700"
                      >
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDeleteDemo(idx)}
                        className="p-1.5 border border-red-100 rounded-lg hover:bg-red-50 text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* ── TAB 5: FAQ ── */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeTab === 'faq' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-sm text-slate-950">Course FAQs (Frequently Asked Questions)</h3>
                <p className="text-[10px] text-slate-500">Questions and answers displayed on the FAQ tab.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFaqForm({ index: null, q: '', a: '' });
                  setShowFaqModal(true);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add FAQ Item
              </button>
            </div>

            <div className="space-y-4 max-w-4xl">
              {(!courseData.faq || courseData.faq.length === 0) ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400">
                  No FAQs added for this course yet.
                </div>
              ) : (
                courseData.faq.map((item: FaqItem, idx: number) => (
                  <div key={idx} className="bg-white p-5 rounded-3xl border border-slate-200 space-y-2 shadow-xs">
                    <div className="flex justify-between items-start gap-4">
                      <h4 className="font-extrabold text-xs text-slate-900">Q: {item.q}</h4>
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setFaqForm({ index: idx, q: item.q, a: item.a });
                            setShowFaqModal(true);
                          }}
                          className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteFaq(idx)}
                          className="p-1.5 border border-red-100 rounded-lg hover:bg-red-50 text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {item.a}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* ── TAB 6: QUIZZES ── */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeTab === 'quizzes' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                            className="p-1 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-650"
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

            <div className="lg:col-span-2 space-y-4">
              {selectedQuiz ? (
                <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-6">
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

                  <div className="space-y-4">
                    {questions.length === 0 ? (
                      <p className="text-center py-10 text-slate-400 text-xs italic">
                        This quiz has no questions yet. Click &ldquo;Add Question&rdquo; to begin.
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
                                className="p-1 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-650"
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
                                {q[`option${opt as 'A' | 'B' | 'C' | 'D'}`]}
                              </div>
                            ))}
                          </div>
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

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* ── TAB 7: ASSIGNMENTS ── */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeTab === 'assignments' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-3xl border border-slate-200">
              <div>
                <h3 className="font-bold text-sm text-slate-950">Assignments & Mains Tests</h3>
                <p className="text-[10px] text-slate-500">Configure descriptive tests, answer copy evaluations, or essay prompts.</p>
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
                  <div key={a.id} className="bg-white p-6 rounded-3xl border border-slate-200 flex flex-col justify-between space-y-4 shadow-xs">
                    <div>
                      <div className="flex justify-between items-start gap-4">
                        <h4 className="font-bold text-xs text-slate-900 leading-tight">{a.title}</h4>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              setAssignmentForm(a);
                              setShowAssignmentModal(true);
                            }}
                            className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-650"
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

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ── MODALS ── */}
      {/* ─────────────────────────────────────────────────────────────────── */}

      {/* ── Faculty Modal ── */}
      {showFacultyModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveFaculty} className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-sm text-slate-900">{facultyForm.id ? 'Edit Faculty Member' : 'Add Faculty Member'}</h3>
              <button type="button" onClick={() => setShowFacultyModal(false)} className="text-slate-400 hover:text-slate-950">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Faculty Full Name</label>
              <input 
                type="text" required value={facultyForm.name} 
                onChange={(e) => setFacultyForm({ ...facultyForm, name: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none"
                placeholder="e.g. Dr. Mahendra Kumar"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Role / Designation</label>
                <input 
                  type="text" required value={facultyForm.role} 
                  onChange={(e) => setFacultyForm({ ...facultyForm, role: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none"
                  placeholder="e.g. Senior GS Mentor"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Experience</label>
                <input 
                  type="text" required value={facultyForm.experience} 
                  onChange={(e) => setFacultyForm({ ...facultyForm, experience: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none"
                  placeholder="e.g. 10+ Yrs"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Avatar / Photo URL</label>
              <div className="flex gap-2">
                <input 
                  type="text" value={facultyForm.avatar} 
                  onChange={(e) => setFacultyForm({ ...facultyForm, avatar: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none"
                  placeholder="https://..."
                />
                <button
                  type="button"
                  onClick={() => setMediaPickerConfig({ isOpen: true, target: 'faculty' })}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shrink-0"
                >
                  Pick
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Faculty Bio / Summary</label>
              <textarea 
                rows={3} value={facultyForm.bio} 
                onChange={(e) => setFacultyForm({ ...facultyForm, bio: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none"
                placeholder="Ex-Civil Servant & Mentor for GS Mains..."
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button type="button" onClick={() => setShowFacultyModal(false)} className="px-4 py-2 border rounded-xl text-xs font-semibold">Cancel</button>
              <button type="submit" className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold">Save Member</button>
            </div>
          </form>
        </div>
      )}

      {/* ── Demo Lecture Modal ── */}
      {showDemoModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveDemo} className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-sm text-slate-900">Add Demo Lecture Video</h3>
              <button type="button" onClick={() => setShowDemoModal(false)} className="text-slate-400 hover:text-slate-950">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Demo Title</label>
              <input 
                type="text" required value={demoForm.title} 
                onChange={(e) => setDemoForm({ ...demoForm, title: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none"
                placeholder="e.g. Overview of BPSC Prelims Strategy"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Instructor Name</label>
                <input 
                  type="text" value={demoForm.teacher || ''} 
                  onChange={(e) => setDemoForm({ ...demoForm, teacher: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none"
                  placeholder="e.g. Dr. Mahendra Kumar"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Duration</label>
                <input 
                  type="text" required value={demoForm.duration} 
                  onChange={(e) => setDemoForm({ ...demoForm, duration: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none"
                  placeholder="e.g. 20 mins"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Video URL / YouTube Embed</label>
              <div className="flex gap-2">
                <input 
                  type="text" required value={demoForm.url} 
                  onChange={(e) => setDemoForm({ ...demoForm, url: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none"
                  placeholder="https://youtu.be/... or video URL"
                />
                <button
                  type="button"
                  onClick={() => setMediaPickerConfig({ isOpen: true, target: 'demo' })}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shrink-0"
                >
                  Pick
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button type="button" onClick={() => setShowDemoModal(false)} className="px-4 py-2 border rounded-xl text-xs font-semibold">Cancel</button>
              <button type="submit" className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold">Save Demo Lecture</button>
            </div>
          </form>
        </div>
      )}

      {/* ── FAQ Modal ── */}
      {showFaqModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveFaq} className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-sm text-slate-900">{faqForm.index !== null ? 'Edit FAQ' : 'Add FAQ Item'}</h3>
              <button type="button" onClick={() => setShowFaqModal(false)} className="text-slate-400 hover:text-slate-950">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Question (Q)</label>
              <input 
                type="text" required value={faqForm.q} 
                onChange={(e) => setFaqForm({ ...faqForm, q: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none"
                placeholder="e.g. Is this course available in offline mode?"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Answer (A)</label>
              <textarea 
                rows={4} required value={faqForm.a} 
                onChange={(e) => setFaqForm({ ...faqForm, a: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none"
                placeholder="Detailed answer explanation..."
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button type="button" onClick={() => setShowFaqModal(false)} className="px-4 py-2 border rounded-xl text-xs font-semibold">Cancel</button>
              <button type="submit" className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold">Save FAQ Item</button>
            </div>
          </form>
        </div>
      )}

      {/* ── Syllabus Subject Modal ── */}
      {showSyllabusSubjectModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveSyllabusSubject} className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-sm text-slate-900">{syllabusSubjectForm.index !== null ? 'Edit Subject Group' : 'Add Subject Group'}</h3>
              <button type="button" onClick={() => setShowSyllabusSubjectModal(false)} className="text-slate-400 hover:text-slate-950">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Subject Name</label>
              <input 
                type="text" required value={syllabusSubjectForm.subject} 
                onChange={(e) => setSyllabusSubjectForm({ ...syllabusSubjectForm, subject: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none"
                placeholder="e.g. General Studies Paper I & Bihar Special"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Topics List (One topic per line)</label>
              <textarea 
                rows={5} required value={syllabusSubjectForm.topicsStr} 
                onChange={(e) => setSyllabusSubjectForm({ ...syllabusSubjectForm, topicsStr: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none"
                placeholder="History of Bihar&#10;Geography & Environment&#10;Polity & Economy"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button type="button" onClick={() => setShowSyllabusSubjectModal(false)} className="px-4 py-2 border rounded-xl text-xs font-semibold">Cancel</button>
              <button type="submit" className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold">Save Subject</button>
            </div>
          </form>
        </div>
      )}

      {/* ── Quiz Modal ── */}
      {showQuizModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
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
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
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
                  onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: e.target.value as 'A' | 'B' | 'C' | 'D' })}
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
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
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

      {/* ── Lesson Modal ── */}
      {showLessonModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveLesson} className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-sm text-slate-900">{lessonForm.id ? 'Edit Course Lesson / Lecture' : 'Add Course Lesson / Lecture'}</h3>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Lesson Title</label>
              <input 
                type="text" required value={lessonForm.title} 
                onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none text-slate-900 bg-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Content Type</label>
                <select 
                  value={lessonForm.type} 
                  onChange={(e) => setLessonForm({ ...lessonForm, type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white text-slate-900"
                >
                  <option value="video">Video Lecture</option>
                  <option value="pdf">PDF Document / Notes</option>
                  <option value="resource">Study Resource / Link</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Duration / Size</label>
                <input 
                  type="text" required value={lessonForm.duration} 
                  onChange={(e) => setLessonForm({ ...lessonForm, duration: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none text-slate-900 bg-white"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase">File Link / Video or Document URL</label>
              <input 
                type="text" required value={lessonForm.videoUrl} 
                onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                placeholder="https://... or paste Youtube link"
                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none text-slate-900 bg-white"
              />
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Local Media Storage</span>
                <span className="text-[10px] text-slate-400">Choose lectures or reading materials from Media Library</span>
              </div>
              <button
                type="button"
                onClick={() => setMediaPickerConfig({ isOpen: true, target: 'lesson' })}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 transition-colors"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                Select File
              </button>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowLessonModal(false)} className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-700">Cancel</button>
              <button type="submit" className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold">Save Lesson</button>
            </div>
          </form>
        </div>
      )}

      {/* Media Picker Modal */}
      {mediaPickerConfig.isOpen && (
        <MediaPicker
          onSelect={(url) => {
            if (mediaPickerConfig.target === 'lesson') {
              setLessonForm(prev => ({ ...prev, videoUrl: url }));
            } else if (mediaPickerConfig.target === 'faculty') {
              setFacultyForm(prev => ({ ...prev, avatar: url }));
            } else if (mediaPickerConfig.target === 'demo') {
              setDemoForm(prev => ({ ...prev, url: url }));
            } else if (mediaPickerConfig.target === 'course_thumbnail') {
              setCourseData((prev: any) => ({ ...prev, thumbnailUrl: url }));
            }
            setMediaPickerConfig({ isOpen: false, target: 'lesson' });
          }}
          onClose={() => setMediaPickerConfig({ isOpen: false, target: 'lesson' })}
        />
      )}

    </div>
  );
}
