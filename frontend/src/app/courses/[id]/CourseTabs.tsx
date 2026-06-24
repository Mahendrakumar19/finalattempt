'use client';

import { useState } from 'react';
import { Play, Check, ChevronDown, Award } from 'lucide-react';
import { Course } from '@/services/db';

interface FacultyMember {
  id: string;
  name: string;
  role: string;
  experience: string;
  avatar: string;
  bio: string;
  demoLectures: { title: string; duration: string; url: string }[];
}

interface CourseTabsProps {
  course: Course;
  faculty: FacultyMember[];
}

export default function CourseTabs({ course, faculty }: CourseTabsProps) {
  const [activeTab, setActiveTab] = useState<'Overview' | 'Syllabus' | 'Faculty' | 'Demo' | 'FAQ'>('Overview');
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const tabs: ('Overview' | 'Syllabus' | 'Faculty' | 'Demo' | 'FAQ')[] = [
    'Overview',
    'Syllabus',
    'Faculty',
    'Demo',
    'FAQ'
  ];

  return (
    <div className="space-y-8">
      {/* Tabs navigation */}
      <div className="flex border-b border-slate-100 overflow-x-auto gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3.5 text-xs font-bold whitespace-nowrap transition-all border-b-2 -mb-[2px] ${
              activeTab === tab
                ? 'border-brand-secondary text-brand-secondary font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content panel */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs min-h-[300px]">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'Overview' && (
          <div className="space-y-6">
            <h3 className="font-heading font-extrabold text-lg text-brand-primary">Program Overview</h3>
            <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
              This course is crafted to align with the core requirements of BPSC and UPSC administrative services. You will receive customized notes, continuous performance tracking, and direct access to selected officials.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl pt-2">
              {course.features.map((feature, idx) => (
                <div key={idx} className="flex gap-3 items-start">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                  <span className="text-xs text-slate-600 font-semibold">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: SYLLABUS */}
        {activeTab === 'Syllabus' && (
          <div className="space-y-6">
            <h3 className="font-heading font-extrabold text-lg text-brand-primary">Syllabus Breakdown</h3>
            <div className="space-y-4 max-w-3xl">
              {course.syllabus.map((item, idx) => (
                <div key={idx} className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 items-start">
                  <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                    {idx + 1}
                  </span>
                  <div className="space-y-1">
                    <h5 className="font-bold text-xs text-slate-900">{item}</h5>
                    <p className="text-[10px] text-slate-400">Sectional mock tests and summary notes provided</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: FACULTY */}
        {activeTab === 'Faculty' && (
          <div className="space-y-6">
            <h3 className="font-heading font-extrabold text-lg text-brand-primary">Faculty & Mentorship Board</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
              {faculty.map((member) => (
                <div key={member.id} className="flex gap-4 items-start p-4 rounded-xl border border-slate-100">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                    <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="space-y-2">
                    <div>
                      <h4 className="font-heading font-extrabold text-sm text-slate-900">{member.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{member.role} &bull; {member.experience} exp</p>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{member.bio}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: DEMO CLASSES */}
        {activeTab === 'Demo' && (
          <div className="space-y-6">
            <h3 className="font-heading font-extrabold text-lg text-brand-primary">Free Demo Lectures</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
              {faculty.flatMap((f) => f.demoLectures.map((lec) => ({ ...lec, teacher: f.name }))).map((lec, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center hover:bg-white hover:border-blue-100 transition-all">
                  <div className="space-y-1">
                    <h5 className="font-bold text-xs text-slate-900">{lec.title}</h5>
                    <p className="text-[10px] text-slate-400">By {lec.teacher} &bull; {lec.duration}</p>
                  </div>
                  <button
                    onClick={() => setPlayingVideo(lec.url)}
                    className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md transition-transform hover:scale-105"
                  >
                    <Play className="w-4.5 h-4.5 fill-current ml-0.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Video Player Modal */}
            {playingVideo && (
              <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl overflow-hidden max-w-2xl w-full p-4 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <h4 className="font-heading font-extrabold text-sm text-slate-950">Demo Lecture Player</h4>
                    <button onClick={() => setPlayingVideo(null)} className="text-slate-400 hover:text-slate-950 text-xs font-bold">
                      Close
                    </button>
                  </div>
                  <video controls className="w-full rounded-2xl aspect-video bg-black" src={playingVideo} autoPlay />
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: FAQ */}
        {activeTab === 'FAQ' && (
          <div className="space-y-6">
            <h3 className="font-heading font-extrabold text-lg text-brand-primary">Frequently Asked Questions</h3>
            <div className="space-y-3.5 max-w-3xl">
              {course.faq.map((item, idx) => (
                <div key={idx} className="border border-slate-100 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full flex justify-between items-center p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors text-left"
                  >
                    <span className="font-bold text-xs text-brand-primary">{item.q}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
                  </button>
                  {openFaq === idx && (
                    <div className="p-4 border-t border-slate-100 bg-white">
                      <p className="text-xs text-slate-500 leading-relaxed">{item.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
