'use client';

import { useState, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, BookOpen, FileText, Target, Upload, MessageSquare,
  TrendingUp, Settings, LogOut, Menu, X, ChevronRight, User,
  GraduationCap, Compass, FolderDown, HelpCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/context/LocaleContext';

interface StudentPortalShellProps {
  children: ReactNode;
  activeNav?: string;
}

export default function StudentPortalShell({ children, activeNav }: StudentPortalShellProps) {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Grouped Navigation Sections (Divided ONLY by a subtle line, no section header text)
  const navSections = [
    // Section 1: Study & Core Hub
    [
      { key: 'study',        name: 'Study',              icon: GraduationCap,   href: '/courses' },
      { key: 'dashboard',    name: 'Dashboard',          icon: LayoutDashboard, href: '/student/dashboard' },
      { key: 'courses',      name: 'My courses',         icon: BookOpen,        href: '/student/dashboard?tab=My+Courses' },
    ],
    // Section 2: Examination, Practice & Evaluation
    [
      { key: 'prelims',      name: 'Prelims',            icon: FileText,        href: '/student/prelims' },
      { key: 'mains',        name: 'Mains',              icon: Target,          href: '/student/mains' },
      { key: 'practice',     name: 'Practice',           icon: Compass,         href: '/pyq' },
      { key: 'upload-mains', name: 'Upload mains copy',  icon: Upload,          href: '/student/upload-mains' },
    ],
    // Section 3: Learning Materials
    [
      { key: 'resources',    name: 'Resources',          icon: FolderDown,      href: '/downloads' },
    ],
    // Section 4: Assistance, Mentorship & Analytics
    [
      { key: 'support',      name: 'Support',            icon: HelpCircle,      href: '/contact' },
      { key: 'mentor',       name: 'Mentor connect',     icon: MessageSquare,   href: '/student/dashboard?tab=Mentor+Connect' },
      { key: 'performance',  name: 'Performance',        icon: TrendingUp,      href: '/student/dashboard?tab=Performance' },
    ]
  ];

  return (
    <div className="portal-page min-h-screen bg-white dark:bg-[#080C14] flex font-body transition-colors duration-200">
      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/70 backdrop-blur-xs z-40 transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ──────────────── Sidebar ──────────────── */}
      <aside className={`w-72 sm:w-64 flex-col bg-white dark:bg-[#0D111A] border-r border-gray-200 dark:border-white/10 h-screen sticky top-0 z-50 transition-all duration-300 ${isSidebarOpen ? 'flex fixed inset-y-0 left-0 shadow-2xl' : 'hidden lg:flex'}`}>
        {/* Logo */}
        <div className="p-5 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
          <Link href="/" onClick={() => setIsSidebarOpen(false)} className="flex flex-col gap-1">
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
            <span className="text-gray-700 dark:text-gray-300 text-[10px] font-bold uppercase tracking-wider pl-1">{t('student.portal')}</span>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-1 rounded-lg text-gray-700 dark:text-gray-200 hover:text-black dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Badge */}
        <div className="p-4 border-b border-gray-200 dark:border-white/10">
          <Link
            href="/student/profile"
            onClick={() => setIsSidebarOpen(false)}
            className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] border border-gray-200 dark:border-white/10 transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden border border-gray-200 dark:border-white/15 shadow-xs relative">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName || 'User'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{user?.fullName?.charAt(0)?.toUpperCase() || 'S'}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-gray-950 dark:text-white text-xs font-bold truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {user?.fullName || 'Student'}
              </p>
              <p className="text-gray-600 dark:text-gray-300 text-[11px] font-medium truncate">{user?.email || ''}</p>
            </div>
          </Link>
        </div>

        {/* Navigation Items (Sections divided ONLY by a clean line, no text) */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto styled-scrollbar">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {sIdx > 0 && (
                <div className="my-2 border-t border-gray-200 dark:border-white/10" />
              )}
              {section.map(({ key, name, icon: Icon, href }) => {
                const isActive = activeNav ? activeNav === key : pathname === href;
                return (
                  <Link
                    key={key}
                    href={href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 font-extrabold'
                        : 'text-gray-700 dark:text-gray-200 hover:text-gray-950 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.07]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`} />
                    <span>{name}</span>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto text-white/80" />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer options */}
        <div className="p-3 border-t border-gray-200 dark:border-white/10 space-y-1">
          <Link href="/student/profile" className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.07] transition-all">
            <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span>{t('student.profile', 'My Profile')}</span>
          </Link>
          <button
            onClick={() => {
              logout();
              router.push('/auth/login/student');
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('nav.logout')}</span>
          </button>
        </div>
      </aside>

      {/* ──────────────── Main Content Shell ──────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header Bar */}
        <header className="lg:hidden p-4 bg-white dark:bg-[#121316] border-b border-gray-200 dark:border-white/10 flex items-center justify-between sticky top-0 z-30">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-xl border border-gray-200 dark:border-white/15 text-gray-800 dark:text-gray-200"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/" className="w-32 h-8 relative">
            <img src="/darklogofull.png" alt="Final Attempt" className="w-full h-full object-contain logo-light" />
            <img src="/lightlogofull.png" alt="Final Attempt" className="w-full h-full object-contain logo-dark" />
          </Link>

          <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center overflow-hidden border border-gray-200 dark:border-white/15 shadow-xs">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.fullName || 'User'}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{user?.fullName?.charAt(0)?.toUpperCase() || 'S'}</span>
            )}
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
