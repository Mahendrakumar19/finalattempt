'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Search, Download, Eye, Home, ChevronRight, X, Zap, BookOpen, 
  Layers, CheckCircle2, Sparkles, Filter, Globe, Calendar, FileText, MapPin
} from 'lucide-react';
import { db, CustomPage, DownloadItem } from '@/services/db';
import { useTranslation } from '@/context/LocaleContext';
import ShareButton from '@/components/ShareButton';

export interface RevisionSection {
  id: string;
  name: string;
  keywords: string[];
}

// Mixed / Non-alphabetical sequence so it feels distinct and unique to Final Attempt
export const SECTIONS_LIST: RevisionSection[] = [
  { id: 'all', name: 'Latest', keywords: [] },
  { id: 'polity', name: 'Polity and Governance', keywords: ['polity', 'governance', 'constitution', 'parliament', 'rights', 'dpsp', 'amendment'] },
  { id: 'modern-history', name: 'History of Modern India', keywords: ['modern', 'freedom struggle', '1857', 'gandhi', 'congress', 'timeline'] },
  { id: 'state-special', name: 'State Special', keywords: ['state special', 'bihar', 'bpsc', 'state pcs', 'patna', 'up special', 'uppsc', 'uttar pradesh'] },
  { id: 'geography', name: 'Geography', keywords: ['geography', 'drainage', 'monsoon', 'climate', 'agriculture', 'mineral', 'river'] },
  { id: 'economics', name: 'Economics', keywords: ['economic', 'economy', 'budget', 'monetary', 'fiscal', 'inflation', 'banking'] },
  { id: 'ecology-env', name: 'Ecology and Environment', keywords: ['ecology', 'environment', 'wetlands', 'biodiversity', 'wildlife', 'climate'] },
  { id: 'art-culture', name: 'Indian Art and Culture', keywords: ['art', 'culture', 'temple', 'architecture', 'dance', 'unesco', 'heritage', 'painting'] },
  { id: 'ancient-medieval', name: 'Ancient and Medieval History', keywords: ['ancient', 'medieval', 'indus', 'vedic', 'sultanate', 'mughal'] }
];

