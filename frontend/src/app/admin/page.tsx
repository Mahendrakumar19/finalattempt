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
  BookOpen
} from 'lucide-react';

type AdminTab = 'Dashboard' | 'Settings' | 'Leads' | 'Faculty' | 'Results' | 'Current Affairs' | 'Blogs' | 'Resources' | 'Courses';

interface SiteSettings {
  heroTitle: string;
  heroSubtitle: string;
  tagline: string;
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

interface FacultyMember {
  id: string;
  name: string;
  role: string;
  experience: string;
  avatar: string;
  bio: string;
  demoLectures: { title: string; duration: string; url: string }[];
}

interface ResultTopper {
  id: string;
  name: string;
  rank: string;
  exam: string;
  course: string;
  service: string;
  district: string;
  photo: string;
  year: number;
  story: string;
}

interface CurrentAffairArticle {
  id: string;
  title: string;
  category: 'National' | 'International' | 'Economy' | 'Environment' | 'Science' | 'Bihar Special';
  publishDate: string;
  summary: string;
  content: string;
}

interface BlogItem {
  id: string;
  title: string;
  publishDate: string;
  readTime: string;
  category: string;
  content: string;
}

interface ResourceDownload {
  id: string;
  title: string;
  size: string;
  type: string;
  downloadCount: number;
  url: string;
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

interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  mobile?: string;
  role: 'student' | 'faculty' | 'admin';
  isActive: boolean;
  createdAt: string;
}

export default function AdminPortal() {
  const [activeTab, setActiveTab] = useState<AdminTab>('Dashboard');
  const [loading, setLoading] = useState(true);
  const [backendOffline, setBackendOffline] = useState(false);

  // States for CMS collections
  const [settings, setSettings] = useState<SiteSettings>({
    heroTitle: '72nd BPSC Preparation Starts Here',
    heroSubtitle: 'Personalized mentorship, smart study tools, and Bihar-focused content designed to help you clear BPSC with confidence.',
    tagline: 'One Mentor. One Strategy. One Final Attempt.'
  });
  const [leadsList, setLeadsList] = useState<Lead[]>([]);
  const [facultyList, setFacultyList] = useState<FacultyMember[]>([]);
  const [resultsList, setResultsList] = useState<ResultTopper[]>([]);
  const [caList, setCaList] = useState<CurrentAffairArticle[]>([]);
  const [blogsList, setBlogsList] = useState<BlogItem[]>([]);
  const [resourcesList, setResourcesList] = useState<ResourceDownload[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [coursesList, setCoursesList] = useState<Course[]>([]);
  const [editMode, setEditMode] = useState(false);

  // Modals visibility states
  const [activeModal, setActiveModal] = useState<{ type: 'add' | 'edit'; index?: number } | null>(null);

  // Simple Local Storage Auth check for Admin Portal
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAdminToken(localStorage.getItem('admin_token'));
    }
  }, []);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminEmail === 'admin@finalattempt.com' && adminPassword === 'Password123') {
      localStorage.setItem('admin_token', 'finalattempt-admin-token-secure-hash');
      setAdminToken('finalattempt-admin-token-secure-hash');
      setAuthError('');
    } else {
      setAuthError('Invalid administrator credentials.');
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('admin_token');
    setAdminToken(null);
  };

  // Form states for CRUD operations
  const [facultyForm, setFacultyForm] = useState<FacultyMember>({ id: '', name: '', role: '', experience: '', avatar: '', bio: '', demoLectures: [] });
  const [resultForm, setResultForm] = useState<ResultTopper>({ id: '', name: '', rank: '', exam: '', course: '', service: '', district: '', photo: '', year: 2026, story: '' });
  const [caForm, setCaForm] = useState<CurrentAffairArticle>({ id: '', title: '', category: 'National', publishDate: '', summary: '', content: '' });
  const [blogForm, setBlogForm] = useState<BlogItem>({ id: '', title: '', publishDate: '', readTime: '', category: '', content: '' });
  const [resourceForm, setResourceForm] = useState<ResourceDownload>({ id: '', title: '', size: '', type: 'PDF', downloadCount: 0, url: '' });
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

      // 3. Faculty
      const facRes = await fetch(`${BACKEND_URL}/api/faculty`);
      if (facRes.ok) setFacultyList(await facRes.json());

      // 4. Results
      const resRes = await fetch(`${BACKEND_URL}/api/results`);
      if (resRes.ok) setResultsList(await resRes.json());

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

  const handleSaveFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeModal?.type === 'add') {
      const newItem = { ...facultyForm, id: `fac-${Date.now()}` };
      setFacultyList(prev => [...prev, newItem]);
      await fetch(`${BACKEND_URL}/api/faculty`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });
    } else {
      const id = facultyForm.id;
      setFacultyList(prev => prev.map(f => f.id === id ? facultyForm : f));
      await fetch(`${BACKEND_URL}/api/faculty/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(facultyForm)
      });
    }
    setActiveModal(null);
  };

  const handleDeleteFaculty = async (id: string) => {
    if (!window.confirm('Delete this faculty profile?')) return;
    setFacultyList(prev => prev.filter(f => f.id !== id));
    await fetch(`${BACKEND_URL}/api/faculty/${id}`, { method: 'DELETE' });
  };

  const handleSaveResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeModal?.type === 'add') {
      const newItem = { ...resultForm, id: `res-${Date.now()}` };
      setResultsList(prev => [...prev, newItem]);
      await fetch(`${BACKEND_URL}/api/results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });
    } else {
      const id = resultForm.id;
      setResultsList(prev => prev.map(r => r.id === id ? resultForm : r));
      await fetch(`${BACKEND_URL}/api/results/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resultForm)
      });
    }
    setActiveModal(null);
  };

  const handleDeleteResult = async (id: string) => {
    if (!window.confirm('Delete this topper result record?')) return;
    setResultsList(prev => prev.filter(r => r.id !== id));
    await fetch(`${BACKEND_URL}/api/results/${id}`, { method: 'DELETE' });
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
    <div className="min-h-screen text-slate-900 font-body flex flex-col lg:flex-row" style={{ background: '#FFFBF2' }}>
      {/* SIDEBAR PANEL */}
      <aside className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r flex flex-col justify-between shrink-0" style={{ background: '#FFFBF2', borderColor: 'rgba(245,158,11,0.15)' }}>
        <div className="p-6 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-amber-600" />
              <span className="font-heading font-extrabold text-sm uppercase tracking-wider text-slate-900">CMS Master</span>
            </div>
            <span className="bg-amber-500/10 text-amber-700 text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-amber-500/20">
              Admin
            </span>
          </div>

          <nav className="flex flex-col gap-1.5">
            {[
              { id: 'Dashboard', icon: LayoutDashboard },
              { id: 'Settings', icon: Settings },
              { id: 'Courses', icon: BookOpen },
              { id: 'Leads', icon: Users },
              { id: 'Faculty', icon: Briefcase },
              { id: 'Results', icon: Award },
              { id: 'Current Affairs', icon: FileText },
              { id: 'Blogs', icon: Bookmark },
              { id: 'Resources', icon: Database }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`flex items-center gap-3 px-4 py-3 text-xs font-bold transition-all text-left rounded-2xl border ${
                  activeTab === tab.id 
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
          <div>
            <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">CMS Console</span>
            <h2 className="text-2xl font-heading font-extrabold text-slate-900 mt-1">{activeTab} Editor</h2>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={fetchCMSData}
              className="p-2.5 bg-white border hover:bg-amber-50/60 transition-colors rounded-2xl shadow-sm text-slate-700"
              style={{ borderColor: 'rgba(245,158,11,0.15)' }}
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
                { label: 'Total Enquiries', value: leadsList.length.toString(), desc: 'Direct Lead records', icon: Users, color: 'text-blue-500' },
                { label: 'Total Faculty', value: facultyList.length.toString(), desc: 'Active mentoring profiles', icon: Users, color: 'text-amber-500' },
                { label: 'Results Ranks', value: resultsList.length.toString(), desc: 'Successful topper stories', icon: Award, color: 'text-emerald-500' },
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
          <div className="p-6 bg-white border border-slate-200 max-w-2xl rounded-3xl shadow-sm">
            <form onSubmit={handleSaveSettings} className="space-y-5">
              <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-3">
                Homepage Hero Configurations
              </h3>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Main Tagline</label>
                <input
                  type="text"
                  value={settings.tagline}
                  onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                  className="w-full px-4 py-3 text-xs bg-slate-50 border border-slate-250 rounded-2xl focus:border-slate-400 outline-none text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hero Main Title</label>
                <input
                  type="text"
                  value={settings.heroTitle}
                  onChange={(e) => setSettings({ ...settings, heroTitle: e.target.value })}
                  className="w-full px-4 py-3 text-xs bg-slate-50 border border-slate-250 rounded-2xl focus:border-slate-400 outline-none text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hero Subtitle</label>
                <textarea
                  value={settings.heroSubtitle}
                  rows={3}
                  onChange={(e) => setSettings({ ...settings, heroSubtitle: e.target.value })}
                  className="w-full px-4 py-3 text-xs bg-slate-50 border border-slate-250 rounded-2xl focus:border-slate-400 outline-none text-slate-900"
                />
              </div>

              <button 
                type="submit" 
                className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase rounded-2xl shadow-md transition-all"
              >
                Save configurations
              </button>
            </form>
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

        {/* TAB 4: FACULTY */}
        {activeTab === 'Faculty' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-sm text-slate-900">Faculty Profiles</h3>
              <button 
                onClick={() => {
                  setFacultyForm({ id: '', name: '', role: '', experience: '', avatar: '', bio: '', demoLectures: [] });
                  setActiveModal({ type: 'add' });
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Mentor</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {facultyList.map((fac, idx) => (
                <div key={fac.id} className="p-6 bg-white border border-slate-200 flex gap-4 justify-between items-start rounded-3xl shadow-sm">
                  <div className="flex gap-4">
                    <div className="w-14 h-16 bg-slate-100 shrink-0 border border-slate-200 overflow-hidden rounded-2xl">
                      <img src={fac.avatar || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400'} alt="fac" className="w-full h-full object-cover" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-slate-900 leading-tight">{fac.name}</h4>
                      <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">{fac.role}</p>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{fac.bio}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setFacultyForm(fac);
                        setActiveModal({ type: 'edit', index: idx });
                      }}
                      className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-650"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteFaculty(fac.id)}
                      className="p-2 border border-red-100 rounded-xl hover:bg-red-650 hover:text-white text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal add/edit Faculty */}
            {activeModal && activeTab === 'Faculty' && (
              <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <form onSubmit={handleSaveFaculty} className="bg-white/90 backdrop-blur-md border border-slate-200 p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl">
                  <h3 className="font-extrabold text-sm text-slate-900">
                    {activeModal.type === 'add' ? 'Add New Faculty Member' : 'Edit Faculty Member'}
                  </h3>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Name</label>
                    <input 
                      type="text" required value={facultyForm.name} 
                      onChange={(e) => setFacultyForm({ ...facultyForm, name: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:border-slate-400 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Role/Specialty</label>
                    <input 
                      type="text" required value={facultyForm.role} 
                      onChange={(e) => setFacultyForm({ ...facultyForm, role: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:border-slate-400 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Avatar URL</label>
                    <input 
                      type="text" value={facultyForm.avatar} 
                      onChange={(e) => setFacultyForm({ ...facultyForm, avatar: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:border-slate-400 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Short Biography</label>
                    <textarea 
                      rows={3} required value={facultyForm.bio} 
                      onChange={(e) => setFacultyForm({ ...facultyForm, bio: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:border-slate-400 outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-2xl">
                      Cancel
                    </button>
                    <button type="submit" className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl">
                      Save Profile
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: RESULTS */}
        {activeTab === 'Results' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-sm text-slate-900">Toppers Hall of Fame</h3>
              <button 
                onClick={() => {
                  setResultForm({ id: '', name: '', rank: '', exam: '', course: '', service: '', district: '', photo: '', year: 2026, story: '' });
                  setActiveModal({ type: 'add' });
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-850 text-white font-bold rounded-2xl text-xs shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Record</span>
              </button>
            </div>

            <div className="bg-white border border-slate-200 overflow-hidden rounded-3xl shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                    <th className="p-4">Name</th>
                    <th className="p-4">Rank</th>
                    <th className="p-4">Exam</th>
                    <th className="p-4">Service</th>
                    <th className="p-4">District</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {resultsList.map((item, idx) => (
                    <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="p-4 font-bold">{item.name}</td>
                      <td className="p-4 font-mono font-bold text-blue-600">{item.rank}</td>
                      <td className="p-4">{item.exam}</td>
                      <td className="p-4">{item.service}</td>
                      <td className="p-4">{item.district}</td>
                      <td className="p-4 flex gap-2">
                        <button 
                          onClick={() => {
                            setResultForm(item);
                            setActiveModal({ type: 'edit', index: idx });
                          }}
                          className="p-1.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-650"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteResult(item.id)}
                          className="p-1.5 border border-red-100 rounded-xl hover:bg-red-650 hover:text-white text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal results add/edit */}
            {activeModal && activeTab === 'Results' && (
              <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <form onSubmit={handleSaveResult} className="bg-white border border-slate-200 p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl">
                  <h3 className="font-extrabold text-sm text-slate-900">
                    {activeModal.type === 'add' ? 'Add Topper Rank Record' : 'Edit Topper Rank Record'}
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Name</label>
                      <input 
                        type="text" required value={resultForm.name} 
                        onChange={(e) => setResultForm({ ...resultForm, name: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:border-slate-400 outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Rank (e.g. AIR 23)</label>
                      <input 
                        type="text" required value={resultForm.rank} 
                        onChange={(e) => setResultForm({ ...resultForm, rank: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:border-slate-400 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Exam</label>
                      <input 
                        type="text" required value={resultForm.exam} 
                        onChange={(e) => setResultForm({ ...resultForm, exam: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:border-slate-400 outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Service Allocated</label>
                      <input 
                        type="text" required value={resultForm.service} 
                        onChange={(e) => setResultForm({ ...resultForm, service: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:border-slate-400 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">District</label>
                      <input 
                        type="text" required value={resultForm.district} 
                        onChange={(e) => setResultForm({ ...resultForm, district: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:border-slate-400 outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Photo URL</label>
                      <input 
                        type="text" value={resultForm.photo} 
                        onChange={(e) => setResultForm({ ...resultForm, photo: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:border-slate-400 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Topper Story</label>
                    <textarea 
                      rows={3} value={resultForm.story} 
                      onChange={(e) => setResultForm({ ...resultForm, story: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:border-slate-400 outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-2xl">
                      Cancel
                    </button>
                    <button type="submit" className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl">
                      Save Record
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: CURRENT AFFAIRS */}
        {activeTab === 'Current Affairs' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-sm text-slate-900">Current Affairs Articles</h3>
              <button 
                onClick={() => {
                  setCaForm({ id: '', title: '', category: 'National', publishDate: '', summary: '', content: '' });
                  setActiveModal({ type: 'add' });
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-850 text-white font-bold rounded-2xl text-xs shadow-sm"
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

            {/* Modal add/edit CA */}
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
                        <option>National</option>
                        <option>International</option>
                        <option>Economy</option>
                        <option>Environment</option>
                        <option>Science</option>
                        <option>Bihar Special</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Short Summary</label>
                    <textarea 
                      rows={2} required value={caForm.summary} 
                      onChange={(e) => setCaForm({ ...caForm, summary: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:border-slate-400 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Article Content</label>
                    <textarea 
                      rows={8} required value={caForm.content} 
                      onChange={(e) => setCaForm({ ...caForm, content: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-2xl text-slate-900 text-xs font-mono focus:border-slate-400 outline-none"
                    />
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
          </div>
        )}

        {/* TAB 7: BLOGS */}
        {activeTab === 'Blogs' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-sm text-slate-900">Blog Strategy Posts</h3>
              <button 
                onClick={() => {
                  setBlogForm({ id: '', title: '', publishDate: '', readTime: '5 min read', category: 'Strategy', content: '' });
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
                <form onSubmit={handleSaveBlog} className="bg-white border border-slate-200 p-6 rounded-3xl max-w-xl w-full space-y-4 shadow-2xl">
                  <h3 className="font-extrabold text-sm text-slate-900">
                    {activeModal.type === 'add' ? 'Create Blog Post' : 'Edit Blog Post'}
                  </h3>

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

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Read Time</label>
                    <input 
                      type="text" required value={blogForm.readTime} 
                      onChange={(e) => setBlogForm({ ...blogForm, readTime: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:border-slate-400 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Content</label>
                    <textarea 
                      rows={8} required value={blogForm.content} 
                      onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-2xl text-slate-900 text-xs font-mono focus:border-slate-400 outline-none"
                    />
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
                  setResourceForm({ id: '', title: '', size: '2.5 MB', type: 'PDF', downloadCount: 0, url: '#' });
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
                <form onSubmit={handleSaveResource} className="bg-white border border-slate-200 p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl">
                  <h3 className="font-extrabold text-sm text-slate-900">
                    {activeModal.type === 'add' ? 'Add Study Resource' : 'Edit Study Resource'}
                  </h3>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Resource Title</label>
                    <input 
                      type="text" required value={resourceForm.title} 
                      onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:border-slate-400 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">File Size</label>
                      <input 
                        type="text" required value={resourceForm.size} 
                        onChange={(e) => setResourceForm({ ...resourceForm, size: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:border-slate-400 outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Type</label>
                      <input 
                        type="text" required value={resourceForm.type} 
                        onChange={(e) => setResourceForm({ ...resourceForm, type: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:border-slate-400 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Download URL</label>
                    <input 
                      type="text" required value={resourceForm.url} 
                      onChange={(e) => setResourceForm({ ...resourceForm, url: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:border-slate-400 outline-none"
                    />
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
                    className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors duration-300 focus:outline-none ${
                      editMode ? 'bg-slate-900' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${
                        editMode ? 'translate-x-5' : 'translate-x-0'
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
                        className={`w-10 h-6 flex items-center rounded-full p-0.5 transition-all duration-300 focus:outline-none ${
                          course.isPublished ? 'bg-emerald-500' : 'bg-slate-350'
                        } ${!editMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div
                          className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${
                            course.isPublished ? 'translate-x-4' : 'translate-x-0'
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
      </main>
    </div>
  );
}
