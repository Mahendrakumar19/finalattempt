'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Calendar, Clock, ArrowRight, X } from 'lucide-react';
import { db, fallbackBlogs } from '@/services/db';

export default function Blog() {
  const [blogsList, setBlogsList] = useState<any[]>(fallbackBlogs);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);

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

  const stripHtml = (html: string) => {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, '');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12 bg-[#FFFBF2]">
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
          <div 
            key={post.id} 
            onClick={() => setSelectedPost(post)}
            className="bg-white rounded-3xl border border-slate-100 p-6 flex flex-col justify-between hover:shadow-lg hover:border-blue-100 transition-all duration-300 cursor-pointer group"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-450 uppercase">
                <span className="text-blue-600">{post.category}</span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{post.publishDate}</span>
                </span>
              </div>
              <h3 className="font-heading font-extrabold text-sm text-slate-900 leading-snug group-hover:text-blue-650 transition-colors">
                {post.title}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                {stripHtml(post.content)}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-6 flex justify-between items-center text-xs font-bold">
              <span className="text-slate-400">{post.readTime}</span>
              <button 
                onClick={(e) => { e.stopPropagation(); setSelectedPost(post); }}
                className="text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer"
              >
                <span>Read Full Post</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Overlay Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-150 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-start gap-4 shrink-0">
              <div className="space-y-1.5">
                <div className="flex gap-2 items-center text-[10px] font-bold text-slate-400 uppercase">
                  <span className="text-blue-600">{selectedPost.category}</span>
                  <span>&bull;</span>
                  <span>{selectedPost.publishDate}</span>
                </div>
                <h2 className="font-heading font-black text-slate-900 text-base sm:text-lg leading-tight">
                  {selectedPost.title}
                </h2>
              </div>
              <button 
                onClick={() => setSelectedPost(null)}
                className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 sm:p-8 overflow-y-auto flex-grow prose max-w-none text-slate-800 text-sm leading-relaxed space-y-4">
              <div 
                dangerouslySetInnerHTML={{ __html: selectedPost.content }} 
                className="space-y-3"
              />
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-xs font-bold text-slate-500 px-6 shrink-0">
              <span>Read Time: {selectedPost.readTime}</span>
              <button 
                onClick={() => setSelectedPost(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer"
              >
                Close Article
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
