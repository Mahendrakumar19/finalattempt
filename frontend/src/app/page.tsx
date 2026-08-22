/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Users,
  BookOpen,
  ChevronRight,
  CheckCircle,
  FileText,
  GraduationCap,
  Video,
  SlidersHorizontal,
  ExternalLink,
  ArrowRight,
  Layers,
  Calendar,
  Compass,
  TrendingUp,
  ShieldCheck,
  Newspaper,
  Zap,
  Lightbulb,
  FileCheck,
  Target,
  Edit3,
  BarChart2,
  Rocket,
  Flame
} from 'lucide-react';

import { db, Course } from '@/services/db';
import { useTranslation } from '@/context/LocaleContext';
import NextImage from 'next/image';

// Lazy-load below-fold heavy component — deferred until viewport scroll
const TestimonialCarousel = dynamic(() => import('@/components/TestimonialCarousel'), {
  ssr: false,
  loading: () => <div className="h-40 flex items-center justify-center text-slate-400 text-xs">Loading...</div>
});



export interface YoutubeVideoItem {
  youtubeVideoId: string;
  title: string;
  description?: string;
  publishedAt: string;
}

export interface BlogItem {
  id: string;
  title: string;
  blurb?: string;
  content?: string;
  imageUrl?: string;
  cover_image_url?: string;
  photo?: string;
  displayImage?: string;
  category?: string;
  author?: string;
  readTime?: string;
  publishDate?: string;
  summary?: string;
  [key: string]: unknown;
}

export interface AnnouncementItem {
  date: string;
  text: string;
  isNew?: boolean;
  link?: string;
  createdAt?: string;
}

