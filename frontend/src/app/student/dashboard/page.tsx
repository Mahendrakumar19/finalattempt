'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  BookOpen, TrendingUp, FileText,
  Award, CheckCircle, Play,
  ChevronRight,
  Target, Zap, Lock,
  Sun, Moon, Download, Receipt,
  Trophy, Medal, Sparkles, ShieldCheck, Flame, Star
} from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LocaleContext';
import { getMyEnrollments, getCourseQuizzes } from '@/services/auth';
import MentorshipChat from '@/components/lms/MentorshipChat';
import PerformanceAnalytics from '@/components/lms/PerformanceAnalytics';
import StudentPortalShell from '@/components/StudentPortalShell';
import { generateTaxInvoicePdf } from '@/utils/invoiceGenerator';
import { generateCourseCertificatePdf } from '@/utils/certificateGenerator';
import { db } from '@/services/db';

type DashTab = 'Dashboard' | 'My Courses' | 'Performance' | 'Tests' | 'Notes' | 'Mentor Connect' | 'Certificates';

interface Enrollment {
  courseId: string;
  title: string;
  category: string;
  thumbnailUrl?: string;
  duration?: string;
  enrolledAt: string;
  amountPaid?: number;
  paymentOrderId?: string;
  paymentId?: string;
  testSeriesSlug?: string;
  completedLessons?: number;
  totalLessons?: number;
  completionPercentage?: number;
}

interface QuizEntry {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  timeLimitMins?: number;
  [key: string]: unknown;
}

interface CourseQuizItem {
  quiz: QuizEntry;
  courseTitle: string;
  courseId: string;
  slug?: string;
}

