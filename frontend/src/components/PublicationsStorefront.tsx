'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, Download, BookOpen, Eye, Home, ChevronRight, X, Folder, ArrowLeft, FolderOpen, ShoppingBag, Layers, Filter } from 'lucide-react';
import { db, CustomPage, DownloadItem } from '@/services/db';
import { useTranslation } from '@/context/LocaleContext';
import PublicationCheckoutModal from './PublicationCheckoutModal';

const FOLDER_PALETTES = [
  { bg: 'from-purple-500/15 via-purple-500/5 to-transparent', border: 'border-purple-500/30 hover:border-purple-500', text: 'text-purple-600 dark:text-purple-400', badge: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30', iconBg: 'bg-purple-600 text-white' },
  { bg: 'from-amber-500/15 via-amber-500/5 to-transparent', border: 'border-amber-500/30 hover:border-amber-500', text: 'text-amber-600 dark:text-amber-400', badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30', iconBg: 'bg-amber-500 text-slate-950' },
  { bg: 'from-blue-500/15 via-blue-500/5 to-transparent', border: 'border-blue-500/30 hover:border-blue-500', text: 'text-blue-600 dark:text-blue-400', badge: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30', iconBg: 'bg-blue-600 text-white' },
  { bg: 'from-emerald-500/15 via-emerald-500/5 to-transparent', border: 'border-emerald-500/30 hover:border-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30', iconBg: 'bg-emerald-500 text-slate-950' },
  { bg: 'from-cyan-500/15 via-cyan-500/5 to-transparent', border: 'border-cyan-500/30 hover:border-cyan-500', text: 'text-cyan-600 dark:text-cyan-400', badge: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30', iconBg: 'bg-cyan-500 text-slate-950' }
];

export default function PublicationsStorefront() {
  const { t } = useTranslation();
  const [pageData, setPageData] = useState<CustomPage | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('ALL');
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [examsList, setExamsList] = useState<any[]>([]);

  // Modals
  const [activeSampleModal, setActiveSampleModal] = useState<{ title: string; samplePdfUrl: string } | null>(null);
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
      console.error('Error loading exams list:', err);
    }
  }, [BACKEND_URL]);

  const loadPage = useCallback(async () => {
    setLoading(true);
    try {
      let data = await db.getCustomPageBySlug('downloads/fa-publication');
      if (!data) {
        data = await db.getCustomPageBySlug('fa-publication');
      }
      if (data) {
        setPageData(data);
      }
    } catch (err) {
      console.error('Error loading publications page:', err);
    }
    setLoading(false);
  }, []);

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

  const resolveUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/api/')) return `${BACKEND_URL}${url}`;
    return `${BACKEND_URL}/${url.replace(/^\//, '')}`;
  };

  const downloadItems: DownloadItem[] = pageData?.downloadItems || [];

  // Default Folders
  const defaultFolders = ['BPSC', 'Arunachal PCS (APPSC)', 'Arunachal Pradesh Staff Selection Board (APSSB)'];

  // All Folders derived from Database + Defaults
  const allFolders = Array.from(new Set([
    ...defaultFolders,
    ...downloadItems.map(i => i.examCategory || i.type).filter((c): c is string => Boolean(c && c.trim()))
  ])).sort();

  // Group items by Folder
  const folderVaults = allFolders.map(folderName => {
    const items = downloadItems.filter(item => {
      const cat = (item.examCategory || item.type || '').toLowerCase();
      return cat === folderName.toLowerCase() || (folderName === 'BPSC' && cat === '') || (folderName.includes('BPSC') && cat.includes('bpsc'));
    });
    return {
      folderName,
      items
    };
  });

  // Filter items inside opened folder
  const currentFolderItems = activeFolder
    ? downloadItems.filter(item => {
        const cat = (item.examCategory || item.type || '').toLowerCase();
        const matchesFolder = cat === activeFolder.toLowerCase() ||
                              (activeFolder === 'BPSC' && (cat === '' || cat.includes('bpsc'))) ||
                              cat.includes(activeFolder.toLowerCase());
        
        if (!matchesFolder) return false;

        // Language Filter
        if (selectedLanguage === 'English') {
          if (item.language && item.language !== 'English' && item.language !== 'Bilingual') return false;
        } else if (selectedLanguage === 'Hindi') {
          if (item.language && item.language !== 'Hindi' && item.language !== 'Bilingual') return false;
        }

        // Search Filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return item.title.toLowerCase().includes(q) || (item.description || '').toLowerCase().includes(q);
        }

        return true;
      })
    : [];

  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 min-h-screen font-body">
      
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-semibold">
        <Link href="/" className="hover:text-purple-500 flex items-center gap-1">
          <Home className="w-3.5 h-3.5" />
          <span>{t('nav.home', 'Home')}</span>
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-350" />
        <Link href="/downloads" className="hover:text-purple-500">
          <span>{t('nav.downloads', 'Downloads Hub')}</span>
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-350" />
        <button onClick={() => setActiveFolder(null)} className="hover:text-purple-500 cursor-pointer">
          <span>{t('checkout.title', 'Final Attempt Publications')}</span>
        </button>
        {activeFolder && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-350" />
            <span className="text-purple-600 dark:text-purple-400 font-bold">{activeFolder} Folder</span>
          </>
        )}
      </div>

      {/* Directory Title & Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-xl inline-block mb-2">
            {activeFolder ? `Exam Folder: ${activeFolder}` : 'Exam Category Publication Folders'}
          </span>
          <h1 className="text-3xl sm:text-4xl font-heading font-black text-slate-900 dark:text-white tracking-tight">
            {activeFolder ? `${activeFolder} Books Vault` : t('checkout.title', 'Final Attempt Publications')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
            {activeFolder
              ? `Browse official ${activeFolder} textbooks, Bihar special handbooks, yearbooks and model answer compilations.`
              : t('checkout.subtitle', 'Standard BPSC Preparation Books, Practice Workbooks & Material Delivered to Your Doorstep.')}
          </p>
        </div>

        <div className="flex items-center gap-3 bg-purple-500/10 border border-purple-500/20 px-4 py-2.5 rounded-2xl shrink-0">
          <BookOpen className="w-5 h-5 text-purple-500" />
          <div>
            <span className="text-xs font-black text-slate-900 dark:text-white block">{downloadItems.length} Total Publications</span>
            <span className="text-[10px] text-slate-500 font-bold uppercase">{allFolders.length} Exam Folders</span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          DIRECTORY VIEW 1: EXAM FOLDER CARDS (When activeFolder is null)
      ══════════════════════════════════════════════════════════════════════ */}
      {!activeFolder ? (
        <div className="space-y-8">
          
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10">
            <div>
              <h2 className="font-heading font-black text-xl text-slate-900 dark:text-white">
                Exam Category Folders ({allFolders.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Click on any exam folder to view its dedicated book catalogue &amp; sample PDFs.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-52 bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {folderVaults.map(({ folderName, items }, idx) => {
                const theme = FOLDER_PALETTES[idx % FOLDER_PALETTES.length];
                const examLogo = getCategoryLogo(folderName);

                return (
                  <div
                    key={folderName}
                    onClick={() => setActiveFolder(folderName)}
                    className={`group bg-gradient-to-br ${theme.bg} bg-white dark:bg-slate-900 border ${theme.border} p-6 rounded-3xl space-y-5 shadow-xs hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden group-hover:-translate-y-1`}
                  >
                    <div className="space-y-4 relative">
                      
                      {/* Top Bar with Logo & Count */}
                      <div className="flex items-center justify-between">
                        <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 dark:border-slate-700 flex items-center justify-center font-black text-sm shadow-md p-1.5 shrink-0 group-hover:scale-105 transition-transform overflow-hidden">
                          {examLogo ? (
                            <img src={examLogo} alt={folderName} className="w-full h-full object-contain" />
                          ) : (
                            <div className={`w-full h-full rounded-xl ${theme.iconBg} flex items-center justify-center`}>
                              <Folder className="w-6 h-6" />
                            </div>
                          )}
                        </div>

                        <span className={`text-[10px] font-black uppercase tracking-wider ${theme.badge} border px-3 py-1 rounded-xl flex items-center gap-1`}>
                          <BookOpen className="w-3 h-3" />
                          <span>{items.length} {items.length === 1 ? 'Book' : 'Books'}</span>
                        </span>
                      </div>

                      {/* Folder Info */}
                      <div>
                        <h3 className={`font-heading font-black text-xl text-slate-900 dark:text-white ${theme.text} transition-colors leading-tight`}>
                          {folderName}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2 font-medium">
                          Dedicated folder for {folderName} textbooks, handbooks, yearbooks &amp; model answers.
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-between">
                      <span className={`text-xs font-black ${theme.text} group-hover:translate-x-1 transition-transform inline-flex items-center gap-1.5`}>
                        <FolderOpen className="w-4 h-4 text-purple-500" />
                        <span>Open {folderName} Folder  &rarr;</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      ) : (
        /* ══════════════════════════════════════════════════════════════════════
            DIRECTORY VIEW 2: INSIDE OPENED EXAM FOLDER VIEW
        ══════════════════════════════════════════════════════════════════════ */
        <div className="space-y-8 animate-fade-in">
          
          {/* Opened Folder Header Control Bar */}
          <div className="p-6 bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-white/[0.08] shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={() => setActiveFolder(null)}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-black rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border border-slate-200 dark:border-white/10 shrink-0"
              >
                <ArrowLeft className="w-4 h-4 text-purple-500" />
                <span>{t('common.back', 'Back to All Folders')}</span>
              </button>

              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

              {/* Quick Folder Switcher Pills */}
              <div className="flex items-center gap-1 overflow-x-auto py-1">
                {allFolders.map(fName => (
                  <button
                    key={fName}
                    onClick={() => setActiveFolder(fName)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${activeFolder === fName ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  >
                    📁 {fName}
                  </button>
                ))}
              </div>
            </div>

            {/* Language & Search Bar */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              
              {/* Language Selector */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200 dark:border-white/10">
                <button
                  onClick={() => setSelectedLanguage('ALL')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${selectedLanguage === 'ALL' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setSelectedLanguage('English')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${selectedLanguage === 'English' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300'}`}
                >
                  🇬🇧 English
                </button>
                <button
                  onClick={() => setSelectedLanguage('Hindi')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${selectedLanguage === 'Hindi' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300'}`}
                >
                  🇮🇳 Hindi
                </button>
              </div>

              {/* Search */}
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={t('downloads.searchPlaceholder', `Search in ${activeFolder}...`)}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/[0.06] rounded-2xl outline-none text-slate-900 dark:text-white font-medium"
                />
              </div>

            </div>

          </div>

          {/* Folder Books Catalogue Grid */}
          {currentFolderItems.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-white/10 rounded-3xl max-w-md mx-auto space-y-4 shadow-sm">
              <FolderOpen className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="font-heading font-black text-base text-slate-950 dark:text-white">No Books in {activeFolder} Folder</h3>
              <p className="text-xs text-slate-500">Upload books for {activeFolder} directly from Admin Console.</p>
              <button
                onClick={() => setActiveFolder(null)}
                className="px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-xl"
              >
                {t('common.back', 'View Other Folders')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {currentFolderItems.map(item => {
                const hasDiscount = item.price && item.discountedPrice && item.price > item.discountedPrice;
                const discountPct = hasDiscount ? Math.round(((item.price! - item.discountedPrice!) / item.price!) * 100) : 0;
                const isFree = !item.price && !item.discountedPrice;

                return (
                  <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-5 space-y-4 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
                    
                    {/* Book Cover Thumbnail */}
                    <div className="relative w-full aspect-[3/4] bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 flex items-center justify-center">
                      {item.thumbnailUrl ? (
                        <img src={resolveUrl(item.thumbnailUrl)} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="p-6 text-center space-y-2">
                          <BookOpen className="w-10 h-10 text-purple-500 mx-auto" />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Final Attempt</span>
                        </div>
                      )}

                      {/* Discount Badge */}
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

                    {/* Content Details */}
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
                          {item.examCategory || item.type || activeFolder}
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
                        {item.samplePdfUrl && item.samplePdfUrl.trim() !== '' && (
                          <button
                            onClick={() => setActiveSampleModal({ title: item.title, samplePdfUrl: item.samplePdfUrl! })}
                            className="flex-1 py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-200 dark:border-white/10"
                          >
                            <Eye className="w-3.5 h-3.5 text-purple-500" />
                            <span>{t('downloads.viewPDF', 'Read Sample')}</span>
                          </button>
                        )}

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
                              <span>{t('downloads.downloadPDF', 'Download PDF')}</span>
                            </a>
                          )
                        ) : (
                          <button
                            onClick={() => setActiveCheckoutItem(item)}
                            className="flex-1 py-2.5 px-3 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all text-center cursor-pointer"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>{t('checkout.buyNow', 'Buy Now')}</span>
                          </button>
                        )}
                      </div>

                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* POPUP MODAL: SAMPLE PDF READER MODAL */}
      {activeSampleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl flex flex-col h-[90vh] overflow-hidden">
            <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-white/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 max-w-xl">
                <Eye className="w-5 h-5 text-purple-500 shrink-0" />
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
                  className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t('downloads.download', 'Download Sample')}</span>
                </a>
                <button
                  onClick={() => setActiveSampleModal(null)}
                  className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
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

      {/* POPUP MODAL: PUBLICATION CHECKOUT MODAL */}
      {activeCheckoutItem && (
        <PublicationCheckoutModal
          item={activeCheckoutItem}
          onClose={() => setActiveCheckoutItem(null)}
        />
      )}

    </div>
  );
}
