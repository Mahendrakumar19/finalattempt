'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Calendar, Clock, ArrowRight } from 'lucide-react';
import { db, fallbackBlogs } from '@/services/db';

export default function Blog() {
  const [blogsList, setBlogsList] = useState<any[]>(fallbackBlogs);

  useEffect(() => {
    const loadBlogs = async () => {
      try {
        const bg = await db.getBlogs();
        if (bg && bg.length > 0) {
          setBlogsList(bg);
        }
      } catch (err) {
        console.error('Failed loading blogs:', err);
      }
    };
    loadBlogs();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Editorial Blog</span>
        <h1 className="text-4xl font-heading font-extrabold text-brand-primary tracking-tight">
          Aspirant Strategy Insights
        </h1>
        <p className="text-slate-500 text-sm max-w-lg">
          Micro-strategies, toppers study layouts, syllabus breakdowns, and guidance posts from our mentoring team.
        </p>
      </div>

      {/* Blogs list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {blogsList.map((post) => (
          <div key={post.id} className="bg-white rounded-3xl border border-slate-100 p-6 flex flex-col justify-between hover:shadow-lg hover:border-blue-100 transition-all duration-300">
            <div className="space-y-4">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-450 uppercase">
                <span className="text-blue-600">{post.category}</span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{post.publishDate}</span>
                </span>
              </div>
              <h3 className="font-heading font-extrabold text-sm text-slate-900 leading-snug">
                {post.title}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                {post.content}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-6 flex justify-between items-center text-xs font-bold">
              <span className="text-slate-400">{post.readTime}</span>
              <button className="text-blue-600 hover:text-blue-800 flex items-center gap-0.5">
                <span>Read Full Post</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
