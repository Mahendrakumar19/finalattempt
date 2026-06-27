'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, SlidersHorizontal, BookOpen, Clock, Calendar } from 'lucide-react';
import { db } from '@/services/db';
import { courseData } from '@/services/seedData';

type CategoryType = 'All' | 'UPSC' | 'BPSC' | 'Foundation' | 'Prelims' | 'Mains' | 'Interview';

export default function Courses() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [coursesList, setCoursesList] = useState<any[]>(courseData);

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

  const categories: CategoryType[] = ['All', 'UPSC', 'BPSC', 'Foundation', 'Prelims', 'Mains', 'Interview'];

  const filteredCourses = coursesList.filter(course => {
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
          Choose from BPSC and UPSC batches curated by industry-leading mentors. Restrained pricing structures and result-oriented schedules.
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
              className="bg-white rounded-3xl border border-slate-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col"
            >
              <div className="p-6 flex-grow space-y-4">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-slate-50 border border-slate-100 text-[10px] font-bold text-slate-600 uppercase">
                    {course.category}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="font-heading font-extrabold text-base text-brand-primary group-hover:text-blue-600 transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>
                </div>

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
                      <p className="mt-0.5 text-blue-600 text-sm">{course.fee}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-center">
                <Link
                  href={`/courses/${course.id}`}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <span>View Details</span>
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </Link>
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
