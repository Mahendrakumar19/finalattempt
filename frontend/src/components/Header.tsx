'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown, Phone, User, MapPin, Sparkles, LogOut, ArrowRight, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/context/ThemeContext';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function getCurrentISOWeek() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Hide header/footer on portals for clean dashboard layout
  const isPortal = pathname.startsWith('/student') || pathname.startsWith('/faculty') || pathname.startsWith('/admin') || pathname.startsWith('/lms') || pathname.startsWith('/auth');

  if (isPortal) return null;

  const toggleDropdown = (name: string) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  const navLinks: { name: string; href: string; dropdown?: { name: string; href: string; desc?: string }[] }[] = [
    { name: 'Home', href: '/' },
    {
      name: 'Courses', href: '/courses',
      dropdown: [
        { name: 'Foundation', href: '/courses?category=Foundation', desc: 'Foundational learning programs' },
        { name: 'Prelims', href: '/courses?category=Prelims', desc: 'Target prelims batches & crash courses' },
        { name: 'Mains', href: '/courses?category=Mains', desc: 'Mains batches & answer writing' },
      ]
    },
    {
      name: 'Test Series', href: '/test-series',
      dropdown: [
        { name: 'Prelims Series', href: '/test-series?stage=PRELIMS', desc: 'Prelims mocks & sectional tests' },
        { name: 'Mains Series', href: '/test-series?stage=MAINS', desc: 'Mains answer writing tests' },
      ]
    },
    {
      name: 'Current Affairs', href: '/current-affairs',
      dropdown: [
        { name: 'Daily', href: '/current-affairs/daily', desc: 'Daily news analysis & facts' },
        { name: 'Weekly', href: `/current-affairs/weekly/week-${getCurrentISOWeek()}-${new Date().getFullYear()}`, desc: 'Consolidated weekly updates' },
        { name: 'Monthly', href: `/current-affairs/monthly/${MONTH_NAMES[new Date().getMonth()]}-${new Date().getFullYear()}`, desc: 'Monthly prep booklets' },
        { name: 'Yearly', href: `/current-affairs/yearly/${new Date().getFullYear()}`, desc: 'Yearly compendiums' },
      ]
    },
    {
      name: 'PYQs', href: '/pyq',
      dropdown: [
        { name: 'Question Papers', href: '/pyq', desc: 'Year-wise PYQ archive' },
        { name: 'Syllabus & Strategy', href: '/syllabus-strategy', desc: 'Exam prep strategy' },
      ]
    },
    { name: 'Syllabus & Strategy', href: '/syllabus-strategy' },
    {
      name: 'Blogs', href: '/blog',
      dropdown: [
        { name: 'All Articles', href: '/blog', desc: 'Strategy & analysis posts' }
      ]
    },
    {
      name: 'About', href: '/about',
      dropdown: [
        { name: 'About Us', href: '/about', desc: 'Our mission & faculty' },
        { name: 'Results', href: '/results', desc: 'Topper hall of fame' },
        { name: 'Faculty', href: '/faculties', desc: 'Meet our mentors' },
      ]
    },
    { name: 'Contact', href: '/contact' }
  ];

  return (
    <header className="w-full z-50 sticky top-0 border-b border-slate-100 shadow-sm transition-colors duration-200" style={{ backgroundColor: 'var(--header-bg)', borderColor: 'var(--card-border)' }}>
      {/* Upper Ticker Bar matching wireframe scheme */}
      <div className="w-full bg-[#0F172A] text-slate-300 py-2 px-4 sm:px-6 lg:px-12 text-xs flex flex-wrap justify-between items-center gap-y-2 border-b border-slate-800">
        <div className="flex items-center flex-wrap gap-x-4 gap-y-1 w-full sm:w-auto justify-center sm:justify-start">
          <a href="mailto:enquiry@finalattemptias.com" className="hover:text-white transition-colors flex items-center gap-1.5 shrink-0">
            <span className="font-semibold text-amber-500">✉</span>
            <span>enquiry@finalattemptias.com</span>
          </a>
          <span className="hidden sm:inline text-slate-700">|</span>
          <a href="tel:+919709992093" className="hover:text-white transition-colors flex items-center gap-1.5 shrink-0">
            <span className="font-semibold text-amber-500">📞</span>
            <span>+91 97099 92093</span>
          </a>
        </div>
        <div className="flex items-center justify-center sm:justify-end gap-4 w-full sm:w-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
          {mounted && isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link
                href={user?.role === 'admin' ? '/admin' : user?.role === 'faculty' ? '/faculty/dashboard' : '/student/dashboard'}
                className="hover:text-white transition-colors flex items-center gap-1.5 font-bold"
              >
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="w-5 h-5 rounded-full object-cover border border-amber-500" />
                ) : (
                  <span className="w-5 h-5 bg-slate-800 rounded-full flex items-center justify-center text-[10px] text-amber-500 border border-slate-700">👤</span>
                )}
                <span className="text-xs">Dashboard</span>
              </Link>
              <button
                onClick={logout}
                className="hover:text-white transition-colors font-bold text-[10px] uppercase tracking-wider bg-red-650/40 border border-red-500/20 px-2 py-0.5 rounded-lg cursor-pointer"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link href="/auth/login/student" className="hover:text-white transition-colors flex items-center gap-1.5 font-bold shrink-0">
              <span>👤</span>
              <span>Student Login</span>
            </Link>
          )}
          <span className="text-slate-700">|</span>
          <button
            onClick={toggleTheme}
            className="hover:text-white transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer shrink-0"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-slate-400" />
                <span>Dark Mode</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <div className="relative w-48 h-12 shrink-0">
              {/* Light Theme Logo */}
              <img
                src="/darklogofull.png"
                alt="Final Attempt"
                className="w-full h-full object-contain logo-light"
              />
              {/* Dark Theme Logo */}
              <img
                src="/lightlogofull.png"
                alt="Final Attempt"
                className="w-full h-full object-contain logo-dark"
              />
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-4">
            {navLinks.map((link) => {
              const isDropdownActive = mounted && pathname.startsWith(link.href) && link.href !== '/';
              const isLinkActive = mounted && pathname === link.href;

              return (
                <div key={link.name} className="relative group/nav">
                  {link.dropdown ? (
                    <Link
                      href={link.href}
                      className={`flex items-center gap-1 px-3 py-2 text-sm font-bold transition-all ${isDropdownActive
                        ? 'text-[#F59E0B]'
                        : 'text-slate-700 hover:text-[#F59E0B]'
                        }`}
                    >
                      <span>{link.name}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover/nav:rotate-180 transition-transform duration-200" />
                    </Link>
                  ) : (
                    <Link
                      href={link.href}
                      className={`px-3 py-2 text-sm font-bold transition-all relative ${isLinkActive
                        ? 'text-[#F59E0B] after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:bg-[#F59E0B]'
                        : 'text-slate-700 hover:text-[#F59E0B]'
                        }`}
                    >
                      {link.name}
                    </Link>
                  )}

                  {/* Dropdown Menu */}
                  {link.dropdown && (
                    <div className="absolute top-full left-0 mt-2 w-60 rounded-2xl border border-slate-100 dark:border-white/[0.08] bg-white dark:bg-slate-900 shadow-2xl opacity-0 invisible group-hover/nav:opacity-100 group-hover/nav:visible translate-y-1 group-hover/nav:translate-y-0 transition-all duration-200 z-50 p-2 space-y-0.5">
                      {link.dropdown.map((subItem) => (
                        <Link
                          key={subItem.name}
                          href={subItem.href}
                          className="flex flex-col px-3 py-2.5 rounded-xl hover:bg-amber-50 dark:hover:bg-white/[0.04] transition-colors group/sub"
                        >
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover/sub:text-amber-600 transition-colors">{subItem.name}</span>
                          {subItem.desc && (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{subItem.desc}</span>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );

            })}
          </nav>

          {/* CTA & Mobile Toggle */}
          <div className="flex items-center gap-4">
            <Link
              href="/contact?enquiry=enroll"
              className="hidden sm:inline-flex items-center justify-center px-5 py-2.5 text-sm font-extrabold text-slate-900 bg-[#F59E0B] hover:bg-amber-500 transition-all rounded-xl shadow-md hover:scale-[1.02] gap-2"
            >
              <span>Enroll Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-50 focus:outline-none"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden border-t px-4 pt-2 pb-6 space-y-1 shadow-inner max-h-[80vh] overflow-y-auto transition-colors duration-200" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--card-border)' }}>
          {navLinks.map((link) => (
            <div key={link.name} className="py-1">
              {link.dropdown ? (
                <div>
                  <button
                    onClick={() => toggleDropdown(link.name)}
                    className="w-full flex justify-between items-center px-4 py-2.5 text-base font-semibold text-slate-800 hover:bg-amber-50 rounded-xl"
                  >
                    <span>{link.name}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${activeDropdown === link.name ? 'rotate-180' : ''}`} />
                  </button>
                  {activeDropdown === link.name && (
                    <div className="pl-4 mt-1 space-y-1 border-l-2 border-amber-200 ml-4">
                      {link.dropdown.map((subItem) => (
                        <Link
                          key={subItem.name}
                          href={subItem.href}
                          onClick={() => setIsOpen(false)}
                          className="block px-4 py-2 text-sm font-medium text-slate-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg"
                        >
                          {subItem.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-2.5 text-base font-semibold text-slate-800 hover:bg-amber-50 rounded-xl"
                >
                  {link.name}
                </Link>
              )}
            </div>
          ))}

          {mounted && isAuthenticated ? (
            <div className="pt-4 border-t border-[var(--card-border)] px-4 space-y-2">
              <Link
                href={user?.role === 'admin' ? '/admin' : user?.role === 'faculty' ? '/faculty/dashboard' : '/student/dashboard'}
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-color)] font-bold rounded-xl text-center shadow-sm"
              >
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="w-5 h-5 rounded-full object-cover border border-amber-500" />
                ) : (
                  <span>👤</span>
                )}
                <span>My Dashboard</span>
              </Link>
              <button
                onClick={() => {
                  setIsOpen(false);
                  logout();
                }}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-md cursor-pointer"
              >
                Log Out
              </button>
            </div>
          ) : (
            <div className="pt-4 border-t border-[var(--card-border)] px-4">
              <Link
                href="/auth/login/student"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-color)] font-bold rounded-xl text-center shadow-sm"
              >
                <span>👤</span>
                <span>Student Login</span>
              </Link>
            </div>
          )}

          <div className="pt-2 px-4">
            <Link
              href="/contact"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-center px-4 py-3 text-white font-bold rounded-xl text-center shadow-md"
              style={{ background: 'linear-gradient(135deg, #D97706, #F59E0B)', boxShadow: '0 4px 16px rgba(217,119,6,0.30)' }}
            >
              Enquire Now
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
