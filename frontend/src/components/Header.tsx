'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu, X, ChevronDown, ArrowRight, Sun, Moon,
  BookOpen, FileText, Video, Download, Newspaper,
  Users, Phone, Info, Home, Target, Star,
  BarChart2, Calendar, Layers, BookMarked,
  GraduationCap, Award, MapPin, Sparkles,
  ChevronRight, ExternalLink, Lightbulb, Globe
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/context/ThemeContext';
import { db } from '@/services/db';

/* ─── helpers ───────────────────────────────────── */
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function getCurrentISOWeek() {
  const d = new Date(); d.setHours(0,0,0,0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const ys = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d.getTime() - ys.getTime()) / 86400000) + 1) / 7);
}

/* ─── types ─────────────────────────────────────── */
interface MegaItem  { label: string; href: string; desc?: string; icon?: React.ReactNode; isNew?: boolean; badge?: string; }
interface MegaGroup { heading: string; items: MegaItem[]; }
interface NavEntry  {
  id: string;
  label: string;
  href: string;
  icon?: React.ReactNode;
  mega?: {
    tagline: string;
    description: string;
    groups: MegaGroup[];
    cta?: { label: string; href: string };
  };
}

/* ─── icon map helpers ───────────────────────────── */
const IC = {
  courses:       <BookOpen className="w-4 h-4" />,
  prelims:       <Target className="w-4 h-4" />,
  mains:         <FileText className="w-4 h-4" />,
  foundation:    <GraduationCap className="w-4 h-4" />,
  test:          <BarChart2 className="w-4 h-4" />,
  daily:         <Calendar className="w-4 h-4" />,
  weekly:        <Layers className="w-4 h-4" />,
  monthly:       <BookMarked className="w-4 h-4" />,
  yearly:        <Star className="w-4 h-4" />,
  download:      <Download className="w-4 h-4" />,
  pyq:           <Award className="w-4 h-4" />,
  ncert:         <BookOpen className="w-4 h-4" />,
  blog:          <Newspaper className="w-4 h-4" />,
  video:         <Video className="w-4 h-4" />,
  syllabus:      <Lightbulb className="w-4 h-4" />,
  about:         <Info className="w-4 h-4" />,
  faculty:       <Users className="w-4 h-4" />,
  results:       <Award className="w-4 h-4" />,
  contact:       <Phone className="w-4 h-4" />,
  home:          <Home className="w-4 h-4" />,
  globe:         <Globe className="w-4 h-4" />,
  sparkle:       <Sparkles className="w-4 h-4" />,
};