// Rich, mixed collection across subjects with prominent Bihar & UP State Special modules
export const INITIAL_FALLBACK_ITEMS: DownloadItem[] = [
  // 1. History
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

  // 2. State Special: Bihar
  {
    id: 'rrm-state-bihar-01',
    title: 'Bihar Special: Freedom Struggle & 1857 Revolt',
    description: '1857 Revolt in Bihar (Kunwar Singh), Champaran Satyagraha, Quit India Movement & Key Freedom Fighters',
    type: 'State Special',
    examCategory: 'BPSC (Bihar)',
    language: 'Hindi',
    editionYear: '2026',
    size: '3.4 MB',
    url: '/sample-resources/bihar-history-freedom-struggle-hi.pdf'
  },

  // 3. Polity
  {
    id: 'rrm-pol-01',
    title: 'Polity and Governance: Constitutional Framework',
    description: 'Constitutional Framework, Fundamental Rights, DPSP, Parliament & Landmark Judicial Cases',
    type: 'Polity and Governance',
    examCategory: 'BPSC & UPSC',
    language: 'Hindi',
    editionYear: '2026',
    size: '3.9 MB',
    url: '/sample-resources/polity-and-governance-hi.pdf'
  },

  // 4. Geography
  {
    id: 'rrm-geo-01',
    title: 'Indian Physical Geography & Drainage',
    description: 'Indian Physical Features, River Drainage Systems (Himalayan & Peninsular) & Monsoon Mechanism',
    type: 'Geography',
    examCategory: 'BPSC & UPSC',
    language: 'Hindi',
    editionYear: '2026',
    size: '4.1 MB',
    url: '/sample-resources/geography-drainage-monsoon-hi.pdf'
  },

  // 5. State Special: UP
  {
    id: 'rrm-state-up-01',
    title: 'UP Special: History & Freedom Movement',
    description: '1857 Revolt Centres (Lucknow, Meerut, Jhansi, Kanpur), Non-Cooperation, Kakori Action & UP Personalities',
    type: 'State Special',
    examCategory: 'UPPSC (UP)',
    language: 'Hindi',
    editionYear: '2026',
    size: '3.6 MB',
    url: '/sample-resources/up-history-freedom-movement-hi.pdf'
  },

  // 6. Economics
  {
    id: 'rrm-eco-01',
    title: 'Economics: Macro Concepts & Banking',
    description: 'Macroeconomic Aggregates, RBI Monetary Policy, Banking System, Inflation & Economic Survey Crux',
    type: 'Economics',
    examCategory: 'BPSC & UPSC',
    language: 'Hindi',
    editionYear: '2026',
    size: '3.6 MB',
    url: '/sample-resources/economics-survey-macro-hi.pdf'
  },

  // 7. State Special: Bihar
  {
    id: 'rrm-state-bihar-02',
    title: 'Bihar Geography, River Drainage & Natural Resources',
    description: 'Ganga River Basin, North & South Bihar Rivers, Mineral Distribution, Agriculture & Climate Zones',
    type: 'State Special',
    examCategory: 'BPSC (Bihar)',
    language: 'English',
    editionYear: '2026',
    size: '3.1 MB',
    url: '/sample-resources/bihar-geography-drainage-en.pdf'
  },

  // 8. Ecology & Environment
  {
    id: 'rrm-eco-env-01',
    title: 'Ecology & Environment: Biodiversity & Conventions',
    description: 'Biodiversity Hotspots, National Parks, Ramsar Wetlands & Global Climate Agreements (UNFCCC/CBD)',
    type: 'Ecology and Environment',
    examCategory: 'BPSC & UPSC',
    language: 'Hindi',
    editionYear: '2026',
    size: '4.4 MB',
    url: '/sample-resources/ecology-and-environment-hi.pdf'
  },

  // 9. State Special: UP
  {
    id: 'rrm-state-up-02',
    title: 'Uttar Pradesh Geography, Soil & River Systems',
    description: 'Terai-Bhabhar Region, Bundelkhand Plateau, Ganga-Yamuna Doab, Canals, Dams & Wildlife Sanctuaries',
    type: 'State Special',
    examCategory: 'UPPSC (UP)',
    language: 'English',
    editionYear: '2026',
    size: '3.3 MB',
    url: '/sample-resources/up-geography-drainage-soils-en.pdf'
  },

  // 10. Art and Culture
  {
    id: 'rrm-art-01',
    title: 'Indian Art and Culture: Architecture & Heritage',
    description: 'Indian Architecture, Temple Styles (Nagara, Dravida, Vesara), Classical Dances & UNESCO Heritage Sites',
    type: 'Indian Art and Culture',
    examCategory: 'BPSC & UPSC',
    language: 'Hindi',
    editionYear: '2026',
    size: '3.2 MB',
    url: '/sample-resources/indian-art-and-culture-hi.pdf'
  },

  // 11. State Special: Bihar
  {
    id: 'rrm-state-bihar-03',
    title: 'Bihar Economic Survey & State Budget Crux',
    description: 'State GDP Growth, Seven Resolves (Saat Nischay-2), Industrial Policy & Welfare Schemes Summary',
    type: 'State Special',
    examCategory: 'BPSC (Bihar)',
    language: 'Hindi',
    editionYear: '2026',
    size: '2.8 MB',
    url: '/sample-resources/bihar-economic-survey-budget-hi.pdf'
  },

  // 12. Polity
  {
    id: 'rrm-pol-02',
    title: 'Indian Polity & Constitutional Bodies',
    description: 'Panchayati Raj, Election Commission, CAG, Emergency Provisions & Recent Constitutional Amendments',
    type: 'Polity and Governance',
    examCategory: 'BPSC & UPSC',
    language: 'English',
    editionYear: '2026',
    size: '3.7 MB',
    url: '/sample-resources/polity-governance-bodies-en.pdf'
  },

  // 13. State Special: UP
  {
    id: 'rrm-state-up-03',
    title: 'UP Budget & 1 Trillion Economy Roadmap',
    description: 'UP $1 Trillion Dollar Economy Blueprint, ODOP (One District One Product), Expressways & Industrial Corridors',
    type: 'State Special',
    examCategory: 'UPPSC (UP)',
    language: 'Hindi',
    editionYear: '2026',
    size: '2.9 MB',
    url: '/sample-resources/up-budget-economy-odop-hi.pdf'
  },

  // 14. Ancient and Medieval History
  {
    id: 'rrm-anc-01',
    title: 'Ancient and Medieval History: Empire Chronology',
    description: 'Indus Valley Civilization, Vedic Period, Mauryas, Guptas, Delhi Sultanate & Mughals Overview',
    type: 'Ancient and Medieval History',
    examCategory: 'BPSC & UPSC',
    language: 'Hindi',
    editionYear: '2026',
    size: '4.0 MB',
    url: '/sample-resources/ancient-medieval-history-hi.pdf'
  },

  // 15. State Special: Bihar
  {
    id: 'rrm-state-bihar-04',
    title: 'Bihar Art, Culture & Heritage',
    description: 'Madhubani & Manjusha Paintings, Maurya & Pala Art, Nalanda & Vikramshila, Folk Dances & Fairs',
    type: 'State Special',
    examCategory: 'BPSC (Bihar)',
    language: 'English',
    editionYear: '2026',
    size: '3.5 MB',
    url: '/sample-resources/bihar-art-culture-heritage-en.pdf'
  },

  // 16. Modern History
  {
    id: 'rrm-mod-02',
    title: 'Modern Indian History: Chronology & Acts',
    description: 'Constitutional Developments, Governor Generals & Freedom Struggle Movements (1857–1947)',
    type: 'History of Modern India',
    examCategory: 'BPSC & UPSC',
    language: 'English',
    editionYear: '2026',
    size: '3.5 MB',
    url: '/sample-resources/modern-history-chronology-en.pdf'
  },

  // 17. State Special: UP
  {
    id: 'rrm-state-up-04',
    title: 'UP Culture, Folk Arts & Heritage',
    description: 'Braj, Awadh, Bundelkhand & Purvanchal Cultural Traditions, Kathak Gharanas, Charkula & UNESCO Sites',
    type: 'State Special',
    examCategory: 'UPPSC (UP)',
    language: 'English',
    editionYear: '2026',
    size: '3.4 MB',
    url: '/sample-resources/up-culture-traditions-en.pdf'
  },

  // 18. Geography
  {
    id: 'rrm-geo-02',
    title: 'Indian & World Geography Maps & Minerals',
    description: 'Key Minerals, Cropping Patterns, Oceanic Currents & Important Geographical Locations',
    type: 'Geography',
    examCategory: 'BPSC & UPSC',
    language: 'English',
    editionYear: '2026',
    size: '3.9 MB',
    url: '/sample-resources/geography-maps-minerals-en.pdf'
  },

  // 19. Ecology & Environment
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

  // 20. Economics
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
  }
];

