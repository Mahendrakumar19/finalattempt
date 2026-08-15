'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, ArrowRight, Clock, BookOpen } from 'lucide-react';
import { db, fallbackBlogs, BlogItem } from '@/services/db';

export default function Blog() {
  const [blogsList, setBlogsList] = useState<BlogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const resolveUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    return `${backendBase}/${url.replace(/^\//, '')}`;
  };

  useEffect(() => {
    const loadBlogs = async () => {
      try {
        const bg = await db.getBlogs();
        const sorted = [...(bg || [])].sort((a: any, b: any) => {
          const timeA = new Date(a.publishDate || a.createdAt || 0).getTime() || 0;
          const timeB = new Date(b.publishDate || b.createdAt || 0).getTime() || 0;
          return timeB - timeA;
        });
        setBlogsList(sorted);
      } catch (err) {
        console.error('Failed loading blogs:', err);
      } finally {
        setLoading(false);
      }
    };
    loadBlogs();
  }, []);

  const stripHtml = (html: string) => {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, '');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-color)] py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Blogs Grid */}
        <div className="space-y-6">
          <h1 className="text-3xl font-heading font-black text-slate-900 dark:text-white">
            All Articles & Guides
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogsList.map((post) => (
              <Link 
                key={post.id} 
                href={`/blog/${post.slug || post.id}`}
                className="bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200/80 dark:border-white/10 p-6 flex flex-col justify-between hover:shadow-xl hover:border-amber-500/50 transition-all duration-300 group"
              >
                <div className="space-y-4">
                  {(post.imageUrl || post.cover_image_url) && (
                    <div className="w-full aspect-[16/9] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-100 dark:border-white/5 flex items-center justify-center relative">
                      <img
                        src={resolveUrl(post.imageUrl || post.cover_image_url)}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <div className="flex justify-between items-center text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <span className="text-amber-500">{post.category}</span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{post.publishDate}</span>
                    </span>
                  </div>
                  <h3 className="font-heading font-extrabold text-base text-slate-900 dark:text-white leading-snug group-hover:text-amber-500 transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
                    {post.blurb || stripHtml(post.content)}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-white/5 mt-6 flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-400">{post.readTime}</span>
                  <span className="text-amber-500 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    <span>Read Post</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
