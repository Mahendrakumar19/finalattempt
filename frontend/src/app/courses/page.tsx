'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { Search, SlidersHorizontal, BookOpen, Clock, Calendar, ChevronDown } from 'lucide-react';
import { db } from '@/services/db';
import { courseData } from '@/services/seedData';
import { useTranslation } from '@/context/LocaleContext';

import { useSearchParams, useRouter } from 'next/navigation';

type CategoryType = 'All' | 'Prelims' | 'Mains' | 'Interview';
type ExamType = 'All' | 'BPSC' | 'Arunachal PCS';

function CoursesContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCat = (searchParams.get('category') as CategoryType) || 'All';
  const initialExam = (searchParams.get('exam') as ExamType) || 'All';

  const [selectedExam, setSelectedExam] = useState<ExamType>(initialExam);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>(initialCat);
  const [searchQuery, setSearchQuery] = useState('');
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const [hoveredCourseId, setHoveredCourseId] = useState<string | null>(null);

  const toggleFlip = (id: string) => {
    setFlippedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    const cat = searchParams.get('category') as CategoryType;
    const ex = searchParams.get('exam') as ExamType;
    if (cat) setSelectedCategory(cat);
    if (ex) setSelectedExam(ex);
  }, [searchParams]);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const c = await db.getCourses();
        if (c) {
          setCoursesList(c);
        }
      } catch (err) {
        console.error('Failed loading courses:', err);
      }
    };
    loadCourses();
  }, []);

  const exams: ExamType[] = ['All', 'BPSC', 'Arunachal PCS'];
  const categories: CategoryType[] = ['All', 'Prelims', 'Mains', 'Interview'];

  const filteredCourses = coursesList.filter(course => {
    const matchesExam = selectedExam === 'All' || 
      (course.exam && course.exam.toLowerCase().includes(selectedExam.toLowerCase())) ||
      (course.title && course.title.toLowerCase().includes(selectedExam.toLowerCase())) ||
      (selectedExam === 'BPSC' && (!course.exam || course.title.includes('BPSC')));

    const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
    const matchesSearch = (course.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (course.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesExam && matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-16 space-y-10 font-body">
      {/* Page Header */}
      <div className="space-y-4">
        <h1 className="text-3xl sm:text-4xl font-heading font-extrabold text-brand-primary tracking-tight">
          {t('courses.subtitle')}
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm max-w-xl">
          {t('courses.personalizedDesc')}
        </p>
      </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-[var(--card-bg)] p-5 rounded-3xl border border-[var(--card-border)] shadow-xs">
          {/* Search */}
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl outline-none text-[var(--text-color)] focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-center">
            {/* Exam Dropdown */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900/60 px-3.5 py-2 rounded-2xl border border-[var(--card-border)] w-full sm:w-auto shadow-xs">
              <label htmlFor="exam-select" className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 shrink-0">
                Exam:
              </label>
              <div className="relative flex-1 sm:flex-none">
                <select
                  id="exam-select"
                  value={selectedExam}
                  onChange={(e) => setSelectedExam(e.target.value as ExamType)}
                  className="w-full sm:w-40 appearance-none bg-transparent pr-7 pl-1 text-xs font-extrabold text-[var(--text-color)] outline-none cursor-pointer"
                >
                  {exams.map((ex) => (
                    <option key={ex} value={ex} className="bg-[var(--card-bg)] text-[var(--text-color)] font-extrabold py-1">
                      {ex === 'All' ? 'All State Exams' : ex}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Stage Category Dropdown */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900/60 px-3.5 py-2 rounded-2xl border border-[var(--card-border)] w-full sm:w-auto shadow-xs">
              <label htmlFor="stage-select" className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 shrink-0">
                Stage:
              </label>
              <div className="relative flex-1 sm:flex-none">
                <select
                  id="stage-select"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as CategoryType)}
                  className="w-full sm:w-36 appearance-none bg-transparent pr-7 pl-1 text-xs font-extrabold text-[var(--text-color)] outline-none cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat} className="bg-[var(--card-bg)] text-[var(--text-color)] font-extrabold py-1">
                      {cat === 'All' ? 'All Stages' : cat}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Courses Grid */}
        {filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((course) => {
              const isFlipped = Boolean(flippedCards[course.id] || hoveredCourseId === course.id);

              return (
                <div
                  key={course.id}
                  style={{ minHeight: course.thumbnailUrl ? '390px' : '260px' }}
                  className={`flip-card-container cursor-pointer relative ${isFlipped ? 'is-flipped' : ''}`}
                  onClick={() => {
                    window.location.href = `/courses/${course.id}`;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      window.location.href = `/courses/${course.id}`;
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Course: ${course.title}. Click to view details.`}
                >
                  {/* Static 2D Hit Area Overlay */}
                  <div
                    className="absolute inset-0 z-10 pointer-events-auto rounded-2xl"
                    onMouseEnter={() => setHoveredCourseId(course.id)}
                    onMouseLeave={() => setHoveredCourseId(null)}
                  />

                  <div className="flip-card-inner">
                  {/* Front Side */}
                  <div className="flip-card-front course-card-premium rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between">
                    {course.thumbnailUrl && (
                      <div className="w-full h-40 sm:h-44 bg-slate-950 relative overflow-hidden shrink-0 flex items-center justify-center">
                        <img
                          src={course.thumbnailUrl}
                          alt={course.title}
                          className="w-full h-full object-contain p-1"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                        <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-slate-900/80 text-amber-400 text-[9px] font-extrabold tracking-wider uppercase border border-amber-500/30 backdrop-blur-xs">
                          {course.category || 'BATCH'}
                        </span>
                      </div>
                    )}

                    <div className="flip-card-front-content flex flex-col justify-between flex-1 p-4 relative">
                      <div className="space-y-2.5">
                        {!course.thumbnailUrl && (
                          <div className="flex justify-between items-center">
                            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
                              <BookOpen className="w-4 h-4" />
                            </div>
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[9px] font-extrabold tracking-wider uppercase border border-slate-200/60 dark:border-white/10">
                              {course.category || 'BATCH'}
                            </span>
                          </div>
                        )}

                        <div className="space-y-1">
                          <h3 className="font-heading font-black text-sm text-slate-900 dark:text-white leading-snug">
                            {course.title}
                          </h3>
                          <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                            {course.description}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2.5 pt-2.5 border-t border-slate-100 dark:border-white/10">
                        <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                          <div className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-150 dark:border-white/5">
                            <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-[8px] text-slate-400 uppercase font-black tracking-wider leading-none">{t('courses.duration')}</p>
                              <p className="mt-0.5 text-slate-800 dark:text-slate-200 text-[11px] font-extrabold truncate">{course.duration || 'Flexible'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 p-1.5 rounded-lg bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20">
                            <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-[8px] text-slate-400 dark:text-slate-400 uppercase font-black tracking-wider leading-none">{t('courses.fee')}</p>
                              {(() => {
                                const feeStr = course.fee ? (String(course.fee).startsWith('₹') ? String(course.fee) : `₹${Number(course.fee).toLocaleString('en-IN')}`) : '';
                                const numFee = parseInt(String(course.fee).replace(/[^\d]/g, ''), 10);
                                const origNum = course.originalPrice 
                                  ? parseInt(String(course.originalPrice).replace(/[^\d]/g, ''), 10) 
                                  : (course.price ? course.price : 0);
                                
                                const discountLabel = course.discount || (origNum && numFee && origNum > numFee ? `${Math.round(((origNum - numFee) / origNum) * 100)}% OFF` : null);

                                if (numFee && !isNaN(numFee)) {
                                  return (
                                    <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                                      <span className="text-amber-600 dark:text-amber-400 text-[11px] font-black truncate">{feeStr}</span>
                                      {origNum > numFee && (
                                        <span className="text-[9px] text-slate-400 line-through font-bold">₹{origNum.toLocaleString('en-IN')}</span>
                                      )}
                                      {discountLabel && (
                                        <span className="text-[8px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold px-1 rounded uppercase">
                                          {discountLabel}
                                        </span>
                                      )}
                                    </div>
                                  );
                                }
                                return <p className="mt-0.5 text-amber-600 dark:text-amber-400 text-[11px] font-black truncate">{feeStr || 'Contact Us'}</p>;
                              })()}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFlip(course.id);
                          }}
                          className="w-full text-[8.5px] text-center text-amber-600 dark:text-amber-400 font-extrabold uppercase tracking-widest bg-amber-500/10 py-1 rounded-lg border border-amber-500/20 hover:bg-amber-500/20 transition-colors cursor-pointer relative z-30 pointer-events-auto"
                        >
                          {t('courses.tapToFlip')}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Back Side */}
                  <div className="flip-card-back course-card-premium rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 shadow-md">
                    <div className="flip-card-back-content flex flex-col justify-between h-full p-4 relative">
                      <div className="space-y-2.5 overflow-y-auto flex-1 pr-1">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-2">
                          <h4 className="font-heading font-black text-[10px] text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            <span>Course Overview</span>
                          </h4>
                          <span className="text-[8px] font-bold text-slate-400 uppercase">Syllabus</span>
                        </div>

                        {/* Course Overview Description */}
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">Overview</p>
                          <p className="text-[11px] text-slate-700 dark:text-slate-300 line-clamp-3 font-medium leading-relaxed">
                            {course.description || 'Comprehensive mentorship program for UPSC & State PCS aspirants with complete GS coverage, test series, and answer writing evaluation.'}
                          </p>
                        </div>
                        
                        {/* Syllabus Highlights */}
                        {course.syllabus && course.syllabus.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-[9px] text-amber-600 dark:text-amber-400 font-black uppercase tracking-wider">Syllabus Highlights</p>
                            <ul className="text-[11px] text-slate-700 dark:text-slate-300 space-y-1">
                              {course.syllabus.map((item: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-1.5 leading-tight">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1 shrink-0" />
                                  <span className="line-clamp-1 font-medium">{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Key Feature Badges */}
                        <div className="space-y-1">
                          <p className="text-[9px] text-amber-600 dark:text-amber-400 font-black uppercase tracking-wider">Key Highlights</p>
                          <div className="flex flex-wrap gap-1">
                            {(course.features && course.features.length > 0 ? course.features : [
                              'Bilingual Study Notes', 'Prelims & Mains Tests', '1-on-1 Mentorship', 'Answer Writing'
                            ]).map((feat: string, idx: number) => (
                              <span key={idx} className="px-2 py-0.5 bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-white border border-slate-200 dark:border-white/15 rounded text-[8.5px] font-bold">
                                {feat}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between gap-2 shrink-0 relative z-50">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            toggleFlip(course.id);
                          }}
                          className="text-[9px] font-black text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-white transition-colors uppercase tracking-wider cursor-pointer relative z-50 pointer-events-auto"
                        >
                          {t('courses.flipBack')}
                        </button>
                        
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            window.location.href = `/courses/${course.id}`;
                          }}
                          className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 text-[9px] font-black rounded-lg transition-all shadow-xs inline-flex items-center gap-1 uppercase tracking-wider relative z-50 pointer-events-auto cursor-pointer"
                        >
                          <span>{t('courses.details')}</span>
                          <SlidersHorizontal className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-white/10">
          <p className="text-slate-500 text-sm font-semibold">{t('courses.noCourses')}</p>
        </div>
      )}
    </div>
  );
}

export default function Courses() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--bg-color)] flex items-center justify-center text-[var(--text-color)] text-xs font-bold uppercase tracking-wider">
        Loading Courses...
      </div>
    }>
      <CoursesContent />
    </Suspense>
  );
}
