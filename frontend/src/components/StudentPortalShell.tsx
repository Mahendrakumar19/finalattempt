'use client';

import { useState, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, BookOpen, FileText, Target, Upload, MessageSquare,
  TrendingUp, Settings, LogOut, Menu, X, ChevronRight, User
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/context/LocaleContext';

interface StudentPortalShellProps {
  children: ReactNode;
  activeNav?: 'dashboard' | 'courses' | 'prelims' | 'mains' | 'upload-mains' | 'resources' | 'mentor' | 'performance';
}

export default function StudentPortalShell({ children, activeNav }: StudentPortalShellProps) {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const sidebarLinks = [
    { key: 'dashboard',    name: t('student.dashboard'),         icon: LayoutDashboard, href: '/student/dashboard' },
    { key: 'courses',      name: t('student.myCourses'),         icon: BookOpen,        href: '/student/dashboard?tab=My+Courses' },
    { key: 'prelims',      name: t('student.prelims'),           icon: FileText,        href: '/student/prelims' },
    { key: 'mains',        name: t('student.mains'),             icon: Target,          href: '/student/mains' },
    { key: 'upload-mains', name: t('student.uploadMainsCopy'),   icon: Upload,          href: '/student/upload-mains' },
    { key: 'resources',    name: t('student.resources'),         icon: BookOpen,        href: '/downloads' },
    { key: 'mentor',       name: t('student.mentorConnect'),     icon: MessageSquare,   href: '/student/dashboard?tab=Mentor+Connect' },
    { key: 'performance',  name: t('student.performance'),       icon: TrendingUp,      href: '/student/dashboard?tab=Performance' },
  ];

  return (
    <div className="portal-page min-h-screen bg-slate-50 dark:bg-slate-950 flex font-body transition-colors duration-200">
      {/* ──────────────── Sidebar ──────────────── */}
      <aside className={`w-64 flex-col bg-white dark:bg-slate-900/80 border-r border-slate-200 dark:border-white/[0.06] h-screen sticky top-0 z-40 transition-all duration-300 ${isSidebarOpen ? 'flex fixed inset-y-0 left-0 shadow-2xl' : 'hidden lg:flex'}`}>
        {/* Logo */}
        <div className="p-5 border-b border-slate-200 dark:border-white/[0.06] flex items-center justify-between">
          <Link href="/" className="flex flex-col gap-1">
            <div className="w-40 h-10 relative shrink-0">
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
            <span className="text-slate-500 text-[9px] font-bold uppercase tracking-wider pl-1">{t('student.portal')}</span>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Badge */}
        <div className="p-4 border-b border-slate-200 dark:border-white/[0.06]">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06]">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {user?.fullName?.charAt(0)?.toUpperCase() || 'S'}
            </div>
            <div className="min-w-0">
              <p className="text-slate-900 dark:text-white text-xs font-semibold truncate">{user?.fullName || 'Student'}</p>
              <p className="text-slate-500 dark:text-slate-400 text-[10px] truncate">{user?.email || ''}</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto styled-scrollbar">
          {sidebarLinks.map(({ key, name, icon: Icon, href }) => {
            const isActive = activeNav ? activeNav === key : pathname === href;
            return (
              <Link
                key={key}
                href={href}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{name}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-60" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer options */}
        <div className="p-3 border-t border-slate-200 dark:border-white/[0.06] space-y-0.5">
          <Link href="/student/profile" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-all">
            <Settings className="w-4 h-4" />
            <span>{t('student.profile')}</span>
          </Link>
          <button
            onClick={() => {
              logout();
              router.push('/auth/login/student');
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('nav.logout')}</span>
          </button>
        </div>
      </aside>

      {/* ──────────────── Main Content Shell ──────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header Bar */}
        <header className="lg:hidden p-4 bg-white dark:bg-slate-900/80 border-b border-slate-200 dark:border-white/[0.06] flex items-center justify-between sticky top-0 z-30">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/" className="w-32 h-8 relative">
            <img src="/darklogofull.png" alt="Final Attempt" className="w-full h-full object-contain logo-light" />
            <img src="/lightlogofull.png" alt="Final Attempt" className="w-full h-full object-contain logo-dark" />
          </Link>

          <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
            {user?.fullName?.charAt(0)?.toUpperCase() || 'S'}
          </div>
        </header>

        {/* Inner Page View */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
