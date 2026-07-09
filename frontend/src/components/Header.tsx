'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown, Phone, User, MapPin, Sparkles, LogOut, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Hide header/footer on portals for clean dashboard layout
  const isPortal = pathname.startsWith('/student') || pathname.startsWith('/faculty') || pathname.startsWith('/admin') || pathname.startsWith('/lms') || pathname.startsWith('/auth');

  if (isPortal) return null;

  const toggleDropdown = (name: string) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'About Us', href: '/about' },
    {
      name: 'Courses',
      href: '/courses',
      dropdown: [
        { name: '70th BPSC Foundation', href: '/courses/bpsc-foundation' },
        { name: 'BPSC Prelims Test Series', href: '/courses/prelims-test-series' },
        { name: 'Mains Answer Writing', href: '/courses/mains-answer-writing' },
      ]
    },
    { name: 'Test Series', href: '/courses#test-series' },
    { name: 'Study Material', href: '/resources' },
    { name: 'Blogs', href: '/blog' },
    { name: 'Career', href: '/about#career' },
    { name: 'Contact Us', href: '/contact' }
  ];

  return (
    <header className="w-full z-50 sticky top-0 bg-white border-b border-slate-100 shadow-sm">
      {/* Upper Ticker Bar matching wireframe scheme */}
      <div className="w-full bg-[#0F172A] text-slate-300 py-2 px-4 sm:px-6 lg:px-8 text-xs flex justify-between items-center border-b border-slate-800">
        <div className="flex items-center gap-6">
          <a href="mailto:info@finalattemptias.com" className="hover:text-white transition-colors flex items-center gap-1.5">
            <span className="font-semibold text-amber-500">✉</span>
            <span>info@finalattemptias.com</span>
          </a>
          <a href="tel:+919817304845" className="hover:text-white transition-colors flex items-center gap-1.5">
            <span className="font-semibold text-amber-500">📞</span>
            <span>+91 98173 04845</span>
          </a>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/auth/login" className="hover:text-white transition-colors flex items-center gap-1.5">
            <span>👤</span>
            <span>Student Login (Moodle)</span>
          </Link>
          <span className="text-slate-700">|</span>
          <Link href="/auth/login" className="hover:text-white transition-colors flex items-center gap-1.5">
            <span>🔒</span>
            <span>Admin Login</span>
          </Link>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-[#0F172A] font-extrabold text-base border-2 border-[#1E3A8A] shadow-sm relative overflow-hidden shrink-0">
              {/* FA emblem style */}
              <span className="z-10 font-black tracking-tighter text-[#1E3A8A]">FA</span>
              <div className="absolute top-0 right-0 w-2 h-2 bg-[#F59E0B] rounded-full" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-black text-xl tracking-tight text-[#0F172A] leading-none">
                FINAL ATTEMPT
              </span>
              <span className="text-[10px] text-slate-500 font-bold tracking-wide mt-1">
                Your <span className="text-[#F59E0B]">Final Step</span> Toward Success.........
              </span>
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
                    <button
                      onClick={() => toggleDropdown(link.name)}
                      className={`flex items-center gap-1 px-3 py-2 text-sm font-bold transition-all ${
                        isDropdownActive 
                          ? 'text-[#F59E0B]' 
                          : 'text-slate-700 hover:text-[#F59E0B]'
                      }`}
                    >
                      <span>{link.name}</span>
                      <ChevronDown className="w-4 h-4 text-slate-400 group-hover/nav:rotate-180 transition-transform duration-300" />
                    </button>
                  ) : (
                    <Link
                      href={link.href}
                      className={`px-3 py-2 text-sm font-bold transition-all relative ${
                        isLinkActive 
                          ? 'text-[#F59E0B] after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:bg-[#F59E0B]' 
                          : 'text-slate-700 hover:text-[#F59E0B]'
                      }`}
                    >
                      {link.name}
                    </Link>
                  )}

                  {/* Dropdown Menu */}
                  {link.dropdown && (
                    <div className="absolute top-full left-0 mt-1 w-56 rounded-xl border border-slate-100 bg-white shadow-xl opacity-0 invisible group-hover/nav:opacity-100 group-hover/nav:visible transition-all duration-200 z-50 py-1.5">
                      {link.dropdown.map((subItem) => (
                        <Link
                          key={subItem.name}
                          href={subItem.href}
                          className="block px-4 py-2.5 text-sm font-bold text-slate-700 hover:text-[#F59E0B] hover:bg-slate-50 transition-colors"
                        >
                          {subItem.name}
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
              className="hidden sm:inline-flex items-center justify-center px-6 py-3 text-sm font-extrabold text-slate-900 bg-[#F59E0B] hover:bg-amber-500 transition-all rounded-xl shadow-md hover:scale-[1.02] gap-2"
            >
              <span>Enroll Now</span>
              <ArrowRight className="w-4 h-4" />
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
        <div className="lg:hidden border-t px-4 pt-2 pb-6 space-y-1 shadow-inner max-h-[80vh] overflow-y-auto" style={{ background: '#FFFBF2', borderColor: 'rgba(245,158,11,0.2)' }}>
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
          <div className="pt-4 px-4">
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
