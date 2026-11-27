'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, ArrowRight, BookOpen, Compass, Globe } from 'lucide-react';
import { db, BlogItem } from '@/services/db';
import { useLocale } from '@/context/LocaleContext';

export default function Blog() {
  const { locale, setLocale } = useLocale();
  const [blogsList, setBlogsList] = useState<BlogItem[]>([]);
  const [, setLoading] = useState(true);

  const resolveUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    return `${backendBase}/${url.replace(/^\//, '')}`;
  };

  useEffect(() => {
    // Automatically switch full site language context to English for /blog
    if (locale !== 'en') {
      setLocale('en', true);
    }

    const loadBlogs = async () => {
      try {
        const bg = await db.getBlogs();
        // Filter out items targeted strictly for Hindi only
        const filtered = (bg || []).filter((b: BlogItem & { publishTarget?: string }) => {
          const target = b.publish_target || b.publishTarget || 'both';
          return target === 'both' || target === 'english';
        });
        const sorted = [...filtered].sort((a: BlogItem, b: BlogItem) => {
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
  }, [locale, setLocale]);

  const stripHtml = (html: string) => {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, '');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-color)] py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-heading font-black text-slate-900 dark:text-white">
              All Articles & Guides
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              High-yield GS articles, strategy guides, and model answers for BPSC & Civil Services.
            </p>
          </div>

          <Link
            href="/blog-hindi"
            className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold rounded-xl text-xs flex items-center gap-2 border border-amber-500/30 transition-all"
          >
            <span>Switch to Hindi Blogs (हिन्दी पोर्टल)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Quick Access Hub (Syllabus, Strategy, Hindi Blogs) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
          {/* 1. Syllabus */}
          <Link
            href="/syllabus-strategy#syllabus"
            className="group p-4 bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-blue-500/50 rounded-2xl transition-all shadow-xs flex items-center gap-3.5 hover:shadow-md"
          >
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-heading font-extrabold text-sm text-[var(--text-color)] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                Syllabus (पाठ्यक्रम)
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Exam pattern, marks & syllabus PDF
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all shrink-0" />
          </Link>

          {/* 2. Strategy */}
          <Link
            href="/syllabus-strategy#strategy"
            className="group p-4 bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-emerald-500/50 rounded-2xl transition-all shadow-xs flex items-center gap-3.5 hover:shadow-md"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Compass className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-heading font-extrabold text-sm text-[var(--text-color)] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                Strategy (रणनीति)
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Preparation roadmap & guidance
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-1 transition-all shrink-0" />
          </Link>

          {/* 3. Hindi Blogs */}
          <Link
            href="/blog-hindi"
            className="group p-4 bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-amber-500/50 rounded-2xl transition-all shadow-xs flex items-center gap-3.5 hover:shadow-md"
          >
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-heading font-extrabold text-sm text-[var(--text-color)] group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                Hindi Blogs (हिन्दी पोर्टल)
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                BPSC विशेषांक एवं संपूर्ण हिंदी लेख
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 group-hover:translate-x-1 transition-all shrink-0" />
          </Link>
        </div>

        {/* Blogs Grid */}
        {blogsList.length === 0 ? (
          <div className="bg-gradient-to-br from-blue-500/5 via-slate-50 to-indigo-500/5 dark:from-slate-900 dark:via-slate-900/60 dark:to-slate-900 rounded-3xl border border-dashed border-blue-500/30 p-12 text-center space-y-4 max-w-2xl mx-auto shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center mx-auto">
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-xl sm:text-2xl font-heading font-black text-slate-900 dark:text-white">
              No Articles Published Yet
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
              There are currently no English articles published in this section. Please check back soon or browse our Hindi portal.
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <Link
                href="/blog-hindi"
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition-all shadow-md inline-flex items-center gap-1.5"
              >
                <span>हिन्दी लेख देखें (View Hindi Articles)</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogsList.map((post: BlogItem & { cover_image_url?: string; authorImage?: string; author?: string }) => (
              <Link 
                key={post.id} 
                href={`/blog/${post.slug || post.id}`}
                className="bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200/80 dark:border-white/10 p-6 flex flex-col justify-between hover:shadow-xl hover:border-amber-500/50 transition-all duration-300 group"
              >
                <div className="space-y-4">
                  {(post.imageUrl || post.cover_image_url) && (
                    <div className="w-full aspect-[16/9] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-100 dark:border-white/5 flex items-center justify-center relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={resolveUrl(post.imageUrl || post.cover_image_url)}
                        alt={post.title}
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
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
                  <h2 className="font-heading font-extrabold text-base text-slate-900 dark:text-white leading-snug group-hover:text-amber-500 transition-colors line-clamp-2">
                    {post.title}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
                    {post.blurb || stripHtml(post.content)}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-white/5 mt-6 flex justify-between items-center text-xs font-bold">
                  <div className="flex items-center gap-2 min-w-0">
                    {post.author_image || post.authorImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={resolveUrl(post.author_image || post.authorImage)}
                        alt={post.author_name || 'Author'}
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                        className="w-6 h-6 rounded-full object-cover border border-amber-500/40 shrink-0"
                      />
                    ) : null}
                    <span className="text-slate-400 font-semibold text-[11px] truncate max-w-[130px]">{post.author_name || post.author || 'Final Attempt Team'}</span>
                  </div>
                  <span className="text-amber-500 group-hover:translate-x-1 transition-transform flex items-center gap-1 shrink-0">
                    <span>Read Post</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
