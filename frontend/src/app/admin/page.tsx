'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Briefcase,
  Database,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Plus,
  Trash2,
  Edit3,
  Award,
  FileText,
  Bookmark,
  BookOpen,
  Layers,
  FolderOpen,
  Sun,
  Moon,
  Menu,
  MessageSquare,
  X
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import RichTextEditor from '@/components/RichTextEditor';
import MediaDashboard from '@/components/MediaDashboard';
import MediaPicker from '@/components/MediaPicker';
import SyllabusStrategyCMS from '@/components/SyllabusStrategyCMS';
import PYQsManagerCMS from '@/components/PYQsManagerCMS';
import { db } from '@/services/db';
import TestSeriesAdmin from '@/components/admin/TestSeriesAdmin';
import CustomPagesCMS from '@/components/CustomPagesCMS';

type AdminTab = 'Dashboard' | 'Settings' | 'Custom Pages' | 'Media Library' | 'Exams & Syllabus' | 'PYQs Manager' | 'Strategy & Values' | 'Strategy CMS' | 'Values CMS' | 'Students' | 'Courses' | 'Test Series' | 'Leads' | 'Current Affairs' | 'Blogs' | 'Resources' | 'Super Admin Console';

interface SiteSettings {
  heroTitle: string;
  heroSubtitle: string;
  tagline: string;
  heroImageUrl?: string;
  visitorsCount?: number;
  contactTitle?: string;
  contactSubtitle?: string;
  contactAddress?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactHours?: string;
  whatsappLink?: string;
  telegramLink?: string;
  googleMapUrl?: string;
  featureFlags?: Record<string, boolean>;
}

interface Lead {
  id: string;
  fullName: string;
  mobile: string;
  email?: string;
  targetExam: string;
  status: string;
  createdAt: string;
}

interface CurrentAffairArticle {
  id: string;
  title: string;
  category: string;
  publishDate: string;
  summary: string;
  content: string;
  relevance?: string;
  context?: string;
  analysis?: string;
  wayForward?: string;
  practiceQuestion?: string;
}

interface BlogItem {
  id: string;
  title: string;
  publishDate: string;
  readTime: string;
  category: string;
  content: string;
  imageUrl?: string;
  seoTitle?: string;
  seoKeywords?: string;
  seoDescription?: string;
  blurb?: string;
}

interface ResourceDownload {
  id: string;
  title: string;
  size: string;
  type: string;
  downloadCount: number;
  url: string;
  category?: string;
  subcategory?: string;
}

interface Course {
  id: string;
  title: string;
  category: string;
  description: string;
  fee: number | string;
  duration: string;
  schedule: string;
  isPublished: boolean;
}

interface StudentEnrollmentInfo {
  id: string;
  courseId: string;
  courseTitle: string;
  batch: string;
  paymentOrderId: string;
  paymentStatus: string;
  amountPaid: number;
  enrolledAt: string;
}

interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  mobile?: string;
  role: 'student' | 'faculty' | 'admin';
  targetExam?: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
  enrollments?: StudentEnrollmentInfo[];
}

