'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  BookOpen, Play, CheckCircle, ChevronLeft, 
  MessageSquare, HelpCircle, FileText, Sparkles 
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/services/db';

interface CourseDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function StudentCourseDetailPage({ params }: CourseDetailPageProps) {
  const resolvedParams = use(params);
  const courseId = resolvedParams.id;
  const router = useRouter();
  const { accessToken } = useAuth();
  
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const c = await db.getCourseById(courseId);
      setCourse(c);
      setLoading(false);
    };
    load();
  }, [courseId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-xs">Loading course details...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6">
        <h2 className="text-lg font-bold">Course Not Found</h2>
        <p className="text-slate-500 text-xs mt-1 mb-4">The course you are looking for does not exist or has been removed.</p>
        <Link href="/student/dashboard" className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">
          Back to Portal
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-body">
      {/* Top Header */}
      <header className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur-xl border-b border-white/[0.06] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/student/dashboard" className="p-2 bg-white/[0.04] border border-white/[0.06] rounded-xl hover:bg-white/[0.08] transition-all">
            <ChevronLeft className="w-4 h-4 text-slate-400" />
          </Link>
          <div>
            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Student Portal</span>
            <h1 className="text-white font-bold text-sm mt-0.5">{course.title}</h1>
          </div>
        </div>
      </header>

      <div className="p-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course Syllabus & Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 space-y-4">
            <h2 className="text-white font-bold text-base">Course Curriculum</h2>
            <p className="text-slate-400 text-xs leading-relaxed">
              Complete each lesson sequence, take mini mock-tests, and verify concepts dynamically to unlock certificate programs.
            </p>
            
            <div className="pt-4 text-center py-8 bg-slate-950/40 rounded-2xl border border-white/5">
              <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 text-xs font-semibold">Study Syllabus Active</p>
              <p className="text-slate-500 text-[10px] max-w-xs mx-auto mt-1">
                Course lessons, syllabus tracker, and video material lists are auto-syncing with the student portal.
              </p>
            </div>
          </div>
        </div>

        {/* Side Actions & Mentors */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 space-y-4">
            <h3 className="text-white font-bold text-sm">Course Progress</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-400 font-semibold">
                <span>Completed</span>
                <span>25%</span>
              </div>
              <div className="h-2 bg-slate-850 rounded-full overflow-hidden">
                <div className="h-full w-1/4 bg-blue-500 rounded-full" />
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 space-y-2.5">
              <Link 
                href={`/student/course/${courseId}/quiz/q-bpsc-foundation-1`}
                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-650 hover:bg-blue-600 text-white font-bold rounded-xl text-xs transition-all"
              >
                <HelpCircle className="w-4 h-4" />
                <span>Start Practice Quiz</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
