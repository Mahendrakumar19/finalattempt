'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu, X, ChevronDown, ArrowRight, Sun, Moon,
  BookOpen, FileText, Video, Download, Newspaper,
  Users, Phone, Info, Home, Target, Star,
  BarChart2, Calendar, Layers, BookMarked,
  GraduationCap, Award, Sparkles,
  ChevronRight, Lightbulb, Globe,
  Zap, FileCheck, Compass
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation, useLocale } from '@/context/LocaleContext';
import { db, CustomPage } from '@/services/db';

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
  courses:       <BookOpen className="w-4 h-4 text-blue-500" />,
  prelims:       <Target className="w-4 h-4 text-rose-500" />,
  mains:         <FileText className="w-4 h-4 text-violet-500" />,
  foundation:    <GraduationCap className="w-4 h-4 text-emerald-500" />,
  test:          <BarChart2 className="w-4 h-4 text-indigo-500" />,
  daily:         <Calendar className="w-4 h-4 text-amber-500" />,
  weekly:        <Layers className="w-4 h-4 text-cyan-500" />,
  monthly:       <BookMarked className="w-4 h-4 text-purple-500" />,
  yearly:        <Star className="w-4 h-4 text-pink-500" />,
  download:      <Download className="w-4 h-4 text-teal-500" />,
  pyq:           <FileText className="w-4 h-4 text-blue-500" />,
  ncert:         <BookOpen className="w-4 h-4 text-emerald-500" />,
  rapid:         <Zap className="w-4 h-4 text-amber-500" />,
  valmains:      <Lightbulb className="w-4 h-4 text-purple-500" />,
  toppers:       <FileCheck className="w-4 h-4 text-teal-500" />,
  fa:            <img src="/favicon.png" alt="FA" className="w-4 h-4 rounded-full object-cover" />,
  compass:       <Compass className="w-4 h-4 text-indigo-500" />,
  blog:          <Newspaper className="w-4 h-4 text-rose-500" />,
  video:         <Video className="w-4 h-4 text-red-500" />,
  syllabus:      <Compass className="w-4 h-4 text-sky-500" />,
  about:         <Info className="w-4 h-4 text-blue-500" />,
  faculty:       <Users className="w-4 h-4 text-emerald-500" />,
  results:       <Award className="w-4 h-4 text-amber-500" />,
  contact:       <Phone className="w-4 h-4 text-violet-500" />,
  home:          <Home className="w-4 h-4 text-amber-500" />,
  globe:         <Globe className="w-4 h-4 text-teal-500" />,
  sparkle:       <Sparkles className="w-4 h-4 text-amber-400" />,
};

