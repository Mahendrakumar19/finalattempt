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

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto styled-scrollbar">
          {sidebarLinks.map(({ key, name, icon: Icon, href }) => {
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

        {/* ── Floating Need Help WhatsApp Button (Gemini UI Specification) ── */}
        <a
          href="https://wa.me/917903822183?text=Hello%20Final%20Attempt%20Support,%20I%20need%20help%20with%20my%20dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white font-extrabold text-xs shadow-xl shadow-emerald-600/30 hover:scale-105 active:scale-95 transition-all cursor-pointer group"
          title="Need Help? Chat with Mentor"
        >
          <svg className="w-4 h-4 fill-current group-hover:rotate-12 transition-transform" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
          </svg>
          <span>Need Help?</span>
        </a>
      </div>
    </div>
  );
}
