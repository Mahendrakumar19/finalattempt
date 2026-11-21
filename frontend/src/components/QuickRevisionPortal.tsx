'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Download, Eye, Home, ChevronRight, X, Zap, BookOpen, Layers, CheckCircle2, Sparkles, Filter } from 'lucide-react';
import { db, CustomPage, DownloadItem } from '@/services/db';
import { useTranslation } from '@/context/LocaleContext';
import ShareButton from '@/components/ShareButton';

const INITIAL_FALLBACK_ITEMS: DownloadItem[] = [
  {
    id: 'qrm-polity-01',
    title: 'Indian Polity: Constitutional Framework, Fundamental Rights & DPSP',
    description: 'High-yield consolidated revision notes covering historical underpinnings, Preamble, Articles 12-51A, Judicial Doctrines, and Landmark Judgments for rapid recall.',
    type: 'Indian Polity & Constitution',
    examCategory: 'BPSC & UPSC',
    language: 'English',
    editionYear: '2025-26',
    size: '3.4 MB',
    url: '/sample-resources/polity-constitutional-framework.pdf'
  },
  {
    id: 'qrm-polity-02',
    title: 'भारतीय राजव्यवस्था: संसद, राष्ट्रपति एवं महत्वपूर्ण संवैधानिक संशोधन',
    description: 'संसदीय समितियां, विधायी प्रक्रिया, आपातकालीन उपबंध, 101वां से 106वां संविधान संशोधन सारांश एवं प्रमुख अनुसूचियां।',
    type: 'Indian Polity & Constitution',
    examCategory: 'BPSC & UPSC',
    language: 'Hindi',
    editionYear: '2025-26',
    size: '3.1 MB',
    url: '/sample-resources/polity-parliament-amendments-hi.pdf'
  },
  {
    id: 'qrm-economy-01',
    title: 'Indian Economy: Macroeconomic Indicators, Budget & Economic Survey Crux',
    description: 'National Income, Monetary Policy, Fiscal Deficit, Inflation targeting, Banking reforms, External Sector, and Key Government Schemes.',
    type: 'Economy & Budget',
    examCategory: 'BPSC & UPSC',
    language: 'English',
    editionYear: '2025-26',
    size: '4.2 MB',
    url: '/sample-resources/economy-survey-crux.pdf'
  },
  {
    id: 'qrm-history-01',
    title: 'Modern Indian History: Major Movements, Governor Generals & Timeline',
    description: 'Chronological timeline of Freedom Struggle from 1857 to 1947, Revolutionary Nationalism, Socio-Religious Reform Movements, and Tribal Uprisings.',
    type: 'History & Culture',
    examCategory: 'BPSC & UPSC',
    language: 'English',
    editionYear: '2025-26',
    size: '3.8 MB',
    url: '/sample-resources/modern-history-timeline.pdf'
  },
  {
    id: 'qrm-bihar-01',
    title: 'बिहार विशेष: आधुनिक इतिहास, 1857 क्रांति एवं स्वतंत्रता आंदोलन में योगदान',
    description: 'कुंवर सिंह और 1857, चंपारण सत्याग्रह, किसान आंदोलन (स्वामी सहजानंद सरस्वती), भारत छोड़ो आंदोलन और बिहार विभूति।',
    type: 'Bihar Special (BPSC)',
    examCategory: 'BPSC Prelims & Mains',
    language: 'Hindi',
    editionYear: '2025-26',
    size: '2.9 MB',
    url: '/sample-resources/bihar-special-history.pdf'
  },
  {
    id: 'qrm-env-01',
    title: 'Environment & Ecology: National Parks, Ramsar Sites & Wildlife Conventions',
    description: 'Comprehensive mapping of Tiger Reserves, Biosphere Reserves, Ramsar Wetlands, UNFCCC COP summits, and Biodiversity Hotspots.',
    type: 'Geography & Environment',
    examCategory: 'BPSC & UPSC',
    language: 'English',
    editionYear: '2025-26',
    size: '4.5 MB',
    url: '/sample-resources/environment-wetlands-conventions.pdf'
  },
  {
    id: 'qrm-scitech-01',
    title: 'Science & Technology: Space Missions, Defense Systems & Biotech',
    description: 'ISRO Roadmap (Gaganyaan, Chandrayaan, Aditya-L1), Missile systems, Nuclear energy, AI, Quantum Computing, and CRISPR gene editing.',
    type: 'Science & Technology',
    examCategory: 'BPSC & UPSC',
    language: 'English',
    editionYear: '2025-26',
    size: '3.6 MB',
    url: '/sample-resources/scitech-space-defense.pdf'
  },
  {
    id: 'qrm-geo-01',
    title: 'Geography: Indian Drainage System, Climate & Agriculture Mapping',
    description: 'Himalayan vs Peninsular river systems, Monsoon mechanism, Soil types, Major mineral belts, and Cropping patterns across India.',
    type: 'Geography & Environment',
    examCategory: 'BPSC & UPSC',
    language: 'English',
    editionYear: '2025-26',
    size: '3.9 MB',
    url: '/sample-resources/geography-drainage-climate.pdf'
  }
];

