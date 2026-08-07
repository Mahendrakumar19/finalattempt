'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  ArrowLeft, CheckCircle, ShieldCheck, Clock, BookOpen, Layers, 
  ChevronDown, ChevronUp, Download, Award, Sparkles, PhoneCall, HelpCircle, Eye
} from 'lucide-react';
import { db, TestSeriesItem } from '@/services/db';

export default function TestSeriesDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [series, setSeries] = useState<TestSeriesItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [openSubject, setOpenSubject] = useState<number | null>(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    async function loadDetail() {
      setLoading(true);
      try {
        const item = await db.getTestSeriesBySlug(slug);
        setSeries(item);
      } catch (err) {
        console.error('Error loading test series detail:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 space-y-6">
        <div className="h-8 w-32 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
        <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (!series) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <BookOpen className="w-16 h-16 text-slate-400 mx-auto" />
        <h2 className="text-2xl font-heading font-black text-[var(--text-color)]">Test Series Not Found</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          The test series program you requested is unavailable or has been archived.
        </p>
        <Link
          href="/test-series"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-amber-500 text-slate-950 font-bold rounded-2xl text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Test Series</span>
        </Link>
      </div>
    );
  }

  const hasDiscount = series.discountedPrice && series.discountedPrice < series.price;
  const displayPrice = hasDiscount ? series.discountedPrice : series.price;

  return (
    <div className="min-h-screen bg-[var(--bg-color)] py-10 px-4 sm:px-6 lg:px-8 font-body space-y-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Back Link */}
        <Link
          href="/test-series"
          className="text-xs font-bold text-amber-500 hover:text-amber-600 transition-colors inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Test Series Portal</span>
        </Link>

        {/* ── Main Hero Section ────────────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-8 sm:p-12 border border-white/10 shadow-2xl relative overflow-hidden space-y-8">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-4 max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-lg">
                {series.exam || 'BPSC Civil Services'}
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest bg-white/10 text-slate-300 border border-white/10 px-3 py-1 rounded-lg">
                {series.language}
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-lg flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Verified Officer Evaluation</span>
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black tracking-tight leading-tight">
              {series.title}
            </h1>

            <p className="text-xs sm:text-sm text-slate-350 leading-relaxed max-w-3xl">
              {series.description}
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Tests</span>
              <span className="text-xl font-black text-amber-400">{series.totalTests} Mocks</span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Question Vault</span>
              <span className="text-xl font-black text-white">{series.totalQuestions} Qs</span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Validity</span>
              <span className="text-xl font-black text-emerald-400">{series.duration}</span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Enrolled Aspirants</span>
              <span className="text-xl font-black text-amber-400">{series.enrolledCount}+ Students</span>
            </div>
          </div>
        </div>

        {/* ── Two-Column Layout ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Details, Syllabus, Sample Teaser, FAQs */}
          <div className="lg:col-span-8 space-y-10">
            
            {/* Highlights Box */}
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
              <h3 className="font-heading font-black text-lg text-[var(--text-color)] flex items-center gap-2 border-b border-[var(--card-border)] pb-3">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>Program Highlights & Inclusions</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {series.highlights?.map((hl, idx) => (
                  <div key={idx} className="flex gap-3 items-start p-3 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-[var(--card-border)]">
                    <CheckCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span className="text-xs font-medium text-[var(--text-color)] leading-snug">{hl}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Syllabus & Micro-Topics Accordion */}
            {series.syllabus && series.syllabus.length > 0 && (
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
                <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-3">
                  <h3 className="font-heading font-black text-lg text-[var(--text-color)] flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-500" />
                    <span>Syllabus & Test Series Structure ({series.syllabus.length} Modules)</span>
                  </h3>
                </div>

                <div className="space-y-3">
                  {series.syllabus.map((sub, idx) => {
                    const isOpen = openSubject === idx;
                    return (
                      <div
                        key={idx}
                        className="border border-[var(--card-border)] rounded-2xl overflow-hidden transition-all"
                      >
                        <button
                          type="button"
                          onClick={() => setOpenSubject(isOpen ? null : idx)}
                          className="w-full p-4 bg-slate-50 dark:bg-slate-900/40 hover:bg-amber-500/5 flex justify-between items-center text-left transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs font-black">
                              {idx + 1}
                            </span>
                            <span className="font-heading font-extrabold text-sm text-[var(--text-color)]">
                              {sub.subject}
                            </span>
                          </div>
                          {isOpen ? <ChevronUp className="w-4 h-4 text-amber-500" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </button>

                        {isOpen && (
                          <div className="p-4 bg-[var(--card-bg)] border-t border-[var(--card-border)] space-y-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Covered Micro Topics:</span>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {sub.topics.map((t, tIdx) => (
                                <li key={tIdx} className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                  <span>{t}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Interactive Teaser / Sample Question Teaser (Better than iasvalley) */}
            <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-3xl p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/20">
                  SAMPLE TEST TEASER PREVIEW
                </span>
                <span className="text-xs font-bold text-slate-500">Official Exam Format</span>
              </div>

              <h4 className="font-heading font-black text-base text-[var(--text-color)]">
                Sample Question Preview: BPSC General Studies Model
              </h4>

              <div className="p-4 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl space-y-3 text-xs text-[var(--text-color)]">
                <p className="font-bold">
                  Q1. With reference to the Bihar Peasant Movement, who among the following led the Bakasht movement in 1937-38?
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 dark:text-slate-300 font-medium">
                  <span className="p-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-[var(--card-border)]">(A) Swami Sahajanand Saraswati</span>
                  <span className="p-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-[var(--card-border)]">(B) Rahul Sankrityayan</span>
                  <span className="p-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-[var(--card-border)]">(C) Karyanand Sharma</span>
                  <span className="p-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-[var(--card-border)]">(D) Yadunandan Sharma</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 italic">
                Enrolled students get instant full-length interactive timed tests, negative marking calculator, and detailed video solution breakdowns.
              </p>
            </div>

            {/* FAQs Accordion */}
            {series.faq && series.faq.length > 0 && (
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
                <h3 className="font-heading font-black text-lg text-[var(--text-color)] flex items-center gap-2 border-b border-[var(--card-border)] pb-3">
                  <HelpCircle className="w-5 h-5 text-amber-500" />
                  <span>Frequently Asked Questions</span>
                </h3>

                <div className="space-y-3">
                  {series.faq.map((f, idx) => {
                    const isOpen = openFaq === idx;
                    return (
                      <div key={idx} className="border border-[var(--card-border)] rounded-2xl overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setOpenFaq(isOpen ? null : idx)}
                          className="w-full p-4 bg-slate-50 dark:bg-slate-900/40 hover:bg-amber-500/5 flex justify-between items-center text-left transition-colors cursor-pointer"
                        >
                          <span className="font-heading font-bold text-xs sm:text-sm text-[var(--text-color)]">
                            {f.q}
                          </span>
                          {isOpen ? <ChevronUp className="w-4 h-4 text-amber-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                        </button>
                        {isOpen && (
                          <div className="p-4 bg-[var(--card-bg)] border-t border-[var(--card-border)] text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            {f.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Sticky Sidebar: Pricing Card & Enrollment */}
          <div className="lg:col-span-4 sticky top-24 space-y-6">
            <div className="bg-[var(--card-bg)] border-2 border-amber-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
              <div className="space-y-2 text-center border-b border-[var(--card-border)] pb-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 inline-block">
                  ENROLLMENT OPEN
                </span>
                <div className="flex justify-center items-baseline gap-2 pt-2">
                  <span className="text-3xl sm:text-4xl font-heading font-black text-[var(--text-color)]">
                    ₹{displayPrice?.toLocaleString()}
                  </span>
                  {hasDiscount && (
                    <span className="text-sm font-bold text-slate-400 line-through">
                      ₹{series.price.toLocaleString()}
                    </span>
                  )}
                </div>
                {hasDiscount && (
                  <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                    Save ₹{(series.price - (series.discountedPrice || 0)).toLocaleString()} Limited Offer
                  </span>
                )}
              </div>

              <div className="space-y-3 text-xs text-[var(--text-color)] font-medium">
                <div className="flex justify-between py-1 border-b border-[var(--card-border)]">
                  <span className="text-slate-400">Target Exam:</span>
                  <span className="font-bold">{series.exam}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--card-border)]">
                  <span className="text-slate-400">Total Mocks:</span>
                  <span className="font-bold">{series.totalTests} Tests</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--card-border)]">
                  <span className="text-slate-400">Language:</span>
                  <span className="font-bold">{series.language}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--card-border)]">
                  <span className="text-slate-400">Validity:</span>
                  <span className="font-bold">{series.duration}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-2xl text-xs sm:text-sm uppercase tracking-wider shadow-md hover:scale-[1.02] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Enroll in Test Series</span>
              </button>

              <Link
                href={`/test-series/${slug}/attempt`}
                className="w-full py-3.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-amber-500/30"
              >
                <Award className="w-4 h-4 text-amber-400" />
                <span>Attempt Free CBT Mock Test</span>
              </Link>


              <div className="text-center space-y-2 pt-2">
                <span className="text-[10px] text-slate-400 block font-medium">Have questions before enrolling?</span>
                <a
                  href="tel:+919709992093"
                  className="text-xs font-extrabold text-amber-500 hover:underline flex items-center justify-center gap-1.5"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Speak with Counselor: +91 97099 92093</span>
                </a>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Enrollment Quick Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl relative">
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider">Fast Enrollment</span>
              <h3 className="font-heading font-black text-xl text-[var(--text-color)]">Enroll in {series.title}</h3>
              <p className="text-xs text-slate-500">Enter your mobile number to get instant student portal access.</p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert(`Thank you! Our admission team is processing your request for "${series.title}". Our team will call you shortly.`);
                setShowModal(false);
              }}
              className="space-y-4 text-xs font-bold"
            >
              <div>
                <label className="block text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] rounded-xl outline-none text-[var(--text-color)]"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Mobile Number</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 10-digit mobile"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] rounded-xl outline-none text-[var(--text-color)]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider cursor-pointer"
              >
                Proceed to Payment & Access (₹{displayPrice?.toLocaleString()})
              </button>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-full py-2 text-slate-400 hover:text-[var(--text-color)] text-xs text-center cursor-pointer"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