export default function AdminPortal() {
  const [activeTab, setActiveTab] = useState<AdminTab>('Dashboard');
  const [loading, setLoading] = useState(true);
  const [backendOffline, setBackendOffline] = useState(false);

  // States for CMS collections
  const [settings, setSettings] = useState<SiteSettings>({
    heroTitle: '72nd BPSC Preparation Starts Here',
    heroSubtitle: 'Personalized mentorship, smart study tools, and Bihar-focused content designed to help you clear BPSC with confidence.',
    tagline: 'One Mentor. One Strategy. One Final Attempt.',
    heroImageUrl: ''
  });
  const [heroUploading, setHeroUploading] = useState(false);
  const [leadsList, setLeadsList] = useState<Lead[]>([]);
  const [caList, setCaList] = useState<CurrentAffairArticle[]>([]);
  const [blogsList, setBlogsList] = useState<BlogItem[]>([]);
  const [resourcesList, setResourcesList] = useState<ResourceDownload[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [selectedUserModal, setSelectedUserModal] = useState<UserProfile | null>(null);
  const [editUserForm, setEditUserForm] = useState<Partial<UserProfile>>({});
  const [coursesList, setCoursesList] = useState<Course[]>([]);
  const [editMode, setEditMode] = useState(false);

  // Dynamic Current Affairs states
  const [dynamicEditionsList, setDynamicEditionsList] = useState<any[]>([]);
  const [editingEdition, setEditingEdition] = useState<any | null>(null);
  const [editingArticle, setEditingArticle] = useState<any | null>(null);
  const [activeArticleCategory, setActiveArticleCategory] = useState<'NATIONAL' | 'INTERNATIONAL' | 'BIHAR'>('NATIONAL');
  const [isEditionModalOpen, setIsEditionModalOpen] = useState(false);
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [caSubTab, setCaSubTab] = useState<'daily' | 'mains'>('daily');

  // Modals visibility states
  const [activeModal, setActiveModal] = useState<{ type: 'add' | 'edit'; index?: number } | null>(null);

  // YouTube Sync Console States
  const [youtubeStatus, setYoutubeStatus] = useState<any>({ lastSyncTime: null, videosSynced: 0, status: 'IDLE', error: null });
  const [syncingYoutube, setSyncingYoutube] = useState(false);

  // Local Storage Auth & Super Admin state
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('admin_token');
      const superFlag = localStorage.getItem('is_super_admin') === 'true';
      setAdminToken(token);
      setIsSuperAdmin(superFlag);
    }
  }, []);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminEmail === 'superadmin@finalattempt.com' && adminPassword === 'SuperAdminSecret#2026') {
      localStorage.setItem('admin_token', 'finalattempt-superadmin-master-access-key-999');
      localStorage.setItem('is_super_admin', 'true');
      setAdminToken('finalattempt-superadmin-master-access-key-999');
      setIsSuperAdmin(true);
      setAuthError('');
    } else if (adminEmail === 'admin@finalattempt.com' && adminPassword === 'Password123') {
      localStorage.setItem('admin_token', 'finalattempt-admin-token-secure-hash');
      localStorage.removeItem('is_super_admin');
      setAdminToken('finalattempt-admin-token-secure-hash');
      setIsSuperAdmin(false);
      setAuthError('');
    } else {
      setAuthError('Invalid administrator credentials.');
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('is_super_admin');
    setAdminToken(null);
    setIsSuperAdmin(false);
  };

  // Form states for CRUD operations
  const [caForm, setCaForm] = useState<CurrentAffairArticle>({ id: '', title: '', category: 'GS Paper II', publishDate: '', summary: '', content: '', relevance: '', context: '', analysis: '', wayForward: '', practiceQuestion: '' });
  const [blogForm, setBlogForm] = useState<BlogItem>({ id: '', title: '', publishDate: '', readTime: '', category: '', content: '', imageUrl: '', seoTitle: '', seoKeywords: '', seoDescription: '', blurb: '' });
  const [resourceForm, setResourceForm] = useState<ResourceDownload>({ id: '', title: '', size: '', type: 'PDF', downloadCount: 0, url: '', category: 'Prelims', subcategory: '' });
  const [resourceUploading, setResourceUploading] = useState(false);
  const [courseForm, setCourseForm] = useState<Course>({ id: '', title: '', category: 'LMS Program', description: '', fee: 0, duration: '', schedule: '', isPublished: true });

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  const fetchCMSData = async () => {
    setLoading(true);
    try {
      // 1. Settings
      const setRes = await fetch(`${BACKEND_URL}/api/settings`);
      if (setRes.ok) setSettings(await setRes.json());

      // 2. Leads
      const leadsRes = await fetch(`${BACKEND_URL}/api/leads`);
      if (leadsRes.ok) setLeadsList(await leadsRes.json());

      // 5. Current affairs
      const caRes = await fetch(`${BACKEND_URL}/api/current-affairs`);
      if (caRes.ok) setCaList(await caRes.json());

      // 6. Blogs
      const blogRes = await fetch(`${BACKEND_URL}/api/blogs`);
      if (blogRes.ok) setBlogsList(await blogRes.json());

      // 7. Resources
      const rRes = await fetch(`${BACKEND_URL}/api/resources`);
      if (rRes.ok) setResourcesList(await rRes.json());

      // 8. LMS Courses
      const cRes = await fetch(`${BACKEND_URL}/api/lms/courses`);
      if (cRes.ok) {
        const cData = await cRes.json();
        if (cData.success && cData.data) setCoursesList(cData.data);
      }

      // 9. Users check list
      const uRes = await fetch(`${BACKEND_URL}/api/auth/users`);
      if (uRes.ok) setUsersList(await uRes.json());

      // 10. Dynamic Current Affairs
      const dynRes = await fetch(`${BACKEND_URL}/api/dynamic-current-affairs/editions?includeDrafts=true`);
      if (dynRes.ok) {
        setDynamicEditionsList(await dynRes.json());
      }

      // 11. YouTube Sync Status
      const ytStatus = await db.getYoutubeSyncStatus();
      if (ytStatus) setYoutubeStatus(ytStatus);

      setBackendOffline(false);
    } catch (err) {
      console.warn('Backend server offline. Running in mock offline mode:', err);
      setBackendOffline(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCMSData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BACKEND_URL}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) alert('Settings saved successfully!');
    } catch (err) {
      console.error(err);
    }
  };

  const handleTriggerYoutubeSync = async () => {
    if (!adminToken) return;
    setSyncingYoutube(true);
    try {
      const res = await db.triggerYoutubeSync(adminToken);
      if (res.success) {
        alert(`YouTube synchronization successful! Synced ${res.syncedCount || 0} videos.`);
        // Reload status
        const ytStatus = await db.getYoutubeSyncStatus();
        if (ytStatus) setYoutubeStatus(ytStatus);
      } else {
        alert('YouTube Sync Failed: ' + (res.error || 'Unknown error'));
      }
    } catch (err: any) {
      console.error(err);
      alert('Error triggering YouTube synchronization.');
    } finally {
      setSyncingYoutube(false);
    }
  };

  const [mediaPickerConfig, setMediaPickerConfig] = useState<{
    isOpen: boolean;
    field: string;
    allowedTypes?: string[];
  }>({ isOpen: false, field: '' });

  const handleSelectMedia = (url: string, item: any) => {
    const { field } = mediaPickerConfig;
    if (field === 'heroImageUrl') {
      setSettings(prev => {
        const existing = prev.heroImageUrl ? prev.heroImageUrl.split(',').map(s => s.trim()).filter(Boolean) : [];
        if (!existing.includes(url)) {
          existing.push(url);
        }
        return { ...prev, heroImageUrl: existing.join(', ') };
      });
    } else if (field === 'blogImage') {
      setBlogForm(prev => ({ ...prev, imageUrl: url }));
    }
    setMediaPickerConfig({ isOpen: false, field: '' });
  };

  const handleToggleUserStatus = async (id: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    setUsersList(prev => prev.map(u => u.id === id ? { ...u, isActive: nextStatus } : u));
    await fetch(`${BACKEND_URL}/api/auth/users/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: nextStatus })
    });
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    setUsersList(prev => prev.filter(u => u.id !== id));
    await fetch(`${BACKEND_URL}/api/auth/users/${id}`, { method: 'DELETE' });
  };

  const handleSaveCA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeModal?.type === 'add') {
      const newItem = { ...caForm, id: `ca-${Date.now()}`, publishDate: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) };
      setCaList(prev => [...prev, newItem]);
      await fetch(`${BACKEND_URL}/api/current-affairs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });
    } else {
      const id = caForm.id;
      setCaList(prev => prev.map(c => c.id === id ? caForm : c));
      await fetch(`${BACKEND_URL}/api/current-affairs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(caForm)
      });
    }
    setActiveModal(null);
  };

  const handleDeleteCA = async (id: string) => {
    if (!window.confirm('Delete this article?')) return;
    setCaList(prev => prev.filter(c => c.id !== id));
    await fetch(`${BACKEND_URL}/api/current-affairs/${id}`, { method: 'DELETE' });
  };

  // Dynamic Current Affairs handlers
  const handleSaveDynamicEdition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEdition.publishDate) {
      alert('Date is required.');
      return;
    }

    const ok = await db.saveDynamicCurrentAffairsEdition(editingEdition);
    if (ok) {
      alert('Daily edition saved successfully!');
      setIsEditionModalOpen(false);
      const list = await db.getDynamicCurrentAffairsEditions(true);
      setDynamicEditionsList(list);
    } else {
      alert('Failed to save edition.');
    }
  };

  const handleDeleteDynamicEdition = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this Daily Edition and all its aggregated articles?')) return;
    const ok = await db.deleteDynamicCurrentAffairsEdition(id);
    if (ok) {
      setDynamicEditionsList(prev => prev.filter(e => e.id !== id));
    } else {
      alert('Failed to delete edition.');
    }
  };

  const handleAddArticleToEdition = (category: 'NATIONAL' | 'INTERNATIONAL' | 'BIHAR') => {
    setActiveArticleCategory(category);
    setEditingArticle({
      id: '',
      slug: '',
      title: '',
      summary: '',
      category,
      publishStatus: 'PUBLISHED',
      publishedDate: editingEdition.publishDate || '',
      readingTime: '5 min read',
      importance: 'MEDIUM',
      content: '',
      whyInNews: '',
      context: '',
      background: '',
      keyHighlights: '',
      importantFacts: '',
      examRelevance: '',
      previousContext: '',
      wayForward: '',
      keyTakeaways: '',
      seo: { canonicalUrl: '', seoTitle: '', seoDescription: '', seoKeywords: '' },
      subjects: [],
      exams: [],
      tags: [],
      media: []
    });
    setIsArticleModalOpen(true);
  };

  const handleSaveArticleToEdition = () => {
    if (!editingArticle.title || !editingArticle.summary) {
      alert('Title and Summary are required.');
      return;
    }

    const articles = [...(editingEdition.articles || [])];
    const artIdx = articles.findIndex(a => a.id === editingArticle.id && editingArticle.id !== '');

    const slugifiedTitle = editingArticle.title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const finalSlug = editingArticle.slug || `${editingEdition.publishDate}-${editingArticle.category.toLowerCase()}-${slugifiedTitle}`;

    const parseCsv = (val: any) => {
      if (Array.isArray(val)) return val;
      if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
      return [];
    };

    const nextArt = {
      ...editingArticle,
      id: editingArticle.id || `art-${Date.now()}`,
      slug: finalSlug,
      publishedDate: editingEdition.publishDate,
      subjects: parseCsv(editingArticle.subjects),
      exams: parseCsv(editingArticle.exams),
      tags: parseCsv(editingArticle.tags)
    };

    if (artIdx >= 0) {
      articles[artIdx] = nextArt;
    } else {
      articles.push(nextArt);
    }

    setEditingEdition({
      ...editingEdition,
      articles
    });
    setIsArticleModalOpen(false);
  };

  const handleDeleteArticleFromEdition = (artId: string) => {
    if (!window.confirm('Remove this article from layout?')) return;
    setEditingEdition({
      ...editingEdition,
      articles: (editingEdition.articles || []).filter((a: any) => a.id !== artId)
    });
  };

  const handleSaveBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeModal?.type === 'add') {
      const newItem = { ...blogForm, id: `blog-${Date.now()}`, publishDate: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) };
      setBlogsList(prev => [...prev, newItem]);
      await fetch(`${BACKEND_URL}/api/blogs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });
    } else {
      const id = blogForm.id;
      setBlogsList(prev => prev.map(b => b.id === id ? blogForm : b));
      await fetch(`${BACKEND_URL}/api/blogs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blogForm)
      });
    }
    setActiveModal(null);
  };

  const handleDeleteBlog = async (id: string) => {
    if (!window.confirm('Delete this blog post?')) return;
    setBlogsList(prev => prev.filter(b => b.id !== id));
    await fetch(`${BACKEND_URL}/api/blogs/${id}`, { method: 'DELETE' });
  };

  const handleSaveResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeModal?.type === 'add') {
      const newItem = { ...resourceForm, id: `res-${Date.now()}`, downloadCount: 0 };
      setResourcesList(prev => [...prev, newItem]);
      await fetch(`${BACKEND_URL}/api/resources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });
    } else {
      const id = resourceForm.id;
      setResourcesList(prev => prev.map(r => r.id === id ? resourceForm : r));
      await fetch(`${BACKEND_URL}/api/resources/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resourceForm)
      });
    }
    setActiveModal(null);
  };

  const handleDeleteResource = async (id: string) => {
    setResourcesList(prev => prev.filter(r => r.id !== id));
    await fetch(`${BACKEND_URL}/api/resources/${id}`, { method: 'DELETE' });
  };

  const handleDeleteCourse = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this course? It will be removed from the public website in real time.')) return;
    setCoursesList(prev => prev.filter(c => c.id !== id));
    await fetch(`${BACKEND_URL}/api/lms/courses/${id}`, { method: 'DELETE' });
  };

  if (!adminToken) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'linear-gradient(135deg, #020617 0%, #0F172A 100%)' }}>
        <form onSubmit={handleAdminLogin} className="w-full max-w-sm bg-slate-900/80 backdrop-blur-md border border-white/10 p-8 space-y-6 shadow-2xl rounded-3xl">
          <div className="space-y-1">
            <h1 className="text-xl font-heading font-extrabold tracking-tight text-white">Final Attempt <span className="text-amber-400">IAS</span></h1>
            <p className="text-xs text-slate-400">Administration Console Sign-In</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Address</label>
              <input
                type="email"
                required
                placeholder="admin@finalattempt.com"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/60 text-white placeholder:text-slate-600 text-xs rounded-2xl outline-none focus:border-amber-500/50 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/60 text-white placeholder:text-slate-600 text-xs rounded-2xl outline-none focus:border-amber-500/50 transition-colors"
              />
            </div>
          </div>

          {authError && <p className="text-xs text-red-400 font-semibold">{authError}</p>}

          <button
            type="submit"
            className="w-full py-3 text-white transition-all font-bold text-xs rounded-2xl shadow-lg hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)', boxShadow: '0 4px 24px rgba(217,119,6,0.25)' }}
          >
            Authenticate
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-[var(--text-color)] font-body flex flex-col lg:flex-row bg-[var(--bg-color)] transition-colors duration-200">
      {/* SIDEBAR PANEL */}
      <aside className={`w-full lg:w-64 lg:h-screen lg:sticky lg:top-0 border-b lg:border-b-0 lg:border-r flex flex-col justify-between shrink-0 bg-[var(--card-bg)] border-[var(--card-border)] z-40 transition-all duration-300 ${isSidebarOpen ? 'block' : 'hidden lg:flex'}`}>
        <div className="p-6 space-y-6 overflow-y-auto max-h-screen">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <div className="relative w-40 h-10 shrink-0">
                <img
                  src="/darklogofull.png"
                  alt="Final Attempt"
                  className="w-full h-full object-contain logo-light"
                />
                <img
                  src="/lightlogofull.png"
                  alt="Final Attempt"
                  className="w-full h-full object-contain logo-dark"
                />
              </div>
            </div>
            {/* Mobile Close Button */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white"
              aria-label="Close Sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex flex-col gap-1.5">
            {[
              { id: 'Dashboard', icon: LayoutDashboard },
              { id: 'Settings', icon: Settings },
              ...(settings.featureFlags?.livePageBuilder !== false ? [{ id: 'Custom Pages', icon: FileText }] : []),
              { id: 'Students', icon: Users },
              { id: 'Courses', icon: BookOpen },
              { id: 'Test Series', icon: FileText },
              { id: 'Leads', icon: MessageSquare },
              { id: 'Media Library', icon: FolderOpen },
              { id: 'Exams & Syllabus', icon: Layers },
              { id: 'PYQs Manager', icon: FileText },
              { id: 'Strategy & Values', icon: Bookmark },
              ...(settings.featureFlags?.currentAffairsFilters !== false ? [{ id: 'Current Affairs', icon: FileText }] : []),
              { id: 'Blogs', icon: Bookmark },
              ...(isSuperAdmin ? [{ id: 'Super Admin Console', icon: Award }] : [])
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`flex items-center gap-3 px-4 py-3 text-xs font-bold transition-all text-left rounded-2xl border ${activeTab === tab.id
                  ? 'text-white border-amber-600 shadow-md'
                  : 'text-slate-600 hover:bg-amber-500/10 hover:text-amber-800 border-transparent'
                  }`}
                style={activeTab === tab.id ? { background: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)', borderColor: '#D97706' } : {}}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.id}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6 border-t" style={{ borderColor: 'rgba(245,158,11,0.15)' }}>
          <button
            onClick={handleAdminLogout}
            className="text-xs font-bold text-slate-500 hover:text-amber-600 flex items-center gap-2 text-left"
          >
            <LogOut className="w-4 h-4 text-amber-600" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN MAIN PANEL */}
      <main className="flex-grow p-6 sm:p-10 space-y-8 overflow-y-auto max-h-screen relative">
        {/* TOP STATUS */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="flex items-center gap-3">
            {/* Mobile Sidebar Open Toggle */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-slate-700 dark:text-slate-300"
              aria-label="Open Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">CMS Console</span>
              <h2 className="text-2xl font-heading font-extrabold text-slate-900 dark:text-white mt-0.5">{activeTab} Editor</h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors rounded-2xl shadow-sm text-slate-700 dark:text-slate-350 cursor-pointer"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-500" />}
            </button>
            <button
              onClick={fetchCMSData}
              className="p-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors rounded-2xl shadow-sm text-slate-700 dark:text-slate-350 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            {backendOffline && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-600 text-xs font-bold rounded-2xl">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Offline Fallback</span>
              </div>
            )}
          </div>
        </div>

        {/* TAB 1: DASHBOARD */}
        {activeTab === 'Dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Registered Users', value: usersList.length.toString(), desc: 'Active student profiles', icon: Users, color: 'text-blue-500' },
                { label: 'LMS Courses', value: coursesList.length.toString(), desc: 'Published programs & batches', icon: BookOpen, color: 'text-amber-500' },
                { label: 'Total Enquiries', value: leadsList.length.toString(), desc: 'Direct lead records', icon: MessageSquare, color: 'text-emerald-500' },
                { label: 'Current Articles', value: caList.length.toString(), desc: 'Magazine current affairs', icon: FileText, color: 'text-purple-500' }
              ].map((metric, idx) => (
                <div key={idx} className="p-5 bg-white border border-slate-200 space-y-3 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-slate-555 font-bold uppercase tracking-wider">{metric.label}</span>
                    <metric.icon className={`w-4 h-4 ${metric.color}`} />
                  </div>
                  <p className="text-2xl font-extrabold text-slate-900">{metric.value}</p>
                  <p className="text-[10px] text-slate-400 font-semibold">{metric.desc}</p>
                </div>
              ))}
            </div>

            <div className="p-6 bg-white border border-slate-200 space-y-4 rounded-3xl shadow-sm">
              <h3 className="font-bold text-sm text-slate-950">Live Site Information</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Site parameters and database records are synchronized in real-time. Changing values inside these CMS directories pushes updates instantly to the public site layouts.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: SETTINGS */}
        {activeTab === 'Settings' && (
          <div className="p-6 sm:p-8 bg-white border border-slate-200 w-full rounded-3xl shadow-sm">
            <form onSubmit={handleSaveSettings} className="space-y-6">
              <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-3">
                Homepage Hero Configurations
              </h3>

              {/* ── Hero Background Image ─────────────────────────── */}
              <div className="space-y-3">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <svg className="w-3 h-3 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9l4-4 4 4 4-5 6 7" /><circle cx="8.5" cy="8.5" r="1.5" /></svg>
                  Hero Background Image
                </label>

                {/* Multi-Image Live Slider Gallery Preview */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      Active Hero Slider Images ({settings.heroImageUrl ? settings.heroImageUrl.split(',').map(s => s.trim()).filter(Boolean).length : 1})
                    </span>
                    {settings.heroImageUrl && (
                      <button
                        type="button"
                        onClick={() => setSettings(prev => ({ ...prev, heroImageUrl: '' }))}
                        className="text-[10px] font-bold text-red-500 hover:text-red-700 hover:underline cursor-pointer"
                      >
                        Clear All Custom Images
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {(settings.heroImageUrl ? settings.heroImageUrl.split(',').map(s => s.trim()).filter(Boolean) : ["https://upload.wikimedia.org/wikipedia/commons/f/f6/Front_view_of_bihar_vidhan_sabha.jpg"]).map((url, idx) => (
                      <div key={idx} className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 group">
                        <img
                          src={url}
                          alt={`Hero Slide ${idx + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = ''; }}
                        />
                        <span className="absolute top-1.5 left-1.5 text-[9px] font-extrabold text-amber-500 bg-slate-950/80 px-2 py-0.5 rounded-md border border-amber-500/20">
                          Slide #{idx + 1}
                        </span>
                        {settings.heroImageUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              const list = settings.heroImageUrl ? settings.heroImageUrl.split(',').map(s => s.trim()).filter(Boolean) : [];
                              list.splice(idx, 1);
                              setSettings(prev => ({ ...prev, heroImageUrl: list.join(', ') }));
                            }}
                            className="absolute top-1.5 right-1.5 p-1 bg-red-500 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-sm"
                            title="Remove slide image"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Media Library Selector */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setMediaPickerConfig({ isOpen: true, field: 'heroImageUrl', allowedTypes: ['IMAGE'] })}
                    className="relative flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-slate-300 hover:border-amber-400 hover:bg-amber-50 text-slate-600 hover:text-amber-600 rounded-2xl cursor-pointer transition-all text-xs font-semibold"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    + Add Image from Media Library (DAM)
                  </button>
                </div>

                {/* Direct Comma-Separated URL Input */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">— or paste image URLs directly (comma-separated for multi-slides) —</label>
                  <textarea
                    rows={2}
                    placeholder="https://example.com/slide1.jpg, https://example.com/slide2.jpg"
                    value={settings.heroImageUrl || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, heroImageUrl: e.target.value }))}
                    className="w-full px-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none text-slate-900 font-mono placeholder:font-sans placeholder:text-slate-300"
                  />
                  <p className="text-[9px] text-slate-400 font-medium">
                    Supports unlimited dynamic slider background images. Pick from DAM Media Manager or paste image URLs separated by commas.
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-5 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Main Tagline</label>
                  <input
                    type="text"
                    value={settings.tagline}
                    onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                    className="w-full px-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:border-slate-400 outline-none text-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hero Main Title</label>
                  <input
                    type="text"
                    value={settings.heroTitle}
                    onChange={(e) => setSettings({ ...settings, heroTitle: e.target.value })}
                    className="w-full px-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:border-slate-400 outline-none text-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hero Subtitle</label>
                  <textarea
                    value={settings.heroSubtitle}
                    rows={3}
                    onChange={(e) => setSettings({ ...settings, heroSubtitle: e.target.value })}
                    className="w-full px-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:border-slate-400 outline-none text-slate-900"
                  />
                </div>
              </div>

              {/* ── Contact Page CMS Configurations ───────────────────── */}
              <div className="border-t border-slate-200 pt-6 space-y-4">
                <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <span>📞 Contact Page CMS Configurations</span>
                </h3>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Contact Page Title</label>
                  <input
                    type="text"
                    placeholder="Connect With Final Attempt"
                    value={settings.contactTitle || ''}
                    onChange={(e) => setSettings({ ...settings, contactTitle: e.target.value })}
                    className="w-full px-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:border-slate-400 outline-none text-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Contact Page Subtitle</label>
                  <textarea
                    rows={2}
                    placeholder="Have questions about the BPSC micro-schedule..."
                    value={settings.contactSubtitle || ''}
                    onChange={(e) => setSettings({ ...settings, contactSubtitle: e.target.value })}
                    className="w-full px-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:border-slate-400 outline-none text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Admission Helpline Phone</label>
                    <input
                      type="text"
                      placeholder="+91 97099 92093"
                      value={settings.contactPhone || ''}
                      onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                      className="w-full px-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:border-slate-400 outline-none text-slate-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Support Email</label>
                    <input
                      type="text"
                      placeholder="enquiry@finalattemptias.com"
                      value={settings.contactEmail || ''}
                      onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                      className="w-full px-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:border-slate-400 outline-none text-slate-900"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Corporate Centre Address</label>
                  <input
                    type="text"
                    placeholder="2nd Floor, Opposite Verma Centre..."
                    value={settings.contactAddress || ''}
                    onChange={(e) => setSettings({ ...settings, contactAddress: e.target.value })}
                    className="w-full px-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:border-slate-400 outline-none text-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Working Hours</label>
                  <input
                    type="text"
                    placeholder="Monday - Sunday: 9:00 AM - 7:00 PM"
                    value={settings.contactHours || ''}
                    onChange={(e) => setSettings({ ...settings, contactHours: e.target.value })}
                    className="w-full px-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:border-slate-400 outline-none text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">WhatsApp Link</label>
                    <input
                      type="text"
                      placeholder="https://wa.me/919709992093"
                      value={settings.whatsappLink || ''}
                      onChange={(e) => setSettings({ ...settings, whatsappLink: e.target.value })}
                      className="w-full px-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:border-slate-400 outline-none text-slate-900 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Telegram Link</label>
                    <input
                      type="text"
                      placeholder="https://t.me/Finalattemptofficial"
                      value={settings.telegramLink || ''}
                      onChange={(e) => setSettings({ ...settings, telegramLink: e.target.value })}
                      className="w-full px-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:border-slate-400 outline-none text-slate-900 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Google Map Embed URL</label>
                  <textarea
                    rows={2}
                    placeholder="https://www.google.com/maps/embed?..."
                    value={settings.googleMapUrl || ''}
                    onChange={(e) => setSettings({ ...settings, googleMapUrl: e.target.value })}
                    className="w-full px-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:border-slate-400 outline-none text-slate-900 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase rounded-2xl shadow-md transition-all cursor-pointer"
              >
                💾 Save All Configurations
              </button>
            </form>

            {/* YouTube Synchronizer Dashboard */}
            <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-sm space-y-6 mt-8">
              <div className="border-b border-slate-100 pb-4 space-y-1">
                <h3 className="font-heading font-extrabold text-sm text-slate-900">YouTube Channel Automatic Sync</h3>
                <p className="text-[10px] text-slate-500 font-medium">
                  Direct connection with YouTube Data API v3. Synchronizes content from `@finalattemptofficial` every 30 minutes.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                  <span className="block text-[9px] uppercase font-bold text-slate-400">Last Sync Time</span>
                  <span className="text-xs font-bold text-slate-800">
                    {youtubeStatus.lastSyncTime ? youtubeStatus.lastSyncTime : 'Never Synced'}
                  </span>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                  <span className="block text-[9px] uppercase font-bold text-slate-400">Videos Synced</span>
                  <span className="text-xs font-bold text-slate-800">{youtubeStatus.videosSynced}</span>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                  <span className="block text-[9px] uppercase font-bold text-slate-400">Sync Status</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${youtubeStatus.status === 'SUCCESS'
                      ? 'bg-emerald-50 text-emerald-705 border-emerald-200'
                      : youtubeStatus.status === 'FAILURE'
                        ? 'bg-red-50 text-red-705 border-red-200'
                        : 'bg-blue-50 text-blue-705 border-blue-200'
                    }`}>
                    {youtubeStatus.status}
                  </span>
                </div>
              </div>

              {youtubeStatus.error && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-800 rounded-2xl text-xs font-medium space-y-1">
                  <span className="block text-[9px] uppercase font-bold text-red-500">Last Execution Error</span>
                  <p>{youtubeStatus.error}</p>
                </div>
              )}

              <button
                type="button"
                disabled={syncingYoutube}
                onClick={handleTriggerYoutubeSync}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-slate-950 font-bold text-xs uppercase rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer w-full md:w-auto"
              >
                {syncingYoutube ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Synchronizing YouTube...</span>
                  </>
                ) : (
                  <>
                    <span>🔄 Sync YouTube Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* TAB: SUPER ADMIN CONSOLE */}
        {activeTab === 'Super Admin Console' && isSuperAdmin && (
          <div className="space-y-8">
            <div className="bg-gradient-to-br from-slate-900 to-amber-950 border border-amber-500/30 p-8 rounded-3xl text-white space-y-4 shadow-2xl relative overflow-hidden">
              <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/20 border border-amber-500/30 px-3 py-1 rounded-xl inline-block">
                👑 Super Admin Master Console
              </span>
              <h2 className="text-2xl sm:text-3xl font-heading font-black">Platform Master Controls & Feature Toggles</h2>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                As Super Admin, you have full unrestricted access to system-wide flags, offline store overrides, database reset options, user roles management, and CMS permissions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-6 rounded-3xl space-y-4 shadow-sm md:col-span-2">
                <h3 className="font-heading font-extrabold text-slate-900 dark:text-white text-sm flex items-center justify-between">
                  <span>⚡ Master Feature Toggle Controls</span>
                  <span className="text-[10px] text-amber-500 font-bold uppercase">Real-Time Sync</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: 'livePageBuilder', title: 'Live Custom Page Builder', desc: 'Allow admins to create /page/[slug] live pages' },
                    { key: 'richTextPopup', title: 'Rich Text Popup Canvas', desc: 'Full-screen editor & table width resizer' },
                    { key: 'currentAffairsFilters', title: 'Dynamic Current Affairs', desc: 'Daily, Weekly, Monthly, Yearly compendiums' },
                    { key: 'youtubeAutoSync', title: 'YouTube Auto-Sync Engine', desc: 'Automated video sync from official channel' },
                    { title: 'Syllabus PDF In-App Previewer', key: 'pdfPreviewer', desc: 'Modal PDF reader overlay on syllabus' },
                    { title: 'Public User Registration', key: 'allowRegistration', desc: 'Enable student self-registration flow' }
                  ].map((feat) => {
                    const isEnabled = settings.featureFlags?.[feat.key] !== false;
                    const toggleFeature = async () => {
                      const updatedFlags = {
                        ...settings.featureFlags,
                        [feat.key]: !isEnabled
                      };
                      const updatedSettings = { ...settings, featureFlags: updatedFlags };
                      setSettings(updatedSettings);
                      try {
                        await fetch(`${BACKEND_URL}/api/settings`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(updatedSettings)
                        });
                      } catch (err) {
                        console.error('Failed toggling feature:', err);
                      }
                    };

                    return (
                      <div key={feat.key} className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5 rounded-2xl">
                        <div className="space-y-0.5 pr-2">
                          <h4 className="font-bold text-xs text-slate-900 dark:text-white">{feat.title}</h4>
                          <p className="text-[10px] text-slate-400 leading-tight">{feat.desc}</p>
                        </div>
                        <button
                          type="button"
                          onClick={toggleFeature}
                          className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ${isEnabled ? 'bg-emerald-500 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'}`}
                        >
                          <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-6 rounded-3xl space-y-4 shadow-sm">
                <h3 className="font-heading font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <span>🔑 Super Admin Passkeys</span>
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl space-y-1">
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">Super Admin Email</span>
                    <p className="font-mono font-bold text-slate-900 dark:text-white text-xs">superadmin@finalattempt.com</p>
                  </div>
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl space-y-1">
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">Master Access Key</span>
                    <p className="font-mono font-bold text-slate-900 dark:text-white text-xs">SuperAdminSecret#2026</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-6 rounded-3xl space-y-4 shadow-sm">
                <h3 className="font-heading font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <span>🛡️ System Diagnostic & Overrides</span>
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={fetchCMSData}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-2xl transition-all cursor-pointer"
                  >
                    🔄 Force Refresh All CMS Stores
                  </button>
                  <button
                    onClick={handleTriggerYoutubeSync}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-2xl transition-all cursor-pointer"
                  >
                    ▶️ Run Manual YouTube Sync
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: CUSTOM PAGES */}
        {activeTab === 'Custom Pages' && (
          <div className="space-y-6">
            <CustomPagesCMS />
          </div>
        )}

        {/* TAB: MEDIA LIBRARY */}
        {activeTab === 'Media Library' && (
          <div className="space-y-6">
            <MediaDashboard />
          </div>
        )}

        {/* TAB: EXAMS & SYLLABUS */}
        {activeTab === 'Exams & Syllabus' && (
          <div className="space-y-6">
            <SyllabusStrategyCMS defaultTab="exams" />
          </div>
        )}

        {/* TAB: PYQS MANAGER */}
        {activeTab === 'PYQs Manager' && (
          <div className="space-y-6">
            <PYQsManagerCMS />
          </div>
        )}

        {/* TAB: STRATEGY & VALUES CMS */}
        {(activeTab === 'Strategy & Values' || activeTab === 'Strategy CMS') && (
          <div className="space-y-6">
            <SyllabusStrategyCMS defaultTab="strategy" />
          </div>
        )}

        {/* TAB: VALUES CMS */}
        {activeTab === 'Values CMS' && (
          <div className="space-y-6">
            <SyllabusStrategyCMS defaultTab="values" />
          </div>
        )}

        {/* TAB 3: LEADS */}
        {activeTab === 'Leads' && (
          <div className="space-y-6">
            <h3 className="font-extrabold text-sm text-slate-900">Leads & Enquiries</h3>
            <div className="bg-white border border-slate-200 overflow-hidden rounded-3xl shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                    <th className="p-4">Name</th>
                    <th className="p-4">Mobile</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Exam Program</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Created Date</th>
                  </tr>
                </thead>
                <tbody>
                  {leadsList.map((lead) => (
                    <tr key={lead.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="p-4 font-bold">{lead.fullName}</td>
                      <td className="p-4 font-mono">{lead.mobile}</td>
                      <td className="p-4 text-slate-500">{lead.email || '-'}</td>
                      <td className="p-4">{lead.targetExam}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 border text-[9px] font-bold uppercase tracking-wider bg-slate-50 text-slate-700 rounded-full border-slate-200">
                          {lead.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400">{new Date(lead.createdAt).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeTab === 'Students' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white/70 backdrop-blur-md p-5 rounded-3xl border border-slate-200 shadow-xs">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Enrolled Students & Registered Users</h3>
                <p className="text-[10px] text-slate-500 font-medium">Complete record of registered users, target exams, course enrollments, batch allocations, and payment transaction IDs.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
                  Total Users: {usersList.length}
                </span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 overflow-hidden rounded-3xl shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                      <th className="p-4">Student Info</th>
                      <th className="p-4">Mobile & Email</th>
                      <th className="p-4">Target Exam</th>
                      <th className="p-4">Course Enrolled</th>
                      <th className="p-4">Batch</th>
                      <th className="p-4">Payment ID & Status</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Account Status</th>
                      <th className="p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-slate-400 text-xs">No registered users or students found.</td>
                      </tr>
                    ) : (
                      usersList.map((user) => {
                        const hasEnrollments = user.enrollments && user.enrollments.length > 0;
                        return (
                          <tr
                            key={user.id}
                            className="border-b border-slate-100 hover:bg-amber-500/5 transition-colors cursor-pointer"
                            onClick={() => {
                              setSelectedUserModal(user);
                              setEditUserForm({ ...user });
                            }}
                          >
                            {/* Student Info */}
                            <td className="p-4">
                              <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                <span>{user.fullName}</span>
                                {user.role === 'admin' && <span className="text-[10px]">👑</span>}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {user.id.slice(0, 8)}...</div>
                              <div className="mt-1">
                                <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${
                                  user.role === 'admin' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                                  user.role === 'faculty' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                                }`}>
                                  {user.role}
                                </span>
                              </div>
                            </td>

                            {/* Mobile & Email */}
                            <td className="p-4">
                              <div className="font-mono text-slate-900 font-semibold">{user.mobile || '-'}</div>
                              <div className="text-[10px] text-slate-500">{user.email}</div>
                            </td>

                            {/* Target Exam */}
                            <td className="p-4">
                              <span className="font-medium text-slate-700">{user.targetExam || 'General BPSC'}</span>
                            </td>

                            {/* Course Enrolled */}
                            <td className="p-4">
                              {hasEnrollments ? (
                                <div className="space-y-1">
                                  {user.enrollments!.map((enr, i) => (
                                    <div key={i} className="font-bold text-blue-700 text-xs">
                                      {enr.courseTitle}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-slate-400 text-[11px] italic">Not Enrolled Yet</span>
                              )}
                            </td>

                            {/* Batch */}
                            <td className="p-4">
                              {hasEnrollments ? (
                                <div className="space-y-1">
                                  {user.enrollments!.map((enr, i) => (
                                    <span key={i} className="inline-block px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-md text-[10px] font-semibold">
                                      {enr.batch}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-slate-400 text-[11px]">-</span>
                              )}
                            </td>

                            {/* Payment ID & Status */}
                            <td className="p-4">
                              {hasEnrollments ? (
                                <div className="space-y-1">
                                  {user.enrollments!.map((enr, i) => (
                                    <div key={i}>
                                      <div className="font-mono text-[10px] font-semibold text-slate-800">{enr.paymentOrderId}</div>
                                      <span className={`inline-block px-2 py-0.2 rounded-full text-[9px] font-bold uppercase mt-0.5 ${
                                        enr.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                                        enr.paymentStatus === 'pending' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                                        'bg-slate-100 text-slate-600'
                                      }`}>
                                        {enr.paymentStatus}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-slate-400 text-[11px]">-</span>
                              )}
                            </td>

                            {/* Amount Paid */}
                            <td className="p-4">
                              {hasEnrollments ? (
                                <div className="space-y-1 font-mono font-bold text-slate-900">
                                  {user.enrollments!.map((enr, i) => (
                                    <div key={i}>
                                      {enr.amountPaid ? `₹${(enr.amountPaid / (enr.amountPaid > 10000 ? 100 : 1)).toLocaleString('en-IN')}` : '₹0 (Free)'}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-slate-400 text-[11px]">-</span>
                              )}
                            </td>

                            {/* Account Status Toggle */}
                            <td className="p-4" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={async () => {
                                  const newStatus = !user.isActive;
                                  await fetch(`${BACKEND_URL}/api/auth/users/${user.id}/status`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ isActive: newStatus })
                                  });
                                  setUsersList(prev => prev.map(u => u.id === user.id ? { ...u, isActive: newStatus } : u));
                                }}
                                className={`px-3 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer border ${
                                  user.isActive
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                    : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                                }`}
                              >
                                {user.isActive ? 'Active' : 'Suspended'}
                              </button>
                            </td>

                            {/* Actions Button */}
                            <td className="p-4" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => {
                                  setSelectedUserModal(user);
                                  setEditUserForm({ ...user });
                                }}
                                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Edit User</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: CURRENT AFFAIRS (UNIFIED & FEATURE-RICH) */}
        {activeTab === 'Current Affairs' && (
          <div className="space-y-6">
            {/* Sub-tabs Selector */}
            <div className="flex gap-2 bg-slate-100/85 dark:bg-white/[0.02] p-1.5 rounded-2xl max-w-lg">
              <button
                type="button"
                onClick={() => setCaSubTab('daily')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  caSubTab === 'daily'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                📅 Daily Digest Editions (Bihar, National, International)
              </button>
              <button
                type="button"
                onClick={() => setCaSubTab('mains')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  caSubTab === 'mains'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                📝 Mains & GS Papers Articles
              </button>
            </div>

            {caSubTab === 'daily' ? (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Daily Digest Editions</h3>
                    <p className="text-[10px] text-slate-500">Add or edit multi-column daily current affairs feeds for students.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setEditingEdition({ id: '', publishDate: new Date().toISOString().split('T')[0], summary: 'Weekly Compilation Digest', articles: [] });
                        setIsEditionModalOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-2xl text-xs shadow-sm cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create Weekly Edition</span>
                    </button>
                    <button
                      onClick={() => {
                        setEditingEdition({ id: '', publishDate: new Date().toISOString().split('T')[0], summary: 'Monthly Compendium Edition', articles: [] });
                        setIsEditionModalOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl text-xs shadow-sm cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create Monthly Edition</span>
                    </button>
                    <button
                      onClick={() => {
                        setEditingEdition({ id: '', publishDate: new Date().toISOString().split('T')[0], summary: 'Yearly Compilation Booklet', articles: [] });
                        setIsEditionModalOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-2xl text-xs shadow-sm cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create Yearly Edition</span>
                    </button>
                    <button
                      onClick={() => {
                        setEditingEdition({ id: '', publishDate: new Date().toISOString().split('T')[0], summary: '', articles: [] });
                        setIsEditionModalOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-850 text-white font-bold rounded-2xl text-xs shadow-sm cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create Daily Edition</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {dynamicEditionsList.map((ed) => {
                    const natCount = ed.articles?.filter((a: any) => a.category === 'NATIONAL').length || 0;
                    const intCount = ed.articles?.filter((a: any) => a.category === 'INTERNATIONAL').length || 0;
                    const bihCount = ed.articles?.filter((a: any) => a.category === 'BIHAR').length || 0;

                    return (
                      <div key={ed.id} className="p-5 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/[0.06] rounded-3xl shadow-sm flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                            <span>DATE: {ed.publishDate}</span>
                            <span className="text-amber-500">{ed.articles?.length || 0} ARTICLES</span>
                          </div>
                          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Daily Edition Summary</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{ed.summary || 'No summary overview provided.'}</p>

                          <div className="flex gap-2 pt-2 text-[10px] font-semibold text-slate-500">
                            <span className="bg-amber-500/5 text-amber-600 px-2 py-0.5 rounded-lg">Nat ({natCount})</span>
                            <span className="bg-indigo-500/5 text-indigo-600 px-2 py-0.5 rounded-lg">Int ({intCount})</span>
                            <span className="bg-emerald-500/5 text-emerald-600 px-2 py-0.5 rounded-lg">Bihar ({bihCount})</span>
                          </div>
                        </div>

                        <div className="flex gap-2 border-t border-slate-50 dark:border-white/[0.02] pt-4 mt-2">
                          <button
                            onClick={() => {
                              setEditingEdition(ed);
                              setIsEditionModalOpen(true);
                            }}
                            className="flex-1 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer flex justify-center items-center gap-1"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit Edition</span>
                          </button>
                          <button
                            onClick={() => handleDeleteDynamicEdition(ed.id)}
                            className="p-2 border border-red-150 rounded-xl hover:bg-red-500 hover:text-white text-red-500 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Current Affairs GS/Mains Articles</h3>
                    <p className="text-[10px] text-slate-500">Publish descriptive topic analyses, editorials, and GS syllabus-aligned articles.</p>
                  </div>
                  <button
                    onClick={() => {
                      setCaForm({ id: '', title: '', category: 'GS Paper II', publishDate: '', summary: '', content: '', relevance: '', context: '', analysis: '', wayForward: '', practiceQuestion: '' });
                      setActiveModal({ type: 'add' });
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-850 text-white font-bold rounded-2xl text-xs shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Article</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {caList.map((article, idx) => (
                    <div key={article.id} className="p-5 bg-white border border-slate-200 flex justify-between items-start rounded-3xl shadow-sm">
                      <div className="space-y-2">
                        <div className="flex gap-2 items-center text-[10px] font-bold text-slate-500">
                          <span className="text-blue-600">{article.category}</span>
                          <span>&bull;</span>
                          <span>{article.publishDate}</span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900">{article.title}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{article.summary}</p>
                      </div>

                      <div className="flex gap-2 shrink-0 ml-4">
                        <button
                          onClick={() => {
                            setCaForm(article);
                            setActiveModal({ type: 'edit', index: idx });
                          }}
                          className="p-2 border border-slate-200 rounded-xl hover:bg-slate-55 text-slate-600"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCA(article.id)}
                          className="p-2 border border-red-100 rounded-xl hover:bg-red-650 hover:text-white text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal add/edit CA (Mains GS Articles) */}
            {activeModal && activeTab === 'Current Affairs' && (
              <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <form onSubmit={handleSaveCA} className="bg-white border border-slate-200 p-6 rounded-3xl max-w-xl w-full space-y-4 shadow-2xl">
                  <h3 className="font-extrabold text-sm text-slate-900">
                    {activeModal.type === 'add' ? 'Add Current Affairs Article' : 'Edit Current Affairs Article'}
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Article Title</label>
                      <input
                        type="text" required value={caForm.title}
                        onChange={(e) => setCaForm({ ...caForm, title: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:border-slate-400 outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Category</label>
                      <select
                        value={caForm.category}
                        onChange={(e) => setCaForm({ ...caForm, category: e.target.value as any })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:border-slate-400 outline-none"
                      >
                        <option>GS Paper I</option>
                        <option>GS Paper II</option>
                        <option>GS Paper III</option>
                        <option>Bihar Special</option>
                        <option>Editorials</option>
                      </select>
                    </div>
                  </div>

                  <div className="max-h-[50vh] overflow-y-auto space-y-4 pr-1">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Relevance (GS Syllabus Mapping)</label>
                      <input
                        type="text" value={caForm.relevance || ''}
                        onChange={(e) => setCaForm({ ...caForm, relevance: e.target.value })}
                        placeholder="e.g. GS Paper II: Constitutional Autonomy..."
                        className="w-full px-4 py-2 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:border-slate-400 outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Why in News? (Context)</label>
                      <textarea
                        rows={2} value={caForm.context || ''}
                        onChange={(e) => setCaForm({ ...caForm, context: e.target.value })}
                        placeholder="Explain the background trigger context..."
                        className="w-full px-4 py-2 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:border-slate-400 outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Short Summary (Blurb)</label>
                      <textarea
                        rows={2} required value={caForm.summary}
                        onChange={(e) => setCaForm({ ...caForm, summary: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:border-slate-400 outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Article Content (Rich Editor)</label>
                      <RichTextEditor
                        value={caForm.content || ''}
                        onChange={(html) => setCaForm({ ...caForm, content: html })}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Way Forward (Recommendations)</label>
                      <textarea
                        rows={2} value={caForm.wayForward || ''}
                        onChange={(e) => setCaForm({ ...caForm, wayForward: e.target.value })}
                        placeholder="Provide closing policy recommendation details..."
                        className="w-full px-4 py-2 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:border-slate-400 outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Practice Question (Mains/MCQ Challenge)</label>
                      <textarea
                        rows={2} value={caForm.practiceQuestion || ''}
                        onChange={(e) => setCaForm({ ...caForm, practiceQuestion: e.target.value })}
                        placeholder="Enter the practice question based on this article..."
                        className="w-full px-4 py-2 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:border-slate-400 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-2xl">
                      Cancel
                    </button>
                    <button type="submit" className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl">
                      Publish Article
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Daily Edition Designer Modal */}
            {isEditionModalOpen && editingEdition && (
              <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] p-6 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl relative">
                  <div className="flex justify-between items-center border-b pb-4">
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                      {editingEdition.id ? 'Edit Daily Current Affairs Edition' : 'Create Daily Current Affairs Edition'}
                    </h3>
                    <button
                      type="button" onClick={() => setIsEditionModalOpen(false)}
                      className="text-slate-400 hover:text-slate-650 cursor-pointer font-bold text-sm"
                    >
                      ✕ Close
                    </button>
                  </div>

                  <form onSubmit={handleSaveDynamicEdition} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">Publish Date <span className="text-red-500">*</span></label>
                        <input
                          type="date" required value={editingEdition.publishDate}
                          onChange={(e) => setEditingEdition({ ...editingEdition, publishDate: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:border-slate-400 outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">Edition Summary Brief</label>
                        <input
                          type="text" value={editingEdition.summary || ''}
                          onChange={(e) => setEditingEdition({ ...editingEdition, summary: e.target.value })}
                          placeholder="Quick summary summary mapping the day's highlights..."
                          className="w-full px-4 py-2 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:border-slate-400 outline-none"
                        />
                      </div>
                    </div>

                    {/* CATEGORY COLUMNS */}
                    <div className="space-y-6 pt-4 border-t">
                      <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Edition Article Layout</h4>

                      {(['BIHAR', 'NATIONAL', 'INTERNATIONAL'] as const).map(cat => {
                        const catArticles = (editingEdition.articles || []).filter((a: any) => a.category === cat);
                        return (
                          <div key={cat} className="p-4 bg-slate-50 dark:bg-slate-950/20 rounded-2xl space-y-3 border border-slate-100 dark:border-white/[0.04]">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-350">{cat} Section ({catArticles.length})</span>
                              <button
                                type="button" onClick={() => handleAddArticleToEdition(cat)}
                                className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-bold rounded-lg cursor-pointer"
                              >
                                + Add {cat === 'BIHAR' ? 'Bihar' : cat === 'NATIONAL' ? 'National' : 'International'} Article
                              </button>
                            </div>

                            <div className="space-y-2">
                              {catArticles.length === 0 ? (
                                <p className="text-[10px] text-slate-450 italic">No articles mapped in this category yet.</p>
                              ) : (
                                catArticles.map((art: any) => (
                                  <div key={art.id} className="flex justify-between items-center p-3 bg-white dark:bg-slate-900 border border-slate-150 dark:border-white/[0.04] rounded-xl">
                                    <div>
                                      <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">{art.title}</h5>
                                      <span className="text-[9px] font-semibold text-slate-400">{art.importance} Importance &bull; {art.readingTime}</span>
                                    </div>
                                    <div className="flex gap-2">
                                      <button
                                        type="button" onClick={() => {
                                          setEditingArticle(art);
                                          setIsArticleModalOpen(true);
                                        }}
                                        className="p-1.5 border border-slate-250 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer"
                                      >
                                        <Edit3 className="w-3 h-3" />
                                      </button>
                                      <button
                                        type="button" onClick={() => handleDeleteArticleFromEdition(art.id)}
                                        className="p-1.5 border border-red-200 rounded-lg hover:bg-red-50 text-red-500 cursor-pointer"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                      <button
                        type="button" onClick={() => setIsEditionModalOpen(false)}
                        className="px-4 py-2 border border-slate-300 text-slate-700 dark:text-slate-350 text-xs font-semibold rounded-2xl cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2 bg-slate-900 hover:bg-slate-850 dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-slate-950 text-white text-xs font-bold rounded-2xl cursor-pointer"
                      >
                        Publish Daily Edition
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Dynamic Article Creator Sub-Modal */}
            {isArticleModalOpen && editingArticle && (
              <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] p-6 rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-y-auto space-y-6 shadow-2xl relative">
                  <div className="flex justify-between items-center border-b pb-4">
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      Add / Edit Article ({activeArticleCategory})
                    </h3>
                    <button
                      type="button" onClick={() => setIsArticleModalOpen(false)}
                      className="text-slate-400 hover:text-slate-650 cursor-pointer font-bold text-xs"
                    >
                      ✕ Close
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Basic Meta */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">Article Title <span className="text-red-500">*</span></label>
                        <input
                          type="text" required value={editingArticle.title}
                          onChange={(e) => setEditingArticle({ ...editingArticle, title: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:border-slate-400 outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">URL Slug (leave empty to auto-generate)</label>
                        <input
                          type="text" value={editingArticle.slug || ''}
                          onChange={(e) => setEditingArticle({ ...editingArticle, slug: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:border-slate-400 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">Importance</label>
                        <select
                          value={editingArticle.importance}
                          onChange={(e) => setEditingArticle({ ...editingArticle, importance: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:border-slate-400 outline-none"
                        >
                          <option>HIGH</option>
                          <option>MEDIUM</option>
                          <option>LOW</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">Reading Time</label>
                        <input
                          type="text" value={editingArticle.readingTime}
                          onChange={(e) => setEditingArticle({ ...editingArticle, readingTime: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:border-slate-400 outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">Publish Status</label>
                        <select
                          value={editingArticle.publishStatus}
                          onChange={(e) => setEditingArticle({ ...editingArticle, publishStatus: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:border-slate-400 outline-none"
                        >
                          <option>PUBLISHED</option>
                          <option>DRAFT</option>
                        </select>
                      </div>
                    </div>

                    {/* Executive Summary */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Executive Summary (Short Blurb) <span className="text-red-500">*</span></label>
                      <textarea
                        rows={2} required value={editingArticle.summary}
                        onChange={(e) => setEditingArticle({ ...editingArticle, summary: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:border-slate-400 outline-none"
                      />
                    </div>

                    {/* EDITORIAL CONTENT FIELD */}
                    <div className="border-t pt-4 space-y-4">
                      <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Article Content</h4>

                      <div className="space-y-1.5">
                        <RichTextEditor
                          value={editingArticle.content || ''}
                          onChange={(html) => setEditingArticle({ ...editingArticle, content: html })}
                        />
                      </div>
                    </div>

                    {/* METADATA FILTERS INPUTS */}
                    <div className="border-t pt-4 space-y-4">
                      <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Metadata Parameters</h4>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-400 font-bold uppercase">Subjects (comma separated)</label>
                          <input
                            type="text"
                            value={Array.isArray(editingArticle.subjects) ? editingArticle.subjects.join(', ') : (editingArticle.subjects || '')}
                            onChange={(e) => setEditingArticle({ ...editingArticle, subjects: e.target.value as any })}
                            placeholder="Polity, Economy..."
                            className="w-full px-4 py-2 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:border-slate-400 outline-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-400 font-bold uppercase">Exams (comma separated)</label>
                          <input
                            type="text"
                            value={Array.isArray(editingArticle.exams) ? editingArticle.exams.join(', ') : (editingArticle.exams || '')}
                            onChange={(e) => setEditingArticle({ ...editingArticle, exams: e.target.value as any })}
                            placeholder="UPSC, BPSC..."
                            className="w-full px-4 py-2 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:border-slate-400 outline-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-400 font-bold uppercase">Tags (comma separated)</label>
                          <input
                            type="text"
                            value={Array.isArray(editingArticle.tags) ? editingArticle.tags.join(', ') : (editingArticle.tags || '')}
                            onChange={(e) => setEditingArticle({ ...editingArticle, tags: e.target.value as any })}
                            placeholder="governance, budget..."
                            className="w-full px-4 py-2 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:border-slate-400 outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* SEO FIELDS */}
                    <div className="border-t pt-4 space-y-4">
                      <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">SEO Parameters</h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-400 font-bold uppercase">SEO Title</label>
                          <input
                            type="text" value={editingArticle.seo?.seoTitle || ''}
                            onChange={(e) => setEditingArticle({ ...editingArticle, seo: { ...editingArticle.seo, seoTitle: e.target.value } })}
                            className="w-full px-4 py-2 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:border-slate-400 outline-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-400 font-bold uppercase">Canonical URL</label>
                          <input
                            type="text" value={editingArticle.seo?.canonicalUrl || ''}
                            onChange={(e) => setEditingArticle({ ...editingArticle, seo: { ...editingArticle.seo, canonicalUrl: e.target.value } })}
                            className="w-full px-4 py-2 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:border-slate-400 outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-400 font-bold uppercase">SEO Keywords</label>
                          <input
                            type="text" value={editingArticle.seo?.seoKeywords || ''}
                            onChange={(e) => setEditingArticle({ ...editingArticle, seo: { ...editingArticle.seo, seoKeywords: e.target.value } })}
                            className="w-full px-4 py-2 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:border-slate-400 outline-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-400 font-bold uppercase">SEO Description</label>
                          <input
                            type="text" value={editingArticle.seo?.seoDescription || ''}
                            onChange={(e) => setEditingArticle({ ...editingArticle, seo: { ...editingArticle.seo, seoDescription: e.target.value } })}
                            className="w-full px-4 py-2 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:border-slate-400 outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                      <button
                        type="button" onClick={() => setIsArticleModalOpen(false)}
                        className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-2xl cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button" onClick={handleSaveArticleToEdition}
                        className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl cursor-pointer"
                      >
                        Save Article
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 7: BLOGS */}
        {activeTab === 'Blogs' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-sm text-slate-900">Blog Strategy Posts</h3>
              <button
                onClick={() => {
                  setBlogForm({ id: '', title: '', publishDate: '', readTime: '5 min read', category: 'Strategy', content: '', seoTitle: '', seoKeywords: '', seoDescription: '', blurb: '' });
                  setActiveModal({ type: 'add' });
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-855 text-white font-bold rounded-2xl text-xs shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Post</span>
              </button>
            </div>

            <div className="space-y-4">
              {blogsList.map((post, idx) => (
                <div key={post.id} className="p-5 bg-white border border-slate-200 flex justify-between items-start rounded-3xl shadow-sm">
                  <div className="space-y-2">
                    <div className="flex gap-2 items-center text-[10px] font-bold text-slate-500">
                      <span className="text-blue-600">{post.category}</span>
                      <span>&bull;</span>
                      <span>{post.readTime}</span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900">{post.title}</h4>
                  </div>

                  <div className="flex gap-2 shrink-0 ml-4">
                    <button
                      onClick={() => {
                        setBlogForm(post);
                        setActiveModal({ type: 'edit', index: idx });
                      }}
                      className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-655"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteBlog(post.id)}
                      className="p-2 border border-red-100 rounded-xl hover:bg-red-650 hover:text-white text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal add/edit Blog */}
            {activeModal && activeTab === 'Blogs' && (
              <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <form onSubmit={handleSaveBlog} className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl w-full md:w-[85vw] max-w-[85vw] space-y-6 shadow-2xl">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="font-extrabold text-base text-slate-900">
                      {activeModal.type === 'add' ? 'Create Blog Post' : 'Edit Blog Post'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer"
                    >
                      ✕ Close
                    </button>
                  </div>

                  <div className="max-h-[75vh] overflow-y-auto space-y-6 pr-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">Post Title</label>
                        <input
                          type="text" required value={blogForm.title}
                          onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:border-slate-400 outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">Category</label>
                        <input
                          type="text" required value={blogForm.category}
                          onChange={(e) => setBlogForm({ ...blogForm, category: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:border-slate-400 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">Read Time</label>
                        <input
                          type="text" required value={blogForm.readTime}
                          onChange={(e) => setBlogForm({ ...blogForm, readTime: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:border-slate-400 outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">SEO Target Title</label>
                        <input
                          type="text" value={blogForm.seoTitle || ''}
                          onChange={(e) => setBlogForm({ ...blogForm, seoTitle: e.target.value })}
                          placeholder="Meta title for Google results..."
                          className="w-full px-4 py-2 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:border-slate-400 outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">SEO Keywords (Comma Separated)</label>
                      <input
                        type="text" value={blogForm.seoKeywords || ''}
                        onChange={(e) => setBlogForm({ ...blogForm, seoKeywords: e.target.value })}
                        placeholder="e.g. BPSC Polity notes, Article 356 Mains analysis"
                        className="w-full px-4 py-2 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:border-slate-400 outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">SEO Meta Description</label>
                      <textarea
                        rows={2} value={blogForm.seoDescription || ''}
                        onChange={(e) => setBlogForm({ ...blogForm, seoDescription: e.target.value })}
                        placeholder="Search result snippet summary description..."
                        className="w-full px-4 py-2 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:border-slate-400 outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Blurb (Short Intro Summary)</label>
                      <textarea
                        rows={2} value={blogForm.blurb || ''}
                        onChange={(e) => setBlogForm({ ...blogForm, blurb: e.target.value })}
                        placeholder="Short introductory summary snippet..."
                        className="w-full px-4 py-2 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:border-slate-400 outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Featured Cover Image</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={blogForm.imageUrl || ''}
                          onChange={(e) => setBlogForm({ ...blogForm, imageUrl: e.target.value })}
                          placeholder="Image URL or pick from Media DAM..."
                          className="w-full px-4 py-2 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:border-slate-400 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setMediaPickerConfig({ isOpen: true, field: 'blogImage' })}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-2xl shrink-0"
                        >
                          Pick
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Content</label>
                      <RichTextEditor
                        value={blogForm.content || ''}
                        onChange={(html) => setBlogForm({ ...blogForm, content: html })}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-2xl">
                      Cancel
                    </button>
                    <button type="submit" className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl">
                      Publish Post
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* TAB 8: RESOURCES */}
        {activeTab === 'Resources' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-sm text-slate-900">Free Resources Downloads</h3>
              <button
                onClick={() => {
                  setResourceForm({ id: '', title: '', size: '2.5 MB', type: 'PDF', downloadCount: 0, url: '#', category: 'Prelims', subcategory: '' });
                  setActiveModal({ type: 'add' });
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Resource</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {resourcesList.map((res, idx) => (
                <div key={res.id} className="p-5 bg-white border border-slate-200 flex justify-between items-center rounded-3xl shadow-sm">
                  <div className="space-y-1">
                    <h4 className="font-bold text-xs text-slate-900 leading-tight">{res.title}</h4>
                    <p className="text-[10px] text-slate-450 uppercase font-bold">Format: {res.type} &bull; Size: {res.size}</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setResourceForm(res);
                        setActiveModal({ type: 'edit', index: idx });
                      }}
                      className="p-1.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteResource(res.id)}
                      className="p-1.5 border border-red-100 rounded-xl hover:bg-red-650 hover:text-white text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {/* Modal add/edit Resource */}
            {activeModal && activeTab === 'Resources' && (
              <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <form onSubmit={handleSaveResource} className="bg-white border border-slate-200 p-6 rounded-3xl max-w-lg w-full space-y-4 shadow-2xl">
                  <h3 className="font-extrabold text-sm text-slate-900">
                    {activeModal.type === 'add' ? 'Add Study Resource' : 'Edit Study Resource'}
                  </h3>

                  {/* ── File Upload ───────────────────────────────────── */}
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <svg className="w-3 h-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      Upload File to Server
                    </label>

                    <label className={`relative flex flex-col items-center justify-center gap-2 px-4 py-5 border-2 border-dashed rounded-2xl cursor-pointer transition-all
                      ${resourceUploading ? 'border-blue-300 bg-blue-50' : 'border-slate-200 hover:border-blue-400 hover:bg-blue-50/50'}`}>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.txt,.mp4,.webm,.jpg,.jpeg,.png"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        disabled={resourceUploading}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setResourceUploading(true);
                          try {
                            const fd = new FormData();
                            fd.append('file', file);
                            const res = await fetch(`${BACKEND_URL}/api/upload`, { method: 'POST', body: fd });
                            const data = await res.json();
                            if (data.success && data.url) {
                              const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
                              const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';
                              setResourceForm(prev => ({
                                ...prev,
                                url: data.url,
                                size: `${sizeMB} MB`,
                                type: ext,
                                title: prev.title || file.name.replace(/\.[^.]+$/, '')
                              }));
                            } else {
                              alert('Upload failed: ' + (data.error || 'Unknown error'));
                            }
                          } catch (err) {
                            console.error(err);
                            alert('Upload failed. Is the backend running?');
                          } finally {
                            setResourceUploading(false);
                          }
                        }}
                      />
                      {resourceUploading ? (
                        <>
                          <svg className="w-5 h-5 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" /><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" className="opacity-75" /></svg>
                          <span className="text-xs text-blue-600 font-semibold">Uploading file to server…</span>
                        </>
                      ) : resourceForm.url && resourceForm.url.includes('/api/files/') ? (
                        <>
                          <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M5 13l4 4L19 7" /></svg>
                          <span className="text-xs text-emerald-600 font-semibold">File uploaded! Click to replace.</span>
                          <a href={resourceForm.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-500 underline" onClick={e => e.stopPropagation()}>Preview file ↗</a>
                        </>
                      ) : (
                        <>
                          <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                          <span className="text-xs text-slate-500 font-semibold">Click or drag file here to upload</span>
                          <span className="text-[10px] text-slate-400">PDF, DOC, PPT, XLS, ZIP, MP4, images — max 500MB</span>
                        </>
                      )}
                    </label>

                    <p className="text-[9px] text-slate-400 font-medium">Files are stored on the backend server and served at <code className="font-mono">/api/files/filename</code></p>
                  </div>

                  <div className="border-t border-slate-100 pt-3 space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Resource Title</label>
                      <input
                        type="text" required value={resourceForm.title}
                        onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:border-slate-400 outline-none"
                        placeholder="e.g. BPSC Polity Notes 2025"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">File Size</label>
                        <input
                          type="text" value={resourceForm.size}
                          onChange={(e) => setResourceForm({ ...resourceForm, size: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:border-slate-400 outline-none"
                          placeholder="Auto-filled on upload"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">Type</label>
                        <select
                          value={resourceForm.type}
                          onChange={(e) => setResourceForm({ ...resourceForm, type: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:border-slate-400 outline-none"
                        >
                          <option>PDF</option>
                          <option>DOC</option>
                          <option>PPT</option>
                          <option>XLS</option>
                          <option>ZIP</option>
                          <option>MP4</option>
                          <option>Notes</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">Category</label>
                        <select
                          value={resourceForm.category || 'Prelims'}
                          onChange={(e) => setResourceForm({ ...resourceForm, category: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:border-slate-400 outline-none"
                        >
                          <option value="Prelims">Prelims</option>
                          <option value="Mains">Mains</option>
                          <option value="Infographics">Infographics</option>
                          <option value="Rapid Revision Material">Rapid Revision Material</option>
                          <option value="PYQ Solutions">PYQ Solutions</option>
                          <option value="Value Added Materials">Value Added Materials</option>
                          <option value="FA Publications">FA Publications</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">Subcategory</label>
                        <input
                          type="text"
                          value={resourceForm.subcategory || ''}
                          onChange={(e) => setResourceForm({ ...resourceForm, subcategory: e.target.value })}
                          placeholder="e.g. Economy, Modern History"
                          className="w-full px-4 py-2 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:border-slate-400 outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Download URL (auto-filled on upload)</label>
                      <input
                        type="text" value={resourceForm.url}
                        onChange={(e) => setResourceForm({ ...resourceForm, url: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:border-slate-400 outline-none font-mono"
                        placeholder="Auto-filled after upload, or paste external URL"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-2xl">
                      Cancel
                    </button>
                    <button type="submit" className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl">
                      Save Resource
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* TAB 9: COURSES */}
        {activeTab === 'Courses' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white/70 backdrop-blur-md p-4 rounded-3xl border border-slate-200 shadow-xs">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Manage Courses</h3>
                <p className="text-[10px] text-slate-500 font-medium">Configure programs, syllabus contents, and lecture materials.</p>
              </div>
              <div className="flex items-center gap-6">
                {/* Moodle style Edit Mode switch */}
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-655">Edit Mode</span>
                  <button
                    type="button"
                    onClick={() => setEditMode(!editMode)}
                    className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors duration-300 focus:outline-none ${editMode ? 'bg-slate-900' : 'bg-slate-300'
                      }`}
                  >
                    <div
                      className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${editMode ? 'translate-x-5' : 'translate-x-0'
                        }`}
                    />
                  </button>
                </div>
                {editMode && (
                  <button
                    onClick={() => {
                      setCourseForm({ id: `course-${Date.now()}`, title: '', category: 'LMS Program', description: '', fee: 99900, duration: '6 Months', schedule: 'Daily 2 hrs', isPublished: true });
                      setActiveModal({ type: 'add' });
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs animate-in shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create LMS Course</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {coursesList.map((course, idx) => (
                <div key={course.id} className="p-6 bg-white border border-slate-200 flex flex-col justify-between space-y-4 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex justify-between items-start gap-4">
                      <Link href={`/courses/${course.id}`} className="hover:underline">
                        <h4 className="font-bold text-sm text-slate-900 leading-tight">{course.title}</h4>
                      </Link>
                      {editMode && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setCourseForm(course);
                              setActiveModal({ type: 'edit', index: idx });
                            }}
                            className="p-1.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-655"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={async () => {
                              if (window.confirm('Delete this course?')) {
                                setCoursesList(prev => prev.filter(c => c.id !== course.id));
                                await fetch(`${BACKEND_URL}/api/lms/courses/${course.id}`, { method: 'DELETE' });
                              }
                            }}
                            className="p-1.5 border border-red-100 rounded-xl hover:bg-red-650 hover:text-white text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">{course.category} &bull; {course.duration}</p>
                      <Link
                        href={`/admin/courses/${course.id}`}
                        className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-[10px] flex items-center gap-1 transition-all"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Open Editor</span>
                      </Link>
                    </div>
                    <p className="text-slate-650 text-xs leading-relaxed mt-2">{course.description}</p>
                  </div>

                  {/* Add sections and video lessons shortcut - Only render inside edit mode */}
                  {editMode && (
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Curriculum Builder</p>
                      <div className="flex flex-col gap-1.5">
                        <button
                          onClick={async () => {
                            const title = window.prompt('Enter Section/Chapter Title:');
                            if (title) {
                              await fetch(`${BACKEND_URL}/api/lms/courses/${course.id}/sections`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ title })
                              });
                              alert('Chapter created successfully!');
                            }
                          }}
                          className="w-full text-left px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-700 rounded-xl flex items-center gap-1.5 transition-colors"
                        >
                          <Plus className="w-3 h-3 text-slate-500" /> Add Chapter/Section
                        </button>

                        <button
                          onClick={async () => {
                            const title = window.prompt('Enter Lecture Video Title:');
                            const videoUrl = window.prompt('Enter Cloudinary/Video URL:', 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4');
                            if (title && videoUrl) {
                              const secRes = await fetch(`${BACKEND_URL}/api/lms/courses/${course.id}/sections`);
                              const secData = await secRes.json();
                              const sections = secData.data?.sections || secData.data || [];
                              if (sections.length === 0) {
                                alert('Please create a Chapter/Section first!');
                                return;
                              }
                              const targetSectionId = sections[0].id;
                              await fetch(`${BACKEND_URL}/api/lms/sections/${targetSectionId}/lessons`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ courseId: course.id, title, videoUrl, duration: '10 mins' })
                              });
                              alert('Lecture Video Added successfully!');
                            }
                          }}
                          className="w-full text-left px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-700 rounded-xl flex items-center gap-1.5 transition-colors"
                        >
                          <Plus className="w-3 h-3 text-slate-500" /> Add Lecture Video (to first section)
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                    <span className="text-xs font-bold text-slate-900">{typeof course.fee === 'number' ? `₹${(course.fee / 100).toLocaleString('en-IN')}` : course.fee}</span>

                    {/* iOS Designer Switch Toggle */}
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Published</span>
                      <button
                        type="button"
                        disabled={!editMode}
                        onClick={async () => {
                          const nextPub = !course.isPublished;
                          setCoursesList(prev => prev.map(c => c.id === course.id ? { ...c, isPublished: nextPub } : c));
                          await fetch(`${BACKEND_URL}/api/lms/courses/${course.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ isPublished: nextPub })
                          });
                        }}
                        className={`w-10 h-6 flex items-center rounded-full p-0.5 transition-all duration-300 focus:outline-none ${course.isPublished ? 'bg-emerald-500' : 'bg-slate-350'
                          } ${!editMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div
                          className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${course.isPublished ? 'translate-x-4' : 'translate-x-0'
                            }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Modal add/edit Course */}
            {activeModal && activeTab === 'Courses' && (
              <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (activeModal.type === 'add') {
                    setCoursesList(prev => [...prev, courseForm]);
                    await fetch(`${BACKEND_URL}/api/lms/courses`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(courseForm)
                    });
                  } else {
                    const id = courseForm.id;
                    setCoursesList(prev => prev.map(c => c.id === id ? courseForm : c));
                    await fetch(`${BACKEND_URL}/api/lms/courses/${id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(courseForm)
                    });
                  }
                  setActiveModal(null);
                }} className="bg-white border border-slate-200 p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl">
                  <h3 className="font-extrabold text-sm text-slate-900">
                    {activeModal.type === 'add' ? 'Create LMS Course' : 'Edit LMS Course'}
                  </h3>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Course ID (Slug)</label>
                    <input
                      type="text" required value={courseForm.id}
                      disabled={activeModal.type === 'edit'}
                      onChange={(e) => setCourseForm({ ...courseForm, id: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-2xl focus:outline-none focus:border-slate-400 disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Course Title</label>
                    <input
                      type="text" required value={courseForm.title}
                      onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-2xl focus:outline-none focus:border-slate-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Description</label>
                    <textarea
                      required value={courseForm.description}
                      onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-2xl focus:outline-none focus:border-slate-400 min-h-20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Fee (in Paise)</label>
                      <input
                        type="number" required value={courseForm.fee}
                        onChange={(e) => setCourseForm({ ...courseForm, fee: Number(e.target.value) })}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-2xl focus:outline-none focus:border-slate-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Duration</label>
                      <input
                        type="text" required value={courseForm.duration}
                        onChange={(e) => setCourseForm({ ...courseForm, duration: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-2xl focus:outline-none focus:border-slate-400"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-2xl">
                      Cancel
                    </button>
                    <button type="submit" className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl">
                      Save Course
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* TAB: TEST SERIES */}
        {activeTab === 'Test Series' && (
          <TestSeriesAdmin BACKEND_URL={BACKEND_URL} />
        )}
      </main>

      {mediaPickerConfig.isOpen && (
        <MediaPicker
          allowedTypes={mediaPickerConfig.allowedTypes}
          onSelect={handleSelectMedia}
          onClose={() => setMediaPickerConfig({ isOpen: false, field: '' })}
        />
      )}

      {/* Super Admin User Profile & Role Assignment Popup Modal */}
      {selectedUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-lg">
                    User Management Console
                  </span>
                  {selectedUserModal.role === 'admin' && (
                    <span className="text-[10px] font-extrabold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                      👑 Admin Access
                    </span>
                  )}
                </div>
                <h3 className="font-heading font-black text-lg text-slate-900 dark:text-white">
                  {selectedUserModal.fullName}
                </h3>
              </div>

              <button
                onClick={() => setSelectedUserModal(null)}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-grow">
              
              {/* Role Assignment Switcher */}
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                    👑 Assign Account Role (Super Admin Permission)
                  </label>
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">Real-Time Permission Sync</span>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { role: 'student', title: 'Student', desc: 'Standard student portal access' },
                    { role: 'faculty', title: 'Faculty', desc: 'Faculty portal & batch creator' },
                    { role: 'admin', title: 'Admin', desc: 'Full CMS & platform admin access' }
                  ].map((r) => (
                    <button
                      key={r.role}
                      type="button"
                      onClick={() => setEditUserForm(prev => ({ ...prev, role: r.role as any }))}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        editUserForm.role === r.role
                          ? 'bg-amber-500 text-slate-950 border-amber-600 font-black shadow-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-amber-400'
                      }`}
                    >
                      <div className="font-extrabold text-xs">{r.title}</div>
                      <div className="text-[9px] opacity-80 mt-0.5 leading-tight">{r.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Account Details Form */}
              <div className="space-y-4">
                <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-white/[0.06] pb-2">
                  Account Details & Information
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Full Name</label>
                    <input
                      type="text"
                      value={editUserForm.fullName || ''}
                      onChange={(e) => setEditUserForm(prev => ({ ...prev, fullName: e.target.value }))}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none text-slate-900 dark:text-white font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Email Address</label>
                    <input
                      type="email"
                      value={editUserForm.email || ''}
                      onChange={(e) => setEditUserForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Mobile Number</label>
                    <input
                      type="text"
                      value={editUserForm.mobile || ''}
                      onChange={(e) => setEditUserForm(prev => ({ ...prev, mobile: e.target.value }))}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Target Exam</label>
                    <input
                      type="text"
                      value={editUserForm.targetExam || ''}
                      onChange={(e) => setEditUserForm(prev => ({ ...prev, targetExam: e.target.value }))}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none text-slate-900 dark:text-white font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Course Enrollments & Payments Info */}
              {selectedUserModal.enrollments && selectedUserModal.enrollments.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-white/[0.06] pb-2">
                    Enrolled Courses & Transaction Logs
                  </h4>
                  <div className="space-y-2">
                    {selectedUserModal.enrollments.map((enr, i) => (
                      <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-150 dark:border-white/5 rounded-2xl flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{enr.courseTitle}</div>
                          <div className="text-[10px] text-slate-400 font-mono">Order ID: {enr.paymentOrderId} • Batch: {enr.batch}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-bold text-slate-900 dark:text-white">
                            {enr.amountPaid ? `₹${(enr.amountPaid / (enr.amountPaid > 10000 ? 100 : 1)).toLocaleString('en-IN')}` : 'Free'}
                          </div>
                          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded uppercase">
                            {enr.paymentStatus}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={async () => {
                  if (!confirm(`Are you sure you want to delete profile for ${selectedUserModal.fullName}?`)) return;
                  await fetch(`${BACKEND_URL}/api/auth/users/${selectedUserModal.id}`, { method: 'DELETE' });
                  setUsersList(prev => prev.filter(u => u.id !== selectedUserModal.id));
                  setSelectedUserModal(null);
                }}
                className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-extrabold rounded-xl border border-red-200 transition-all cursor-pointer"
              >
                Delete Account
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedUserModal(null)}
                  className="px-4 py-2.5 border border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await fetch(`${BACKEND_URL}/api/auth/users/${selectedUserModal.id}/profile`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(editUserForm)
                      });
                      const data = await res.json();
                      if (data.success) {
                        setUsersList(prev => prev.map(u => u.id === selectedUserModal.id ? { ...u, ...editUserForm } as UserProfile : u));
                        setSelectedUserModal(null);
                        alert('User profile & role updated successfully!');
                      }
                    } catch (err) {
                      console.error('Failed saving user edit:', err);
                    }
                  }}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Save Changes & Role
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
