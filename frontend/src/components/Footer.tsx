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
                  src="/darklogofull.png"
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
                <Globe className="w-4 h-4" />
              </a>
              <a
                href="https://www.instagram.com/finalattempt_official"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-xl bg-white/[0.03] hover:bg-pink-600 hover:text-white flex items-center justify-center text-slate-400 border border-white/[0.04] transition-all hover:scale-105"
                aria-label="Instagram"
              >
                <Globe className="w-4 h-4" />
              </a>
              <a
                href="https://www.youtube.com/@FinalAttemptOfficial"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-xl bg-white/[0.03] hover:bg-red-600 hover:text-white flex items-center justify-center text-slate-400 border border-white/[0.04] transition-all hover:scale-105"
                aria-label="YouTube"
              >
                <Video className="w-4 h-4" />
              </a>
              <a
                href="https://t.me/Finalattemptofficial"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-xl bg-white/[0.03] hover:bg-blue-500 hover:text-white flex items-center justify-center text-slate-400 border border-white/[0.04] transition-all hover:scale-105"
                aria-label="Telegram"
              >
                <Send className="w-4 h-4" />
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
                <a href="mailto:info@finalattemptias.com" className="hover:text-white transition-colors text-slate-350">
                  info@finalattemptias.com
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