export default function QuickRevisionPortal() {
  const { t } = useTranslation();
  const [pageData, setPageData] = useState<CustomPage | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  // In-site Document Reader Modal
  const [activeReaderModal, setActiveReaderModal] = useState<{ title: string; url: string } | null>(null);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    let active = true;
    const fetchPage = async () => {
      try {
        let data = await db.getCustomPageBySlug('downloads/quick-revision-material');
        if (!data) {
          data = await db.getCustomPageBySlug('quick-revision-material');
        }
        if (active && data) {
          setPageData(data);
        }
      } catch (err) {
        console.error('Error loading quick-revision-material page:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchPage();
    return () => { active = false; };
  }, []);

  const resolveUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/api/')) return `${BACKEND_URL}${url}`;
    return `${BACKEND_URL}/${url.replace(/^\//, '')}`;
  };

  // Combine CMS download items with initial fallback items if empty
  const rawItems: DownloadItem[] = (pageData?.downloadItems && pageData.downloadItems.length > 0)
    ? pageData.downloadItems
    : INITIAL_FALLBACK_ITEMS;

  const dynamicSubjects = Array.from(new Set(
    rawItems
      .map(i => i.type || i.examCategory)
      .filter((t): t is string => Boolean(t && t.trim()))
  )).sort();

  // Filter items without ANY year filter (as strictly specified by user!)
  const filteredItems = rawItems.filter(item => {
    if (selectedLanguage === 'English') {
      if (item.language && item.language !== 'English' && item.language !== 'Bilingual') return false;
    } else if (selectedLanguage === 'Hindi') {
      if (item.language && item.language !== 'Hindi' && item.language !== 'Bilingual') return false;
    }

    if (selectedSubject !== 'ALL') {
      const subj = (item.type || item.examCategory || '').toLowerCase();
      if (subj !== selectedSubject.toLowerCase()) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q) ||
        (item.type || '').toLowerCase().includes(q)
      );
    }

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 min-h-screen font-body">
      
      {/* ── Breadcrumbs ── */}
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-semibold">
        <Link href="/" className="hover:text-amber-500 flex items-center gap-1 transition-colors">
          <Home className="w-3.5 h-3.5" />
          <span>{t('nav.home', 'Home')}</span>
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <Link href="/downloads" className="hover:text-amber-500 transition-colors">
          <span>{t('nav.downloads', 'Downloads Hub')}</span>
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-900 dark:text-white font-bold">Quick Revision Material (QRM)</span>
      </div>

      {/* ── Page Header Banner ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 pb-6 border-b border-slate-200 dark:border-white/10">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-black uppercase tracking-wider border border-amber-500/25">
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>High-Yield Revision Vault</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-heading font-black text-slate-950 dark:text-white tracking-tight">
            Quick Revision Material
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm max-w-2xl font-medium leading-relaxed">
            Consolidated subject-wise revision modules, infographics, flowcharts, and key concepts designed for swift retention and maximum score in BPSC & UPSC examinations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <ShareButton
            title="Quick Revision Material | Final Attempt"
            text="Download free Quick Revision Modules & subject notes for BPSC & UPSC preparation."
            url="/downloads/quick-revision-material"
            variant="compact"
          />
          <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/25 px-4 py-2.5 rounded-2xl shrink-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-sm">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <span className="text-xs font-black text-slate-950 dark:text-white block">{rawItems.length} Revision Modules</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Consolidated & Free</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Control Panel (NO Year Filter as requested) ── */}
      <div className="p-4 sm:p-5 bg-white dark:bg-[#0D111A] rounded-3xl border border-slate-200 dark:border-white/10 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search revision modules, topics, keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-white/[0.05] border border-slate-250 dark:border-white/10 rounded-2xl outline-none text-slate-900 dark:text-white font-medium focus:border-amber-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          
          {/* Language Selector */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/[0.06] p-1 rounded-2xl border border-slate-200 dark:border-white/10 text-xs font-bold">
            <button
              onClick={() => setSelectedLanguage('ALL')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                selectedLanguage === 'ALL'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedLanguage('English')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                selectedLanguage === 'English'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setSelectedLanguage('Hindi')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                selectedLanguage === 'Hindi'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              Hindi
            </button>
          </div>

          {/* Subject Dropdown Filter */}
          <div className="relative">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-4 py-2.5 text-xs bg-slate-50 dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 rounded-2xl outline-none text-slate-900 dark:text-white font-bold cursor-pointer pr-8"
            >
              <option value="ALL">All Subjects ({dynamicSubjects.length})</option>
              {dynamicSubjects.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* ── Subject Quick Pills Bar ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 styled-scrollbar text-xs">
        <button
          onClick={() => setSelectedSubject('ALL')}
          className={`px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
            selectedSubject === 'ALL'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-xs'
              : 'bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-amber-500'
          }`}
        >
          All Subjects ({rawItems.length})
        </button>
        {dynamicSubjects.map((s) => {
          const count = rawItems.filter(i => (i.type || i.examCategory) === s).length;
          const isSelected = selectedSubject === s;
          return (
            <button
              key={s}
              onClick={() => setSelectedSubject(s)}
              className={`px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                isSelected
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-amber-500'
              }`}
            >
              {s} ({count})
            </button>
          );
        })}
      </div>

      {/* ── Revision Modules Cards Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-56 bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-white/10 rounded-3xl max-w-md mx-auto space-y-3 shadow-xs">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="font-heading font-black text-base text-slate-950 dark:text-white">No Revision Modules Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Try adjusting your search keyword or selected subject.</p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedSubject('ALL'); setSelectedLanguage('ALL'); }}
            className="px-4 py-2 bg-amber-500 text-slate-950 text-xs font-bold rounded-xl hover:bg-amber-400 transition-all cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-white/10 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs hover:border-amber-500/50 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
            >
              <div className="space-y-3">
                
                {/* Header Badges */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-xl flex items-center gap-1 truncate max-w-[190px]">
                    <Zap className="w-3 h-3 shrink-0 fill-current" />
                    <span className="truncate">{item.type || item.examCategory || 'Revision Module'}</span>
                  </span>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.size && (
                      <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 dark:bg-white/[0.06] px-2 py-0.5 rounded-lg">
                        {item.size}
                      </span>
                    )}
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg ${
                      item.language === 'Hindi'
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                        : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                    }`}>
                      {item.language || 'English'}
                    </span>
                  </div>
                </div>

                <h3 className="font-heading font-extrabold text-base text-slate-950 dark:text-white leading-snug group-hover:text-amber-500 transition-colors line-clamp-2">
                  {item.title}
                </h3>

                {item.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed font-medium">
                    {item.description}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-white/10">
                {item.url && (
                  <button
                    onClick={() => setActiveReaderModal({ title: item.title, url: item.url })}
                    className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] text-slate-900 dark:text-white text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-200 dark:border-white/10"
                    title="Read PDF directly in browser"
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-500" />
                    <span>View PDF</span>
                  </button>
                )}

                {item.url && (
                  <a
                    href={resolveUrl(item.url)}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 hover:scale-[1.02] transition-all cursor-pointer"
                    title="Download module PDF"
                  >
                    <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Download</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── In-Site PDF Document Viewer Modal ── */}
      {activeReaderModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-white/10 w-full max-w-5xl h-[88vh] rounded-3xl flex flex-col shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between gap-3 bg-slate-50 dark:bg-white/[0.03]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0">
                  <Zap className="w-4 h-4 fill-current" />
                </div>
                <h3 className="font-heading font-black text-xs sm:text-sm text-slate-950 dark:text-white truncate">
                  {activeReaderModal.title}
                </h3>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={resolveUrl(activeReaderModal.url)}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span className="hidden sm:inline">Download</span>
                </a>
                <button
                  onClick={() => setActiveReaderModal(null)}
                  className="p-1.5 text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal PDF Viewer Body */}
            <div className="flex-1 bg-slate-900 relative">
              <iframe
                src={`${resolveUrl(activeReaderModal.url)}#toolbar=1`}
                className="w-full h-full border-none"
                title={activeReaderModal.title}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