export default function RapidRevisionPortal() {
  const { t } = useTranslation();
  const [pageData, setPageData] = useState<CustomPage | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('ALL');
  
  // State Special Sub-filter: 'ALL' | 'BIHAR' | 'UP'
  const [stateSpecialSubFilter, setStateSpecialSubFilter] = useState<'ALL' | 'BIHAR' | 'UP'>('ALL');

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

  // Filter items by selected section, language, State sub-filter, and search query (NO YEAR FILTER!)
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
        const itemType = (item.type || '').trim().toLowerCase();
        const itemTitle = (item.title || '').toLowerCase();
        const itemDesc = (item.description || '').toLowerCase();
        const itemExam = (item.examCategory || '').toLowerCase();

        if (activeSectionId === 'state-special') {
          // Strictly State Special items (Bihar or UP)
          const isState = itemType.includes('state special') ||
                          itemTitle.includes('bihar') || itemTitle.includes('uttar pradesh') || /\bup\b/.test(itemTitle) ||
                          itemExam === 'bpsc (bihar)' || itemExam === 'uppsc (up)';
          if (!isState) return false;
        } else if (activeSectionId === 'polity') {
          const isPolity = itemType.includes('polity') || itemTitle.includes('polity') || itemTitle.includes('constitution') || itemDesc.includes('constitutional');
          if (!isPolity) return false;
        } else if (activeSectionId === 'modern-history') {
          const isModern = (itemType.includes('modern') || itemTitle.includes('modern')) && !itemType.includes('state special') && !itemTitle.includes('bihar') && !itemTitle.includes('up special');
          if (!isModern) return false;
        } else if (activeSectionId === 'geography') {
          const isGeo = (itemType.includes('geography') || itemTitle.includes('geography')) && !itemType.includes('state special') && !itemTitle.includes('bihar') && !itemTitle.includes('uttar pradesh');
          if (!isGeo) return false;
        } else if (activeSectionId === 'economics') {
          const isEco = (itemType.includes('economic') || itemTitle.includes('economic')) && !itemType.includes('state special') && !itemTitle.includes('bihar') && !itemTitle.includes('up budget');
          if (!isEco) return false;
        } else if (activeSectionId === 'ecology-env') {
          const isEnv = itemType.includes('ecology') || itemType.includes('environment') || itemTitle.includes('ecology') || itemTitle.includes('environment');
          if (!isEnv) return false;
        } else if (activeSectionId === 'art-culture') {
          const isArt = (itemType.includes('art') || itemType.includes('culture') || itemTitle.includes('art and culture')) && !itemType.includes('state special') && !itemTitle.includes('bihar') && !itemTitle.includes('up culture');
          if (!isArt) return false;
        } else if (activeSectionId === 'ancient-medieval') {
          const isAnc = itemType.includes('ancient') || itemType.includes('medieval') || itemTitle.includes('ancient') || itemTitle.includes('medieval');
          if (!isAnc) return false;
        } else {
          const sec = SECTIONS_LIST.find(s => s.id === activeSectionId);
          if (sec && !itemType.includes(sec.name.toLowerCase()) && !itemTitle.includes(sec.name.toLowerCase())) {
            return false;
          }
        }
      }

      // 3. State Special Sub-filter (Bihar vs UP)
      if (activeSectionId === 'state-special' || stateSpecialSubFilter !== 'ALL') {
        const text = `${item.title} ${item.description} ${item.type} ${item.examCategory}`.toLowerCase();
        if (stateSpecialSubFilter === 'BIHAR') {
          if (!text.includes('bihar') && !text.includes('bpsc')) return false;
        } else if (stateSpecialSubFilter === 'UP') {
          const matchUp = /\bup\b/.test(text) || text.includes('uppsc') || text.includes('uttar pradesh') || text.includes('purvanchal') || text.includes('bundelkhand') || text.includes('awadh');
          if (!matchUp) return false;
        }
      }

      // 4. Search query filter
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
  }, [allItems, activeSectionId, stateSpecialSubFilter, selectedLanguage, searchQuery]);

  // Counts for Bihar vs UP
  const biharCount = useMemo(() => {
    return allItems.filter(item => {
      const text = `${item.title} ${item.description} ${item.type} ${item.examCategory}`.toLowerCase();
      return (text.includes('bihar') || text.includes('bpsc')) && (item.type?.toLowerCase().includes('state special') || item.title?.toLowerCase().includes('bihar') || item.examCategory?.toLowerCase() === 'bpsc (bihar)');
    }).length;
  }, [allItems]);

  const upCount = useMemo(() => {
    return allItems.filter(item => {
      const text = `${item.title} ${item.description} ${item.type} ${item.examCategory}`.toLowerCase();
      const matchUp = /\bup\b/.test(text) || text.includes('uppsc') || text.includes('uttar pradesh') || text.includes('purvanchal') || text.includes('bundelkhand') || text.includes('awadh');
      return matchUp && (item.type?.toLowerCase().includes('state special') || item.title?.toLowerCase().includes('up special') || item.examCategory?.toLowerCase() === 'uppsc (up)');
    }).length;
  }, [allItems]);

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
                High-yield consolidated revision modules, infographics & quick charts for UPSC & State PCS (BPSC, UPPSC)
              </p>
            </div>

            <ShareButton
              title="Rapid Revision Material (RRM) | Final Attempt"
              text="Download free Rapid Revision Modules (RRM) & subject notes for UPSC & State PCS (BPSC, UPPSC) preparation."
              url="/downloads/rapid-revision"
              variant="compact"
            />
          </div>

        </div>
      </div>

      {/* ── Main Two-Column Container (Left Index Sidebar + Right Content) ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ════ LEFT COLUMN: All Sections Index Sidebar ════ */}
          <aside className="lg:col-span-3 bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-xs sticky top-20">
            <h2 className="text-base font-heading font-black text-slate-900 dark:text-white pb-3 border-b border-slate-200 dark:border-white/10">
              All Sections
            </h2>

            <nav className="mt-2 divide-y divide-slate-100 dark:divide-white/[0.06]">
              {SECTIONS_LIST.map((sec) => {
                const isActive = activeSectionId === sec.id;
                const isStateSpecial = sec.id === 'state-special';

                return (
                  <div key={sec.id} className="py-1">
                    <button
                      onClick={() => {
                        setActiveSectionId(sec.id);
                        if (!isStateSpecial) {
                          setStateSpecialSubFilter('ALL');
                        }
                      }}
                      className={`w-full text-left py-2.5 px-2 text-xs sm:text-sm transition-all flex items-center justify-between group cursor-pointer ${
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

                    {/* Sub-filter pills under State Special in Sidebar */}
                    {isStateSpecial && (
                      <div className="pl-3 pr-1 pt-1 pb-1.5 flex flex-wrap gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveSectionId('state-special');
                            setStateSpecialSubFilter('ALL');
                          }}
                          className={`px-2 py-0.5 text-[10px] rounded-md font-bold transition-all cursor-pointer ${
                            activeSectionId === 'state-special' && stateSpecialSubFilter === 'ALL'
                              ? 'bg-amber-500 text-slate-950 font-black shadow-2xs'
                              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/[0.04]'
                          }`}
                        >
                          All
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveSectionId('state-special');
                            setStateSpecialSubFilter('BIHAR');
                          }}
                          className={`px-2 py-0.5 text-[10px] rounded-md font-bold transition-all cursor-pointer ${
                            activeSectionId === 'state-special' && stateSpecialSubFilter === 'BIHAR'
                              ? 'bg-amber-500 text-slate-950 font-black shadow-2xs'
                              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/[0.04]'
                          }`}
                        >
                          Bihar (BPSC)
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveSectionId('state-special');
                            setStateSpecialSubFilter('UP');
                          }}
                          className={`px-2 py-0.5 text-[10px] rounded-md font-bold transition-all cursor-pointer ${
                            activeSectionId === 'state-special' && stateSpecialSubFilter === 'UP'
                              ? 'bg-amber-500 text-slate-950 font-black shadow-2xs'
                              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/[0.04]'
                          }`}
                        >
                          UP (UPPSC)
                        </button>
                      </div>
                    )}
                  </div>
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
                  {activeSectionId === 'state-special' 
                    ? (stateSpecialSubFilter === 'BIHAR' 
                        ? 'State Special — Bihar (BPSC)' 
                        : stateSpecialSubFilter === 'UP' 
                          ? 'State Special — Uttar Pradesh (UPPSC)' 
                          : 'State Special (Bihar & UP PCS)')
                    : currentSection.name}
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

            {/* ════ STATE SPECIAL PROMINENT SUB-FILTER (Bihar vs UP) ════ */}
            {activeSectionId === 'state-special' && (
              <div className="p-3.5 sm:p-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-amber-500" />
                    State Filter:
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
                    Choose state for targeted BPSC &amp; UPPSC modules
                  </span>
                </div>

                <div className="flex items-center gap-1.5 bg-white dark:bg-[#0D111A] p-1 rounded-xl border border-amber-500/30 text-xs font-bold shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setStateSpecialSubFilter('ALL')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      stateSpecialSubFilter === 'ALL'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-amber-500'
                    }`}
                  >
                    All States
                  </button>
                  <button
                    type="button"
                    onClick={() => setStateSpecialSubFilter('BIHAR')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                      stateSpecialSubFilter === 'BIHAR'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-amber-500'
                    }`}
                  >
                    <span>Bihar Special (BPSC)</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-white/10">
                      {biharCount}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStateSpecialSubFilter('UP')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                      stateSpecialSubFilter === 'UP'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-amber-500'
                    }`}
                  >
                    <span>UP Special (UPPSC)</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-white/10">
                      {upCount}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Grid of Revision Items */}
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
                    : `No materials uploaded under ${currentSection.name} ${stateSpecialSubFilter !== 'ALL' ? `(${stateSpecialSubFilter})` : ''} yet.`}
                </p>
                {(searchQuery || selectedLanguage !== 'ALL' || stateSpecialSubFilter !== 'ALL') && (
                  <button
                    onClick={() => { setSearchQuery(''); setSelectedLanguage('ALL'); setStateSpecialSubFilter('ALL'); }}
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
                  const isStateItem = (item.type || '').includes('State Special') || (item.examCategory || '').includes('BPSC') || (item.examCategory || '').includes('UPPSC');

                  return (
                    <div
                      key={item.id}
                      className="group bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-white/10 hover:border-amber-500/50 dark:hover:border-amber-500/40 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5"
                    >
                      {/* Top content */}
                      <div className="space-y-3">
                        {/* Title */}
                        <h4 className="font-heading font-extrabold text-base text-slate-950 dark:text-white group-hover:text-amber-500 transition-colors line-clamp-2">
                          {item.title}
                        </h4>

                        {/* Subject / Category subtitle */}
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-2">
                          {item.description || item.type || 'Consolidated Revision Module'}
                        </p>

                        {/* Metadata row: Exam Category & Language */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-600 dark:text-slate-400 font-semibold">
                          {item.examCategory && (
                            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              item.examCategory.includes('BPSC') 
                                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20' 
                                : item.examCategory.includes('UPPSC')
                                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                                  : 'bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300'
                            }`}>
                              <Layers className="w-3 h-3" />
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

                      {/* Bottom Button Action */}
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
                          className="flex-1 py-2.5 px-3 bg-white dark:bg-white/[0.04] hover:bg-amber-50 dark:hover:bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
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
                            className="p-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center transition-colors shadow-2xs cursor-pointer shrink-0"
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
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-xs font-black">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-heading font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                    Need state-specific BPSC &amp; UPPSC Previous Year Questions?
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    Visit our solved PYQ Vault with detailed topic-wise explanations.
                  </p>
                </div>
              </div>
              <Link
                href="/downloads/pyq"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-colors shrink-0 text-center"
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
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 block">
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
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs"
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
