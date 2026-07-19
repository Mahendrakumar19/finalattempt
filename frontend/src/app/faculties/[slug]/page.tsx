'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Play, Award, Star, ArrowRight, Home, ChevronRight, Video, ShieldCheck } from 'lucide-react';
import { db, fallbackFaculty } from '@/services/db';

function getSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function FacultyProfilePage() {
  const { slug } = useParams();
  const router = useRouter();
  const [member, setMember] = useState<any | null>(null);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const list = await db.getFaculty();
        const found = (list || fallbackFaculty).find((m: any) => getSlug(m.name) === slug);
        if (found) {
          setMember(found);
        } else {
          router.replace('/faculties');
        }
      } catch (err) {
        console.error('Failed loading profile:', err);
      } finally {
        setLoading(false);
      }
    };
    if (slug) loadProfile();
  }, [slug, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-color)] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!member) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 bg-[var(--bg-color)] min-h-screen">
      
      {/* Breadcrumbs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-semibold">
          <Link href="/" className="hover:text-amber-500 flex items-center gap-1">
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-350" />
          <Link href="/faculties" className="hover:text-amber-500">
            <span>Faculty Board</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-350" />
          <span className="text-slate-800 dark:text-slate-200">{member.name}</span>
        </div>
        <Link 
          href="/faculties" 
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-655 hover:text-amber-500 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Faculty</span>
        </Link>
      </div>

      {/* Profile Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Profile Card */}
        <div className="lg:col-span-4 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 shadow-3xs space-y-6 text-center">
          <div className="w-36 h-44 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-[var(--card-border)] relative mx-auto shadow-sm">
            <img src={member.avatar || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=300'} alt={member.name} className="w-full h-full object-cover" />
          </div>

          <div className="space-y-1">
            <h2 className="font-heading font-black text-xl text-[var(--text-color)]">{member.name}</h2>
            <p className="text-[11px] text-amber-600 font-bold uppercase tracking-wider">{member.role}</p>
          </div>

          <div className="flex items-center justify-center gap-1 text-amber-500">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-current" />
            ))}
          </div>

          <div className="border-t border-[var(--card-border)] pt-4 grid grid-cols-2 gap-4 text-left">
            <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-2xl space-y-1">
              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Experience</span>
              <span className="text-xs font-black text-[var(--text-color)]">{member.experience}</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-2xl space-y-1">
              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Specialty</span>
              <span className="text-xs font-black text-[var(--text-color)] truncate block">{member.role.split('&')[0]}</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-center gap-1.5 text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/20 py-2 rounded-2xl border border-emerald-100/60 dark:border-emerald-900/40">
            <ShieldCheck className="w-4 h-4" />
            <span>Verified BPSC Mentor Profile</span>
          </div>
        </div>

        {/* Biography & Demo Lectures */}
        <div className="lg:col-span-8 space-y-8">
          
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-8 shadow-3xs space-y-4">
            <h3 className="font-heading font-extrabold text-base text-[var(--text-color)] border-b border-[var(--card-border)] pb-3">Biography & Academic Background</h3>
            <p className="text-xs sm:text-sm text-slate-655 dark:text-slate-400 leading-relaxed">
              {member.bio}
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Serving as a cornerstone of the Final Attempt mentorship ecosystem, {member.name} focuses heavily on schema mapping, structural writing corrections, and weak area analytics updates to help aspirants target optimum outputs.
            </p>
          </div>

          {member.demoLectures && member.demoLectures.length > 0 && (
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-8 shadow-3xs space-y-4">
              <h3 className="font-heading font-extrabold text-base text-[var(--text-color)] border-b border-[var(--card-border)] pb-3">Demo Lectures & Explanations</h3>
              
              <div className="grid grid-cols-1 gap-3">
                {member.demoLectures.map((lec: any, idx: number) => (
                  <div 
                    key={idx} 
                    className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-[var(--card-border)] flex items-center justify-between hover:bg-white dark:hover:bg-slate-800 hover:border-amber-500/20 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                        <Video className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block text-xs font-extrabold text-[var(--text-color)] leading-tight">{lec.title}</span>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">{lec.duration || 'Demo Session'}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setPlayingVideo(lec.url)}
                      className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center shadow-sm cursor-pointer hover:bg-amber-500 hover:text-slate-950 transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/5 border border-amber-100 dark:border-amber-900/30 p-8 rounded-3xl flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h4 className="font-heading font-black text-sm text-[var(--text-color)]">Interested in {member.name}'s classes?</h4>
              <p className="text-xs text-slate-500 dark:text-slate-455 mt-1">Book a free strategy call or enroll in the upcoming foundation program today.</p>
            </div>
            <Link
              href="/contact?enquiry=enroll"
              className="px-5 py-3 bg-brand-primary hover:bg-slate-850 text-white font-bold text-xs uppercase rounded-xl flex items-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer"
            >
              <span>Enroll Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </div>

      {playingVideo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={() => setPlayingVideo(null)}>
          <div className="bg-[var(--card-bg)] rounded-3xl overflow-hidden max-w-3xl w-full p-4 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-2">
              <h4 className="font-heading font-extrabold text-sm text-[var(--text-color)]">Lecture Preview: Video Player</h4>
              <button 
                onClick={() => setPlayingVideo(null)} 
                className="text-slate-400 hover:text-slate-950 px-3 py-1 text-xs font-black rounded-lg hover:bg-slate-100"
              >
                Close
              </button>
            </div>
            <video controls className="w-full rounded-2xl aspect-video bg-black shadow-inner" src={playingVideo} autoPlay />
          </div>
        </div>
      )}

    </div>
  );
}
