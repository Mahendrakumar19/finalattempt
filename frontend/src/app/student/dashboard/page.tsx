'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  BookOpen, TrendingUp, FileText, HelpCircle,
  Users, Bell, Award, CheckCircle, Play, LogOut,
  ChevronRight, Sparkles, Search, MessageSquare,
  LayoutDashboard, Settings, Target, Zap, Lock,
  Sun, Moon, Menu, X, Upload
} from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LocaleContext';
import { getMyEnrollments, getCourseQuizzes } from '@/services/auth';
import MentorshipChat from '@/components/lms/MentorshipChat';
import PerformanceAnalytics from '@/components/lms/PerformanceAnalytics';
import StudentPortalShell from '@/components/StudentPortalShell';
import { db } from '@/services/db';

type DashTab = 'Dashboard' | 'My Courses' | 'Performance' | 'Tests' | 'Notes' | 'Mentor Connect' | 'Certificates';

interface Enrollment {
  courseId: string;
  title: string;
  category: string;
  thumbnailUrl?: string;
  duration?: string;
  enrolledAt: string;
  completedLessons?: number;
  totalLessons?: number;
  completionPercentage?: number;
}

function StudentDashboardContent() {
  const { user, accessToken, logout, isLoading, requireAuth } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<DashTab>('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(true);
  const [allQuizzes, setAllQuizzes] = useState<{ quiz: any; courseTitle: string; courseId: string; slug?: string }[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);

  // Sync searchParams ?tab=... to activeTab
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      const decodedTab = tabParam.replace(/\+/g, ' ');
      const validTabs: DashTab[] = ['Dashboard', 'My Courses', 'Performance', 'Tests', 'Notes', 'Mentor Connect', 'Certificates'];
      if (validTabs.includes(decodedTab as DashTab)) {
        setActiveTab(decodedTab as DashTab);
      }
    } else {
      setActiveTab('Dashboard');
    }
  }, [searchParams]);

  // Authentication guard
  useEffect(() => {
    requireAuth('/auth/login/student');
  }, [requireAuth, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{t('student.verifyingSession')}</p>
        </div>
      </div>
    );
  }

  // Fetch enrollments and test series quizzes from backend / DB
  useEffect(() => {
    if (!accessToken) return;

    const load = async () => {
      setLoadingEnrollments(true);
      setLoadingQuizzes(true);

      let fetchedCourseQuizzes: any[] = [];
      const res = await getMyEnrollments(accessToken);
      setLoadingEnrollments(false);

      if (res.success && res.data) {
        setEnrollments(res.data);
        const quizResults = await Promise.all(
          res.data.map(async (e: Enrollment) => {
            const qRes = await getCourseQuizzes(e.courseId, accessToken);
            if (qRes.success && qRes.data && qRes.data.length > 0) {
              return qRes.data.map((quiz: any) => ({ quiz, courseTitle: e.title, courseId: e.courseId }));
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
                return qList.map((quiz: any) => ({
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


  const sidebarLinks: { name: string; icon: any; href?: string; tab?: DashTab }[] = [
    { name: t('student.dashboard'),         icon: LayoutDashboard, tab: 'Dashboard' },
    { name: t('student.myCourses'),         icon: BookOpen,        tab: 'My Courses' },
    { name: t('student.prelims'),           icon: FileText,        href: '/student/prelims' },
    { name: t('student.mains'),             icon: Target,          href: '/student/mains' },
    { name: t('student.uploadMainsCopy'),   icon: Upload,          href: '/student/upload-mains' },
    { name: t('student.resources'),         icon: BookOpen,        href: '/downloads' },
    { name: t('student.mentorConnect'),     icon: MessageSquare,   tab: 'Mentor Connect' },
    { name: t('student.performance'),       icon: TrendingUp,      tab: 'Performance' },
  ];

  const stats = [
    { label: t('student.coursesEnrolled'), value: enrollments.length || 0, icon: BookOpen, color: 'text-blue-600 dark:text-blue-400', iconColor: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-500/20' },
    { label: t('student.testsAttempted'), value: allQuizzes.length || 0, icon: FileText, color: 'text-amber-600 dark:text-amber-400', iconColor: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/20' },
    { label: t('student.currentAffairs'), value: '—', icon: TrendingUp, color: 'text-violet-600 dark:text-violet-400', iconColor: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-500/10', border: 'border-violet-200 dark:border-violet-500/20' },
    { label: t('student.downloads'), value: '—', icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400', iconColor: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20' }
  ];

  const activeNavKey = activeTab === 'My Courses' ? 'courses' : activeTab === 'Mentor Connect' ? 'mentor' : activeTab === 'Performance' ? 'performance' : 'dashboard';

  return (
    <StudentPortalShell activeNav={activeNavKey}>
      <div className="flex-1 overflow-y-auto">
        
        {/* Top Bar */}
        <header className="sticky top-0 z-20 bg-white dark:bg-slate-950/90 backdrop-blur-xl border-b border-slate-200 dark:border-white/[0.06] px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-slate-900 dark:text-white font-bold text-lg">
              {activeTab === 'Dashboard' ? `${new Date().getHours() < 12 ? t('student.morning') : new Date().getHours() < 17 ? t('student.afternoon') : t('student.evening')}, ${user?.fullName ? user.fullName.split(' ')[0] : 'Student'} 👋` : activeTab}
            </h1>
            {activeTab === 'Dashboard' && (
              <p className="text-slate-500 dark:text-slate-500 text-xs mt-0.5">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/[0.08] transition-all cursor-pointer"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-500" />}
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
                  <div key={s.label} className={`p-3.5 sm:p-4 rounded-2xl ${s.bg} border ${s.border} backdrop-blur-xs flex flex-col justify-between`}>
                    <div className={`w-8 h-8 rounded-xl ${s.bg} border ${s.border} flex items-center justify-center mb-2 sm:mb-3`}>
                      <s.icon className={`w-4 h-4 ${s.iconColor}`} />
                    </div>
                    <div>
                      <p className={`text-xl sm:text-2xl font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-slate-600 dark:text-slate-400 text-[11px] sm:text-xs mt-0.5 font-medium leading-snug break-words">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Enrolled Courses */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-slate-900 dark:text-white font-bold text-base">{t('student.myEnrolledCourses')}</h2>
                  <button onClick={() => setActiveTab('My Courses')} className="text-blue-600 dark:text-blue-400 text-xs hover:text-blue-500 dark:hover:text-blue-300 font-medium transition-colors">{t('student.viewAll')}</button>
                </div>

                {loadingEnrollments ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2].map(i => (
                      <div key={i} className="h-28 rounded-2xl bg-white/[0.04] border border-white/[0.06] animate-pulse" />
                    ))}
                  </div>
                ) : enrollments.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] text-center">
                    <BookOpen className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
                    <h3 className="text-slate-700 dark:text-slate-300 font-semibold text-sm mb-1">{t('student.noCoursesYet')}</h3>
                    <p className="text-slate-500 text-xs mb-4">{t('student.noCoursesDesc')}</p>
                    <Link href="/courses" className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-500 transition-all">
                      <BookOpen className="w-3.5 h-3.5" />
                      {t('student.exploreCourses')}
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {enrollments.map(e => (
                      <Link
                        key={e.courseId}
                        href={`/student/course/${e.courseId}`}
                        className="course-card-premium group p-4 rounded-3xl"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shrink-0">
                            <BookOpen className="w-5 h-5 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-slate-900 dark:text-white text-sm font-semibold truncate group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">{e.title}</h3>
                            <p className="text-slate-500 text-xs mt-0.5">{e.category} · {e.duration || 'Ongoing'}</p>
                            {/* Progress bar (Real DB metrics) */}
                            <div className="mt-2.5">
                              <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                                <span>Progress</span>
                                <span>{e.completionPercentage || 0}%</span>
                              </div>
                              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all"
                                  style={{ width: `${e.completionPercentage || 0}%` }}
                                />
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors shrink-0 mt-1" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div>
                <h2 className="text-slate-900 dark:text-white font-bold text-base mb-4">{t('student.quickActions')}</h2>
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
                      className="group flex flex-col items-center gap-2.5 p-4 rounded-2xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.07] hover:border-slate-300 dark:hover:border-white/[0.12] transition-all text-center"
                    >
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${a.color} flex items-center justify-center shadow-lg`}>
                        <a.icon className="w-5 h-5 text-white" />
                      </div>
                    <span className="text-slate-600 dark:text-slate-300 text-[11px] font-medium leading-tight group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{a.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── My Courses Tab ── */}
          {activeTab === 'My Courses' && (
            <div className="space-y-4">
              {loadingEnrollments ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 rounded-2xl bg-white/[0.04] border border-white/[0.06] animate-pulse" />
                  ))}
                </div>
              ) : enrollments.length === 0 ? (
                <div className="p-12 rounded-2xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] text-center">
                  <Lock className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
                  <h3 className="text-slate-800 dark:text-slate-200 font-bold text-base mb-2">{t('student.noEnrolledCourses')}</h3>
                  <p className="text-slate-500 text-sm mb-6">{t('student.noEnrolledDesc')}</p>
                  <Link href="/courses" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold rounded-xl hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg shadow-blue-900/30">
                    <BookOpen className="w-4 h-4" />
                    {t('student.browseBPSCPrograms')}
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {enrollments.map(e => (
                    <Link key={e.courseId} href={`/student/course/${e.courseId}`} className="course-card-premium group p-5 rounded-3xl">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg">
                          <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-slate-900 dark:text-white font-semibold text-sm mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">{e.title}</h3>
                          <p className="text-slate-500 text-xs mb-3">{e.category} · Enrolled {new Date(e.enrolledAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</p>
                          <div>
                            <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                              <span>Progress</span>
                              <span>{e.completionPercentage || 0}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all"
                                style={{ width: `${e.completionPercentage || 0}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-2">
                        <div className="flex-1 px-3 py-2 rounded-xl bg-blue-600/10 border border-blue-500/20 text-center">
                          <p className="text-blue-400 text-[11px] font-bold">Continue →</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Placeholder Tab (Certificates only) ── */}
          {activeTab === 'Certificates' && (
            <div className="flex flex-col items-center justify-center min-h-64 text-center gap-4 p-8 rounded-2xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06]">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/20 flex items-center justify-center">
                <Award className="w-7 h-7 text-yellow-400" />
              </div>
              <h2 className="text-slate-900 dark:text-white font-bold text-base">{t('student.certificates')}</h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm max-w-xs">
                {t('student.certificatesDesc')}
              </p>
              <div className="px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
                {t('student.comingSoon')}
              </div>
            </div>
          )}

          {/* ── Performance Tab ── */}
          {activeTab === 'Performance' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-slate-900 dark:text-white font-bold text-base">{t('student.performanceAnalytics')}</h2>
                  <p className="text-slate-500 text-xs mt-0.5">{t('student.performanceDesc')}</p>
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
                  <h2 className="text-slate-900 dark:text-white font-bold text-base">{t('student.mentorshipPortal')}</h2>
                  <p className="text-slate-500 text-xs mt-0.5">{t('student.mentorshipDesc')}</p>
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
                  <h2 className="text-slate-900 dark:text-white font-bold text-base">{t('student.testSeries')}</h2>
                  <p className="text-slate-500 text-xs mt-0.5">{t('student.noTestsDesc')}</p>
                </div>
              </div>

              {loadingQuizzes ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-36 rounded-2xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] animate-pulse" />
                  ))}
                </div>
              ) : allQuizzes.length === 0 ? (
                <div className="p-10 rounded-2xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] text-center space-y-3">
                  <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto">
                    <FileText className="w-7 h-7 text-amber-500" />
                  </div>
                  <h3 className="text-slate-900 dark:text-white font-bold text-sm">
                    {enrollments.length === 0 ? t('student.noCourseEnrolled') : t('student.noTestsAvailable')}
                  </h3>
                  <p className="text-slate-500 text-xs leading-relaxed max-w-xs mx-auto">
                    {enrollments.length === 0
                      ? t('student.noCourseTestDesc')
                      : t('student.noTestsDesc')}
                  </p>
                  {enrollments.length === 0 && (
                    <Link href="/courses" className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-500 transition-all">
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
                      className="group p-5 rounded-2xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] hover:border-blue-300 dark:hover:border-blue-500/30 hover:shadow-md transition-all space-y-3"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-slate-900 dark:text-white font-semibold text-sm leading-tight truncate">{quiz.title}</h3>
                            <p className="text-blue-600 dark:text-blue-400 text-[10px] font-medium mt-0.5 truncate">{courseTitle}</p>
                          </div>
                        </div>
                        <span className="shrink-0 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[9px] font-bold uppercase">
                          {t('student.active')}
                        </span>
                      </div>

                      {/* Description */}
                      {quiz.description || quiz.instructions ? (
                        <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">{quiz.description || quiz.instructions}</p>
                      ) : null}

                      {/* Meta */}
                      <div className="flex items-center gap-4 text-[10px] text-slate-500 font-medium">
                        {quiz.timeLimitMins && (
                          <span className="flex items-center gap-1">
                            <span className="w-3.5 h-3.5 inline-block">⏱</span>
                            {quiz.timeLimitMins} mins
                          </span>
                        )}
                        {quiz.passingScore && (
                          <span className="flex items-center gap-1">
                            <span className="w-3.5 h-3.5 inline-block">🎯</span>
                            Pass: {quiz.passingScore}%
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <StudentDashboardContent />
    </Suspense>
  );
}
