'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Search, Download, Eye, Home, ChevronRight, X, Zap, BookOpen, 
  Layers, CheckCircle2, Sparkles, Filter, Globe, Calendar, FileText
} from 'lucide-react';
import { db, CustomPage, DownloadItem } from '@/services/db';
import { useTranslation } from '@/context/LocaleContext';
import ShareButton from '@/components/ShareButton';

export interface RevisionSection {
  id: string;
  name: string;
  keywords: string[];
}

export const SECTIONS_LIST: RevisionSection[] = [
  { id: 'all', name: 'Latest', keywords: [] },
  { id: 'ancient-medieval', name: 'Ancient and Medieval History', keywords: ['ancient', 'medieval', 'indus', 'vedic', 'sultanate', 'mughal'] },
  { id: 'ecology-env', name: 'Ecology and Environment', keywords: ['ecology', 'environment', 'wetlands', 'biodiversity', 'wildlife', 'climate'] },
  { id: 'economics', name: 'Economics', keywords: ['economic', 'economy', 'budget', 'monetary', 'fiscal', 'inflation', 'banking'] },
  { id: 'geography', name: 'Geography', keywords: ['geography', 'drainage', 'monsoon', 'climate', 'agriculture', 'mineral', 'river'] },
  { id: 'modern-history', name: 'History of Modern India', keywords: ['modern', 'freedom struggle', '1857', 'gandhi', 'congress', 'timeline'] },
  { id: 'art-culture', name: 'Indian Art and Culture', keywords: ['art', 'culture', 'temple', 'architecture', 'dance', 'unesco', 'heritage', 'painting'] },
  { id: 'polity', name: 'Polity and Governance', keywords: ['polity', 'governance', 'constitution', 'parliament', 'rights', 'dpsp', 'amendment'] },
  { id: 'state-special', name: 'State Special', keywords: ['state special', 'bihar', 'bpsc', 'state pcs', 'patna', 'up special'] }
];

