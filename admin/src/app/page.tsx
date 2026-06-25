'use client';

import { useState, useEffect } from 'react';
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

type AdminTab = 'Dashboard' | 'Settings' | 'Leads' | 'Faculty' | 'Results' | 'Current Affairs' | 'Blogs' | 'Resources' | 'Moodle Sync';

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

export default function AdminPortal() {
  const [activeTab, setActiveTab] = useState<AdminTab>('Dashboard');
  const [loading, setLoading] = useState(true);
  const [backendOffline, setBackendOffline] = useState(false);
  const [syncing, setSyncing] = useState(false);

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

  // Modals visibility states
  const [activeModal, setActiveModal] = useState<{ type: 'add' | 'edit'; index?: number } | null>(null);

  // Form states for CRUD operations
  const [facultyForm, setFacultyForm] = useState<FacultyMember>({ id: '', name: '', role: '', experience: '', avatar: '', bio: '', demoLectures: [] });
  const [resultForm, setResultForm] = useState<ResultTopper>({ id: '', name: '', rank: '', exam: '', course: '', service: '', district: '', photo: '', year: 2026, story: '' });
  const [caForm, setCaForm] = useState<CurrentAffairArticle>({ id: '', title: '', category: 'National', publishDate: '', summary: '', content: '' });
  const [blogForm, setBlogForm] = useState<BlogItem>({ id: '', title: '', publishDate: '', readTime: '', category: '', content: '' });
  const [resourceForm, setResourceForm] = useState<ResourceDownload>({ id: '', title: '', size: '', type: 'PDF', downloadCount: 0, url: '' });

  const BACKEND_URL = 'http://localhost:5000';

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

  // Update Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (backendOffline) return;
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

  // Update Lead Status
  const handleUpdateLeadStatus = async (id: string, status: string) => {
    setLeadsList(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    if (backendOffline) return;
    try {
      await fetch(`${BACKEND_URL}/api/leads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
    } catch (err) {
      console.error(err);
    }
  };

  // FACULTY CRUD
  const handleSaveFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeModal?.type === 'add') {
      const newFac = { ...facultyForm, id: `fac-${Date.now()}` };
      setFacultyList(prev => [...prev, newFac]);
      if (!backendOffline) {
        await fetch(`${BACKEND_URL}/api/faculty`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newFac)
        });
      }
    } else {
      const id = facultyForm.id;
      setFacultyList(prev => prev.map(f => f.id === id ? facultyForm : f));
      if (!backendOffline) {
        await fetch(`${BACKEND_URL}/api/faculty/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(facultyForm)
        });
      }
    }
    setActiveModal(null);
  };

  const handleDeleteFaculty = async (id: string) => {
    setFacultyList(prev => prev.filter(f => f.id !== id));
    if (!backendOffline) {
      await fetch(`${BACKEND_URL}/api/faculty/${id}`, { method: 'DELETE' });
    }
  };

  // RESULTS CRUD
  const handleSaveResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeModal?.type === 'add') {
      const newItem = { ...resultForm, id: `res-${Date.now()}` };
      setResultsList(prev => [newItem, ...prev]);
      if (!backendOffline) {
        await fetch(`${BACKEND_URL}/api/results`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newItem)
        });
      }
    } else {
      const id = resultForm.id;
      setResultsList(prev => prev.map(r => r.id === id ? resultForm : r));
      if (!backendOffline) {
        await fetch(`${BACKEND_URL}/api/results/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(resultForm)
        });
      }
    }
    setActiveModal(null);
  };

  const handleDeleteResult = async (id: string) => {
    setResultsList(prev => prev.filter(r => r.id !== id));
    if (!backendOffline) {
      await fetch(`${BACKEND_URL}/api/results/${id}`, { method: 'DELETE' });
    }
  };

  // CURRENT AFFAIRS CRUD
  const handleSaveCA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeModal?.type === 'add') {
      const newItem = { ...caForm, id: `ca-${Date.now()}`, publishDate: new Date().toLocaleDateString() };
      setCaList(prev => [newItem, ...prev]);
      if (!backendOffline) {
        await fetch(`${BACKEND_URL}/api/current-affairs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newItem)
        });
      }
    } else {
      const id = caForm.id;
      setCaList(prev => prev.map(c => c.id === id ? caForm : c));
      if (!backendOffline) {
        await fetch(`${BACKEND_URL}/api/current-affairs/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(caForm)
        });
      }
    }
    setActiveModal(null);
  };

  const handleDeleteCA = async (id: string) => {
    setCaList(prev => prev.filter(c => c.id !== id));
    if (!backendOffline) {
      await fetch(`${BACKEND_URL}/api/current-affairs/${id}`, { method: 'DELETE' });
    }
  };

  // BLOG CRUD
  const handleSaveBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeModal?.type === 'add') {
      const newItem = { ...blogForm, id: `blog-${Date.now()}`, publishDate: new Date().toLocaleDateString() };
      setBlogsList(prev => [newItem, ...prev]);
      if (!backendOffline) {
        await fetch(`${BACKEND_URL}/api/blogs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newItem)
        });
      }
    } else {
      const id = blogForm.id;
      setBlogsList(prev => prev.map(b => b.id === id ? blogForm : b));
      if (!backendOffline) {
        await fetch(`${BACKEND_URL}/api/blogs/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(blogForm)
        });
      }
    }
    setActiveModal(null);
  };

  const handleDeleteBlog = async (id: string) => {
    setBlogsList(prev => prev.filter(b => b.id !== id));
    if (!backendOffline) {
      await fetch(`${BACKEND_URL}/api/blogs/${id}`, { method: 'DELETE' });
    }
  };

  // RESOURCES CRUD
  const handleSaveResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeModal?.type === 'add') {
      const newItem = { ...resourceForm, id: `res-${Date.now()}`, downloadCount: 0 };
      setResourcesList(prev => [...prev, newItem]);
      if (!backendOffline) {
        await fetch(`${BACKEND_URL}/api/resources`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newItem)
        });
      }
    } else {
      const id = resourceForm.id;
      setResourcesList(prev => prev.map(r => r.id === id ? resourceForm : r));
      if (!backendOffline) {
        await fetch(`${BACKEND_URL}/api/resources/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(resourceForm)
        });
      }
    }
    setActiveModal(null);
  };

  const handleDeleteResource = async (id: string) => {
    setResourcesList(prev => prev.filter(r => r.id !== id));
    if (!backendOffline) {
      await fetch(`${BACKEND_URL}/api/resources/${id}`, { method: 'DELETE' });
    }
  };

  const sidebarLinks: { name: AdminTab; icon: any }[] = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Settings', icon: Settings },
    { name: 'Leads', icon: Users },
    { name: 'Faculty', icon: Users },
    { name: 'Results', icon: Award },
    { name: 'Current Affairs', icon: FileText },
    { name: 'Blogs', icon: Bookmark },
    { name: 'Resources', icon: BookOpen }
  ];

  return (
    <div className="min-h-screen bg-[#070A13] text-[#F8FAFC] flex flex-col md:flex-row antialiased font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-full md:w-64 bg-[#0F172A] border-b md:border-b-0 md:border-r border-slate-800 p-5 flex flex-col justify-between shrink-0">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-650 flex items-center justify-center font-extrabold text-sm border border-red-500 shadow-sm text-white">
              FA
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-extrabold text-sm tracking-tight text-white uppercase">
                Final Attempt
              </span>
              <span className="text-[9px] text-red-500 font-bold tracking-wider uppercase">
                CMS Director
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {sidebarLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => {
                  setActiveTab(link.name);
                  setActiveModal(null);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === link.name 
                    ? 'bg-red-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <link.icon className="w-4 h-4 shrink-0" />
                <span>{link.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Port Link */}
        <div className="pt-6 border-t border-slate-850 mt-8">
          <a 
            href="http://localhost:3000" 
            target="_blank"
            rel="noreferrer"
            className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Launch Web Site</span>
          </a>
        </div>
      </aside>

      {/* MAIN MAIN PANEL */}
      <main className="flex-grow p-6 sm:p-10 space-y-8 overflow-y-auto max-h-screen">
        
        {/* TOP STATUS */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider">CMS Console</span>
            <h2 className="text-2xl font-heading font-extrabold text-white mt-1">{activeTab} Editor</h2>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={fetchCMSData}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            {backendOffline && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
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
                <div key={idx} className="bg-slate-900/60 p-5 rounded-2xl border border-slate-805 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-slate-550 font-bold uppercase tracking-wider">{metric.label}</span>
                    <metric.icon className={`w-4 h-4 ${metric.color}`} />
                  </div>
                  <p className="text-2xl font-extrabold text-white">{metric.value}</p>
                  <p className="text-[10px] text-slate-450 font-semibold">{metric.desc}</p>
                </div>
              ))}
            </div>

            {/* Quick overview updates log */}
            <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-805 space-y-4">
              <h3 className="font-heading font-bold text-sm text-white">Live Site Information</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Site parameters and database records are synchronized in real-time. Changing values inside these CMS directories pushes updates instantly to the public site layouts on port 3000.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: SETTINGS (Hero headings editor) */}
        {activeTab === 'Settings' && (
          <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-805 max-w-2xl">
            <form onSubmit={handleSaveSettings} className="space-y-5">
              <h3 className="font-heading font-extrabold text-sm text-white border-b border-slate-800 pb-3">
                Homepage Hero Configurations
              </h3>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Main Tagline</label>
                <input
                  type="text"
                  value={settings.tagline}
                  onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                  className="w-full px-4 py-3 text-xs bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-red-500 text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hero Main Title</label>
                <input
                  type="text"
                  value={settings.heroTitle}
                  onChange={(e) => setSettings({ ...settings, heroTitle: e.target.value })}
                  className="w-full px-4 py-3 text-xs bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-red-500 text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hero Subtitle</label>
                <textarea
                  value={settings.heroSubtitle}
                  rows={3}
                  onChange={(e) => setSettings({ ...settings, heroSubtitle: e.target.value })}
                  className="w-full px-4 py-3 text-xs bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-red-500 text-white"
                />
              </div>

              <button
                type="submit"
                disabled={backendOffline}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-750 text-white font-bold rounded-xl text-xs disabled:opacity-50 cursor-pointer"
              >
                Save Settings
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: LEADS */}
        {activeTab === 'Leads' && (
          <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-805 space-y-6">
            <h3 className="font-heading font-extrabold text-sm text-white border-b border-slate-800 pb-3">
              Strategy Booking Enquiries
            </h3>
            
            {leadsList.length > 0 ? (
              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-850 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-4">Name</th>
                      <th className="p-4">Mobile</th>
                      <th className="p-4">Target Course</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {leadsList.map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-900/40">
                        <td className="p-4 font-bold">{lead.fullName}</td>
                        <td className="p-4">{lead.mobile}</td>
                        <td className="p-4 text-blue-400">{lead.targetExam}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded font-bold text-[9px] uppercase ${
                            lead.status === 'Enrolled' 
                              ? 'bg-emerald-500/10 text-emerald-400' 
                              : lead.status === 'Contacted' 
                              ? 'bg-blue-500/10 text-blue-400' 
                              : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <select
                            value={lead.status}
                            onChange={(e) => handleUpdateLeadStatus(lead.id, e.target.value)}
                            className="bg-slate-850 text-white border border-slate-700 rounded px-2 py-1 text-[10px] focus:outline-none"
                          >
                            <option value="New">New</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Enrolled">Enrolled</option>
                            <option value="Junk">Junk</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-500 text-xs">No registration leads found.</p>
            )}
          </div>
        )}

        {/* TAB 4: FACULTY */}
        {activeTab === 'Faculty' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-heading font-extrabold text-sm text-white">Faculty Profiles</h3>
              <button 
                onClick={() => {
                  setFacultyForm({ id: '', name: '', role: '', experience: '', avatar: '', bio: '', demoLectures: [] });
                  setActiveModal({ type: 'add' });
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-650 hover:bg-red-750 text-white font-bold rounded-xl text-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Mentor</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {facultyList.map((fac, idx) => (
                <div key={fac.id} className="bg-slate-900/60 p-6 rounded-3xl border border-slate-805 flex gap-4 justify-between items-start">
                  <div className="flex gap-4">
                    <div className="w-14 h-16 rounded-xl overflow-hidden bg-slate-800 shrink-0">
                      <img src={fac.avatar || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400'} alt="fac" className="w-full h-full object-cover" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-heading font-bold text-sm text-white leading-tight">{fac.name}</h4>
                      <p className="text-[10px] text-blue-400 font-bold uppercase">{fac.role}</p>
                      <p className="text-xs text-slate-400 line-clamp-2">{fac.bio}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setFacultyForm(fac);
                        setActiveModal({ type: 'edit', index: idx });
                      }}
                      className="p-2 bg-slate-800 rounded-xl hover:bg-slate-700 text-slate-300 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteFaculty(fac.id)}
                      className="p-2 bg-red-500/10 rounded-xl hover:bg-red-600 hover:text-white text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal for Add/Edit Faculty */}
            {activeModal && activeTab === 'Faculty' && (
              <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
                <form onSubmit={handleSaveFaculty} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-md w-full space-y-4">
                  <h3 className="font-heading font-extrabold text-sm text-white">
                    {activeModal.type === 'add' ? 'Add New Faculty Member' : 'Edit Faculty Member'}
                  </h3>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Name</label>
                    <input 
                      type="text" 
                      required 
                      value={facultyForm.name} 
                      onChange={(e) => setFacultyForm({ ...facultyForm, name: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-800 text-white text-xs rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Role / Subject</label>
                    <input 
                      type="text" 
                      required 
                      value={facultyForm.role} 
                      onChange={(e) => setFacultyForm({ ...facultyForm, role: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-800 text-white text-xs rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Experience (e.g. 10+ Years)</label>
                      <input 
                        type="text" 
                        value={facultyForm.experience} 
                        onChange={(e) => setFacultyForm({ ...facultyForm, experience: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-950 border border-slate-800 text-white text-xs rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Avatar URL</label>
                      <input 
                        type="text" 
                        value={facultyForm.avatar} 
                        onChange={(e) => setFacultyForm({ ...facultyForm, avatar: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-950 border border-slate-800 text-white text-xs rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Biography</label>
                    <textarea 
                      rows={3} 
                      value={facultyForm.bio} 
                      onChange={(e) => setFacultyForm({ ...facultyForm, bio: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-800 text-white text-xs rounded-xl"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 bg-slate-800 text-xs font-semibold rounded-xl">
                      Cancel
                    </button>
                    <button type="submit" className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl">
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
              <h3 className="font-heading font-extrabold text-sm text-white">Topper Results</h3>
              <button 
                onClick={() => {
                  setResultForm({ id: '', name: '', rank: '', exam: 'BPSC 69th', course: 'Mentorship Program', service: 'Deputy Collector', district: 'Patna', photo: '', year: 2026, story: '' });
                  setActiveModal({ type: 'add' });
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-650 hover:bg-red-750 text-white font-bold rounded-xl text-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Topper</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-850 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-4">Photo</th>
                    <th className="p-4">Name</th>
                    <th className="p-4">Rank</th>
                    <th className="p-4">Exam</th>
                    <th className="p-4">Service</th>
                    <th className="p-4">District</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-805 text-slate-200">
                  {resultsList.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-900/20">
                      <td className="p-4">
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-800">
                          <img src={item.photo} alt="topper" className="w-full h-full object-cover" />
                        </div>
                      </td>
                      <td className="p-4 font-bold">{item.name}</td>
                      <td className="p-4 text-amber-500 font-extrabold">{item.rank}</td>
                      <td className="p-4">{item.exam}</td>
                      <td className="p-4 text-blue-400">{item.service}</td>
                      <td className="p-4">{item.district}</td>
                      <td className="p-4 flex gap-2">
                        <button 
                          onClick={() => {
                            setResultForm(item);
                            setActiveModal({ type: 'edit', index: idx });
                          }}
                          className="p-1.5 bg-slate-850 rounded hover:bg-slate-700 text-slate-300"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteResult(item.id)}
                          className="p-1.5 bg-red-500/10 rounded hover:bg-red-600 hover:text-white text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal add/edit result */}
            {activeModal && activeTab === 'Results' && (
              <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
                <form onSubmit={handleSaveResult} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-md w-full space-y-4 max-h-[90vh] overflow-y-auto">
                  <h3 className="font-heading font-extrabold text-sm text-white">
                    {activeModal.type === 'add' ? 'Add Topper Rank Record' : 'Edit Topper Rank Record'}
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Name</label>
                      <input 
                        type="text" required value={resultForm.name} 
                        onChange={(e) => setResultForm({ ...resultForm, name: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-950 border border-slate-800 text-white text-xs rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Rank (e.g. AIR 23)</label>
                      <input 
                        type="text" required value={resultForm.rank} 
                        onChange={(e) => setResultForm({ ...resultForm, rank: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-950 border border-slate-800 text-white text-xs rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Exam</label>
                      <input 
                        type="text" required value={resultForm.exam} 
                        onChange={(e) => setResultForm({ ...resultForm, exam: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-950 border border-slate-800 text-white text-xs rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Service Allocated</label>
                      <input 
                        type="text" required value={resultForm.service} 
                        onChange={(e) => setResultForm({ ...resultForm, service: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-950 border border-slate-800 text-white text-xs rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">District</label>
                      <input 
                        type="text" required value={resultForm.district} 
                        onChange={(e) => setResultForm({ ...resultForm, district: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-950 border border-slate-800 text-white text-xs rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Photo URL</label>
                      <input 
                        type="text" value={resultForm.photo} 
                        onChange={(e) => setResultForm({ ...resultForm, photo: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-950 border border-slate-800 text-white text-xs rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Topper Review/Story</label>
                    <textarea 
                      rows={3} value={resultForm.story} 
                      onChange={(e) => setResultForm({ ...resultForm, story: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-800 text-white text-xs rounded-xl"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 bg-slate-800 text-xs font-semibold rounded-xl">
                      Cancel
                    </button>
                    <button type="submit" className="px-5 py-2 bg-red-600 hover:bg-red-750 text-white text-xs font-bold rounded-xl">
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
              <h3 className="font-heading font-extrabold text-sm text-white">Current Affairs Articles</h3>
              <button 
                onClick={() => {
                  setCaForm({ id: '', title: '', category: 'National', publishDate: '', summary: '', content: '' });
                  setActiveModal({ type: 'add' });
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-650 hover:bg-red-750 text-white font-bold rounded-xl text-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Article</span>
              </button>
            </div>

            <div className="space-y-4">
              {caList.map((article, idx) => (
                <div key={article.id} className="p-5 bg-slate-900/60 rounded-3xl border border-slate-805 flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex gap-2 items-center text-[10px] font-bold text-slate-500">
                      <span className="text-blue-500">{article.category}</span>
                      <span>&bull;</span>
                      <span>{article.publishDate}</span>
                    </div>
                    <h4 className="font-heading font-extrabold text-sm text-white">{article.title}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2">{article.summary}</p>
                  </div>

                  <div className="flex gap-2 shrink-0 ml-4">
                    <button 
                      onClick={() => {
                        setCaForm(article);
                        setActiveModal({ type: 'edit', index: idx });
                      }}
                      className="p-2 bg-slate-850 rounded-xl hover:bg-slate-700 text-slate-300"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteCA(article.id)}
                      className="p-2 bg-red-500/10 rounded-xl hover:bg-red-600 text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal add/edit CA */}
            {activeModal && activeTab === 'Current Affairs' && (
              <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
                <form onSubmit={handleSaveCA} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-xl w-full space-y-4 max-h-[90vh] overflow-y-auto">
                  <h3 className="font-heading font-extrabold text-sm text-white">
                    {activeModal.type === 'add' ? 'Add Current Affairs Article' : 'Edit Current Affairs Article'}
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Article Title</label>
                      <input 
                        type="text" required value={caForm.title} 
                        onChange={(e) => setCaForm({ ...caForm, title: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-950 border border-slate-800 text-white text-xs rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Category</label>
                      <select 
                        value={caForm.category} 
                        onChange={(e) => setCaForm({ ...caForm, category: e.target.value as any })}
                        className="w-full px-4 py-2 bg-slate-950 border border-slate-800 text-white text-xs rounded-xl"
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
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Short Summary (Mains Snippet)</label>
                    <textarea 
                      rows={2} required value={caForm.summary} 
                      onChange={(e) => setCaForm({ ...caForm, summary: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-800 text-white text-xs rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Article Content</label>
                    <textarea 
                      rows={8} required value={caForm.content} 
                      onChange={(e) => setCaForm({ ...caForm, content: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-800 text-white text-xs rounded-xl font-mono"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 bg-slate-800 text-xs font-semibold rounded-xl">
                      Cancel
                    </button>
                    <button type="submit" className="px-5 py-2 bg-red-600 hover:bg-red-755 text-white text-xs font-bold rounded-xl">
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
              <h3 className="font-heading font-extrabold text-sm text-white">Blog Strategy Posts</h3>
              <button 
                onClick={() => {
                  setBlogForm({ id: '', title: '', publishDate: '', readTime: '5 min read', category: 'Strategy', content: '' });
                  setActiveModal({ type: 'add' });
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-650 hover:bg-red-750 text-white font-bold rounded-xl text-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Post</span>
              </button>
            </div>

            <div className="space-y-4">
              {blogsList.map((post, idx) => (
                <div key={post.id} className="p-5 bg-slate-900/60 rounded-3xl border border-slate-805 flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex gap-2 items-center text-[10px] font-bold text-slate-500">
                      <span className="text-blue-500">{post.category}</span>
                      <span>&bull;</span>
                      <span>{post.readTime}</span>
                    </div>
                    <h4 className="font-heading font-extrabold text-sm text-white">{post.title}</h4>
                  </div>

                  <div className="flex gap-2 shrink-0 ml-4">
                    <button 
                      onClick={() => {
                        setBlogForm(post);
                        setActiveModal({ type: 'edit', index: idx });
                      }}
                      className="p-2 bg-slate-850 rounded-xl hover:bg-slate-700 text-slate-300"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteBlog(post.id)}
                      className="p-2 bg-red-500/10 rounded-xl hover:bg-red-600 text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal add/edit Blog */}
            {activeModal && activeTab === 'Blogs' && (
              <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
                <form onSubmit={handleSaveBlog} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-xl w-full space-y-4 max-h-[90vh] overflow-y-auto">
                  <h3 className="font-heading font-extrabold text-sm text-white">
                    {activeModal.type === 'add' ? 'Create Blog Post' : 'Edit Blog Post'}
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Post Title</label>
                      <input 
                        type="text" required value={blogForm.title} 
                        onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-950 border border-slate-800 text-white text-xs rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Category</label>
                      <input 
                        type="text" required value={blogForm.category} 
                        onChange={(e) => setBlogForm({ ...blogForm, category: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-950 border border-slate-800 text-white text-xs rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Read Time (e.g. 5 min read)</label>
                    <input 
                      type="text" required value={blogForm.readTime} 
                      onChange={(e) => setBlogForm({ ...blogForm, readTime: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-800 text-white text-xs rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Content</label>
                    <textarea 
                      rows={8} required value={blogForm.content} 
                      onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-800 text-white text-xs rounded-xl font-mono"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 bg-slate-800 text-xs font-semibold rounded-xl">
                      Cancel
                    </button>
                    <button type="submit" className="px-5 py-2 bg-red-600 hover:bg-red-755 text-white text-xs font-bold rounded-xl">
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
              <h3 className="font-heading font-extrabold text-sm text-white">Free Resources Downloads</h3>
              <button 
                onClick={() => {
                  setResourceForm({ id: '', title: '', size: '2.5 MB', type: 'PDF', downloadCount: 0, url: '#' });
                  setActiveModal({ type: 'add' });
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-650 hover:bg-red-750 text-white font-bold rounded-xl text-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Resource</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {resourcesList.map((res, idx) => (
                <div key={res.id} className="bg-slate-900/60 p-5 rounded-3xl border border-slate-805 flex justify-between items-center">
                  <div className="space-y-1">
                    <h4 className="font-heading font-bold text-xs text-white leading-tight">{res.title}</h4>
                    <p className="text-[10px] text-slate-450 uppercase font-semibold">Format: {res.type} &bull; Size: {res.size}</p>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setResourceForm(res);
                        setActiveModal({ type: 'edit', index: idx });
                      }}
                      className="p-1.5 bg-slate-850 rounded hover:bg-slate-700 text-slate-300"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteResource(res.id)}
                      className="p-1.5 bg-red-500/10 rounded hover:bg-red-600 text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal add/edit Resource */}
            {activeModal && activeTab === 'Resources' && (
              <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
                <form onSubmit={handleSaveResource} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-md w-full space-y-4">
                  <h3 className="font-heading font-extrabold text-sm text-white">
                    {activeModal.type === 'add' ? 'Add Study Resource' : 'Edit Study Resource'}
                  </h3>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Resource Title</label>
                    <input 
                      type="text" required value={resourceForm.title} 
                      onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-800 text-white text-xs rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">File Size (e.g. 2.4 MB)</label>
                      <input 
                        type="text" required value={resourceForm.size} 
                        onChange={(e) => setResourceForm({ ...resourceForm, size: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-950 border border-slate-800 text-white text-xs rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Type</label>
                      <input 
                        type="text" required value={resourceForm.type} 
                        onChange={(e) => setResourceForm({ ...resourceForm, type: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-950 border border-slate-800 text-white text-xs rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Download URL Endpoint</label>
                    <input 
                      type="text" required value={resourceForm.url} 
                      onChange={(e) => setResourceForm({ ...resourceForm, url: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-800 text-white text-xs rounded-xl"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 bg-slate-800 text-xs font-semibold rounded-xl">
                      Cancel
                    </button>
                    <button type="submit" className="px-5 py-2 bg-red-600 hover:bg-red-755 text-white text-xs font-bold rounded-xl">
                      Save Resource
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
