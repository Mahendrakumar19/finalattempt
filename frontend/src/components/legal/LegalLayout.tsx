'use client';

import React from 'react';
import Link from 'next/link';
import { Home, ChevronRight, Mail, Phone, MapPin, ShieldCheck, Clock } from 'lucide-react';

interface LegalLayoutProps {
  title: string;
  subtitle: string;
  lastUpdated: string;
  breadcrumbName: string;
  children: React.ReactNode;
}

export default function LegalLayout({
  title,
  subtitle,
  lastUpdated,
  breadcrumbName,
  children,
}: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-[var(--bg-color)] text-[var(--text-color)] font-body py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-200">
      {/* Soft Ambient Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-radial from-amber-500/10 via-indigo-500/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-10 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-2/3 right-10 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-10 relative z-10">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-semibold tracking-wide">
          <Link href="/" className="hover:text-amber-500 flex items-center gap-1.5 transition-colors">
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
          <span className="text-amber-600 dark:text-amber-400 font-bold">{breadcrumbName}</span>
        </nav>

        {/* Hero Section */}
        <div className="p-8 sm:p-12 rounded-3xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 dark:opacity-10 pointer-events-none">
            <ShieldCheck className="w-48 h-48 text-amber-500" />
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-extrabold uppercase tracking-widest">
            <Clock className="w-3.5 h-3.5" />
            <span>Last Updated: {lastUpdated}</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl font-heading font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              {title}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed font-medium">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Content Container (Glass Card) */}
        <div className="p-8 sm:p-12 rounded-3xl bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-lg">
          <article className="prose dark:prose-invert max-w-none prose-headings:font-heading prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-white prose-h2:text-xl prose-h2:sm:text-2xl prose-h2:border-b prose-h2:border-slate-200 dark:prose-h2:border-white/10 prose-h2:pb-3 prose-h2:mt-10 prose-h3:text-lg prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:leading-relaxed prose-li:text-slate-700 dark:prose-li:text-slate-300 prose-strong:text-amber-600 dark:prose-strong:text-amber-400 prose-a:text-amber-600 dark:prose-a:text-amber-400 hover:prose-a:underline">
            {children}
          </article>
        </div>

        {/* Reusable Legal Contact Card */}
        <div className="p-8 sm:p-10 rounded-3xl bg-linear-to-br from-white via-amber-50/40 to-slate-50 dark:from-slate-900/90 dark:via-slate-900/60 dark:to-amber-950/30 backdrop-blur-xl border border-amber-500/20 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-200 dark:border-white/10 pb-6">
            <div>
              <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-lg">
                Need Help?
              </span>
              <h3 className="text-2xl font-heading font-black text-slate-900 dark:text-white mt-2">
                Have questions regarding our legal terms or compliance?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                Our support team is available to address any inquiries regarding courses, billing, or policies.
              </p>
            </div>
            <Link
              href="/contact"
              className="px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 shrink-0"
            >
              Contact Support
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/5 shadow-xs">
              <Mail className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Email Us</p>
                <a
                  href="mailto:enquiry@finalattemptias.com"
                  className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                >
                  enquiry@finalattemptias.com
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/5 shadow-xs">
              <Phone className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Call Support</p>
                <a
                  href="tel:+919709992093"
                  className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                >
                  +91 97099 92093
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/5 shadow-xs">
              <MapPin className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Head Office</p>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-snug">
                  Boring Road Crossing, Patna, Bihar – 800001, India
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
