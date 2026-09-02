'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar, ArrowLeft, AlertCircle, MapPin, CheckCircle, Send } from 'lucide-react';
import { CustomPage } from '@/services/db';

interface CustomPageClientProps {
  initialPage: CustomPage | null;
  slug: string;
}

export default function CustomPageClient({ initialPage, slug }: CustomPageClientProps) {
  const [page] = useState<CustomPage | null>(initialPage);
  const [leadForm, setLeadForm] = useState({ fullName: '', mobile: '', email: '', targetExam: 'BPSC 71st/72nd' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadForm.fullName || !leadForm.mobile) return;
    setSubmitting(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_SITE_URL || '';
      await fetch(`${apiBase}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: leadForm.fullName,
          mobile: leadForm.mobile,
          email: leadForm.email,
          targetExam: `SEO Landing: ${page?.title || slug}`
        })
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Failed submitting lead:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!page) {
    return (
      <div className="min-h-screen bg-[var(--bg-color)] flex items-center justify-center p-6">
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-10 max-w-md text-center space-y-4 shadow-xl">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-xl font-heading font-black text-[var(--text-color)]">Page Not Found</h2>
          <p className="text-xs text-slate-500">The requested page might have been removed or is undergoing updates.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-slate-950 font-bold rounded-2xl text-xs uppercase tracking-wider shadow-md hover:bg-amber-600 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    );
  }

  const isLocationPage = slug.includes('institute') || slug.includes('coaching') || slug.includes('in-');

  return (
    <main className="min-h-screen bg-[var(--bg-color)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-amber-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Main Platform</span>
          </Link>

          <div className="flex items-center gap-2">
            {isLocationPage && (
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-xl uppercase tracking-widest">
                <MapPin className="w-3 h-3 text-indigo-500" />
                Target SEO Area
              </span>
            )}
            <span className="text-[10px] font-extrabold text-amber-600 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-xl uppercase tracking-widest">
              {page.showLocation || 'SEO LANDING PAGE'}
            </span>
          </div>
        </div>

        {/* Page Hero Header with Prominent H1 Tag */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-8 sm:p-12 shadow-md space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <h1 className="text-3xl sm:text-5xl font-heading font-black text-[var(--text-color)] leading-tight tracking-tight">
            {page.title}
          </h1>

          {page.metaDescription && (
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed font-medium">
              {page.metaDescription}
            </p>
          )}

          {page.updatedAt && (
            <div className="pt-2 flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              <span>Last Updated: {new Date(page.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
          )}
        </div>

        {/* Main Dynamic HTML Article Body */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-8 sm:p-12 shadow-sm space-y-6">
          <div
            className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 text-sm sm:text-base leading-relaxed
              [&_h1]:text-2xl [&_h1]:font-black [&_h1]:font-heading [&_h1]:my-4 [&_h1]:text-amber-600
              [&_h2]:text-xl [&_h2]:font-bold [&_h2]:font-heading [&_h2]:my-4 [&_h2]:text-slate-900 [&_h2]:dark:text-white
              [&_h3]:text-lg [&_h3]:font-bold [&_h3]:my-3
              [&_table]:max-w-full [&_table]:border-collapse [&_table]:my-6 [&_table]:mx-auto
              [&_th]:bg-slate-100 [&_th]:dark:bg-slate-800 [&_th]:p-3 [&_th]:text-left [&_th]:font-bold [&_th]:whitespace-nowrap
              [&_td]:p-3 [&_td]:border [&_td]:border-slate-200 [&_td]:dark:border-white/10 [&_td]:whitespace-nowrap
              [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6
              [&_blockquote]:border-l-4 [&_blockquote]:border-amber-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-4"
            dangerouslySetInnerHTML={{ __html: page.content || '<p>No content provided yet for this page.</p>' }}
          />
        </div>

        {/* Lead Capture Form Banner for SEO Landing Conversion */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-amber-500/30 rounded-3xl p-8 sm:p-10 shadow-2xl text-white space-y-6">
          <div className="max-w-2xl space-y-2">
            <span className="text-xs font-black text-amber-400 uppercase tracking-widest">Free Mentorship & Counseling Session</span>
            <h3 className="text-2xl font-heading font-extrabold">Connect with Senior BPSC Mentors</h3>
            <p className="text-xs text-slate-300">
              Fill in your details below to get a 1-on-1 personalized strategy call and free demo study materials.
            </p>
          </div>

          {submitted ? (
            <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-2xl p-6 flex items-center gap-3 text-emerald-300">
              <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <h4 className="font-bold text-sm">Counseling Request Received!</h4>
                <p className="text-xs text-emerald-200">Our senior mentorship coordinator will reach out to you on Mobile/WhatsApp shortly.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleLeadSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Full Name *"
                value={leadForm.fullName}
                onChange={(e) => setLeadForm({ ...leadForm, fullName: e.target.value })}
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-xs font-bold placeholder-slate-400 text-white outline-none focus:border-amber-500"
                required
              />
              <input
                type="tel"
                placeholder="Mobile Number *"
                value={leadForm.mobile}
                onChange={(e) => setLeadForm({ ...leadForm, mobile: e.target.value })}
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-xs font-bold placeholder-slate-400 text-white outline-none focus:border-amber-500"
                required
              />
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Submitting...' : 'Request Free Call'}</span>
              </button>
            </form>
          )}
        </div>

      </div>
    </main>
  );
}
