'use client';

import { useState, useEffect } from 'react';
import { Play, Award, Clock, Star } from 'lucide-react';
import { db, fallbackFaculty } from '@/services/db';

export default function Faculty() {
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [facultyList, setFacultyList] = useState<any[]>(fallbackFaculty);

  useEffect(() => {
    const loadFaculty = async () => {
      try {
        const fac = await db.getFaculty();
        if (fac && fac.length > 0) {
          setFacultyList(fac);
        }
      } catch (err) {
        console.error('Failed loading faculty:', err);
      }
    };
    loadFaculty();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      {/* Header */}
      <div className="space-y-4 max-w-2xl">
        <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Our Board</span>
        <h1 className="text-4xl font-heading font-extrabold text-brand-primary tracking-tight">
          Meet Our Experts
        </h1>
        <p className="text-slate-500 text-sm">
          Learn from highly qualified educators and retired officers who specialize in BPSC & UPSC syllabus depth.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {facultyList.map((member) => (
          <div key={member.id} className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row gap-6 hover:shadow-lg transition-all duration-300">
            {/* Avatar & Experience */}
            <div className="flex flex-col items-center shrink-0">
              <div className="w-24 h-28 rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 relative">
                <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
              </div>
              <div className="mt-4 flex items-center gap-1 text-amber-500">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
              </div>
              <span className="text-[10px] text-slate-400 font-bold uppercase mt-1">Exp: {member.experience}</span>
            </div>

            {/* Content info */}
            <div className="space-y-4 flex-grow">
              <div className="space-y-1">
                <h3 className="font-heading font-extrabold text-lg text-slate-900 leading-tight">
                  {member.name}
                </h3>
                <p className="text-[11px] text-blue-600 font-bold uppercase tracking-wider">
                  {member.role}
                </p>
              </div>
              
              <p className="text-xs text-slate-500 leading-relaxed">
                {member.bio}
              </p>

              {/* Demo lectures widget */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Demo Lectures</span>
                <div className="space-y-2">
                  {(member.demoLectures || []).map((lec: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100 hover:bg-white hover:border-blue-100 transition-colors">
                      <span className="text-xs font-semibold text-slate-700 truncate pr-4">{lec.title}</span>
                      <button
                        onClick={() => setPlayingVideo(lec.url)}
                        className="w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shrink-0 shadow-sm transition-transform hover:scale-105"
                      >
                        <Play className="w-3 h-3 fill-current ml-0.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Video Modal */}
      {playingVideo && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl overflow-hidden max-w-2xl w-full p-4 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h4 className="font-heading font-extrabold text-sm text-slate-950">Demo Lecture Player</h4>
              <button onClick={() => setPlayingVideo(null)} className="text-slate-450 hover:text-slate-950 text-xs font-bold">
                Close
              </button>
            </div>
            <video controls className="w-full rounded-2xl aspect-video bg-black" src={playingVideo} autoPlay />
          </div>
        </div>
      )}
    </div>
  );
}
