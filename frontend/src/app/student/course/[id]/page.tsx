'use client';

import { use, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  BookOpen, Play, CheckCircle, ChevronLeft, ChevronDown, ChevronRight,
  Lock, Video, Clock, Sparkles, Trophy, MessageSquare, HelpCircle, FileText,
  Radio, Calendar, Bell, CheckSquare, Inbox, Download, Sun, Moon
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/context/ThemeContext';
import { downloadWatermarkedPdf } from '@/utils/watermarkPdf';
import DoubtsCommunityForum from '@/components/DoubtsCommunityForum';
import HlsVideoPlayer from '@/components/HlsVideoPlayer';

interface Lesson {
  id: string;
  title: string;
  type: string;
  videoUrl: string | null;
  duration: string;
  isFree: boolean;
  isLocked: boolean;
  notesPdfUrl?: string | null;
  dppPdfUrl?: string | null;
  liveClassType?: string;
  liveScheduledAt?: string;
  liveMeetingUrl?: string | null;
  liveStatus?: 'scheduled' | 'live' | 'ended' | string;
  recordingUrl?: string | null;
  sectionTitle?: string;
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

interface QuizItem {
  id: string;
  title: string;
  description?: string;
  questionsCount?: number;
  timeLimitMinutes?: number;
  timeLimitMins?: number;
  passingScore?: number;
}

interface AssignmentItem {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  totalMarks?: number;
  maxMarks?: number;
}

interface CourseDetailPageProps {
  params: Promise<{ id: string }>;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export default function StudentCourseDetailPage({ params }: CourseDetailPageProps) {
  const resolvedParams = use(params);
  const courseId = resolvedParams.id;
  const { user, accessToken, isLoading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab state (PW-style: Live Classes, Recorded Lectures, Notes, Quizzes, Assignments, Doubts Forum)
  const [activeTab, setActiveTab] = useState<'live' | 'curriculum' | 'recordings' | 'quizzes' | 'assignments' | 'doubts'>('curriculum');
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);

  // Video player state
  const [playingLesson, setPlayingLesson] = useState<Lesson | null>(null);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const videoRef = useRef<HTMLVideoElement>(null);

  const [remindedLessons, setRemindedLessons] = useState<Record<string, boolean>>({});

  const handleSetReminder = (lesson: Lesson) => {
    setRemindedLessons(prev => ({ ...prev, [lesson.id]: true }));

    // Generate Google Calendar Link if schedule exists
    const title = encodeURIComponent(`Live Class: ${lesson.title} - ${course?.title || 'Course'}`);
    const details = encodeURIComponent(`Live Interactive Class for ${course?.title || 'Course'}.\nPlatform: ${lesson.liveClassType || 'Online'}\nJoin Link: ${lesson.liveMeetingUrl || lesson.videoUrl || window.location.href}`);
    
    // Construct Google Calendar Event URL (scheduled for tomorrow or general link)
    const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}`;
    
    // Open in new tab for student to save directly to calendar/phone
    window.open(gcalUrl, '_blank');
  };

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

    // Auto-redirect if accessed with a Test Series ID or slug
    if (courseId && (courseId.startsWith('ts-') || courseId.includes('test-series'))) {
      async function redirectTestSeries() {
        try {
          const { db } = await import('@/services/db');
          const ts = await db.getTestSeriesById(courseId);
          const slug = ts?.slug || courseId;
          window.location.replace(`/test-series/program/${slug}`);
        } catch {
          window.location.replace(`/test-series/program/${courseId}`);
        }
      }
      redirectTestSeries();
      return;
    }

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

        // 2. Fetch Real User Progress if enrolled
        if (data.data.isEnrolled && accessToken) {
          try {
            const progRes = await fetch(`${BACKEND_URL}/api/lms/progress/${courseId}`, { headers });
            const progData = await progRes.json();
            if (progData.success && Array.isArray(progData.data)) {
              const completedList = progData.data.filter((p: { completed: boolean }) => p.completed);
              setCompletedCount(completedList.length);
            }
          } catch (pErr) {
            console.error('Error loading course progress:', pErr);
          }
        }

        // 3. Fetch Quizzes for enrolled student
        const quizRes = await fetch(`${BACKEND_URL}/api/lms/courses/${courseId}/quizzes`, { headers });
        const quizData = await quizRes.json();
        if (quizData.success) {
          setQuizzes(quizData.data || []);
        }

        // 4. Fetch Assignments
        const assignRes = await fetch(`${BACKEND_URL}/api/lms/courses/${courseId}/assignments`, { headers });
        const assignData = await assignRes.json();
        if (assignData.success) {
          setAssignments(assignData.data || []);
        }

      } catch {
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

  const handleLessonClick = async (lesson: Lesson) => {
    if (lesson.isLocked) return;

    // Save lesson progress if student is authenticated
    if (accessToken) {
      try {
        const { saveLessonProgress } = await import('@/services/auth');
        await saveLessonProgress(accessToken, {
          courseId,
          lessonId: lesson.id,
          completed: true
        });
      } catch (err) {
        console.error('Error auto-saving lesson progress:', err);
      }
    }
    
    const isLive = lesson.type === 'live';
    const isVideo = lesson.type !== 'pdf' && lesson.type !== 'resource' && !isLive;

    if (isLive) {
      const meetingUrl = lesson.liveMeetingUrl || lesson.videoUrl || '';
      const isExternalMeeting = lesson.liveClassType === 'meet' || lesson.liveClassType === 'zoom' 
        || /meet\.google\.com|zoom\.us|teams\.microsoft\.com|webex\.com/i.test(meetingUrl);

      if (isExternalMeeting && meetingUrl && !lesson.recordingUrl) {
        window.open(meetingUrl, '_blank');
        setPlayingLesson(lesson);
        return;
      }
      setPlayingLesson(lesson);
    } else if (isVideo && (lesson.videoUrl || lesson.recordingUrl)) {
      setPlayingLesson(lesson);
    } else if (lesson.videoUrl) {
      // PDF or resource link opens directly in new window
      window.open(lesson.videoUrl, '_blank');
    }
  };

  const allLessons: Lesson[] = sections.flatMap(s => s.lessons.map(l => ({ ...l, sectionTitle: s.title })));
  const liveLessons = allLessons.filter(l => l.type === 'live');
  const recordedLessons = allLessons.filter(l => l.type !== 'live' && l.type !== 'pdf' && l.type !== 'resource');
  const totalLessons = sections.reduce((sum, s) => sum + s.lessons.length, 0);
  const freeLessons = sections.reduce((sum, s) => sum + s.lessons.filter(l => l.isFree).length, 0);
  const liveActiveCount = liveLessons.filter(l => l.liveStatus === 'live').length;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-900 dark:text-white transition-colors">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Loading course content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-900 dark:text-white p-6 gap-4 transition-colors">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <BookOpen className="w-7 h-7 text-red-500" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Could Not Load Course</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm text-center max-w-xs">{error}</p>
        <Link href="/student/dashboard" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-500 transition-all shadow-sm">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-900 dark:text-white p-6 transition-colors">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Course Not Found</h2>
        <p className="text-slate-500 text-xs mt-1 mb-4">This course does not exist or has been removed.</p>
        <Link href="/student/dashboard" className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-sm">
          Back to Portal
        </Link>
      </div>
    );
  }

  return (
    <div className="portal-page min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-body text-[15px] transition-colors duration-200">
      {/* Video Player Modal */}
      {playingLesson && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-slate-900 rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-blue-400 font-bold uppercase tracking-wider">
                    {playingLesson.type === 'live' ? '🔴 Live Session' : 'Now Playing'}
                  </p>
                  {playingLesson.type === 'live' && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500 text-white animate-pulse">
                      {playingLesson.liveStatus === 'live' ? 'BROADCASTING NOW' : playingLesson.liveStatus === 'ended' ? 'RECORDING AVAILABLE' : 'SCHEDULED LIVE'}
                    </span>
                  )}
                </div>
                <h3 className="text-white font-extrabold text-base mt-0.5">{playingLesson.title}</h3>
                {playingLesson.liveScheduledAt && (
                  <p className="text-xs text-rose-300 font-medium mt-0.5">🗓 Scheduled For: {playingLesson.liveScheduledAt}</p>
                )}
              </div>
              <button
                onClick={() => setPlayingLesson(null)}
                className="px-4 py-2 bg-white/[0.08] hover:bg-white/[0.15] text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Close ✕
              </button>
            </div>
            {/* Video or Live Stream Container */}
            <div className="aspect-video bg-black relative flex flex-col justify-center items-center">
              {(() => {
                const meetingLink = (playingLesson.liveMeetingUrl || playingLesson.videoUrl || '').trim();
                const isGoogleMeet = playingLesson.liveClassType === 'meet' || /meet\.google\.com/i.test(meetingLink);
                const isZoom = playingLesson.liveClassType === 'zoom' || /zoom\.us/i.test(meetingLink);
                const isExternalMeeting = isGoogleMeet || isZoom || /teams\.microsoft\.com|webex\.com/i.test(meetingLink);

                // If Zoom or Google Meet with no embed, provide direct launcher screen
                if (playingLesson.type === 'live' && isExternalMeeting && !playingLesson.recordingUrl) {
                  return (
                    <div className="p-8 text-center space-y-4 max-w-lg mx-auto">
                      <div className="w-16 h-16 rounded-3xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto text-2xl shadow-inner">
                        {isGoogleMeet ? '🟢' : isZoom ? '🔵' : '🔴'}
                      </div>
                      <h4 className="text-white font-extrabold text-lg">
                        {isGoogleMeet ? 'Google Meet Classroom' : isZoom ? 'Zoom Live Session' : 'Interactive Live Classroom'}
                      </h4>
                      <p className="text-slate-300 text-xs leading-relaxed">
                        This interactive session is conducted via <strong className="text-white">{isGoogleMeet ? 'Google Meet' : isZoom ? 'Zoom' : 'Live Meeting'}</strong>.
                        {playingLesson.liveScheduledAt ? ` Class is scheduled for ${playingLesson.liveScheduledAt}.` : ''}
                      </p>
                      {meetingLink ? (
                        <div className="space-y-3 pt-2">
                          <a
                            href={meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 w-full px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm shadow-xl shadow-rose-600/30 transition-all hover:scale-[1.02] cursor-pointer"
                          >
                            <span>Join {isGoogleMeet ? 'Google Meet' : isZoom ? 'Zoom' : 'Live Class'} Now 🚀</span>
                          </a>
                          <div className="flex items-center gap-2 p-2 bg-slate-900 border border-white/10 rounded-xl text-left">
                            <span className="text-[10px] text-slate-400 font-mono flex-1 truncate px-2 select-all">{meetingLink}</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(meetingLink);
                                alert('Meeting link copied to clipboard!');
                              }}
                              className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold rounded-lg shrink-0 cursor-pointer"
                            >
                              Copy Link
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-300 text-xs font-bold">
                          Class meeting link will be updated here shortly before session starts.
                        </div>
                      )}
                    </div>
                  );
                }

                // If class ended and recording exists, or normal video
                const streamUrl = (playingLesson.liveStatus === 'ended' && playingLesson.recordingUrl) 
                  ? playingLesson.recordingUrl 
                  : (playingLesson.videoUrl || playingLesson.liveMeetingUrl || playingLesson.recordingUrl);

                if (!streamUrl) {
                  return (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-6 text-center">
                      <p className="text-sm font-bold text-slate-300">Live Stream Not Started Yet</p>
                      <p className="text-xs text-slate-500 mt-1">Please check back at {playingLesson.liveScheduledAt || 'the scheduled class time'}.</p>
                    </div>
                  );
                }

                const youtubeEmbed = getYoutubeEmbedUrl(streamUrl);
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
                  <HlsVideoPlayer
                    src={streamUrl}
                    controls
                    playsInline
                    autoPlay
                    className="w-full h-full bg-black object-contain"
                  />
                );
              })()}
            </div>
            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{playingLesson.duration || 'Duration not set'}</span>
                </span>
                {playingLesson.recordingUrl && playingLesson.liveStatus === 'ended' && (
                  <span className="text-emerald-400 font-bold text-[10px]">● Full Class Recording Available</span>
                )}
                <span className={`px-2.5 py-0.5 rounded-full font-bold border uppercase tracking-wider text-[10px] ${
                  playingLesson.type === 'live' 
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                    : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                }`}>
                  {playingLesson.type === 'live' ? 'LIVE CLASS' : (playingLesson.type?.toUpperCase() || 'VIDEO')}
                </span>
              </div>

              {/* Watermarked Study Material Downloads */}
              <div className="flex items-center gap-2">
                {playingLesson.notesPdfUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      downloadWatermarkedPdf(playingLesson.notesPdfUrl!, `${playingLesson.title}-Class-Notes`, {
                        studentName: user?.fullName,
                        email: user?.email,
                        mobile: user?.mobile,
                      });
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    title="Download Anti-Piracy Watermarked Class Notes"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Class Notes (PDF)</span>
                  </button>
                )}
                {playingLesson.dppPdfUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      downloadWatermarkedPdf(playingLesson.dppPdfUrl!, `${playingLesson.title}-DPP-Practice-Sheet`, {
                        studentName: user?.fullName,
                        email: user?.email,
                        mobile: user?.mobile,
                      });
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    title="Download Anti-Piracy Watermarked DPP Practice Sheet"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Daily Practice (DPP)</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-20 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-slate-200 dark:border-white/[0.06] px-4 sm:px-6 py-3.5 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/student/dashboard"
            className="p-2 bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] rounded-xl hover:bg-slate-200 dark:hover:bg-white/[0.08] transition-all text-slate-600 dark:text-slate-400 shrink-0"
            title="Back to Dashboard"
          >
            <ChevronLeft className="w-4.5 h-4.5" />
          </Link>
          <div className="min-w-0">
            <span className="text-[11px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider block">Student Portal</span>
            <h1 className="text-slate-900 dark:text-white font-extrabold text-sm sm:text-base truncate max-w-[200px] sm:max-w-md">{course.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Light / Dark Mode Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer shadow-2xs"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-slate-600" />
                <span className="hidden sm:inline">Dark</span>
              </>
            )}
          </button>

          {isEnrolled && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Enrolled</span>
            </div>
          )}
        </div>
      </header>

      <div className="p-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Main Panel ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Course Info Banner */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-xs transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20 dark:shadow-blue-900/30">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">{course.category}</span>
                <h2 className="text-slate-900 dark:text-white font-extrabold text-lg sm:text-xl mt-0.5 leading-tight">{course.title}</h2>
                {course.description && (
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mt-2">{course.description}</p>
                )}
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-semibold">
                    <Video className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <span>{totalLessons} lessons</span>
                  </div>
                  {course.duration && (
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-semibold">
                      <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      <span>{course.duration}</span>
                    </div>
                  )}
                  {!isEnrolled && freeLessons > 0 && (
                    <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                      <Sparkles className="w-4 h-4 animate-pulse" />
                      <span>{freeLessons} free preview</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* PhysicsWallah-Style Tabs Switcher */}
          <div className="flex gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-2xl w-full sm:w-fit overflow-x-auto transition-colors">
            {[
              { 
                id: 'live', 
                label: 'Live Classes', 
                icon: Radio,
                count: liveLessons.length,
                isPulse: liveActiveCount > 0
              },
              { 
                id: 'recordings', 
                label: 'Recorded Lectures', 
                icon: Video,
                count: recordedLessons.length 
              },
              { 
                id: 'curriculum', 
                label: 'All Chapters', 
                icon: BookOpen,
                count: sections.length 
              },
              { 
                id: 'quizzes', 
                label: 'Mock Tests', 
                icon: CheckSquare,
                count: quizzes.length 
              },
              { 
                id: 'assignments', 
                label: 'Assignments', 
                icon: Inbox,
                count: assignments.length 
              },
              { 
                id: 'doubts', 
                label: 'Doubts & Discussion', 
                icon: MessageSquare,
                count: 0 
              }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'live' | 'curriculum' | 'recordings' | 'quizzes' | 'assignments' | 'doubts')}
                  className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === tab.id 
                      ? tab.id === 'live' && tab.isPulse
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-900/30 font-black'
                        : 'bg-blue-600 text-white shadow-xs font-black' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-white dark:hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                      activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                  {tab.isPulse && (
                    <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping inline-block" />
                  )}
                </button>
              );
            })}
          </div>

          {/* ────────────────────────────────────────────────────────── */}
          {/* ── 1. LIVE CLASSES TAB (PhysicsWallah Classroom Style) ── */}
          {/* ────────────────────────────────────────────────────────── */}
          {activeTab === 'live' && (
            <div className="space-y-6">
              {/* Live Status Hero Header */}
              <div className="bg-gradient-to-r from-rose-50 via-slate-50 to-white dark:from-rose-950/80 dark:via-slate-900 dark:to-slate-900 border border-rose-200 dark:border-rose-500/30 rounded-3xl p-6 relative overflow-hidden shadow-xs">
                <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-rose-500/10 to-transparent pointer-events-none" />
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-300 text-[10px] font-black uppercase tracking-wider border border-rose-500/20 dark:border-rose-500/30">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                      Live Interactive Studio
                    </div>
                    <h3 className="text-slate-900 dark:text-white font-extrabold text-lg sm:text-xl">Today&apos;s Live Broadcasts & Schedule</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-xs">
                      Join real-time faculty doubt clearing and lecture sessions directly.
                    </p>
                  </div>
                  {liveActiveCount > 0 && (
                    <div className="px-4 py-2 rounded-2xl bg-rose-600 text-white font-black text-xs shadow-lg shadow-rose-900/40 animate-bounce">
                      🔴 {liveActiveCount} SESSION LIVE NOW
                    </div>
                  )}
                </div>
              </div>

              {/* Live Classes List */}
              {liveLessons.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-12 text-center text-slate-500 space-y-3 shadow-xs">
                  <Radio className="w-12 h-12 text-slate-400 dark:text-slate-700 mx-auto" />
                  <p className="font-bold text-slate-700 dark:text-slate-300">No Live Classes Scheduled Right Now</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Faculty schedules live sessions weekly. Check your batch schedule or browse recorded lectures below.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {liveLessons.map((les) => {
                    const isBroadcasting = les.liveStatus === 'live';
                    const isEnded = les.liveStatus === 'ended';

                    return (
                      <div
                        key={les.id}
                        className={`p-6 rounded-3xl border transition-all ${
                          isBroadcasting
                            ? 'bg-gradient-to-r from-rose-50 to-white dark:from-rose-950/40 dark:to-slate-900 border-rose-400 dark:border-rose-500/50 shadow-md shadow-rose-950/10'
                            : isEnded
                              ? 'bg-slate-50 dark:bg-slate-900/80 border-slate-200 dark:border-white/[0.06]'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 hover:border-rose-400 dark:hover:border-rose-500/30 shadow-xs'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                isBroadcasting
                                  ? 'bg-rose-500 text-white animate-pulse'
                                  : isEnded
                                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                                    : 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 dark:border-rose-500/30'
                              }`}>
                                {isBroadcasting ? '● LIVE BROADCASTING NOW' : isEnded ? 'CLASS ENDED' : 'UPCOMING SESSION'}
                              </span>
                              {(() => {
                                const mLink = les.liveMeetingUrl || les.videoUrl || '';
                                const isGMeet = les.liveClassType === 'meet' || /meet\.google\.com/i.test(mLink);
                                const isZ = les.liveClassType === 'zoom' || /zoom\.us/i.test(mLink);
                                const isYT = les.liveClassType === 'youtube' || /youtu(\.be|be\.com)/i.test(mLink);
                                const pLabel = isGMeet ? 'Google Meet' : isZ ? 'Zoom' : isYT ? 'YouTube Live' : (les.liveClassType?.toUpperCase() || 'STUDIO');
                                return (
                                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                    isGMeet ? 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 dark:border-emerald-500/30' :
                                    isZ ? 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 dark:border-blue-500/30' :
                                    isYT ? 'bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 dark:border-red-500/30' :
                                    'bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-transparent'
                                  }`}>
                                    {pLabel}
                                  </span>
                                );
                              })()}
                              {les.isFree && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold border border-emerald-500/20">
                                  FREE PREVIEW
                                </span>
                              )}
                            </div>

                            <h4 className="text-slate-900 dark:text-white font-extrabold text-base sm:text-lg">{les.title}</h4>

                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
                              <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                                <Calendar className="w-3.5 h-3.5 text-rose-500" />
                                {les.liveScheduledAt || 'Schedule announced in batch'}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                                {les.duration || '60 mins'}
                              </span>
                              <span>•</span>
                              <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                                Chapter: {les.sectionTitle}
                              </span>
                            </div>
                          </div>

                          <div className="shrink-0 w-full sm:w-auto flex sm:flex-col items-center gap-2">
                            {isBroadcasting ? (
                              <button
                                onClick={() => handleLessonClick(les)}
                                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-lg shadow-rose-600/30 transition-all hover:scale-105 cursor-pointer flex items-center justify-center gap-2"
                              >
                                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                                Join Live Class 🚀
                              </button>
                            ) : isEnded ? (
                              <button
                                onClick={() => handleLessonClick(les)}
                                className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-blue-600/90 hover:bg-blue-600 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <Play className="w-3.5 h-3.5 fill-current" />
                                Watch Recording
                              </button>
                            ) : (
                              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                <button
                                  type="button"
                                  onClick={() => handleSetReminder(les)}
                                  className={`w-full sm:w-auto px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                    remindedLessons[les.id]
                                      ? 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                                      : 'bg-amber-500/10 dark:bg-amber-500/20 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                                  }`}
                                >
                                  <Bell className={`w-3.5 h-3.5 ${remindedLessons[les.id] ? 'fill-current' : ''}`} />
                                  <span>{remindedLessons[les.id] ? 'Reminder Added' : 'Remind Me'}</span>
                                </button>
                                <button
                                  onClick={() => handleLessonClick(les)}
                                  className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.12] text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-slate-200 dark:border-transparent"
                                >
                                  Class Details
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ────────────────────────────────────────────────────────── */}
          {/* ── 2. RECORDED LECTURES TAB (PhysicsWallah Video Library) ── */}
          {/* ────────────────────────────────────────────────────────── */}
          {activeTab === 'recordings' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs">
                <div>
                  <h3 className="text-slate-900 dark:text-white font-extrabold text-base">Recorded Video Lectures Library</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-xs mt-1">
                    Watch anytime with high-speed playback, auto-progress, and downloadable study notes.
                  </p>
                </div>
                <div className="px-3.5 py-1.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black text-xs border border-blue-500/20">
                  {recordedLessons.length} Recorded Videos Available
                </div>
              </div>

              {recordedLessons.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-12 text-center text-slate-500 shadow-xs">
                  <Play className="w-12 h-12 text-slate-400 dark:text-slate-700 mx-auto mb-3" />
                  <p className="font-bold text-slate-700 dark:text-slate-300">No recorded lectures uploaded yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {recordedLessons.map((les, lIdx) => (
                    <div
                      key={les.id}
                      onClick={() => handleLessonClick(les)}
                      className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                        les.isLocked
                          ? 'bg-slate-100 dark:bg-slate-950/40 border-slate-200 dark:border-white/[0.04] opacity-60'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 hover:border-blue-500/40 hover:shadow-md'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                            LECTURE {lIdx + 1}
                          </span>
                          {les.isFree && !les.isLocked && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold border border-emerald-500/20">
                              Free Demo
                            </span>
                          )}
                          {les.isLocked && (
                            <span className="flex items-center gap-1 text-[10px] text-slate-500 font-bold">
                              <Lock className="w-3 h-3" /> Locked
                            </span>
                          )}
                        </div>

                        <h4 className="text-slate-900 dark:text-white font-bold text-sm leading-snug line-clamp-2">{les.title}</h4>
                        <p className="text-slate-500 text-[11px]">{les.sectionTitle}</p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-white/[0.04] flex items-center justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          {les.duration || 'Video'}
                        </span>
                        <span className="text-blue-600 dark:text-blue-400 font-bold text-[11px] flex items-center gap-1 hover:underline">
                          Play Lecture <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ────────────────────────────────────────────────────────── */}
          {/* ── 3. CURRICULUM TAB (Full Outline) ── */}
          {/* ────────────────────────────────────────────────────────── */}
          {activeTab === 'curriculum' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-xs">
              <div className="px-6 py-5 border-b border-slate-100 dark:border-white/[0.06]">
                <h3 className="text-slate-900 dark:text-white font-extrabold text-base">Course Curriculum</h3>
                <p className="text-slate-500 text-xs mt-1">{sections.length} chapters · {totalLessons} lectures & files</p>
              </div>

              {sections.length === 0 ? (
                <div className="p-12 text-center">
                  <BookOpen className="w-12 h-12 text-slate-400 dark:text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 font-bold">No curriculum published yet</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {sections.map((section, sIdx) => {
                    const isOpen = openSections.has(section.id);
                    return (
                      <div key={section.id}>
                        {/* Section header */}
                        <button
                          onClick={() => toggleSection(section.id)}
                          className="w-full flex items-center justify-between px-6 py-5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-all text-left cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                              {sIdx + 1}
                            </span>
                            <div>
                              <p className="text-slate-900 dark:text-white font-bold text-sm sm:text-base">{section.title}</p>
                              <p className="text-slate-500 text-xs mt-0.5">{section.lessons.length} items</p>
                            </div>
                          </div>
                          <ChevronDown className={`w-5 h-5 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Lessons */}
                        {isOpen && (
                          <div className="px-6 pb-4 space-y-2">
                            {section.lessons.length === 0 ? (
                              <p className="text-slate-400 dark:text-slate-600 text-xs italic py-2 pl-10">No items inside this chapter yet.</p>
                            ) : (
                              section.lessons.map((lesson) => {
                                const isVideo = lesson.type !== 'pdf' && lesson.type !== 'resource';
                                return (
                                  <div
                                    key={lesson.id}
                                    className={`flex items-center justify-between px-4 py-3 rounded-2xl border transition-all ${
                                      lesson.isLocked
                                        ? 'bg-slate-100/60 dark:bg-slate-950/50 border-slate-200 dark:border-white/[0.04] opacity-60'
                                        : 'bg-slate-50/70 dark:bg-white/[0.02] border-slate-200/80 dark:border-white/[0.06] hover:border-blue-500/40 hover:bg-blue-50/40 dark:hover:bg-blue-500/5 cursor-pointer'
                                    }`}
                                    onClick={() => handleLessonClick(lesson)}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                        lesson.isLocked
                                          ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600'
                                          : lesson.type === 'live'
                                            ? 'bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20'
                                            : isVideo ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                      }`}>
                                        {lesson.isLocked ? (
                                          <Lock className="w-4 h-4" />
                                        ) : lesson.type === 'live' ? (
                                          <span className="text-xs">🔴</span>
                                        ) : isVideo ? (
                                          <Play className="w-4 h-4 fill-current" />
                                        ) : (
                                          <FileText className="w-4 h-4" />
                                        )}
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <p className={`text-xs sm:text-sm font-semibold ${lesson.isLocked ? 'text-slate-400 dark:text-slate-600' : 'text-slate-900 dark:text-slate-200'}`}>
                                            {lesson.title}
                                          </p>
                                          {lesson.type === 'live' && (
                                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                              lesson.liveStatus === 'live'
                                                ? 'bg-rose-500 text-white animate-pulse'
                                                : lesson.liveStatus === 'ended'
                                                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                                                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                            }`}>
                                              {lesson.liveStatus === 'live' ? 'LIVE NOW' : lesson.liveStatus === 'ended' ? 'RECORDING' : 'UPCOMING LIVE'}
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 uppercase font-bold tracking-wider">
                                          {lesson.duration || '—'} • {lesson.type === 'live' ? 'Interactive Live Class' : (lesson.type || 'video')}
                                          {lesson.liveScheduledAt && ` • 🗓 ${lesson.liveScheduledAt}`}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {/* Attached Notes & DPP pill icons */}
                                      {lesson.notesPdfUrl && !lesson.isLocked && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            downloadWatermarkedPdf(lesson.notesPdfUrl!, `${lesson.title}-Notes`, {
                                              studentName: user?.fullName,
                                              email: user?.email,
                                              mobile: user?.mobile,
                                            });
                                          }}
                                          className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1 transition-all"
                                          title="Download Watermarked Class Notes"
                                        >
                                          <Download className="w-3 h-3" />
                                          <span className="hidden sm:inline">Notes</span>
                                        </button>
                                      )}
                                      {lesson.dppPdfUrl && !lesson.isLocked && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            downloadWatermarkedPdf(lesson.dppPdfUrl!, `${lesson.title}-DPP`, {
                                              studentName: user?.fullName,
                                              email: user?.email,
                                              mobile: user?.mobile,
                                            });
                                          }}
                                          className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-[10px] font-bold flex items-center gap-1 transition-all"
                                          title="Download Daily Practice Paper"
                                        >
                                          <Download className="w-3 h-3" />
                                          <span className="hidden sm:inline">DPP</span>
                                        </button>
                                      )}

                                      {lesson.type === 'live' && lesson.liveStatus === 'live' && !lesson.isLocked && (
                                        <span className="px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-extrabold shadow-sm transition-all">
                                          Join Live Class 🚀
                                        </span>
                                      )}
                                      {lesson.isFree && !lesson.isLocked && (
                                        <span className="text-[9px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                                          Free preview
                                        </span>
                                      )}
                                      {!lesson.isLocked && (lesson.videoUrl || lesson.liveMeetingUrl || lesson.recordingUrl) && (
                                        <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-600" />
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
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-xs">
                <h3 className="text-slate-900 dark:text-white font-extrabold text-base">Course Mock Tests & Quizzes</h3>
                <p className="text-slate-500 text-xs mt-1">Practice timed examination sets with standard marking configurations.</p>
              </div>

              {quizzes.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-12 text-center text-slate-500 shadow-xs">
                  <HelpCircle className="w-12 h-12 text-slate-400 dark:text-slate-700 mx-auto mb-3" />
                  <p className="font-bold text-slate-700 dark:text-slate-300">No quizzes published yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {quizzes.map((q) => (
                    <div key={q.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:border-blue-500/30 p-5 rounded-3xl flex flex-col justify-between space-y-4 shadow-xs">
                      <div>
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                          <HelpCircle className="w-5.5 h-5.5" />
                        </div>
                        <h4 className="text-slate-900 dark:text-white font-bold text-sm sm:text-base leading-tight">{q.title}</h4>
                        <p className="text-slate-600 dark:text-slate-400 text-xs mt-2 line-clamp-2">{q.description || 'Practice mock test'}</p>
                      </div>
                      <div className="pt-2 flex justify-between items-center border-t border-slate-100 dark:border-white/[0.04] text-[11px] font-bold text-slate-500">
                        <span>{q.timeLimitMins} MINS • {q.passingScore}% CUTOFF</span>
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

          {/* ── Doubts & Discussion Community Tab ── */}
          {activeTab === 'doubts' && (
            <DoubtsCommunityForum
              courseId={courseId}
              currentUser={user ? { id: user.id, fullName: user.fullName, email: user.email, role: user.role } : null}
              accessToken={accessToken}
            />
          )}
          {activeTab === 'assignments' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-xs">
                <h3 className="text-slate-900 dark:text-white font-extrabold text-base">Course Written Assignments</h3>
                <p className="text-slate-500 text-xs mt-1">Submit essay responses or uploaded answer sheet files for feedback.</p>
              </div>

              {assignments.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-12 text-center text-slate-500 shadow-xs">
                  <FileText className="w-12 h-12 text-slate-400 dark:text-slate-700 mx-auto mb-3" />
                  <p className="font-bold text-slate-700 dark:text-slate-300">No assignments published yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {assignments.map((a) => (
                    <div key={a.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-5 rounded-3xl space-y-3 shadow-xs">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h4 className="text-slate-900 dark:text-white font-bold text-sm sm:text-base leading-snug">{a.title}</h4>
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase mt-1 block">Due Date: {a.dueDate || 'No Limit'}</span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.04] text-[10px] font-bold text-slate-600 dark:text-slate-400 shrink-0">
                          {a.maxMarks} MARKS
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed line-clamp-3">{a.description}</p>
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 space-y-4 shadow-xs">
            <h3 className="text-slate-900 dark:text-white font-bold text-base">Your Progress</h3>
            {(() => {
              const displayCompleted = Math.min(completedCount, totalLessons);
              const progressPct = totalLessons > 0 ? Math.min(100, Math.round((displayCompleted / totalLessons) * 100)) : 0;
              return (
                <>
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold mb-2">
                      <span>Completed</span>
                      <span>{progressPct}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                  <div className="pt-2 grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200/80 dark:border-blue-500/20 text-center">
                      <p className="text-blue-600 dark:text-blue-400 font-bold text-lg">{totalLessons}</p>
                      <p className="text-slate-500 text-[10px] mt-0.5">Total Lessons</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/80 dark:border-emerald-500/20 text-center">
                      <p className="text-emerald-600 dark:text-emerald-400 font-bold text-lg">{displayCompleted}</p>
                      <p className="text-slate-500 text-[10px] mt-0.5">Completed</p>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Enrollment status */}
          {!isEnrolled && (
            <div className="bg-white dark:bg-slate-900 border border-amber-500/30 rounded-3xl p-6 space-y-3 shadow-xs">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-500" />
                <h3 className="text-slate-900 dark:text-white font-bold text-sm">Enroll to Unlock</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 space-y-3 shadow-xs">
            <h3 className="text-slate-900 dark:text-white font-bold text-sm">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                href="/student/dashboard"
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] hover:border-violet-500/30 hover:bg-violet-50 dark:hover:bg-violet-500/5 transition-all text-slate-700 dark:text-slate-350 hover:text-slate-950 dark:hover:text-white text-xs font-semibold"
              >
                <MessageSquare className="w-4 h-4 text-violet-500 dark:text-violet-400" />
                Mentor Connect
              </Link>
              <Link
                href="/student/dashboard"
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] hover:border-amber-500/30 hover:bg-amber-50 dark:hover:bg-amber-500/5 transition-all text-slate-700 dark:text-slate-350 hover:text-slate-950 dark:hover:text-white text-xs font-semibold"
              >
                <Trophy className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                View Performance
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