export const INITIAL_FALLBACK_ITEMS: DownloadItem[] = [
  // Modern Indian History
  {
    id: 'rrm-mod-01',
    title: 'Modern Indian History',
    description: 'History of Modern India — Major Movements, Freedom Struggle Timeline & Important Personalities',
    type: 'History of Modern India',
    examCategory: 'BPSC & UPSC',
    language: 'Hindi',
    editionYear: '2026',
    size: '3.8 MB',
    url: '/sample-resources/history-of-modern-india-hi.pdf'
  },
  {
    id: 'rrm-mod-02',
    title: 'Modern Indian History (Chronology & Acts)',
    description: 'Constitutional Developments, Governor Generals & Freedom Struggle Movements (1857–1947)',
    type: 'History of Modern India',
    examCategory: 'BPSC & UPSC',
    language: 'English',
    editionYear: '2026',
    size: '3.5 MB',
    url: '/sample-resources/modern-history-chronology-en.pdf'
  },

  // Geography
  {
    id: 'rrm-geo-01',
    title: 'Geography',
    description: 'Indian Physical Geography, River Drainage Systems & Monsoon Mechanism',
    type: 'Geography',
    examCategory: 'BPSC & UPSC',
    language: 'Hindi',
    editionYear: '2026',
    size: '4.1 MB',
    url: '/sample-resources/geography-drainage-monsoon-hi.pdf'
  },
  {
    id: 'rrm-geo-02',
    title: 'Indian & World Geography Maps',
    description: 'Key Minerals, Cropping Patterns, Oceanic Currents & Important Geographical Locations',
    type: 'Geography',
    examCategory: 'BPSC & UPSC',
    language: 'English',
    editionYear: '2026',
    size: '3.9 MB',
    url: '/sample-resources/geography-maps-minerals-en.pdf'
  },

  // Economics
  {
    id: 'rrm-eco-01',
    title: 'Economics',
    description: 'Macroeconomic Concepts, Banking System & Economic Survey Crux',
    type: 'Economics',
    examCategory: 'BPSC & UPSC',
    language: 'Hindi',
    editionYear: '2026',
    size: '3.6 MB',
    url: '/sample-resources/economics-survey-macro-hi.pdf'
  },
  {
    id: 'rrm-eco-02',
    title: 'Indian Economy & Union Budget',
    description: 'Fiscal & Monetary Policy, Inflation Indices, External Trade & Government Key Schemes',
    type: 'Economics',
    examCategory: 'BPSC & UPSC',
    language: 'English',
    editionYear: '2026',
    size: '4.2 MB',
    url: '/sample-resources/indian-economy-budget-en.pdf'
  },

  // Indian Art and Culture
  {
    id: 'rrm-art-01',
    title: 'Indian Art and Culture',
    description: 'Indian Architecture, Temple Styles, Classical Dances & UNESCO Heritage Sites',
    type: 'Indian Art and Culture',
    examCategory: 'BPSC & UPSC',
    language: 'Hindi',
    editionYear: '2026',
    size: '3.2 MB',
    url: '/sample-resources/indian-art-and-culture-hi.pdf'
  },
  {
    id: 'rrm-art-02',
    title: 'Art, Architecture & Cultural Heritage',
    description: 'Sculpture, Cave Traditions, Literature, Music Gharanas & Religious Philosophies',
    type: 'Indian Art and Culture',
    examCategory: 'BPSC & UPSC',
    language: 'English',
    editionYear: '2026',
    size: '3.7 MB',
    url: '/sample-resources/art-culture-heritage-en.pdf'
  },

  // Ancient and Medieval History
  {
    id: 'rrm-anc-01',
    title: 'Ancient and Medieval History',
    description: 'Indus Valley Civilization, Vedic Period, Mauryas, Guptas, Delhi Sultanate & Mughals',
    type: 'Ancient and Medieval History',
    examCategory: 'BPSC & UPSC',
    language: 'Hindi',
    editionYear: '2026',
    size: '4.0 MB',
    url: '/sample-resources/ancient-medieval-history-hi.pdf'
  },
  {
    id: 'rrm-anc-02',
    title: 'Ancient & Medieval India Revision Module',
    description: 'Administrative Systems, Social Stratification, Bhakti-Sufi Movements & Chronology',
    type: 'Ancient and Medieval History',
    examCategory: 'BPSC & UPSC',
    language: 'English',
    editionYear: '2026',
    size: '3.8 MB',
    url: '/sample-resources/ancient-medieval-revision-en.pdf'
  },

  // Ecology and Environment
  {
    id: 'rrm-eco-env-01',
    title: 'Ecology and Environment',
    description: 'Biodiversity, National Parks, Ramsar Wetlands & Global Climate Agreements (UNFCCC/CBD)',
    type: 'Ecology and Environment',
    examCategory: 'BPSC & UPSC',
    language: 'Hindi',
    editionYear: '2026',
    size: '4.4 MB',
    url: '/sample-resources/ecology-and-environment-hi.pdf'
  },
  {
    id: 'rrm-eco-env-02',
    title: 'Environmental Protocols & Wildlife Mapping',
    description: 'IUCN Red List Categories, Biosphere Reserves, Pollution Acts & Renewable Energy Goals',
    type: 'Ecology and Environment',
    examCategory: 'BPSC & UPSC',
    language: 'English',
    editionYear: '2026',
    size: '4.6 MB',
    url: '/sample-resources/environmental-protocols-en.pdf'
  },

  // Polity and Governance
  {
    id: 'rrm-pol-01',
    title: 'Polity and Governance',
    description: 'Constitutional Framework, Fundamental Rights, DPSP, Parliament & Landmark Judicial Cases',
    type: 'Polity and Governance',
    examCategory: 'BPSC & UPSC',
    language: 'Hindi',
    editionYear: '2026',
    size: '3.9 MB',
    url: '/sample-resources/polity-and-governance-hi.pdf'
  },
  {
    id: 'rrm-pol-02',
    title: 'Indian Polity & Constitutional Bodies',
    description: 'Panchayati Raj, Election Commission, CAG, Emergency Provisions & Recent Amendments',
    type: 'Polity and Governance',
    examCategory: 'BPSC & UPSC',
    language: 'English',
    editionYear: '2026',
    size: '3.7 MB',
    url: '/sample-resources/polity-governance-bodies-en.pdf'
  },

  // State Special (Bihar & State PCS)
  {
    id: 'rrm-state-01',
    title: 'State Special',
    description: 'बिहार विशेष: आधुनिक इतिहास, 1857 क्रांति, चंपारण सत्याग्रह एवं स्वतंत्रता सेनानी',
    type: 'State Special',
    examCategory: 'BPSC (Bihar)',
    language: 'Hindi',
    editionYear: '2026',
    size: '3.4 MB',
    url: '/sample-resources/bihar-history-freedom-struggle-hi.pdf'
  },
  {
    id: 'rrm-state-02',
    title: 'State Special (Bihar Geography & Economy)',
    description: 'बिहार का भूगोल (नदियां, खनिज, कृषि) एवं बिहार आर्थिक सर्वेक्षण व बजट मुख्य बिंदु',
    type: 'State Special',
    examCategory: 'BPSC (Bihar)',
    language: 'Hindi',
    editionYear: '2026',
    size: '2.8 MB',
    url: '/sample-resources/bihar-economic-survey-budget-hi.pdf'
  }
];

