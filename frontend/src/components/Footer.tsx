'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Mail,
  MapPin,
  PhoneCall,
  Eye,
  TrendingUp,
  ChevronRight,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Award,
} from 'lucide-react';

import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaTelegramPlane,
} from 'react-icons/fa';
import { db } from '@/services/db';

const getBackendUrl = () => {
  if (process.env.NEXT_PUBLIC_BACKEND_URL) return process.env.NEXT_PUBLIC_BACKEND_URL;
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    return `http://${hostname}:5000`;
  }
  return 'http://localhost:5000';
};

export default function Footer() {
  const pathname = usePathname();
  const [visitorsCount, setVisitorsCount] = useState<number | null>(null);
  const [footerCustomPages, setFooterCustomPages] = useState<any[]>([]);
  const [siteSettings, setSiteSettings] = useState<any>({});

  const isPortal =
    pathname.startsWith('/student') ||
    pathname.startsWith('/faculty') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/lms');

  useEffect(() => {
    if (isPortal) return;

    db.getCustomPages(true).then(pages => {
      if (pages) setFooterCustomPages(pages.filter(p => p.showLocation === 'FOOTER'));
    });

    db.getSettings().then(s => {
      if (s) setSiteSettings(s);
    });

    const incrementVisitors = async () => {
      try {
        const BACKEND_URL = getBackendUrl();
        const res = await fetch(`${BACKEND_URL}/api/visitors/increment`, {
          method: 'POST',
        });

        if (!res.ok) return;

        const data = await res.json();
        if (data.success) {
          setVisitorsCount(data.visitorsCount);
        }
      } catch (_) {}
    };

    incrementVisitors();
  }, [isPortal]);

  if (isPortal) return null;

  const phone = siteSettings?.contactPhone || '+91 97099 92093';
  const email = siteSettings?.contactEmail || 'enquiry@finalattemptias.com';
  const address = siteSettings?.contactAddress || 'Boring Road Crossing, Patna, Bihar – 800001';

  return (
    <footer className="relative overflow-hidden border-t border-slate-800/80 bg-[#0B1120] text-slate-200 pt-16 pb-8 font-sans">

      {/* Decorative Glow Elements */}
      <div className="absolute -left-20 top-0 h-96 w-96 rounded-full bg-amber-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-blue-600/10 blur-[140px] pointer-events-none" />
      <div className="absolute left-1/2 top-0 h-px w-full -translate-x-1/2 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

      <div className="relative z-10 mx-auto max-w-screen-2xl px-5 sm:px-8 lg:px-12">

        {/* Top Newsletter / CTA Banner Banner */}
        <div className="mb-14 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-[#0F172A] to-slate-900 p-6 sm:p-8 md:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 text-center lg:text-left">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-black uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5" /> Start Preparing Today
              </span>
              <h2 className="text-2xl sm:text-3xl font-heading font-black text-white tracking-tight">
                Ready to Make Your BPSC Attempt Final?
              </h2>
              <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
                Join Patna's most outcome-focused coaching & mentorship ecosystem. Get direct Guidance from civil service experts.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
              <Link
                href="/contact?enquiry=enroll"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm transition-all shadow-lg hover:shadow-amber-500/30 hover:scale-[1.02] active:scale-100"
              >
                <span>Enroll In Batch</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href={`tel:${phone.replace(/\s+/g, '')}`}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-white font-bold text-sm transition-all hover:border-slate-600"
              >
                <PhoneCall className="w-4 h-4 text-amber-400" />
                <span>Call Us Now</span>
              </a>
            </div>
          </div>
        </div>

        {/* Main Footer Links & Information Grid */}
        <div className="grid gap-10 sm:gap-12 grid-cols-1 md:grid-cols-2 lg:grid-cols-12 mb-14">

          {/* Brand & About Column */}
          <div className="space-y-6 lg:col-span-4">
            <Link href="/" className="inline-flex items-center">
              <img
                src="/lightlogofull.png"
                alt="Final Attempt IAS"
                className="h-14 sm:h-16 w-auto object-contain"
              />
            </Link>

            <p className="text-sm leading-relaxed text-slate-300 font-medium">
              Final Attempt is Bihar's premier coaching and mentorship platform for civil service aspirants. We combine micro-scheduled syllabus coverage, daily answer evaluation, analytics diagnostics, and officer mentorship to deliver your target results.
            </p>

            <div className="flex items-center gap-3 text-xs text-slate-300">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-amber-400 font-bold">
                <ShieldCheck className="w-4 h-4" /> BPSC Focused
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-amber-400 font-bold">
                <Award className="w-4 h-4" /> Expert Mentors
              </span>
            </div>

            {/* Social Media Channels */}
            <div className="pt-2">
              <p className="text-xs uppercase font-extrabold tracking-widest text-slate-400 mb-3">
                Connect With Us
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://www.facebook.com/finalattemptofficial"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook"
                  className="group flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-400 transition-all duration-300 hover:scale-110 hover:bg-[#1877F2] hover:text-white"
                >
                  <FaFacebookF size={16} />
                </a>

                <a
                  href="https://www.instagram.com/finalattempt_official"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="group flex h-10 w-10 items-center justify-center rounded-xl border border-pink-500/30 bg-pink-500/10 text-pink-400 transition-all duration-300 hover:scale-110 hover:bg-gradient-to-br hover:from-[#FEDA75] hover:via-[#E1306C] hover:to-[#833AB4] hover:text-white"
                >
                  <FaInstagram size={16} />
                </a>

                <a
                  href="https://www.youtube.com/@FinalAttemptOfficial"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="YouTube"
                  className="group flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 transition-all duration-300 hover:scale-110 hover:bg-[#FF0000] hover:text-white"
                >
                  <FaYoutube size={18} />
                </a>

                <a
                  href="https://t.me/Finalattemptofficial"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Telegram"
                  className="group flex h-10 w-10 items-center justify-center rounded-xl border border-sky-500/30 bg-sky-500/10 text-sky-400 transition-all duration-300 hover:scale-110 hover:bg-[#229ED9] hover:text-white"
                >
                  <FaTelegramPlane size={16} />
                </a>
              </div>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div className="lg:col-span-2 sm:col-span-1">
            <h3 className="mb-5 text-base font-extrabold uppercase tracking-widest text-white border-l-2 border-amber-500 pl-3">
              Quick Links
            </h3>

            <ul className="space-y-3.5 text-base font-bold">
              {[
                { label: "Home", href: "/" },
                { label: "About Us", href: "/about" },
                { label: "Courses & Batches", href: "/courses" },
                { label: "Test Series", href: "/test-series" },
                { label: "Current Affairs", href: "/current-affairs" },
                { label: "Downloads Hub", href: "/downloads" },
                { label: "Strategy & Syllabus", href: "/syllabus-strategy" },
                { label: "Blogs & News", href: "/blog" },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="group flex items-center text-slate-200 transition-colors duration-200 hover:text-amber-400"
                  >
                    <ChevronRight className="mr-1.5 h-4 w-4 text-slate-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-amber-400" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Core Programs Column */}
          <div className="lg:col-span-2 sm:col-span-1">
            <h3 className="mb-5 text-base font-extrabold uppercase tracking-widest text-white border-l-2 border-amber-500 pl-3">
              Courses & Batches
            </h3>

            <ul className="space-y-3.5 text-base font-bold">
              {[
                { label: "BPSC Foundation Batch", href: "/courses?category=Foundation" },
                { label: "BPSC Prelims Target", href: "/courses?category=Prelims" },
                { label: "Mains Answer Writing", href: "/courses?category=Mains" },
                { label: "Prelims Test Series", href: "/test-series?stage=PRELIMS" },
                { label: "Mains Test Series", href: "/test-series?stage=MAINS" },
                { label: "Interview Guidance", href: "/courses" },
                { label: "Official PYQ Library", href: "/downloads/pyq" },
              ].map((program) => (
                <li key={program.label}>
                  <Link
                    href={program.href}
                    className="group flex items-center text-slate-200 transition-colors duration-200 hover:text-amber-400"
                  >
                    <ChevronRight className="mr-1.5 h-4 w-4 text-slate-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-amber-400" />
                    {program.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Details Card */}
          <div className="lg:col-span-4">
            <h3 className="mb-5 text-sm font-extrabold uppercase tracking-widest text-white border-l-2 border-amber-500 pl-3">
              Head Office Contact
            </h3>

            <div className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-4 shadow-xl">
              <div className="flex items-start gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <PhoneCall size={18} />
                </div>
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
                    Admission Helpline
                  </p>
                  <a
                    href={`tel:${phone.replace(/\s+/g, '')}`}
                    className="mt-0.5 block text-sm font-bold text-white transition-colors hover:text-amber-400"
                  >
                    {phone}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3.5 border-t border-slate-800/80 pt-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Mail size={18} />
                </div>
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
                    Official Email
                  </p>
                  <a
                    href={`mailto:${email}`}
                    className="mt-0.5 block text-sm font-bold text-white transition-colors hover:text-amber-400 break-all"
                  >
                    {email}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3.5 border-t border-slate-800/80 pt-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <MapPin size={18} />
                </div>
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
                    Patna Center Location
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-slate-300 leading-snug">
                    {address}
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Legal & Copyright Bar */}
        <div className="relative border-t border-slate-800/80 pt-8">

          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

            {/* Copyright & Legal Links */}
            <div className="space-y-3 text-center lg:text-left">
              <p className="text-sm font-medium text-slate-300">
                © {new Date().getFullYear()} <span className="font-extrabold text-white">Final Attempt</span>. All Rights Reserved.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-bold text-slate-300 lg:justify-start">
                <Link href="/privacy-policy" className="hover:text-amber-400 transition-colors">
                  Privacy Policy
                </Link>
                <span className="text-slate-700">•</span>
                <Link href="/terms" className="hover:text-amber-400 transition-colors">
                  Terms & Conditions
                </Link>
                <span className="text-slate-700">•</span>
                <Link href="/refund-policy" className="hover:text-amber-400 transition-colors">
                  Refund Policy
                </Link>
                <span className="text-slate-700">•</span>
                <Link href="/disclaimer" className="hover:text-amber-400 transition-colors">
                  Disclaimer
                </Link>

                {footerCustomPages.map(p => (
                  <span key={p.id} className="flex items-center gap-x-4">
                    <span className="text-slate-700">•</span>
                    <Link href={`/page/${p.slug}`} className="hover:text-amber-400 transition-colors">
                      {p.title}
                    </Link>
                  </span>
                ))}
              </div>
            </div>

            {/* Visitor Counter & Developer Credits */}
            <div className="flex flex-wrap items-center justify-center gap-4 lg:justify-end">

              {/* Real-time Visitor Counter Badge */}
              {visitorsCount !== null && (
                <div className="inline-flex items-center gap-3 rounded-xl border border-amber-500/30 bg-slate-900 px-4 py-2 shadow-lg">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
                    <TrendingUp size={15} />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-300">
                        Live Visitor Counter
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5 font-mono">
                      {visitorsCount.toLocaleString('en-IN').split('').map((digit, idx) => (
                        <span
                          key={idx}
                          className={digit === ',' ? 'text-amber-500 font-bold px-0.5' : 'bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-amber-400 text-xs font-black shadow-inner'}
                        >
                          {digit}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Developer Credit */}
              <a
                href="https://nighwantech.com"
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs text-slate-300 transition-all duration-300 hover:border-amber-500/40 hover:bg-slate-800 hover:text-white"
              >
                <span className="h-2 w-2 rounded-full bg-amber-400 group-hover:animate-pulse" />
                <span>Designed & Developed by</span>
                <span className="font-extrabold text-white group-hover:text-amber-400">
                  Nighwan Technology Pvt. Ltd.
                </span>
              </a>

            </div>

          </div>

        </div>

      </div>
    </footer>
  );
}
