'use client';

import { useState } from 'react';
import { Mail, Phone, MapPin, CheckCircle, MessageCircle } from 'lucide-react';
import { db } from '@/services/db';

export default function Contact() {
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      {/* Header */}
      <div className="space-y-4 max-w-2xl">
        <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Connect with Us</span>
        <h1 className="text-4xl font-heading font-extrabold text-brand-primary tracking-tight">
          Get in Touch
        </h1>
        <p className="text-slate-500 text-sm">
          Have questions about fees, syllabus structure, or study notes? Message our counselor directly or visit our Boring Road center.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Contact Info Cards */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
            <h3 className="font-heading font-bold text-base text-brand-primary">Our Patna Centres</h3>
            
            <div className="space-y-4 text-xs font-medium text-slate-650">
              <div className="flex gap-3.5 items-start">
                <MapPin className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900">Head Office Centre</p>
                  <p className="mt-0.5">Boring Road Crossing, opposite Verma Centre, Patna, Bihar - 860001</p>
                </div>
              </div>
              <div className="flex gap-3.5 items-start">
                <Phone className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900">Admissions Helpdesk</p>
                  <p className="mt-0.5 text-blue-600 font-extrabold">+91 91131 31819</p>
                </div>
              </div>
              <div className="flex gap-3.5 items-start">
                <Mail className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900">Email Address</p>
                  <p className="mt-0.5">info@finalattemptias.com</p>
                </div>
              </div>
            </div>
          </div>

          <a
            href="https://wa.me/919113131819"
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-center gap-2.5 p-4 bg-[#22C55E] hover:bg-green-600 text-white font-bold rounded-2xl shadow-md transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            <span>Chat directly on WhatsApp</span>
          </a>
        </div>

        {/* Form panel */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs">
          {formSuccess ? (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-8 rounded-2xl text-center space-y-3">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
              <h4 className="font-bold text-base">Inquiry Submitted Successfully!</h4>
              <p className="text-xs text-emerald-600">Our course advisors will get in touch with you shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="font-heading font-extrabold text-lg text-brand-primary border-b border-slate-100 pb-3">
                Send an Inquiry
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Mobile Number</label>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    placeholder="Enter mobile number"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full px-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Target Course Program</label>
                <select
                  value={targetExam}
                  onChange={(e) => setTargetExam(e.target.value)}
                  className="w-full px-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option>BPSC Foundation Batch</option>
                  <option>BPSC Target Batch</option>
                  <option>Prelims Test Series</option>
                  <option>Mains Answer Writing</option>
                  <option>UPSC Mentorship</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Your Message / Query</label>
                <textarea
                  placeholder="Enter details about your inquiry..."
                  rows={4}
                  value={inquiryText}
                  onChange={(e) => setInquiryText(e.target.value)}
                  className="w-full px-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-brand-primary hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                Submit Inquiry Details
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