// ── YouTube Facade Component ─────────────────────────────────────────────────
// Shows a static thumbnail with play button. Replaces iframe with real embed
// only when the user clicks — eliminates YouTube JS SDK (~500KB) from page load.
function YoutubeFacade({ videoId, title }: { videoId: string; title: string }) {
  const [active, setActive] = useState(false);
  if (active) {
    return (
      <div className="relative aspect-video w-full bg-slate-950">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
          title={title}
          allowFullScreen
          allow="autoplay; encrypted-media"
          className="absolute inset-0 w-full h-full border-0"
        />
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={() => setActive(true)}
      aria-label={`Play video: ${title}`}
      className="relative aspect-video w-full bg-slate-950 overflow-hidden group cursor-pointer block"
    >
      <img
        src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
        alt={title}
        loading="lazy"
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      {/* Play button overlay */}
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="w-14 h-14 rounded-full bg-red-600 group-hover:bg-red-700 flex items-center justify-center shadow-xl transition-all duration-200 group-hover:scale-110">
          <svg viewBox="0 0 24 24" className="w-7 h-7 text-white fill-current ml-1" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </span>
    </button>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function Home() {

  const { t, locale } = useTranslation();
  // Real-time dynamic states
  const [heroSettings, setHeroSettings] = useState({
    heroTitle: 'The Next Generation Mentorship & Learning Platform',
    heroSubtitle: 'Empowering aspirants through personalized mentorship, high-quality content, strategic preparation, an innovative AI-powered learning ecosystem and continuous performance tracking - everything designed with one goal: to help make this attempt your final attempt."Let\'s Make Your Attempt Final with FINAL ATTEMPT "',
    tagline: 'Welcome to FINAL ATTEMPT',
    heroImageUrl: ''
  });
  const [liveCourses, setLiveCourses] = useState<Course[]>([]);
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  const toggleFlip = (id: string) => {
    setFlippedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };
  const [latestVideos, setLatestVideos] = useState<YoutubeVideoItem[]>([]);
  const [blogsList, setBlogsList] = useState<BlogItem[]>([]);
  const [expandedBlog, setExpandedBlog] = useState<BlogItem | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [targetExam, setTargetExam] = useState('BPSC Foundation Batch');
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const resolveUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('data:')) return url;

    if (process.env.NEXT_PUBLIC_BACKEND_URL) {
      return `${process.env.NEXT_PUBLIC_BACKEND_URL}/${url.replace(/^\//, '')}`;
    }

    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      if (protocol === 'https:' || (hostname !== 'localhost' && hostname !== '127.0.0.1')) {
        return `/${url.replace(/^\//, '')}`;
      }
      return `http://${hostname}:5000/${url.replace(/^\//, '')}`;
    }
    return `http://127.0.0.1:5000/${url.replace(/^\//, '')}`;
  };

  const heroImages = heroSettings.heroImageUrl
    ? heroSettings.heroImageUrl.split(',').map(img => resolveUrl(img.trim())).filter(Boolean)
    : [];

  useEffect(() => {
    if (heroImages.length <= 1) return;
    const interval = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  // Instant background preloader for hero carousel images
  useEffect(() => {
    if (heroImages.length === 0) return;
    heroImages.forEach((src) => {
      if (typeof window !== 'undefined') {
        const img = new window.Image();
        img.src = src;
      }
    });
  }, [heroImages]);

  const tiltRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pillarsGridRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let VanillaTilt: any;
    import('vanilla-tilt')
      .then((mod) => {
        VanillaTilt = mod.default || mod;
        tiltRefs.current.forEach((el) => {
          if (el) {
            VanillaTilt.init(el, {
              max: 25,
              speed: 400,
              glare: true,
              'max-glare': 1
            });
          }
        });
      })
      .catch(() => {
        // Fallback gracefully if vanilla-tilt is not installed on the production server
      });

    const currentRefs = tiltRefs.current;
    return () => {
      currentRefs.forEach((el) => {
        if (el && (el as any).vanillaTilt) {
          (el as any).vanillaTilt.destroy();
        }
      });
    };
  }, []);

  // Scroll animation: Grid cards shrink & fade into center when out of view, expand when scrolled into view
  useEffect(() => {
    const el = pillarsGridRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.classList.add('pillars-visible');
          } else {
            el.classList.remove('pillars-visible');
          }
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const [dynamicAnnouncements, setDynamicAnnouncements] = useState<AnnouncementItem[]>([]);

  const [liveCaEditions, setLiveCaEditions] = useState<Record<string, unknown>[]>([]);
  const [liveTestSeries, setLiveTestSeries] = useState<Record<string, unknown>[]>([]);
  const [liveResources, setLiveResources] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    const loadLiveData = async () => {
      try {
        const s = await db.getSettings();
        if (s) {
          setHeroSettings(prev => ({
            heroTitle: s.heroTitle || prev.heroTitle,
            heroSubtitle: s.heroSubtitle || prev.heroSubtitle,
            tagline: s.tagline || prev.tagline,
            heroImageUrl: s.heroImageUrl || ''
          }));
          if (s.announcements && Array.isArray(s.announcements) && s.announcements.length > 0) {
            setDynamicAnnouncements(s.announcements.map((a: unknown) => typeof a === 'string' ? { date: 'NOTICE', text: a, isNew: true } : (a as AnnouncementItem)));
          }
        }

        const c = await db.getCourses();
        if (c) {
          setLiveCourses(c);
        }

        const videosData = await db.getYoutubeVideos(3);
        if (videosData && videosData.videos) {
          setLatestVideos(videosData.videos.slice(0, 3) as unknown as YoutubeVideoItem[]);
        }

        const blogs = await db.getBlogs();
        if (blogs && blogs.length > 0) {
          setBlogsList(blogs as unknown as BlogItem[]);
        }

        const caEditions = await db.getDynamicCurrentAffairsEditions(false);
        if (caEditions && caEditions.length > 0) {
          setLiveCaEditions(caEditions as unknown as Record<string, unknown>[]);
        }

        const ts = await db.getTestSeries();
        if (ts && ts.length > 0) {
          setLiveTestSeries(ts as unknown as Record<string, unknown>[]);
        }

        const resData = await db.getResources();
        if (resData && resData.length > 0) {
          setLiveResources(resData as unknown as Record<string, unknown>[]);
        }
      } catch (err) {
        console.error('Failed loading homepage live data:', err);
      }
    };
    loadLiveData();
  }, [locale]);

  // Compute unified dynamic WHAT'S NEW feed from all website update sources (Sorted: Latest On Top)
  // Compute unified dynamic WHAT'S NEW feed from all website update sources (Sorted: Latest On Top)
  const whatsNewFeed = useMemo(() => {
    const feed: Array<{ date: string; text: string; link: string; isNew: boolean; isExternal: boolean; timestamp: number }> = [];

    const getTS = (obj: Record<string, unknown> | null | undefined): number => {
      if (!obj) return 0;
      const raw = (obj.createdAt || obj.publishedAt || obj.updatedAt || obj.date || obj.publishDate) as string | undefined;
      if (!raw) return 0;
      const parsed = new Date(raw).getTime();
      return isNaN(parsed) ? 0 : parsed;
    };

    // 1. New Daily Current Affairs
    if (Array.isArray(liveCaEditions)) {
      liveCaEditions.forEach((ed: Record<string, unknown>) => {
        const articles = ed.articles as Array<{ title?: string }> | undefined;
        const articleTitle = articles && articles.length > 0 ? articles[0]?.title : null;
        const pubDate = ed.publishDate as string | undefined;
        feed.push({
          date: 'DAILY CA',
          text: articleTitle ? `Current Affairs Update: ${articleTitle}` : `Current Affairs Edition (${pubDate || 'Latest'})`,
          link: pubDate ? `/current-affairs/daily?date=${pubDate}` : '/current-affairs/daily',
          isNew: true,
          isExternal: false,
          timestamp: getTS(ed) || (pubDate ? new Date(pubDate).getTime() : 0),
        });
      });
    }

    // 2. Published Blog & Strategy Articles
    if (Array.isArray(blogsList)) {
      blogsList.forEach((blog: BlogItem) => {
        feed.push({
          date: (blog.category || 'ARTICLE').toUpperCase(),
          text: blog.title,
          link: `/blog/${blog.slug || blog.id}`,
          isNew: true,
          isExternal: false,
          timestamp: getTS(blog as unknown as Record<string, unknown>),
        });
      });
    }

    // 3. Courses / New Batches
    if (Array.isArray(liveCourses)) {
      liveCourses.forEach((c: Course) => {
        feed.push({
          date: 'NEW BATCH',
          text: `${c.title} — Admissions Open`,
          link: `/courses/${c.id}`,
          isNew: true,
          isExternal: false,
          timestamp: getTS(c as unknown as Record<string, unknown>),
        });
      });
    }

    // 4. Test Series Releases
    if (Array.isArray(liveTestSeries)) {
      liveTestSeries.forEach((ts: Record<string, unknown>) => {
        feed.push({
          date: 'TEST SERIES',
          text: `${ts.title} Released`,
          link: `/test-series`,
          isNew: true,
          isExternal: false,
          timestamp: getTS(ts),
        });
      });
    }

    // 5. Downloads / Study Materials (Latest 3)
    if (Array.isArray(liveResources)) {
      liveResources.slice(0, 3).forEach((res: Record<string, unknown>) => {
        const fileUrl = res.file_url as string | undefined;
        feed.push({
          date: 'STUDY MATERIAL',
          text: `${res.title} — Free Material`,
          link: fileUrl || '/downloads',
          isNew: true,
          isExternal: Boolean(fileUrl && fileUrl.startsWith('http')),
          timestamp: getTS(res),
        });
      });
    }

    dynamicAnnouncements.forEach((ann: AnnouncementItem, idx: number) => {
      feed.push({
        date: ann.date || 'NOTICE',
        text: ann.text,
        link: ann.link || '',
        isNew: ann.isNew ?? false,
        isExternal: Boolean(ann.link && (ann.link.startsWith('http://') || ann.link.startsWith('https://'))),
        timestamp: getTS(ann as unknown as Record<string, unknown>) || (1786800000000 - (idx + 1) * 3600000),
      });
    });

    // Sort ALL updates descending by timestamp (latest strictly on top)
    return feed.sort((a, b) => b.timestamp - a.timestamp);
  }, [liveCaEditions, blogsList, liveCourses, liveTestSeries, liveResources, dynamicAnnouncements]);

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !mobile) return;
    await db.createLead(name, mobile, targetExam);
    setFormSuccess(true);
    setTimeout(() => {
      setName('');
      setMobile('');
      setFormSuccess(false);
    }, 4000);
  };




  return (
    <div className="w-full flex flex-col min-h-screen bg-[var(--bg-color)]">

      {/* 1. HERO BANNER SLIDER (FULL BLEED EDGE-TO-EDGE NO MARGINS) */}
      <section className="relative w-full overflow-hidden bg-[var(--bg-color)]">
        {heroImages[0] && (
          <link rel="preload" as="image" href={heroImages[0]} fetchPriority="high" />
        )}
        {heroImages.length > 0 && (
          <div className="relative w-full aspect-[3840/1326] overflow-hidden bg-slate-950 shadow-md">
            {/* Shimmer Placeholder Skeleton */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 animate-pulse pointer-events-none" />

            {heroImages.map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt={`Hero Banner Slide ${idx + 1}`}
                fetchPriority={idx === 0 ? "high" : "low"}
                loading={idx === 0 ? "eager" : "lazy"}
                decoding={idx === 0 ? "sync" : "async"}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.dataset.retried) {
                    target.dataset.retried = "true";
                    target.src = url.startsWith('/') ? url : `/${url}`;
                  }
                }}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
                  idx === activeImageIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
              />
            ))}

            {/* Slider Indicator Dots */}
            {heroImages.length > 1 && (
              <div className="absolute inset-x-0 bottom-3 sm:bottom-4 z-20 flex items-center justify-center gap-2">
                {heroImages.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    aria-label={`Go to hero slide ${idx + 1}`}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      idx === activeImageIndex ? 'w-6 sm:w-8 bg-amber-500 shadow-md' : 'w-2 bg-white/70 hover:bg-white'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* 2. WELCOME BANNER WITH TYPEWRITER ANIMATION EFFECT */}
      <section className="max-w-8xl mx-auto w-full px-1 sm:px-6 lg:px-8 mt-6 mb-12 relative z-0">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-white/10 p-6 sm:p-10 shadow-md text-center hover-lift relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-amber-500/5 pointer-events-none" />
          <h1 className="font-inlander text-2xl sm:text-4xl lg:text-6xl font-black uppercase tracking-normal sm:tracking-widest leading-snug overflow-hidden">
            <span className="typewriter-text inline-block">
              <span className="text-wave-gradient font-black block">{t('home.welcome')}</span>
            </span>
          </h1>
          <p className="font-bold text-base sm:text-3xl text-wave-gradient font-black mt-3 animate-text-blink">
            {t('home.welcomeDesc')}
          </p>
        </div>
      </section>

      {/* 3. TWO-COLUMN POPULAR COURSES vs ANNOUNCEMENTS */}
      <section className="max-w-8xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Popular Courses */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex justify-between items-end border-b border-slate-150 pb-4">
              <div>
                <span className="text-xs font-bold text-[#1E3A8A] uppercase tracking-widest">{t('home.popularCourses')}</span>
                <h2 className="text-2xl font-heading font-extrabold text-slate-900 mt-1">{t('home.exploreClasses')}</h2>
              </div>
              <Link
                href="/courses"
                className="text-xs font-bold text-[#1E3A8A] hover:text-amber-600 transition-colors flex items-center gap-1 group"
              >
                <span>{t('home.viewAllCourses')}</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {liveCourses.slice(0, 4).map((course) => (
                <div
                  key={course.id}
                  className={`flip-card-container cursor-pointer hover-lift ${flippedCards[course.id] ? 'is-flipped' : ''}`}
                  onClick={() => toggleFlip(course.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleFlip(course.id);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Course: ${course.title}. Click to view syllabus.`}
                >
                  <div className="flip-card-inner">
                    {/* Front Side */}
                    <div className="flip-card-front course-card-premium rounded-3xl">
                      <div className="flip-card-front-content flex flex-col justify-between h-full p-5">
                        <div>
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110">
                            {course.id === 'bpsc-foundation' || course.id === '1' ? <GraduationCap className="w-5 h-5" /> : null}
                            {course.id === 'prelims-test-series' || course.id === '2' ? <Layers className="w-5 h-5" /> : null}
                            {course.id === 'mains-answer-writing' || course.id === '3' ? <FileText className="w-5 h-5" /> : null}
                            {course.id !== 'bpsc-foundation' && course.id !== '1' && course.id !== 'prelims-test-series' && course.id !== '2' && course.id !== 'mains-answer-writing' && course.id !== '3' ? <BookOpen className="w-5 h-5" /> : null}
                          </div>
                          <h3 className="font-heading font-extrabold text-base text-slate-900 mb-1 leading-snug">{course.title}</h3>
                          <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">{course.description}</p>
                        </div>
                        <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs font-bold">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">{course.duration}</span>
                          <span className="text-[9px] text-blue-600 font-extrabold uppercase">Tap / Hover</span>
                        </div>
                      </div>
                    </div>

                    {/* Back Side */}
                    <div className="flip-card-back rounded-3xl">
                      <div className="flip-card-back-content flex flex-col justify-between h-full bg-slate-50/50 dark:bg-slate-900/30 p-4 sm:p-5">
                        <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                          <h4 className="font-heading font-extrabold text-xs text-blue-600 uppercase tracking-wider">
                            Syllabus Overview
                          </h4>

                          {course.syllabus && course.syllabus.length > 0 ? (
                            <ul className="text-xs text-slate-600 dark:text-slate-300 list-disc list-inside space-y-1">
                              {course.syllabus.map((item: string, idx: number) => (
                                <li key={idx} className="line-clamp-2">{item}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-slate-600 dark:text-slate-300 italic">Personalized batch guidance, mock modules, and comprehensive daily strategy evaluation sessions.</p>
                          )}
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
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
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-bold rounded-xl transition-colors inline-flex items-center gap-1"
                          >
                            <span>Details</span>
                            <SlidersHorizontal className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Announcements & Why Choose Us */}
          <div className="lg:col-span-4 space-y-8">

            {/* BPSC "What's New" Official Bulletin Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 p-6 shadow-md hover-lift space-y-4">
              <div className="flex justify-between items-center border-b border-blue-900/20 dark:border-white/10 pb-3">
                <h3 className="font-heading font-black text-base text-[#1E3A8A] dark:text-amber-400 uppercase tracking-wide flex items-center gap-2 border-b-2 border-[#1E3A8A] pb-1">
                  <span>{t('home.whatsNew')}</span>
                </h3>
              </div>

              {/* Unified Live Website Updates Notice Board List */}
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {whatsNewFeed.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 dark:text-slate-500 font-medium text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                    <span>No recent website updates posted yet. Check back soon!</span>
                  </div>
                ) : (
                  whatsNewFeed.map((ann, idx: number) => {
                    const content = (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md uppercase tracking-wider">
                              {ann.date}
                            </span>
                            {ann.isNew && (
                              <span className="text-[8px] font-extrabold bg-red-600 text-white px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse">
                                NEW
                              </span>
                            )}
                          </div>
                          {ann.isExternal && <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-500 transition-colors" />}
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug group-hover:text-blue-800 dark:group-hover:text-amber-400 transition-colors">
                          {ann.text}
                        </p>
                      </div>
                    );

                    return ann.link ? (
                      ann.isExternal ? (
                        <a
                          key={idx}
                          href={ann.link}
                          target="_blank"
                          rel="noreferrer"
                          className="block p-4 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xs transition-all cursor-pointer hover:border-amber-500/50 group"
                        >
                          {content}
                        </a>
                      ) : (
                        <Link
                          key={idx}
                          href={ann.link}
                          className="block p-4 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xs transition-all cursor-pointer hover:border-amber-500/50 group"
                        >
                          {content}
                        </Link>
                      )
                    ) : (
                      <div
                        key={idx}
                        className="block p-4 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xs transition-all hover:border-amber-500/50 group"
                      >
                        {content}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Why Choose Us checklist */}


          </div>

        </div>
      </section>

      {/* 3.4 WHY FINAL ATTEMPT STANDS OUT SECTION (REAL GLASSMORPHISM DESIGN) */}

      {/* 3.4 WHY FINAL ATTEMPT STANDS OUT */}
      <section className="py-24 bg-[var(--bg-color)] relative overflow-hidden">

        {/* Ambient Background */}
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14 relative z-10">

          {/* Heading */}
          <div className="text-center max-w-7xl mx-auto space-y-4">

            <h2 className="text-3.5xl sm:text-4xl font-heading font-black text-slate-900 dark:text-white ">
              {t('home.whyFinalAttempt')}
            </h2>

            <p className="text-m sm:text-base text-slate-600 dark:text-slate-300 max-w-6xl mx-auto font-medium leading-relaxed">
              {t('home.whySubtitle')}
              <br />
              <span className='font-bold'>
                {t('home.whyTagline')}
              </span>
            </p>

          </div>

          {/* Cards Grid with Scroll-Triggered Center Burst Animation */}
          <div
            ref={pillarsGridRef}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 pillars-grid-container"
          >

            {[
              {
                title: t('home.pillar1Title'),
                desc: t('home.pillar1Desc'),
                icon: Users,
                iconColor: 'text-blue-600 dark:text-blue-400',
                bgColor: 'bg-blue-50/90 dark:bg-blue-950/50 border-blue-100 dark:border-blue-900/40',
                gradient: 'from-blue-100/60 to-indigo-50/30'
              },
              {
                title: t('home.pillar2Title'),
                desc: t('home.pillar2Desc'),
                icon: GraduationCap,
                iconColor: 'text-amber-600 dark:text-amber-400',
                bgColor: 'bg-amber-50/90 dark:bg-amber-950/50 border-amber-100 dark:border-amber-900/40',
                gradient: 'from-amber-100/60 to-orange-50/30'
              },
              {
                title: t('home.pillar3Title'),
                desc: t('home.pillar3Desc'),
                icon: Target,
                iconColor: 'text-red-600 dark:text-red-400',
                bgColor: 'bg-red-50/90 dark:bg-red-950/50 border-red-100 dark:border-red-900/40',
                gradient: 'from-red-100/60 to-rose-50/30'
              },
              {
                title: t('home.pillar4Title'),
                desc: t('home.pillar4Desc'),
                icon: Edit3,
                iconColor: 'text-orange-600 dark:text-orange-400',
                bgColor: 'bg-orange-50/90 dark:bg-orange-950/50 border-orange-100 dark:border-orange-900/40',
                gradient: 'from-orange-100/60 to-amber-50/30'
              },
              {
                title: t('home.pillar5Title'),
                desc: t('home.pillar5Desc'),
                icon: BarChart2,
                iconColor: 'text-teal-600 dark:text-teal-400',
                bgColor: 'bg-teal-50/90 dark:bg-teal-950/50 border-teal-100 dark:border-teal-900/40',
                gradient: 'from-teal-100/60 to-emerald-50/30'
              },
              {
                title: t('home.pillar6Title'),
                desc: t('home.pillar6Desc'),
                icon: Rocket,
                iconColor: 'text-purple-600 dark:text-purple-400',
                bgColor: 'bg-purple-50/90 dark:bg-purple-950/50 border-purple-100 dark:border-purple-900/40',
                gradient: 'from-purple-100/60 to-indigo-50/30'
              }
            ].map((item, idx) => (

              <div
                key={idx}
                ref={(el) => {
                  tiltRefs.current[idx] = el;
                }}
                className="
            real-glass-card
            group
            relative
            min-h-[270px]
            overflow-hidden
            rounded-[28px]
            border border-amber-200/70
            bg-white/80
            dark:bg-slate-900/80
            backdrop-blur-xl
            shadow-[0_12px_40px_rgba(15,23,42,0.06)]
            transition-all duration-500
            hover:-translate-y-2
            hover:shadow-[0_25px_60px_rgba(15,23,42,0.14)]
          "
              >

                {/* Fixed visual background */}
                <div
                  className={`
              absolute
              inset-0
              bg-gradient-to-br
              ${item.gradient}
              opacity-60
              dark:opacity-10
              pointer-events-none
            `}
                />



                {/* Decorative grid */}
                <div
                  className="
              absolute inset-0
              opacity-[0.035]
              dark:opacity-[0.04]
              pointer-events-none
              bg-[radial-gradient(circle_at_1px_1px,currentColor_1px,transparent_0)]
              [background-size:18px_18px]
            "
                />

                {/* Large watermark icon */}
                <div
                  className="
              absolute
              -right-5
              -bottom-8
              text-[130px]
              leading-none
              grayscale
              opacity-[0.07]
              pointer-events-none
              select-none
              transition-all
              duration-700
              group-hover:scale-110
              group-hover:rotate-6
              group-hover:opacity-[0.12]
            "
                >
                  <item.icon className="w-full h-full" />
                </div>

                {/* Content */}
                <div
                  className="
              relative
              z-10
              h-full
              p-7 sm:p-8
              flex
              flex-col
              justify-between
            "
                >

                  {/* Icon Badge */}
                  <div
                    className="
                      w-12 h-12
                      rounded-xl
                      bg-white
                      border border-slate-100
                      shadow-sm
                      flex items-center justify-center
                      transition-all duration-500
                      group-hover:scale-110
                    "
                  >
                    <item.icon className={`w-6 h-6 ${item.iconColor}`} />
                  </div>

                  {/* Text */}
                  <div className="mt-8 space-y-3">

                    <div className="w-8 h-1 rounded-full bg-amber-500 transition-all duration-500 group-hover:w-14" />

                    <h3
                      className="
                  font-heading
                  font-black
                  text-xl
                  text-slate-900
                  dark:text-white
                "
                    >
                      {item.title}
                    </h3>

                    <p
                      className="
                  text-sm
                  leading-relaxed
                  text-slate-600
                  dark:text-slate-300
                  max-w-sm
                "
                    >
                      {item.desc}
                    </p>

                  </div>

                </div>

                {/* Hover shine */}
                <div
                  className="
              absolute
              inset-0
              pointer-events-none
              opacity-0
              group-hover:opacity-100
              transition-opacity
              duration-500
              bg-[linear-gradient(120deg,transparent_20%,rgba(255,255,255,0.35)_50%,transparent_80%)]
              translate-x-[-100%]
              group-hover:translate-x-[100%]
              transition-transform
            "
                />

              </div>

            ))}

          </div>
        </div>
      </section>

      {/* 3.44 CORE PREPARATION PORTAL QUICK ACCESS GRID (MATCHING ORIGINAL DESIGN) */}
      <section className="py-20 bg-[var(--bg-color)] border-y border-slate-150 dark:border-white/10 relative z-10">
        {/* SVG Gradient Definition matching User Palette image (#8A2387 -> #E94057 -> #F27121) */}
        <svg className="w-0 h-0 absolute pointer-events-none" aria-hidden="true">
          <defs>
            <linearGradient id="icon-palette-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8A2387" />
              <stop offset="50%" stopColor="#E94057" />
              <stop offset="100%" stopColor="#F27121" />
            </linearGradient>
          </defs>
        </svg>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-7xl mx-auto">
            {[
              {
                title: t('home.quickCA'),
                icon: Newspaper,
                iconColor: 'text-red-500',
                link: '/current-affairs'
              },
              {
                title: t('home.quickQuiz'),
                icon: Flame,
                iconColor: 'text-amber-500',
                link: '/daily-quiz'
              },
              {
                title: t('home.quickPYQ'),
                icon: FileText,
                iconColor: 'text-blue-500',
                link: '/downloads/pyq'
              },
              {
                title: t('home.quickNCERT'),
                icon: BookOpen,
                iconColor: 'text-emerald-500',
                link: '/downloads/ncert'
              },
              {
                title: t('home.quickUseful', 'USEFUL DOCUMENTS'),
                icon: Zap,
                iconColor: 'text-amber-500',
                link: '/downloads/useful-documents'
              },
              {
                title: t('home.quickValue'),
                icon: Lightbulb,
                iconColor: 'text-purple-500',
                link: '/downloads/value-added-mains'
              },
              {
                title: t('home.quickToppers'),
                icon: FileCheck,
                iconColor: 'text-teal-500',
                link: '/downloads/toppers-copies'
              },
              {
                title: t('home.quickSyllabus'),
                icon: Compass,
                iconColor: 'text-indigo-500',
                link: '/syllabus-strategy'
              },
              {
                title: t('home.quickPublication'),
                imgSrc: '/favicon.png',
                link: '/downloads/fa-publication'
              }
            ].map((item, idx) => (
              <Link
                key={idx}
                href={item.link}
                className="group relative overflow-hidden rounded-3xl p-8 sm:p-10 text-center flex flex-col items-center justify-center gap-5 transition-all duration-300 hover-lift bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl hover:scale-[1.03] border border-slate-200/80 dark:border-slate-800 cursor-pointer"
              >
                <div className="flex items-center justify-center p-2">
                  {item.imgSrc ? (
                    <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-full overflow-hidden flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                      <img src={item.imgSrc} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                  ) : item.icon ? (
                    <item.icon className={`w-10 h-10 sm:w-12 sm:h-12 ${item.iconColor} stroke-[2.2] group-hover:scale-110 transition-all duration-300`} />
                  ) : null}
                </div>
                <h3 className="font-heading font-black text-xs sm:text-sm text-slate-800 dark:text-white uppercase tracking-wider leading-relaxed">
                  {item.title}
                </h3>
              </Link>
            ))}
          </div>

        </div>
      </section>

      {/* 3.45 YOUTUBE INTEGRATION VIDEOS SECTION */}
      {latestVideos.length > 0 && (
        <section className="py-20 bg-[var(--bg-color)] border-t border-slate-100 dark:border-white/[0.06]">
          <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 max-w-7xl mx-auto">
              <div className="space-y-3">
                <h2 className="text-3xl font-heading font-black text-slate-900 dark:text-white leading-tight">
                  {t('home.latestChannel')}
                </h2>

              </div>
              <Link
                href="https://www.youtube.com/@FinalAttemptOfficial/videos"
                className="btn-outline text-xs flex items-center gap-1.5 shrink-0"
              >
                <span>{t('home.viewAllVideos')}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {latestVideos.map((video) => (
                <div
                  key={video.youtubeVideoId}
                  className="course-card-premium rounded-3xl overflow-hidden flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Embedded Player */}
                    {/* YouTube Facade: shows thumbnail, loads iframe only on click (saves ~500KB of YouTube JS) */}
                    <YoutubeFacade videoId={video.youtubeVideoId} title={video.title} />

                    <div className="p-6 space-y-3">
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                        Published · {new Date(video.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                      <h3 className="font-heading font-extrabold text-sm text-slate-900 dark:text-white line-clamp-2 leading-snug">
                        {video.title}
                      </h3>
                      {video.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {video.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="p-6 pt-0 border-t border-slate-50 dark:border-white/[0.04] mt-auto">
                    <a
                      href={`https://www.youtube.com/watch?v=${video.youtubeVideoId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-primary w-full text-center text-xs flex justify-center items-center gap-1.5"
                    >
                      <span>{t('home.watchOnYoutube')}</span>
                      <Video className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 3.48 ARTICLES & INSIGHTS BLOGS SECTION (EXPANDABLE MODAL CARDS) */}
      <section className="py-20 bg-[var(--bg-color)] border-t border-slate-100 dark:border-white/[0.06]">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 max-w-7xl mx-auto">
            <div className="space-y-3">

              <h2 className="text-3xl sm:text-4xl font-heading font-black text-slate-900 dark:text-white leading-tight">
                {t('home.latestArticles')}
              </h2>
            </div>
            <Link
              href="/blog"
              className="btn-outline text-xs flex items-center gap-1.5 shrink-0"
            >
              <span>{t('home.exploreArticles')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Cards Grid Matching Modern Design */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {blogsList.slice(0, 3).map((blog) => (
              <Link
                key={blog.id}
                href={`/blog/${blog.slug || blog.id}`}
                className="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:border-amber-500/50 transition-all duration-300 flex flex-col justify-between cursor-pointer"
              >
                <div className="space-y-4">
                  {/* Card Image Cover */}
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <img
                      src={resolveUrl(blog.imageUrl || blog.cover_image_url || blog.photo || blog.displayImage) || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=800'}
                      alt={blog.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="text-[9px] font-black uppercase tracking-wider text-amber-900 bg-amber-400/90 backdrop-blur-md px-2.5 py-1 rounded-lg shadow-sm">
                        {blog.category || 'EXAM STRATEGY'}
                      </span>
                    </div>
                  </div>

                  {/* Card Body Content */}
                  <div className="p-6 space-y-3">
                    <h3 className="font-heading font-extrabold text-base text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug">
                      {blog.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                      {(blog.blurb || blog.content) ? String(blog.blurb || blog.content).replace(/<[^>]*>?/gm, '').slice(0, 140) + '...' : 'Read our comprehensive exam strategy breakdown...'}
                    </p>
                  </div>
                </div>

                {/* Card Footer Author & Expand Button */}
                <div className="px-6 pb-6 pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-[10px]">
                      {(blog.author ? String(blog.author) : 'Final Attempt').charAt(0)}
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {blog.author || 'Final Attempt'}
                    </span>
                  </div>


                  <span className="text-slate-400 group-hover:text-amber-500 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">
                    <ArrowRight className="w-4 h-4 -rotate-45" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* EXPANDED ARTICLE MODAL OVERLAY */}
      {expandedBlog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header Bar */}
            <div className="p-6 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20">
                  {expandedBlog.category || 'ARTICLE'}
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  • {expandedBlog.readTime || '5 min read'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setExpandedBlog(null)}
                className="w-9 h-9 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-500 hover:text-slate-950 font-bold flex items-center justify-center transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body Content Area */}
            <div className="p-6 sm:p-10 overflow-y-auto space-y-6">
              {/* Cover Image */}
              {(expandedBlog.imageUrl || expandedBlog.cover_image_url || expandedBlog.photo || expandedBlog.displayImage) && (
                <div className="w-full max-h-[380px] rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center p-1 shadow-md border border-slate-200 dark:border-white/10">
                  <img
                    src={resolveUrl(expandedBlog.imageUrl || expandedBlog.cover_image_url || expandedBlog.photo || expandedBlog.displayImage)}
                    alt={expandedBlog.title}
                    className="max-h-[360px] w-auto max-w-full object-contain rounded-xl"
                  />
                </div>
              )}

              <div className="space-y-3">
                <h2 className="text-2xl sm:text-4xl font-heading font-black text-slate-900 dark:text-white leading-tight">
                  {expandedBlog.title}
                </h2>
                <div className="flex items-center gap-3 text-xs text-slate-400 font-medium border-b border-slate-100 dark:border-white/10 pb-4">
                  <span>Written by <strong className="text-slate-700 dark:text-slate-200">{expandedBlog.author || 'Final Attempt'}</strong></span>
                  <span>•</span>
                  <span>Published {expandedBlog.publishDate || 'Recent'}</span>
                </div>
              </div>

              {/* Rich Body Content */}
              <div
                className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed space-y-4
                  [&_h1]:text-2xl [&_h1]:font-black [&_h1]:font-heading
                  [&_h2]:text-xl [&_h2]:font-bold [&_h2]:font-heading
                  [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-6"
                dangerouslySetInnerHTML={{ __html: expandedBlog.content || expandedBlog.blurb || expandedBlog.summary || 'Content details loading...' }}
              />
            </div>

            {/* Modal Footer Bar */}
            <div className="p-6 border-t border-slate-100 dark:border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50 dark:bg-slate-900/50">
              <span className="text-xs text-slate-400 font-semibold">
                Share this article with fellow civil services aspirants.
              </span>
              <button
                type="button"
                onClick={() => setExpandedBlog(null)}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer"
              >
                Close Article
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3.5 PREMIUM TESTIMONIALS SECTION */}
      <section className="py-20 bg-gradient-to-b from-[var(--bg-color)] to-slate-50 border-t border-slate-100 overflow-hidden">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <span className="text-s font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl uppercase tracking-widest">
              {t('home.mentorsPen')}
            </span>
            <h3 className="text-xs font-heading font-black text-slate-900 leading-tight">

            </h3>
            <p className="text-s font-black text-slate-900 max-w-md mx-auto">
              {t('home.mentorsWords')}
            </p>
          </div>

          <TestimonialCarousel />
        </div>
      </section>

      {/* 3.6 ABOUT FINAL ATTEMPT DETAILS */}
      <section className="py-20 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/[0.06]">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

            {/* Left Column: About Final Attempt */}
            <div className="lg:col-span-7 space-y-6">

              <h2 className="text-3xl font-heading font-black text-slate-900 dark:text-white leading-tight">
                {t('home.aboutTitle')}
              </h2>

              <div className="space-y-4 text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">
                <p>{t('home.aboutP1')}</p>
                <p>{t('home.aboutP2')}</p>
                <p>{t('home.aboutP3')}</p>
                <p>{t('home.aboutP4')}</p>
              </div>
            </div>

            {/* Right Column: Community & Call to Action */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900/40 p-8 rounded-3xl border border-slate-100/80 dark:border-white/[0.06] shadow-sm space-y-6">
              <h3 className="font-heading font-extrabold text-lg text-slate-900 dark:text-white">
                {t('home.communityTitle')}
              </h3>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('home.communityDesc')}
              </p>

              <div className="pt-4 border-t border-slate-50 dark:border-white/[0.04] space-y-4">
                <div className="text-[#1E3A8A] dark:text-amber-500 font-extrabold text-sm sm:text-base tracking-wide flex items-center gap-2">
                  <span>🎯</span>
                  <span>{t('home.communityTagline')}</span>
                </div>

                <div className="flex gap-4">
                  <a
                    href="#book-session"
                    className="btn-primary text-xs w-full text-center flex justify-center items-center gap-1.5"
                  >
                    <span>{t('home.getMentorship')}</span>
                    <ChevronRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. STRATEGY LEAD CAPTURE FORM */}
      <section id="book-session" className="py-16 bg-[var(--bg-color)] border-t border-slate-100 dark:border-white/[0.06]">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="text-center space-y-4 mb-8">
              <h3 className="text-2xl font-heading font-extrabold text-slate-900">
                {t('home.counselingTitle')}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {t('home.counselingDesc')}
              </p>
            </div>

            {formSuccess ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-6 rounded-2xl text-center space-y-2">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
                <h5 className="font-bold text-sm">Session Registration Successful!</h5>
                <p className="text-xs text-emerald-600">Our senior counselor will contact you within 24 hours to schedule your slot.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitLead} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('home.fullName')}</label>
                  <input
                    type="text"
                    required
                    placeholder={t('home.enterName', 'Enter your name')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('home.mobileNumber')}</label>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    placeholder={t('home.enterMobile', 'Enter mobile number')}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full px-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('home.targetExam')}</label>
                  <select
                    value={targetExam}
                    onChange={(e) => setTargetExam(e.target.value)}
                    className="w-full px-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="BPSC Foundation Batch">{t('home.optFoundation', 'BPSC Foundation Batch')}</option>
                    <option value="BPSC Target Batch">{t('home.optTarget', 'BPSC Target Batch')}</option>
                    <option value="Prelims Test Series">{t('home.optPrelimsTS', 'Prelims Test Series')}</option>
                    <option value="Mains Answer Writing">{t('home.optMainsAW', 'Mains Answer Writing')}</option>
                  </select>
                </div>
                <div className="sm:col-span-3 pt-4 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-slate-100 mt-4">
                  <p className="text-[10px] text-slate-400 font-medium">
                    {t('home.leadConsentDesc', 'By submitting, you agree to receive exam updates and counsel calls.')}
                  </p>
                  <div className="flex gap-4 w-full sm:w-auto">
                    <button
                      type="submit"
                      className="flex-grow sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-[#F59E0B] hover:bg-amber-600 text-white font-bold rounded-xl text-xs shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                    >
                      <span>{t('home.bookSessionBtn')}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>


                    <a
                      href="https://wa.me/919709992093"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 p-4 bg-[#22C55E] hover:bg-green-600 text-white font-bold rounded-2xl shadow-3xs text-xs transition-colors"
                    >
                      <NextImage
                        src="/whatsapp-icon.svg"
                        alt="WhatsApp"
                        width={20}
                        height={20}
                        className="w-4 h-4"
                      />

                      <span>{t('home.whatsappChat')}</span>
                    </a>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 5. BOTTOM BAR KEY HIGHLIGHTS */}
      <footer className="w-full bg-[#0F172A] text-white py-6 border-t border-slate-800">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { titleKey: 'home.hlDailyCA', fallbackTitle: 'Daily Current Affairs', subKey: 'home.hlDailyCASub', fallbackSub: 'Stay updated every day', icon: Calendar, delay: '0s' },
              { titleKey: 'home.hlExpertStrategy', fallbackTitle: 'Expert Strategy', subKey: 'home.hlExpertStrategySub', fallbackSub: 'Smart approach for every exam', icon: Compass, delay: '0.4s' },
              { titleKey: 'home.hlPerfTracking', fallbackTitle: 'Performance Tracking', subKey: 'home.hlPerfTrackingSub', fallbackSub: 'Monitor your prep progress', icon: TrendingUp, delay: '0.8s' },
              { titleKey: 'home.hlAccessibleAnytime', fallbackTitle: 'Accessible Anytime', subKey: 'home.hlAccessibleAnytimeSub', fallbackSub: 'Learn anytime, anywhere', icon: ShieldCheck, delay: '1.2s' }
            ].map((hl, idx) => (
              <div key={idx} className="flex items-center gap-4 border-r border-slate-800 last:border-none px-4">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-amber-400 shrink-0">
                  <hl.icon className="w-5 h-5" />
                </div>
                <div>
                  <h4
                    className="text-xs font-bold text-amber-400 tracking-wide animate-text-blink"
                    style={{ animationDelay: hl.delay }}
                  >
                    {t(hl.titleKey, hl.fallbackTitle)}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                    {t(hl.subKey, hl.fallbackSub)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </footer>

    </div>
  );
}
