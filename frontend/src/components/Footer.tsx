'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mail, MapPin, PhoneCall, Globe, Video, Send, Eye } from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export default function Footer() {
  const pathname = usePathname();
  const [visitorsCount, setVisitorsCount] = useState<number | null>(null);

  const isPortal = pathname.startsWith('/student') || pathname.startsWith('/faculty') || pathname.startsWith('/admin') || pathname.startsWith('/lms');

  useEffect(() => {
    if (isPortal) return;

    const incrementVisitors = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/visitors/increment`, { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setVisitorsCount(data.visitorsCount);
          }
        }
      } catch (err) {
        console.warn('Failed to increment visitor counter:', err);
      }
    };
    incrementVisitors();
  }, [isPortal]);

  if (isPortal) return null;

  return (
    <footer className="bg-[#090D1A] text-slate-400 pt-16 pb-8 border-t border-slate-900 font-body relative overflow-hidden">
      {/* Subtle bottom flare */}
      <div className="absolute bottom-0 right-1/4 w-96 h-48 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Logo & Description */}
          <div className="lg:col-span-2 space-y-6">
            <Link href="/" className="flex items-center">
              <div className="relative w-48 h-12 shrink-0">
                <img
                  src="/lightlogofull.png"
                  alt="Final Attempt"
                  className="w-full h-full object-contain"
                />
              </div>
            </Link>
            <p className="text-xs leading-relaxed text-slate-400 pr-4">
              Empowering Bihar's civil services aspirants with structured daily mentorship, analytics diagnostics, and topper strategy mapping. We deliver outcome-oriented preparation for your successful attempt.
            </p>
            {/* Social Media Links */}
            <div className="flex items-center gap-3">
              <a
                href="https://www.facebook.com/finalattemptofficial"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-xl bg-white/[0.03] hover:bg-blue-600 hover:text-white flex items-center justify-center text-slate-400 border border-white/[0.04] transition-all hover:scale-105"
                aria-label="Facebook"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a
                href="https://www.instagram.com/finalattempt_official"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-xl bg-white/[0.03] hover:bg-pink-600 hover:text-white flex items-center justify-center text-slate-400 border border-white/[0.04] transition-all hover:scale-105"
                aria-label="Instagram"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </a>
              <a
                href="https://www.youtube.com/@FinalAttemptOfficial"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-xl bg-white/[0.03] hover:bg-red-600 hover:text-white flex items-center justify-center text-slate-400 border border-white/[0.04] transition-all hover:scale-105"
                aria-label="YouTube"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.107C19.53 3.5 12 3.5 12 3.5s-7.53 0-9.388.556a3.003 3.003 0 0 0-2.11 2.107C0 8.022 0 12 0 12s0 3.978.502 5.837a3.003 3.003 0 0 0 2.11 2.107c1.858.556 9.388.556 9.388.556s7.53 0 9.388-.556a3.003 3.003 0 0 0 2.11-2.107C24 15.978 24 12 24 12s0-3.978-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
              <a
                href="https://t.me/Finalattemptofficial"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-xl bg-white/[0.03] hover:bg-blue-500 hover:text-white flex items-center justify-center text-slate-400 border border-white/[0.04] transition-all hover:scale-105"
                aria-label="Telegram"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading text-white font-bold text-xs uppercase tracking-wider mb-6 border-l-2 border-amber-500 pl-3">
              Quick Links
            </h4>
            <ul className="space-y-3.5 text-xs">
              <li><Link href="/" className="hover:text-amber-400 transition-colors">Home</Link></li>
              <li><Link href="/about" className="hover:text-amber-400 transition-colors">About & Contact</Link></li>
              <li><Link href="/courses" className="hover:text-amber-400 transition-colors">Courses</Link></li>
              <li><Link href="/test-series" className="hover:text-amber-400 transition-colors">Test Series</Link></li>
              <li><Link href="/current-affairs" className="hover:text-amber-400 transition-colors">Current Affairs</Link></li>
              <li><Link href="/pyq" className="hover:text-amber-400 transition-colors">PYQ Papers</Link></li>
              <li><Link href="/blog" className="hover:text-amber-400 transition-colors">Blogs & News</Link></li>
            </ul>
          </div>

          {/* Programs */}
          <div>
            <h4 className="font-heading text-white font-bold text-xs uppercase tracking-wider mb-6 border-l-2 border-amber-500 pl-3">
              Programs
            </h4>
            <ul className="space-y-3.5 text-xs">
              <li><Link href="/courses" className="hover:text-amber-400 transition-colors">BPSC Foundation Course</Link></li>
              <li><Link href="/test-series" className="hover:text-amber-400 transition-colors">Prelims Test Series</Link></li>
              <li><Link href="/courses" className="hover:text-amber-400 transition-colors">Mains Answer Writing</Link></li>
              <li><Link href="/courses" className="hover:text-amber-400 transition-colors">Interview Guidance</Link></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="font-heading text-white font-bold text-xs uppercase tracking-wider mb-6 border-l-2 border-amber-500 pl-3">
              Contact Us
            </h4>
            <ul className="space-y-4 text-xs">
              <li className="flex items-start gap-3">
                <PhoneCall className="w-4 h-4 text-amber-550 mt-0.5 shrink-0" />
                <a href="tel:+919709992093" className="hover:text-white transition-colors font-semibold text-slate-300">
                  +91 97099 92093
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-amber-550 mt-0.5 shrink-0" />
                <a href="mailto:enquiry@finalattemptias.com" className="hover:text-white transition-colors text-slate-350">
                  enquiry@finalattemptias.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-amber-550 mt-0.5 shrink-0" />
                <span className="text-slate-350">
                  Boring Road Crossing,<br />
                  Patna, Bihar - 860001
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal & Copyright */}
        <div className="border-t border-white/[0.04] pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-slate-500 font-semibold tracking-wide uppercase">
          <div className="flex items-center gap-6">
            <p>&copy; {new Date().getFullYear()} Final Attempt. All Rights Reserved.</p>
            <span className="text-slate-800">|</span>
            <span className="text-slate-400">
              Designed & Developed by <a href="https://nighwantech.com" target="_blank" rel="noreferrer" className="text-amber-500 hover:underline">Nighwan Technology Pvt. Ltd.</a>
            </span>
          </div>

          {/* Visitors Count Badge */}
          {visitorsCount !== null && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <Eye className="w-3.5 h-3.5 text-amber-500" />
              <span>Visitors Count: </span>
              <span className="text-white font-bold tracking-widest">{visitorsCount.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
