'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, ArrowRight, HelpCircle, GraduationCap, MapPin, Send } from 'lucide-react';
import { db } from '@/services/db';

function ContactFormContent() {
  const searchParams = useSearchParams();
  const isEnrollMode = searchParams.get('enquiry') === 'enroll';

  // Form states
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [targetExam, setTargetExam] = useState('70th BPSC (Prelims + Mains)');
  const [classMode, setClassMode] = useState('Patna Offline Centre');
  const [district, setDistrict] = useState('Patna');
  const [prepStatus, setPrepStatus] = useState('Beginner (Fresh Prep)');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !mobile) return;

    // Concatenate extra fields into the targetExam string so it maps to leads database dynamically
    const encodedTarget = isEnrollMode
      ? `${targetExam} [Mode: ${classMode} | Dist: ${district} | Prep: ${prepStatus} | Msg: ${message || 'None'}]`
      : `General Query: ${message}`;

    await db.createLead(name, mobile, encodedTarget, email || undefined);
    setSuccess(true);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 font-body">
      {success ? (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 p-8 sm:p-12 rounded-3xl text-center space-y-4 shadow-sm">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto" />
          <h2 className="font-heading font-black text-2xl text-emerald-900 dark:text-emerald-400">
            {isEnrollMode ? 'Enrollment Registered!' : 'Message Received!'}
          </h2>
          <p className="text-sm text-emerald-700 dark:text-emerald-350 max-w-md mx-auto leading-relaxed">
            Thank you for registering. Our admissions counselor will review your syllabus profile details and coordinate with you on WhatsApp within 12 hours.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/[0.06] rounded-3xl shadow-sm overflow-hidden">
          {/* Header Card Accent matching premium Google Form styling */}
          <div className="h-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-amber-500" />
          
          <div className="p-8 sm:p-10 space-y-6">
            <div className="space-y-2 border-b border-slate-100 dark:border-white/[0.04] pb-6">
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                {isEnrollMode ? '' : 'Support Query'}
              </span>
              <h1 className="text-3xl font-heading font-black text-slate-900 dark:text-white leading-tight">
                {isEnrollMode ? 'BPSC Batch Enrollment Portal' : 'Contact Support Desk'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isEnrollMode 
                  ? 'Fill out your preparation profile parameters below. All data will connect directly to the Core Mentorship leads database.'
                  : 'Send us a query. Our admissions desk will respond to your email as soon as possible.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* SECTION 1: Personal Details */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5 border-b border-slate-50 dark:border-white/[0.02] pb-2">
                  <GraduationCap className="w-4 h-4 text-purple-500" />
                  <span>1. Candidate Profile</span>
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-350 uppercase tracking-wider">Candidate Full Name <span className="text-red-500">*</span></label>
                    <input
                      type="text" required placeholder="Enter full name" value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-350 uppercase tracking-wider">WhatsApp Phone Number <span className="text-red-500">*</span></label>
                    <input
                      type="tel" required pattern="[0-9]{10}" placeholder="Enter 10-digit mobile" value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      className="w-full px-4 py-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-350 uppercase tracking-wider">Email Address</label>
                  <input
                    type="email" placeholder="example@email.com" value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
              </div>

              {/* SECTION 2: BPSC Prep Details (Enroll Mode Only) */}
              {isEnrollMode && (
                <div className="space-y-4 pt-4 border-t border-slate-50 dark:border-white/[0.02]">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5 border-b border-slate-50 dark:border-white/[0.02] pb-2">
                    <MapPin className="w-4 h-4 text-amber-500" />
                    <span>2. Preparation Parameters</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-350 uppercase tracking-wider">Target BPSC Exam Batch</label>
                      <select
                        value={targetExam} onChange={(e) => setTargetExam(e.target.value)}
                        className="w-full px-4 py-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                      >
                        <option>70th BPSC (Prelims + Mains)</option>
                        <option>71st BPSC Foundation Program</option>
                        <option>72nd BPSC Long Term Mentorship</option>
                        <option>Mains Answer Writing & Evaluation</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-350 uppercase tracking-wider">Preferred Class Mode</label>
                      <select
                        value={classMode} onChange={(e) => setClassMode(e.target.value)}
                        className="w-full px-4 py-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                      >
                        <option>Patna Offline Centre</option>
                        <option>Live Online Lectures</option>
                        <option>Hybrid Dual Access</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-350 uppercase tracking-wider">Home City / Bihar District</label>
                      <input
                        type="text" placeholder="e.g. Patna, Gaya, Muzaffarpur" value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full px-4 py-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-350 uppercase tracking-wider">Current Preparation Level</label>
                      <select
                        value={prepStatus} onChange={(e) => setPrepStatus(e.target.value)}
                        className="w-full px-4 py-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                      >
                        <option>Beginner (Fresh Prep)</option>
                        <option>Intermediate (Given Prelims)</option>
                        <option>Advanced (Mains Candidate)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Message Details */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-350 uppercase tracking-wider">
                  {isEnrollMode ? 'Briefly describe your mentorship requirements' : 'Describe your query'}
                </label>
                <textarea
                  rows={4} value={message} onChange={(e) => setMessage(e.target.value)}
                  placeholder={isEnrollMode ? 'Tell us about your strategy needs or query details...' : 'Describe what help you require...'}
                  className="w-full px-4 py-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-750 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{isEnrollMode ? 'Submit Enrollment Request' : 'Send Message'}</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ContactPage() {
  return (
    <Suspense fallback={
      <div className="text-center py-20">
        <p className="text-slate-500 text-sm font-semibold">Loading enrollment details...</p>
      </div>
    }>
      <ContactFormContent />
    </Suspense>
  );
}
