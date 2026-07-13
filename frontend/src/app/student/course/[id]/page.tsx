'use client';

import { use, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  BookOpen, Play, CheckCircle, ChevronLeft, ChevronDown, ChevronRight,
  Lock, Video, Clock, Sparkles, Trophy, MessageSquare, HelpCircle, FileText
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

  // Tab state
  const [activeTab, setActiveTab] = useState<'curriculum' | 'quizzes' | 'assignments'>('curriculum');
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);

  // Video player state
  const [playingLesson, setPlayingLesson] = useState<Lesson | null>(null);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const videoRef = useRef<HTMLVideoElement>(null);

  const getYoutubeEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}?autoplay=1&rel=0`;
    }
    return null;
  };

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

        // 1. Fetch sections
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

        // 2. Fetch Quizzes for enrolled student
        const quizRes = await fetch(`${BACKEND_URL}/api/lms/courses/${courseId}/quizzes`, { headers });
        const quizData = await quizRes.json();
        if (quizData.success) {
          setQuizzes(quizData.data || []);
        }

        // 3. Fetch Assignments
        const assignRes = await fetch(`${BACKEND_URL}/api/lms/courses/${courseId}/assignments`, { headers });
        const assignData = await assignRes.json();
        if (assignData.success) {
          setAssignments(assignData.data || []);
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

  const handleLessonClick = (lesson: Lesson) => {
    if (lesson.isLocked) return;
    
    const isVideo = lesson.type !== 'pdf' && lesson.type !== 'resource';
    if (isVideo && lesson.videoUrl) {
      setPlayingLesson(lesson);
    } else if (lesson.videoUrl) {
      // PDF or resource link opens directly in new window
      window.open(lesson.videoUrl, '_blank');
    }
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-body text-[15px]">
      {/* Video Player Modal */}
      {playingLesson && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-slate-900 rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
              <div>
                <p className="text-xs text-blue-400 font-bold uppercase tracking-wider">Now Playing</p>
                <h3 className="text-white font-extrabold text-base mt-0.5">{playingLesson.title}</h3>
              </div>
              <button
                onClick={() => setPlayingLesson(null)}
                className="px-4 py-2 bg-white/[0.08] hover:bg-white/[0.15] text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Close ✕
              </button>
            </div>
            {/* Video */}
            <div className="aspect-video bg-black">
              {playingLesson.videoUrl ? (() => {
                const youtubeEmbed = getYoutubeEmbedUrl(playingLesson.videoUrl);
                if (youtubeEmbed) {
                  return (
                    <iframe
                      src={youtubeEmbed}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  );
                }
                return (
                  <video
                    ref={videoRef}
                    src={playingLesson.videoUrl}
                    controls
                    autoPlay
                    className="w-full h-full"
                  />
                );
              })() : (
                <div className="w-full h-full flex items-center justify-center text-slate-600">
                  <p className="text-sm">No video URL configured for this lesson.</p>
                </div>
              )}
            </div>
            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/[0.06] flex items-center gap-2 text-xs text-slate-500">
              <Clock className="w-3.5 h-3.5" />
              <span>{playingLesson.duration || 'Duration not set'}</span>
              <span className="ml-auto px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20 uppercase tracking-wider text-[10px]">
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
            className="p-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl hover:bg-white/[0.08] transition-all"
          >
            <ChevronLeft className="w-4.5 h-4.5 text-slate-400" />
          </Link>
          <div>
            <span className="text-xs text-blue-400 font-bold uppercase tracking-wider">Student Portal</span>
            <h1 className="text-white font-extrabold text-base mt-0.5 truncate max-w-xs sm:max-w-md">{course.title}</h1>
          </div>
        </div>
        {isEnrolled && (
          <div className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
            <CheckCircle className="w-3.5 h-3.5" />
            Enrolled
          </div>
        )}
      </header>

      <div className="p-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Main Panel ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Course Info Banner */}
          <div className="bg-gradient-to-br from-blue-600/20 via-indigo-600/10 to-slate-900/50 border border-blue-500/20 rounded-3xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-900/30">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs text-blue-400 font-bold uppercase tracking-wider">{course.category}</span>
                <h2 className="text-white font-extrabold text-lg sm:text-xl mt-0.5 leading-tight">{course.title}</h2>
                {course.description && (
                  <p className="text-slate-400 text-sm leading-relaxed mt-2">{course.description}</p>
                )}
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
                    <Video className="w-4 h-4" />
                    <span>{totalLessons} lessons</span>
                  </div>
                  {course.duration && (
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
                      <Clock className="w-4 h-4" />
                      <span>{course.duration}</span>
                    </div>
                  )}
                  {!isEnrolled && freeLessons > 0 && (
                    <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                      <Sparkles className="w-4 h-4 animate-pulse" />
                      <span>{freeLessons} free preview</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Student Tabs Switcher */}
          <div className="flex gap-1 p-1 bg-slate-900 border border-white/[0.08] rounded-2xl w-fit">
            {[
              { id: 'curriculum', label: 'Curriculum & Materials' },
              { id: 'quizzes', label: `Quizzes (${quizzes.length})` },
              { id: 'assignments', label: `Assignments (${assignments.length})` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeTab === tab.id 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Curriculum Tab ── */}
          {activeTab === 'curriculum' && (
            <div className="bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-xl">
              <div className="px-6 py-5 border-b border-white/[0.06]">
                <h3 className="text-white font-extrabold text-base">Course Curriculum</h3>
                <p className="text-slate-500 text-xs mt-1">{sections.length} chapters · {totalLessons} lectures & files</p>
              </div>

              {sections.length === 0 ? (
                <div className="p-12 text-center">
                  <BookOpen className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 font-bold">No curriculum published yet</p>
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
                          className="w-full flex items-center justify-between px-6 py-5 hover:bg-white/[0.02] transition-all text-left cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                              {sIdx + 1}
                            </span>
                            <div>
                              <p className="text-white font-bold text-sm sm:text-base">{section.title}</p>
                              <p className="text-slate-500 text-xs mt-0.5">{section.lessons.length} items</p>
                            </div>
                          </div>
                          <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Lessons */}
                        {isOpen && (
                          <div className="px-6 pb-4 space-y-2">
                            {section.lessons.length === 0 ? (
                              <p className="text-slate-600 text-xs italic py-2 pl-10">No items inside this chapter yet.</p>
                            ) : (
                              section.lessons.map((lesson) => {
                                const isVideo = lesson.type !== 'pdf' && lesson.type !== 'resource';
                                return (
                                  <div
                                    key={lesson.id}
                                    className={`flex items-center justify-between px-4 py-3 rounded-2xl border transition-all ${
                                      lesson.isLocked
                                        ? 'bg-slate-950/50 border-white/[0.04] opacity-50'
                                        : 'bg-white/[0.02] border-white/[0.06] hover:border-blue-500/30 hover:bg-blue-500/5 cursor-pointer'
                                    }`}
                                    onClick={() => handleLessonClick(lesson)}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                        lesson.isLocked
                                          ? 'bg-slate-800 text-slate-600'
                                          : isVideo ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'
                                      }`}>
                                        {lesson.isLocked ? (
                                          <Lock className="w-4 h-4" />
                                        ) : isVideo ? (
                                          <Play className="w-4 h-4 fill-current" />
                                        ) : (
                                          <FileText className="w-4 h-4" />
                                        )}
                                      </div>
                                      <div>
                                        <p className={`text-xs sm:text-sm font-semibold ${lesson.isLocked ? 'text-slate-600' : 'text-slate-200'}`}>
                                          {lesson.title}
                                        </p>
                                        <p className="text-[11px] text-slate-500 mt-0.5 uppercase font-bold tracking-wider">
                                          {lesson.duration || '—'} &bull; {lesson.type || 'video'}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {lesson.isFree && !lesson.isLocked && (
                                        <span className="text-[9px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase tracking-wide">
                                          Free preview
                                        </span>
                                      )}
                                      {!lesson.isLocked && lesson.videoUrl && (
                                        <ChevronRight className="w-4 h-4 text-slate-600" />
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Quizzes Tab ── */}
          {activeTab === 'quizzes' && (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-white/10 rounded-3xl p-6">
                <h3 className="text-white font-extrabold text-base">Course Mock Tests & Quizzes</h3>
                <p className="text-slate-500 text-xs mt-1">Practice timed examination sets with standard marking configurations.</p>
              </div>

              {quizzes.length === 0 ? (
                <div className="bg-slate-900 border border-white/10 rounded-3xl p-12 text-center text-slate-500">
                  <HelpCircle className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                  <p className="font-bold">No quizzes published yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {quizzes.map((q) => (
                    <div key={q.id} className="bg-slate-900 border border-white/10 hover:border-blue-500/30 p-5 rounded-3xl flex flex-col justify-between space-y-4">
                      <div>
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3">
                          <HelpCircle className="w-5.5 h-5.5" />
                        </div>
                        <h4 className="text-white font-bold text-sm sm:text-base leading-tight">{q.title}</h4>
                        <p className="text-slate-400 text-xs mt-2 line-clamp-2">{q.description || 'Practice mock test'}</p>
                      </div>
                      <div className="pt-2 flex justify-between items-center border-t border-white/[0.04] text-[11px] font-bold text-slate-500">
                        <span>{q.timeLimitMins} MINS &bull; {q.passingScore}% CUTOFF</span>
                        <Link 
                          href={`/student/course/${courseId}/quiz/${q.id}`}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-900/30 transition-all cursor-pointer"
                        >
                          Start Test
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Assignments Tab ── */}
          {activeTab === 'assignments' && (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-white/10 rounded-3xl p-6">
                <h3 className="text-white font-extrabold text-base">Course Written Assignments</h3>
                <p className="text-slate-500 text-xs mt-1">Submit essay responses or uploaded answer sheet files for feedback.</p>
              </div>

              {assignments.length === 0 ? (
                <div className="bg-slate-900 border border-white/10 rounded-3xl p-12 text-center text-slate-500">
                  <FileText className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                  <p className="font-bold">No assignments published yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {assignments.map((a) => (
                    <div key={a.id} className="bg-slate-900 border border-white/10 p-5 rounded-3xl space-y-3">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h4 className="text-white font-bold text-sm sm:text-base leading-snug">{a.title}</h4>
                          <span className="text-[10px] text-amber-400 font-bold uppercase mt-1 block">Due Date: {a.dueDate || 'No Limit'}</span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-md bg-white/[0.04] text-[10px] font-bold text-slate-400 shrink-0">
                          {a.maxMarks} MARKS
                        </span>
                      </div>
                      <p className="text-slate-450 text-xs leading-relaxed line-clamp-3">{a.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-4">
          {/* Progress Card */}
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 space-y-4">
            <h3 className="text-white font-bold text-base">Your Progress</h3>
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
            <div className="bg-slate-900 border border-amber-500/20 rounded-3xl p-6 space-y-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                <h3 className="text-white font-bold text-sm">Enroll to Unlock</h3>
              </div>
              <p className="text-slate-450 text-xs leading-relaxed">
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
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 space-y-3">
            <h3 className="text-white font-bold text-sm">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                href="/student/dashboard"
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:border-violet-500/30 hover:bg-violet-500/5 transition-all text-slate-350 hover:text-white text-xs font-semibold"
              >
                <MessageSquare className="w-4 h-4 text-violet-400" />
                Mentor Connect
              </Link>
              <Link
                href="/student/dashboard"
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:border-amber-500/30 hover:bg-amber-500/5 transition-all text-slate-350 hover:text-white text-xs font-semibold"
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