function StudentDashboardContent() {
  const { user, accessToken, isLoading, requireAuth } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<DashTab>('Dashboard');
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(true);
  const [allQuizzes, setAllQuizzes] = useState<CourseQuizItem[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);

  // Sync searchParams ?tab=... to activeTab
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      const decodedTab = tabParam.replace(/\+/g, ' ');
      const validTabs: DashTab[] = ['Dashboard', 'My Courses', 'Performance', 'Tests', 'Notes', 'Mentor Connect', 'Certificates'];
      if (validTabs.includes(decodedTab as DashTab)) {
        queueMicrotask(() => setActiveTab(decodedTab as DashTab));
      }
    } else {
      queueMicrotask(() => setActiveTab('Dashboard'));
    }
  }, [searchParams]);

  // Authentication guard
  useEffect(() => {
    requireAuth('/auth/login/student');
  }, [requireAuth, isLoading]);

  // Fetch enrollments and test series quizzes from backend / DB
  useEffect(() => {
    if (!accessToken) return;

    const load = async () => {
      setLoadingEnrollments(true);
      setLoadingQuizzes(true);

      let fetchedCourseQuizzes: CourseQuizItem[] = [];
      const res = await getMyEnrollments(accessToken);
      setLoadingEnrollments(false);

      if (res.success && res.data) {
        setEnrollments(res.data as Enrollment[]);
        const quizResults = await Promise.all(
          (res.data as Enrollment[]).map(async (e: Enrollment) => {
            const qRes = await getCourseQuizzes(e.courseId, accessToken);
            if (qRes.success && qRes.data && qRes.data.length > 0) {
              return (qRes.data as QuizEntry[]).map((quiz: QuizEntry) => ({ quiz, courseTitle: e.title, courseId: e.courseId }));
            }
            return [];
          })
        );
        fetchedCourseQuizzes = quizResults.flat();
      }

      // Also fetch active Test Series Mocks from db
      try {
        const testSeriesList = await db.getTestSeries(true);
        if (testSeriesList && testSeriesList.length > 0) {
          const tsQuizResults = await Promise.all(
            testSeriesList.map(async (ts) => {
              const qList = await db.getTestSeriesQuizzes(ts.id);
              if (qList && qList.length > 0) {
                return (qList as QuizEntry[]).map((quiz: QuizEntry) => ({
                  quiz,
                  courseTitle: ts.title,
                  courseId: ts.id,
                  slug: ts.slug
                }));
              }
              return [];
            })
          );
          fetchedCourseQuizzes = [...fetchedCourseQuizzes, ...tsQuizResults.flat()];
        }
      } catch (err) {
        console.error('Error fetching test series for student dashboard:', err);
      }

      setAllQuizzes(fetchedCourseQuizzes);
      setLoadingQuizzes(false);
    };
    load();
  }, [accessToken]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0B0E] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">{t('student.verifyingSession')}</p>
        </div>
      </div>
    );
  }

  const stats = [
    { label: t('student.coursesEnrolled'), value: enrollments.length || 0, icon: BookOpen, color: 'text-blue-600 dark:text-blue-400', iconColor: 'text-blue-600 dark:text-blue-400', bg: 'bg-white dark:bg-[#15171E]', border: 'border-gray-200 dark:border-white/10 shadow-sm' },
    { label: t('student.testsAttempted'), value: allQuizzes.length || 0, icon: FileText, color: 'text-amber-600 dark:text-amber-400', iconColor: 'text-amber-600 dark:text-amber-400', bg: 'bg-white dark:bg-[#15171E]', border: 'border-gray-200 dark:border-white/10 shadow-sm' },
    { label: t('student.currentAffairs'), value: '—', icon: TrendingUp, color: 'text-purple-600 dark:text-purple-400', iconColor: 'text-purple-600 dark:text-purple-400', bg: 'bg-white dark:bg-[#15171E]', border: 'border-gray-200 dark:border-white/10 shadow-sm' },
    { label: t('student.downloads'), value: '—', icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400', iconColor: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-white dark:bg-[#15171E]', border: 'border-gray-200 dark:border-white/10 shadow-sm' }
  ];

  const activeNavKey = activeTab === 'My Courses' ? 'courses' : activeTab === 'Mentor Connect' ? 'mentor' : activeTab === 'Performance' ? 'performance' : 'dashboard';

  return (
    <StudentPortalShell activeNav={activeNavKey}>
      <div className="flex-1 overflow-y-auto">
        
        {/* Top Bar */}
        <header className="sticky top-0 z-20 bg-white dark:bg-[#121316] backdrop-blur-xl border-b border-gray-200 dark:border-white/10 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-gray-950 dark:text-white font-extrabold text-lg sm:text-xl tracking-tight">
              {activeTab === 'Dashboard' ? `${new Date().getHours() < 12 ? t('student.morning') : new Date().getHours() < 17 ? t('student.afternoon') : t('student.evening')}, ${user?.fullName ? user.fullName.split(' ')[0] : 'Student'} 👋` : activeTab}
            </h1>
            {activeTab === 'Dashboard' && (
              <p className="text-gray-600 dark:text-gray-300 text-xs mt-0.5 font-medium">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/[0.08] dark:hover:bg-white/[0.12] border border-gray-300 dark:border-white/15 text-gray-800 dark:text-white transition-all cursor-pointer"
              aria-label="Toggle Theme"
              title="Toggle Light/Dark Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-gray-800" />}
            </button>
          </div>
        </header>

        <div className="p-4 sm:p-6 max-w-7xl">

          {/* ── Dashboard Tab ── */}
          {activeTab === 'Dashboard' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {stats.map(s => (
                  <div key={s.label} className={`p-4 sm:p-5 rounded-2xl ${s.bg} border ${s.border} flex flex-col justify-between transition-all hover:border-blue-500/50`}>
                    <div className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center mb-2 sm:mb-3">
                      <s.icon className={`w-5 h-5 ${s.iconColor}`} />
                    </div>
                    <div>
                      <p className={`text-2xl sm:text-3xl font-black ${s.color}`}>{s.value}</p>
                      <p className="text-gray-800 dark:text-gray-200 text-xs mt-1 font-bold leading-snug break-words">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Aspirant Achievements & Medals Showcase ── */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#0D111A] border border-gray-200 dark:border-white/10 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-500/25 shrink-0">
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-gray-950 dark:text-white font-extrabold text-base sm:text-lg tracking-tight">
                          Aspirant Achievements & Badges
                        </h2>
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold text-[10px] border border-amber-500/30">
                          {allQuizzes.length > 0 || enrollments.length > 0 ? 'Milestones Active' : 'Begin Journey'}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 text-xs font-medium mt-0.5">
                        Track your academic accomplishments across BPSC Prelims, GS Syllabus & Mains Writing
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('Certificates')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-800 dark:text-white text-xs font-bold transition-all self-start sm:self-center cursor-pointer"
                  >
                    <Award className="w-4 h-4 text-amber-500" />
                    <span>View Credentials</span>
                  </button>
                </div>

                {/* 4 Rich Graphic Milestone Medals */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
                  {/* Badge 1: Prelims Vanguard */}
                  <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-500/10 via-amber-500/[0.02] to-transparent dark:from-amber-500/15 dark:to-transparent border border-amber-500/30 flex flex-col items-center text-center relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-400 via-amber-500 to-amber-600 p-0.5 shadow-md shadow-amber-500/30 mb-2.5 flex items-center justify-center">
                      <div className="w-full h-full rounded-full bg-white dark:bg-[#0D111A] flex items-center justify-center relative">
                        <Trophy className="w-7 h-7 text-amber-500 group-hover:scale-110 transition-transform" />
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 absolute top-0.5 right-0.5 animate-pulse" />
                      </div>
                    </div>
                    <span className="text-gray-950 dark:text-white font-extrabold text-xs">Prelims Vanguard</span>
                    <span className="text-gray-600 dark:text-gray-300 text-[11px] mt-0.5 font-medium">All India Mock Series</span>
                    <div className="mt-3 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-black border border-amber-500/30">
                      {allQuizzes.length > 0 ? `✓ ${allQuizzes.length} Tests Ready` : 'Level 1 Active'}
                    </div>
                  </div>

                  {/* Badge 2: Syllabus Titan */}
                  <div className="p-4 rounded-2xl bg-gradient-to-b from-blue-500/10 via-blue-500/[0.02] to-transparent dark:from-blue-500/15 dark:to-transparent border border-blue-500/30 flex flex-col items-center text-center relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-500 via-indigo-500 to-blue-600 p-0.5 shadow-md shadow-blue-500/30 mb-2.5 flex items-center justify-center">
                      <div className="w-full h-full rounded-full bg-white dark:bg-[#0D111A] flex items-center justify-center relative">
                        <BookOpen className="w-7 h-7 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                        <Star className="w-3.5 h-3.5 text-blue-400 absolute top-0.5 right-0.5" />
                      </div>
                    </div>
                    <span className="text-gray-950 dark:text-white font-extrabold text-xs">Syllabus Titan</span>
                    <span className="text-gray-600 dark:text-gray-300 text-[11px] mt-0.5 font-medium">Foundation Lectures</span>
                    <div className="mt-3 px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 text-[10px] font-black border border-blue-500/30">
                      {enrollments.length > 0 ? `✓ ${enrollments.length} Batches` : 'Aspirant Enrolled'}
                    </div>
                  </div>

                  {/* Badge 3: Mains Craftsman */}
                  <div className="p-4 rounded-2xl bg-gradient-to-b from-purple-500/10 via-purple-500/[0.02] to-transparent dark:from-purple-500/15 dark:to-transparent border border-purple-500/30 flex flex-col items-center text-center relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-purple-600 p-0.5 shadow-md shadow-purple-500/30 mb-2.5 flex items-center justify-center">
                      <div className="w-full h-full rounded-full bg-white dark:bg-[#0D111A] flex items-center justify-center relative">
                        <Target className="w-7 h-7 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
                        <Medal className="w-3.5 h-3.5 text-purple-400 absolute top-0.5 right-0.5" />
                      </div>
                    </div>
                    <span className="text-gray-950 dark:text-white font-extrabold text-xs">Mains Craftsman</span>
                    <span className="text-gray-600 dark:text-gray-300 text-[11px] mt-0.5 font-medium">Answer Writing & Review</span>
                    <div className="mt-3 px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 text-[10px] font-black border border-purple-500/30">
                      Evaluation Desk Ready
                    </div>
                  </div>

                  {/* Badge 4: Verified Aspirant */}
                  <div className="p-4 rounded-2xl bg-gradient-to-b from-emerald-500/10 via-emerald-500/[0.02] to-transparent dark:from-emerald-500/15 dark:to-transparent border border-emerald-500/30 flex flex-col items-center text-center relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-400 via-teal-500 to-emerald-600 p-0.5 shadow-md shadow-emerald-500/30 mb-2.5 flex items-center justify-center">
                      <div className="w-full h-full rounded-full bg-white dark:bg-[#0D111A] flex items-center justify-center relative">
                        <ShieldCheck className="w-7 h-7 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                        <Flame className="w-3.5 h-3.5 text-emerald-400 absolute top-0.5 right-0.5" />
                      </div>
                    </div>
                    <span className="text-gray-950 dark:text-white font-extrabold text-xs">Verified Aspirant</span>
                    <span className="text-gray-600 dark:text-gray-300 text-[11px] mt-0.5 font-medium">BPSC CCE & UPSC Track</span>
                    <div className="mt-3 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-black border border-emerald-500/30">
                      Active Aspirant
                    </div>
                  </div>
                </div>
              </div>

              {/* Helper filtering: Separate video courses from test series */}
              {(() => {
                const isTestSeriesItem = (e: Enrollment) => {
                  if (e.testSeriesSlug) return true;
                  if (e.courseId?.startsWith('ts-') || e.courseId?.startsWith('bpsc-test-series') || e.courseId?.startsWith('bpsc-prelims-pyq') || e.courseId?.includes('test-series')) return true;
                  const cat = (e.category || '').toLowerCase();
                  const title = (e.title || '').toLowerCase();
                  return cat.includes('test series') || title.includes('test series') || title.includes('testing test') || title.includes('test series');
                };

                const lectureCourses = enrollments.filter(e => !isTestSeriesItem(e));

                return (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-gray-950 dark:text-white font-extrabold text-base sm:text-lg">{t('student.myEnrolledCourses')}</h2>
                      <button onClick={() => setActiveTab('My Courses')} className="text-blue-600 dark:text-blue-400 text-xs hover:underline font-bold transition-colors cursor-pointer">{t('student.viewAll')}</button>
                    </div>

                    {loadingEnrollments ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[1, 2].map(i => (
                          <div key={i} className="h-28 rounded-2xl bg-white dark:bg-[#15171E] border border-gray-200 dark:border-white/10 animate-pulse" />
                        ))}
                      </div>
                    ) : lectureCourses.length === 0 ? (
                      <div className="p-8 sm:p-10 rounded-2xl bg-white dark:bg-[#15171E] border border-gray-200 dark:border-white/10 text-center shadow-xs">
                        <BookOpen className="w-10 h-10 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                        <h3 className="text-gray-900 dark:text-white font-bold text-sm mb-1">{t('student.noCoursesYet')}</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-xs mb-4 font-medium">{t('student.noCoursesDesc')}</p>
                        <Link href="/courses" className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-500 transition-all shadow-sm">
                          <BookOpen className="w-3.5 h-3.5" />
                          {t('student.exploreCourses')}
                        </Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {lectureCourses.map(e => (
                          <Link
                            key={e.courseId}
                            href={`/student/course/${e.courseId}`}
                            className="group p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#15171E] border border-gray-200 dark:border-white/10 hover:border-blue-500 dark:hover:border-blue-500 shadow-xs hover:shadow-md transition-all"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm text-white">
                                <BookOpen className="w-5 h-5 text-white" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="text-gray-950 dark:text-white text-sm font-bold truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{e.title}</h3>
                                <p className="text-gray-600 dark:text-gray-300 text-xs mt-0.5 font-medium">{e.category} · {e.duration || 'Ongoing'}</p>
                                <div className="mt-2.5">
                                  <div className="flex justify-between text-xs text-gray-700 dark:text-gray-300 font-semibold mb-1">
                                    <span>Progress</span>
                                    <span className="font-bold text-blue-600 dark:text-blue-400">{e.completionPercentage || 0}%</span>
                                  </div>
                                  <div className="h-2 bg-gray-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                                    <div
                                      className="h-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all"
                                      style={{ width: `${e.completionPercentage || 0}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0 mt-1" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Quick Actions */}
              <div>
                <h2 className="text-gray-950 dark:text-white font-extrabold text-base sm:text-lg mb-4">{t('student.quickActions')}</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: t('student.browseCourses'),  href: '/courses',         icon: BookOpen,  color: 'from-blue-600 to-blue-700' },
                    { label: t('student.testSeries'),     href: '/test-series',     icon: FileText,  color: 'from-amber-600 to-amber-700' },
                    { label: t('student.currentAffairs'), href: '/current-affairs', icon: Zap,       color: 'from-violet-600 to-violet-700' },
                    { label: t('student.downloads'),      href: '/downloads',       icon: Target,    color: 'from-cyan-600 to-cyan-700' }
                  ].map(a => (
                    <Link
                      key={a.label}
                      href={a.href}
                      className="group flex flex-col items-center gap-2.5 p-4 rounded-2xl bg-white dark:bg-[#15171E] border border-gray-200 dark:border-white/10 hover:border-blue-500 hover:shadow-md transition-all text-center"
                    >
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${a.color} flex items-center justify-center shadow-md`}>
                        <a.icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-gray-900 dark:text-white text-xs font-bold leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{a.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── My Courses Tab ── */}
          {activeTab === 'My Courses' && (
            <div className="space-y-4">
              {(() => {
                const isTestSeriesItem = (e: Enrollment) => {
                  if (e.testSeriesSlug) return true;
                  if (e.courseId?.startsWith('ts-') || e.courseId?.startsWith('bpsc-test-series') || e.courseId?.startsWith('bpsc-prelims-pyq') || e.courseId?.includes('test-series')) return true;
                  const cat = (e.category || '').toLowerCase();
                  const title = (e.title || '').toLowerCase();
                  return cat.includes('test series') || title.includes('test series') || title.includes('testing test') || title.includes('test series');
                };

                const lectureCourses = enrollments.filter(e => !isTestSeriesItem(e));

                if (loadingEnrollments) {
                  return (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 rounded-2xl bg-white/[0.04] border border-white/[0.06] animate-pulse" />
                      ))}
                    </div>
                  );
                }

                if (lectureCourses.length === 0) {
                  return (
                    <div className="p-8 sm:p-12 rounded-2xl bg-white dark:bg-[#15171E] border border-gray-200 dark:border-white/10 text-center shadow-xs">
                      <Lock className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                      <h3 className="text-gray-950 dark:text-white font-extrabold text-base mb-2">{t('student.noEnrolledCourses')}</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-6 font-medium">{t('student.noEnrolledDesc')}</p>
                      <Link href="/courses" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold rounded-xl hover:from-blue-500 hover:to-indigo-500 transition-all shadow-md">
                        <BookOpen className="w-4 h-4" />
                        {t('student.browseBPSCPrograms')}
                      </Link>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {lectureCourses.map(e => (
                      <Link key={e.courseId} href={`/student/course/${e.courseId}`} className="group p-5 rounded-2xl bg-white dark:bg-[#15171E] border border-gray-200 dark:border-white/10 hover:border-blue-500 shadow-xs hover:shadow-md transition-all">
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-md text-white">
                            <BookOpen className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-gray-950 dark:text-white font-bold text-sm mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{e.title}</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-xs mb-3 font-medium">{e.category} · Enrolled {new Date(e.enrolledAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</p>
                            <div>
                              <div className="flex justify-between text-xs text-gray-700 dark:text-gray-300 font-semibold mb-1">
                                <span>Progress</span>
                                <span className="font-bold text-blue-600 dark:text-blue-400">{e.completionPercentage || 0}%</span>
                              </div>
                              <div className="h-2 bg-gray-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                                <div
                                  className="h-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all"
                                  style={{ width: `${e.completionPercentage || 0}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                          <div className="flex-1 px-3 py-2 rounded-xl bg-blue-600/10 border border-blue-500/20 text-center">
                            <p className="text-blue-600 dark:text-blue-400 text-xs font-bold">Continue Study →</p>
                          </div>
                          <button
                            type="button"
                            onClick={(ev) => {
                              ev.preventDefault();
                              ev.stopPropagation();
                              generateTaxInvoicePdf({
                                invoiceNumber: `INV-${e.courseId.slice(0, 4).toUpperCase()}-${Date.now().toString().slice(-6)}`,
                                orderId: e.paymentOrderId || `ORD-${Date.now().toString().slice(-8)}`,
                                paymentId: e.paymentId || 'pay_online_verified',
                                date: new Date(e.enrolledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
                                studentName: user?.fullName || 'Aspirant',
                                studentEmail: user?.email,
                                studentMobile: user?.mobile,
                                courseTitle: e.title,
                                category: e.category,
                                amountPaid: Number(e.amountPaid) > 0 ? (Number(e.amountPaid) > 1000 ? Math.round(Number(e.amountPaid) / 100) : Number(e.amountPaid)) : 4999,
                              });
                            }}
                            className="p-2 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-800 dark:text-white border border-gray-300 dark:border-white/15 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                            title="Download Official GST Tax Invoice & Fee Receipt"
                          >
                            <Receipt className="w-3.5 h-3.5 text-amber-500" />
                            <span className="text-xs">Invoice</span>
                          </button>
                        </div>
                      </Link>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* ── Official QR Verified Certificates Tab ── */}
          {activeTab === 'Certificates' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/40 dark:via-[#141519] dark:to-[#141519] border border-amber-500/30 dark:border-amber-500/20 rounded-3xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-black uppercase tracking-wider border border-amber-500/20 mb-2">
                    <Award className="w-3.5 h-3.5" />
                    Verified Credentials Hub
                  </div>
                  <h2 className="text-gray-950 dark:text-white font-black text-xl">Your Course Completion Certificates</h2>
                  <p className="text-gray-700 dark:text-gray-300 text-xs mt-1 font-medium">
                    Download authentic QR-verifiable certificates signed by the Academic Board upon completing programs.
                  </p>
                </div>
              </div>

              {enrollments.length === 0 ? (
                <div className="p-12 rounded-3xl bg-white dark:bg-[#15171E] border border-gray-200 dark:border-white/10 text-center space-y-3 shadow-xs">
                  <Award className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto" />
                  <p className="font-bold text-gray-900 dark:text-white">No Enrolled Courses Found</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300 max-w-sm mx-auto font-medium">
                    Enroll in a program and complete the syllabus to earn your verifiable certificate.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {enrollments.map((enr) => {
                    const isCompleted = (enr.completionPercentage || 0) >= 100;
                    const certId = `FA-${enr.courseId.slice(0, 4).toUpperCase()}-${(user?.id || 'USR').slice(-4).toUpperCase()}-${new Date(enr.enrolledAt).getFullYear()}`;

                    return (
                      <div
                        key={enr.courseId}
                        className="bg-white dark:bg-[#0D111A] border-2 border-amber-500/20 dark:border-amber-500/30 rounded-3xl p-6 space-y-4 hover:border-amber-500/50 transition-all shadow-sm relative overflow-hidden flex flex-col justify-between"
                      >
                        {/* Decorative Gold Seal Watermark */}
                        <div className="absolute -right-4 -bottom-4 w-28 h-28 opacity-5 dark:opacity-10 pointer-events-none">
                          <Award className="w-full h-full text-amber-500" />
                        </div>
                        <div className="space-y-2 relative z-10">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                              {enr.category || 'ACADEMIC PROGRAM'}
                            </span>
                            {isCompleted ? (
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-black">
                                ✓ COMPLETED
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-black">
                                {enr.completionPercentage || 0}% PROGRESS
                              </span>
                            )}
                          </div>

                          <h3 className="text-gray-950 dark:text-white font-bold text-base leading-snug">{enr.title}</h3>
                          <p className="text-gray-600 dark:text-gray-300 text-xs font-medium">
                            Enrolled on: {new Date(enr.enrolledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-gray-200 dark:border-white/10 flex items-center justify-between">
                          <span className="text-xs font-mono text-gray-600 dark:text-gray-400 font-bold">ID: {certId}</span>
                          <button
                            type="button"
                            onClick={() => {
                              generateCourseCertificatePdf({
                                certificateId: certId,
                                studentName: user?.fullName || 'Aspirant',
                                courseTitle: enr.title,
                                category: enr.category,
                                completionDate: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
                                duration: enr.duration,
                              });
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download Certificate (PDF)</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Performance Tab ── */}
          {activeTab === 'Performance' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-gray-950 dark:text-white font-extrabold text-lg">{t('student.performanceAnalytics')}</h2>
                  <p className="text-gray-600 dark:text-gray-300 text-xs mt-0.5 font-medium">{t('student.performanceDesc')}</p>
                </div>
              </div>
              <PerformanceAnalytics accessToken={accessToken || ''} />
            </div>
          )}

          {/* ── Mentor Connect Tab ── */}
          {activeTab === 'Mentor Connect' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-gray-950 dark:text-white font-extrabold text-lg">{t('student.mentorshipPortal')}</h2>
                  <p className="text-gray-600 dark:text-gray-300 text-xs mt-0.5 font-medium">{t('student.mentorshipDesc')}</p>
                </div>
              </div>
              <MentorshipChat courseId={enrollments[0]?.courseId || 'bpsc-foundation'} />
            </div>
          )}

          {/* ── Tests Tab ── */}
          {activeTab === 'Tests' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-gray-950 dark:text-white font-extrabold text-lg">{t('student.testSeries')}</h2>
                  <p className="text-gray-600 dark:text-gray-300 text-xs mt-0.5 font-medium">{t('student.noTestsDesc')}</p>
                </div>
              </div>

              {loadingQuizzes ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-36 rounded-2xl bg-white dark:bg-[#15171E] border border-gray-200 dark:border-white/10 animate-pulse" />
                  ))}
                </div>
              ) : allQuizzes.length === 0 ? (
                <div className="p-10 rounded-2xl bg-white dark:bg-[#15171E] border border-gray-200 dark:border-white/10 text-center space-y-3 shadow-xs">
                  <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto">
                    <FileText className="w-7 h-7 text-amber-500" />
                  </div>
                  <h3 className="text-gray-950 dark:text-white font-bold text-sm">
                    {enrollments.length === 0 ? t('student.noCourseEnrolled') : t('student.noTestsAvailable')}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-xs leading-relaxed max-w-xs mx-auto font-medium">
                    {enrollments.length === 0
                      ? t('student.noCourseTestDesc')
                      : t('student.noTestsDesc')}
                  </p>
                  {enrollments.length === 0 && (
                    <Link href="/courses" className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-500 transition-all shadow-sm">
                      <BookOpen className="w-3.5 h-3.5" />
                      {t('student.browseCourses')}
                    </Link>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {allQuizzes.map(({ quiz, courseTitle, courseId, slug }) => (
                    <div
                      key={quiz.id}
                      className="group p-5 rounded-2xl bg-white dark:bg-[#15171E] border border-gray-200 dark:border-white/10 hover:border-blue-500 hover:shadow-md transition-all space-y-3"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-gray-950 dark:text-white font-bold text-sm leading-tight truncate">{quiz.title}</h3>
                            <p className="text-blue-600 dark:text-blue-400 text-xs font-bold mt-0.5 truncate">{courseTitle}</p>
                          </div>
                        </div>
                        <span className="shrink-0 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase">
                          {t('student.active')}
                        </span>
                      </div>

                      {/* Description */}
                      {quiz.description || quiz.instructions ? (
                        <p className="text-gray-700 dark:text-gray-200 text-xs leading-relaxed line-clamp-2 font-medium">{quiz.description || quiz.instructions}</p>
                      ) : null}

                      {/* Meta */}
                      <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-300 font-semibold">
                        {quiz.timeLimitMins && (
                          <span className="flex items-center gap-1">
                            <span className="w-3.5 h-3.5 inline-block">⏱</span>
                            {quiz.timeLimitMins} mins
                          </span>
                        )}
                      </div>

                      {/* CTA */}
                      <Link
                        href={slug ? `/test-series/${slug}/attempt?quiz=${quiz.id}` : `/student/course/${courseId}/quiz/${quiz.id}`}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                      >
                        <Play className="w-3.5 h-3.5" />
                        {t('student.startTest')}
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </StudentPortalShell>
  );
}

export default function StudentDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0B0E] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <StudentDashboardContent />
    </Suspense>
  );
}
