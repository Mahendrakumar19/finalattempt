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
  Calendar, HelpCircle, ShieldAlert, Sparkles, Layers, Compass,
  Gift, Bell
} from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/context/LocaleContext';
import { getMyEnrollments, getCourseQuizzes } from '@/services/auth';
import MentorshipChat from '@/components/lms/MentorshipChat';
import PerformanceAnalytics from '@/components/lms/PerformanceAnalytics';
import StudentPortalShell from '@/components/StudentPortalShell';
import StudyStreakHeatmap from '@/components/StudyStreakHeatmap';
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{t('student.verifyingSession')}</p>
        </div>
      </div>
    );
  }

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
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">

          {/* ── PW Style Content Subheader (Breadcrumb + Gifts/Notification Actions) ── */}
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <span className="text-slate-900 dark:text-white font-extrabold text-xl tracking-tight">
                {activeTab === 'Dashboard' ? 'Study' : activeTab}
              </span>
              {activeTab !== 'Dashboard' && (
                <>
                  <span className="text-slate-400">/</span>
                  <button
                    onClick={() => setActiveTab('Dashboard')}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    ← Back to Study
                  </button>
                </>
              )}
            </div>

            {/* Gift & Bell Quick Icons (PW Header Alignment) */}
            <div className="flex items-center gap-2">
              <Link
                href="/student/dashboard?tab=Performance"
                className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-[#141519] border border-slate-200/90 dark:border-white/10 hover:border-amber-400 dark:hover:border-amber-400/50 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-all shadow-xs"
                title="Daily Study Streak & Rewards"
              >
                <Gift className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
              <button
                onClick={() => setActiveTab('Dashboard')}
                className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-[#141519] border border-slate-200/90 dark:border-white/10 hover:border-indigo-400 dark:hover:border-indigo-400/50 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all shadow-xs relative cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-[#141519]" />
              </button>
            </div>
          </div>

          {/* ── Dashboard Tab ── */}
          {activeTab === 'Dashboard' && (
            <div className="space-y-7">
              
              {/* BATCH OFFERINGS (Signature PW Quick Access Grid) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-slate-900 dark:text-white font-extrabold text-lg tracking-tight">
                    Batch Offerings
                  </h2>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Quick Navigation
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {/* Card 1: All Classes */}
                  <Link
                    href="/student/dashboard?tab=My+Courses"
                    className="p-4 rounded-2xl bg-white dark:bg-[#141519] border border-slate-200/90 dark:border-white/10 hover:border-blue-500/60 dark:hover:border-blue-500/50 hover:shadow-md transition-all flex items-center justify-between group cursor-pointer shadow-xs"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-500/15 border border-blue-200/70 dark:border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 group-hover:scale-105 transition-transform">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          All Classes
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">
                          Lectures & Batches
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </Link>

                  {/* Card 2: All Tests */}
                  <Link
                    href="/student/prelims"
                    className="p-4 rounded-2xl bg-white dark:bg-[#141519] border border-slate-200/90 dark:border-white/10 hover:border-indigo-500/60 dark:hover:border-indigo-500/50 hover:shadow-md transition-all flex items-center justify-between group cursor-pointer shadow-xs"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-200/70 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 group-hover:scale-105 transition-transform font-black text-sm">
                        A+
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          All Tests
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">
                          Prelims & Mock Series
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </Link>

                  {/* Card 3: My Doubts */}
                  <Link
                    href="/student/dashboard?tab=Mentor+Connect"
                    className="p-4 rounded-2xl bg-white dark:bg-[#141519] border border-slate-200/90 dark:border-white/10 hover:border-purple-500/60 dark:hover:border-purple-500/50 hover:shadow-md transition-all flex items-center justify-between group cursor-pointer shadow-xs"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-purple-50 dark:bg-purple-500/15 border border-purple-200/70 dark:border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0 group-hover:scale-105 transition-transform">
                        <HelpCircle className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                          My Doubts
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">
                          Ask Faculty & Mentors
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </Link>

                  {/* Card 4: Mains Evaluation (Test Pass) */}
                  <Link
                    href="/student/upload-mains"
                    className="p-4 rounded-2xl bg-white dark:bg-[#141519] border border-slate-200/90 dark:border-white/10 hover:border-amber-500/60 dark:hover:border-amber-500/50 hover:shadow-md transition-all flex items-center justify-between group cursor-pointer shadow-xs"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-500/15 border border-amber-200/70 dark:border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                          Mains Test Pass
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">
                          Answer Evaluation
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-amber-600 dark:group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </Link>

                  {/* Card 5: Khazana (Vault) */}
                  <Link
                    href="/downloads"
                    className="p-4 rounded-2xl bg-white dark:bg-[#141519] border border-slate-200/90 dark:border-white/10 hover:border-amber-500/60 dark:hover:border-amber-500/50 hover:shadow-md transition-all flex items-center justify-between group cursor-pointer shadow-xs"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-500/15 border border-amber-200/70 dark:border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                          Khazana
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">
                          Toppers Notes & Handouts
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-amber-600 dark:group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </Link>

                  {/* Card 6: Infinite Practice */}
                  <Link
                    href="/pyqs"
                    className="p-4 rounded-2xl bg-white dark:bg-[#141519] border border-slate-200/90 dark:border-white/10 hover:border-emerald-500/60 dark:hover:border-emerald-500/50 hover:shadow-md transition-all flex items-center justify-between group cursor-pointer shadow-xs"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200/70 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
                        <Target className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          Infinite Practice
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">
                          BPSC & UPSC PYQ Bank
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </Link>

                  {/* Card 7: Daily Current Affairs */}
                  <Link
                    href="/current-affairs"
                    className="p-4 rounded-2xl bg-white dark:bg-[#141519] border border-slate-200/90 dark:border-white/10 hover:border-rose-500/60 dark:hover:border-rose-500/50 hover:shadow-md transition-all flex items-center justify-between group cursor-pointer shadow-xs"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200/70 dark:border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0 group-hover:scale-105 transition-transform">
                        <Zap className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                          Daily Affairs
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">
                          The Hindu & PIB Curated
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-rose-600 dark:group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </Link>

                  {/* Card 8: Performance Analytics */}
                  <Link
                    href="/student/dashboard?tab=Performance"
                    className="p-4 rounded-2xl bg-white dark:bg-[#141519] border border-slate-200/90 dark:border-white/10 hover:border-cyan-500/60 dark:hover:border-cyan-500/50 hover:shadow-md transition-all flex items-center justify-between group cursor-pointer shadow-xs"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-cyan-50 dark:bg-cyan-500/15 border border-cyan-200/70 dark:border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0 group-hover:scale-105 transition-transform">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                          My Analytics
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">
                          Rank, Accuracy & Tests
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-cyan-500 dark:group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </Link>
                </div>
              </div>

              {/* 3. UPCOMING EVENTS (Exact PW style schedule card) */}
              <div className="space-y-3">
                <h2 className="text-slate-900 dark:text-white font-extrabold text-lg tracking-tight">
                  Upcoming Events (0)
                </h2>
                <div className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-[#141519] border border-slate-200 dark:border-white/10 flex flex-col items-center justify-center text-center space-y-4 shadow-xs">
                  <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <span>Today&apos;s live events have ended</span>
                  </div>
                  <Link
                    href="/courses"
                    className="px-6 py-2.5 rounded-xl border border-indigo-600/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-xs font-bold transition-all shadow-xs"
                  >
                    View Weekly Schedule
                  </Link>
                </div>
              </div>

              {/* 4. Daily Study Streak & Attendance Heatmap */}
              <StudyStreakHeatmap completedDates={enrollments.map(e => e.enrolledAt)} />

              {/* 5. Quick Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {stats.map(s => (
                  <div key={s.label} className={`p-3.5 sm:p-4 rounded-2xl ${s.bg} border ${s.border} backdrop-blur-xs flex flex-col justify-between shadow-xs`}>
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
                      <h2 className="text-slate-900 dark:text-white font-bold text-base">{t('student.myEnrolledCourses')}</h2>
                      <button onClick={() => setActiveTab('My Courses')} className="text-blue-600 dark:text-blue-400 text-xs hover:text-blue-500 dark:hover:text-blue-300 font-medium transition-colors">{t('student.viewAll')}</button>
                    </div>

                    {loadingEnrollments ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[1, 2].map(i => (
                          <div key={i} className="h-28 rounded-2xl bg-white/[0.04] border border-white/[0.06] animate-pulse" />
                        ))}
                      </div>
                    ) : lectureCourses.length === 0 ? (
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
                        {lectureCourses.map(e => (
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
                );
              })()}

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
                    <div className="p-12 rounded-2xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] text-center">
                      <Lock className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
                      <h3 className="text-slate-800 dark:text-slate-200 font-bold text-base mb-2">{t('student.noEnrolledCourses')}</h3>
                      <p className="text-slate-500 text-sm mb-6">{t('student.noEnrolledDesc')}</p>
                      <Link href="/courses" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold rounded-xl hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg shadow-blue-900/30">
                        <BookOpen className="w-4 h-4" />
                        {t('student.browseBPSCPrograms')}
                      </Link>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {lectureCourses.map(e => (
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
                            <p className="text-blue-400 text-[11px] font-bold">Continue Study →</p>
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
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                            title="Download Official GST Tax Invoice & Fee Receipt"
                          >
                            <Receipt className="w-3.5 h-3.5 text-amber-400" />
                            <span className="text-[10px]">Invoice</span>
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
              <div className="bg-gradient-to-r from-amber-500/10 via-slate-100 to-slate-100 dark:from-amber-950/40 dark:via-[#141519] dark:to-[#141519] border border-amber-500/30 dark:border-amber-500/20 rounded-3xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider border border-amber-500/20 mb-2">
                    <Award className="w-3.5 h-3.5" />
                    Verified Credentials Hub
                  </div>
                  <h2 className="text-slate-900 dark:text-white font-extrabold text-lg sm:text-xl">Your Course Completion Certificates</h2>
                  <p className="text-slate-600 dark:text-slate-400 text-xs mt-1">
                    Download authentic QR-verifiable certificates signed by the Academic Board upon completing programs.
                  </p>
                </div>
              </div>

              {enrollments.length === 0 ? (
                <div className="p-12 rounded-3xl bg-white dark:bg-[#141519] border border-slate-200 dark:border-white/10 text-center space-y-3 shadow-xs">
                  <Award className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto" />
                  <p className="font-bold text-slate-800 dark:text-slate-200">No Enrolled Courses Found</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
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
                        className="bg-white dark:bg-[#141519] border border-slate-200/90 dark:border-white/10 rounded-3xl p-6 space-y-4 hover:border-amber-500/50 transition-all shadow-xs dark:shadow-md flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                              {enr.category || 'ACADEMIC PROGRAM'}
                            </span>
                            {isCompleted ? (
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-black">
                                ✓ COMPLETED
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px] font-black">
                                {enr.completionPercentage || 0}% PROGRESS
                              </span>
                            )}
                          </div>

                          <h3 className="text-slate-900 dark:text-white font-bold text-base leading-snug">{enr.title}</h3>
                          <p className="text-slate-500 dark:text-slate-400 text-xs">
                            Enrolled on: {new Date(enr.enrolledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">ID: {certId}</span>
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
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
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
