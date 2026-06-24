import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, BookOpen, Clock, Calendar, CheckCircle, HelpCircle, Play, DollarSign } from 'lucide-react';
import { db, faculty } from '@/services/db';
import CourseTabs from './CourseTabs';

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const course = await db.getCourseById(id);

  if (!course) {
    notFound();
  }

  // Find relevant faculty members for the course
  const courseFaculty = faculty.slice(0, 3); // Map mock mentors

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Back button */}
      <Link href="/courses" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Courses</span>
      </Link>

      {/* Hero Header */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-800 text-[10px] font-bold uppercase tracking-wider">
            {course.category} Program
          </div>
          <h1 className="text-3xl sm:text-4xl font-heading font-extrabold text-brand-primary leading-tight">
            {course.title}
          </h1>
          <p className="text-slate-600 text-sm leading-relaxed max-w-xl">
            {course.description}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-4 border-t border-slate-100 max-w-lg">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Duration</span>
              <p className="text-sm font-extrabold text-slate-900">{course.duration}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Format</span>
              <p className="text-sm font-extrabold text-slate-900">Hybrid (Patna + Online)</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Fee Structure</span>
              <p className="text-sm font-extrabold text-blue-600">{course.fee}</p>
            </div>
          </div>
        </div>

        {/* Pricing / Booking Card */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-lg space-y-6 lg:sticky lg:top-24">
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Course Fees</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-brand-primary">{course.fee}</span>
              <span className="text-xs text-slate-400 font-medium">Bilingual material included</span>
            </div>
          </div>

          <div className="space-y-3">
            <Link
              href={`/contact?enquiry=${course.id}`}
              className="w-full inline-flex items-center justify-center px-4 py-3 bg-brand-secondary text-white font-bold rounded-xl text-xs hover:bg-blue-800 transition-colors shadow-md shadow-blue-500/10 text-center"
            >
              Enroll / Check Syllabus
            </Link>
            <Link
              href="/contact?enquiry=general"
              className="w-full inline-flex items-center justify-center px-4 py-3 bg-slate-50 text-slate-700 font-bold border border-slate-200 rounded-xl text-xs hover:bg-slate-100 transition-colors text-center"
            >
              Request Call Back
            </Link>
          </div>

          <div className="space-y-3.5 pt-4 border-t border-slate-100">
            <div className="flex gap-2.5 text-xs text-slate-500">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>Full Access to mock tests and video recordings</span>
            </div>
            <div className="flex gap-2.5 text-xs text-slate-500">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>Weekly 1-on-1 performance review with Selected Officer</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs containing Overview, Syllabus, Faculty, Demo and FAQ */}
      <CourseTabs course={course} faculty={courseFaculty} />
    </div>
  );
}
