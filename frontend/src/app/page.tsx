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
  Flame,
  Download,
  Star
} from 'lucide-react';

import { db, Course } from '@/services/db';
import { useTranslation } from '@/context/LocaleContext';
import { useTheme } from '@/context/ThemeContext';
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
  const { theme } = useTheme();
  const isDark = theme === 'dark';

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

  const heroImages = useMemo(() => {
    return heroSettings.heroImageUrl
      ? heroSettings.heroImageUrl.split(',').map(img => resolveUrl(img.trim())).filter(Boolean)
      : [];
  }, [heroSettings.heroImageUrl]);

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

  const pillarsGridRef = useRef<HTMLDivElement | null>(null);

  // Scroll animation: Grid cards are visible by default
  useEffect(() => {
    const el = pillarsGridRef.current;
    if (!el) return;
    el.classList.add('pillars-visible');
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
            <div className="flex justify-between items-end border-b border-slate-150 dark:border-white/10 pb-4">
              <div>
                <span className="text-xs font-bold text-[#1E3A8A] dark:text-amber-400 uppercase tracking-widest">{t('home.popularCourses')}</span>
                <h2 className="text-2xl font-heading font-extrabold text-slate-900 dark:text-white mt-1">{t('home.exploreClasses')}</h2>
              </div>
              <Link
                href="/courses"
                className="text-xs font-bold text-[#1E3A8A] hover:text-amber-600 transition-colors flex items-center gap-1 group"
              >
                <span>{t('home.viewAllCourses')}</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>

            {(!liveCourses || liveCourses.length === 0) ? (
              <div className="relative overflow-hidden bg-white dark:bg-[#0F172A] rounded-3xl border border-slate-200/80 dark:border-white/10 p-8 sm:p-10 shadow-sm text-center">
                <div className="max-w-md mx-auto space-y-4">
                  <div className="inline-flex p-3 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-[#1E3A8A] dark:text-blue-400 border border-blue-100 dark:border-blue-800/40">
                    <GraduationCap className="w-8 h-8" />
                  </div>
                  
                  <div className="space-y-1.5">
                    <span className="inline-block px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
                      New Batches Launching Soon
                    </span>
                    <h3 className="text-xl sm:text-2xl font-heading font-black text-slate-950 dark:text-white">
                      {locale === 'hi' ? '71st BPSC & UPSC नए बैच जल्द आ रहे हैं' : '71st BPSC & UPSC Foundation Batches'}
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                    {locale === 'hi'
                      ? 'नए इंटीग्रेटेड मेंटरशिप प्रोग्राम, टेस्ट सीरीज और आंसर राइटिंग मॉड्यूल फाइनल किए जा रहे हैं।'
                      : 'Comprehensive guided mentorship, high-yield Prelims test series & GS Mains answer writing programs opening shortly.'}
                  </p>

                  <div className="pt-2 flex items-center justify-center gap-3">
                    <Link
                      href="/courses"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1E3A8A] hover:bg-blue-800 text-white font-bold text-xs transition-all shadow-sm"
                    >
                      <span>Explore Courses</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <a
                      href="#book-session"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all"
                    >
                      <span>Get Notified</span>
                    </a>
                  </div>
                </div>
              </div>
            ) : (
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
            )}
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

      {/* 3.4 WHY FINAL ATTEMPT STANDS OUT (MINIMALIST HIGH-END EDITORIAL DESIGN) */}
      <section className="py-28 bg-[var(--bg-color)] relative overflow-hidden">

        {/* Subtle Ambient Radial Gradients */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-amber-500/5 via-blue-500/5 to-transparent blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 relative z-10">

          {/* Heading */}
          <div className="text-center max-w-5xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-heading font-black text-slate-950 dark:text-white">
              {t('home.whyFinalAttempt')}
            </h2>

            <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 max-w-4xl mx-auto font-medium leading-relaxed">
              {t('home.whySubtitle')}
              <br />
              <span className="font-bold text-amber-600 dark:text-amber-400 block mt-2 text-base">
                {t('home.whyTagline')}
              </span>
            </p>
          </div>

          {/* Cards Grid */}
          <div
            ref={pillarsGridRef}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7"
          >
            {[
              {
                title: t('home.pillar1Title'),
                desc: t('home.pillar1Desc'),
                icon: Users,
                iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
              },
              {
                title: t('home.pillar2Title'),
                desc: t('home.pillar2Desc'),
                icon: GraduationCap,
                iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
              },
              {
                title: t('home.pillar3Title'),
                desc: t('home.pillar3Desc'),
                icon: Target,
                iconBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
              },
              {
                title: t('home.pillar4Title'),
                desc: t('home.pillar4Desc'),
                icon: Edit3,
                iconBg: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20'
              },
              {
                title: t('home.pillar5Title'),
                desc: t('home.pillar5Desc'),
                icon: BarChart2,
                iconBg: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20'
              },
              {
                title: t('home.pillar6Title'),
                desc: t('home.pillar6Desc'),
                icon: Rocket,
                iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
              }
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0F172A] border border-black/10 dark:border-white/10 shadow-sm flex flex-col justify-start space-y-3"
              >
                {/* Header: Icon + Title Side-by-Side */}
                <div className="flex items-center gap-3.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.iconBg}`}>
                    <item.icon className="w-5 h-5" />
                  </div>

                  <h3 className="font-heading font-black text-base sm:text-lg text-slate-900 dark:text-white leading-snug">
                    {item.title}
                  </h3>
                </div>

                {/* Description below */}
                <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300 font-normal">
                  {item.desc}
                </p>
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
                link: '/daily-quiz',
                badge: 'HOT'
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
                {item.badge && (
                  <span className="absolute top-4 right-4 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25 animate-pulse">
                    <Flame className="w-3 h-3 fill-current" />
                    {item.badge}
                  </span>
                )}
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
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=800';
                      }}
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
      <section className="py-20 bg-gradient-to-b from-[var(--bg-color)] to-slate-50 dark:from-[var(--bg-color)] dark:to-[var(--bg-color)] border-t border-slate-100 dark:border-white/[0.06] overflow-hidden">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <span className="text-s font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl uppercase tracking-widest">
              {t('home.mentorsPen')}
            </span>
            <p className="text-s font-black text-slate-900 dark:text-white max-w-md mx-auto">
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

      {/* 3.7 FINAL ATTEMPT OFFICIAL MOBILE LEARNING SUITE */}
      <section id="download-app" className="py-16 sm:py-24 transition-colors duration-200 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Main Showcase Stage Card with rich backdrop & subtle ambient glows */}
          <div
            className="relative overflow-hidden rounded-[36px] p-6 sm:p-10 lg:p-14 shadow-2xl border transition-all duration-300"
            style={{
              backgroundColor: isDark ? '#0A0F1D' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#FDE68A',
              color: isDark ? '#FFFFFF' : '#0F172A',
              boxShadow: isDark 
                ? '0 25px 60px -15px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                : '0 25px 60px -20px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)'
            }}
          >
            {/* Ambient Radial Spotlight (Warm Amber top-left + Royal Blue center-right behind phone) */}
            <div className="absolute top-0 right-0 sm:right-12 w-96 h-96 rounded-full bg-amber-500/[0.08] dark:bg-amber-500/[0.12] blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-[28rem] h-[28rem] rounded-full bg-blue-600/[0.06] dark:bg-blue-600/[0.1] blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-emerald-500/[0.05] dark:bg-emerald-500/[0.07] blur-3xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              
              {/* Left Column: Final Attempt Mobile Value Proposition */}
              <div className="lg:col-span-7 space-y-7">
                
                {/* Header Badge */}
                <div 
                  className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider border"
                  style={{
                    backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.12)',
                    borderColor: isDark ? 'rgba(245, 158, 11, 0.4)' : '#F59E0B',
                    color: isDark ? '#FCD34D' : '#B45309'
                  }}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  <span>{t('nav.appShowcaseBadge', 'BPSC & State PCS 2026-27')}</span>
                  <span className="opacity-60">•</span>
                  <span style={{ color: isDark ? '#FFFFFF' : '#1E293B', fontWeight: 700 }}>
                    {t('nav.appShowcaseBadgeSub', 'Official Mobile App')}
                  </span>
                </div>

                {/* Main Heading */}
                <div className="space-y-2">
                  <h2 
                    className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black tracking-tight leading-[1.15]"
                    style={{ color: isDark ? '#FFFFFF' : '#0A0F1D' }}
                  >
                    {t('nav.appShowcaseTitle', 'Crack Civil Services with')}{' '}
                    <span className="text-[#F59E0B]">
                      Final Attempt
                    </span>
                  </h2>
                  <p 
                    className="text-base sm:text-lg font-bold tracking-wide"
                    style={{ color: isDark ? '#FBBF24' : '#1E3A8A' }}
                  >
                    {t('nav.appShowcaseTagline', 'Ready for your Final Attempt?')}
                  </p>
                  <p 
                    className="text-xs sm:text-sm leading-relaxed max-w-2xl font-medium pt-1"
                    style={{ color: isDark ? '#F1F5F9' : '#334155' }}
                  >
                    {t('nav.appShowcaseDesc', "India's dedicated BPSC learning app. Practice topic-wise PYQs with reverse engineering, read bilingual daily current affairs capsules, and study with top faculty guidance right on your phone.")}
                  </p>
                </div>

                {/* Structured 3 Feature Advantage Rows — High contrast, zero muddy grey */}
                <div className="space-y-3 pt-1">
                  {/* Row 1: PYQ & Test Series */}
                  <div
                    className="flex items-start gap-3.5 p-3.5 rounded-2xl border transition-all duration-200 hover:shadow-sm"
                    style={{
                      backgroundColor: isDark ? '#111827' : '#FFFFFF',
                      borderColor: isDark ? 'rgba(59, 130, 246, 0.35)' : '#BFDBFE'
                    }}
                  >
                    <div 
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-black text-sm border"
                      style={{
                        backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                        borderColor: isDark ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.25)',
                        color: isDark ? '#60A5FA' : '#1D4ED8'
                      }}
                    >
                      <Target className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 
                        className="text-xs sm:text-sm font-extrabold flex items-center gap-2"
                        style={{ color: isDark ? '#FFFFFF' : '#0A0F1D' }}
                      >
                        <span>{t('nav.appFeature1Title', 'BPSC Prelims PYQ Test Engine')}</span>
                        <span 
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                          style={{
                            backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.15)',
                            borderColor: isDark ? 'rgba(245, 158, 11, 0.4)' : '#FDE68A',
                            color: isDark ? '#FCD34D' : '#B45309'
                          }}
                        >
                          {t('nav.appFeature1Tag', 'Topic-Wise')}
                        </span>
                      </h4>
                      <p 
                        className="text-[11px] sm:text-xs mt-0.5 leading-snug"
                        style={{ color: isDark ? '#E2E8F0' : '#475569' }}
                      >
                        {t('nav.appFeature1Desc', 'Timed sectional & full mock test series with real-time negative-mark analysis.')}
                      </p>
                    </div>
                  </div>

                  {/* Row 2: Live Classes & Recorded Vault */}
                  <div
                    className="flex items-start gap-3.5 p-3.5 rounded-2xl border transition-all duration-200 hover:shadow-sm"
                    style={{
                      backgroundColor: isDark ? '#111827' : '#FFFDF5',
                      borderColor: isDark ? 'rgba(245, 158, 11, 0.35)' : '#FDE68A'
                    }}
                  >
                    <div 
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
                      style={{
                        backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.15)',
                        borderColor: isDark ? 'rgba(245, 158, 11, 0.4)' : 'rgba(245, 158, 11, 0.3)',
                        color: isDark ? '#FCD34D' : '#B45309'
                      }}
                    >
                      <Video className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 
                        className="text-xs sm:text-sm font-extrabold flex items-center gap-2"
                        style={{ color: isDark ? '#FFFFFF' : '#0A0F1D' }}
                      >
                        <span>{t('nav.appFeature2Title', 'Daily Interactive Live Classes')}</span>
                        <span 
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                          style={{
                            backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.15)',
                            borderColor: isDark ? 'rgba(16, 185, 129, 0.4)' : '#BBF7D0',
                            color: isDark ? '#6EE7B7' : '#047857'
                          }}
                        >
                          {t('nav.appFeature2Tag', '1080p HD')}
                        </span>
                      </h4>
                      <p 
                        className="text-[11px] sm:text-xs mt-0.5 leading-snug"
                        style={{ color: isDark ? '#E2E8F0' : '#475569' }}
                      >
                        {t('nav.appFeature2Desc', 'High-definition streaming with live faculty chat, bookmarking & full replay archive.')}
                      </p>
                    </div>
                  </div>

                  {/* Row 3: Bihar Special & Current Affairs */}
                  <div
                    className="flex items-start gap-3.5 p-3.5 rounded-2xl border transition-all duration-200 hover:shadow-sm"
                    style={{
                      backgroundColor: isDark ? '#111827' : '#F0FDF4',
                      borderColor: isDark ? 'rgba(16, 185, 129, 0.35)' : '#BBF7D0'
                    }}
                  >
                    <div 
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
                      style={{
                        backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.15)',
                        borderColor: isDark ? 'rgba(16, 185, 129, 0.4)' : 'rgba(16, 185, 129, 0.3)',
                        color: isDark ? '#6EE7B7' : '#047857'
                      }}
                    >
                      <Download className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 
                        className="text-xs sm:text-sm font-extrabold flex items-center gap-2"
                        style={{ color: isDark ? '#FFFFFF' : '#0A0F1D' }}
                      >
                        <span>{t('nav.appFeature3Title', 'Bihar Tathya Sangrah & CA Capsules')}</span>
                        <span 
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                          style={{
                            backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)',
                            borderColor: isDark ? 'rgba(59, 130, 246, 0.4)' : '#BFDBFE',
                            color: isDark ? '#93C5FD' : '#1D4ED8'
                          }}
                        >
                          {t('nav.appFeature3Tag', 'Bilingual')}
                        </span>
                      </h4>
                      <p 
                        className="text-[11px] sm:text-xs mt-0.5 leading-snug"
                        style={{ color: isDark ? '#E2E8F0' : '#475569' }}
                      >
                        {t('nav.appFeature3Desc', 'Daily 6 exam-relevant editorial summaries and high-yield offline downloadable revision PDFs.')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Redesigned Premium CTA & Social Proof Strip (Zero Muddy Grey) */}
                <div className="pt-2 flex flex-wrap items-center gap-4">
                  {/* Official Google Play Store Badge */}
                  <a
                    href="https://play.google.com/store/apps/details?id=com.nighwantech.finalattempt"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-3 px-5 py-2.5 rounded-xl bg-black hover:bg-neutral-900 text-white border border-neutral-800 hover:border-amber-400 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
                  >
                    <div className="w-7 h-7 flex items-center justify-center shrink-0">
                      <svg className="w-6 h-6 group-hover:scale-105 transition-transform" viewBox="0 0 512 512" aria-hidden="true">
                        <path fill="#00D2FF" d="M47.7 20.3c-7.3 7.8-11.7 19.3-11.7 34v403.4c0 14.7 4.4 26.2 11.7 34l1.9 1.8 225.8-225.8v-5.4L49.6 18.5l-1.9 1.8z" />
                        <path fill="#00E676" d="M351.4 330.4l-75.9-75.9v-5.4l75.9-75.9 1.8 1 89.8 51.1c25.6 14.5 25.6 38.4 0 53l-89.8 51.1-1.8 1.1z" />
                        <path fill="#FF3D00" d="M353.2 329.4L275.5 251.7 47.7 479.5c8.4 8.9 22.3 10 37.8 1.2l267.7-151.3z" />
                        <path fill="#FFD600" d="M353.2 178.6L85.5 27.3C70 18.5 56.1 19.6 47.7 28.5l227.8 227.8 77.7-77.7z" />
                      </svg>
                    </div>
                    <div className="text-left font-sans leading-none">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-white/90 block">
                        GET IT ON
                      </span>
                      <span className="text-[19px] font-bold text-white tracking-tight block mt-0.5">
                        Google Play
                      </span>
                    </div>
                  </a>

                  {/* Rating Pill Badge: Warm Amber Theme */}
                  <div 
                    className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border"
                    style={{
                      backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)',
                      borderColor: isDark ? 'rgba(245, 158, 11, 0.35)' : '#FDE68A'
                    }}
                  >
                    <div className="flex text-amber-500">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    </div>
                    <div className="leading-tight">
                      <span 
                        className="text-xs font-black"
                        style={{ color: isDark ? '#FFFFFF' : '#0A0F1D' }}
                      >
                        4.8
                      </span>
                      <span 
                        className="text-[10px] ml-1 font-bold"
                        style={{ color: isDark ? '#FCD34D' : '#B45309' }}
                      >
                        {t('nav.appPlayRating', 'Rating')}
                      </span>
                    </div>
                  </div>

                  {/* Play Protect Verified Pill Badge: Fresh Emerald Theme */}
                  <div 
                    className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border"
                    style={{
                      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                      borderColor: isDark ? 'rgba(16, 185, 129, 0.35)' : '#BBF7D0'
                    }}
                  >
                    <ShieldCheck 
                      className="w-4 h-4" 
                      style={{ color: isDark ? '#34D399' : '#059669' }} 
                    />
                    <span 
                      className="text-xs font-bold leading-tight"
                      style={{ color: isDark ? '#6EE7B7' : '#047857' }}
                    >
                      {t('nav.appPlayVerified', 'Verified Safe')}
                    </span>
                  </div>
                </div>

              </div>

              {/* Right Column: Hero Stage Spotlight Presentation of iPhone Showcase */}
              <div className="lg:col-span-5 flex flex-col justify-center items-center relative py-4">
                
                {/* Spotlight Backdrop Radial behind iPhone */}
                <div 
                  className="absolute -inset-6 rounded-full blur-3xl pointer-events-none opacity-80"
                  style={{
                    background: isDark
                      ? 'radial-gradient(circle at center, rgba(245, 158, 11, 0.18) 0%, rgba(30, 58, 138, 0.12) 50%, transparent 75%)'
                      : 'radial-gradient(circle at center, rgba(251, 191, 36, 0.22) 0%, rgba(59, 130, 246, 0.1) 50%, transparent 75%)'
                  }}
                />

                {/* iPhone Hardware Outer Frame (Ultra-Slim Titanium Showcase) */}
                <div className="relative">
                  <div
                    className="relative w-[245px] sm:w-[265px] rounded-[46px] p-[5px] border-[2px] transition-all"
                    style={{
                      backgroundColor: '#090D16',
                      borderColor: isDark ? '#334155' : '#1E293B',
                      boxShadow: isDark
                        ? '0 25px 50px -12px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.08)'
                        : '0 20px 40px -12px rgba(15,23,42,0.25), 0 0 0 1px rgba(15,23,42,0.2)'
                    }}
                  >
                    {/* iPhone Side Hardware Buttons (Flush Profile) */}
                    <div className="absolute -left-[3px] top-[68px] w-[2px] h-[16px] bg-slate-500 rounded-l-xs" />
                    <div className="absolute -left-[3px] top-[96px] w-[2px] h-[30px] bg-slate-500 rounded-l-xs" />
                    <div className="absolute -left-[3px] top-[134px] w-[2px] h-[30px] bg-slate-500 rounded-l-xs" />
                    <div className="absolute -right-[3px] top-[102px] w-[2px] h-[44px] bg-slate-500 rounded-r-xs" />

                    {/* iPhone Inner Bezel Screen: Matches Exact Aspect Ratio (266 / 592) */}
                    <div
                      className="relative rounded-[40px] overflow-hidden bg-white shadow-inner"
                      style={{ aspectRatio: '266 / 592' }}
                    >
                      {/* iOS Dynamic Island */}
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 flex items-center justify-between px-2 py-0.5 w-[72px] h-[17px] bg-black rounded-full shadow-md border border-neutral-850 pointer-events-none">
                        {/* Front Camera Lens */}
                        <div className="w-1.5 h-1.5 rounded-full bg-neutral-950 border border-neutral-750 flex items-center justify-center">
                          <div className="w-0.5 h-0.5 rounded-full bg-blue-900" />
                        </div>
                        {/* Sensor */}
                        <div className="w-1.5 h-1.5 rounded-full bg-neutral-950" />
                      </div>

                      {/* Actual Final Attempt Mobile App Screen Image (Crisp, 100% Filled, Zoomed Out) */}
                      <NextImage
                        src="/app-screenshot.png"
                        alt="Final Attempt iOS Mobile App Showcase"
                        fill
                        unoptimized
                        sizes="(max-width: 640px) 245px, 265px"
                        className="object-contain object-top select-none pointer-events-none"
                        style={{ imageRendering: '-webkit-optimize-contrast' }}
                        priority
                      />

                      {/* iOS Subtle Screen Glare overlay */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-transparent pointer-events-none z-10" />

                      {/* iOS Home Indicator Bar */}
                      <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 z-20 w-22 h-[3px] bg-slate-800/60 backdrop-blur-md rounded-full pointer-events-none" />
                    </div>
                  </div>

                  {/* Stage Pedestal Grounding Shadow underneath phone */}
                  <div 
                    className="w-[85%] h-5 mx-auto mt-3 rounded-[100%] blur-md pointer-events-none"
                    style={{
                      background: isDark
                        ? 'radial-gradient(ellipse at center, rgba(0,0,0,0.8) 0%, transparent 75%)'
                        : 'radial-gradient(ellipse at center, rgba(15,23,42,0.3) 0%, transparent 75%)'
                    }}
                  />
                </div>

              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 4. STRATEGY LEAD CAPTURE FORM */}
      <section id="book-session" className="py-16 bg-[var(--bg-color)] border-t border-slate-100 dark:border-white/[0.06]">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 border border-slate-100 dark:border-white/[0.06] shadow-sm relative overflow-hidden">
            <div className="text-center space-y-4 mb-8">
              <h3 className="text-2xl font-heading font-extrabold text-slate-900 dark:text-white">
                {t('home.counselingTitle')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                {t('home.counselingDesc')}
              </p>
            </div>

            {formSuccess ? (
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 p-6 rounded-2xl text-center space-y-2">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
                <h5 className="font-bold text-sm">Session Registration Successful!</h5>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">Our senior counselor will contact you within 24 hours to schedule your slot.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitLead} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('home.fullName')}</label>
                  <input
                    type="text"
                    required
                    placeholder={t('home.enterName', 'Enter your name')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('home.mobileNumber')}</label>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    placeholder={t('home.enterMobile', 'Enter mobile number')}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full px-4 py-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('home.targetExam')}</label>
                  <select
                    value={targetExam}
                    onChange={(e) => setTargetExam(e.target.value)}
                    className="w-full px-4 py-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="BPSC Foundation Batch">{t('home.optFoundation', 'BPSC Foundation Batch')}</option>
                    <option value="BPSC Target Batch">{t('home.optTarget', 'BPSC Target Batch')}</option>
                    <option value="Prelims Test Series">{t('home.optPrelimsTS', 'Prelims Test Series')}</option>
                    <option value="Mains Answer Writing">{t('home.optMainsAW', 'Mains Answer Writing')}</option>
                  </select>
                </div>
                <div className="sm:col-span-3 pt-4 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-slate-100 dark:border-white/[0.06] mt-4">
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
