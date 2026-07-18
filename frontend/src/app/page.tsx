'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Users,
  Award,
  BookOpen,
  ChevronRight,
  CheckCircle,
  Star,
  FileText,
  Play,
  ArrowRight,
  MessageCircle,
  Calendar,
  Compass,
  TrendingUp,
  ShieldCheck,
  Target,
  Trophy,
  Activity,
  Layers,
  GraduationCap
} from 'lucide-react';
import { db, fallbackResults, fallbackCurrentAffairs } from '@/services/db';
import TestimonialCarousel from '@/components/TestimonialCarousel';

export default function Home() {
  // Real-time dynamic states
  const [heroSettings, setHeroSettings] = useState({
    heroTitle: 'Dream BPSC. Achieve Success.',
    heroSubtitle: 'The right guidance today, leads to a better tomorrow.',
    tagline: 'Your Final Step Toward Success..........',
    heroImageUrl: ''
  });
  const [liveCourses, setLiveCourses] = useState<any[]>([]);
  const [formSuccess, setFormSuccess] = useState(false);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [targetExam, setTargetExam] = useState('BPSC Foundation Batch');

  useEffect(() => {
    const loadLiveData = async () => {
      try {
        const s = await db.getSettings();
        if (s) setHeroSettings(s);

        const c = await db.getCourses();
        if (c && c.length > 0) {
          setLiveCourses(c);
        } else {
          // Fallback UI mock courses matching the wireframe
          setLiveCourses([
            { id: '1', title: 'BPSC Foundation Course', description: 'Complete foundation course for Prelims & Mains.', fee: 4999900, duration: '12 Months' },
            { id: '2', title: 'BPSC Prelims Test Series', description: 'Topic-wise & Full Length Test Series.', fee: 499900, duration: '3 Months' },
            { id: '3', title: 'BPSC Mains Answer Writing', description: 'Answer writing practice with expert evaluation.', fee: 999900, duration: '4 Months' },
            { id: '4', title: 'Interview Guidance Program', description: 'Personality development & mock interviews.', fee: 0, duration: '1 Month' }
          ]);
        }
      } catch (e) {
        console.error('Failed loading live Home data, using mock fallbacks.', e);
      }
    };
    loadLiveData();
  }, []);

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !mobile) return;
    await db.createLead(name, mobile, targetExam);
    setFormSuccess(true);
    setTimeout(() => {
      setName('');
      setMobile('');
      setFormSuccess(false);
    }, 4000);
  };

  // Static announcements matching wireframe scheme
  const announcements = [
    { date: '08 JUN', text: 'BPSC 70th Prelims Exam Date Announced', isNew: true },
    { date: '04 JUN', text: 'New Batch for BPSC Foundation Starts from 15th June 2025', isNew: false },
    { date: '30 MAY', text: 'Free Demo Classes Available for New Students', isNew: false }
  ];

  return (
    <div className="w-full flex flex-col min-h-screen bg-[var(--bg-color)]">
      
      {/* 1. HERO SECTION WITH EXACT WIREFRAME BACKDROP EFFECTS */}
      <section className="relative pt-12 pb-20 overflow-hidden bg-[var(--bg-color)]">
        
        {/* Soft Radial Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] rounded-full opacity-[0.06] blur-[130px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, #6366f1 0%, #3b82f6 50%, transparent 100%)' }} />

        {/* Wireframe Left Margin Dotted Matrix Pattern */}
        <div className="absolute left-4 top-12 w-12 h-48 opacity-[0.3] pointer-events-none select-none hidden xl:block">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <pattern id="dotPattern" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.2" fill="#1E3A8A" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#dotPattern)" />
          </svg>
        </div>

        {/* Full Wide Blended Background Image (matching mockup exactly) */}
        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-95 pointer-events-none">
          <div className="relative w-full h-full">
            {/* Vidhan Sabha Image stretched in the center and blended */}
            <div className="absolute inset-0 z-0">
              <img 
                src={heroSettings.heroImageUrl || "https://upload.wikimedia.org/wikipedia/commons/f/f6/Front_view_of_bihar_vidhan_sabha.jpg"}
                alt="Bihar Vidhan Sabha Patna Secretariat" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover opacity-90"
              />
            </div>
            {/* Radial mask that fades the image into the background left text area */}
            <div className="absolute inset-y-0 left-0 w-[50%] bg-gradient-to-r from-[var(--bg-color)] via-[var(--bg-color)]/95 to-transparent z-10" />
            {/* Radial mask that fades the image into the background right list area */}
            <div className="absolute inset-y-0 right-0 w-[50%] bg-gradient-to-l from-[var(--bg-color)] via-[var(--bg-color)]/90 to-transparent z-10" />
            {/* Soft top and bottom vignetting to blend with Header and Stats bar */}
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[var(--bg-color)] to-transparent z-10" />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[var(--bg-color)] to-transparent z-10" />
          </div>
        </div>

        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[450px]">
            
            {/* Left Content */}
            <div className="lg:col-span-4 space-y-6 pt-6">
              {heroSettings.tagline && (
                <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
                  {heroSettings.tagline}
                </span>
              )}
              <h1 className="text-4xl sm:text-5xl lg:text-6.5xl font-heading font-black tracking-tight leading-tight" style={{ color: 'var(--text-color)' }}>
                {heroSettings.heroTitle}
              </h1>
              
              <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 font-semibold leading-relaxed max-w-sm">
                {heroSettings.heroSubtitle}
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  href="/courses"
                  className="btn-primary flex items-center gap-2"
                >
                  <span>Explore Courses</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                
                <a
                  href="#book-session"
                  className="btn-outline flex items-center gap-2"
                >
                  <Play className="w-4 h-4 text-[#1E3A8A] fill-[#1E3A8A] dark:text-amber-500 dark:fill-amber-500" />
                  <span>Watch Intro Video</span>
                </a>
              </div>
            </div>

            {/* Empty Center Column to let the background show behind */}
            <div className="lg:col-span-5 hidden lg:block" />

            {/* Right Side Bullet Features List */}
            <div className="lg:col-span-3 space-y-4 pt-6">
              {[
                { title: 'Expert Faculty', desc: 'Learn from experienced and dedicated educators.', icon: GraduationCap, color: 'bg-purple-100 text-purple-600' },
                { title: 'Comprehensive Courses', desc: 'Well-structured courses for Prelims, Mains & Interview.', icon: BookOpen, color: 'bg-amber-100 text-amber-600' },
                { title: 'Test Series & Analysis', desc: 'Regular tests with detailed performance analysis.', icon: Activity, color: 'bg-emerald-100 text-emerald-600' },
                { title: 'Personalized Mentorship', desc: 'Individual guidance for your overall development.', icon: Users, color: 'bg-pink-100 text-pink-600' }
              ].map((item, idx) => (
                <div key={idx} className="flex gap-4 p-4 bg-white rounded-2xl border border-slate-100/80 shadow-md hover:shadow-lg transition-all hover:scale-[1.01] relative z-20">
                  <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center shrink-0`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 leading-snug">{item.title}</h4>
                    <p className="text-xs text-slate-500 leading-normal mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* 2. STATS BANNER */}
      <section className="max-w-8xl mx-auto w-full px-4 sm:px-6 lg:px-8 -mt-6 mb-16 relative z-20">
        <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 divide-x divide-slate-100">
            {[
              { val: '5000+', lbl: 'Students Enrolled', icon: Users, color: 'text-purple-500' },
              { val: '250+', lbl: 'Study Materials', icon: BookOpen, color: 'text-amber-500' },
              { val: '1000+', lbl: 'Mock Tests', icon: FileText, color: 'text-emerald-500' },
              { val: '100+', lbl: 'Selections', icon: Trophy, color: 'text-pink-500' }
            ].map((stat, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row items-center sm:items-start gap-4 px-4 text-center sm:text-left first:pl-0">
                <div className={`w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center ${stat.color} shrink-0`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 tracking-tight">{stat.val}</div>
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">{stat.lbl}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. TWO-COLUMN POPULAR COURSES vs ANNOUNCEMENTS */}
      <section className="max-w-8xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Popular Courses */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex justify-between items-end border-b border-slate-150 pb-4">
              <div>
                <span className="text-xs font-bold text-[#1E3A8A] uppercase tracking-widest">Our Popular Courses</span>
                <h2 className="text-2xl font-heading font-extrabold text-slate-900 mt-1">Explore Top Classes</h2>
              </div>
              <Link 
                href="/courses" 
                className="text-xs font-bold text-[#1E3A8A] hover:text-amber-600 transition-colors flex items-center gap-1"
              >
                <span>View All Courses</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {liveCourses.slice(0, 4).map((course) => (
                <div key={course.id} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md hover:border-slate-200 transition-all flex flex-col justify-between min-h-[190px]">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center mb-4">
                      {course.id === '1' && <GraduationCap className="w-5 h-5" />}
                      {course.id === '2' && <Layers className="w-5 h-5" />}
                      {course.id === '3' && <FileText className="w-5 h-5" />}
                      {course.id !== '1' && course.id !== '2' && course.id !== '3' && <BookOpen className="w-5 h-5" />}
                    </div>
                    <h3 className="font-heading font-extrabold text-base text-slate-900 mb-1">{course.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed mb-4">{course.description}</p>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">{course.duration}</span>
                    <Link href={`/courses/${course.id}`} className="text-xs font-bold text-[#1E3A8A] hover:underline flex items-center gap-1">
                      <span>View Details</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Announcements & Why Choose Us */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Announcements Card */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
              <div className="flex justify-between items-center border-b border-slate-50 pb-4 mb-4">
                <h3 className="font-heading font-extrabold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>Latest Announcements</span>
                </h3>
              </div>
              <div className="space-y-4">
                {announcements.map((ann, idx) => (
                  <div key={idx} className="flex gap-4 items-start p-2.5 rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer">
                    <div className="bg-blue-50 text-[#1E3A8A] p-2 rounded-xl text-center shrink-0 w-12 flex flex-col justify-center">
                      <span className="text-[10px] font-extrabold leading-none">{ann.date.split(' ')[0]}</span>
                      <span className="text-[8px] font-bold text-slate-400 mt-1">{ann.date.split(' ')[1]}</span>
                    </div>
                    <div className="flex-grow">
                      <p className="text-xs font-bold text-slate-700 leading-snug group-hover:text-[#1E3A8A] transition-colors">{ann.text}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 self-center" />
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 py-2.5 bg-[#5B21B6] hover:bg-purple-800 text-white font-bold rounded-xl text-xs transition-colors">
                View All Announcements
              </button>
            </div>

            {/* Why Choose Us checklist */}
            <div className="bg-amber-50/40 rounded-3xl border border-amber-100/60 p-6 shadow-sm">
              <h3 className="font-heading font-extrabold text-sm text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>Why Choose Final Attempt?</span>
              </h3>
              <ul className="space-y-3">
                {[
                  'BPSC Focused Curriculum',
                  'Experienced & Dedicated Faculty',
                  'Regular Tests & Performance Analysis',
                  'Updated Content as per Latest Pattern',
                  'Doubt Support & Mentorship'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-xs font-semibold text-slate-700">
                    <CheckCircle className="w-4 h-4 text-[#F59E0B] shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

        </div>
      </section>

      {/* 3.5 PREMIUM TESTIMONIALS SECTION */}
      <section className="py-20 bg-gradient-to-b from-[var(--bg-color)] to-slate-50 border-t border-slate-100 overflow-hidden">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <span className="text-xs font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl uppercase tracking-widest">
              Success Stories
            </span>
            <h3 className="text-3xl font-heading font-black text-slate-900 leading-tight">
              Aspirants to Officers: Our Hall of Fame
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Hear from our selected toppers about how our personalized micro-scheduling and answer evaluation changed their preparation journey.
            </p>
          </div>

          <TestimonialCarousel />
        </div>
      </section>

      {/* 4. STRATEGY LEAD CAPTURE FORM */}
      <section id="book-session" className="py-16 bg-[var(--bg-color)] border-t border-slate-100 dark:border-white/[0.06]">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="text-center space-y-4 mb-8">
              <h3 className="text-2xl font-heading font-extrabold text-slate-900">
                Get Free BPSC Strategy Session
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Book your FREE one-on-one strategy session with our selected civil servants and core mentors today.
              </p>
            </div>

            {formSuccess ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-6 rounded-2xl text-center space-y-2">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
                <h5 className="font-bold text-sm">Session Registration Successful!</h5>
                <p className="text-xs text-emerald-600">Our senior counselor will contact you within 24 hours to schedule your slot.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitLead} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
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
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mobile Number</label>
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
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Target Exam</label>
                  <select
                    value={targetExam}
                    onChange={(e) => setTargetExam(e.target.value)}
                    className="w-full px-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option>BPSC Foundation Batch</option>
                    <option>BPSC Target Batch</option>
                    <option>Prelims Test Series</option>
                    <option>Mains Answer Writing</option>
                  </select>
                </div>
                <div className="sm:col-span-3 pt-4 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-slate-100 mt-4">
                  <p className="text-[10px] text-slate-400 font-medium">
                    By submitting, you agree to receive exam updates and counsel calls.
                  </p>
                  <div className="flex gap-4 w-full sm:w-auto">
                    <button
                      type="submit"
                      className="flex-grow sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-[#F59E0B] hover:bg-amber-600 text-white font-bold rounded-xl text-xs shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                    >
                      <span>Book My Session</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <a
                      href="https://wa.me/919709992093"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-[#22C55E] hover:bg-green-600 text-white font-bold rounded-xl text-xs transition-all shadow-md hover:-translate-y-0.5"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span className="hidden sm:inline">WhatsApp</span>
                    </a>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 5. BOTTOM BAR KEY HIGHLIGHTS */}
      <footer className="w-full bg-[#0F172A] text-white py-6 border-t border-slate-800">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { text: 'Daily Current Affairs', sub: 'Stay updated every day', icon: Calendar },
              { text: 'Expert Strategy', sub: 'Smart approach to BPSC', icon: Compass },
              { text: 'Performance Tracking', sub: 'Monitor your prep progress', icon: TrendingUp },
              { text: 'Accessible Anytime', sub: 'Learn anytime, anywhere', icon: ShieldCheck }
            ].map((hl, idx) => (
              <div key={idx} className="flex items-center gap-4 border-r border-slate-800 last:border-none px-4">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-amber-400 shrink-0">
                  <hl.icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white tracking-wide">{hl.text}</h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{hl.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </footer>

    </div>
  );
}
