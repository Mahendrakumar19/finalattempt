'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  LogOut,
  RefreshCw,
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
  Download,
  Sparkles,
  X
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import RichTextEditor from '@/components/RichTextEditor';
import MediaDashboard from '@/components/MediaDashboard';
import MediaPicker from '@/components/MediaPicker';
import SyllabusStrategyCMS from '@/components/SyllabusStrategyCMS';
import PYQsManagerCMS from '@/components/PYQsManagerCMS';
import NCERTBooksManagerCMS from '@/components/NCERTBooksManagerCMS';
import NcertStyleResourceCMS from '@/components/NcertStyleResourceCMS';
import { db, DynamicCurrentAffairEdition, DynamicCurrentAffairArticle, ResultTopper } from '@/services/db';
import TestSeriesAdmin from '@/components/admin/TestSeriesAdmin';
import CustomPagesCMS from '@/components/CustomPagesCMS';

type AdminTab = 'Dashboard' | 'Home' | 'About' | 'Contact' | 'PYQ' | 'NCERT' | 'Publications' | 'Rapid Revision' | 'Value Addition' | 'Toppers Copies' | 'Blogs' | 'Users' | 'Courses' | 'Test Series' | 'Leads' | 'Media Library' | 'Exams & Syllabus' | 'Current Affairs' | 'Super Admin Console';

interface FeaturePageConnection {
  featureId: string;
  featureName: string;
  connectedPages: { name: string; tab: AdminTab }[];
}

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
  aboutTitle?: string;
  aboutSubtitle?: string;
  aboutMission?: string;
  aboutVision?: string;
  aboutValues?: string;
  aboutMethodology?: { title: string; desc: string }[];
  announcements?: { date: string; text: string; link?: string; isNew?: boolean }[];
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
  exam?: string;
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
  avatarUrl?: string;
  role: 'student' | 'faculty' | 'admin';
  targetExam?: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
  enrollments?: StudentEnrollmentInfo[];
}

