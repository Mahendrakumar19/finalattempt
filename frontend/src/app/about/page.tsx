'use client';

import { useState } from 'react';
import { Award, Users, BookOpen, Clock, Sparkles, Mail, Phone, MapPin, CheckCircle, MessageCircle } from 'lucide-react';
import { db } from '@/services/db';

export default function AboutAndContact() {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [targetExam, setTargetExam] = useState('BPSC Foundation Batch');
  const [inquiryText, setInquiryText] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !mobile) return;
    await db.createLead(name, mobile, `${targetExam}: ${inquiryText}`);
    setFormSuccess(true);
    setTimeout(() => {
      setName('');
      setMobile('');
      setInquiryText('');
      setFormSuccess(false);
    }, 4000);
  };

  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
      {/* 1. Page Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl uppercase tracking-widest">
          Who We Are
        </span>
        <h1 className="text-4xl font-heading font-black text-[var(--text-color)] tracking-tight">
          One Mentor. One Strategy. <br />
          <span className="text-brand-secondary">One Final Attempt.</span>
        </h1>
        <p className="text-slate-500 text-sm leading-relaxed">
          Final Attempt is a premium learning ecosystem built by senior policy makers, educators, and BPSC toppers to give you the strategic edge needed to clear civil services.
        </p>
      </div>

      {/* 2. Mission & Vision */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="bg-white dark:bg-slate-900/40 p-8 rounded-3xl border border-slate-100 dark:border-white/[0.06] space-y-4 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="font-heading font-extrabold text-xl text-slate-900 dark:text-white">Our Mission</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            To democratize high-quality civil services preparation by making premium mentorship, structured curriculum, and Bihar-focused expertise accessible, affordable, and outcome-oriented.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900/40 p-8 rounded-3xl border border-slate-100 dark:border-white/[0.06] space-y-4 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="font-heading font-extrabold text-xl text-slate-900 dark:text-white">Our Vision</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            To be recognized as Bihar's most trusted and technologically advanced EdTech gateway for public service leadership, creating a network of officers driving administrative excellence.
          </p>
        </div>
      </div>

      {/* 3. Meet the Founder */}
      <div id="founder" className="bg-slate-50 dark:bg-white/[0.02] rounded-3xl p-8 sm:p-12 border border-slate-100 dark:border-white/[0.06]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-4 flex justify-center">
            <div className="w-56 h-72 rounded-2xl overflow-hidden bg-slate-200 border-4 border-white dark:border-slate-800 shadow-lg relative">
              <img
                src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400"
                alt="Founder"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="lg:col-span-8 space-y-6">
            <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">Meet the Founder</span>
            <h3 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 dark:text-white">
              Mentor-in-Chief's Message
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic">
              "UPSC and BPSC exams do not just test your knowledge—they test your temperament, strategy, and consistency. After mentoring thousands of civil service aspirants, we realized that the primary reason students fail is the lack of personalized micro-scheduling. Final Attempt was founded to change this."
            </p>
            <div>
              <h5 className="font-heading font-extrabold text-sm text-slate-900 dark:text-white">Siddharth Kumar Sinha</h5>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Founder & Chief Mentor, Final Attempt</p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Combined Admissions Helpdesk & Contact Form */}
      <div className="space-y-12 border-t border-slate-100 dark:border-white/[0.06] pt-16">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">Connect With Us</span>
          <h3 className="text-3xl font-heading font-black text-slate-900 dark:text-white">
            Have a Query? Send an Inquiry
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Visit our Boring Road centre or fill out the form below to connect directly with our admissions counselor.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-5xl mx-auto">
          {/* Contact Details Cards */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-slate-900/40 p-6 rounded-3xl border border-slate-100 dark:border-white/[0.06] shadow-xs space-y-6">
              <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">Patna Admissions Centre</h3>
              
              <div className="space-y-4 text-xs font-medium text-slate-600 dark:text-slate-350">
                <div className="flex gap-3.5 items-start">
                  <MapPin className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">Boring Road Centre</p>
                    <p className="mt-0.5 text-slate-500">Boring Road Crossing, opposite Verma Centre, Patna, Bihar - 860001</p>
                  </div>
                </div>
                <div className="flex gap-3.5 items-start">
                  <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">Admissions Helpdesk</p>
                    <p className="mt-0.5 text-blue-600 dark:text-blue-400 font-extrabold">+91 97099 92093</p>
                  </div>
                </div>
                <div className="flex gap-3.5 items-start">
                  <Mail className="w-5 h-5 text-slate-450 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">Email Address</p>
                    <p className="mt-0.5 text-slate-500">info@finalattemptias.com</p>
                  </div>
                </div>
              </div>
            </div>

            <a
              href="https://wa.me/919709992093"
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center gap-2.5 p-4 bg-[#22C55E] hover:bg-green-600 text-white font-bold rounded-2xl shadow-md transition-colors text-sm"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Chat directly on WhatsApp</span>
            </a>
          </div>

          {/* Inquiry form panel */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900/40 p-6 sm:p-8 rounded-3xl border border-slate-100 dark:border-white/[0.06] shadow-xs">
            {formSuccess ? (
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 p-8 rounded-2xl text-center space-y-3">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
                <h4 className="font-bold text-base">Inquiry Submitted!</h4>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">Our counselor will get in touch with you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="font-heading font-extrabold text-lg text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/[0.06] pb-3">
                  Counseling Registration
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mobile Number</label>
                    <input
                      type="tel"
                      required
                      pattern="[0-9]{10}"
                      placeholder="Enter 10-digit mobile"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      className="w-full px-4 py-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Course Program</label>
                  <select
                    value={targetExam}
                    onChange={(e) => setTargetExam(e.target.value)}
                    className="w-full px-4 py-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  >
                    <option>BPSC Foundation Batch</option>
                    <option>BPSC Target Batch</option>
                    <option>Prelims Test Series</option>
                    <option>Mains Answer Writing</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Your Message / Query</label>
                  <textarea
                    placeholder="Enter details about your inquiry..."
                    rows={4}
                    value={inquiryText}
                    onChange={(e) => setInquiryText(e.target.value)}
                    className="w-full px-4 py-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow-md transition-all hover:scale-[1.01] cursor-pointer"
                >
                  Submit Inquiry Details
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
