'use client';

import { useState, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, BookOpen, FileText, Target, Upload, MessageSquare,
  TrendingUp, Settings, LogOut, Menu, X, ChevronRight, User,
  Bell, Gift, Sparkles, Smartphone, Award, HelpCircle, Layers,
  Compass, ExternalLink, Sun, Moon
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LocaleContext';

interface StudentPortalShellProps {
  children: ReactNode;
  activeNav?: 'dashboard' | 'courses' | 'prelims' | 'mains' | 'upload-mains' | 'resources' | 'mentor' | 'performance';
}

export default function StudentPortalShell({ children, activeNav }: StudentPortalShellProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const studentFirstName = user?.fullName ? user.fullName.split(' ')[0] : 'Mahendra';

  // PW-style Categorized Sidebar Navigation
  const navSections = [
    {
      title: 'LEARN ONLINE',
      items: [
        { key: 'dashboard', name: 'Study', icon: LayoutDashboard, href: '/student/dashboard', badge: null },
        { key: 'mentor', name: 'AI Doubt & Mentor', icon: MessageSquare, href: '/student/dashboard?tab=Mentor+Connect', badge: 'NEW' },
        { key: 'resources', name: 'Library & Notes', icon: BookOpen, href: '/downloads', badge: null },
      ]
    },
    {
      title: 'STUDY PACKS',
      items: [
        { key: 'courses', name: 'My Batches', icon: Layers, href: '/student/dashboard?tab=My+Courses', badge: null },
        { key: 'prelims', name: 'All Tests (Prelims)', icon: FileText, href: '/student/prelims', badge: null },
        { key: 'mains', name: 'Mains Evaluation', icon: Target, href: '/student/mains', badge: null },
        { key: 'upload-mains', name: 'Upload Mains Copy', icon: Upload, href: '/student/upload-mains', badge: null },
        { key: 'performance', name: 'Performance', icon: TrendingUp, href: '/student/dashboard?tab=Performance', badge: null },
      ]
    },
    {
      title: 'EXPLORE & PRACTICE',
      items: [
        { key: 'pyqs', name: 'Infinite Practice', icon: Compass, href: '/pyqs', badge: 'FREE' },
        { key: 'certificates', name: 'Certificates', icon: Award, href: '/student/dashboard?tab=Certificates', badge: null },
      ]
    }
  ];

  return (
    <div className="portal-page min-h-screen bg-slate-50 dark:bg-[#0B0C0E] flex flex-col font-body transition-colors duration-200">
      
      {/* ──────────────── 1. PW-STYLE TOP GLOBAL NAVBAR (Full Light/Dark Support) ──────────────── */}
      <header className="sticky top-0 z-50 bg-white dark:bg-[#121316] text-slate-900 dark:text-white border-b border-slate-200 dark:border-white/10 px-4 sm:px-6 h-14 flex items-center justify-between select-none shadow-xs transition-colors duration-200">
        {/* Left: Mobile Toggle & Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            aria-label="Open Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/student/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center font-black text-xs text-white shadow-md border border-white/20 shrink-0">
              FA
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                Final Attempt
              </span>
              <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest leading-none">
                IAS ACADEMY
              </span>
            </div>
          </Link>
        </div>

        {/* Right: Actions, Rewards, Notifications, Profile */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Google Play / Mobile App badge (PW style) */}
          <Link
            href="/downloads"
            className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200/80 dark:bg-white/10 dark:hover:bg-white/15 border border-slate-200 dark:border-white/15 rounded-full text-[11px] font-bold text-slate-700 dark:text-slate-200 transition-all"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Get Mobile App</span>
          </Link>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            title="Toggle Light/Dark Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Student Profile Pill */}
          <Link
            href="/student/profile"
            className="flex items-center gap-2 pl-1 sm:pl-2 py-1 pr-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-all border border-transparent hover:border-slate-200 dark:hover:border-white/10 cursor-pointer"
          >
            <span className="hidden sm:inline text-xs font-bold text-slate-800 dark:text-slate-200">
              Hi, {studentFirstName}
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-xs text-white overflow-hidden border border-slate-200 dark:border-white/20 shadow-xs">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName || 'User'} className="w-full h-full object-cover" />
              ) : (
                <span>{studentFirstName.charAt(0).toUpperCase()}</span>
              )}
            </div>
          </Link>
        </div>
      </header>

      {/* ──────────────── 2. MAIN BODY: SIDEBAR + CONTENT ──────────────── */}
      <div className="flex-1 flex min-h-[calc(100vh-3.5rem)]">
        {/* Mobile Backdrop */}
        {isSidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* ── Left Sidebar (PW Grouped Navigation) ── */}
        <aside
          className={`w-64 bg-white dark:bg-[#111215] border-r border-slate-200/90 dark:border-white/[0.08] flex-col z-50 transition-all duration-300 ${
            isSidebarOpen
              ? 'flex fixed inset-y-14 left-0 shadow-2xl h-[calc(100vh-3.5rem)]'
              : 'hidden lg:flex sticky top-14 h-[calc(100vh-3.5rem)]'
          }`}
        >
          {/* Scrollable Navigation Sections */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 styled-scrollbar">
            {navSections.map((sec, idx) => (
              <div key={idx} className="space-y-1">
                <p className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                  {sec.title}
                </p>
                <div className="space-y-0.5">
                  {sec.items.map(({ key, name, icon: Icon, href, badge }) => {
                    const isActive = activeNav ? activeNav === key : pathname === href;
                    return (
                      <Link
                        key={key}
                        href={href}
                        onClick={() => setIsSidebarOpen(false)}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-500/20 shadow-xs font-bold'
                            : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
                          <span className="truncate">{name}</span>
                        </div>

                        {badge && (
                          <span className="px-1.5 py-0.5 text-[8.5px] font-black uppercase tracking-wider rounded-md bg-rose-500 text-white shadow-xs">
                            {badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar Footer: Profile & Logout */}
          <div className="p-3 border-t border-slate-200/90 dark:border-white/[0.08] space-y-1 bg-slate-50/70 dark:bg-black/20">
            <Link
              href="/student/profile"
              onClick={() => setIsSidebarOpen(false)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-white/[0.06] transition-all"
            >
              <User className="w-4 h-4 text-slate-400" />
              <span>{t('student.profile', 'My Profile')}</span>
            </Link>
            <button
              onClick={() => {
                logout();
                router.push('/auth/login/student');
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>{t('nav.logout')}</span>
            </button>
          </div>
        </aside>

        {/* ── Main Dashboard Content Body ── */}
        <main className="flex-1 min-w-0 bg-slate-50/80 dark:bg-[#0B0C0E] transition-colors duration-200">
          {children}
        </main>
      </div>
    </div>
  );
}
