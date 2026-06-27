'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown, Phone, User, MapPin, Sparkles } from 'lucide-react';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const pathname = usePathname();

  // Hide header/footer on portals for clean dashboard layout
  const isPortal = pathname.startsWith('/student') || pathname.startsWith('/faculty') || pathname.startsWith('/admin');

  if (isPortal) return null;

  const toggleDropdown = (name: string) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Courses', href: '/courses' },
    {
      name: 'BPSC',
      href: '#',
      dropdown: [
        { name: '70th BPSC Foundation', href: '/courses/bpsc-foundation' },
        { name: 'BPSC Prelims Test Series', href: '/courses/prelims-test-series' },
        { name: 'Mains Answer Writing', href: '/courses/mains-answer-writing' },
      ]
    },
    {
      name: 'UPSC',
      href: '#',
      dropdown: [
        { name: 'UPSC Mentorship Program', href: '/courses/upsc-mentorship' },
        { name: 'Prelims Mock Program', href: '/courses/prelims-test-series' },
      ]
    },
    { name: 'Current Affairs', href: '/current-affairs' },
    { name: 'Results', href: '/results' },
    {
      name: 'Resources',
      href: '#',
      dropdown: [
        { name: 'Study Notes & PDFs', href: '/resources' },
        { name: 'Previous Year Papers (PYQs)', href: '/pyq' },
        { name: 'Editorial Blog', href: '/blog' },
      ]
    },
    {
      name: 'About Us',
      href: '#',
      dropdown: [
        { name: 'Our Mission & Vision', href: '/about' },
        { name: 'Meet the Founder', href: '/about#founder' },
        { name: 'Faculty Members', href: '/faculty' },
      ]
    },
    { name: 'Contact Us', href: '/contact' }
  ];

  return (
    <header className="w-full z-50 sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs">
      {/* Upper Ticker Bar */}
      <div className="w-full bg-brand-primary text-slate-300 py-1.5 px-4 sm:px-6 lg:px-8 text-xs flex flex-col sm:flex-row justify-between items-center gap-2 border-b border-slate-800">
        <div className="flex items-center gap-2 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-brand-accent animate-pulse" />
          <span>Bihar's Most Trusted Mentorship Platform for BPSC & UPSC Aspirants</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/student" className="hover:text-white transition-colors flex items-center gap-1.5 font-medium">
            <User className="w-3.5 h-3.5" />
            <span>Student Login</span>
          </Link>
          <span className="text-slate-600">|</span>
          <Link href="/faculty/dashboard" className="hover:text-white transition-colors flex items-center gap-1.5 font-medium">
            <User className="w-3.5 h-3.5" />
            <span>Faculty Login</span>
          </Link>
          <span className="text-slate-600">|</span>
          <a href="tel:+919113131819" className="hover:text-white transition-colors flex items-center gap-1.5 font-semibold text-brand-accent">
            <Phone className="w-3.5 h-3.5" />
            <span>+91 91131 31819</span>
          </a>
          <span className="text-slate-600 hidden md:inline">|</span>
          <div className="hidden md:flex items-center gap-1.5 text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-red-400" />
            <span>Boring Road, Patna</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-brand-primary flex items-center justify-center text-white font-extrabold text-lg border border-slate-700 shadow-md group-hover:scale-105 transition-transform duration-300">
              FA
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-extrabold text-lg tracking-tight text-brand-primary">
                FINAL ATTEMPT
              </span>
              <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase -mt-1">
                One Mentor. One Strategy.
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => (
              <div key={link.name} className="relative group/nav">
                {link.dropdown ? (
                  <button
                    onClick={() => toggleDropdown(link.name)}
                    className={`flex items-center gap-1 px-3 py-2 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-all ${pathname.startsWith(link.href) ? 'text-brand-secondary bg-slate-50' : 'text-slate-600 hover:text-brand-primary'
                      }`}
                  >
                    <span>{link.name}</span>
                    <ChevronDown className="w-4 h-4 text-slate-400 group-hover/nav:rotate-180 transition-transform duration-300" />
                  </button>
                ) : (
                  <Link
                    href={link.href}
                    className={`px-3 py-2 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-all ${pathname === link.href ? 'text-brand-secondary bg-slate-50 font-bold' : 'text-slate-600 hover:text-brand-primary'
                      }`}
                  >
                    {link.name}
                  </Link>
                )}

                {/* Dropdown Menu */}
                {link.dropdown && (
                  <div className="absolute top-full left-0 mt-1 w-56 rounded-xl bg-white border border-slate-100 shadow-xl opacity-0 invisible group-hover/nav:opacity-100 group-hover/nav:visible transition-all duration-200 z-50 py-1.5">
                    {link.dropdown.map((subItem) => (
                      <Link
                        key={subItem.name}
                        href={subItem.href}
                        className="block px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-brand-primary hover:bg-slate-50 transition-colors"
                      >
                        {subItem.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* CTA & Mobile Toggle */}
          <div className="flex items-center gap-4">
            <Link
              href="/contact?enquiry=general"
              className="hidden sm:inline-flex items-center justify-center px-5 py-2.5 text-sm font-bold text-white bg-brand-secondary hover:bg-blue-800 transition-all rounded-xl shadow-md hover:shadow-lg shadow-blue-500/10 hover:-translate-y-0.5 active:translate-y-0"
            >
              Enquire Now
            </Link>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-brand-primary hover:bg-slate-50 focus:outline-none"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white px-4 pt-2 pb-6 space-y-1 shadow-inner max-h-[80vh] overflow-y-auto">
          {navLinks.map((link) => (
            <div key={link.name} className="py-1">
              {link.dropdown ? (
                <div>
                  <button
                    onClick={() => toggleDropdown(link.name)}
                    className="w-full flex justify-between items-center px-4 py-2.5 text-base font-semibold text-slate-700 hover:bg-slate-50 rounded-xl"
                  >
                    <span>{link.name}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${activeDropdown === link.name ? 'rotate-180' : ''}`} />
                  </button>
                  {activeDropdown === link.name && (
                    <div className="pl-4 mt-1 space-y-1 border-l-2 border-slate-100 ml-4">
                      {link.dropdown.map((subItem) => (
                        <Link
                          key={subItem.name}
                          href={subItem.href}
                          onClick={() => setIsOpen(false)}
                          className="block px-4 py-2 text-sm font-medium text-slate-500 hover:text-brand-primary hover:bg-slate-50 rounded-lg"
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
                  className="block px-4 py-2.5 text-base font-semibold text-slate-700 hover:bg-slate-50 rounded-xl"
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
              className="w-full flex items-center justify-center px-4 py-3 bg-brand-secondary text-white font-bold rounded-xl text-center shadow-md shadow-blue-500/10"
            >
              Enquire Now
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