export default function AdminPortal() {
  const [activeTab, setActiveTab] = useState<AdminTab>('Dashboard');
  const [backendOffline, setBackendOffline] = useState(false);

  // States for CMS collections
  const [settings, setSettings] = useState<SiteSettings>({
    heroTitle: '72nd BPSC Preparation Starts Here',
    heroSubtitle: 'Personalized mentorship, smart study tools, and Bihar-focused content designed to help you clear BPSC with confidence.',
    tagline: 'One Mentor. One Strategy. One Final Attempt.',
    heroImageUrl: ''
  });
  const [leadsList, setLeadsList] = useState<Lead[]>([]);
  const [caList, setCaList] = useState<CurrentAffairArticle[]>([]);
  const [blogsList, setBlogsList] = useState<BlogItem[]>([]);
  const [resourcesList, setResourcesList] = useState<ResourceDownload[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [facultyList, setFacultyList] = useState<Record<string, string>[]>([]);
  const [toppersList, setToppersList] = useState<ResultTopper[]>([]);
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'student' | 'faculty' | 'admin'>('all');
  const [selectedUserModal, setSelectedUserModal] = useState<UserProfile | null>(null);
  const [editUserForm, setEditUserForm] = useState<Partial<UserProfile>>({});

  // Faculty & Topper Popup Modal States
  const [facultyModal, setFacultyModal] = useState<{ isOpen: boolean; data: Record<string, string> | null }>({ isOpen: false, data: null });
  const [topperModal, setTopperModal] = useState<{ isOpen: boolean; data: ResultTopper | null }>({ isOpen: false, data: null });

  const [coursesList, setCoursesList] = useState<Course[]>([]);
  const [editMode, setEditMode] = useState(false);

  // Dynamic Current Affairs states
  const [dynamicEditionsList, setDynamicEditionsList] = useState<DynamicCurrentAffairEdition[]>([]);
  const [editingEdition, setEditingEdition] = useState<DynamicCurrentAffairEdition | null>(null);
  const [editingArticle, setEditingArticle] = useState<Partial<DynamicCurrentAffairArticle> | null>(null);
  const [activeArticleCategory, setActiveArticleCategory] = useState<'NATIONAL' | 'INTERNATIONAL' | 'BIHAR' | 'ARUNACHAL'>('NATIONAL');
  const [isEditionModalOpen, setIsEditionModalOpen] = useState(false);
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [caSubTab, setCaSubTab] = useState<'daily' | 'mains'>('daily');

  // Modals visibility states
  const [activeModal, setActiveModal] = useState<{ type: 'add' | 'edit'; index?: number } | null>(null);

  // YouTube Sync Console States
  const [youtubeStatus, setYoutubeStatus] = useState<{ lastSyncTime: string | null; videosSynced: number; status: string; error: string | null }>({ lastSyncTime: null, videosSynced: 0, status: 'IDLE', error: null });
  const [syncingYoutube, setSyncingYoutube] = useState(false);

  // Local Storage Auth & Super Admin state
  const [isMounted, setIsMounted] = useState(false);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    queueMicrotask(() => {
      setIsMounted(true);
      const token = localStorage.getItem('admin_token');
      const superFlag = localStorage.getItem('is_super_admin') === 'true';
      if (token) setAdminToken(token);
      if (superFlag) setIsSuperAdmin(true);
    });
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
  const [courseForm, setCourseForm] = useState<Course>({ id: '', title: '', category: 'BPSC Course', description: '', fee: 0, duration: '', schedule: '', isPublished: true });

  const getBackendUrl = () => {
    if (process.env.NEXT_PUBLIC_BACKEND_URL) return process.env.NEXT_PUBLIC_BACKEND_URL;
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      return `http://${hostname}:5000`;
    }
    return 'http://localhost:5000';
  };
  const BACKEND_URL = getBackendUrl();

  const fetchCMSData = useCallback(async () => {
    try {
      const setRes = await fetch(`${BACKEND_URL}/api/settings`).catch(() => null);
      if (setRes && setRes.ok) {
        const setJson = await setRes.json().catch(() => null);
        if (setJson) setSettings(prev => ({ ...prev, ...setJson }));
      }
      const courseRes = await fetch(`${BACKEND_URL}/api/lms/courses?includeUnpublished=true`).catch(() => null);
      if (courseRes && courseRes.ok) {
        const cData = await courseRes.json().catch(() => null);
        if (cData && cData.success && Array.isArray(cData.data)) setCoursesList(cData.data);
      }
      const blogRes = await fetch(`${BACKEND_URL}/api/blogs`).catch(() => null);
      if (blogRes && blogRes.ok) {
        const bData = await blogRes.json().catch(() => null);
        if (Array.isArray(bData)) {
          setBlogsList(bData);
        } else if (bData && bData.success && Array.isArray(bData.data)) {
          setBlogsList(bData.data);
        }
      }
      const resRes = await fetch(`${BACKEND_URL}/api/resources`).catch(() => null);
      if (resRes && resRes.ok) {
        const rData = await resRes.json().catch(() => null);
        if (rData && rData.success && Array.isArray(rData.data)) setResourcesList(rData.data);
      }
      const caRes = await fetch(`${BACKEND_URL}/api/current-affairs`).catch(() => null);
      if (caRes && caRes.ok) {
        const caData = await caRes.json().catch(() => null);
        if (caData && caData.success && Array.isArray(caData.data)) setCaList(caData.data);
      }
      const usersRes = await fetch(`${BACKEND_URL}/api/auth/users`).catch(() => null);
      if (usersRes && usersRes.ok) {
        const uData = await usersRes.json().catch(() => null);
        if (uData && Array.isArray(uData)) setUsersList(uData);
        else if (uData && uData.success && Array.isArray(uData.data)) setUsersList(uData.data);
      }
      const leadsRes = await fetch(`${BACKEND_URL}/api/leads`).catch(() => null);
      if (leadsRes && leadsRes.ok) {
        const lData = await leadsRes.json().catch(() => null);
        if (lData && lData.success && Array.isArray(lData.data)) setLeadsList(lData.data);
      }

      const facRes = await fetch(`${BACKEND_URL}/api/faculty`);
      if (facRes.ok) setFacultyList(await facRes.json());
      const topRes = await fetch(`${BACKEND_URL}/api/results`);
      if (topRes.ok) setToppersList(await topRes.json());

      const dynRes = await fetch(`${BACKEND_URL}/api/dynamic-current-affairs/editions?includeDrafts=true`);
      if (dynRes.ok) setDynamicEditionsList(await dynRes.json());

      const ytStatus = await db.getYoutubeSyncStatus();
      if (ytStatus) setYoutubeStatus(ytStatus);

      setBackendOffline(false);
    } catch (err) {
      console.warn('Backend server offline. Running in mock offline mode:', err);
      setBackendOffline(true);
    }
  }, [BACKEND_URL]);

  useEffect(() => {
    queueMicrotask(() => {
      fetchCMSData();
    });
  }, [fetchCMSData]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const ok = await db.updateSettings(settings);
      if (ok) {
        alert('About Us page content & site settings saved successfully!');
        fetchCMSData();
      } else {
        alert('Failed to save settings.');
      }
    } catch (err) {
      console.error('Save settings error:', err);
      alert('Network error while saving settings.');
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
    } catch (err: unknown) {
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

  const handleSelectMedia = (url: string) => {
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
    if (!editingEdition) return;
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

  const handleAddArticleToEdition = (category: 'NATIONAL' | 'INTERNATIONAL' | 'BIHAR' | 'ARUNACHAL') => {
    if (!editingEdition) return;
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
    if (!editingEdition || !editingArticle) return;
    if (!editingArticle.title || !editingArticle.summary) {
      alert('Title and Summary are required.');
      return;
    }

    const articles = [...(editingEdition.articles || [])];
    const artIdx = articles.findIndex(a => a.id === editingArticle.id && editingArticle.id !== '');

    const slugifiedTitle = editingArticle.title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const finalSlug = editingArticle.slug || `${editingEdition.publishDate}-${(editingArticle.category ?? 'general').toLowerCase()}-${slugifiedTitle}`;

    const parseCsv = (val: string | string[] | undefined) => {
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
    } as DynamicCurrentAffairArticle;

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
    if (!editingEdition) return;
    if (!window.confirm('Remove this article from layout?')) return;
    setEditingEdition({
      ...editingEdition,
      articles: (editingEdition.articles || []).filter(a => a.id !== artId)
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

  if (!isMounted) {
    return <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 text-slate-400 text-xs font-bold">Loading...</div>;
  }

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
              { id: 'Home', icon: Sun },
              { id: 'About', icon: FileText },
              { id: 'Contact', icon: MessageSquare },
              { id: 'PYQ', icon: Layers },
              { id: 'NCERT', icon: BookOpen },
              { id: 'Publications', icon: Award },
              { id: 'Rapid Revision', icon: Sparkles },
              { id: 'Value Addition', icon: FileText },
              { id: 'Toppers Copies', icon: FolderOpen },
              { id: 'Blogs', icon: Bookmark },
              { id: 'Courses', icon: BookOpen },
              { id: 'Test Series', icon: FileText },
              { id: 'Users', icon: Users },
              { id: 'Leads', icon: MessageSquare },
              { id: 'Media Library', icon: FolderOpen },
              { id: 'Exams & Syllabus', icon: Layers },
              ...(settings.featureFlags?.currentAffairsFilters !== false ? [{ id: 'Current Affairs', icon: FileText }] : []),
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
            {/* Feature Connected Page Dropdown */}
            <div className="flex items-center gap-2 bg-[var(--card-bg)] border border-[var(--card-border)] px-3 py-1.5 rounded-2xl shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Connected Page(s):</span>
              <select
                onChange={(e) => {
                  const targetTab = e.target.value as AdminTab;
                  if (targetTab && targetTab !== ('NONE' as any)) {
                    setActiveTab(targetTab);
                  }
                }}
                className="bg-transparent text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
              >
                {activeTab === 'Home' && (
                  <>
                    <option value="Home">📍 Home Page (/) - Connected</option>
                    <option value="About">→ About Page (/about)</option>
                    <option value="Contact">→ Contact Page (/contact)</option>
                  </>
                )}
                {activeTab === 'About' && (
                  <>
                    <option value="About">📍 About Page (/about) - Connected</option>
                    <option value="Home">→ Home Page (/)</option>
                  </>
                )}
                {activeTab === 'Contact' && (
                  <>
                    <option value="Contact">📍 Contact Page (/contact) - Connected</option>
                    <option value="Home">→ Home Page (/)</option>
                  </>
                )}
                {(activeTab as string) === 'Download Hub' && (
                  <>
                    <option value="PYQ">→ PYQ Vault (/downloads/pyq)</option>
                    <option value="NCERT">→ NCERT Books (/downloads/ncert)</option>
                  </>
                )}
                {activeTab === 'PYQ' && (
                  <>
                    <option value="PYQ">📍 PYQ Page (/downloads/pyq) - Connected</option>
                  </>
                )}
                {activeTab === 'NCERT' && (
                  <>
                    <option value="NCERT">📍 NCERT Books (/downloads/ncert) - Connected</option>
                  </>
                )}
                {activeTab === 'Publications' && (
                  <>
                    <option value="Publications">📍 Final Attempt Publications (/downloads/fa-publications) - Connected</option>
                  </>
                )}
                {activeTab === 'Rapid Revision' && (
                  <>
                    <option value="Rapid Revision">📍 Rapid Revision Materials (/downloads/rapid-revision) - Connected</option>
                  </>
                )}
                {activeTab === 'Value Addition' && (
                  <>
                    <option value="Value Addition">📍 Value Added Materials (/downloads/value-added-mains) - Connected</option>
                  </>
                )}
                {activeTab === 'Toppers Copies' && (
                  <>
                    <option value="Toppers Copies">📍 Toppers Copies (/downloads/toppers-copies) - Connected</option>
                  </>
                )}
                {activeTab === 'Blogs' && (
                  <>
                    <option value="Blogs">📍 Blogs & News Page (/blog) - Connected</option>
                  </>
                )}
                {!['Home', 'About', 'Contact', 'Download Hub', 'PYQ', 'Blogs'].includes(activeTab) && (
                  <option value="NONE">Not connected to any page</option>
                )}
              </select>
            </div>

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
                { label: 'Published Courses', value: coursesList.length.toString(), desc: 'Published programs & batches', icon: BookOpen, color: 'text-amber-500' },
                { label: 'Total Enquiries', value: leadsList.length.toString(), desc: 'Direct lead records', icon: MessageSquare, color: 'text-emerald-500' },
                { label: 'Current Articles', value: caList.length.toString(), desc: 'Published articles & notes', icon: FileText, color: 'text-purple-500' }
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

        {/* TAB 2: HOME CMS (SIMPLIFIED & CLEAN) */}
        {(activeTab === 'Home' || (activeTab as any) === 'Settings') && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-6 rounded-3xl shadow-sm">
              <div>
                <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">Public Content Manager</span>
                <h2 className="text-xl font-heading font-extrabold text-slate-900 dark:text-white">Home Page Editor</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Manage Hero Slider Images, Announcement Bulletins, Social Links & YouTube Sync.
                </p>
              </div>
              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-2xl text-xs cursor-pointer shadow-sm transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Preview Home Page ↗</span>
              </a>
            </div>

            <form onSubmit={handleSaveSettings} className="p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 w-full rounded-3xl shadow-sm space-y-8">
              {/* ── 1. Hero Background Images (Fixed 3840x1326 Aspect Ratio) ─────────────────────────── */}
              <div className="space-y-4">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/10 pb-3 flex items-center justify-between">
                  <span>1. Hero Slider Banner Images (Fixed 3840x1326 px)</span>
                  <span className="text-[10px] text-amber-500 font-mono font-bold">
                    Active Images: {settings.heroImageUrl ? settings.heroImageUrl.split(',').map(s => s.trim()).filter(Boolean).length : 0}
                  </span>
                </h3>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {(settings.heroImageUrl ? settings.heroImageUrl.split(',').map(s => s.trim()).filter(Boolean) : []).map((url, idx) => (
                      <div key={idx} className="relative aspect-[3840/1326] rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-white/10 group shadow-sm">
                        <img
                          src={url}
                          alt={`Hero Slide ${idx + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = ''; }}
                        />
                        <span className="absolute top-1.5 left-1.5 text-[9px] font-extrabold text-amber-500 bg-slate-950/80 px-2 py-0.5 rounded-md border border-amber-500/20">
                          Slide #{idx + 1}
                        </span>
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
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setMediaPickerConfig({ isOpen: true, field: 'heroImageUrl', allowedTypes: ['IMAGE'] })}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 dark:border-white/20 hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 text-slate-600 dark:text-slate-300 hover:text-amber-600 rounded-2xl cursor-pointer transition-all text-xs font-bold"
                    >
                      <FolderOpen className="w-4 h-4 text-amber-500" />
                      <span>+ Pick Banner Image from Media Manager (DAM)</span>
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Image URLs (Comma Separated)</label>
                    <textarea
                      rows={2}
                      placeholder="https://example.com/banner1.jpg, https://example.com/banner2.jpg"
                      value={settings.heroImageUrl || ''}
                      onChange={(e) => setSettings(prev => ({ ...prev, heroImageUrl: e.target.value }))}
                      className="w-full px-4 py-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl outline-none font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* ── 2. Live Announcements ─────────────────────────── */}
              <div className="space-y-4 border-t border-slate-100 dark:border-white/10 pt-6">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/10 pb-3">
                  <div>
                    <h3 className="font-heading font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                      2. Live Home Page Announcements
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const current = settings.announcements || [];
                      const today = new Date();
                      const dateStr = `${today.getDate()} ${today.toLocaleString('en-US', { month: 'short' }).toUpperCase()}`;
                      setSettings({
                        ...settings,
                        announcements: [
                          ...current,
                          { date: dateStr, text: 'New Batch Announcement', isNew: true }
                        ]
                      });
                    }}
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Announcement</span>
                  </button>
                </div>

                {(settings.announcements || []).length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">No custom announcements configured.</p>
                ) : (
                  <div className="space-y-3">
                    {(settings.announcements || []).map((ann, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/10 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Notice #{idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = (settings.announcements || []).filter((_, i) => i !== idx);
                              setSettings({ ...settings, announcements: updated });
                            }}
                            className="text-xs font-bold text-red-500 hover:underline"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">Date Tag (e.g. 15 JUN)</label>
                            <input
                              type="text"
                              value={ann.date}
                              onChange={(e) => {
                                const updated = [...(settings.announcements || [])];
                                updated[idx] = { ...updated[idx], date: e.target.value };
                                setSettings({ ...settings, announcements: updated });
                              }}
                              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl outline-none font-bold text-slate-900 dark:text-white"
                            />
                          </div>

                          <div className="sm:col-span-3 space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">Announcement Text</label>
                            <input
                              type="text"
                              value={ann.text}
                              onChange={(e) => {
                                const updated = [...(settings.announcements || [])];
                                updated[idx] = { ...updated[idx], text: e.target.value };
                                setSettings({ ...settings, announcements: updated });
                              }}
                              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl outline-none font-bold text-slate-900 dark:text-white"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── 3. Contact & Social Links ─────────────────────────── */}
              <div className="border-t border-slate-100 dark:border-white/10 pt-6 space-y-4">
                <h3 className="font-heading font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                  3. Contact & Social Media Links
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">WhatsApp Link</label>
                    <input
                      type="text"
                      placeholder="https://wa.me/919709992093"
                      value={settings.whatsappLink || ''}
                      onChange={(e) => setSettings({ ...settings, whatsappLink: e.target.value })}
                      className="w-full px-4 py-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl outline-none text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Telegram Link</label>
                    <input
                      type="text"
                      placeholder="https://t.me/Finalattemptofficial"
                      value={settings.telegramLink || ''}
                      onChange={(e) => setSettings({ ...settings, telegramLink: e.target.value })}
                      className="w-full px-4 py-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl outline-none text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full px-6 py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all cursor-pointer"
              >
                💾 Save Home Page Configurations
              </button>
            </form>

            {/* YouTube Synchronizer Dashboard */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-6 sm:p-8 rounded-3xl shadow-sm space-y-6">
              <div className="border-b border-slate-100 dark:border-white/10 pb-4 space-y-1">
                <h3 className="font-heading font-extrabold text-sm text-slate-900 dark:text-white">YouTube Channel Automatic Sync</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  Direct connection with YouTube Data API v3. Synchronizes content from `@finalattemptofficial` every 30 minutes.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/10 rounded-2xl space-y-1">
                  <span className="block text-[9px] uppercase font-bold text-slate-400">Last Sync Time</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {youtubeStatus.lastSyncTime ? youtubeStatus.lastSyncTime : 'Never Synced'}
                  </span>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/10 rounded-2xl space-y-1">
                  <span className="block text-[9px] uppercase font-bold text-slate-400">Videos Synced</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{youtubeStatus.videosSynced}</span>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/10 rounded-2xl space-y-1">
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

        {/* TAB: ABOUT PAGE CMS */}
        {(activeTab === ('About' as any) || activeTab === ('About Page' as any) || activeTab === ('About Page CMS' as any)) && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-6 rounded-3xl shadow-sm">
              <div>
                <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">Public Content Manager</span>
                <h2 className="text-xl font-heading font-extrabold text-slate-900 dark:text-white">About Us Page CMS Editor</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Manage main titles, sub-headings, mission statements, vision, and core values displayed on `/about`.
                </p>
              </div>
              <a
                href="/about"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-2xl text-xs cursor-pointer shadow-sm transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Preview /about ↗</span>
              </a>
            </div>

            <form onSubmit={handleSaveSettings} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-6 sm:p-8 rounded-3xl space-y-6 shadow-sm">
              <div className="space-y-4">
                <h3 className="font-heading font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-white/10 pb-3">
                  1. Page Hero Title & Sub-Heading
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Main Heading Title</label>
                    <input
                      type="text"
                      placeholder="One Mentor. One Strategy. One Final Attempt."
                      value={settings.aboutTitle || ''}
                      onChange={(e) => setSettings({ ...settings, aboutTitle: e.target.value })}
                      className="w-full px-4 py-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl outline-none text-slate-900 dark:text-white font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sub-heading Description</label>
                    <input
                      type="text"
                      placeholder="Final Attempt is BPSC's premium prep ecosystem..."
                      value={settings.aboutSubtitle || ''}
                      onChange={(e) => setSettings({ ...settings, aboutSubtitle: e.target.value })}
                      className="w-full px-4 py-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-t border-slate-100 dark:border-white/10 pt-6">
                <h3 className="font-heading font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-white/10 pb-3">
                  2. Core Pillars: Mission, Vision, and Values
                </h3>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Our Mission Statement</label>
                  <textarea
                    rows={3}
                    placeholder="To democratize civil services coaching in Bihar..."
                    value={settings.aboutMission || ''}
                    onChange={(e) => setSettings({ ...settings, aboutMission: e.target.value })}
                    className="w-full px-4 py-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl outline-none text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Our Vision Statement</label>
                  <textarea
                    rows={3}
                    placeholder="To be recognized as Bihar's most trusted gateway for administrative leadership..."
                    value={settings.aboutVision || ''}
                    onChange={(e) => setSettings({ ...settings, aboutVision: e.target.value })}
                    className="w-full px-4 py-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl outline-none text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Core Values Description</label>
                  <textarea
                    rows={3}
                    placeholder="Upholding transparency in feedback, diagnostic dashboards, strict study schedules..."
                    value={settings.aboutValues || ''}
                    onChange={(e) => setSettings({ ...settings, aboutValues: e.target.value })}
                    className="w-full px-4 py-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl outline-none text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* 3. Methodology & Strategic Approach Editor */}
              <div className="space-y-4 border-t border-slate-100 dark:border-white/10 pt-6">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/10 pb-3">
                  <h3 className="font-heading font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                    3. Methodology & Core Strategic Approach (4 Steps)
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      const current = settings.aboutMethodology || [
                        { title: 'Micro-Scheduling', desc: 'Dividing massive GS books into weekly targeted syllabus schedules.' },
                        { title: 'Daily Evaluation', desc: 'Mandatory daily answer writing checks by experienced evaluators.' },
                        { title: 'Bihar Focus', desc: 'Extensive state geography, budget digests, and economic statistics.' },
                        { title: 'Officer Mentorship', desc: 'Direct workshops and feedback sessions with selected public administrators.' }
                      ];
                      setSettings({ ...settings, aboutMethodology: current });
                    }}
                    className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 hover:underline"
                  >
                    Reset Defaults
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[0, 1, 2, 3].map((idx) => {
                    const defaultSteps = [
                      { title: 'Micro-Scheduling', desc: 'Dividing massive GS books into weekly targeted syllabus schedules.' },
                      { title: 'Daily Evaluation', desc: 'Mandatory daily answer writing checks by experienced evaluators.' },
                      { title: 'Bihar Focus', desc: 'Extensive state geography, budget digests, and economic statistics.' },
                      { title: 'Officer Mentorship', desc: 'Direct workshops and feedback sessions with selected public administrators.' }
                    ];
                    const currentArr = settings.aboutMethodology || defaultSteps;
                    const step = currentArr[idx] || defaultSteps[idx];

                    return (
                      <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/10 rounded-2xl space-y-2">
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Step 0{idx + 1}</span>
                        <input
                          type="text"
                          placeholder={`Step 0${idx + 1} Title`}
                          value={step.title}
                          onChange={(e) => {
                            const newTitle = e.target.value;
                            const updatedArr = [...currentArr];
                            updatedArr[idx] = { ...step, title: newTitle };
                            setSettings({ ...settings, aboutMethodology: updatedArr });
                          }}
                          className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl outline-none font-bold text-slate-900 dark:text-white"
                        />
                        <textarea
                          rows={2}
                          placeholder={`Step 0${idx + 1} Description`}
                          value={step.desc}
                          onChange={(e) => {
                            const newDesc = e.target.value;
                            const updatedArr = [...currentArr];
                            updatedArr[idx] = { title: step.title, desc: newDesc };
                            setSettings({ ...settings, aboutMethodology: updatedArr });
                          }}
                          className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl outline-none text-slate-900 dark:text-white"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 4. Mentorship Board (Faculty Panel) Management */}
              <div className="space-y-4 border-t border-slate-100 dark:border-white/10 pt-6">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/10 pb-3">
                  <div>
                    <h3 className="font-heading font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                      4. Expert Faculty Panel (Mentorship Board)
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      View, edit, reorder, or remove faculty members displayed on the About page.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFacultyModal({ isOpen: true, data: { name: '', role: 'Senior GS Faculty', experience: '10+ Years', bio: '', avatar: '' } })}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Faculty</span>
                  </button>
                </div>

                {facultyList.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">No faculty members found. Click above to add one.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {facultyList.map((fac, i) => (
                      <div key={fac.id || i} className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/10 rounded-2xl space-y-3 relative group">
                        <div className="flex items-center gap-3">
                          <img
                            src={fac.avatar || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200'}
                            alt={fac.name}
                            className="w-12 h-12 rounded-xl object-cover border border-amber-500/40 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">{fac.name}</h4>
                            <p className="text-[10px] text-amber-600 font-semibold">{fac.role}</p>
                            <p className="text-[9px] text-slate-400">{fac.experience} Exp</p>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{fac.bio}</p>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-white/10 text-[10px]">
                          <span className="text-slate-400 font-mono">Position #{i + 1}</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setFacultyModal({ isOpen: true, data: { ...fac } })}
                              className="px-2 py-1 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-white/10 font-bold hover:bg-slate-100"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                if (!confirm(`Delete faculty "${fac.name}"?`)) return;
                                try {
                                  const identifier = fac.id || fac.name;
                                  setFacultyList(prev => prev.filter((f, idx) => f.id ? f.id !== fac.id : idx !== i));
                                  if (identifier) {
                                    await db.deleteFaculty(identifier);
                                  }
                                  fetchCMSData();
                                } catch (err) { console.error('Error deleting faculty:', err); }
                              }}
                              className="px-2 py-1 bg-red-50 text-red-600 rounded-lg border border-red-200 font-bold hover:bg-red-100 cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 5. Hall of Fame (Toppers & Achievers) Management */}
              <div className="space-y-4 border-t border-slate-100 dark:border-white/10 pt-6">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/10 pb-3">
                  <div>
                    <h3 className="font-heading font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                      5. BPSC Achievers & Toppers (Hall of Fame)
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      View, edit, reorder, or remove selected toppers displayed in the Hall of Fame on the About page.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTopperModal({ isOpen: true, data: { id: '', name: '', rank: 'Rank 01 - 70th BPSC', exam: 'BPSC', course: '', service: 'Sub-Divisional Officer (SDO)', district: '', photo: '', year: new Date().getFullYear(), story: '' } })}
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Topper</span>
                  </button>
                </div>

                {toppersList.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">No toppers found. Click above to add one.</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {toppersList.map((top, i) => (
                      <div key={top.id || i} className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/10 rounded-2xl text-center space-y-2 relative group">
                        <img
                          src={top.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                          alt={top.name}
                          className="w-16 h-16 rounded-full object-cover border-2 border-amber-500 mx-auto shadow-sm"
                        />
                        <div>
                          <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">{top.name}</h4>
                          <p className="text-[10px] text-amber-600 font-extrabold">{top.rank}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">{top.service}</p>
                        </div>

                        <div className="flex items-center justify-center gap-1.5 pt-2 border-t border-slate-200/60 dark:border-white/10 text-[10px]">
                          <button
                            type="button"
                            onClick={() => setTopperModal({ isOpen: true, data: { ...top } })}
                            className="px-2.5 py-1 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-white/10 font-bold hover:bg-slate-100"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (!confirm(`Delete topper "${top.name}"?`)) return;
                              try {
                                const identifier = top.id || top.name;
                                setToppersList(prev => prev.filter((t, idx) => t.id ? t.id !== top.id : idx !== i));
                                if (identifier) {
                                  await db.deleteResult(identifier);
                                }
                                fetchCMSData();
                              } catch (err) { console.error('Error deleting topper:', err); }
                            }}
                            className="px-2 py-1 bg-red-50 text-red-600 rounded-lg border border-red-200 font-bold hover:bg-red-100 cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all cursor-pointer"
              >
                💾 Save About Us Page Changes
              </button>
            </form>
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

        {/* TAB: CONTACT */}
        {(activeTab as any) === 'Contact' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-6 rounded-3xl shadow-sm">
              <div>
                <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">Public Contact Info</span>
                <h2 className="text-xl font-heading font-extrabold text-slate-900 dark:text-white">Contact Page & Helpline CMS</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Manage Patna office address, contact numbers, email, hours, and map locations displayed on `/contact`.
                </p>
              </div>
              <a
                href="/contact"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-2xl text-xs cursor-pointer shadow-sm transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Preview /contact ↗</span>
              </a>
            </div>

            <form onSubmit={handleSaveSettings} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-6 sm:p-8 rounded-3xl space-y-6 shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Contact Main Heading Title</label>
                  <input
                    type="text"
                    value={settings.contactTitle || ''}
                    onChange={(e) => setSettings({ ...settings, contactTitle: e.target.value })}
                    className="w-full px-4 py-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl outline-none font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Admission Phone Helpline</label>
                  <input
                    type="text"
                    value={settings.contactPhone || ''}
                    onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                    className="w-full px-4 py-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl outline-none font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Official Email Address</label>
                  <input
                    type="email"
                    value={settings.contactEmail || ''}
                    onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                    className="w-full px-4 py-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl outline-none font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Working Hours</label>
                  <input
                    type="text"
                    value={settings.contactHours || ''}
                    onChange={(e) => setSettings({ ...settings, contactHours: e.target.value })}
                    className="w-full px-4 py-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl outline-none text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Corporate Physical Address</label>
                <textarea
                  rows={2}
                  value={settings.contactAddress || ''}
                  onChange={(e) => setSettings({ ...settings, contactAddress: e.target.value })}
                  className="w-full px-4 py-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl outline-none text-slate-900 dark:text-white"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all cursor-pointer"
              >
                💾 Save Contact Page Settings
              </button>
            </form>
          </div>
        )}


        {/* TAB: PYQ */}
        {(activeTab === 'PYQ' || (activeTab as any) === 'PYQs Manager') && (
          <div className="space-y-6">
            <PYQsManagerCMS />
          </div>
        )}

        {/* TAB: NCERT */}
        {activeTab === 'NCERT' && (
          <div className="space-y-6">
            <NCERTBooksManagerCMS />
          </div>
        )}

        {/* TAB: PUBLICATIONS */}
        {activeTab === 'Publications' && (
          <NcertStyleResourceCMS
            pageSlug="fa-publications"
            pageTitle="Final Attempt Publications"
            portalCategoryLabel="Publications Console"
            portalDescription="Upload & manage downloadable publications, yearbooks, handbooks & model answers."
            themeColor="purple"
            typeOptions={['BPSC', 'Arunachal PCS (APPSC)', 'Arunachal Pradesh Staff Selection Board (APSSB)', 'Books', 'Yearbooks']}
          />
        )}

        {/* TAB: RAPID REVISION */}
        {activeTab === 'Rapid Revision' && (
          <NcertStyleResourceCMS
            pageSlug="rapid-revision"
            pageTitle="Rapid Revision Materials"
            portalCategoryLabel="Rapid Revision Console"
            portalDescription="Upload BPSC prelims 100 quick revision formulas, economic survey tables & notes."
            themeColor="rose"
            typeOptions={['Quick Tables', 'Formula Sheets', 'Economic Survey', 'Budget Summary', 'General']}
          />
        )}

        {/* TAB: VALUE ADDITION */}
        {activeTab === 'Value Addition' && (
          <NcertStyleResourceCMS
            pageSlug="value-added-mains"
            pageTitle="Value Added Materials — Mains"
            portalCategoryLabel="Value Addition Console"
            portalDescription="Manage Mains data booklets, SC judgments, case studies & Bihar state schemes."
            themeColor="cyan"
            typeOptions={['Mains Data', 'SC Judgments', 'Quotes & Intro', 'Bihar Schemes', 'General']}
          />
        )}

        {/* TAB: TOPPERS COPIES */}
        {activeTab === 'Toppers Copies' && (
          <NcertStyleResourceCMS
            pageSlug="toppers-copies"
            pageTitle="Toppers' Copies"
            portalCategoryLabel="Toppers Copies Console"
            portalDescription="Upload BPSC rankers evaluated GS & essay answer copies for student downloads."
            themeColor="blue"
            typeOptions={['69th BPSC Rankers', '68th BPSC Rankers', 'GS Paper 1 & 2', 'Essay Copies', 'General']}
          />
        )}


        {/* TAB: CUSTOM PAGES (FALLBACK) */}
        {(activeTab as any) === 'Custom Pages' && (
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

        {/* TAB: STRATEGY CMS */}
        {((activeTab as any) === 'Strategy & Values' || (activeTab as any) === 'Strategy CMS') && (
          <div className="space-y-6">
            <SyllabusStrategyCMS defaultTab="strategy" />
          </div>
        )}
        {/* TAB: BLOGS CMS */}
        {activeTab === 'Blogs' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-6 rounded-3xl shadow-sm">
              <div>
                <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">Editorial & Blog Posts</span>
                <h2 className="text-xl font-heading font-extrabold text-slate-900 dark:text-white">Blog Articles CMS Manager</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Create, update, and manage published articles, strategy posts, and BPSC preparation guides for `/blog`.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href="/blog"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold rounded-2xl text-xs cursor-pointer shadow-sm transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Preview /blog ↗</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setBlogForm({
                      id: '',
                      title: '',
                      publishDate: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
                      readTime: '5 min read',
                      category: 'Strategy',
                      content: '',
                      imageUrl: '',
                      seoTitle: '',
                      seoKeywords: '',
                      seoDescription: '',
                      blurb: ''
                    });
                    setActiveModal({ type: 'add' });
                  }}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-2xl text-xs cursor-pointer shadow-md transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Blog Post</span>
                </button>
              </div>
            </div>

            {/* Blogs Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 overflow-hidden rounded-3xl shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-white/10 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                      <th className="p-4">Article Title</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Publish Date</th>
                      <th className="p-4">Read Time</th>
                      <th className="p-4">Cover Image</th>
                      <th className="p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blogsList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-12 text-center text-slate-400 text-xs">
                          No blog posts found. Click <strong>&quot;Create New Blog Post&quot;</strong> above to publish your first article.
                        </td>
                      </tr>
                    ) : (
                      blogsList.map((blog, idx) => (
                        <tr key={blog.id || idx} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-4 max-w-sm">
                            <div className="font-extrabold text-slate-900 dark:text-white line-clamp-1">{blog.title}</div>
                            {blog.blurb && <div className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">{blog.blurb}</div>}
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              {blog.category || 'General'}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-slate-600 dark:text-slate-300 text-[11px]">{blog.publishDate}</td>
                          <td className="p-4 text-slate-500 dark:text-slate-400 text-[11px]">{blog.readTime}</td>
                          <td className="p-4">
                            {blog.imageUrl ? (
                              <img src={blog.imageUrl} alt={blog.title} className="w-12 h-8 rounded-lg object-cover border border-slate-200 dark:border-white/10" />
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">No image</span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setBlogForm({ ...blog });
                                  setActiveModal({ type: 'edit', index: idx });
                                }}
                                className="p-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl font-bold transition-all cursor-pointer border border-amber-500/20"
                                title="Edit Article"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteBlog(blog.id)}
                                className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl font-bold transition-all cursor-pointer border border-red-500/20"
                                title="Delete Article"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
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
        {(activeTab === 'Users' || (activeTab as any) === 'Students') && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white/70 backdrop-blur-md p-5 rounded-3xl border border-slate-200 shadow-xs">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">User Directory & Platform Accounts</h3>
                <p className="text-[10px] text-slate-500 font-medium">Manage student course enrollments, faculty credentials, and administrator roles.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
                  Total Users: {usersList.length}
                </span>
              </div>
            </div>

            {/* Role Filter Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              {[
                { id: 'all', label: 'All Registered Accounts', count: usersList.length },
                { id: 'student', label: '🎓 Students Only', count: usersList.filter(u => u.role === 'student' || !u.role).length },
                { id: 'faculty', label: '👨‍🏫 Faculty Members', count: usersList.filter(u => u.role === 'faculty').length },
                { id: 'admin', label: '👑 Administrators', count: usersList.filter(u => u.role === 'admin').length },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setUserRoleFilter(tab.id as 'all' | 'student' | 'faculty' | 'admin')}
                  className={`px-4 py-2 text-xs font-bold rounded-2xl transition-all ${
                    userRoleFilter === tab.id
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {tab.label} <span className="opacity-70 ml-1 text-[10px]">({tab.count})</span>
                </button>
              ))}
            </div>

            <div className="bg-white border border-slate-200 overflow-hidden rounded-3xl shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                      <th className="p-4">User Info</th>
                      <th className="p-4">Mobile & Email</th>
                      <th className="p-4">Target Exam</th>
                      <th className="p-4">Course Enrolled</th>
                      <th className="p-4">Batch</th>
                      <th className="p-4">Payment ID & Status</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Account Status</th>
                      <th className="p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.filter(u => {
                      if (userRoleFilter === 'student') return u.role === 'student' || !u.role;
                      if (userRoleFilter === 'faculty') return u.role === 'faculty';
                      if (userRoleFilter === 'admin') return u.role === 'admin';
                      return true;
                    }).length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-slate-400 text-xs">No accounts found for selected filter.</td>
                      </tr>
                    ) : (
                      usersList.filter(u => {
                        if (userRoleFilter === 'student') return u.role === 'student' || !u.role;
                        if (userRoleFilter === 'faculty') return u.role === 'faculty';
                        if (userRoleFilter === 'admin') return u.role === 'admin';
                        return true;
                      }).map((user) => {
                        const hasEnrollments = user.enrollments && user.enrollments.length > 0;
                        const isStudent = user.role === 'student' || !user.role;
                        return (
                          <tr
                            key={user.id}
                            className="border-b border-slate-100 hover:bg-amber-500/5 transition-colors cursor-pointer"
                            onClick={() => {
                              setSelectedUserModal(user);
                              setEditUserForm({ ...user });
                            }}
                          >
                            {/* User Info */}
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

                            {/* Target Exam (Only relevant for Students) */}
                            <td className="p-4">
                              {isStudent ? (
                                <span className="font-medium text-slate-700">{user.targetExam || 'General BPSC'}</span>
                              ) : (
                                <span className="text-slate-400 text-[11px] italic">N/A ({user.role.toUpperCase()})</span>
                              )}
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

                            {/* Role Column with Instant Selector Dropdown */}
                            <td className="p-4" onClick={(e) => e.stopPropagation()}>
                              <select
                                value={user.role || 'student'}
                                onChange={async (e) => {
                                  const newRole = e.target.value as 'student' | 'faculty' | 'admin';
                                  try {
                                    const res = await fetch(`${BACKEND_URL}/api/auth/users/${user.id}/role`, {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ role: newRole })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      setUsersList(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u));
                                      alert(`User ${user.fullName}'s role updated to ${newRole.toUpperCase()}!`);
                                    } else {
                                      alert(`Failed to update role: ${data.error || 'Unknown error'}`);
                                    }
                                  } catch (err) {
                                    console.error('Role update error:', err);
                                    alert('Failed to connect to backend server.');
                                  }
                                }}
                                className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase outline-none cursor-pointer border shadow-2xs ${
                                  user.role === 'admin'
                                    ? 'bg-purple-50 text-purple-700 border-purple-300 hover:bg-purple-100'
                                    : user.role === 'faculty'
                                    ? 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100'
                                    : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                                }`}
                              >
                                <option value="student">🎓 Student</option>
                                <option value="faculty">👨‍🏫 Faculty</option>
                                <option value="admin">👑 Admin</option>
                              </select>
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
                                <span>Inspect & Edit</span>
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
                📅 Daily, Weekly, Monthly, Yearly
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
                🌐 National, International & Bihar Special
              </button>
            </div>

            {caSubTab === 'daily' ? (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Current Affairs</h3>
                    <p className="text-[10px] text-slate-500 font-medium">Manage current affairs updates for students.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setEditingEdition({ id: '', publishDate: new Date().toISOString().split('T')[0], summary: 'Daily Edition', articles: [] });
                        setIsEditionModalOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs shadow-sm cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create Daily Edition</span>
                    </button>
                    <button
                      onClick={() => {
                        setEditingEdition({ id: '', publishDate: new Date().toISOString().split('T')[0], summary: 'Weekly Edition', articles: [] });
                        setIsEditionModalOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs shadow-sm cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create Weekly Edition</span>
                    </button>
                    <button
                      onClick={() => {
                        setEditingEdition({ id: '', publishDate: new Date().toISOString().split('T')[0], summary: 'Monthly Edition', articles: [] });
                        setIsEditionModalOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs shadow-sm cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create Monthly Edition</span>
                    </button>
                    <button
                      onClick={() => {
                        setEditingEdition({ id: '', publishDate: new Date().toISOString().split('T')[0], summary: 'Yearly Edition', articles: [] });
                        setIsEditionModalOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-2xl text-xs shadow-sm cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create Yearly Edition</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {dynamicEditionsList.map((ed) => {
                    const natCount = ed.articles?.filter(a => a.category === 'NATIONAL').length || 0;
                    const intCount = ed.articles?.filter(a => a.category === 'INTERNATIONAL').length || 0;
                    const bihCount = ed.articles?.filter(a => a.category === 'BIHAR').length || 0;

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
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">National, International & Bihar Special Articles</h3>
                    <p className="text-[10px] text-slate-500">Publish descriptive topic analyses, editorials, and GS syllabus-aligned articles.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setCaForm({ id: '', title: '', category: 'National', publishDate: new Date().toISOString().split('T')[0], summary: '', content: '', relevance: '', context: '', analysis: '', wayForward: '', practiceQuestion: '' });
                        setActiveModal({ type: 'add' });
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs shadow-sm cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add National Article</span>
                    </button>
                    <button
                      onClick={() => {
                        setCaForm({ id: '', title: '', category: 'International', publishDate: new Date().toISOString().split('T')[0], summary: '', content: '', relevance: '', context: '', analysis: '', wayForward: '', practiceQuestion: '' });
                        setActiveModal({ type: 'add' });
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl text-xs shadow-sm cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add International Article</span>
                    </button>
                    <button
                      onClick={() => {
                        setCaForm({ id: '', title: '', category: 'Bihar Special', publishDate: new Date().toISOString().split('T')[0], summary: '', content: '', relevance: '', context: '', analysis: '', wayForward: '', practiceQuestion: '' });
                        setActiveModal({ type: 'add' });
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-2xl text-xs shadow-sm cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Bihar Special Article</span>
                    </button>
                    <button
                      onClick={() => {
                        setCaForm({ id: '', title: '', category: 'Arunachal Special', publishDate: new Date().toISOString().split('T')[0], summary: '', content: '', relevance: '', context: '', analysis: '', wayForward: '', practiceQuestion: '' });
                        setActiveModal({ type: 'add' });
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs shadow-sm cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Arunachal Special Article</span>
                    </button>
                  </div>
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

            {/* Modal add/edit CA (Topic Articles) */}
            {activeModal && activeTab === 'Current Affairs' && (
              <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <form onSubmit={handleSaveCA} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] p-6 sm:p-8 rounded-3xl max-w-5xl w-full max-h-[90vh] flex flex-col space-y-4 shadow-2xl">
                  <div className="flex justify-between items-center border-b pb-3 shrink-0">
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                      {activeModal.type === 'add' ? 'Add Current Affairs Article' : 'Edit Current Affairs Article'}
                    </h3>
                    <button
                      type="button" onClick={() => setActiveModal(null)}
                      className="text-slate-400 hover:text-slate-650 cursor-pointer font-bold text-sm"
                    >
                      ✕ Close
                    </button>
                  </div>

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
                        onChange={(e) => setCaForm({ ...caForm, category: e.target.value as CurrentAffairArticle['category'] })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:border-slate-400 outline-none"
                      >
                        <option value="National">National</option>
                        <option value="International">International</option>
                        <option value="Bihar Special">Bihar Special</option>
                        <option value="Arunachal Special">Arunachal Special</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-5 pr-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Syllabus & Topic Mapping</label>
                      <input
                        type="text" value={caForm.relevance || ''}
                        onChange={(e) => setCaForm({ ...caForm, relevance: e.target.value })}
                        placeholder="e.g. Constitutional Amendments, Economic Policy..."
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
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Practice Question</label>
                      <textarea
                        rows={2} value={caForm.practiceQuestion || ''}
                        onChange={(e) => setCaForm({ ...caForm, practiceQuestion: e.target.value })}
                        placeholder="Enter practice question based on this article..."
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

            {/* Modal add/edit Blog Post */}
            {activeModal && (activeTab as any) === 'Blogs' && (
              <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <form onSubmit={handleSaveBlog} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] p-6 sm:p-8 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col space-y-4 shadow-2xl">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/10 pb-3 shrink-0">
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                      {activeModal.type === 'add' ? 'Create New Blog Post' : 'Edit Blog Post'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer font-bold text-sm"
                    >
                      ✕ Close
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">Article Title *</label>
                        <input
                          type="text"
                          required
                          value={blogForm.title}
                          onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })}
                          placeholder="e.g. 71st BPSC Prelims Strategy & Syllabus Breakdown..."
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white text-xs outline-none font-bold"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">Category</label>
                        <input
                          type="text"
                          value={blogForm.category}
                          onChange={(e) => setBlogForm({ ...blogForm, category: e.target.value })}
                          placeholder="Strategy, Current Affairs, Economy..."
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white text-xs outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">Estimated Read Time</label>
                        <input
                          type="text"
                          value={blogForm.readTime}
                          onChange={(e) => setBlogForm({ ...blogForm, readTime: e.target.value })}
                          placeholder="5 min read"
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white text-xs outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">Cover Image URL</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={blogForm.imageUrl || ''}
                            onChange={(e) => setBlogForm({ ...blogForm, imageUrl: e.target.value })}
                            placeholder="https://..."
                            className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white text-xs outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setMediaPickerConfig({ isOpen: true, field: 'blogImage' })}
                            className="px-3 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-bold shrink-0 cursor-pointer"
                          >
                            🖼️ Media
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Short Summary (Blurb)</label>
                      <textarea
                        rows={2}
                        value={blogForm.blurb || ''}
                        onChange={(e) => setBlogForm({ ...blogForm, blurb: e.target.value })}
                        placeholder="Brief summary sentence that appears on blog cards..."
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white text-xs outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Full Article Content (Rich Editor)</label>
                      <RichTextEditor
                        value={blogForm.content || ''}
                        onChange={(html) => setBlogForm({ ...blogForm, content: html })}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-white/10 shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-2xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-2xl cursor-pointer shadow-md"
                    >
                      Save & Publish Blog Post
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Edition Designer Modal */}
            {isEditionModalOpen && editingEdition && (
              <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] p-6 sm:p-8 rounded-3xl max-w-6xl w-full max-h-[90vh] flex flex-col space-y-6 shadow-2xl relative">
                  <div className="flex justify-between items-center border-b pb-4">
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                      {editingEdition.id ? 'Edit Current Affairs Edition' : 'Create Current Affairs Edition'}
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

                    {/* ARTICLE LIST CONTAINER */}
                    <div className="flex-1 overflow-y-auto space-y-6 pr-1 border-t pt-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-black uppercase text-slate-600 dark:text-slate-350 tracking-wider">Edition Articles List ({(editingEdition.articles || []).length})</h4>
                        <button
                          type="button" onClick={() => handleAddArticleToEdition('NATIONAL')}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 shadow-sm"
                        >
                          <Plus className="w-4 h-4" />
                          <span>+ Add Article to Edition</span>
                        </button>
                      </div>

                      <div className="space-y-2">
                        {(!editingEdition.articles || editingEdition.articles.length === 0) ? (
                          <div className="p-8 text-center bg-slate-50 dark:bg-slate-950/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                            <p className="text-xs text-slate-500 font-medium">No articles added to this edition yet. Click &quot;+ Add Article to Edition&quot; above.</p>
                          </div>
                        ) : (
                          editingEdition.articles.map((art) => (
                            <div key={art.id} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-white/[0.04] rounded-2xl">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 border border-amber-500/20">{art.category}</span>
                                  <span className="text-[10px] text-slate-400">{art.importance} Importance &bull; {art.readingTime}</span>
                                </div>
                                <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">{art.title}</h5>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  type="button" onClick={() => {
                                    setEditingArticle(art);
                                    setIsArticleModalOpen(true);
                                  }}
                                  className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button" onClick={() => handleDeleteArticleFromEdition(art.id)}
                                  className="p-2 border border-red-200 dark:border-red-900/50 rounded-xl hover:bg-red-50 text-red-500 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
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
                        Save & Publish Edition
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Dynamic Article Creator Sub-Modal */}
            {isArticleModalOpen && editingArticle && (
              <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] p-6 sm:p-8 rounded-3xl max-w-5xl w-full max-h-[90vh] flex flex-col space-y-6 shadow-2xl relative">
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

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">Category</label>
                        <select
                          value={editingArticle.category || 'NATIONAL'}
                          onChange={(e) => setEditingArticle({ ...editingArticle, category: e.target.value as any })}
                          className="w-full px-4 py-2 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:border-slate-400 outline-none"
                        >
                          <option value="NATIONAL">NATIONAL</option>
                          <option value="INTERNATIONAL">INTERNATIONAL</option>
                          <option value="BIHAR">BIHAR</option>
                          <option value="ARUNACHAL">ARUNACHAL</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">Importance</label>
                        <select
                          value={editingArticle.importance}
                          onChange={(e) => setEditingArticle({ ...editingArticle, importance: e.target.value as 'HIGH' | 'MEDIUM' | 'LOW' })}
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
                          onChange={(e) => setEditingArticle({ ...editingArticle, publishStatus: e.target.value as 'DRAFT' | 'PUBLISHED' })}
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
                            onChange={(e) => setEditingArticle({ ...editingArticle, subjects: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                            placeholder="Polity, Economy..."
                            className="w-full px-4 py-2 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:border-slate-400 outline-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-400 font-bold uppercase">Exams (comma separated)</label>
                          <input
                            type="text"
                            value={Array.isArray(editingArticle.exams) ? editingArticle.exams.join(', ') : (editingArticle.exams || '')}
                            onChange={(e) => setEditingArticle({ ...editingArticle, exams: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                            placeholder="BPSC, Foundation..."
                            className="w-full px-4 py-2 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:border-slate-400 outline-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-400 font-bold uppercase">Tags (comma separated)</label>
                          <input
                            type="text"
                            value={Array.isArray(editingArticle.tags) ? editingArticle.tags.join(', ') : (editingArticle.tags || '')}
                            onChange={(e) => setEditingArticle({ ...editingArticle, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
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
        {(activeTab as any) === 'Resources' && (
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
            {activeModal && (activeTab as any) === 'Resources' && (
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
                      setCourseForm({ id: `course-${Date.now()}`, title: '', exam: 'BPSC', category: 'Prelims', description: '', fee: 4999, duration: '6 Months', schedule: 'Daily 2 hrs', isPublished: true });
                      setActiveModal({ type: 'add' });
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs animate-in shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Course</span>
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
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 border border-amber-500/20">
                          {course.exam || 'BPSC'}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-600 border border-blue-500/20">
                          {course.category}
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold">
                          {typeof course.fee === 'number' ? `₹${course.fee.toLocaleString('en-IN')}` : (course.fee || '₹0')}
                        </span>
                      </div>
                      <Link
                        href={`/admin/courses/${course.id}`}
                        className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-[10px] flex items-center gap-1 transition-all shadow-2xs"
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
                    {activeModal.type === 'add' ? 'Create Course' : 'Edit Course'}
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
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Target Exam State</label>
                      <select
                        value={courseForm.exam || 'BPSC'}
                        onChange={(e) => setCourseForm({ ...courseForm, exam: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-2xl focus:outline-none focus:border-slate-400"
                      >
                        <option value="BPSC">BPSC (Bihar PCS)</option>
                        <option value="Arunachal PCS">Arunachal PCS (APPSC)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Exam Stage / Category</label>
                      <select
                        value={courseForm.category || 'Prelims'}
                        onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-2xl focus:outline-none focus:border-slate-400"
                      >
                        <option value="Prelims">Prelims</option>
                        <option value="Mains">Mains</option>
                        <option value="Interview">Interview</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Course Fee (in ₹ INR)</label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-slate-500 font-bold text-xs">₹</span>
                        <input
                          type="number" required value={courseForm.fee}
                          placeholder="0"
                          onChange={(e) => setCourseForm({ ...courseForm, fee: Number(e.target.value) })}
                          className="w-full pl-7 pr-4 py-2 bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-2xl focus:outline-none focus:border-slate-400 font-semibold"
                        />
                      </div>
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
                      onClick={() => setEditUserForm(prev => ({ ...prev, role: r.role as UserProfile['role'] }))}
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

                  {(editUserForm.role === 'student' || !editUserForm.role) && (
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Target Exam (Students Only)</label>
                      <input
                        type="text"
                        placeholder="e.g. 72nd BPSC Combined Competitive Exam"
                        value={editUserForm.targetExam || ''}
                        onChange={(e) => setEditUserForm(prev => ({ ...prev, targetExam: e.target.value }))}
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none text-slate-900 dark:text-white font-bold"
                      />
                    </div>
                  )}

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Profile Photo / Avatar URL</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="https://example.com/avatar.jpg"
                        value={editUserForm.avatarUrl || ''}
                        onChange={(e) => setEditUserForm(prev => ({ ...prev, avatarUrl: e.target.value }))}
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none text-slate-900 dark:text-white font-mono"
                      />
                      {editUserForm.avatarUrl && (
                        <img src={editUserForm.avatarUrl} alt="Preview" className="w-9 h-9 rounded-xl object-cover shrink-0 border border-amber-500" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Course & Test Series Enrollment Management */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                    Assigned Programs & Test Series
                  </h4>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {selectedUserModal.enrollments?.length || 0} Programs Active
                  </span>
                </div>

                {/* Instant Program Assigner Controls */}
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-3">
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                    + Assign New Course or Test Series
                  </span>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      id="assignCourseSelect"
                      className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none text-slate-900 dark:text-white font-bold"
                    >
                      <option value="">-- Select Course or Test Series --</option>
                      {coursesList.map(c => (
                        <option key={c.id} value={c.id}>{c.title} ({c.category})</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={async () => {
                        const selectEl = document.getElementById('assignCourseSelect') as HTMLSelectElement;
                        const courseId = selectEl?.value;
                        if (!courseId) {
                          alert('Please select a course or test series to assign.');
                          return;
                        }
                        try {
                          const res = await fetch(`${BACKEND_URL}/api/lms/admin/enrollments`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId: selectedUserModal.id, courseId })
                          });
                          const data = await res.json();
                          if (data.success) {
                            alert('Program assigned successfully to user!');
                            // Refresh users list
                            const usersRes = await fetch(`${BACKEND_URL}/api/auth/users`);
                            const usersData = await usersRes.json();
                            setUsersList(usersData);
                            const updatedUser = usersData.find((u: any) => u.id === selectedUserModal.id);
                            if (updatedUser) setSelectedUserModal(updatedUser);
                          } else {
                            alert(`Failed to assign program: ${data.error || 'Already assigned'}`);
                          }
                        } catch (err) {
                          console.error(err);
                          alert('Connection error');
                        }
                      }}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl cursor-pointer shadow-xs whitespace-nowrap"
                    >
                      Assign Program
                    </button>
                  </div>
                </div>

                {/* Currently Assigned Enrollments List with Revoke Action */}
                <div className="space-y-2">
                  {(!selectedUserModal.enrollments || selectedUserModal.enrollments.length === 0) ? (
                    <p className="text-xs text-slate-400 italic p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                      No active course or test series assigned to this user yet.
                    </p>
                  ) : (
                    selectedUserModal.enrollments.map((enr, i) => (
                      <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-150 dark:border-white/5 rounded-2xl flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{enr.courseTitle}</div>
                          <div className="text-[10px] text-slate-400 font-mono">ID: {enr.courseId} • Status: {enr.paymentStatus}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                            Active Access
                          </span>
                          <button
                            type="button"
                            onClick={async () => {
                              if (!confirm(`Revoke access to ${enr.courseTitle} for ${selectedUserModal.fullName}?`)) return;
                              try {
                                const res = await fetch(`${BACKEND_URL}/api/lms/admin/enrollments`, {
                                  method: 'DELETE',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ userId: selectedUserModal.id, courseId: enr.courseId })
                                });
                                const data = await res.json();
                                if (data.success) {
                                  alert('Access revoked successfully.');
                                  const usersRes = await fetch(`${BACKEND_URL}/api/auth/users`);
                                  const usersData = await usersRes.json();
                                  setUsersList(usersData);
                                  const updatedUser = usersData.find((u: any) => u.id === selectedUserModal.id);
                                  if (updatedUser) setSelectedUserModal(updatedUser);
                                }
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl cursor-pointer"
                            title="Revoke Access"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
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

      {/* FACULTY MEMBER ADD / EDIT POPUP MODAL */}
      {facultyModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl space-y-6 p-6 sm:p-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 dark:bg-blue-950/30 px-2.5 py-0.5 rounded-lg border border-blue-200">
                  Mentorship Board Manager
                </span>
                <h3 className="font-heading font-black text-xl text-slate-900 dark:text-white mt-1">
                  {facultyModal.data?.id ? 'Edit Faculty Profile' : 'Add New Faculty Member'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setFacultyModal({ isOpen: false, data: null })}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Anand Kumar"
                  value={facultyModal.data?.name || ''}
                  onChange={(e) => setFacultyModal(prev => ({ ...prev, data: { ...prev.data, name: e.target.value } }))}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Designation / Role</label>
                  <input
                    type="text"
                    placeholder="Senior GS Faculty"
                    value={facultyModal.data?.role || ''}
                    onChange={(e) => setFacultyModal(prev => ({ ...prev, data: { ...prev.data, role: e.target.value } }))}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Experience</label>
                  <input
                    type="text"
                    placeholder="12+ Years"
                    value={facultyModal.data?.experience || ''}
                    onChange={(e) => setFacultyModal(prev => ({ ...prev, data: { ...prev.data, experience: e.target.value } }))}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Short Bio / Highlights</label>
                <textarea
                  rows={3}
                  placeholder="Former Civil Services Evaluator and Author of Bihar GS Digests..."
                  value={facultyModal.data?.bio || ''}
                  onChange={(e) => setFacultyModal(prev => ({ ...prev, data: { ...prev.data, bio: e.target.value } }))}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Photo / Avatar Image URL</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="https://example.com/faculty.jpg"
                    value={facultyModal.data?.avatar || ''}
                    onChange={(e) => setFacultyModal(prev => ({ ...prev, data: { ...prev.data, avatar: e.target.value } }))}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none font-mono text-slate-900 dark:text-white"
                  />
                  {facultyModal.data?.avatar && (
                    <img src={facultyModal.data.avatar} alt="Preview" className="w-10 h-10 rounded-xl object-cover shrink-0 border border-blue-500" />
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/[0.06]">
              <button
                type="button"
                onClick={() => setFacultyModal({ isOpen: false, data: null })}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!facultyModal.data?.name) { alert('Faculty name is required'); return; }
                  const isEdit = Boolean(facultyModal.data?.id);
                  const url = isEdit ? `${BACKEND_URL}/api/faculty/${facultyModal.data.id}` : `${BACKEND_URL}/api/faculty`;
                  const method = isEdit ? 'PUT' : 'POST';

                  try {
                    const res = await fetch(url, {
                      method,
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(facultyModal.data)
                    });
                    const data = await res.json();
                    if (data.success || res.ok) {
                      setFacultyModal({ isOpen: false, data: null });
                      fetchCMSData();
                    } else {
                      alert(`Error saving faculty: ${data.error || 'Unknown error'}`);
                    }
                  } catch (err) {
                    console.error('Faculty save error:', err);
                  }
                }}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Save Faculty Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOPPER & ACHIEVER ADD / EDIT POPUP MODAL */}
      {topperModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl space-y-6 p-6 sm:p-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/20">
                  Hall of Fame Manager
                </span>
                <h3 className="font-heading font-black text-xl text-slate-900 dark:text-white mt-1">
                  {topperModal.data?.id ? 'Edit Topper Details' : 'Add New BPSC Achiever'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setTopperModal({ isOpen: false, data: null })}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Topper Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Aarav Kumar"
                  value={topperModal.data?.name || ''}
                  onChange={(e) => setTopperModal(prev => ({ ...prev, data: { ...prev.data, name: e.target.value } as ResultTopper }))}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Rank & Exam Session</label>
                  <input
                    type="text"
                    placeholder="Rank 04 - 69th BPSC"
                    value={topperModal.data?.rank || ''}
                    onChange={(e) => setTopperModal(prev => ({ ...prev, data: { ...prev.data, rank: e.target.value } as ResultTopper }))}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Service Allocated</label>
                  <input
                    type="text"
                    placeholder="Sub-Divisional Officer (SDO)"
                    value={topperModal.data?.service || ''}
                    onChange={(e) => setTopperModal(prev => ({ ...prev, data: { ...prev.data, service: e.target.value } as ResultTopper }))}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Topper Photo URL</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="https://example.com/topper.jpg"
                    value={topperModal.data?.photo || ''}
                    onChange={(e) => setTopperModal(prev => ({ ...prev, data: { ...prev.data, photo: e.target.value } as ResultTopper }))}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none font-mono text-slate-900 dark:text-white"
                  />
                  {topperModal.data?.photo && (
                    <img src={topperModal.data.photo} alt="Preview" className="w-10 h-10 rounded-full object-cover shrink-0 border-2 border-amber-500" />
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/[0.06]">
              <button
                type="button"
                onClick={() => setTopperModal({ isOpen: false, data: null })}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!topperModal.data?.name) { alert('Topper name is required'); return; }
                  const isEdit = Boolean(topperModal.data?.id);
                  const url = isEdit ? `${BACKEND_URL}/api/results/${topperModal.data.id}` : `${BACKEND_URL}/api/results`;
                  const method = isEdit ? 'PUT' : 'POST';

                  try {
                    const res = await fetch(url, {
                      method,
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        name: topperModal.data.name,
                        rank: topperModal.data.rank || 'Rank 01',
                        exam: topperModal.data.exam || 'BPSC',
                        service: topperModal.data.service || 'SDO',
                        photo: topperModal.data.photo || ''
                      })
                    });
                    const data = await res.json();
                    if (data.success || res.ok) {
                      setTopperModal({ isOpen: false, data: null });
                      fetchCMSData();
                    } else {
                      alert(`Error saving topper: ${data.error || 'Unknown error'}`);
                    }
                  } catch (err) {
                    console.error('Topper save error:', err);
                  }
                }}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Save Topper Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
