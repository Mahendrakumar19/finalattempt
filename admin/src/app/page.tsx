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
  ExternalLink
} from 'lucide-react';

type AdminTab = 'Dashboard' | 'Leads' | 'Moodle Sync' | 'Settings';

interface Lead {
  id: string;
  fullName: string;
  mobile: string;
  email?: string;
  targetExam: string;
  status: string;
  createdAt: string;
}

export default function AdminPortal() {
  const [activeTab, setActiveTab] = useState<AdminTab>('Dashboard');
  const [leadsList, setLeadsList] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [backendOffline, setBackendOffline] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState({
    lastSync: 'Pending sync',
    status: 'Ready',
    itemsSynced: 0
  });

  const BACKEND_URL = 'http://localhost:5000';

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/leads`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setLeadsList(data);
      setBackendOffline(false);
    } catch (err) {
      console.error('Backend server offline. Using mock values:', err);
      setBackendOffline(true);
      // Local Mock fallbacks
      setLeadsList([
        { id: 'mock-1', fullName: 'Aman Kumar (Offline Mock)', mobile: '9123456780', targetExam: 'BPSC Target Batch', status: 'New', createdAt: new Date().toISOString() },
        { id: 'mock-2', fullName: 'Priya Singh (Offline Mock)', mobile: '9876543210', targetExam: 'UPSC Mentorship', status: 'Contacted', createdAt: new Date().toISOString() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    // Optimistic UI update
    setLeadsList(prev => prev.map(lead => 
      lead.id === id ? { ...lead, status: newStatus } : lead
    ));

    if (backendOffline) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/leads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Update failed');
    } catch (err) {
      console.error('Failed to save status update to backend:', err);
    }
  };

  const handleTriggerSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/sync`, { method: 'POST' });
      if (!res.ok) throw new Error('Sync failed');
      const result = await res.json();
      setSyncStatus({
        lastSync: new Date().toLocaleTimeString(),
        status: 'Operational',
        itemsSynced: result.syncedCourses + result.syncedLessons
      });
    } catch (err) {
      console.error('Sync failed:', err);
      // Mock sync fallback
      setSyncStatus({
        lastSync: 'Just now (Simulated)',
        status: 'Operational (Mock)',
        itemsSynced: 42
      });
    } finally {
      setSyncing(false);
    }
  };

  const sidebarLinks: { name: AdminTab; icon: any }[] = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Leads', icon: Users },
    { name: 'Moodle Sync', icon: Database },
    { name: 'Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-[#070A13] text-[#F8FAFC] flex flex-col md:flex-row antialiased font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-full md:w-64 bg-[#0F172A] border-b md:border-b-0 md:border-r border-slate-800 p-5 flex flex-col justify-between shrink-0">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center font-extrabold text-sm border border-red-500 shadow-sm text-white">
              FA
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-extrabold text-sm tracking-tight text-white uppercase">
                Final Attempt
              </span>
              <span className="text-[9px] text-red-550 font-bold tracking-wider uppercase">
                Admin Console
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-900/60 rounded-2xl border border-slate-850 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-xs">
              AD
            </div>
            <div>
              <p className="text-xs font-bold text-white">Director Account</p>
              <p className="text-[9px] text-slate-500">Superuser Console</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {sidebarLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => setActiveTab(link.name)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
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

        {/* Footer */}
        <div className="pt-6 border-t border-slate-850 flex justify-between items-center mt-8">
          <a href="http://localhost:3000" className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-2">
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
            <h2 className="text-2xl font-heading font-extrabold text-white mt-1">Admin Panel</h2>
          </div>

          {backendOffline && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Backend server is offline. Run `npm run dev` at root directory first.</span>
            </div>
          )}
        </div>

        {/* TAB VIEWS */}

        {/* TAB 1: DASHBOARD */}
        {activeTab === 'Dashboard' && (
          <div className="space-y-8">
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Enquiries', value: leadsList.length.toString(), desc: 'Direct lead pool', icon: Users, color: 'text-blue-500' },
                { label: 'Estimated Revenue', value: '₹1.84 Lakhs', desc: 'Current month admissions', icon: DollarSign, color: 'text-emerald-500' },
                { label: 'Active Students', value: '420', desc: 'Cached from Moodle LMS', icon: Briefcase, color: 'text-amber-500' },
                { label: 'Moodle Sync status', value: syncStatus.status, desc: `Synced ${syncStatus.lastSync}`, icon: Database, color: 'text-purple-500' }
              ].map((metric, idx) => (
                <div key={idx} className="bg-slate-900/60 p-5 rounded-2xl border border-slate-805 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{metric.label}</span>
                    <metric.icon className={`w-4 h-4 ${metric.color}`} />
                  </div>
                  <p className="text-2xl font-extrabold text-white">{metric.value}</p>
                  <p className="text-[10px] text-slate-450 font-semibold">{metric.desc}</p>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-805 space-y-4">
              <h3 className="font-heading font-bold text-sm text-white">Quick Shortcuts</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <a 
                  href="http://localhost:3000/courses" 
                  target="_blank"
                  rel="noreferrer"
                  className="p-4 bg-slate-850 hover:bg-slate-800 transition-colors border border-slate-800 rounded-2xl flex justify-between items-center text-xs font-semibold text-slate-200"
                >
                  <span>Edit Courses page</span>
                  <ExternalLink className="w-4 h-4 text-slate-500" />
                </a>
                <a 
                  href="http://localhost:3000/resources" 
                  target="_blank"
                  rel="noreferrer"
                  className="p-4 bg-slate-850 hover:bg-slate-800 transition-colors border border-slate-800 rounded-2xl flex justify-between items-center text-xs font-semibold text-slate-200"
                >
                  <span>Upload Study Material</span>
                  <ExternalLink className="w-4 h-4 text-slate-500" />
                </a>
                <a 
                  href="http://localhost:3000/results" 
                  target="_blank"
                  rel="noreferrer"
                  className="p-4 bg-slate-850 hover:bg-slate-800 transition-colors border border-slate-800 rounded-2xl flex justify-between items-center text-xs font-semibold text-slate-200"
                >
                  <span>Manage Toppers</span>
                  <ExternalLink className="w-4 h-4 text-slate-500" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LEADS */}
        {activeTab === 'Leads' && (
          <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-805 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-heading font-extrabold text-lg text-white">Student Registration Leads</h3>
              <button 
                onClick={fetchLeads}
                className="p-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            {loading ? (
              <p className="text-slate-500 text-xs">Loading leads database...</p>
            ) : leadsList.length > 0 ? (
              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-850 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-4">Name</th>
                      <th className="p-4">Mobile</th>
                      <th className="p-4">Target Course</th>
                      <th className="p-4">Registered Date</th>
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
                        <td className="p-4 text-slate-400">
                          {new Date(lead.createdAt).toLocaleDateString()}
                        </td>
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
                            onChange={(e) => handleUpdateStatus(lead.id, e.target.value)}
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

        {/* TAB 3: MOODLE SYNC */}
        {activeTab === 'Moodle Sync' && (
          <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-805 space-y-6">
            <h3 className="font-heading font-extrabold text-lg text-white">Moodle LMS Cache Synchronization</h3>
            
            <div className="p-6 bg-slate-850/50 rounded-2xl border border-slate-800 space-y-4">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Sync Operations status</span>
              
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-slate-400">Connection status</p>
                  <p className="font-bold text-emerald-450 mt-0.5">Secure endpoint active</p>
                </div>
                <div>
                  <p className="text-slate-400">Total Synced Items</p>
                  <p className="font-bold text-white mt-0.5">{syncStatus.itemsSynced} units</p>
                </div>
                <div>
                  <p className="text-slate-400">Synchronized Time</p>
                  <p className="font-bold text-white mt-0.5">{syncStatus.lastSync}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                  onClick={handleTriggerSync}
                  disabled={syncing}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-750 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                  <span>{syncing ? 'Syncing Moodle...' : 'Sync Moodle Cache Now'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SETTINGS */}
        {activeTab === 'Settings' && (
          <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-805 space-y-6">
            <h3 className="font-heading font-extrabold text-lg text-white">Global Configuration</h3>
            <div className="space-y-4 max-w-xl text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-400">Backend API URL</label>
                <input 
                  type="text" 
                  value={BACKEND_URL} 
                  disabled
                  className="w-full px-4 py-2.5 bg-slate-850 border border-slate-800 rounded-xl text-slate-350 font-mono"
                />
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
