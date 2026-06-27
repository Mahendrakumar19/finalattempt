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
  Bookmark,
  TrendingUp,
  HelpCircle,
  Play,
  ArrowRight,
  Send,
  MessageCircle,
  Download,
  Smartphone
} from 'lucide-react';
import { db, fallbackResults, fallbackCurrentAffairs } from '@/services/db';

export default function Home() {
  const [activeCaTab, setActiveCaTab] = useState<'Daily' | 'Weekly' | 'Bihar Special' | 'Editorial' | 'PYQs'>('Daily');

  // Real-time dynamic states
  const [heroSettings, setHeroSettings] = useState({
    heroTitle: '72nd BPSC Preparation Starts Here',
    heroSubtitle: 'Personalized mentorship, smart study tools, and Bihar-focused content designed to help you clear BPSC with confidence.',
    tagline: 'One Mentor. One Strategy. One Final Attempt.'
  });
  const [liveResults, setLiveResults] = useState<any[]>(fallbackResults);
  const [liveCurrentAffairs, setLiveCurrentAffairs] = useState<any[]>(fallbackCurrentAffairs);

  // Lead form states
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [targetExam, setTargetExam] = useState('BPSC Foundation Batch');
  const [formSuccess, setFormSuccess] = useState(false);

  // Modal demo states
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  useEffect(() => {
    const loadLiveData = async () => {
      try {
        const s = await db.getSettings();
        if (s) setHeroSettings(s);

        const r = await db.getResults();
        if (r && r.length > 0) setLiveResults(r);

        const ca = await db.getCurrentAffairs();
        if (ca && ca.length > 0) setLiveCurrentAffairs(ca);
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

  // Filter current affairs based on selected tab
  const getFilteredCa = () => {
    if (activeCaTab === 'Daily') {
      return liveCurrentAffairs.filter(item => item.category === 'National' || item.category === 'Economy');
    }
    if (activeCaTab === 'Weekly') {
      return liveCurrentAffairs.filter(item => item.category === 'International');
    }
    if (activeCaTab === 'Bihar Special') {
      return liveCurrentAffairs.filter(item => item.category === 'Bihar Special');
    }
    if (activeCaTab === 'Editorial') {
      return liveCurrentAffairs.filter(item => item.category === 'Environment');
    }
    return liveCurrentAffairs.slice(0, 3); // Fallback
  };

  return (
    <div className="w-full flex flex-col min-h-screen">
      {/* 1. HERO SECTION WITH SPOTLIGHT & TOPPERS */}
      <section className="relative overflow-hidden bg-white pt-10 pb-16 border-b border-slate-100">
        {/* Decorative Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Hero Left Content */}
            <div className="lg:col-span-7 space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>One Mentor. One Strategy. One Final Attempt.</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-extrabold text-brand-primary tracking-tight leading-tight">
                72nd BPSC Preparation <br />
                <span className="text-brand-secondary">Starts Here</span>
              </h1>

              <p className="text-lg text-slate-600 font-medium leading-relaxed max-w-xl">
                Personalized mentorship, smart study tools, and Bihar-focused content designed to help you clear civil services exams with confidence.
              </p>

              {/* Core Feature Tags */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                {[
                  { name: 'Personalized Mentorship', icon: Users },
                  { name: 'Daily Current Affairs', icon: BookOpen },
                  { name: 'AI Performance Tracking', icon: TrendingUp },
                  { name: 'Bihar Special Notes', icon: FileText },
                  { name: 'Interview Guidance', icon: Award }
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all text-center">
                    <item.icon className="w-5 h-5 text-blue-600 mb-2" />
                    <span className="text-[10px] sm:text-xs font-bold text-slate-700 leading-tight">{item.name}</span>
                  </div>
                ))}
              </div>

              {/* Actions & Rating */}
              <div className="space-y-4 pt-2">
                <div className="flex flex-wrap gap-4">
                  <Link
                    href="/courses"
                    className="px-8 py-3.5 bg-brand-primary hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-md hover:scale-[1.02]"
                  >
                    Explore Courses
                  </Link>
                  <a
                    href="#book-session"
                    className="px-8 py-3.5 bg-[#F59E0B] hover:bg-amber-600 text-white font-bold rounded-xl transition-all shadow-md hover:scale-[1.02]"
                  >
                    Book Free Strategy Session
                  </a>
                </div>

                <div className="flex items-center gap-4 pt-2">
                  {/* Mock stacked user avatars */}
                  <div className="flex -space-x-3">
                    {['1', '2', '3', '4'].map((idx) => (
                      <div key={idx} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold overflow-hidden shadow-xs">
                        <img src={`https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=100&index=${idx}`} alt="student" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-slate-600 font-semibold">
                    <span className="text-slate-900 font-extrabold">5000+</span> Aspirants Already Joined
                  </div>
                  <span className="text-slate-300">|</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-slate-900">4.9/5</span>
                    <div className="flex text-amber-500">
                      {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase ml-1">Google Reviews</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Hero Right: Interactive Bihar Map & Toppers Showcase */}
            <div className="lg:col-span-5 relative flex items-center justify-center">
              <div className="relative w-full max-w-md h-[450px] bg-slate-50/50 rounded-3xl border border-slate-100 p-6 flex flex-col items-center justify-center overflow-hidden">
                {/* Simulated Map Visual */}
                <div className="absolute inset-0 bg-contain bg-center opacity-10 bg-no-repeat pointer-events-none" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=600&q=80')` }} />

                {/* Premium Topper Cards overlays */}
                {/* Topper 1 (Ankita Kumari) */}
                <div className="absolute top-6 left-4 bg-white p-3 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-3 animate-float">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 shrink-0">
                    <img src={liveResults[0]?.photo} alt="topper" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h5 className="text-xs font-extrabold text-slate-900 leading-tight">{liveResults[0]?.name}</h5>
                    <p className="text-[10px] text-blue-600 font-bold">{liveResults[0]?.rank} &bull; {liveResults[0]?.service}</p>
                  </div>
                </div>

                {/* Topper 2 (Rohit Verma) */}
                <div className="absolute top-28 right-4 bg-white p-3 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-3 animate-float [animation-delay:2s]">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 shrink-0">
                    <img src={liveResults[1]?.photo} alt="topper" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h5 className="text-xs font-extrabold text-slate-900 leading-tight">{liveResults[1]?.name}</h5>
                    <p className="text-[10px] text-blue-600 font-bold">{liveResults[1]?.rank} &bull; {liveResults[1]?.service}</p>
                  </div>
                </div>

                {/* Topper 3 (Shreya Sinha) */}
                <div className="absolute bottom-6 left-1/4 bg-white p-3 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-3 animate-float [animation-delay:4s]">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 shrink-0">
                    <img src={liveResults[2]?.photo} alt="topper" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h5 className="text-xs font-extrabold text-slate-900 leading-tight">{liveResults[2]?.name}</h5>
                    <p className="text-[10px] text-blue-600 font-bold">{liveResults[2]?.rank} &bull; {liveResults[2]?.service}</p>
                  </div>
                </div>

                {/* Selections Circle Badge */}
                <div className="w-40 h-40 rounded-full bg-brand-primary text-white flex flex-col items-center justify-center p-6 border-4 border-slate-200 shadow-xl text-center z-10">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Selections</span>
                  <span className="text-3xl font-extrabold text-amber-400">120+</span>
                  <span className="text-[10px] font-semibold text-slate-300">in Last 3 Years</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. STATS BANNER */}
      <section className="bg-brand-primary text-white py-8 border-b border-slate-800">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '5000+', label: 'Students Mentored', icon: Users },
              { value: '300+', label: 'Interview Qualified', icon: BookOpen },
              { value: '120+', label: 'Final Selections', icon: Award },
              { value: '15+', label: 'Toppers from Bihar', icon: Sparkles }
            ].map((stat, idx) => (
              <div key={idx} className="flex items-center gap-4 px-4 border-r border-slate-800 last:border-none">
                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-amber-400">
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight">{stat.value}</div>
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. COURSES SECTION */}
      <section className="py-20 bg-slate-50 border-b border-slate-100">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-12">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Our Programs</span>
              <h2 className="text-3xl font-heading font-extrabold text-brand-primary mt-2">
                Courses Designed for BPSC Success
              </h2>
            </div>
            <Link
              href="/courses"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
            >
              <span>View All Courses</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Course 1 */}
            <div className="bg-white rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
              <div className="p-6 flex-grow">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="font-heading font-extrabold text-lg text-brand-primary mb-2">BPSC Foundation Batch</h3>
                <p className="text-xs text-slate-500 mb-6">Complete coverage of Prelims & Mains syllabus with Bihar-specific modules.</p>

                <div className="space-y-3.5 pt-4 border-t border-slate-100">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-400">Duration</span>
                    <span className="text-slate-900">12 Months</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-400">Fee</span>
                    <span className="text-blue-600 text-sm">₹24,999</span>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-center">
                <Link href="/courses/bpsc-foundation" className="text-xs font-bold text-blue-600 hover:underline">
                  View Details
                </Link>
              </div>
            </div>

            {/* Course 2 */}
            <div className="bg-white rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
              <div className="p-6 flex-grow">
                <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center mb-4">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <h3 className="font-heading font-extrabold text-lg text-brand-primary mb-2">BPSC Target Batch</h3>
                <p className="text-xs text-slate-500 mb-6">Comprehensive high-speed batch for serious aspirants preparing for BPSC.</p>

                <div className="space-y-3.5 pt-4 border-t border-slate-100">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-400">Duration</span>
                    <span className="text-slate-900">18 Months</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-400">Fee</span>
                    <span className="text-blue-600 text-sm">₹39,999</span>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-center">
                <Link href="/courses/bpsc-target" className="text-xs font-bold text-blue-600 hover:underline">
                  View Details
                </Link>
              </div>
            </div>

            {/* Course 3 */}
            <div className="bg-white rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
              <div className="p-6 flex-grow">
                <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="font-heading font-extrabold text-lg text-brand-primary mb-2">Prelims Test Series 2025</h3>
                <p className="text-xs text-slate-500 mb-6">Sectional + Full Length Mock Tests with performance diagnostic analytics.</p>

                <div className="space-y-3.5 pt-4 border-t border-slate-100">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-400">Tests</span>
                    <span className="text-slate-900">40+ Tests</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-400">Fee</span>
                    <span className="text-blue-600 text-sm">₹4,999</span>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-center">
                <Link href="/courses/prelims-test-series" className="text-xs font-bold text-blue-600 hover:underline">
                  View Details
                </Link>
              </div>
            </div>

            {/* Course 4 */}
            <div className="bg-white rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
              <div className="p-6 flex-grow">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                  <Bookmark className="w-5 h-5" />
                </div>
                <h3 className="font-heading font-extrabold text-lg text-brand-primary mb-2">Mains Answer Writing</h3>
                <p className="text-xs text-slate-500 mb-6">Daily answer writing practice with evaluation and detailed micro-feedback.</p>

                <div className="space-y-3.5 pt-4 border-t border-slate-100">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-400">Duration</span>
                    <span className="text-slate-900">3 Months</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-400">Fee</span>
                    <span className="text-blue-600 text-sm">₹6,999</span>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-center">
                <Link href="/courses/mains-answer-writing" className="text-xs font-bold text-blue-600 hover:underline">
                  View Details
                </Link>
              </div>
            </div>

            {/* Course 5 */}
            <div className="bg-white rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
              <div className="p-6 flex-grow">
                <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="font-heading font-extrabold text-lg text-brand-primary mb-2">Interview Guidance</h3>
                <p className="text-xs text-slate-500 mb-6">DAF analysis, simulated panel mock interviews with senior retired IAS officers.</p>

                <div className="space-y-3.5 pt-4 border-t border-slate-100">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-400">Mocks</span>
                    <span className="text-slate-900">5+ Mock Sessions</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-400">Fee</span>
                    <span className="text-blue-600 text-sm">₹8,999</span>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-center">
                <Link href="/courses/interview-guidance" className="text-xs font-bold text-blue-600 hover:underline">
                  View Details
                </Link>
              </div>
            </div>

            {/* FUTURE USE: UPSC Mentorship Program card. Commented out as the platform is currently not focusing on UPSC.
            <div className="bg-white rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
              <div className="p-6 flex-grow">
                <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="font-heading font-extrabold text-lg text-brand-primary mb-2">UPSC Mentorship Program</h3>
                <p className="text-xs text-slate-500 mb-6">Personalized scheduling and 1-on-1 strategy audit by selected toppers.</p>
                
                <div className="space-y-3.5 pt-4 border-t border-slate-100">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-400">Duration</span>
                    <span className="text-slate-900">12 Months</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-400">Fee</span>
                    <span className="text-blue-600 text-sm">₹29,999</span>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-center">
                <Link href="/courses/upsc-mentorship" className="text-xs font-bold text-blue-600 hover:underline">
                  View Details
                </Link>
              </div>
            </div>
            */}
          </div>
        </div>
      </section>

      {/* 4. BIHAR ADVANTAGE - WHY CHOOSE US */}
      <section className="py-20 bg-white border-b border-slate-100">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Why Final Attempt</span>
            <h2 className="text-3xl sm:text-4xl font-heading font-extrabold text-brand-primary mt-2">
              Why Bihar Aspirants Choose Us?
            </h2>
            <p className="text-slate-500 text-sm mt-4">
              {/* FUTURE USE: Add UPSC back into description when focus expands */}
              We understand the unique challenges of BPSC preparation, providing tailored support.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: 'Bihar Special Notes', desc: 'District-wise and topic-wise structured history and economy notes targeting BPSC Mains directly.', icon: FileText },
              { title: 'BPSC Focused Preparation', desc: 'Syllabus alignment mapping, regular mock tests based on updated patterns.', icon: Award },
              { title: 'Bilingual Content', desc: 'High quality study material, notes, and videos available in both Hindi & English mediums.', icon: BookOpen },
              { title: '1-on-1 Mentorship', desc: 'Direct strategy tracking, doubts clarification and mental coaching from selected officers.', icon: Users },
              { title: 'AI Performance Tracking', desc: 'Detailed mock analytical scorecards showing performance breakdowns and focus subjects.', icon: TrendingUp },
              { title: 'Interview Guidance', desc: 'Extensive preparation sessions with retired state administrative members.', icon: Sparkles }
            ].map((adv, idx) => (
              <div key={idx} className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 hover:border-blue-100 hover:bg-white transition-all">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                  <adv.icon className="w-5 h-5" />
                </div>
                <h4 className="font-heading font-bold text-base text-brand-primary mb-2">{adv.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{adv.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. TOPPERS HALL OF FAME */}
      <section className="py-20 bg-slate-50 border-b border-slate-100">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Our Toppers</span>
              <h2 className="text-3xl font-heading font-extrabold text-brand-primary mt-2">
                Proud Moments of Our Aspirants
              </h2>
            </div>
            <Link href="/results" className="text-sm font-bold text-blue-600 hover:underline">
              View All Results
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {(liveResults || []).slice(0, 5).map((topper: any) => (
              <div key={topper.id} className="bg-white rounded-2xl border border-slate-100 p-5 text-center flex flex-col items-center hover:shadow-lg transition-shadow">
                <div className="w-20 h-20 rounded-full overflow-hidden mb-4 border-2 border-slate-100">
                  <img src={topper.photo} alt={topper.name} className="w-full h-full object-cover" />
                </div>
                <div className="text-amber-500 flex justify-center mb-1">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
                </div>
                <h4 className="font-heading font-extrabold text-sm text-slate-900 leading-tight">{topper.name}</h4>
                <p className="text-[11px] text-blue-600 font-extrabold mt-0.5">{topper.rank}</p>
                <span className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">{topper.service}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. CURRENT AFFAIRS magazine tab selector */}
      <section className="py-20 bg-white border-b border-slate-100">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Current Affairs</span>
            <h2 className="text-3xl font-heading font-extrabold text-brand-primary mt-2">
              Stay Updated, Stay Ahead
            </h2>
          </div>

          {/* CA Category Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-10 border-b border-slate-100 pb-4">
            {['Daily', 'Weekly', 'Bihar Special', 'Editorial'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveCaTab(tab as any)}
                className={`px-5 py-2 text-xs font-bold rounded-xl transition-all ${activeCaTab === tab
                    ? 'bg-brand-primary text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-50 border border-slate-100'
                  }`}
              >
                {tab} CA
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {getFilteredCa().map((item) => (
              <div key={item.id} className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 flex flex-col justify-between hover:bg-white hover:border-blue-100 transition-all">
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                    <span className="text-blue-600">{item.category}</span>
                    <span>{item.publishDate}</span>
                  </div>
                  <h4 className="font-heading font-extrabold text-sm text-brand-primary leading-snug">{item.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">{item.summary}</p>
                </div>
                <Link href={`/current-affairs?article=${item.id}`} className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline pt-4 mt-4 border-t border-slate-100">
                  <span>Read More</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. APP DOWNLOAD BLOCK */}
      <section className="py-16 bg-slate-50 border-b border-slate-100">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#0F172A] rounded-3xl overflow-hidden p-8 sm:p-12 lg:p-16 relative text-white border border-slate-800">
            {/* Ambient Background Light */}
            <div className="absolute right-0 top-0 w-80 h-80 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-6">
                <h3 className="text-2xl sm:text-3xl font-heading font-extrabold">
                  Final Attempt Learning App
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed max-w-lg">
                  Your all-in-one preparation companion. Access daily current affairs, practice mock test series, review performance analytics, and connect with your mentor on the go.
                </p>

                <div className="grid grid-cols-2 gap-4 max-w-sm pt-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-800 text-blue-500 flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-300">Daily Current Affairs</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-800 text-blue-500 flex items-center justify-center shrink-0">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-300">Performance Analytics</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-800 text-blue-500 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-300">Online Test Series</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-800 text-blue-500 flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-300">Mentor Connect</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 pt-4">
                  <a href="#" className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 transition-colors rounded-xl border border-slate-700">
                    <Smartphone className="w-4 h-4 text-blue-500" />
                    <div className="text-left">
                      <p className="text-[10px] text-slate-500 uppercase leading-none font-bold">Get it on</p>
                      <p className="text-xs font-bold leading-tight">Google Play</p>
                    </div>
                  </a>
                  <a href="#" className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 transition-colors rounded-xl border border-slate-700">
                    <Smartphone className="w-4 h-4 text-blue-500" />
                    <div className="text-left">
                      <p className="text-[10px] text-slate-500 uppercase leading-none font-bold">Download on the</p>
                      <p className="text-xs font-bold leading-tight">App Store</p>
                    </div>
                  </a>
                </div>
              </div>

              {/* App mock screen visual */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="w-56 h-[380px] bg-slate-850 rounded-[40px] border-[12px] border-slate-800 shadow-2xl relative overflow-hidden flex flex-col justify-between p-4 text-slate-300 select-none">
                  {/* Top notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-800 rounded-b-xl" />

                  <div className="pt-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold">Hello Ritik</span>
                      <div className="w-4 h-4 rounded-full bg-blue-600" />
                    </div>
                    <div className="p-3 bg-slate-800/80 rounded-xl space-y-2 border border-slate-700/50">
                      <p className="text-[9px] text-slate-400 font-bold uppercase leading-none">Next class</p>
                      <p className="text-[10px] font-bold text-white">Bihar Special: Kunwar Singh Revolt</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-[9px] font-semibold text-slate-400">
                      <span>Quiz Completion</span>
                      <span>85%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: '85%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. LEAD CAPTURE FOOTER FORM */}
      <section id="book-session" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-slate-50 rounded-3xl p-8 sm:p-12 border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="text-center space-y-4 mb-8">
              <h3 className="text-2xl font-heading font-extrabold text-brand-primary">
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
                    className="w-full px-4 py-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                    className="w-full px-4 py-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Target Exam</label>
                  <select
                    value={targetExam}
                    onChange={(e) => setTargetExam(e.target.value)}
                    className="w-full px-4 py-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option>BPSC Foundation Batch</option>
                    <option>BPSC Target Batch</option>
                    <option>Prelims Test Series</option>
                    <option>Mains Answer Writing</option>
                    {/* FUTURE USE: UPSC Mentorship Option. Commented out as the platform is currently not focusing on UPSC.
                    <option>UPSC Mentorship</option>
                    */}
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
                      href="https://wa.me/919113131819"
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
    </div>
  );
}
