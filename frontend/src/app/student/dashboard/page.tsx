'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen, TrendingUp, FileText, HelpCircle,
  Users, Bell, Award, CheckCircle, Play, LogOut,
  ChevronRight, Sparkles, Search, MessageSquare,
  LayoutDashboard, Settings, Target, Zap, Lock
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getMyEnrollments } from '@/services/auth';
import MentorshipChat from '@/components/lms/MentorshipChat';
import PerformanceAnalytics from '@/components/lms/PerformanceAnalytics';

type DashTab = 'Dashboard' | 'My Courses' | 'Performance' | 'Tests' | 'Notes' | 'Mentor Connect' | 'Certificates';

interface Enrollment {
  courseId: string;
  title: string;
  category: string;
  thumbnailUrl?: string;
  duration?: string;
  enrolledAt: string;
}

export default function LMSDashboard() {
  const { user, accessToken, logout, isLoading, requireAuth } = useAuth();
  const [activeTab, setActiveTab] = useState<DashTab>('Dashboard');
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(true);

  // Authentication guard
  useEffect(() => {
    requireAuth('/auth/login/student');
  }, [requireAuth, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Verifying Session...</p>
        </div>
      </div>
    );
  }

  // Fetch enrollments from real backend
  useEffect(() => {
    if (!accessToken) return;

    const load = async () => {
      setLoadingEnrollments(true);
      const res = await getMyEnrollments(accessToken);
      setLoadingEnrollments(false);
      if (res.success && res.data) {
        setEnrollments(res.data);
      }
    };
    load();
  }, [accessToken]);

  const sidebarLinks: { name: DashTab; icon: any }[] = [
    { name: 'Dashboard',      icon: LayoutDashboard },
    { name: 'My Courses',     icon: BookOpen },
    { name: 'Performance',    icon: TrendingUp },
    { name: 'Tests',          icon: FileText },
    { name: 'Notes',          icon: HelpCircle },
    { name: 'Mentor Connect', icon: MessageSquare },
    { name: 'Certificates',   icon: Award }
  ];

  // Demo progress stats (will be replaced with real data in Phase 2)
  const stats = [
    { label: 'Courses Enrolled', value: enrollments.length || 0, icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { label: 'Lessons Completed', value: 8, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { label: 'Hours Studied', value: '12h', icon: TrendingUp, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
    { label: 'Tests Taken', value: 2, icon: FileText, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex font-body">
      
      {/* ──────────────── Sidebar ──────────────── */}
      <aside className="hidden lg:flex w-64 flex-col bg-slate-900/80 border-r border-white/[0.06] h-screen sticky top-0">
        {/* Logo */}
        <div className="p-5 border-b border-white/[0.06]">
          <Link href="/" className="flex flex-col gap-1">
            <div className="w-40 h-10 relative shrink-0">
              <img
                src="/darklogofull.png"
                alt="Final Attempt"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-slate-500 text-[9px] font-bold uppercase tracking-wider pl-1">Student Portal</span>
          </Link>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {user?.fullName?.charAt(0)?.toUpperCase() || 'S'}
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user?.fullName || 'Student'}</p>
              <p className="text-slate-400 text-[10px] truncate">{user?.email || ''}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {sidebarLinks.map(({ name, icon: Icon }) => {
            const isActive = activeTab === name;
            return (
              <button
                key={name}
                onClick={() => setActiveTab(name)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{name}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-60" />}
              </button>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="p-3 border-t border-white/[0.06] space-y-0.5">
          <Link href="/student/profile" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition-all">
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ──────────────── Main Content ──────────────── */}
      <div className="flex-1 overflow-y-auto">
        
        {/* Top Bar */}
        <header className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur-xl border-b border-white/[0.06] px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-white font-bold text-lg">
              {activeTab === 'Dashboard' ? `Good ${new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, ${user?.fullName ? user.fullName.split(' ')[0] : 'Student'} 👋` : activeTab}
            </h1>
            {activeTab === 'Dashboard' && (
              <p className="text-slate-500 text-xs mt-0.5">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all">
              <Bell className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all">
              <Search className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="p-6 max-w-7xl">

          {/* ── Dashboard Tab ── */}
          {activeTab === 'Dashboard' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map(s => (
                  <div key={s.label} className={`p-4 rounded-2xl ${s.bg} border ${s.border} backdrop-blur-sm`}>
                    <div className={`w-8 h-8 rounded-xl ${s.bg} border ${s.border} flex items-center justify-center mb-3`}>
                      <s.icon className={`w-4 h-4 ${s.color}`} />
                    </div>
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Enrolled Courses */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-white font-bold text-base">My Enrolled Courses</h2>
                  <button onClick={() => setActiveTab('My Courses')} className="text-blue-400 text-xs hover:text-blue-300 font-medium transition-colors">View all →</button>
                </div>

                {loadingEnrollments ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2].map(i => (
                      <div key={i} className="h-28 rounded-2xl bg-white/[0.04] border border-white/[0.06] animate-pulse" />
                    ))}
                  </div>
                ) : enrollments.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-white/[0.04] border border-white/[0.06] text-center">
                    <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                    <h3 className="text-slate-300 font-semibold text-sm mb-1">No courses yet</h3>
                    <p className="text-slate-500 text-xs mb-4">Browse our BPSC programs and start your preparation journey.</p>
                    <Link href="/courses" className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-500 transition-all">
                      <BookOpen className="w-3.5 h-3.5" />
                      Explore Courses
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {enrollments.map(e => (
                      <Link
                        key={e.courseId}
                        href={`/student/course/${e.courseId}`}
                        className="group p-4 rounded-2xl bg-white/[0.04] border border-white/[0.06] hover:border-blue-500/30 hover:bg-blue-500/5 transition-all"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shrink-0">
                            <BookOpen className="w-5 h-5 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-white text-sm font-semibold truncate group-hover:text-blue-300 transition-colors">{e.title}</h3>
                            <p className="text-slate-500 text-xs mt-0.5">{e.category} · {e.duration || 'Ongoing'}</p>
                            {/* Progress bar (mock) */}
                            <div className="mt-2.5">
                              <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                                <span>Progress</span>
                                <span>25%</span>
                              </div>
                              <div className="h-1.5 bg-slate-800 rounded-full">
                                <div className="h-1.5 w-1/4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" />
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors shrink-0 mt-1" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div>
                <h2 className="text-white font-bold text-base mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Browse Courses', href: '/courses', icon: BookOpen, color: 'from-blue-600 to-blue-700' },
                    { label: 'Book Mentor Session', href: '/contact', icon: Users, color: 'from-indigo-600 to-indigo-700' },
                    { label: 'Current Affairs', href: '/current-affairs', icon: Zap, color: 'from-violet-600 to-violet-700' },
                    { label: 'Previous Year Qs', href: '/pyq', icon: Target, color: 'from-cyan-600 to-cyan-700' }
                  ].map(a => (
                    <Link
                      key={a.label}
                      href={a.href}
                      className="group flex flex-col items-center gap-2.5 p-4 rounded-2xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.07] hover:border-white/[0.12] transition-all text-center"
                    >
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${a.color} flex items-center justify-center shadow-lg`}>
                        <a.icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-slate-300 text-[11px] font-medium leading-tight group-hover:text-white transition-colors">{a.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── My Courses Tab ── */}
          {activeTab === 'My Courses' && (
            <div className="space-y-4">
              {loadingEnrollments ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 rounded-2xl bg-white/[0.04] border border-white/[0.06] animate-pulse" />
                  ))}
                </div>
              ) : enrollments.length === 0 ? (
                <div className="p-12 rounded-2xl bg-white/[0.04] border border-white/[0.06] text-center">
                  <Lock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-slate-200 font-bold text-base mb-2">No Enrolled Courses</h3>
                  <p className="text-slate-500 text-sm mb-6">Enroll in a BPSC program to unlock access to lessons, quizzes, and mentorship.</p>
                  <Link href="/courses" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold rounded-xl hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg shadow-blue-900/30">
                    <BookOpen className="w-4 h-4" />
                    Browse BPSC Programs
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {enrollments.map(e => (
                    <Link key={e.courseId} href={`/student/course/${e.courseId}`} className="group p-5 rounded-2xl bg-white/[0.04] border border-white/[0.06] hover:border-blue-500/30 hover:bg-blue-500/5 transition-all">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg">
                          <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-semibold text-sm mb-1 group-hover:text-blue-300 transition-colors">{e.title}</h3>
                          <p className="text-slate-500 text-xs mb-3">{e.category} · Enrolled {new Date(e.enrolledAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</p>
                          <div>
                            <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                              <span>Progress</span><span>25%</span>
                            </div>
                            <div className="h-1.5 bg-slate-800 rounded-full">
                              <div className="h-1.5 w-1/4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-2">
                        <div className="flex-1 px-3 py-2 rounded-xl bg-blue-600/10 border border-blue-500/20 text-center">
                          <p className="text-blue-400 text-[11px] font-bold">Continue →</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Placeholder Tabs ── */}
          {['Notes', 'Certificates'].includes(activeTab) && (
            <div className="flex flex-col items-center justify-center min-h-64 text-center gap-4 p-8 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/20 flex items-center justify-center">
                {activeTab === 'Notes'       && <HelpCircle  className="w-7 h-7 text-violet-400" />}
                {activeTab === 'Certificates' && <Award      className="w-7 h-7 text-yellow-400" />}
              </div>
              <h3 className="text-white font-bold text-base">{activeTab}</h3>
              <p className="text-slate-400 text-sm max-w-xs">
                {activeTab === 'Notes'         && 'Personal study notes and PDF viewer coming in Phase 1 extension.'}
                {activeTab === 'Certificates'  && 'PDF certificates with QR verification are coming in Phase 5.'}
              </p>
              <div className="px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
                Coming Soon
              </div>
            </div>
          )}

          {/* ── Performance Tab ── */}
          {activeTab === 'Performance' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-white font-bold text-base">Performance Analytics</h2>
                  <p className="text-slate-500 text-xs mt-0.5">Mock averages, curriculum completion analytics, and BPSC exam metrics.</p>
                </div>
              </div>
              <PerformanceAnalytics accessToken={accessToken || ''} />
            </div>
          )}

          {/* ── Mentor Connect Tab ── */}
          {activeTab === 'Mentor Connect' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-white font-bold text-base">Mentorship Portal</h2>
                  <p className="text-slate-500 text-xs mt-0.5">Instant chat doubts resolution portal connected with Selected Officers.</p>
                </div>
              </div>
              <MentorshipChat courseId="bpsc-foundation" />
            </div>
          )}

          {/* ── Tests Tab ── */}
          {activeTab === 'Tests' && (
            <div className="p-8 rounded-2xl bg-white/[0.04] border border-white/[0.06] text-center max-w-md mx-auto space-y-4">
              <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center mx-auto text-amber-400">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-white font-bold text-base">Mini Mock Test Series</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Take Bihar History & General Mental Ability mini mock test series to evaluate your speed and BPSC negative marking resilience.
              </p>
              <Link
                href="/student/course/bpsc-foundation/quiz/q-bpsc-foundation-1"
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-md"
              >
                Start Test Series Attempt
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
