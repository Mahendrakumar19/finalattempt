'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Layers, FileText, Users, Settings, Plus, Edit3, Trash2, Check, X, Eye, 
  Upload, Sparkles, BookOpen, AlertCircle, ShieldCheck, Sun, Moon, Search, Filter
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
  const router = useRouter();
  const testSeriesId = params.testSeriesId as string;

  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'quizzes' | 'students' | 'settings'>('overview');
  const [series, setSeries] = useState<TestSeriesItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Quizzes tab states
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
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
    setLoading(true);
    try {
      const all = await db.getTestSeries(true);
      const found = all.find(s => s.id === testSeriesId || s.slug === testSeriesId);
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

  useEffect(() => {
    loadData();
    loadQuizzes();
    loadStudents();
  }, [loadData, loadQuizzes, loadStudents]);

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
              <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-md border ${series.isPublished !== false ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 border-[var(--card-border)] text-slate-500'}`}>
                {series.isPublished !== false ? 'Published' : 'Draft'}
              </span>
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
      <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-[var(--card-border)] w-fit">
        {(['overview', 'details', 'quizzes', 'students', 'settings'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === tab
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-500 hover:text-[var(--text-color)]'
            }`}
          >
            {tab} {tab === 'quizzes' ? `(${quizzes.length})` : tab === 'students' ? `(${students.length})` : ''}
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

      {/* ── TAB 3: QUIZZES ── */}
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
