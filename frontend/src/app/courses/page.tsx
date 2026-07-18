'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, SlidersHorizontal, BookOpen, Clock, Calendar } from 'lucide-react';
import { db } from '@/services/db';
import { courseData } from '@/services/seedData';

type CategoryType = 'All' | 'UPSC' | 'Foundation' | 'Prelims' | 'Mains' | 'Interview';

export default function Courses() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [coursesList, setCoursesList] = useState<any[]>(courseData);
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  const toggleFlip = (id: string) => {
    setFlippedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const c = await db.getCourses();
        if (c && c.length > 0) {
          setCoursesList(c);
        }
      } catch (err) {
        console.error('Failed loading courses:', err);
      }
    };
    loadCourses();
  }, []);

  // FUTURE USE: UPSC Category is commented out for frontend display as the platform is currently not focusing on UPSC.
  // const categories: CategoryType[] = ['All', 'UPSC', 'BPSC', 'Foundation', 'Prelims', 'Mains', 'Interview'];
  const categories: CategoryType[] = ['All', 'Foundation', 'Prelims', 'Mains', 'Interview'];

  const filteredCourses = coursesList.filter(course => {
    // FUTURE USE: Hide UPSC courses from active view as we are currently focusing only on BPSC.
    if (course.category === 'UPSC') return false;

    const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
    const matchesSearch = (course.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (course.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      {/* Page Header */}
      <div className="space-y-4">
        <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Our Programs</span>
        <h1 className="text-4xl font-heading font-extrabold text-brand-primary tracking-tight">
          Explore Our Courses
        </h1>
        <p className="text-slate-500 text-sm max-w-xl">
          {/* FUTURE USE: Add UPSC back into course page descriptions when focus expands */}
          Choose from BPSC batches curated by industry-leading mentors. Restrained pricing structures and result-oriented schedules.
        </p>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                selectedCategory === cat
                  ? 'bg-brand-primary text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 border border-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Courses Grid */}
      {filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className={`flip-card-container cursor-pointer ${flippedCards[course.id] ? 'is-flipped' : ''}`}
              onClick={() => toggleFlip(course.id)}
            >
              <div className="flip-card-inner">
                {/* Front Side */}
                <div className="flip-card-front course-card-premium rounded-3xl">
                  <div className="flip-card-front-content flex flex-col justify-between h-full">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-slate-50 border border-slate-100 text-[10px] font-bold text-slate-600 uppercase">
                          {course.category}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <h3 className="font-heading font-extrabold text-base text-brand-primary">
                          {course.title}
                        </h3>
                        <p className="text-xs text-slate-550 line-clamp-3 leading-relaxed">
                          {course.description}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs font-bold text-slate-700">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                          <div>
                            <p className="text-[9px] text-slate-400 uppercase leading-none font-bold">Duration</p>
                            <p className="mt-0.5">{course.duration}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                          <div>
                            <p className="text-[9px] text-slate-400 uppercase leading-none font-bold">Course Fee</p>
                            <p className="mt-0.5 text-blue-650 text-sm">{course.fee}</p>
                          </div>
                        </div>
                      </div>

                      <div className="text-[9px] text-center text-blue-600 font-bold uppercase tracking-wider animate-pulse pt-2">
                        Tap / Hover to View Syllabus
                      </div>
                    </div>
                  </div>
                </div>

                {/* Back Side */}
                <div className="flip-card-back rounded-3xl">
                  <div className="flip-card-back-content flex flex-col justify-between h-full bg-slate-50/50 dark:bg-slate-900/30">
                    <div className="space-y-3 overflow-y-auto pr-1">
                      <h4 className="font-heading font-extrabold text-xs text-blue-600 uppercase tracking-wider">
                        Course Details
                      </h4>
                      
                      {course.syllabus && course.syllabus.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[9px] text-slate-400 font-bold uppercase">Syllabus Highlights</p>
                          <ul className="text-[10px] text-slate-600 list-disc list-inside space-y-0.5">
                            {course.syllabus.slice(0, 3).map((item: string, idx: number) => (
                              <li key={idx} className="line-clamp-1">{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {course.features && course.features.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[9px] text-slate-400 font-bold uppercase">Key Highlights</p>
                          <div className="flex flex-wrap gap-1">
                            {course.features.slice(0, 2).map((feat: string, idx: number) => (
                              <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-md text-[8px] font-bold">
                                {feat}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {course.schedule && (
                        <div className="space-y-0.5">
                          <p className="text-[9px] text-slate-400 font-bold uppercase">Schedule</p>
                          <p className="text-[10px] text-slate-600 font-semibold line-clamp-1">{course.schedule}</p>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFlip(course.id);
                        }}
                        className="text-[9px] font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase cursor-pointer"
                      >
                        Flip Back
                      </button>
                      
                      <Link
                        href={`/courses/${course.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-bold rounded-xl transition-colors inline-flex items-center gap-1"
                      >
                        <span>View Details</span>
                        <SlidersHorizontal className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-50 rounded-3xl border border-slate-100">
          <p className="text-slate-500 text-sm font-semibold">No courses match your selection or search query.</p>
        </div>
      )}
    </div>
  );
}