/* ═══════════════════════════════════════════════════
   HEADER COMPONENT
═══════════════════════════════════════════════════ */
export default function Header() {
  const pathname  = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const { locale, setLocale } = useLocale();

  const [mounted,        setMounted]        = useState(false);
  const [mobileOpen,     setMobileOpen]     = useState(false);
  const [activeMega,     setActiveMega]     = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [scrolled,       setScrolled]       = useState(false);

  /* backend data */
  const [customPages,   setCustomPages]   = useState<CustomPage[]>([]);
  const [siteSettings,  setSiteSettings]  = useState<Record<string, any>>({});

  const megaRef  = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let isSubscribed = true;
    Promise.all([
      db.getCustomPages(true),
      db.getSettings(),
    ]).then(([pages, settings]) => {
      if (isSubscribed) {
        setCustomPages(pages || []);
        setSiteSettings(settings || {});
        setMounted(true);
      }
    });

    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      isSubscribed = false;
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  /* close mega on route change */
  useEffect(() => {
    setActiveMega(null);
    setMobileOpen(false);
  }, [pathname]);

  /* ── portal guard (computed but NOT used as early return — hooks must all run first) ── */
  const isPortal = pathname.startsWith('/student') || pathname.startsWith('/faculty') ||
                   pathname.startsWith('/admin')   || pathname.startsWith('/lms')    || pathname.startsWith('/auth') ||
                   pathname.includes('/attempt');

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

  /* ── build course categories for Header Mega Menu: BPSC & Arunachal PCS ─ */
  const courseGroups: MegaGroup[] = [
    {
      heading: 'BPSC',
      items: [
        { label: 'Prelims', href: '/courses?exam=BPSC&category=Prelims', desc: '71st & 72nd BPSC Prelims Sprint & GS', icon: IC.prelims },
        { label: 'Mains', href: '/courses?exam=BPSC&category=Mains', desc: 'GS Paper I, II & Essay Evaluation', icon: IC.mains },
        { label: 'Interview', href: '/courses?exam=BPSC&category=Interview', desc: '1-on-1 Interview & DAF Guidance', icon: IC.faculty },
      ]
    },
    {
      heading: 'Arunachal PCS (APPCS)',
      items: [
        { label: 'Prelims', href: '/courses?exam=Arunachal+PCS&category=Prelims', desc: 'APPSC CEE GS & CSAT Foundation', icon: IC.prelims },
        { label: 'Mains', href: '/courses?exam=Arunachal+PCS&category=Mains', desc: 'Mains GS & Optional Answer Writing', icon: IC.mains },
        { label: 'Interview', href: '/courses?exam=Arunachal+PCS&category=Interview', desc: 'State Specific Personality Test Guidance', icon: IC.results },
      ]
    }
  ];

  /* ── nav entries ────────────────────────── */
  const navEntries: NavEntry[] = [
    { id: 'home', label: t('nav.home'), href: '/', icon: IC.home },

    {
      id: 'courses', label: t('nav.courses'), href: '/courses', icon: IC.courses,
      mega: {
        tagline: t('mega.courses.tagline'),
        description: t('mega.courses.description'),
        groups: courseGroups,
        cta: { label: t('nav.browseAllCourses'), href: '/courses' },
      },
    },

    {
      id: 'test', label: t('nav.testSeries'), href: '/test-series', icon: IC.test,
      mega: (() => {
        const dynamicGroups: MegaGroup[] = [
          {
            heading: 'BPSC',
            items: [
              { label: 'Prelims Test Series', href: '/test-series/bpsc/prelims', icon: IC.prelims },
              { label: 'Mains Test Series', href: '/test-series/bpsc/mains', icon: IC.mains }
            ]
          },
          {
            heading: 'APPSC',
            items: [
              { label: 'Prelims Test Series', href: '/test-series/appsc/prelims', icon: IC.prelims },
              { label: 'Mains Test Series', href: '/test-series/appsc/mains', icon: IC.mains }
            ]
          },
          {
            heading: 'APSSB',
            items: [
              { label: 'Combined Practice Series', href: '/test-series/apssb', icon: IC.test }
            ]
          }
        ];

        return {
          tagline: t('mega.test.tagline'),
          description: t('mega.test.description'),
          groups: dynamicGroups,
          cta: { label: t('nav.exploreAllExams'), href: '/test-series' },
        };
      })(),
    },

    ...(showCA ? [{
      id: 'ca', label: t('nav.currentAffairs'), href: '/current-affairs', icon: IC.daily,
      mega: {
        tagline: t('mega.ca.tagline'),
        description: t('mega.ca.description'),
        groups: [
          { heading: t('mega.ca.byFrequency'), items: [
              { label: t('mega.ca.daily'),   href: '/current-affairs/daily',                                                                        desc: t('mega.ca.dailyDesc'),        icon: IC.daily,   isNew: true },
              { label: t('mega.ca.weekly'),   href: `/current-affairs/weekly/week-${getCurrentISOWeek()}-${new Date().getFullYear()}`,                desc: t('mega.ca.weeklyDesc'), icon: IC.weekly  },
              { label: t('mega.ca.monthly'),href: `/current-affairs/monthly/${MONTH_NAMES[new Date().getMonth()]}-${new Date().getFullYear()}`,    desc: t('mega.ca.monthlyDesc'),        icon: IC.monthly },
              { label: t('mega.ca.yearly'),href: `/current-affairs/yearly/${new Date().getFullYear()}`,                                            desc: t('mega.ca.yearlyDesc'),        icon: IC.yearly  },
            ],
          },
          { heading: t('mega.ca.topics'), items: [
              { label: t('mega.ca.dailyAnalysis'), href: '/current-affairs/daily', desc: t('mega.ca.dailyAnalysisDesc'), icon: IC.sparkle},
              { label: t('mega.ca.dailyMcqPractice') || 'Daily MCQ Practice', href: '/daily-quiz', desc: t('mega.ca.dailyMcqPracticeDesc') || 'Daily MCQ Practice & State Leaderboard', icon: IC.test, isNew: false },
            ],
          },
        ],
        cta: { label: t('nav.todaysCA'), href: '/current-affairs/daily' },
      },
    } as NavEntry] : []),

    {
      id: 'resources', label: t('nav.resources'), href: '/downloads', icon: IC.download,
      mega: (() => {
        const group1Items = [
          { label: t('mega.resources.pyq') || 'PYQ', href: '/downloads/pyq', desc: t('mega.resources.pyqDesc') || 'Previous year question papers', icon: IC.pyq },
          { label: t('mega.resources.ncert') || 'NCERT', href: '/downloads/ncert', desc: t('mega.resources.ncertDesc') || 'NCERT Class 6 to 12 Textbooks', icon: IC.ncert },
          { label: t('mega.resources.usefulDocuments') || 'Useful Documents', href: '/downloads/useful-documents', desc: t('mega.resources.usefulDocumentsDesc') || 'Important Notes, Guides & Reference Materials', icon: IC.rapid },
        ];

        const group2BaseItems = [
          { label: t('mega.resources.valMains') || 'Value Added Materials — Mains', href: '/downloads/value-added-mains', desc: t('mega.resources.valMainsDesc') || 'Mains Data & SC Judgments', icon: IC.valmains },
          { label: t('mega.resources.toppersCopies') || 'Toppers\' Copies', href: '/downloads/toppers-copies', desc: t('mega.resources.toppersCopiesDesc') || 'Evaluated Topper Copies', icon: IC.toppers },
          { label: t('mega.resources.faPublication') || 'Final Attempt Publication', href: '/downloads/fa-publication', desc: t('mega.resources.faPublicationDesc') || 'Books & Publication Storefront', icon: IC.fa },
        ];

        const CORE_SLUGS = new Set([
          'downloads/fa-publication', 'fa-publication',
          'downloads/fa-publications', 'fa-publications',
          'downloads/fa_publications', 'fa_publications',
          'downloads/useful-documents', 'useful-documents',
          'downloads/rapid-revision', 'rapid-revision',
          'downloads/value-added-mains', 'value-added-mains',
          'downloads/toppers-copies', 'toppers-copies',
          'downloads/ncert', 'ncert',
          'downloads/pyq', 'pyq'
        ]);

        const seenHrefs = new Set([
          ...group1Items.map(i => i.href.toLowerCase()),
          ...group2BaseItems.map(i => i.href.toLowerCase())
        ]);

        const dynamicItems = customPages
          .filter(p => !CORE_SLUGS.has(p.slug.toLowerCase()) && (p.showLocation === 'DOWNLOADS_HUB' || p.slug.startsWith('downloads/')))
          .map(p => {
            const cleanSlug = p.slug.startsWith('downloads/') ? p.slug : `downloads/${p.slug}`;
            return {
              label: p.title,
              href: `/${cleanSlug}`,
              desc: p.metaDescription || `${p.downloadItems?.length || 0} Files Package`,
              icon: IC.globe
            };
          })
          .filter(i => {
            if (seenHrefs.has(i.href.toLowerCase())) return false;
            seenHrefs.add(i.href.toLowerCase());
            return true;
          });

        return {
          tagline: t('mega.resources.tagline'),
          description: t('mega.resources.description'),
          groups: [
            { heading: t('mega.resources.downloads') || 'Downloads', items: group1Items },
            { heading: '', items: [...group2BaseItems, ...dynamicItems] }
          ],
          cta: { label: t('nav.downloadFreeMaterial'), href: '/downloads' },
        };
      })(),
    },

    {
      id: 'blog', label: t('nav.blogsMore'), href: '/blog', icon: IC.blog,
      mega: {
        tagline: t('mega.blogs.tagline'),
        description: t('mega.blogs.description'),
        groups: [
          { heading: t('mega.blogs.explore'), items: [
              { label: t('mega.blogs.allArticles'),       href: '/blog',              desc: t('mega.blogs.allArticlesDesc'),    icon: IC.blog },
              // { label: t('mega.blogs.currentAffairs'),    href: '/current-affairs',   desc: t('mega.blogs.currentAffairsDesc'), icon: IC.daily },
            ],
          },
          { heading: t('mega.blogs.strategyGuidance'), items: [
              { label: t('mega.blogs.syllabusStrategy'), href: '/syllabus-strategy', desc: t('mega.blogs.syllabusStrategyDesc'), icon: IC.syllabus },
            ],
          },
          ...navbarCustom.slice(0, 4).map(p => ({
            heading: p.title,
            items: [{ label: p.title, href: `/page/${p.slug}`, desc: p.metaDescription || '', icon: IC.globe }],
          })),
        ],
        cta: { label: t('nav.readLatestBlogs'), href: '/blog' },
      },
    },

    {
      id: 'about', label: t('nav.aboutUs'), href: '/about', icon: IC.about,
      mega: {
        tagline: t('mega.about.tagline'),
        description: t('mega.about.description'),
        groups: [
          { heading: t('mega.about.organisation'), items: [
              { label: t('mega.about.aboutFA'), href: '/about',    desc: t('mega.about.aboutFADesc'),         icon: IC.about   },
            ],
          },
          { heading: t('mega.about.connect'), items: [
              { label: t('mega.about.contactUs'),     href: '/contact',              desc: t('mega.about.contactUsDesc'), icon: IC.contact },
              { label: t('mega.about.enrollNow'),     href: '/contact?enquiry=enroll',desc: t('mega.about.enrollNowDesc'),    icon: IC.courses, badge: 'CTA' },
            ],
          },
        ],
        cta: { label: t('nav.contactAdmissions'), href: '/contact' },
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
                  <span>{t('nav.dashboard')}</span>
                </Link>
                <span className="text-slate-700">|</span>
                <button
                  onClick={logout}
                  className="hover:text-red-400 transition-colors font-bold cursor-pointer"
                >
                  {t('nav.logout')}
                </button>
              </div>
            ) : (
              <Link href="/auth/login/student" className="hover:text-white transition-colors flex items-center gap-1.5 font-bold shrink-0">
                <span>👤</span>
                <span>{t('nav.studentLogin')}</span>
              </Link>
            )}
            <span className="text-slate-700">|</span>
            {/* Language Switcher */}
            <button
              id="header-lang-switcher"
              onClick={() => setLocale(locale === 'en' ? 'hi' : 'en')}
              className="hover:text-white transition-colors flex items-center gap-1 text-sm font-bold cursor-pointer shrink-0 border border-slate-700/60 rounded-lg px-2 py-0.5 hover:border-amber-500/50"
              aria-label={locale === 'en' ? 'Switch to Hindi' : 'Switch to English'}
              title={locale === 'en' ? 'हिंदी में देखें' : 'View in English'}
            >
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-400">{locale === 'en' ? 'EN' : 'हि'}</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">{locale === 'en' ? 'हिंदी' : 'EN'}</span>
            </button>
            <span className="text-slate-700">|</span>
            <button
              onClick={toggleTheme}
              className="hover:text-white transition-colors flex items-center gap-1.5 text-sm font-bold cursor-pointer shrink-0"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <><Sun className="w-4 h-4 text-amber-500" /><span>{t('theme.light')}</span></>
              ) : (
                <><Moon className="w-4 h-4 text-slate-400" /><span>{t('theme.dark')}</span></>
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
                <span>{t('nav.enroll')}</span>
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
                  <div className="flex-1 grid gap-x-6 gap-y-0 max-w-4xl" style={{ gridTemplateColumns: `repeat(${Math.min(entry.mega.groups.length, 3)}, minmax(0, 300px))` }}>
                    {entry.mega.groups.map((grp) => (
                      <div key={grp.heading} className="w-full">
                        <p className="text-[13px] font-black font-heading text-slate-900 dark:text-amber-400 uppercase tracking-widest mb-3 border-b-2 border-amber-500/40 pb-2 font-bold">
                          {grp.heading || '\u00A0'}
                        </p>
                        <div className="space-y-1">
                          {grp.items.map((item, idx) => (
                            <Link
                              key={`${item.href}-${idx}`}
                              href={item.href}
                              onClick={() => setActiveMega(null)}
                              className="group/item flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900/40 border border-slate-200/60 dark:border-white/5 hover:border-amber-500/40 hover:bg-amber-50 dark:hover:bg-white/[0.06] transition-all duration-150"
                            >
                              <span className="shrink-0 w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800/80 group-hover/item:bg-amber-500 group-hover/item:text-slate-950 flex items-center justify-center transition-all duration-150 text-xs font-black">
                                {item.icon || IC.globe}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-[13px] font-black text-slate-900 dark:text-slate-100 group-hover/item:text-amber-600 dark:group-hover/item:text-amber-400 transition-colors whitespace-normal leading-snug">
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
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{t('nav.quickLinks', 'Quick Links:')}</span>
                  {[
                    { label: t('nav.enroll', 'Enroll Now'),             href: '/contact?enquiry=enroll' },
                    { label: t('nav.downloadPYQs', 'Download PYQs'),     href: '/downloads/pyq'          },
                    { label: t('nav.testSeries', 'Test Series'),        href: '/test-series'             },
                    { label: t('nav.dailyCA', 'Daily CA'),              href: '/current-affairs/daily'  },
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
                      <div className="ml-4 mt-1 mb-2 space-y-3 border-l-2 border-amber-200 dark:border-amber-500/30 pl-3">
                        {entry.mega.groups.map((group) => (
                          <div key={group.heading} className="space-y-1">
                            <p className="text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider pt-1.5 pb-0.5 px-2 font-bold">
                              {group.heading}
                            </p>
                            {group.items.map((item) => (
                              <Link
                                key={item.href + item.label}
                                href={item.href}
                                onClick={() => setMobileOpen(false)}
                                className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-xl transition-colors"
                              >
                                <span className="shrink-0 flex items-center justify-center">{item.icon}</span>
                                <span>{item.label}</span>
                                {item.isNew && <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-[9px] font-extrabold rounded uppercase">New</span>}
                              </Link>
                            ))}
                          </div>
                        ))}
                        {entry.mega.cta && (
                          <Link
                            href={entry.mega.cta.href}
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center gap-2 px-3 py-2.5 text-xs font-extrabold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-xl transition-colors border-t border-slate-100 dark:border-white/5 mt-2 pt-2"
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

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => setLocale(locale === 'en' ? 'hi' : 'en')}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs font-black text-amber-600 dark:text-amber-400 cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{locale === 'en' ? 'हिंदी (Hindi)' : 'English (EN)'}</span>
            </button>

            <button
              onClick={toggleTheme}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              {theme === 'dark'
                ? <><Sun className="w-3.5 h-3.5 text-amber-400" /><span>Light Mode</span></>
                : <><Moon className="w-3.5 h-3.5 text-slate-400" /><span>Dark Mode</span></>
              }
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
