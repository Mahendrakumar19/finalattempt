'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, FileText, Download, BookOpen, Eye, Home, ChevronRight, X, Layers, Globe, Filter } from 'lucide-react';
import { db, CustomPage, DownloadItem } from '@/services/db';
import PublicationCheckoutModal from './PublicationCheckoutModal';

interface SpecificDownloadPageProps {
  pageSlug: string;
  defaultTitle: string;
  defaultBadge: string;
  defaultSubtitle: string;
  defaultColor: {
    bg: string;
    border: string;
    text: string;
    badge: string;
    iconBg: string;
  };
}

const CATEGORY_PALETTES = [
  { bg: 'from-amber-500/15 via-amber-500/5 to-transparent', border: 'border-amber-500/30 hover:border-amber-500', text: 'text-amber-600 dark:text-amber-400', badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30', iconBg: 'bg-amber-500 text-slate-950' },
  { bg: 'from-blue-500/15 via-blue-500/5 to-transparent', border: 'border-blue-500/30 hover:border-blue-500', text: 'text-blue-600 dark:text-blue-400', badge: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30', iconBg: 'bg-blue-500 text-white' },
  { bg: 'from-emerald-500/15 via-emerald-500/5 to-transparent', border: 'border-emerald-500/30 hover:border-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30', iconBg: 'bg-emerald-500 text-slate-950' },
  { bg: 'from-rose-500/15 via-rose-500/5 to-transparent', border: 'border-rose-500/30 hover:border-rose-500', text: 'text-rose-600 dark:text-rose-400', badge: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30', iconBg: 'bg-rose-500 text-white' },
  { bg: 'from-purple-500/15 via-purple-500/5 to-transparent', border: 'border-purple-500/30 hover:border-purple-500', text: 'text-purple-600 dark:text-purple-400', badge: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30', iconBg: 'bg-purple-500 text-white' },
  { bg: 'from-cyan-500/15 via-cyan-500/5 to-transparent', border: 'border-cyan-500/30 hover:border-cyan-500', text: 'text-cyan-600 dark:text-cyan-400', badge: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30', iconBg: 'bg-cyan-500 text-slate-950' }
];

export default function NcertStyleDownloadPortal({
  pageSlug,
  defaultTitle,
  defaultBadge,
  defaultSubtitle,
  defaultColor
}: SpecificDownloadPageProps) {
  const [pageData, setPageData] = useState<CustomPage | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [examsList, setExamsList] = useState<any[]>([]);

  // Category Modal state (Standard Vault items like NCERT/PYQ)
  const [activeCategoryModal, setActiveCategoryModal] = useState<string | null>(null);

  // Sample PDF Modal state (For Publication Catalogue items)
  const [activeSampleModal, setActiveSampleModal] = useState<{ title: string; samplePdfUrl: string } | null>(null);

  // Publication Checkout Modal state
  const [activeCheckoutItem, setActiveCheckoutItem] = useState<DownloadItem | null>(null);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  const loadExams = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/syllabus-strategy/exams`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setExamsList(data.data.filter((e: any) => e.isActive !== false));
      }
    } catch (err) {
      console.error('Error fetching exams for download portal:', err);
    }
  }, [BACKEND_URL]);

  const loadPage = useCallback(async () => {
    setLoading(true);
    try {
      let data = await db.getCustomPageBySlug(`downloads/${pageSlug}`);
      if (!data) {
        data = await db.getCustomPageBySlug(pageSlug);
      }
      if (data) {
        setPageData(data);
      }
    } catch (err) {
      console.error(`Error loading portal downloads/${pageSlug}:`, err);
    }
    setLoading(false);
  }, [pageSlug]);

  useEffect(() => {
    loadPage();
    loadExams();
  }, [loadPage, loadExams]);

  const getCategoryLogo = (categoryName: string): string | null => {
    if (!categoryName || examsList.length === 0) return null;
    const catLower = categoryName.toLowerCase();
    
    const matchedExam = examsList.find(ex => {
      const name = (ex.name || '').toLowerCase();
      const code = (ex.code || '').toLowerCase();
      const slug = (ex.slug || '').toLowerCase();
      
      return catLower.includes(name) || name.includes(catLower) ||
             (code && (catLower.includes(code) || code.includes(catLower))) ||
             (slug && (catLower.includes(slug) || slug.includes(catLower)));
    });

    if (matchedExam) {
      if (matchedExam.logoUrl) return matchedExam.logoUrl;
      if (matchedExam.logo?.storagePath) {
        const p = matchedExam.logo.storagePath;
        if (p.startsWith('http://') || p.startsWith('https://')) return p;
        return `${BACKEND_URL}/${p.replace(/^\//, '')}`;
      }
    }
    return null;
  };

  const resolveUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/api/')) return `${BACKEND_URL}${url}`;
    return `${BACKEND_URL}/${url.replace(/^\//, '')}`;
  };

  const downloadItems: DownloadItem[] = pageData?.downloadItems || [];

  // Check if current page is the Publications Catalogue section
  const isPublicationPage = pageSlug === 'fa-publication' || pageSlug === 'fa-publications';

  // Dynamic Categories derived directly from database items
  const dynamicPubCategories = Array.from(new Set(
    downloadItems
      .map(i => i.examCategory || i.type)
      .filter((c): c is string => Boolean(c && c.trim()))
  )).sort();

  // Filter items for Publications Catalogue
  const filteredPublications = downloadItems.filter(item => {
    // Language Filter
    if (selectedLanguage === 'English') {
      if (item.language && item.language !== 'English' && item.language !== 'Bilingual') return false;
    } else if (selectedLanguage === 'Hindi') {
      if (item.language && item.language !== 'Hindi' && item.language !== 'Bilingual') return false;
    }

    // Category Filter
    if (selectedType !== 'ALL') {
      const cat = (item.examCategory || item.type || '').toLowerCase();
      if (cat !== selectedType.toLowerCase()) return false;
    }

    // Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q) ||
        (item.examCategory || item.type || '').toLowerCase().includes(q)
      );
    }

    return true;
  });

  // NCERT / PYQ System Vault grouping
  const uniqueVaultTypes = Array.from(new Set(downloadItems.map(i => i.type || 'General Notes'))).sort();
  const categoryVaults = uniqueVaultTypes.map(type => ({
    category: type,
    items: downloadItems.filter(i => (i.type || 'General Notes').toLowerCase() === type.toLowerCase())
  }));

  const filteredVaults = categoryVaults.filter(vault => {
    if (selectedType !== 'ALL' && vault.category !== selectedType) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      vault.category.toLowerCase().includes(q) ||
      vault.items.some(i => i.title.toLowerCase().includes(q) || (i.description || '').toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 min-h-screen font-body">
      
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-semibold">
        <Link href="/" className="hover:text-amber-500 flex items-center gap-1">
          <Home className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-350" />
        <Link href="/downloads" className="hover:text-amber-500">
          <span>Downloads Hub</span>
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-350" />
        <span className="text-slate-800 dark:text-slate-200 font-bold">{defaultTitle || pageData?.title}</span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200 dark:border-white/10">
        <div className="space-y-3 max-w-3xl">
          <span className={`text-[10px] font-bold ${defaultColor.text} ${defaultColor.badge} border px-3 py-1.5 rounded-xl uppercase tracking-widest block w-fit`}>
            {defaultBadge}
          </span>
          <h1 className="text-4xl sm:text-5xl font-heading font-black text-slate-900 dark:text-white tracking-tight leading-none">
            {defaultTitle || pageData?.title}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
            {pageData?.metaDescription || defaultSubtitle}
          </p>
        </div>

        {/* Quick Stats Banner */}
        <div className={`flex items-center gap-3 ${defaultColor.badge} border px-5 py-3.5 rounded-2xl shrink-0`}>
          <BookOpen className={`w-6 h-6 ${defaultColor.text}`} />
          <div>
            <span className="text-xs font-black text-slate-900 dark:text-white block">{downloadItems.length} {isPublicationPage ? 'Publications' : 'Materials'} Available</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              {isPublicationPage ? `${dynamicPubCategories.length} Exam Categories` : `${uniqueVaultTypes.length} Material Vaults`}
            </span>
          </div>
        </div>
      </div>

      {/* Search & Dynamic Filter Control Panel */}
      <div className="p-6 bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-white/[0.08] shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={isPublicationPage ? "Search publications by title or category..." : "Search by booklet name or category..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/[0.06] rounded-2xl outline-none text-slate-900 dark:text-white font-medium"
          />
        </div>

        {/* Dynamic Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          
          {/* Language Filter Pills (For Publications Catalogue) */}
          {isPublicationPage && (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200 dark:border-white/10">
              <button
                onClick={() => setSelectedLanguage('ALL')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${selectedLanguage === 'ALL' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'}`}
              >
                All Languages
              </button>
              <button
                onClick={() => setSelectedLanguage('English')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${selectedLanguage === 'English' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'}`}
              >
                🇬🇧 English
              </button>
              <button
                onClick={() => setSelectedLanguage('Hindi')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${selectedLanguage === 'Hindi' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'}`}
              >
                🇮🇳 Hindi
              </button>
            </div>
          )}

          {/* Dynamic Category Selector Dropdown */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-250 dark:border-white/[0.06] rounded-2xl outline-none text-slate-800 dark:text-white font-bold cursor-pointer"
          >
            <option value="ALL">All Categories ({isPublicationPage ? dynamicPubCategories.length : uniqueVaultTypes.length})</option>
            {(isPublicationPage ? dynamicPubCategories : uniqueVaultTypes).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Page Content Overview (if present) */}
      {pageData?.content && pageData.content.trim() !== '' && (
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/[0.08] rounded-3xl p-8 sm:p-10 shadow-xs space-y-4">
          <h3 className="font-heading font-extrabold text-base text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-200 dark:border-white/10 pb-3">
            Overview &amp; Guidelines
          </h3>
          <div
            className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 text-sm sm:text-base leading-relaxed"
            dangerouslySetInnerHTML={{ __html: pageData.content }}
          />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW MODE 1: PUBLICATIONS CATALOGUE GRID (Inspired by Reference)
      ══════════════════════════════════════════════════════════════════════ */}
      {isPublicationPage ? (
        loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-72 bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : filteredPublications.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-white/10 rounded-3xl max-w-md mx-auto space-y-4 shadow-sm">
            <BookOpen className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="font-heading font-black text-base text-slate-950 dark:text-white">No Publications Found</h3>
            <p className="text-xs text-slate-500">No publication matches your selected filters or search query.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredPublications.map(item => {
              const hasDiscount = item.price && item.discountedPrice && item.price > item.discountedPrice;
              const discountPct = hasDiscount ? Math.round(((item.price! - item.discountedPrice!) / item.price!) * 100) : 0;
              const isFree = !item.price && !item.discountedPrice;

              return (
                <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-5 space-y-4 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
                  
                  {/* Book Cover Image Container */}
                  <div className="relative w-full aspect-[3/4] bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 flex items-center justify-center">
                    {item.thumbnailUrl ? (
                      <img src={resolveUrl(item.thumbnailUrl)} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="p-6 text-center space-y-2">
                        <BookOpen className="w-10 h-10 text-amber-500 mx-auto" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Final Attempt</span>
                      </div>
                    )}

                    {/* Discount Badge (% OFF) - Render ONLY if discount exists */}
                    {hasDiscount && discountPct > 0 && (
                      <span className="absolute top-3 left-3 bg-emerald-500 text-slate-950 font-black text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-xl shadow-md border border-emerald-400">
                        {discountPct}% OFF
                      </span>
                    )}

                    {/* Language Badge */}
                    <span className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md text-white font-bold text-[10px] px-2.5 py-1 rounded-xl border border-white/20">
                      {item.language === 'Hindi' ? '🇮🇳 Hindi' : item.language === 'Bilingual' ? '🌐 Bilingual' : '🇬🇧 English'}
                    </span>
                  </div>

                  {/* Details Block */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black uppercase text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                        {item.examCategory || item.type || 'BPSC'}
                      </span>
                      {item.editionYear && (
                        <span className="text-[9px] font-bold text-slate-400">
                          {item.editionYear}
                        </span>
                      )}
                    </div>

                    <h3 className="font-heading font-black text-base text-slate-900 dark:text-white line-clamp-2 leading-snug">
                      {item.title}
                    </h3>

                    {item.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed font-medium">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Price & Actions Block */}
                  <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-white/10">
                    
                    {/* Price Display */}
                    <div className="flex items-baseline justify-between">
                      {isFree ? (
                        <span className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black text-xs uppercase tracking-wider border border-emerald-500/20">
                          FREE
                        </span>
                      ) : (
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-black text-slate-900 dark:text-white">
                            ₹{item.discountedPrice || item.price}
                          </span>
                          {hasDiscount && (
                            <span className="text-xs font-bold text-slate-400 line-through">
                              ₹{item.price}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      {/* Read Sample PDF (ONLY rendered if samplePdfUrl exists) */}
                      {item.samplePdfUrl && item.samplePdfUrl.trim() !== '' && (
                        <button
                          onClick={() => setActiveSampleModal({ title: item.title, samplePdfUrl: item.samplePdfUrl! })}
                          className="flex-1 py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-200 dark:border-white/10"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-500" />
                          <span>Read Sample</span>
                        </button>
                      )}

                      {/* Buy or Download Button */}
                      {isFree ? (
                        item.url && (
                          <a
                            href={resolveUrl(item.url)}
                            download
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 py-2.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all text-center"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download PDF</span>
                          </a>
                        )
                      ) : (
                        <button
                          onClick={() => setActiveCheckoutItem(item)}
                          className="flex-1 py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all text-center cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Buy Now</span>
                        </button>
                      )}
                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        )
      ) : (
        /* ══════════════════════════════════════════════════════════════════════
            VIEW MODE 2: STANDARD NCERT / PYQ / VAULT BOXES GRID
        ══════════════════════════════════════════════════════════════════════ */
        loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : filteredVaults.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-white/10 rounded-3xl max-w-md mx-auto space-y-4 shadow-sm">
            <Layers className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="font-heading font-black text-base text-slate-950 dark:text-white">No Materials Uploaded Yet</h3>
            <p className="text-xs text-slate-500">Upload documents &amp; files for this page directly from the Admin Panel.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredVaults.map(({ category, items }, idx) => {
              const theme = CATEGORY_PALETTES[idx % CATEGORY_PALETTES.length];
              const examLogo = getCategoryLogo(category);

              return (
                <div
                  key={category}
                  onClick={() => setActiveCategoryModal(category)}
                  className={`group bg-gradient-to-br ${theme.bg} bg-white dark:bg-slate-900 border ${theme.border} p-6 rounded-3xl space-y-5 shadow-xs hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden group-hover:-translate-y-1`}
                >
                  <div className="space-y-3 relative">
                    <div className="flex items-center justify-between">
                      <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 dark:border-slate-700 flex items-center justify-center font-black text-sm shadow-sm p-1.5 shrink-0 group-hover:scale-105 transition-transform overflow-hidden">
                        {examLogo ? (
                          <img src={examLogo} alt={category} className="w-full h-full object-contain" />
                        ) : (
                          <div className={`w-full h-full rounded-xl ${theme.iconBg} flex items-center justify-center`}>
                            <BookOpen className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-wider ${theme.badge} border px-3 py-1 rounded-xl`}>
                        {items.length} {items.length === 1 ? 'File' : 'Files'}
                      </span>
                    </div>

                    <div>
                      <h3 className={`font-heading font-black text-xl text-slate-900 dark:text-white ${theme.text} transition-colors`}>
                        {category}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                        Collection of {category} files, booklets &amp; PDFs.
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-between">
                    <span className={`text-xs font-black ${theme.text} group-hover:translate-x-1 transition-transform inline-flex items-center gap-1`}>
                      View  &rarr;
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* POPUP MODAL 1: IN-SITE SAMPLE PDF READER MODAL */}
      {activeSampleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl flex flex-col h-[90vh] overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-white/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 max-w-xl">
                <Eye className="w-5 h-5 text-amber-500 shrink-0" />
                <h3 className="font-heading font-black text-sm sm:text-base text-slate-900 dark:text-white truncate">
                  Sample Preview: {activeSampleModal.title}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={resolveUrl(activeSampleModal.samplePdfUrl)}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample</span>
                </a>

                <button
                  onClick={() => setActiveSampleModal(null)}
                  className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Embedded PDF Viewer */}
            <div className="flex-1 bg-slate-900 p-2 overflow-hidden">
              <iframe
                src={resolveUrl(activeSampleModal.samplePdfUrl)}
                className="w-full h-full rounded-2xl border-0"
                title={`Sample PDF Preview - ${activeSampleModal.title}`}
              />
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL 2: STANDARD NCERT / PYQ CATEGORY VAULT MODAL */}
      {activeCategoryModal && (() => {
        const vaultItems = downloadItems.filter(i => (i.type || 'General Notes').toLowerCase() === activeCategoryModal.toLowerCase());
        const modalLogo = getCategoryLogo(activeCategoryModal);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-6xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
              
              <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-slate-100 dark:border-white/[0.08] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white text-slate-950 flex items-center justify-center font-black text-xs shrink-0 shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden p-1">
                    {modalLogo ? (
                      <img src={modalLogo} alt={activeCategoryModal} className="w-full h-full object-contain" />
                    ) : (
                      <BookOpen className="w-5 h-5 text-amber-500" />
                    )}
                  </div>
                  <div>
                    <h2 className="font-heading font-black text-lg sm:text-xl text-slate-900 dark:text-white leading-tight">
                      {activeCategoryModal} Vault Collection
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      Select document to preview or download PDF booklets.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveCategoryModal(null)}
                  className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
                {vaultItems.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs font-semibold">
                    No files found in {activeCategoryModal}.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {vaultItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl space-y-3 hover:border-amber-500/50 transition-all flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="text-[9px] font-black uppercase tracking-wider text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                              {item.type || 'PDF'}
                            </span>
                            {item.size && (
                              <span className="text-[9px] font-extrabold text-slate-400">
                                {item.size}
                              </span>
                            )}
                          </div>

                          <h4 className="font-heading font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white leading-snug line-clamp-2">
                            {item.title}
                          </h4>

                          {item.description && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                              {item.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 pt-3 border-t border-slate-200/70 dark:border-white/[0.06]">
                          {item.url && (
                            <a
                              href={resolveUrl(item.url)}
                              target="_blank"
                              rel="noreferrer"
                              className="flex-1 py-2 px-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all"
                            >
                              <Eye className="w-3.5 h-3.5 text-amber-500" />
                              <span>View</span>
                            </a>
                          )}

                          {item.url && (
                            <a
                              href={resolveUrl(item.url)}
                              download
                              target="_blank"
                              rel="noreferrer"
                              className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download</span>
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        );
      })()}

      {/* POPUP MODAL 3: PUBLICATION CHECKOUT & SHIPPING ADDRESS MODAL */}
      {activeCheckoutItem && (
        <PublicationCheckoutModal
          item={activeCheckoutItem}
          onClose={() => setActiveCheckoutItem(null)}
        />
      )}

    </div>
  );
}