export default function RapidRevisionPortal() {
  const { t } = useTranslation();
  const [pageData, setPageData] = useState<CustomPage | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  // In-site Document Reader Modal
  const [activeReaderModal, setActiveReaderModal] = useState<{ title: string; url: string } | null>(null);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    let active = true;
    const fetchPage = async () => {
      try {
        let data = await db.getCustomPageBySlug('downloads/rapid-revision');
        if (!data) {
          data = await db.getCustomPageBySlug('rapid-revision');
        }
        if (!data) {
          data = await db.getCustomPageBySlug('downloads/quick-revision-material');
        }
        if (!data) {
          data = await db.getCustomPageBySlug('quick-revision-material');
        }
        if (active && data) {
          setPageData(data);
        }
      } catch (err) {
        console.error('Error loading rapid-revision page:', err);
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

  // Combine CMS download items with initial fallback items
  const allItems: DownloadItem[] = useMemo(() => {
    if (pageData?.downloadItems && pageData.downloadItems.length > 0) {
      return pageData.downloadItems;
    }
    return INITIAL_FALLBACK_ITEMS;
  }, [pageData]);

  // Current selected section metadata
  const currentSection = useMemo(() => {
    return SECTIONS_LIST.find(s => s.id === activeSectionId) || SECTIONS_LIST[0];
  }, [activeSectionId]);

  // Filter items by selected section, language, and search query (NO YEAR FILTER!)
  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      // 1. Language filter
      if (selectedLanguage === 'English') {
        if (item.language && item.language.toLowerCase() !== 'english' && item.language.toLowerCase() !== 'bilingual') return false;
      } else if (selectedLanguage === 'Hindi') {
        if (item.language && item.language.toLowerCase() !== 'hindi' && item.language.toLowerCase() !== 'bilingual') return false;
      }

      // 2. Section index filter
      if (activeSectionId !== 'all') {
        const itemType = (item.type || '').toLowerCase();
        const itemTitle = (item.title || '').toLowerCase();
        const itemDesc = (item.description || '').toLowerCase();
        const itemExam = (item.examCategory || '').toLowerCase();

        const sec = SECTIONS_LIST.find(s => s.id === activeSectionId);
        if (sec) {
          const matchByName = itemType.includes(sec.name.toLowerCase()) || itemTitle.includes(sec.name.toLowerCase());
          const matchByKeyword = sec.keywords.some(k => 
            itemType.includes(k) || itemTitle.includes(k) || itemDesc.includes(k) || itemExam.includes(k)
          );
          if (!matchByName && !matchByKeyword) return false;
        }
      }

      // 3. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          (item.title || '').toLowerCase().includes(q) ||
          (item.description || '').toLowerCase().includes(q) ||
          (item.type || '').toLowerCase().includes(q) ||
          (item.examCategory || '').toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [allItems, activeSectionId, selectedLanguage, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-[#080C14] font-body text-slate-900 dark:text-white transition-colors duration-200">
      
      {/* ── Top Breadcrumbs & Page Heading ── */}
      <div className="bg-white dark:bg-[#0D111A] border-b border-slate-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-3">
          
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-semibold">
            <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 transition-colors">
              <Home className="w-3.5 h-3.5" />
              <span>{t('nav.home', 'Home')}</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <Link href="/downloads" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <span>{t('nav.downloads', 'Downloads Hub')}</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 dark:text-white font-bold">Rapid Revision Material (RRM)</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold mb-2">
                <Zap className="w-3.5 h-3.5" />
                <span>RRM • High Yield Revision</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-heading font-black text-slate-950 dark:text-white tracking-tight">
                Rapid Revision Material (RRM)
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-0.5 font-medium">
                High-yield consolidated revision modules, infographics & quick charts for BPSC & State PCS
              </p>
            </div>

            <ShareButton
              title="Rapid Revision Material (RRM) | Final Attempt"
              text="Download free Rapid Revision Modules (RRM) & subject notes for BPSC & State PCS preparation."
              url="/downloads/rapid-revision"
              variant="compact"
            />
          </div>

        </div>
      </div>

      {/* ── Main Two-Column Container (Left Index Sidebar + Right Content) ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ════ LEFT COLUMN: All Sections Index Sidebar (Matches User Photo) ════ */}
          <aside className="lg:col-span-3 bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-xs sticky top-20">
            <h2 className="text-base font-heading font-black text-slate-900 dark:text-white pb-3 border-b border-slate-200 dark:border-white/10">
              All Sections
            </h2>

            <nav className="mt-2 divide-y divide-slate-100 dark:divide-white/[0.06]">
              {SECTIONS_LIST.map((sec) => {
                const isActive = activeSectionId === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => setActiveSectionId(sec.id)}
                    className={`w-full text-left py-3.5 px-2 text-xs sm:text-sm transition-all flex items-center justify-between group cursor-pointer ${
                      isActive
                        ? 'text-blue-600 dark:text-blue-400 font-extrabold bg-blue-50/50 dark:bg-blue-500/10 rounded-xl px-3'
                        : 'text-slate-700 dark:text-slate-300 font-bold hover:text-blue-600 dark:hover:text-blue-400'
                    }`}
                  >
                    <span className="truncate pr-2">{sec.name}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* ════ RIGHT COLUMN: Revision Cards Grid ════ */}
          <main className="lg:col-span-9 space-y-6">
            
            {/* Header of Content: Active Section Name + Search & Language Toggle */}
            <div className="bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-white/10 p-4 sm:p-5 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-heading font-black text-slate-900 dark:text-white">
                  {currentSection.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                  Showing {filteredItems.length} revision documents
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Search Bar */}
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search topics, modules..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 rounded-xl outline-none text-slate-900 dark:text-white font-medium focus:border-blue-500 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Medium / Language Filter Toggle (All, English, Hindi) */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/[0.06] p-1 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold">
                  {(['ALL', 'English', 'Hindi'] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setSelectedLanguage(lang)}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        selectedLanguage === lang
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {lang === 'ALL' ? 'All Mediums' : lang}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Grid of Revision Items (Matching VisionIAS Card Layout) */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-white/10 p-5 rounded-2xl animate-pulse space-y-4">
                    <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                    <div className="h-9 bg-slate-200 dark:bg-slate-800 rounded-xl mt-4" />
                  </div>
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-white/10 rounded-2xl p-12 text-center space-y-3">
                <BookOpen className="w-10 h-10 text-slate-400 mx-auto opacity-40" />
                <h4 className="font-heading font-black text-base text-slate-800 dark:text-slate-200">
                  No revision material found
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  {searchQuery 
                    ? `No materials matched "${searchQuery}". Try a different keyword.` 
                    : `No materials uploaded under ${currentSection.name} yet.`}
                </p>
                {(searchQuery || selectedLanguage !== 'ALL') && (
                  <button
                    onClick={() => { setSearchQuery(''); setSelectedLanguage('ALL'); }}
                    className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-blue-700 transition-colors cursor-pointer mt-2"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredItems.map((item) => {
                  const resolvedUrl = resolveUrl(item.url);
                  const isHindi = item.language?.toLowerCase() === 'hindi';

                  return (
                    <div
                      key={item.id}
                      className="group bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-white/10 hover:border-blue-500/50 dark:hover:border-blue-500/40 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5"
                    >
                      {/* Top content */}
                      <div className="space-y-3">
                        {/* Title */}
                        <h4 className="font-heading font-extrabold text-base text-slate-950 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                          {item.title}
                        </h4>

                        {/* Subject / Category subtitle matching Vision IAS */}
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-2">
                          {item.description || item.type || 'Consolidated Revision Module'}
                        </p>

                        {/* Metadata row: Exam Category & Language */}
                        <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-600 dark:text-slate-400 font-semibold">
                          {item.examCategory && (
                            <span className="flex items-center gap-1">
                              <Layers className="w-3.5 h-3.5 text-slate-400" />
                              <span>{item.examCategory}</span>
                            </span>
                          )}

                          <span className="flex items-center gap-1 uppercase tracking-wider text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300">
                            <Globe className="w-3 h-3 text-blue-500" />
                            <span>{item.language || 'English'}</span>
                          </span>

                          {item.size && (
                            <span className="text-slate-400 text-[10px]">
                              {item.size}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bottom Button Action (Matches Vision IAS View/Download Button) */}
                      <div className="pt-5 mt-4 border-t border-slate-100 dark:border-white/[0.06] flex items-center gap-2">
                        {/* View / Read Button */}
                        <button
                          type="button"
                          onClick={() => {
                            if (resolvedUrl) {
                              setActiveReaderModal({ title: item.title, url: resolvedUrl });
                            } else {
                              alert('Document file will be available shortly.');
                            }
                          }}
                          className="flex-1 py-2.5 px-3 bg-white dark:bg-white/[0.04] hover:bg-blue-50 dark:hover:bg-blue-600/10 border border-blue-600/30 text-blue-600 dark:text-blue-400 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View / Read</span>
                        </button>

                        {/* Direct Download Button */}
                        {resolvedUrl ? (
                          <a
                            href={resolvedUrl}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs flex items-center justify-center transition-colors shadow-2xs cursor-pointer shrink-0"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={() => alert('Document file will be available shortly.')}
                            className="p-2.5 bg-slate-200 dark:bg-slate-800 text-slate-400 rounded-xl text-xs flex items-center justify-center cursor-not-allowed shrink-0"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom info banner */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-transparent border border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-heading font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                    Looking for full-length BPSC Previous Year Questions?
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    Visit our PYQ Vault for solved prelims and mains question papers.
                  </p>
                </div>
              </div>
              <Link
                href="/downloads/pyq"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 text-center"
              >
                Open PYQ Vault
              </Link>
            </div>

          </main>

        </div>
      </div>

      {/* ════ IN-SITE DOCUMENT READER MODAL ════ */}
      {activeReaderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#080C14]">
              <div className="flex items-center gap-3 min-w-0 pr-4">
                <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                    Rapid Revision Reader
                  </span>
                  <h3 className="font-heading font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                    {activeReaderModal.title}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={activeReaderModal.url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Download PDF</span>
                </a>
                <button
                  type="button"
                  onClick={() => setActiveReaderModal(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                  title="Close Reader"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: PDF Viewer Iframe */}
            <div className="flex-1 bg-slate-100 dark:bg-black/40 relative">
              <iframe
                src={`${activeReaderModal.url}#toolbar=0`}
                className="w-full h-full border-0"
                title={activeReaderModal.title}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
