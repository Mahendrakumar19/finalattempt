'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  Calendar, Clock, User, ArrowLeft, Share2, 
  Check, ArrowRight, BookOpen, Download
} from 'lucide-react';
import { db, BlogItem } from '@/services/db';
import PdfLetterhead, { triggerPdfDownload } from '@/components/PdfLetterhead';
import { useLocale } from '@/context/LocaleContext';

interface BlogDetailClientProps {
  idOrSlug: string;
  initialBlog?: BlogItem | null;
}

export default function BlogDetailClient({ idOrSlug, initialBlog }: BlogDetailClientProps) {
  const { locale } = useLocale();
  const searchParams = useSearchParams();

  const [blog, setBlog] = useState<BlogItem | null>(initialBlog || null);
  const [recentBlogs, setRecentBlogs] = useState<BlogItem[]>([]);
  const [loading, setLoading] = useState(!initialBlog);
  const [copied, setCopied] = useState(false);

  const resolveUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    return `${backendBase}/${url.replace(/^\//, '')}`;
  };

  useEffect(() => {
    async function loadPost() {
      if (!initialBlog) {
        setLoading(true);
      }
      try {
        const [singleBlog, allBlogs] = await Promise.all([
          initialBlog ? Promise.resolve(initialBlog) : db.getBlogById(idOrSlug),
          db.getBlogs()
        ]);
        const list = (allBlogs && allBlogs.length > 0) ? allBlogs : [];
        setRecentBlogs(list);

        let active: BlogItem | null = null;
        if (singleBlog && (singleBlog.title || singleBlog.content)) {
          active = singleBlog;
        } else {
          const matched = list.find((b: BlogItem) => String(b.id) === idOrSlug || b.slug === idOrSlug);
          active = matched || list[0] || null;
        }
        setBlog(active);
      } catch (err) {
        console.error('Failed loading blog post detail:', err);
      } finally {
        setLoading(false);
      }
    }

    if (idOrSlug) {
      loadPost();
    }
  }, [idOrSlug, initialBlog]);

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
        } catch {
          // ignore or fall back
        }
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
    .filter((b: BlogItem) => String(b.id) !== String(blog?.id) && b.slug !== blog?.slug)
    .slice(0, 3);

  const target = (blog as { publish_target?: string; publishTarget?: string })?.publish_target || (blog as { publish_target?: string; publishTarget?: string })?.publishTarget || 'both';
  const isHindiArticle = searchParams?.get('lang') === 'hi' || target === 'hindi' || locale === 'hi';

  const displayTitle = isHindiArticle ? (blog.title_hi || blog.title) : blog.title;
  const displayBlurb = isHindiArticle ? (blog.blurb_hi || blog.blurb) : (blog.blurb || blog.blurb_hi);
  const displayContent = isHindiArticle ? (blog.content_hi || blog.content) : (blog.content || blog.content_hi);

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    'headline': displayTitle,
    'description': blog.blurb || (blog.content ? blog.content.replace(/<[^>]*>?/gm, '').slice(0, 160) : ''),
    'image': resolveUrl(blog.imageUrl || blog.cover_image_url) || 'https://finalattemptias.com/og-image.jpg',
    'datePublished': blog.publishDate || blog.createdAt || new Date().toISOString(),
    'dateModified': (blog as { updatedAt?: string; publishDate?: string }).updatedAt || blog.publishDate || new Date().toISOString(),
    'author': {
      '@type': 'Person',
      'name': blog.author || 'Final Attempt Editorial Team'
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'Final Attempt',
      'logo': {
        '@type': 'ImageObject',
        'url': 'https://finalattemptias.com/favicon.png'
      }
    },
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': `https://finalattemptias.com/blog/${blog.slug || blog.id}`
    }
  };

  return (
    <article className="min-h-screen bg-[var(--bg-color)] py-10 sm:py-14">
      {/* Schema.org BlogPosting Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Top Breadcrumb Header Navigation */}
        <div className="flex items-center justify-start gap-3 text-xs text-slate-400 font-medium border-b border-slate-100 dark:border-white/10 pb-4">
          <Link href="/" className="hover:text-amber-500">Home</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-amber-500">Blog</Link>
          <span>/</span>
          <span className="text-slate-700 dark:text-slate-200 truncate max-w-[280px]">{displayTitle}</span>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Sidebar */}
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
                {latest10Blogs.map((item: BlogItem, index: number) => {
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
            <PdfLetterhead
              type="BLOG"
              date={blog.publishDate}
            />

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
                    <span>{blog.publishDate || 'Recent'}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => triggerPdfDownload(blog.title)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-all flex items-center gap-1.5 text-xs font-bold"
                    title="Download as PDF"
                  >
                    <Download className="w-4 h-4 text-amber-500" />
                    <span className="hidden sm:inline">PDF</span>
                  </button>

                  <button
                    onClick={handleShare}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-all flex items-center gap-1.5 text-xs font-bold"
                    title="Share this article"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-500" />
                        <span className="text-emerald-500">Copied</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Share</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-black text-slate-900 dark:text-white leading-tight">
                {displayTitle}
              </h1>

              {displayBlurb && (
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium italic border-l-2 border-amber-500 pl-4 py-1 leading-relaxed">
                  {displayBlurb}
                </p>
              )}

              <div className="flex items-center gap-3 pt-2">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 font-black text-sm">
                  {blog.author ? blog.author.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {blog.author || (isHindiArticle ? 'फ़ाइनल अटेम्प्ट टीम' : 'Final Attempt Faculty')}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {isHindiArticle ? 'सिविल सेवा मार्गदर्शक' : 'Senior Faculty & UPSC Mentor'}
                  </p>
                </div>
              </div>
            </header>

            {/* Featured Image */}
            {(blog.imageUrl || blog.cover_image_url) && (
              <div className="rounded-3xl overflow-hidden border border-slate-200/80 dark:border-white/10 shadow-sm max-h-[460px] bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resolveUrl(blog.imageUrl || blog.cover_image_url)}
                  alt={displayTitle}
                  className="w-full h-full object-cover max-h-[460px]"
                />
              </div>
            )}

            {/* Rich Text Body Content */}
            <div className="bg-white dark:bg-slate-900/80 rounded-3xl p-6 sm:p-10 border border-slate-200/80 dark:border-white/10 shadow-sm">
              <div 
                className="prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed space-y-4 font-normal"
                dangerouslySetInnerHTML={{ 
                  __html: displayContent || '<p>No content available.</p>' 
                }}
              />

              {(blog as { tags?: string[] }).tags && (blog as { tags?: string[] }).tags!.length > 0 && (
                <div className="mt-10 pt-6 border-t border-slate-100 dark:border-white/10 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 mr-2">Tags:</span>
                  {(blog as { tags?: string[] }).tags!.map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Author / Mentorship Box */}
            <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent rounded-3xl p-6 border border-amber-500/20 flex flex-col sm:flex-row items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-heading font-black text-2xl shrink-0 shadow-lg shadow-amber-500/20">
                FA
              </div>
              <div className="space-y-1 text-center sm:text-left flex-1">
                <h4 className="font-heading font-black text-slate-900 dark:text-white text-base">
                  Prepare with Final Attempt Mentorship
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Join our comprehensive GS Foundations and Prelims/Mains Test Series guided by experienced mentors and top rankers.
                </p>
              </div>
              <Link href="/courses" className="btn-primary text-xs shrink-0 whitespace-nowrap">
                Explore Programs
              </Link>
            </div>
          </main>
        </div>

        {/* Bottom Related Articles */}
        {displayRelated.length > 0 && (
          <div className="pt-10 border-t border-slate-200/60 dark:border-white/10 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-black text-xl text-slate-900 dark:text-white">
                Related Articles & Guides
              </h2>
              <Link href="/blog" className="btn-outline text-xs flex items-center gap-1.5">
                <span>View All</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {displayRelated.map((post: BlogItem) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug || post.id}`}
                  className="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:border-amber-500/50 transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
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
