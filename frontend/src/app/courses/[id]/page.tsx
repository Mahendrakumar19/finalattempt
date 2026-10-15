import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { db } from '@/services/db';
import CourseTabs from './CourseTabs';
import EnrollmentCard from './EnrollmentCard';

interface ExtendedCourse {
  courseFormat?: string;
  originalPrice?: string | number;
  discount?: string | number;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const course = await db.getCourseById(id);
    if (course) {
      const title = `${course.title} — UPSC & State PCS Course`;
      const description = course.description || `Enroll in ${course.title} at Final Attempt. Comprehensive coverage, test series, and mentorship for civil services.`;
      const url = `https://finalattemptias.com/courses/${course.id}`;
      const image = course.thumbnailUrl || '/og-image.jpg';

      return {
        title,
        description,
        alternates: { canonical: url },
        openGraph: {
          title,
          description,
          url,
          siteName: 'Final Attempt',
          images: [{ url: image, alt: course.title }],
          type: 'website',
          locale: 'en_IN',
        },
        twitter: {
          card: 'summary_large_image',
          title,
          description,
          images: [image],
        },
      };
    }
  } catch (err) {
    console.error('Failed to generate course metadata:', err);
  }
  return {
    title: 'Course Details | Final Attempt',
    description: 'Explore comprehensive mentorship and courses for UPSC & State PCS at Final Attempt.',
  };
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { id } = await params;
  const course = await db.getCourseById(id);

  if (!course) {
    notFound();
  }

  // Find relevant faculty members for the course
  const allFaculty = await db.getFaculty();
  const courseFaculty = (allFaculty || []).slice(0, 3); // Map mock mentors

  const cleanPrice = String(course.fee || '0').replace(/[^\d]/g, '');

  const courseSchema = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    'name': course.title,
    'description': course.description || `Comprehensive UPSC & State PCS course by Final Attempt.`,
    'provider': {
      '@type': 'Organization',
      'name': 'Final Attempt',
      'sameAs': 'https://finalattemptias.com'
    },
    'offers': {
      '@type': 'Offer',
      'category': 'Paid',
      'price': cleanPrice || '0',
      'priceCurrency': 'INR',
      'availability': 'https://schema.org/InStock'
    }
  };

  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Schema.org Course Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseSchema) }}
      />
      {/* Back button */}
      <Link href="/courses" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Courses</span>
      </Link>

      {/* Hero Header */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-6">
          {course.thumbnailUrl && (
            <div className="w-full h-56 sm:h-72 bg-slate-950 rounded-3xl overflow-hidden relative border border-slate-200/80 shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={course.thumbnailUrl}
                alt={course.title}
                className="w-full h-full object-contain p-2"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-800 text-[10px] font-bold uppercase tracking-wider">
              {course.category || 'BPSC'} Program
            </div>
            {((course as ExtendedCourse).courseFormat === 'live' || course.title?.toLowerCase().includes('live') || course.description?.toLowerCase().includes('live')) ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-black uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
                Live Interactive Batch
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-black uppercase tracking-wider">
                📼 Complete Recorded Course
              </div>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-heading font-extrabold text-brand-primary leading-tight">
            {course.title}
          </h1>
          <p className="text-slate-600 text-sm leading-relaxed max-w-xl">
            {course.description || 'Comprehensive mentorship program for UPSC & State PCS aspirants with complete GS coverage, test series, and answer writing evaluation.'}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-4 border-t border-slate-100 max-w-lg">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Duration</span>
              <p className="text-sm font-extrabold text-slate-900">{course.duration}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Format</span>
              <p className="text-sm font-extrabold text-slate-900">
                {((course as ExtendedCourse).courseFormat === 'live' || course.title?.toLowerCase().includes('live'))
                  ? '🔴 Live + Recorded Backups' 
                  : (course.schedule || 'Self-Paced Recorded')}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Fee Structure</span>
              <p className="text-sm font-extrabold text-blue-600">
                {(() => {
                  const strFee = String(course.fee).trim();
                  if (strFee.startsWith('₹')) return strFee;
                  const numFee = parseInt(strFee.replace(/[^\d]/g, ''), 10);
                  if (numFee && !isNaN(numFee)) return `₹${numFee.toLocaleString('en-IN')}`;
                  return strFee;
                })()}
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-lg space-y-6 lg:sticky lg:top-24">
          <EnrollmentCard 
            courseId={String(course.id)} 
            fee={String(course.fee)} 
            originalPrice={(course as ExtendedCourse).originalPrice}
            discount={(course as ExtendedCourse).discount != null ? String((course as ExtendedCourse).discount) : undefined}
          />

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