/* ═══════════════════════════════════════════════════
   HEADER COMPONENT
═══════════════════════════════════════════════════ */
export default function Header() {
  const pathname  = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [mounted,        setMounted]        = useState(false);
  const [mobileOpen,     setMobileOpen]     = useState(false);
  const [activeMega,     setActiveMega]     = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [scrolled,       setScrolled]       = useState(false);

  /* backend data */
  const [customPages,   setCustomPages]   = useState<any[]>([]);
  const [siteSettings,  setSiteSettings]  = useState<any>({});
  const [liveCourses,   setLiveCourses]   = useState<any[]>([]);
  const [liveTestSeries, setLiveTestSeries] = useState<any[]>([]);

  const megaRef  = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
    Promise.all([
      db.getCustomPages(true),
      db.getSettings(),
      db.getCourses(),
      db.getTestSeries(false),
    ]).then(([pages, settings, courses, testSeries]) => {
      setCustomPages(pages  || []);
      setSiteSettings(settings || {});
      setLiveCourses(courses || []);
      setLiveTestSeries(testSeries || []);
    });

    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* close mega on route change */
  useEffect(() => { setActiveMega(null); setMobileOpen(false); }, [pathname]);

  /* ── portal guard (computed but NOT used as early return — hooks must all run first) ── */
  const isPortal = pathname.startsWith('/student') || pathname.startsWith('/faculty') ||
                   pathname.startsWith('/admin')   || pathname.startsWith('/lms')    || pathname.startsWith('/auth');

  /* ── mega hover handlers — must come BEFORE any conditional return ── */
  const openMega = useCallback((id: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setActiveMega(id);
  }, []);

  const scheduledClose = useCallback(() => {
    closeTimer.current = setTimeout(() => setActiveMega(null), 120);
  }, []);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  /* now it is safe to bail out — all hooks have been called */
  if (isPortal) return null;

  /* ── derived data ───────────────────────── */
  const ff              = siteSettings?.featureFlags || {};
  const showCA          = ff.currentAffairsFilters !== false;
  const showPageBuilder = ff.livePageBuilder !== false;
  const navbarCustom    = showPageBuilder ? customPages.filter(p => p.showLocation === 'NAVBAR')     : [];
  const headerTopCustom = showPageBuilder ? customPages.filter(p => p.showLocation === 'HEADER_TOP') : [];

  /* ── build course categories from live data ─ */
  const courseCategories = (() => {
    const cats: Record<string, any[]> = {};
    liveCourses.forEach(c => {
      const cat = c.category || 'General';
      if (!cats[cat]) cats[cat] = [];
      cats[cat].push(c);
    });
    return cats;
  })();

  const courseGroups: MegaGroup[] = Object.entries(courseCategories).map(([cat, items]) => ({
    heading: cat,
    items: items.slice(0, 4).map(c => ({
      label: c.title,
      href:  `/courses/${c.id}`,
      desc:  c.duration || c.description?.slice(0, 55),
      icon:  IC.courses,
    })),
  }));

  /* fallback if no live courses yet */
  if (courseGroups.length === 0) {
    courseGroups.push(
      { heading: 'Foundation', items: [
          { label: 'BPSC Foundation Batch',  href: '/courses?category=Foundation', desc: 'Complete GS + Bihar focused', icon: IC.foundation },
          { label: 'BPSC Foundation Course', href: '/courses?category=Foundation', desc: 'Prelims + Mains strategy',    icon: IC.foundation },
        ],
      },
      { heading: 'Prelims & Mains', items: [
          { label: 'Prelims Crash Course', href: '/courses?category=Prelims', desc: 'Targeted 60-day sprint',       icon: IC.prelims },
          { label: 'Mains Answer Writing', href: '/courses?category=Mains',   desc: 'Daily writing + evaluation',  icon: IC.mains },
          { label: 'Test Series',          href: '/test-series',              desc: 'Mock tests + analysis',       icon: IC.test, badge: 'New' },
        ],
      },
    );
  }

  /* ── nav entries ────────────────────────── */
  const navEntries: NavEntry[] = [
    { id: 'home', label: 'Home', href: '/', icon: IC.home },

    {
      id: 'courses', label: 'Courses', href: '/courses', icon: IC.courses,
      mega: {
        tagline: 'Learning Programs',
        description: 'Structured courses designed by experts and civil servants.',
        groups: courseGroups,
        cta: { label: 'Browse All Courses', href: '/courses' },
      },
    },

    {
      id: 'test', label: 'Test Series', href: '/test-series', icon: IC.test,
      mega: (() => {
        /* Build dynamic groups — Prelims first, then Mains */
        const prelimsSeries = liveTestSeries.filter(ts => ts.category === 'Prelims').slice(0, 4);
        const mainsSeries   = liveTestSeries.filter(ts => ts.category === 'Mains').slice(0, 4);

        const dynamicGroups: MegaGroup[] = [];

        if (prelimsSeries.length > 0) {
          dynamicGroups.push({
            heading: 'Prelims Tests',
            items: prelimsSeries.map(ts => ({ label: ts.title, href: `/test-series/${ts.slug}`, icon: IC.test })),
          });
        } else {
          dynamicGroups.push({
            heading: 'Prelims Tests',
            items: [
              { label: 'Full Mock Tests',   href: '/test-series?category=Prelims', icon: IC.test },
              { label: 'Sectional Tests',   href: '/test-series?category=Prelims', icon: IC.prelims },
            ],
          });
        }

        if (mainsSeries.length > 0) {
          dynamicGroups.push({
            heading: 'Mains Tests',
            items: mainsSeries.map(ts => ({ label: ts.title, href: `/test-series/${ts.slug}`, icon: IC.mains })),
          });
        } else {
          dynamicGroups.push({
            heading: 'Mains Tests',
            items: [
              { label: 'GS Mains Series',  href: '/test-series?category=Mains', icon: IC.mains },
              { label: 'Essay Evaluation', href: '/test-series?category=Mains', icon: IC.blog },
            ],
          });
        }

        return {
          tagline: 'Practice & Evaluate',
          description: 'Simulate exam conditions with timed mocks and analytics.',
          groups: dynamicGroups,
          cta: { label: 'View All Tests', href: '/test-series' },
        };
      })(),
    },

    ...(showCA ? [{
      id: 'ca', label: 'Current Affairs', href: '/current-affairs', icon: IC.daily,
      mega: {
        tagline: 'Stay Updated Daily',
        description: 'Curated, exam-relevant current affairs for BPSC.',
        groups: [
          { heading: 'By Frequency', items: [
              { label: 'Daily',   href: '/current-affairs/daily',                                                                        desc: 'Read news updated every day',        icon: IC.daily,   isNew: true },
              { label: 'Weekly',   href: `/current-affairs/weekly/week-${getCurrentISOWeek()}-${new Date().getFullYear()}`,                desc: 'Weekly news highlights', icon: IC.weekly  },
              { label: 'Monthly',href: `/current-affairs/monthly/${MONTH_NAMES[new Date().getMonth()]}-${new Date().getFullYear()}`,    desc: 'Monthly PDF notes',        icon: IC.monthly },
              { label: 'Yearly',href: `/current-affairs/yearly/${new Date().getFullYear()}`,                                            desc: 'Full year news notes',        icon: IC.yearly  },
            ],
          },
          { heading: 'Topics', items: [
              { label: 'Daily Analysis', href: '/current-affairs/daily', desc: 'Daily news & editorials', icon: IC.sparkle, badge: 'Hot' },
              { label: 'Video Lectures', href: '/current-affairs/videos',  desc: 'Current affairs video updates',    icon: IC.video },
            ],
          },
        ],
        cta: { label: "Today's Current Affairs", href: '/current-affairs/daily' },
      },
    } as NavEntry] : []),

    {
      id: 'resources', label: 'Resources', href: '/downloads', icon: IC.download,
      mega: {
        tagline: 'Study Material Hub',
        description: 'Free books, PYQs, notes and NCERT material for exam prep.',
        groups: [
          { heading: 'Downloads', items: [
              { label: 'All Downloads',       href: '/downloads',       desc: 'Central repository of study material', icon: IC.download },
              { label: 'PYQs Library',        href: '/downloads/pyq',   desc: 'Previous year question papers',        icon: IC.pyq     },
              ...customPages.filter(p => p.showLocation === 'DOWNLOADS_HUB' || p.slug.startsWith('downloads/')).map(p => {
                const cleanSlug = p.slug.startsWith('downloads/') ? p.slug : `downloads/${p.slug}`;
                return {
                  label: p.title,
                  href: `/${cleanSlug}`,
                  desc: p.metaDescription || `${p.downloadItems?.length || 0} Files Package`,
                  icon: IC.globe
                };
              })
            ],
          },
          { heading: 'Strategy & Guidance', items: [
              { label: 'Syllabus & Strategy',  href: '/syllabus-strategy', desc: 'Exam-wise topic plans & timetables',  icon: IC.syllabus },
            ],
          },
        ],
        cta: { label: 'Download Free Material', href: '/downloads' },
      },
    },

    {
      id: 'blog', label: 'Blogs & News', href: '/blog', icon: IC.blog,
      mega: {
        tagline: 'Insights & Articles',
        description: 'Expert blogs on exam strategy, analysis and news updates.',
        groups: [
          { heading: 'Explore', items: [
              { label: 'All Articles',       href: '/blog',              desc: 'Strategy & analysis posts',    icon: IC.blog },
              { label: 'Current Affairs',    href: '/current-affairs',   desc: 'Exam-relevant news breakdown', icon: IC.daily },
            ],
          },
          ...navbarCustom.slice(0, 4).map(p => ({
            heading: p.title,
            items: [{ label: p.title, href: `/page/${p.slug}`, desc: p.metaDescription || '', icon: IC.globe }],
          })),
        ],
        cta: { label: 'Read Latest Blogs', href: '/blog' },
      },
    },

    {
      id: 'about', label: 'About Us', href: '/about', icon: IC.about,
      mega: {
        tagline: 'Who We Are',
        description: 'Learn about our mission, faculty, and selected toppers who lead change.',
        groups: [
          { heading: 'Organisation', items: [
              { label: 'About Final Attempt', href: '/about',    desc: 'Our story, mission & vision',         icon: IC.about   },
            ],
          },
          { heading: 'Connect', items: [
              { label: 'Contact Us',     href: '/contact',              desc: 'Get in touch or visit our center', icon: IC.contact },
              { label: 'Enroll Now',     href: '/contact?enquiry=enroll',desc: 'Start your preparation today',    icon: IC.courses, badge: 'CTA' },
            ],
          },
        ],
        cta: { label: 'Contact Admissions', href: '/contact' },
      },
    },

    /* Dynamic Admin-Created Navbar Pages (Real-Time from DB) */
    ...navbarCustom.map(p => ({
      id: `custom-page-${p.id}`,
      label: p.title,
      href: p.slug.startsWith('/') ? p.slug : `/${p.slug}`,
      icon: IC.globe
    })),


  ];

  /* ── mega hover handlers already defined above (before isPortal guard) ── */

  /* ═══════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════ */
  return (
    <>
      <header
        className={`w-full z-50 sticky top-0 transition-all duration-300 ${
          scrolled
            ? 'shadow-lg backdrop-blur-sm'
            : 'shadow-sm'
        }`}
        style={{ backgroundColor: 'var(--header-bg)', borderBottom: '1px solid var(--card-border)' }}
      >
        {/* ── Top Ticker Bar ────────────────────── */}
        <div className="w-full bg-[#0F172A] text-slate-300 py-3 px-4 sm:px-6 lg:px-12 text-sm flex flex-wrap justify-between items-center gap-y-2 border-b border-slate-800">
          <div className="flex items-center flex-wrap gap-x-4 gap-y-1 w-full sm:w-auto justify-center sm:justify-start">
            <a href="mailto:enquiry@finalattemptias.com" className="hover:text-white transition-colors flex items-center gap-1.5 shrink-0">
              <span className="font-semibold text-amber-500">✉</span>
              <span>enquiry@finalattemptias.com</span>
            </a>
            <span className="hidden sm:inline text-slate-700">|</span>
            <a href="tel:+919709992093" className="hover:text-white transition-colors flex items-center gap-1.5 shrink-0">
              <span className="font-semibold text-amber-500">📞</span>
              <span>+91 97099 92093</span>
            </a>
            {headerTopCustom.map((p: any) => (
              <span key={p.id} className="flex items-center gap-4">
                <span className="hidden sm:inline text-slate-700">|</span>
                <Link href={`/page/${p.slug}`} className="hover:text-amber-400 font-bold transition-colors">
                  {p.title}
                </Link>
              </span>
            ))}
          </div>

          <div className="flex items-center justify-center sm:justify-end gap-4 w-full sm:w-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
            {mounted && isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  href={user?.role === 'admin' ? '/admin' : user?.role === 'faculty' ? '/faculty/dashboard' : '/student/dashboard'}
                  className="hover:text-white transition-colors flex items-center gap-1.5 font-bold"
                >
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Avatar" className="w-5 h-5 rounded-full object-cover border border-amber-500" />
                  ) : (
                    <span className="w-5 h-5 bg-slate-800 rounded-full flex items-center justify-center text-xs text-amber-500 border border-slate-700">👤</span>
                  )}
                  <span>Dashboard</span>
                </Link>
                <span className="text-slate-700">|</span>
                <button
                  onClick={logout}
                  className="hover:text-red-400 transition-colors font-bold cursor-pointer"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link href="/auth/login/student" className="hover:text-white transition-colors flex items-center gap-1.5 font-bold shrink-0">
                <span>👤</span>
                <span>Student Login</span>
              </Link>
            )}
            <span className="text-slate-700">|</span>
            <button
              onClick={toggleTheme}
              className="hover:text-white transition-colors flex items-center gap-1.5 text-sm font-bold cursor-pointer shrink-0"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <><Sun className="w-4 h-4 text-amber-500" /><span>Light</span></>
              ) : (
                <><Moon className="w-4 h-4 text-slate-400" /><span>Dark</span></>
              )}
            </button>
          </div>
        </div>

        {/* ── Main Navbar ───────────────────────── */}
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex items-center justify-between h-[68px]">

            {/* Logo */}
            <Link href="/" className="flex items-center shrink-0" onClick={() => setActiveMega(null)}>
              <div className="relative w-44 h-11">
                <img src="/darklogofull.png"  alt="Final Attempt" className="w-full h-full object-contain logo-light" />
                <img src="/lightlogofull.png" alt="Final Attempt" className="w-full h-full object-contain logo-dark"  />
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav
              className="hidden lg:flex items-center gap-0.5"
              onMouseLeave={scheduledClose}
              onMouseEnter={cancelClose}
            >
              {navEntries.map((entry) => {
                const isActive = mounted && (
                  entry.href === '/' ? pathname === '/' : pathname.startsWith(entry.href)
                );
                return (
                  <div
                    key={entry.id}
                    className="relative"
                    onMouseEnter={() => entry.mega ? openMega(entry.id) : setActiveMega(null)}
                  >
                    <Link
                      href={entry.href}
                      className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-base font-bold transition-all duration-150 whitespace-nowrap ${
                        isActive
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-slate-800 dark:text-slate-100 hover:text-amber-600 dark:hover:text-amber-400'
                      }`}
                    >
                      <span>{entry.label}</span>
                      {entry.mega && (
                        <ChevronDown
                          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${activeMega === entry.id ? 'rotate-180 text-amber-500' : ''}`}
                        />
                      )}
                    </Link>

                    {/* Active indicator */}
                    {isActive && (
                      <span className="absolute bottom-0 left-3.5 right-3.5 h-[2px] bg-amber-500 rounded-full" />
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Right CTA */}
            <div className="flex items-center gap-3">
              <Link
                href="/contact?enquiry=enroll"
                className="hidden sm:inline-flex items-center gap-2 px-5 py-2 text-[13px] font-extrabold text-slate-950 bg-amber-500 hover:bg-amber-400 transition-all rounded-xl shadow-md hover:shadow-amber-400/40 hover:scale-[1.02] active:scale-100"
              >
                <span>Enroll Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Mega Menu Panel ──────────────────── */}
        {navEntries.map((entry) =>
          entry.mega && activeMega === entry.id ? (
            <div
              key={entry.id}
              ref={megaRef}
              onMouseEnter={cancelClose}
              onMouseLeave={scheduledClose}
              className="absolute left-0 right-0 top-full z-40 hidden lg:block"
            >
              {/* Backdrop */}
              <div className="absolute inset-0 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-white/10 shadow-2xl" />

              <div className="relative max-w-screen-2xl mx-auto px-10 py-8">
                <div className="flex gap-8">

                  {/* ── Left Hero Panel ─── */}
                  <div
                    className="w-60 shrink-0 rounded-2xl p-6 flex flex-col justify-between"
                    style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #1E40AF 60%, #2563EB 100%)' }}
                  >
                    <div>
                      <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-[0.18em]">
                        {entry.mega.tagline}
                      </span>
                      <h3 className="text-white font-black text-xl mt-1 leading-tight font-heading">
                        {entry.label.toUpperCase()}
                      </h3>
                    </div>
                    {entry.mega.cta && (
                      <Link
                        href={entry.mega.cta.href}
                        className="mt-6 flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all hover:scale-[1.02] shadow-lg"
                        onClick={() => setActiveMega(null)}
                      >
                        <span>{entry.mega.cta.label}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>

                  {/* ── Right Groups ─────── */}
                  <div className="flex-1 grid gap-x-8 gap-y-0" style={{ gridTemplateColumns: `repeat(${Math.min(entry.mega.groups.length, 3)}, 1fr)` }}>
                    {entry.mega.groups.map((grp) => (
                      <div key={grp.heading}>
                        <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-100 dark:border-white/[0.06] pb-2">
                          {grp.heading}
                        </p>
                        <div className="space-y-0.5">
                          {grp.items.map((item) => (
                            <Link
                              key={item.label}
                              href={item.href}
                              onClick={() => setActiveMega(null)}
                              className="group/item flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-amber-50 dark:hover:bg-white/[0.04] transition-all duration-150"
                            >
                              <span className="shrink-0 mt-0.5 w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover/item:bg-amber-500 group-hover/item:text-white flex items-center justify-center transition-all duration-150">
                                {item.icon || IC.globe}
                              </span>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100 group-hover/item:text-amber-600 dark:group-hover/item:text-amber-400 transition-colors truncate">
                                    {item.label}
                                  </span>
                                  {item.isNew && (
                                    <span className="shrink-0 px-1.5 py-0.5 bg-emerald-500 text-white text-[9px] font-extrabold rounded-md uppercase tracking-wider">
                                      New
                                    </span>
                                  )}
                                  {item.badge && item.badge !== 'CTA' && (
                                    <span className="shrink-0 px-1.5 py-0.5 bg-amber-500 text-slate-950 text-[9px] font-extrabold rounded-md uppercase tracking-wider">
                                      {item.badge}
                                    </span>
                                  )}
                                </div>
 
                              </div>
                              <ChevronRight className="shrink-0 w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover/item:text-amber-500 mt-1 ml-auto transition-all group-hover/item:translate-x-0.5" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Bottom quick-link strip */}
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/[0.06] flex items-center gap-6 flex-wrap">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Quick Links:</span>
                  {[
                    { label: 'Enroll Now',       href: '/contact?enquiry=enroll' },
                    { label: 'Download PYQs',    href: '/downloads/pyq'          },
                    { label: 'Test Series',      href: '/test-series'             },
                    { label: 'Daily CA',         href: '/current-affairs/daily'  },
                  ].map((ql) => (
                    <Link
                      key={ql.label}
                      href={ql.href}
                      onClick={() => setActiveMega(null)}
                      className="flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                    >
                      <ChevronRight className="w-3 h-3" />
                      {ql.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ) : null
        )}
      </header>

      {/* ── Mega Backdrop overlay (clicks outside close) ── */}
      {activeMega && (
        <div
          className="fixed inset-0 z-30 hidden lg:block"
          onClick={() => setActiveMega(null)}
        />
      )}

      {/* ── Mobile Drawer ─────────────────────── */}
      {/* Overlay */}
      <div
        className={`lg:hidden fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Drawer panel */}
      <div
        className={`lg:hidden fixed top-0 left-0 bottom-0 z-50 w-[85vw] max-w-sm flex flex-col transition-transform duration-300 ease-in-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ backgroundColor: 'var(--bg-color)' }}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--card-border)' }}>
          <div className="relative w-36 h-9">
            <img src="/darklogofull.png"  alt="Final Attempt" className="w-full h-full object-contain logo-light" />
            <img src="/lightlogofull.png" alt="Final Attempt" className="w-full h-full object-contain logo-dark"  />
          </div>
          <button onClick={() => setMobileOpen(false)} className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer nav */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {navEntries.map((entry) => {
            const isExpanded = mobileExpanded === entry.id;
            const isActive   = mounted && (
              entry.href === '/' ? pathname === '/' : pathname.startsWith(entry.href)
            );
            return (
              <div key={entry.id}>
                {entry.mega ? (
                  <>
                    <button
                      onClick={() => setMobileExpanded(isExpanded ? null : entry.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
                          {entry.icon}
                        </span>
                        <span>{entry.label}</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    {isExpanded && (
                      <div className="ml-4 mt-1 mb-2 space-y-0.5 border-l-2 border-amber-200 dark:border-amber-500/30 pl-3">
                        {entry.mega.groups.flatMap(g => g.items).map((item) => (
                          <Link
                            key={item.href + item.label}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-xl transition-colors"
                          >
                            <span className="text-slate-400 dark:text-slate-500">{item.icon}</span>
                            <span className="font-medium">{item.label}</span>
                            {item.isNew && <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-[9px] font-extrabold rounded uppercase">New</span>}
                          </Link>
                        ))}
                        {entry.mega.cta && (
                          <Link
                            href={entry.mega.cta.href}
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center gap-2 px-3 py-2.5 text-xs font-extrabold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-xl transition-colors"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                            <span>{entry.mega.cta.label}</span>
                          </Link>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={entry.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
                      {entry.icon}
                    </span>
                    <span>{entry.label}</span>
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {/* Drawer footer */}
        <div className="p-4 border-t space-y-2" style={{ borderColor: 'var(--card-border)' }}>
          {mounted && isAuthenticated ? (
            <>
              <Link
                href={user?.role === 'admin' ? '/admin' : user?.role === 'faculty' ? '/faculty/dashboard' : '/student/dashboard'}
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold rounded-xl text-sm"
              >
                <span>👤</span>
                <span>My Dashboard</span>
              </Link>
              <button
                onClick={() => { setMobileOpen(false); logout(); }}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer transition-colors"
              >
                Log Out
              </button>
            </>
          ) : (
            <Link
              href="/auth/login/student"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold rounded-xl text-sm"
            >
              <span>👤</span>
              <span>Student Login</span>
            </Link>
          )}
          <Link
            href="/contact?enquiry=enroll"
            onClick={() => setMobileOpen(false)}
            className="flex items-center justify-center gap-2 w-full py-3.5 text-slate-950 font-extrabold rounded-xl text-sm shadow-lg"
            style={{ background: 'linear-gradient(135deg, #D97706, #F59E0B)' }}
          >
            <span>🎯 Enroll Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <button
            onClick={toggleTheme}
            className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer"
          >
            {theme === 'dark'
              ? <><Sun className="w-3.5 h-3.5" /><span>Switch to Light Mode</span></>
              : <><Moon className="w-3.5 h-3.5" /><span>Switch to Dark Mode</span></>
            }
          </button>
        </div>
      </div>
    </>
  );
}
