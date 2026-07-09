'use client';

import { use, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  BookOpen, Play, CheckCircle, ChevronLeft, ChevronDown, ChevronRight,
  Lock, Video, Clock, Sparkles, Trophy, MessageSquare, HelpCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface Lesson {
  id: string;
  title: string;
  type: string;
  videoUrl: string | null;
  duration: string;
  isFree: boolean;
  isLocked: boolean;
}

interface Section {
  id: string;
  title: string;
  orderIndex: number;
  lessons: Lesson[];
}

interface CourseDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  thumbnailUrl?: string;
}

interface CourseDetailPageProps {
  params: Promise<{ id: string }>;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export default function StudentCourseDetailPage({ params }: CourseDetailPageProps) {
  const resolvedParams = use(params);
  const courseId = resolvedParams.id;
  const { accessToken, isLoading: authLoading } = useAuth();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Video player state
  const [playingLesson, setPlayingLesson] = useState<Lesson | null>(null);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (accessToken) {
          headers['Authorization'] = `Bearer ${accessToken}`;
        }

        const res = await fetch(`${BACKEND_URL}/api/lms/courses/${courseId}/sections`, {
          headers,
          credentials: 'include',
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          setError(data.error || 'Failed to load course content.');
          setLoading(false);
          return;
        }

        setCourse(data.data.course);
        setSections(data.data.sections || []);
        setIsEnrolled(data.data.isEnrolled || false);

        // Auto-open first section
        if (data.data.sections?.length > 0) {
          setOpenSections(new Set([data.data.sections[0].id]));
        }
      } catch (err) {
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [courseId, accessToken, authLoading]);

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  const totalLessons = sections.reduce((sum, s) => sum + s.lessons.length, 0);
  const freeLessons = sections.reduce((sum, s) => sum + s.lessons.filter(l => l.isFree).length, 0);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-blue-500/30 border-t-blue-400 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Loading course content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <BookOpen className="w-7 h-7 text-red-400" />
        </div>
        <h2 className="text-lg font-bold text-white">Could Not Load Course</h2>
        <p className="text-slate-400 text-sm text-center max-w-xs">{error}</p>
        <Link href="/student/dashboard" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-500 transition-all">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6">
        <h2 className="text-lg font-bold">Course Not Found</h2>
        <p className="text-slate-500 text-xs mt-1 mb-4">This course does not exist or has been removed.</p>
        <Link href="/student/dashboard" className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">
          Back to Portal
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-body">
      {/* Video Player Modal */}
      {playingLesson && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-slate-900 rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div>
                <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Now Playing</p>
                <h3 className="text-white font-bold text-sm mt-0.5">{playingLesson.title}</h3>
              </div>
              <button
                onClick={() => setPlayingLesson(null)}
                className="px-3 py-1.5 bg-white/[0.08] hover:bg-white/[0.15] text-slate-300 text-xs font-bold rounded-xl transition-all"
              >
                Close ✕
              </button>
            </div>
            {/* Video */}
            <div className="aspect-video bg-black">
              {playingLesson.videoUrl ? (
                <video
                  ref={videoRef}
                  src={playingLesson.videoUrl}
                  controls
                  autoPlay
                  className="w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600">
                  <p className="text-sm">No video URL configured for this lesson.</p>
                </div>
              )}
            </div>
            {/* Footer */}
            <div className="px-5 py-3 border-t border-white/[0.06] flex items-center gap-2 text-xs text-slate-500">
              <Clock className="w-3.5 h-3.5" />
              <span>{playingLesson.duration || 'Duration not set'}</span>
              <span className="ml-auto px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20">
                {playingLesson.type?.toUpperCase() || 'VIDEO'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur-xl border-b border-white/[0.06] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/student/dashboard"
            className="p-2 bg-white/[0.04] border border-white/[0.06] rounded-xl hover:bg-white/[0.08] transition-all"
          >
            <ChevronLeft className="w-4 h-4 text-slate-400" />
          </Link>
          <div>
            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Student Portal</span>
            <h1 className="text-white font-bold text-sm mt-0.5 truncate max-w-xs">{course.title}</h1>
          </div>
        </div>
        {isEnrolled && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
            <CheckCircle className="w-3.5 h-3.5" />
            Enrolled
          </div>
        )}
      </header>

      <div className="p-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Main: Course Curriculum ── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Course Info Banner */}
          <div className="bg-gradient-to-br from-blue-600/20 via-indigo-600/10 to-slate-900/50 border border-blue-500/20 rounded-3xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-900/30">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">{course.category}</span>
                <h2 className="text-white font-bold text-base mt-0.5">{course.title}</h2>
                {course.description && (
                  <p className="text-slate-400 text-xs leading-relaxed mt-1 line-clamp-2">{course.description}</p>
                )}
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                    <Video className="w-3.5 h-3.5" />
                    <span>{totalLessons} lessons</span>
                  </div>
                  {course.duration && (
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{course.duration}</span>
                    </div>
                  )}
                  {!isEnrolled && freeLessons > 0 && (
                    <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{freeLessons} free preview</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sections and Lessons */}
          <div className="bg-slate-900 border border-white/10 rounded-3xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <h3 className="text-white font-bold text-sm">Course Curriculum</h3>
              <p className="text-slate-500 text-xs mt-0.5">{sections.length} chapters · {totalLessons} lessons</p>
            </div>

            {sections.length === 0 ? (
              <div className="p-10 text-center">
                <BookOpen className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500 text-sm font-semibold">No content yet</p>
                <p className="text-slate-600 text-xs mt-1">The instructor hasn't added any lessons to this course.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {sections.map((section, sIdx) => {
                  const isOpen = openSections.has(section.id);
                  return (
                    <div key={section.id}>
                      {/* Section header */}
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.03] transition-all text-left"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                            {sIdx + 1}
                          </span>
                          <div>
                            <p className="text-white font-semibold text-sm">{section.title}</p>
                            <p className="text-slate-500 text-[10px] mt-0.5">{section.lessons.length} lessons</p>
                          </div>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Lessons */}
                      {isOpen && (
                        <div className="px-5 pb-3 space-y-1.5">
                          {section.lessons.length === 0 ? (
                            <p className="text-slate-600 text-xs italic py-2 pl-9">No lessons in this chapter yet.</p>
                          ) : (
                            section.lessons.map((lesson, lIdx) => (
                              <div
                                key={lesson.id}
                                className={`flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all ${
                                  lesson.isLocked
                                    ? 'bg-slate-950/50 border-white/[0.04] opacity-60'
                                    : 'bg-white/[0.03] border-white/[0.06] hover:border-blue-500/20 hover:bg-blue-500/5 cursor-pointer'
                                }`}
                                onClick={() => !lesson.isLocked && lesson.videoUrl && setPlayingLesson(lesson)}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                    lesson.isLocked
                                      ? 'bg-slate-800 text-slate-600'
                                      : 'bg-blue-500/10 text-blue-400'
                                  }`}>
                                    {lesson.isLocked ? (
                                      <Lock className="w-3.5 h-3.5" />
                                    ) : (
                                      <Play className="w-3.5 h-3.5 fill-current" />
                                    )}
                                  </div>
                                  <div>
                                    <p className={`text-xs font-semibold ${lesson.isLocked ? 'text-slate-600' : 'text-slate-200'}`}>
                                      {lesson.title}
                                    </p>
                                    <p className="text-[10px] text-slate-600 mt-0.5">{lesson.duration || '—'}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {lesson.isFree && !lesson.isLocked && (
                                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase tracking-wide">
                                      Free
                                    </span>
                                  )}
                                  {!lesson.isLocked && lesson.videoUrl && (
                                    <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-4">
          {/* Progress Card */}
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-5 space-y-4">
            <h3 className="text-white font-bold text-sm">Your Progress</h3>
            <div>
              <div className="flex justify-between text-xs text-slate-400 font-semibold mb-2">
                <span>Completed</span>
                <span>0%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full w-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" />
              </div>
            </div>
            <div className="pt-2 grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center">
                <p className="text-blue-400 font-bold text-lg">{totalLessons}</p>
                <p className="text-slate-500 text-[10px] mt-0.5">Total Lessons</p>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <p className="text-emerald-400 font-bold text-lg">0</p>
                <p className="text-slate-500 text-[10px] mt-0.5">Completed</p>
              </div>
            </div>
          </div>

          {/* Enrollment status */}
          {!isEnrolled && (
            <div className="bg-slate-900 border border-amber-500/20 rounded-3xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                <h3 className="text-white font-bold text-sm">Enroll to Unlock</h3>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                You need to enroll in this course to access all lessons. Free preview lessons are still available.
              </p>
              <Link
                href={`/courses/${courseId}`}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                View Enrollment Options
              </Link>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-5 space-y-3">
            <h3 className="text-white font-bold text-sm">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                href={`/student/course/${courseId}/quiz/q-bpsc-foundation-1`}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:border-blue-500/30 hover:bg-blue-500/5 transition-all text-slate-300 hover:text-white text-xs font-semibold"
              >
                <HelpCircle className="w-4 h-4 text-blue-400" />
                Practice Quiz
              </Link>
              <Link
                href="/student/dashboard"
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:border-violet-500/30 hover:bg-violet-500/5 transition-all text-slate-300 hover:text-white text-xs font-semibold"
              >
                <MessageSquare className="w-4 h-4 text-violet-400" />
                Mentor Connect
              </Link>
              <Link
                href="/student/dashboard"
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:border-amber-500/30 hover:bg-amber-500/5 transition-all text-slate-300 hover:text-white text-xs font-semibold"
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                View Performance
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
