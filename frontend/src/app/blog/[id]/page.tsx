'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  Calendar, Clock, User, ArrowLeft, Share2, 
  Check, ArrowRight, Tag, BookOpen 
} from 'lucide-react';
import { db, BlogItem, fallbackBlogs } from '@/services/db';

import { useTranslation } from '@/context/LocaleContext';

export default function BlogDetailPage() {
  const { locale } = useTranslation();
  const params = useParams();
  const rawId = params?.id as string;
  const idOrSlug = decodeURIComponent(rawId || '');

  const [blog, setBlog] = useState<BlogItem | null>(null);
  const [recentBlogs, setRecentBlogs] = useState<BlogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const resolveUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    return `${backendBase}/${url.replace(/^\//, '')}`;
  };

  useEffect(() => {
    async function loadPost() {
      setLoading(true);
      try {
        const [singleBlog, allBlogs] = await Promise.all([
          db.getBlogById(idOrSlug),
          db.getBlogs()
        ]);
        const list = (allBlogs && allBlogs.length > 0) ? allBlogs : [];
        setRecentBlogs(list);

        if (singleBlog && (singleBlog.title || singleBlog.content)) {
          setBlog(singleBlog);
        } else {
          const matched = list.find((b: BlogItem) => String(b.id) === idOrSlug || b.slug === idOrSlug);
          setBlog(matched || list[0] || null);
        }
      } catch (err) {
        console.error('Failed loading blog post detail:', err);
      } finally {
        setLoading(false);
      }
    }

    if (idOrSlug) {
      loadPost();
    }
  }, [idOrSlug, locale]);

  const handleShare = async () => {
    if (typeof window !== 'undefined') {
      if (navigator.share) {
        try {
          await navigator.share({
            title: blog?.title || 'Final Attempt Blog',
            text: blog?.title || '',
            url: window.location.href,
          });
          return;
        } catch (e) {}
      }
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] bg-[var(--bg-color)] flex items-center justify-center p-6">
        <div className="animate-pulse space-y-6 max-w-4xl w-full">
          <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
          <div className="h-10 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          <div className="h-64 w-full bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
          <div className="space-y-3">
            <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
            <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
            <div className="h-4 w-4/6 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-[60vh] bg-[var(--bg-color)] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h1 className="text-2xl font-heading font-black text-slate-900 dark:text-white">Article Not Found</h1>
        <p className="text-xs text-slate-500 max-w-md">The editorial article you are looking for does not exist or has been moved.</p>
        <Link href="/blog" className="btn-primary text-xs flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Articles</span>
        </Link>
      </div>
    );
  }

  const latest10Blogs = recentBlogs.slice(0, 10);

  const displayRelated = recentBlogs
    .filter((b: any) => String(b.id) !== String(blog?.id) && b.slug !== blog?.slug)
    .slice(0, 3);

  return (
    <article className="min-h-screen bg-[var(--bg-color)] py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Top Breadcrumb Header Navigation (Left Aligned) */}
        <div className="flex items-center justify-start gap-3 text-xs text-slate-400 font-medium border-b border-slate-100 dark:border-white/10 pb-4">
          <Link href="/" className="hover:text-amber-500">Home</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-amber-500">Blog</Link>
          <span>/</span>
          <span className="text-slate-700 dark:text-slate-200 truncate max-w-[280px]">{blog.title}</span>
        </div>

        {/* 2-Column Responsive Layout: Left Sidebar + Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Sidebar: Latest Articles Quick Links (Sticky on Desktop) */}
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24 order-2 lg:order-1">
            <div className="bg-white dark:bg-slate-900/80 rounded-3xl p-5 border border-slate-200/80 dark:border-white/10 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
                <h3 className="font-heading font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-500" />
                  <span>Latest Articles</span>
                </h3>
                <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg uppercase tracking-wider">
                  Quick Links
                </span>
              </div>

              <ul className="space-y-1.5 max-h-[70vh] overflow-y-auto pr-1 scrollbar-thin">
                {latest10Blogs.map((item: any, index: number) => {
                  const isCurrent = String(item.id) === String(blog.id) || item.slug === blog.slug;
                  return (
                    <li key={item.id}>
                      <Link
                        href={`/blog/${item.slug || item.id}`}
                        className={`group flex items-start gap-2.5 p-2.5 rounded-2xl transition-all duration-200 ${
                          isCurrent
                            ? 'bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-black'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span className={`text-xs font-black shrink-0 mt-0.5 ${isCurrent ? 'text-amber-500' : 'text-slate-400 group-hover:text-amber-500'}`}>
                          {String(index + 1).padStart(2, '0')}.
                        </span>
                        <div className="space-y-1 min-w-0">
                          <p className="text-xs font-bold leading-snug line-clamp-2 group-hover:text-amber-500 transition-colors">
                            {item.title}
                          </p>
                          <p className="text-[10px] text-slate-400 flex items-center gap-2 font-medium">
                            <span className="text-amber-500 font-bold">{item.category || 'Strategy'}</span>
                            <span>•</span>
                            <span>{item.publishDate || 'Recent'}</span>
                          </p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>

          {/* Main Article Body Column */}
          <main className="lg:col-span-8 space-y-6 order-1 lg:order-2">
            {/* Hero Header Card Container */}
            <header className="bg-white dark:bg-slate-900/80 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-white/10 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-white/10 pb-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-400 px-3 py-1 rounded-xl shadow-xs">
                    {blog.category || 'EXAM STRATEGY'}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>{blog.readTime || '5 min read'}</span>
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-500" />
                    <span>Published {blog.publishDate || 'Recent'}</span>
                  </span>
                </div>

                {/* Single Unified Share Button */}
                <button
                  type="button"
                  onClick={handleShare}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/80 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5 text-amber-500" />}
                  <span>{copied ? 'Link Copied!' : 'SHARE'}</span>
                </button>
              </div>

              <h1 className="text-2xl sm:text-4xl font-heading font-black text-slate-900 dark:text-white leading-tight tracking-tight pt-1">
                {blog.title}
              </h1>
            </header>

            {/* Full-Bleed Clean Cover Image */}
            {(blog.imageUrl || blog.cover_image_url) && (
              <div className="w-full rounded-3xl overflow-hidden shadow-md border border-slate-200/80 dark:border-white/10">
                <img
                  src={resolveUrl(blog.imageUrl || blog.cover_image_url)}
                  alt={blog.title}
                  className="w-full max-h-[420px] object-cover rounded-3xl"
                />
              </div>
            )}

            {/* Full Rich Article Body Content */}
            <div className="bg-white dark:bg-slate-900/60 rounded-3xl p-6 sm:p-10 border border-slate-200/80 dark:border-white/10 shadow-sm space-y-6">
              <div
                className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 text-sm sm:text-base leading-relaxed space-y-5
                  [&_h1]:text-2xl [&_h1]:font-black [&_h1]:font-heading [&_h1]:text-slate-900 dark:[&_h1]:text-white
                  [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:font-heading [&_h2]:text-slate-900 dark:[&_h2]:text-white [&_h2]:mt-6 [&_h2]:mb-3
                  [&_h3]:text-lg [&_h3]:font-bold [&_h3]:font-heading [&_h3]:mt-4 [&_h3]:mb-2
                  [&_p]:leading-relaxed [&_p]:mb-3
                  [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5 [&_li]:leading-relaxed
                  [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-1.5
                  [&_blockquote]:border-l-4 [&_blockquote]:border-amber-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-4 [&_blockquote]:text-slate-600 dark:[&_blockquote]:text-slate-300
                  [&_strong]:font-black [&_strong]:text-slate-900 dark:[&_strong]:text-white
                  [&_img]:rounded-2xl [&_img]:shadow-md [&_img]:border [&_img]:border-slate-200/80 dark:[&_img]:border-white/10 [&_img]:my-6 [&_img]:mx-auto [&_img]:max-h-[480px] [&_img]:w-auto [&_img]:max-w-full
                  [&_table]:w-full [&_table]:my-6 [&_table]:border-collapse [&_table]:rounded-2xl [&_table]:overflow-hidden [&_table]:border [&_table]:border-slate-200/80 dark:[&_table]:border-white/10 [&_table]:shadow-sm [&_table]:text-left
                  [&_thead]:bg-slate-100 dark:[&_thead]:bg-slate-800/80 [&_thead]:border-b [&_thead]:border-slate-200 dark:[&_thead]:border-white/10
                  [&_th]:p-3 sm:[&_th]:p-3.5 [&_th]:font-black [&_th]:text-xs sm:[&_th]:text-sm [&_th]:text-slate-900 dark:[&_th]:text-white [&_th]:uppercase [&_th]:tracking-wider [&_th]:border-r [&_th]:border-slate-200/80 dark:[&_th]:border-white/10 [&_th:last-child]:border-r-0
                  [&_tbody]:divide-y [&_tbody]:divide-slate-100 dark:[&_tbody]:divide-white/5
                  [&_tr]:transition-colors [&_tr:hover]:bg-amber-500/5 dark:[&_tr:hover]:bg-amber-500/10
                  [&_td]:p-3 sm:[&_td]:p-3.5 [&_td]:text-xs sm:[&_td]:text-sm [&_td]:text-slate-700 dark:[&_td]:text-slate-300 [&_td]:border-r [&_td]:border-slate-100 dark:[&_td]:border-white/5 [&_td:last-child]:border-r-0"
                dangerouslySetInnerHTML={{ __html: blog.content || blog.blurb || blog.excerpt || '' }}
              />
            </div>
          </main>
        </div>

        {/* Lower Part: Related Articles Section */}
        {displayRelated.length > 0 && (
          <div className="pt-10 border-t border-slate-100 dark:border-white/10 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-heading font-black text-slate-900 dark:text-white">
                More Strategy Articles
              </h2>
              <Link href="/blog" className="btn-outline text-xs flex items-center gap-1.5">
                <span>View All</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {displayRelated.map((post: any) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug || post.id}`}
                  className="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:border-amber-500/50 transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <img
                        src={resolveUrl(post.imageUrl || post.cover_image_url) || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=800'}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="text-[9px] font-black uppercase tracking-wider text-amber-900 bg-amber-400 px-2.5 py-1 rounded-lg shadow-sm">
                          {post.category || 'STRATEGY'}
                        </span>
                      </div>
                    </div>

                    <div className="p-6 space-y-2">
                      <h3 className="font-heading font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug">
                        {post.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {post.blurb || (post.content ? post.content.replace(/<[^>]*>?/gm, '').slice(0, 100) + '...' : '')}
                      </p>
                    </div>
                  </div>

                  <div className="px-6 pb-6 pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs font-bold text-slate-400">
                    <span>{post.readTime || '5 min read'}</span>
                    <span className="text-amber-500 group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </article>
  );
}
