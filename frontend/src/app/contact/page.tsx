'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, ArrowRight, HelpCircle, GraduationCap, MapPin, Send, Mail, Phone, Clock, MessageCircle, SendIcon } from 'lucide-react';
import { db } from '@/services/db';

import Image from "next/image";

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

    // Concatenate fields for CMS Lead targets
    const encodedTarget = isEnrollMode
      ? `${targetExam} [Mode: ${classMode} | Dist: ${district} | Prep: ${prepStatus} | Msg: ${message || 'None'}]`
      : `General Query: ${message}`;

    await db.createLead(name, mobile, encodedTarget, email || undefined);
    setSuccess(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">

      {/* 1. Header banner */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl uppercase tracking-widest inline-block">
          Admissions Helpdesk
        </span>
        <h1 className="text-4xl font-heading font-black text-[var(--text-color)] tracking-tight">
          Connect With Final Attempt IAS
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
          Have questions about the BPSC micro-schedule, answer writing mentorship batches, or offline library? Let's trace out your study strategy.
        </p>
      </div>

      {/* 2. Contact layout grids */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Left Side: Detail Cards */}
        <div className="lg:col-span-5 space-y-6">

          {/* Main info panel */}
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 sm:p-8 shadow-3xs space-y-6">
            <h3 className="font-heading font-extrabold text-lg text-[var(--text-color)]">Boring Road Crossing Centre</h3>

            <div className="space-y-4 text-xs font-semibold text-slate-655 dark:text-slate-350">
              <div className="flex gap-3.5 items-start">
                <MapPin className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[var(--text-color)]">Corporate Address</p>
                  <p className="mt-0.5 text-slate-500">2nd Floor, Opposite Verma Centre, Boring Road Crossing, Patna, Bihar - 800001</p>
                </div>
              </div>

              <div className="flex gap-3.5 items-start">
                <Phone className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[var(--text-color)]">Admission Helpline</p>
                  <p className="mt-0.5 text-slate-500">+91 97099 92093 (Counseling & Doubts)</p>
                </div>
              </div>

              <div className="flex gap-3.5 items-start">
                <Mail className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[var(--text-color)]">Support Email</p>
                  <p className="mt-0.5 text-slate-500">enquiry@finalattemptias.com</p>
                </div>
              </div>

              <div className="flex gap-3.5 items-start">
                <Clock className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[var(--text-color)]">Working Hours</p>
                  <p className="mt-0.5 text-slate-500">Monday - Sunday: 9:00 AM - 7:00 PM</p>
                </div>
              </div>
            </div>
          </div>

          {/* Social Links Cards */}
          <div className="grid grid-cols-2 gap-4">
            {/* <a
              href="https://wa.me/919709992093"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 p-4 bg-[#22C55E] hover:bg-green-600 text-white font-bold rounded-2xl shadow-3xs text-xs transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Chat</span>
            </a> */}

            <a
              href="https://wa.me/919709992093"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 p-4 bg-white hover:bg-green-500 text-green-500 font-bold rounded-2xl shadow-3xs text-xs transition-colors"
            >
              <Image
                src="/whatsapp.svg"
                alt="WhatsApp"
                width={20}
                height={20}
              />
              <span>WhatsApp Chat</span>
            </a>
            <a
              href="https://t.me/finalattemptias"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 p-4 bg-[#0088cc] hover:bg-[#0077b3] text-white font-bold rounded-2xl shadow-3xs text-xs transition-colors"
            >
              <SendIcon className="w-4 h-4" />
              <span>Telegram Channel</span>
            </a>
          </div>

          {/* Interactive Google Map iframe wrapper */}
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl overflow-hidden shadow-3xs h-64 relative">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d28385.5475886151!2d85.1218147!3d25.6043364!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39f9e28542b71ddf%3A0x549b953bf6840f72!2sFinal%20Attempt%20IAS%20Institute!5e0!3m2!1sen!2sin!4v1753153883700!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Final Attempt Patna Boring Road Centre Map Location"
            />
          </div>

        </div>

        {/* Right Side: Enquiry Form */}
        <div className="lg:col-span-7 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 sm:p-8 shadow-3xs">
          {success ? (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900 text-emerald-800 dark:text-emerald-350 p-8 sm:p-12 rounded-2xl text-center space-y-3">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
              <h4 className="font-bold text-base">Enquiry Submitted!</h4>
              <p className="text-xs text-emerald-600 dark:text-emerald-450">Our admissions counselor will coordinate with you on WhatsApp within 12 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h3 className="font-heading font-extrabold text-lg text-[var(--text-color)]">Candidate Counseling Form</h3>
                <p className="text-[10px] text-slate-400 mt-1">Submit your details to receive BPSC study plans and syllabus mapping sheets.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-350 uppercase tracking-wider">Candidate Name <span className="text-red-500">*</span></label>
                  <input
                    type="text" required placeholder="Enter full name" value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-350 uppercase tracking-wider">Mobile Number <span className="text-red-500">*</span></label>
                  <input
                    type="tel" required pattern="[0-9]{10}" placeholder="Enter 10-digit mobile" value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full px-4 py-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-350 uppercase tracking-wider">Email Address</label>
                <input
                  type="email" placeholder="example@email.com" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-350 uppercase tracking-wider">Target BPSC Exam</label>
                  <select
                    value={targetExam} onChange={(e) => setTargetExam(e.target.value)}
                    className="w-full px-4 py-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  >
                    <option>70th BPSC (Prelims + Mains)</option>
                    <option>71st BPSC Foundation Program</option>
                    <option>72nd BPSC Long Term Mentorship</option>
                    <option>Mains Answer Writing & Evaluation</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-350 uppercase tracking-wider">Home City / District</label>
                  <input
                    type="text" placeholder="e.g. Patna, Gaya" value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-4 py-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-350 uppercase tracking-wider">Requirements / Message</label>
                <textarea
                  rows={4} value={message} onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your doubt or batch query details..."
                  className="w-full px-4 py-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Submit Inquiry Details</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>

      </div>

    </div>
  );
}

export default function ContactPage() {
  return (
    <Suspense fallback={
      <div className="text-center py-20">
        <p className="text-slate-500 text-sm font-semibold">Loading details...</p>
      </div>
    }>
      <ContactFormContent />
    </Suspense>
  );
}
