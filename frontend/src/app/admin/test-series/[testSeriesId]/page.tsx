'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Layers, Users, Plus, Edit3, Trash2, X, Eye, 
  Sparkles, AlertCircle, Sun, Moon, Search
} from 'lucide-react';
import { db, TestSeriesItem } from '@/services/db';
import { useTheme } from '@/context/ThemeContext';
import TestSeriesAdmin from '@/components/admin/TestSeriesAdmin';

interface QuizItem {
  id: string;
  title: string;
  description?: string;
  timeLimitMins?: number;
  passingScore?: number;
  isPublished?: boolean;
  questionCount?: number;
  sequence_number?: number;
}

interface StudentItem {
  enrollmentId: string;
  userId: string;
  fullName: string;
  email: string;
  mobile?: string;
  state?: string;
  district?: string;
  paymentOrderId?: string;
  paymentStatus: string;
  amountPaid: number;
  enrolledAt: string;
  totalAttempts?: number;
  latestScore?: number;
}

export default function TestSeriesDetailPage() {
  const { theme, toggleTheme } = useTheme();
  const params = useParams();
  const testSeriesId = params.testSeriesId as string;

  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'pricing' | 'quizzes' | 'students' | 'settings'>('overview');
  const [series, setSeries] = useState<TestSeriesItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Quizzes tab states
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);

  // Plans & Commercial Pricing tab states (Phase 5)
  const [plans, setPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [savingPlan, setSavingPlan] = useState(false);
  const [planFormError, setPlanFormError] = useState<string | null>(null);

  // Load Plans for Commercial Tab
  const loadPlans = useCallback(async () => {
    if (!testSeriesId) return;
    setLoadingPlans(true);
    try {
      const planList = await db.getTestSeriesPurchasePlans(testSeriesId);
      setPlans(planList || []);
    } catch (e) {
      console.error('Error loading plans:', e);
    } finally {
      setLoadingPlans(false);
    }
  }, [testSeriesId]);

  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const [quizForm, setQuizForm] = useState({
    title: '',
    description: '',
    timeLimitMins: 60,
    passingScore: 40,
    isPublished: true,
    setMode: 'single' as 'single' | 'multi',
    defaultSet: 'SET-A',
    availableSets: ['SET-A', 'SET-B', 'SET-C', 'SET-D']
  });

  // Students tab performance inspector states
  const [selectedStudentStats, setSelectedStudentStats] = useState<{ student: StudentItem; attempts: any[] } | null>(null);
  const [loadingStudentAttempts, setLoadingStudentAttempts] = useState(false);
  const [expandedAttemptId, setExpandedAttemptId] = useState<string | null>(null);

  // Students tab states & filter states
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [studentSearchText, setStudentSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Filtering student list states
  const [filterEmail, setFilterEmail] = useState('');
  const [filterState, setFilterState] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');

  // Edit student profile modal states
  const [editingStudentInfo, setEditingStudentInfo] = useState<StudentItem | null>(null);
  const [studentEditForm, setStudentEditForm] = useState({
    fullName: '',
    email: '',
    mobile: '',
    state: '',
    district: ''
  });
  const [savingStudentInfo, setSavingStudentInfo] = useState(false);

  const handleOpenEditStudentModal = (st: StudentItem) => {
    setEditingStudentInfo(st);
    setStudentEditForm({
      fullName: st.fullName || '',
      email: st.email || '',
      mobile: st.mobile || '',
      state: st.state || '',
      district: st.district || ''
    });
  };

  const handleSaveStudentInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudentInfo) return;
    try {
      setSavingStudentInfo(true);
      await db.updateStudentProfile(editingStudentInfo.userId, studentEditForm);

      // Update student table state immediately
      setStudents(prev => prev.map(s => {
        if (s.userId === editingStudentInfo.userId) {
          return {
            ...s,
            fullName: studentEditForm.fullName,
            email: studentEditForm.email,
            mobile: studentEditForm.mobile,
            state: studentEditForm.state,
            district: studentEditForm.district
          };
        }
        return s;
      }));

      alert('✓ Student information updated successfully!');
      setEditingStudentInfo(null);
    } catch (err: any) {
      alert('Error updating student information: ' + (err.message || err));
    } finally {
      setSavingStudentInfo(false);
    }
  };

  // Load Test Series details
  const loadData = useCallback(async () => {
    if (!testSeriesId) return;
    setLoading(true);
    try {
      let found = await db.getTestSeriesById(testSeriesId);
      if (!found) {
        const all = await db.getTestSeries(true);
        found = all.find(s => s.id === testSeriesId || s.slug === testSeriesId) || null;
      }
      if (found) {
        setSeries(found);
      }
    } catch (e) {
      console.error('Error loading Test Series details:', e);
    } finally {
      setLoading(false);
    }
  }, [testSeriesId]);

  // Load Quizzes for this Test Series
  const loadQuizzes = useCallback(async () => {
    if (!testSeriesId) return;
    setLoadingQuizzes(true);
    try {
      const all = await db.getTestSeries(true);
      const found = all.find(s => s.id === testSeriesId || s.slug === testSeriesId);
      const targetId = found ? found.id : testSeriesId;
      const list = await db.getTestSeriesQuizzes(targetId);
      setQuizzes(list || []);
    } catch (e) {
      console.error('Error loading quizzes:', e);
    } finally {
      setLoadingQuizzes(false);
    }
  }, [testSeriesId]);

  // Load Students for this Test Series
  const loadStudents = useCallback(async () => {
    if (!testSeriesId) return;
    setLoadingStudents(true);
    try {
      const list = await db.getTestSeriesEnrolledStudents(testSeriesId);
      setStudents(list || []);
    } catch (e) {
      console.error('Error loading enrolled students:', e);
    } finally {
      setLoadingStudents(false);
    }
  }, [testSeriesId]);

  useEffect(() => {
    loadData();
    loadQuizzes();
    loadStudents();
    loadPlans();
  }, [loadData, loadQuizzes, loadStudents, loadPlans]);

  // View detailed student performance & stats
  const handleViewStudentPerformance = async (student: StudentItem) => {
    setLoadingStudentAttempts(true);
    setSelectedStudentStats({ student, attempts: [] });
    try {
      const attempts = await db.getStudentQuizAttempts(student.userId);
      setSelectedStudentStats({ student, attempts: attempts || [] });
    } catch (e) {
      console.error('Error loading student attempts:', e);
    } finally {
      setLoadingStudentAttempts(false);
    }
  };

  // Save Edit Details
  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!series) return;
    setSaving(true);
    try {
      await db.saveTestSeries(series);
      alert('Test Series details updated successfully!');
    } catch (e) {
      alert('Failed saving Test Series details.');
    } finally {
      setSaving(false);
    }
  };

  // Create or Update Quiz automatically bound to this Test Series
  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizForm.title || !testSeriesId) return;
    try {
      const quizPayload = {
        id: editingQuizId || `quiz-${Date.now()}`,
        courseId: testSeriesId,
        title: quizForm.title,
        description: quizForm.description,
        timeLimitMins: Number(quizForm.timeLimitMins) || 60,
        passingScore: Number(quizForm.passingScore) || 40,
        isPublished: quizForm.isPublished !== false,
        setMode: quizForm.setMode || 'single',
        defaultSet: quizForm.defaultSet || 'SET-A',
        availableSets: quizForm.availableSets || ['SET-A', 'SET-B', 'SET-C', 'SET-D']
      };
      await db.saveQuiz(quizPayload);
      setIsQuizModalOpen(false);
      setEditingQuizId(null);
      setQuizForm({
        title: '',
        description: '',
        timeLimitMins: 60,
        passingScore: 40,
        isPublished: true,
        setMode: 'single',
        defaultSet: 'SET-A',
        availableSets: ['SET-A', 'SET-B', 'SET-C', 'SET-D']
      });
      loadQuizzes();
      alert(editingQuizId ? 'Quiz updated successfully!' : 'Quiz created and linked to this Test Series!');
    } catch (e) {
      alert('Failed saving quiz.');
    }
  };

  // Search Students to Add Manually
  const handleSearchStudents = async (val: string) => {
    setStudentSearchText(val);
    if (!val.trim()) { setSearchResults([]); return; }
    try {
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${BACKEND_URL}/api/auth/users`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.data || [];
      const query = val.toLowerCase().trim();
      const filtered = list.filter((u: any) => 
        (u.fullName && u.fullName.toLowerCase().includes(query)) || 
        (u.email && u.email.toLowerCase().includes(query)) ||
        (u.mobile && u.mobile.includes(query))
      );
      setSearchResults(filtered.slice(0, 10));
    } catch (e) {
      console.error('Error searching students:', e);
    }
  };

  // Add Student Manually to Test Series
  const handleAddStudent = async (userId: string) => {
    try {
      const ok = await db.addStudentToTestSeries(testSeriesId, userId);
      if (ok) {
        alert('Student successfully enrolled in Test Series!');
        setIsAddStudentModalOpen(false);
        setStudentSearchText('');
        setSearchResults([]);
        loadStudents();
      }
    } catch (e) {
      alert('Failed enrolling student.');
    }
  };

  // Remove / Deactivate Student Access
  const handleRemoveStudent = async (userId: string, name: string) => {
    if (!confirm(`Revoke access for student "${name}"? Attempts history will remain saved.`)) return;
    try {
      const ok = await db.removeStudentFromTestSeries(testSeriesId, userId);
      if (ok) {
        alert('Student access revoked.');
        loadStudents();
      }
    } catch (e) {
      alert('Failed revoking access.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-12">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!series) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold">Test Series Not Found</h2>
        <p className="text-xs text-slate-400 mt-1 mb-6">The requested Test Series ID does not exist in the database.</p>
        <Link href="/admin?tab=Test+Series" className="px-6 py-2.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs">
          Return to Admin Console
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-color)] text-[var(--text-color)] p-6 sm:p-10 space-y-8 font-sans transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[var(--card-border)] pb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin?tab=Test+Series"
            className="p-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-amber-500/50 rounded-2xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-[var(--text-color)]" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-[10px] uppercase rounded-md">
                {series.category} • {series.exam}
              </span>
              <button
                type="button"
                onClick={async () => {
                  if (!series) return;
                  const nextState = series.isPublished === false ? true : false;
                  const updated = { ...series, isPublished: nextState };
                  setSeries(updated);
                  await db.saveTestSeries(updated);
                }}
                className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-md border cursor-pointer transition-all flex items-center gap-1 ${
                  series.isPublished !== false
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 border-[var(--card-border)] text-slate-500 hover:bg-slate-200'
                }`}
                title="Click to toggle Live/Draft status of this Test Series"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${series.isPublished !== false ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                <span>{series.isPublished !== false ? 'Published' : 'Draft'}</span>
              </button>
            </div>
            <h1 className="text-2xl font-black text-[var(--text-color)] mt-1">{series.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-amber-500/50 rounded-2xl text-amber-600 dark:text-amber-400 transition-colors cursor-pointer flex items-center gap-2 text-xs font-bold shadow-xs"
            title="Toggle theme mode"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            <span className="hidden sm:inline">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          <a
            href={`/test-series/${series.slug}`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] hover:bg-slate-100 dark:hover:bg-slate-800 text-[var(--text-color)] font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Eye className="w-4 h-4" />
            <span>View Public Page ↗</span>
          </a>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex flex-wrap bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-[var(--card-border)] w-fit gap-1">
        {(['overview', 'details', 'pricing', 'quizzes', 'students', 'settings'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === tab
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-500 hover:text-[var(--text-color)]'
            }`}
          >
            {tab === 'pricing' ? 'Plans & Pricing' : tab} {tab === 'quizzes' ? `(${quizzes.length})` : tab === 'students' ? `(${students.length})` : ''}
          </button>
        ))}
      </div>

      {/* ── TAB 1: OVERVIEW ── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-6 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl space-y-1 shadow-xs">
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Total Quizzes</p>
              <p className="text-2xl font-black text-[var(--text-color)]">{quizzes.length}</p>
            </div>
            <div className="p-6 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl space-y-1 shadow-xs">
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Published Quizzes</p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{quizzes.filter(q => q.isPublished !== false).length}</p>
            </div>
            <div className="p-6 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl space-y-1 shadow-xs">
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Enrolled Students</p>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{students.length}</p>
            </div>
            <div className="p-6 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl space-y-1 shadow-xs">
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Price / Validity</p>
              <p className="text-xl font-black text-[var(--text-color)]">₹{series.discountedPrice || series.price} <span className="text-xs font-normal text-slate-400">({series.duration})</span></p>
            </div>
          </div>

          <div className="p-6 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl space-y-4 shadow-xs">
            <h3 className="font-bold text-sm text-[var(--text-color)] uppercase tracking-wider">Program Overview & Description</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{series.description || 'No description provided.'}</p>
          </div>
        </div>
      )}

      {/* ── TAB 2: DETAILS ── */}
      {activeTab === 'details' && (
        <form onSubmit={handleSaveDetails} className="p-8 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl space-y-6 max-w-3xl shadow-xs">
          <h3 className="font-bold text-sm text-[var(--text-color)] uppercase tracking-wider border-b border-[var(--card-border)] pb-3">Edit Program Details</h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400">Program Title</label>
              <input
                type="text"
                value={series.title || ''}
                onChange={e => {
                  const newTitle = e.target.value;
                  const examCode = (series.exam || 'bpsc').toLowerCase().replace(/[^a-z0-9]/g, '');
                  const categoryPart = (series.category || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                  const titlePart = newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                  const autoSlug = [examCode, categoryPart, titlePart].filter(Boolean).join('-');
                  setSeries({ ...series, title: newTitle, slug: autoSlug });
                }}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-[var(--card-border)] rounded-2xl text-xs text-[var(--text-color)] outline-none mt-1 font-bold"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400">Canonical URL Slug (/test-series/program/slug)</label>
              <input
                type="text"
                value={series.slug || ''}
                onChange={e => setSeries({ ...series, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-[var(--card-border)] rounded-2xl text-xs text-[var(--text-color)] outline-none mt-1 font-mono font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400">Exam Target Category</label>
                <input
                  type="text"
                  placeholder="e.g. 71st BPSC CCE"
                  value={series.exam || ''}
                  onChange={e => setSeries({ ...series, exam: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-[var(--card-border)] rounded-2xl text-xs text-[var(--text-color)] outline-none mt-1 font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400">Program Stage / Category</label>
                <select
                  value={series.category || 'Prelims'}
                  onChange={e => setSeries({ ...series, category: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-[var(--card-border)] rounded-2xl text-xs text-[var(--text-color)] outline-none mt-1 font-bold cursor-pointer"
                >
                  <option value="Prelims">Prelims</option>
                  <option value="Mains">Mains</option>
                  <option value="Combined">Combined (Prelims + Mains)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400">Medium / Language</label>
                <select
                  value={series.language || series.medium || 'Bilingual'}
                  onChange={e => setSeries({ ...series, language: e.target.value, medium: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-[var(--card-border)] rounded-2xl text-xs text-[var(--text-color)] outline-none mt-1 font-bold cursor-pointer"
                >
                  <option value="Bilingual">Bilingual (English & Hindi)</option>
                  <option value="Hindi">Hindi Only</option>
                  <option value="English">English Only</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400">Duration / Validity</label>
                <input
                  type="text"
                  placeholder="e.g. 6 Months, Unlimited"
                  value={series.duration || ''}
                  onChange={e => setSeries({ ...series, duration: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-[var(--card-border)] rounded-2xl text-xs text-[var(--text-color)] outline-none mt-1 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400">Price (₹)</label>
                <input
                  type="number"
                  value={series.price || 0}
                  onChange={e => setSeries({ ...series, price: Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-[var(--card-border)] rounded-2xl text-xs text-[var(--text-color)] outline-none mt-1"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400">Discounted Price (₹)</label>
                <input
                  type="number"
                  value={series.discountedPrice || 0}
                  onChange={e => setSeries({ ...series, discountedPrice: Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-[var(--card-border)] rounded-2xl text-xs text-[var(--text-color)] outline-none mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400">Thumbnail Cover Image URL</label>
              <input
                type="text"
                placeholder="https://example.com/thumbnail.jpg"
                value={series.thumbnailUrl || ''}
                onChange={e => setSeries({ ...series, thumbnailUrl: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-[var(--card-border)] rounded-2xl text-xs text-[var(--text-color)] outline-none mt-1 font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400">Banner Header Image URL</label>
              <input
                type="text"
                placeholder="https://example.com/banner.jpg"
                value={series.bannerUrl || ''}
                onChange={e => setSeries({ ...series, bannerUrl: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-[var(--card-border)] rounded-2xl text-xs text-[var(--text-color)] outline-none mt-1 font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400">Schedule PDF Download URL</label>
              <input
                type="text"
                placeholder="https://example.com/schedule.pdf"
                value={series.schedulePdfUrl || ''}
                onChange={e => setSeries({ ...series, schedulePdfUrl: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-[var(--card-border)] rounded-2xl text-xs text-[var(--text-color)] outline-none mt-1 font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400">Description</label>
              <textarea
                rows={4}
                value={series.description || ''}
                onChange={e => setSeries({ ...series, description: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-[var(--card-border)] rounded-2xl text-xs text-[var(--text-color)] outline-none mt-1"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-2xl text-xs uppercase cursor-pointer shadow-md"
          >
            {saving ? 'Saving...' : 'Save Program Details'}
          </button>
        </form>
      )}

      {/* ── TAB 3: COMMERCIAL PLANS & PRICING MANAGEMENT (PHASE 5) ── */}
      {activeTab === 'pricing' && (
        <div className="space-y-8">
          {/* Section 1: Package Plan Configurations (MINI, HALF, FULL, COMPLETE, CUSTOM PACKAGES) */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-heading font-black text-lg text-[var(--text-color)] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span>Test Series Packages (MINI, HALF, FULL, COMPLETE & CUSTOM PACKAGES)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure boundaries, pricing, and specific quiz assignments for standard and custom packages.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const defaultCode = `CUSTOM_${Date.now().toString().slice(-4)}`;
                  setEditingPlan({
                    isNew: true,
                    series_id: series?.id || testSeriesId,
                    plan_code: defaultCode,
                    title: 'New Extra Package',
                    description: '',
                    sequence_start_number: 1,
                    sequence_end_number: quizzes.length > 0 ? quizzes.length : 10,
                    price: 299,
                    discounted_price: undefined,
                    included_quiz_ids: null,
                    is_active: true
                  });
                  setPlanFormError(null);
                }}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-2xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md shrink-0 uppercase tracking-wider transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Extra Package</span>
              </button>
            </div>

            {loadingPlans ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl animate-pulse" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {(() => {
                  const defaultCodes = ['MINI', 'HALF', 'FULL', 'COMPLETE'];
                  const fetchedCodes = plans.map(p => p.plan_code);
                  const allCodes = Array.from(new Set([...defaultCodes, ...fetchedCodes]));

                  return allCodes.map(code => {
                    const plan = plans.find(p => p.plan_code === code) || {
                      series_id: series?.id || testSeriesId,
                      plan_code: code,
                      title: code === 'COMPLETE' ? 'COMPLETE TEST SERIES' : `${code} Package`,
                      sequence_start_number: code === 'HALF' ? 17 : code === 'FULL' ? 29 : 1,
                      sequence_end_number: code === 'MINI' ? 16 : code === 'HALF' ? 28 : code === 'FULL' ? 40 : (quizzes.length > 0 ? Math.max(quizzes.length, 40) : 40),
                      price: code === 'MINI' ? 299 : code === 'HALF' ? 499 : code === 'FULL' ? 699 : (series?.discountedPrice || series?.price || 799),
                      is_active: true
                    };

                    const displayTitle = plan.title || (code === 'COMPLETE' ? 'COMPLETE TEST SERIES' : `${code} Package`);

                    let includedCount = 0;
                    if (plan.included_quiz_ids) {
                      try {
                        const parsed = typeof plan.included_quiz_ids === 'string' ? JSON.parse(plan.included_quiz_ids) : plan.included_quiz_ids;
                        if (Array.isArray(parsed) && parsed.length > 0) includedCount = parsed.length;
                      } catch (_) {}
                    }

                    return (
                      <div
                        key={code}
                        className={`bg-[var(--card-bg)] border-2 rounded-3xl p-6 space-y-5 flex flex-col justify-between ${
                          plan.is_active ? 'border-[var(--card-border)] hover:border-amber-500/50' : 'border-rose-500/30 opacity-70 bg-rose-500/5'
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="font-heading font-black text-lg sm:text-xl text-[var(--text-color)] uppercase tracking-wide leading-tight">
                              {displayTitle}
                            </h4>

                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border shrink-0 ${
                              plan.is_active ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                            }`}>
                              {plan.is_active ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                          </div>

                          <p className="text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                            <span>{includedCount > 0 ? `${includedCount} Specific Quizzes` : `Tests ${plan.sequence_start_number || 1}–${plan.sequence_end_number}`}</span>
                          </p>

                          {plan.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-[var(--card-border)] line-clamp-2">
                              {plan.description}
                            </p>
                          )}

                          {(() => {
                            const p1 = Number(plan.price) || 0;
                            const p2 = plan.discounted_price !== undefined && plan.discounted_price !== null ? Number(plan.discounted_price) : null;
                            let sellingPrice = p1;
                            let originalMrp: number | null = null;
                            if (p2 !== null && p2 > 0) {
                              sellingPrice = Math.min(p1, p2);
                              originalMrp = Math.max(p1, p2);
                              if (sellingPrice === originalMrp) originalMrp = null;
                            }
                            return (
                              <div className="flex items-baseline gap-2 pt-2 border-t border-[var(--card-border)]">
                                <span className="text-2xl font-heading font-black text-[var(--text-color)]">
                                  ₹{sellingPrice}
                                </span>
                                {originalMrp !== null && (
                                  <span className="text-xs text-slate-400 line-through">₹{originalMrp}</span>
                                )}
                              </div>
                            );
                          })()}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingPlan({ ...plan, title: displayTitle });
                            setPlanFormError(null);
                          }}
                          className={`w-full py-3 font-black rounded-2xl text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs ${
                            code === 'COMPLETE'
                              ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950'
                              : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                          }`}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit Package</span>
                        </button>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>

          {/* Section 2: Individual Test Pricing & Purchasability Table */}
          <div className="space-y-4 pt-6 border-t border-[var(--card-border)]">
            <div>
              <h3 className="font-heading font-black text-lg text-[var(--text-color)] flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-500" />
                <span>Individual Test Standalone Pricing & Purchasability</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure rate (₹) and toggle standalone purchase capability per mock test paper.
              </p>
            </div>

            <div className="border border-[var(--card-border)] rounded-2xl overflow-hidden bg-[var(--card-bg)] text-xs shadow-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-800/50 border-b border-[var(--card-border)] text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="p-4">Seq #</th>
                    <th className="p-4">Test Title</th>
                    <th className="p-4">Access Mode (Free / Paid)</th>
                    <th className="p-4">Individual Rate (₹)</th>
                    <th className="p-4">Standalone Purchasable</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--card-border)] font-medium">
                  {quizzes.map((quiz: any, idx: number) => {
                    const seq = quiz.sequence_number || idx + 1;
                    const rawPrice = quiz.individual_price !== undefined && quiz.individual_price !== null 
                      ? quiz.individual_price 
                      : (quiz.individualPrice !== undefined && quiz.individualPrice !== null ? quiz.individualPrice : 49);
                    const price = typeof rawPrice === 'number' ? rawPrice : (Number(rawPrice) || 0);
                    const purchasable = quiz.is_standalone_purchasable !== false;
                    const isFree = quiz.isFree === true || (quiz as any).is_free === true;

                    return (
                      <tr key={quiz.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                        <td className="p-4 font-mono font-bold text-amber-500">#{seq}</td>
                        <td className="p-4 font-bold text-[var(--text-color)]">{quiz.title}</td>
                        <td className="p-4">
                          <button
                            type="button"
                            onClick={async () => {
                              const nextFree = !isFree;
                              setQuizzes(prev => prev.map(q => q.id === quiz.id ? { ...q, isFree: nextFree, is_free: nextFree } : q));
                              try {
                                await db.saveQuizPricingAdmin({
                                  seriesId: series?.id || testSeriesId,
                                  quizId: quiz.id,
                                  individualPrice: price,
                                  isStandalonePurchasable: purchasable,
                                  isFree: nextFree
                                });
                              } catch (err) {
                                console.error('Failed to update free mode', err);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer transition-all border ${
                              isFree
                                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700'
                            }`}
                            title="Click to toggle Free Demo vs Paid access"
                          >
                            <span>{isFree ? '🎁 Free Demo' : '🔒 Paid Test'}</span>
                          </button>
                        </td>
                        <td className="p-4">
                          <input
                            type="number"
                            min={0}
                            value={price}
                            onChange={e => {
                              const val = e.target.value;
                              const newPrice = val === '' ? 0 : Number(val);
                              setQuizzes(prev => prev.map(q => q.id === quiz.id ? { ...q, individual_price: newPrice, individualPrice: newPrice } : q));
                            }}
                            className="w-24 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-[var(--card-border)] rounded-xl font-bold text-xs outline-none"
                          />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setQuizzes(prev => prev.map(q => q.id === quiz.id ? { ...q, is_standalone_purchasable: !purchasable } : q));
                              }}
                              className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                                purchasable ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded-full bg-white shadow-xs transform transition-transform ${
                                purchasable ? 'translate-x-4' : 'translate-x-0'
                              }`} />
                            </button>
                            <span className={`text-[10px] font-bold uppercase ${purchasable ? 'text-emerald-500' : 'text-slate-400'}`}>
                              {purchasable ? 'Purchasable' : 'Disabled'}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const res = await db.saveQuizPricingAdmin({
                                  seriesId: series?.id || testSeriesId,
                                  quizId: quiz.id,
                                  individualPrice: price,
                                  isStandalonePurchasable: purchasable,
                                  isFree: isFree
                                });
                                if (res && res.success) {
                                  setQuizzes(prev => prev.map(q => q.id === quiz.id ? { ...q, individual_price: price, individualPrice: price } : q));
                                  alert(`✓ Test #${seq} pricing saved! Rate: ₹${price}, Mode: ${isFree ? 'Free Demo' : 'Paid'}, Standalone: ${purchasable}`);
                                } else {
                                  alert(`Error saving test pricing: ${res?.error || 'Failed'}`);
                                }
                              } catch (err: any) {
                                alert(`Error: ${err.message || 'Failed to save pricing'}`);
                              }
                            }}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-[10px] cursor-pointer shadow-xs"
                          >
                            Save Rate
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT PLAN CONFIGURATION MODAL (PHASE 5) ── */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider">Commercial Plan Configuration</span>
                <h3 className="font-heading font-black text-xl text-slate-900 dark:text-white mt-0.5">
                  Configure {editingPlan.plan_code} Plan
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingPlan(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Warning Banner */}
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-1">
              <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Historical Entitlement Safety Guarantee</span>
              </span>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                Modifications affect <strong>future purchases only</strong>. Existing student entitlement snapshots (<code className="font-mono text-amber-500">snapshot_max_sequence</code>) and past orders will remain strictly unchanged.
              </p>
            </div>

            {planFormError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 font-bold text-xs rounded-xl">
                {planFormError}
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setSavingPlan(true);
                setPlanFormError(null);
                try {
                  let includedQuizIdsArray: string[] | undefined = undefined;
                  if (editingPlan.included_quiz_ids) {
                    try {
                      const parsed = typeof editingPlan.included_quiz_ids === 'string' ? JSON.parse(editingPlan.included_quiz_ids) : editingPlan.included_quiz_ids;
                      if (Array.isArray(parsed) && parsed.length > 0) {
                        includedQuizIdsArray = parsed;
                      }
                    } catch (_) {}
                  }

                  const res = await db.saveTestSeriesPlanAdmin({
                    seriesId: series.id,
                    planCode: editingPlan.plan_code,
                    title: editingPlan.title,
                    description: editingPlan.description,
                    sequenceStartNumber: Number(editingPlan.sequence_start_number || 1),
                    sequenceEndNumber: Number(editingPlan.sequence_end_number),
                    price: Number(editingPlan.price),
                    discountedPrice: editingPlan.discounted_price ? Number(editingPlan.discounted_price) : undefined,
                    includedQuizIds: includedQuizIdsArray,
                    isActive: editingPlan.is_active !== false
                  });

                  if (res && res.success) {
                    await loadPlans();
                    setEditingPlan(null);
                    alert(`✓ ${editingPlan.plan_code} plan updated successfully!`);
                  } else {
                    setPlanFormError(res?.error || 'Failed updating plan.');
                  }
                } catch (err: any) {
                  setPlanFormError(err.message || 'Server error updating plan.');
                } finally {
                  setSavingPlan(false);
                }
              }}
              className="space-y-4 text-xs font-bold"
            >
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">Package Code / Identifier (Unique)</label>
                <input
                  type="text"
                  required
                  value={editingPlan.plan_code || ''}
                  onChange={e => setEditingPlan({ ...editingPlan, plan_code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_') })}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none font-mono text-xs focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">Plan Display Title</label>
                <input
                  type="text"
                  required
                  value={editingPlan.title || ''}
                  onChange={e => setEditingPlan({ ...editingPlan, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none font-medium text-xs focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">Package Description & Features for Users</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Complete test series package with 40 full-length CBT mock tests, detailed bilingual explanations, rank analysis, and downloadable solution PDFs."
                  value={editingPlan.description || ''}
                  onChange={e => setEditingPlan({ ...editingPlan, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none font-medium text-xs focus:border-amber-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">Start Sequence #</label>
                  <input
                    type="number"
                    required
                    value={editingPlan.sequence_start_number || 1}
                    onChange={e => setEditingPlan({ ...editingPlan, sequence_start_number: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none font-bold text-xs focus:border-amber-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">End Sequence # *</label>
                  <input
                    type="number"
                    required
                    value={editingPlan.sequence_end_number || 16}
                    onChange={e => setEditingPlan({ ...editingPlan, sequence_end_number: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none font-bold text-xs focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              {/* Specific Quizzes Assignment Section */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-700 dark:text-slate-300">Specific Included Quizzes (Optional)</label>
                  <button
                    type="button"
                    onClick={() => {
                      let ids: string[] = [];
                      if (editingPlan.included_quiz_ids) {
                        try { ids = typeof editingPlan.included_quiz_ids === 'string' ? JSON.parse(editingPlan.included_quiz_ids) : editingPlan.included_quiz_ids; } catch (_) {}
                      }
                      if (Array.isArray(ids) && ids.length === quizzes.length) {
                        setEditingPlan({ ...editingPlan, included_quiz_ids: JSON.stringify([]) });
                      } else {
                        setEditingPlan({ ...editingPlan, included_quiz_ids: JSON.stringify(quizzes.map(q => q.id)) });
                      }
                    }}
                    className="text-amber-500 font-bold hover:underline text-[10px] cursor-pointer"
                  >
                    {(() => {
                      let ids: string[] = [];
                      if (editingPlan.included_quiz_ids) {
                        try { ids = typeof editingPlan.included_quiz_ids === 'string' ? JSON.parse(editingPlan.included_quiz_ids) : editingPlan.included_quiz_ids; } catch (_) {}
                      }
                      return Array.isArray(ids) && ids.length === quizzes.length ? 'Deselect All' : 'Select All Quizzes';
                    })()}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mb-2">
                  Pick specific tests included in this pack. If no specific tests are checked, access defaults to sequence range (Tests {editingPlan.sequence_start_number || 1} to {editingPlan.sequence_end_number || 'X'}).
                </p>

                <div className="max-h-44 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl p-2 space-y-1 bg-slate-50 dark:bg-slate-900/60 styled-scrollbar">
                  {quizzes.length === 0 ? (
                    <p className="text-slate-400 text-[11px] p-2 text-center">No quizzes created in this test series yet.</p>
                  ) : (
                    quizzes.map((quiz, qIdx) => {
                      let currentSelectedIds: string[] = [];
                      if (editingPlan.included_quiz_ids) {
                        try {
                          currentSelectedIds = typeof editingPlan.included_quiz_ids === 'string' ? JSON.parse(editingPlan.included_quiz_ids) : editingPlan.included_quiz_ids;
                        } catch (_) {}
                      }
                      if (!Array.isArray(currentSelectedIds)) currentSelectedIds = [];
                      const isChecked = currentSelectedIds.includes(quiz.id);

                      return (
                        <label key={quiz.id} className="flex items-center gap-2 p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors text-slate-800 dark:text-slate-200 text-xs">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              let nextIds = [...currentSelectedIds];
                              if (e.target.checked) {
                                if (!nextIds.includes(quiz.id)) nextIds.push(quiz.id);
                              } else {
                                nextIds = nextIds.filter(id => id !== quiz.id);
                              }
                              setEditingPlan({ ...editingPlan, included_quiz_ids: JSON.stringify(nextIds) });
                            }}
                            className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                          />
                          <span className="font-mono text-[10px] text-amber-500 font-bold">#{quiz.sequence_number || qIdx + 1}</span>
                          <span className="flex-1 truncate">{quiz.title}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">Regular Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editingPlan.price || 0}
                    onChange={e => setEditingPlan({ ...editingPlan, price: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none font-bold text-xs focus:border-amber-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">Discounted Price (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={editingPlan.discounted_price || ''}
                    onChange={e => setEditingPlan({ ...editingPlan, discounted_price: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none font-medium text-xs focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                <span className="text-slate-700 dark:text-slate-300">Active Plan Status</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingPlan({ ...editingPlan, is_active: !editingPlan.is_active })}
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                      editingPlan.is_active ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white shadow-xs transform transition-transform ${
                      editingPlan.is_active ? 'translate-x-4' : 'translate-x-0'
                    }`} />
                  </button>
                  <span className={`text-[10px] uppercase ${editingPlan.is_active ? 'text-emerald-500' : 'text-slate-400'}`}>
                    {editingPlan.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                {editingPlan.id ? (
                  <button
                    type="button"
                    onClick={async () => {
                      if (confirm(`Are you sure you want to delete '${editingPlan.title}'?`)) {
                        setSavingPlan(true);
                        try {
                          await db.deleteTestSeriesPlanAdmin(editingPlan.id);
                          await loadPlans();
                          setEditingPlan(null);
                          alert('✓ Package deleted successfully');
                        } catch (err: any) {
                          setPlanFormError(err.message || 'Failed deleting package');
                        } finally {
                          setSavingPlan(false);
                        }
                      }
                    }}
                    className="px-3.5 py-2 border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 text-xs font-bold rounded-xl cursor-pointer transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Package</span>
                  </button>
                ) : <div />}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingPlan(null)}
                    className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold rounded-xl cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingPlan}
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer uppercase tracking-wider transition-colors"
                  >
                    {savingPlan ? 'Saving...' : 'Save Configuration'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── TAB 4: QUIZZES ── */}
      {activeTab === 'quizzes' && (
        <div className="space-y-6">
          <TestSeriesAdmin initialSeriesId={series?.id || testSeriesId} initialSubTab="quizzes" />
        </div>
      )}

      {/* ── TAB 4: STUDENTS ── */}
      {activeTab === 'students' && (() => {
        const filteredStudents = students.filter(st => {
          const matchEmail = !filterEmail.trim() || st.email.toLowerCase().includes(filterEmail.toLowerCase()) || st.fullName.toLowerCase().includes(filterEmail.toLowerCase());
          const matchState = !filterState.trim() || (st.state && st.state.toLowerCase().includes(filterState.toLowerCase()));
          const matchDistrict = !filterDistrict.trim() || (st.district && st.district.toLowerCase().includes(filterDistrict.toLowerCase()));
          return matchEmail && matchState && matchDistrict;
        });

        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="font-bold text-sm text-[var(--text-color)] uppercase tracking-wider">Enrolled Students ({filteredStudents.length} / {students.length})</h3>
              <button
                onClick={() => setIsAddStudentModalOpen(true)}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-2xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Add Student Manually</span>
              </button>
            </div>

            {/* Filter Toolbar (Email, State, District) */}
            <div className="p-4 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs shadow-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Search Name / Email</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Filter by name or email..."
                    value={filterEmail}
                    onChange={e => setFilterEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-[var(--card-border)] rounded-xl text-[var(--text-color)] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Filter State</label>
                <input
                  type="text"
                  placeholder="Filter by State (e.g. Bihar)..."
                  value={filterState}
                  onChange={e => setFilterState(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-[var(--card-border)] rounded-xl text-[var(--text-color)] outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Filter District</label>
                <input
                  type="text"
                  placeholder="Filter by District (e.g. Patna)..."
                  value={filterDistrict}
                  onChange={e => setFilterDistrict(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-[var(--card-border)] rounded-xl text-[var(--text-color)] outline-none"
                />
              </div>
            </div>

            {loadingStudents ? (
              <p className="text-xs text-slate-400">Loading enrolled students...</p>
            ) : filteredStudents.length === 0 ? (
              <div className="p-10 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl text-center space-y-2 shadow-xs">
                <Users className="w-10 h-10 text-slate-500 mx-auto" />
                <p className="text-xs text-slate-400">No matching enrolled students found.</p>
              </div>
            ) : (
              <div className="border border-[var(--card-border)] rounded-2xl overflow-hidden bg-[var(--card-bg)] text-xs shadow-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800/50 border-b border-[var(--card-border)] text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="p-4">Student Name</th>
                      <th className="p-4">Mobile / Email</th>
                      <th className="p-4">State & District</th>
                      <th className="p-4">Enrolled At</th>
                      <th className="p-4">Payment</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--card-border)] font-medium">
                    {filteredStudents.map((st) => (
                      <tr key={st.userId}>
                        <td className="p-4 font-bold text-[var(--text-color)]">{st.fullName}</td>
                        <td className="p-4 text-slate-600 dark:text-slate-300">
                          <div>{st.mobile || 'N/A'}</div>
                          <div className="text-[10px] text-slate-400">{st.email}</div>
                        </td>
                        <td className="p-4 text-slate-600 dark:text-slate-300">
                          {st.state || st.district ? (
                            <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-md text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                              {[st.district, st.state].filter(Boolean).join(', ')}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">Not Specified</span>
                          )}
                        </td>
                        <td className="p-4 text-slate-500 dark:text-slate-400">{new Date(st.enrolledAt).toLocaleDateString('en-IN')}</td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-md text-[9px] uppercase font-bold">
                            {st.paymentOrderId === 'ADMIN_MANUAL' ? 'ADMIN / MANUAL' : 'PAID'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleViewStudentPerformance(st)}
                              className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold rounded-lg text-[10px] cursor-pointer flex items-center gap-1"
                              title="View performance stats & test attempts"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View Stats & Attempts</span>
                            </button>

                            <button
                              onClick={() => handleOpenEditStudentModal(st)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 font-bold rounded-lg text-[10px] cursor-pointer flex items-center gap-1 transition-colors"
                              title="Edit Student Information"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-amber-500" />
                              <span className="hidden sm:inline">Edit Info</span>
                            </button>

                            <button
                              onClick={() => handleRemoveStudent(st.userId, st.fullName)}
                              className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-bold rounded-lg text-[10px] cursor-pointer"
                            >
                              Revoke Access
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })()}

      {/* ── STUDENT PERFORMANCE & STATS INSPECTOR MODAL ── */}
      {selectedStudentStats && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider">Student Performance Inspector</span>
                <h3 className="font-heading font-black text-xl text-[var(--text-color)] mt-0.5">
                  {selectedStudentStats.student.fullName}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedStudentStats.student.email} • {selectedStudentStats.student.mobile || 'No Mobile'}
                  {selectedStudentStats.student.state ? ` • ${selectedStudentStats.student.state}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentStats(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-[var(--text-color)] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingStudentAttempts ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-400 font-bold">Fetching student performance analytics & test logs...</p>
              </div>
            ) : (() => {
              const attempts = selectedStudentStats.attempts || [];
              const totalAttempts = attempts.length;
              const passedAttempts = attempts.filter((a: any) => a.passed || (a.scorePercentage >= 40)).length;
              const avgScore = totalAttempts > 0 ? (attempts.reduce((acc: number, a: any) => acc + (a.score || 0), 0) / totalAttempts).toFixed(1) : '0';
              const avgAccuracy = totalAttempts > 0 ? (attempts.reduce((acc: number, a: any) => acc + (a.scorePercentage || a.percentage || 0), 0) / totalAttempts).toFixed(1) : '0';
              const maxScore = totalAttempts > 0 ? Math.max(...attempts.map((a: any) => a.score || 0)).toFixed(1) : '0';

              return (
                <div className="space-y-6">
                  {/* Aggregated Performance Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs font-bold">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] rounded-2xl">
                      <span className="text-amber-500 text-xl font-black block">{totalAttempts}</span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">Tests Attempted</span>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] rounded-2xl">
                      <span className="text-emerald-500 text-xl font-black block">{passedAttempts} / {totalAttempts}</span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">Passed Cut-off</span>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] rounded-2xl">
                      <span className="text-sky-500 text-xl font-black block">{avgAccuracy}%</span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">Avg Accuracy</span>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] rounded-2xl">
                      <span className="text-purple-500 text-xl font-black block">{maxScore} Marks</span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">Highest Marks</span>
                    </div>
                  </div>

                  {/* Detailed Attempt History List */}
                  <div className="space-y-3 border-t border-[var(--card-border)] pt-4">
                    <h4 className="font-heading font-black text-xs uppercase text-[var(--text-color)] tracking-wider">
                      Attempted Quiz Papers & Detailed Scorecards ({totalAttempts})
                    </h4>

                    {totalAttempts === 0 ? (
                      <div className="p-8 bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] rounded-2xl text-center space-y-1">
                        <p className="text-xs text-slate-400 font-semibold">Student has not attempted any mock quizzes yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                        {attempts.map((att: any, idx: number) => {
                          const isPassed = att.passed || (att.scorePercentage >= 40) || (att.percentage >= 40);
                          const isExpanded = expandedAttemptId === att.id;
                          const setCode = att.setCode || att.set || 'SET-A';

                          return (
                            <div key={att.id || idx} className="bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] rounded-2xl p-4 space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-[var(--text-color)]">{att.quizTitle || `Mock Test #${idx + 1}`}</span>
                                    <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-mono text-[9px] font-black rounded uppercase">
                                      {setCode}
                                    </span>
                                    <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded ${
                                      isPassed ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-red-500/10 text-red-600 border border-red-500/20'
                                    }`}>
                                      {isPassed ? 'PASSED' : 'FAILED'}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 mt-0.5">
                                    Attempted on: {new Date(att.attemptedAt || att.createdAt || Date.now()).toLocaleString('en-IN')}
                                  </p>
                                </div>

                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <p className="font-mono text-sm font-black text-amber-500">{att.score !== undefined ? Number(att.score).toFixed(1) : 0} Marks</p>
                                    <p className="text-[10px] text-slate-400">{att.scorePercentage || att.percentage || 0}% Accuracy</p>
                                  </div>
                                  {att.details && att.details.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => setExpandedAttemptId(isExpanded ? null : att.id)}
                                      className="px-2.5 py-1.5 bg-slate-200 dark:bg-slate-800 text-[var(--text-color)] text-[10px] font-bold rounded-lg hover:bg-amber-500 hover:text-slate-950 transition-colors cursor-pointer"
                                    >
                                      {isExpanded ? 'Hide Q&A' : 'View Q&A Breakdown'}
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Detailed Question Answers breakdown drawer */}
                              {isExpanded && att.details && (
                                <div className="border-t border-[var(--card-border)] pt-3 space-y-2 text-xs">
                                  <span className="text-[10px] font-black uppercase text-slate-400 block">Question Breakdown Log ({att.details.length} Qs):</span>
                                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                    {att.details.map((qDet: any, qIdx: number) => (
                                      <div key={qIdx} className="p-2.5 bg-white dark:bg-slate-950 rounded-xl border border-[var(--card-border)] space-y-1">
                                        <div className="flex justify-between items-start text-[11px]">
                                          <p className="font-bold text-[var(--text-color)] flex-1">{qIdx + 1}. {qDet.questionText}</p>
                                          <span className={`px-2 py-0.5 text-[9px] font-black rounded uppercase shrink-0 ml-2 ${
                                            qDet.isCorrect ? 'bg-emerald-500/10 text-emerald-500' : qDet.studentAnswer ? 'bg-red-500/10 text-red-500' : 'bg-slate-500/10 text-slate-400'
                                          }`}>
                                            {qDet.isCorrect ? 'Correct' : qDet.studentAnswer ? 'Incorrect' : 'Skipped'}
                                          </span>
                                        </div>
                                        <div className="flex gap-4 text-[10px] text-slate-500">
                                          <span>Student Selected: <strong className={qDet.isCorrect ? 'text-emerald-500' : 'text-red-500'}>{qDet.studentAnswer || 'None'}</strong></span>
                                          <span>Correct Key: <strong className="text-emerald-500">{qDet.correctAnswer}</strong></span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── TAB 5: SETTINGS ── */}
      {activeTab === 'settings' && (
        <div className="p-8 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl space-y-6 max-w-xl shadow-xs">
          <h3 className="font-bold text-sm text-[var(--text-color)] uppercase tracking-wider border-b border-[var(--card-border)] pb-3">Test Series Controls</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 border border-[var(--card-border)] rounded-2xl text-xs font-bold">
              <div>
                <p className="text-[var(--text-color)]">Public Visibility</p>
                <p className="text-[10px] text-slate-400 font-normal mt-0.5">Control whether this Test Series appears publicly on the portal</p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (!series) return;
                  const updated = { ...series, isPublished: series.isPublished === false ? true : false };
                  setSeries(updated);
                  await db.saveTestSeries(updated);
                }}
                className={`px-4 py-2 font-bold rounded-xl text-xs uppercase cursor-pointer ${
                  series.isPublished !== false ? 'bg-emerald-600 text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {series.isPublished !== false ? 'Published' : 'Draft'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD / EDIT QUIZ MODAL ── */}
      {isQuizModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto text-slate-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <h3 className="font-heading font-black text-xl text-slate-900 dark:text-white">{editingQuizId ? 'Edit Quiz Paper' : 'Add Quiz Paper to this Test Series'}</h3>
              <button
                type="button"
                onClick={() => {
                  setIsQuizModalOpen(false);
                  setEditingQuizId(null);
                  setQuizForm({
                    title: '',
                    description: '',
                    timeLimitMins: 60,
                    passingScore: 40,
                    isPublished: true,
                    setMode: 'single',
                    defaultSet: 'SET-A',
                    availableSets: ['SET-A', 'SET-B', 'SET-C', 'SET-D']
                  });
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuiz} className="space-y-5 text-xs font-bold">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1.5 text-xs">Quiz Title *</label>
                <input
                  type="text"
                  placeholder="Mock Test 01 - General Studies"
                  required
                  value={quizForm.title}
                  onChange={e => setQuizForm({ ...quizForm, title: e.target.value })}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none font-medium text-xs focus:border-amber-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1.5 text-xs">Duration (Mins)</label>
                  <input
                    type="number"
                    value={quizForm.timeLimitMins}
                    onChange={e => setQuizForm({ ...quizForm, timeLimitMins: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none font-medium text-xs focus:border-amber-500 transition-colors"
                  />
                </div>

              </div>

              {/* SET-Wise Exam Paper Access Controls */}
              <div className="p-5 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
                  <label className="text-amber-500 font-extrabold uppercase text-[10px] tracking-wider block">
                    SET-Wise Exam Paper Access
                  </label>
                  <span className="px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-lg text-[9px] font-black uppercase shrink-0">
                    {quizForm.setMode === 'multi' ? 'Multi-SET Mode' : 'Single Paper Mode'}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-slate-700 dark:text-slate-300 block mb-1 uppercase">SET Access Mode</label>
                    <select
                      value={quizForm.setMode || 'single'}
                      onChange={e => setQuizForm({ ...quizForm, setMode: e.target.value as any })}
                      className="w-full px-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none font-bold text-xs focus:border-amber-500 transition-colors cursor-pointer"
                    >
                      <option value="single" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Single Paper (Standard)</option>
                      <option value="multi" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Multi-SET Paper (Sets A, B, C, D)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-700 dark:text-slate-300 block mb-1 uppercase">Assigned SET Code</label>
                    <select
                      value={quizForm.defaultSet || 'SET-A'}
                      onChange={e => setQuizForm({ ...quizForm, defaultSet: e.target.value })}
                      className="w-full px-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none font-bold text-xs focus:border-amber-500 transition-colors cursor-pointer"
                    >
                      <option value="SET-A" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">SET-A</option>
                      <option value="SET-B" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">SET-B</option>
                      <option value="SET-C" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">SET-C</option>
                      <option value="SET-D" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">SET-D</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsQuizModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold rounded-2xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-2xl shadow-md cursor-pointer uppercase tracking-wider transition-colors"
                >
                  {editingQuizId ? 'Save Quiz / Paper' : 'Create & Bind Quiz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ADD STUDENT MODAL ── */}
      {isAddStudentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-6">
          <div className="max-w-md w-full p-8 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl space-y-4 text-xs font-bold shadow-2xl">
            <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-3">
              <h3 className="text-sm text-[var(--text-color)] uppercase">Search & Enroll Student</h3>
              <button type="button" onClick={() => setIsAddStudentModalOpen(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>

            <div>
              <label className="text-[10px] text-slate-400">Search by Name, Mobile, or Email</label>
              <input
                type="text"
                placeholder="Type student name..."
                value={studentSearchText}
                onChange={e => handleSearchStudents(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-[var(--card-border)] rounded-2xl text-[var(--text-color)] outline-none mt-1"
              />
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto">
              {searchResults.map(st => {
                const isAlreadyEnrolled = students.some(s => s.userId === st.id);
                return (
                  <div key={st.id} className="p-3 bg-slate-50 dark:bg-slate-800 border border-[var(--card-border)] rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-[var(--text-color)] font-bold">{st.fullName}</p>
                      <p className="text-[10px] text-slate-400">{st.mobile || st.email}</p>
                    </div>
                    {isAlreadyEnrolled ? (
                      <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-lg uppercase">
                        Enrolled
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAddStudent(st.id)}
                        className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-lg text-[10px] cursor-pointer shadow-xs"
                      >
                        Enroll
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT STUDENT PROFILE MODAL ── */}
      {editingStudentInfo && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider">Student Account Management</span>
                <h3 className="font-heading font-black text-lg text-slate-900 dark:text-white mt-0.5">
                  Edit Student Information
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingStudentInfo(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudentInfo} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">Student Full Name *</label>
                <input
                  type="text"
                  required
                  value={studentEditForm.fullName}
                  onChange={e => setStudentEditForm({ ...studentEditForm, fullName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none font-medium text-xs focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={studentEditForm.email}
                  onChange={e => setStudentEditForm({ ...studentEditForm, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none font-medium text-xs focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">Mobile Number</label>
                <input
                  type="text"
                  placeholder="e.g. 9876543210"
                  value={studentEditForm.mobile}
                  onChange={e => setStudentEditForm({ ...studentEditForm, mobile: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none font-medium text-xs focus:border-amber-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">State</label>
                  <input
                    type="text"
                    placeholder="e.g. Bihar"
                    value={studentEditForm.state}
                    onChange={e => setStudentEditForm({ ...studentEditForm, state: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none font-medium text-xs focus:border-amber-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">District</label>
                  <input
                    type="text"
                    placeholder="e.g. Patna"
                    value={studentEditForm.district}
                    onChange={e => setStudentEditForm({ ...studentEditForm, district: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none font-medium text-xs focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingStudentInfo(null)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingStudentInfo}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer uppercase tracking-wider transition-colors"
                >
                  {savingStudentInfo ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
