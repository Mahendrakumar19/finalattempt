'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, Download, Eye, Home, ChevronRight, X, Scale, FileText, Bookmark, Sparkles } from 'lucide-react';
import { db, CustomPage, DownloadItem } from '@/services/db';
import { useTranslation } from '@/context/LocaleContext';

export default function ValueAdditionPortal() {
  const { t } = useTranslation();
  const [pageData, setPageData] = useState<CustomPage | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  // In-site Document Reader Modal
  const [activeReaderModal, setActiveReaderModal] = useState<{ title: string; url: string } | null>(null);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  const loadPage = useCallback(async () => {
    setLoading(true);
    try {
      let data = await db.getCustomPageBySlug('downloads/value-added-mains');
      if (!data) {
        data = await db.getCustomPageBySlug('value-added-mains');
      }
      if (data) {
        setPageData(data);
      }
    } catch (err) {
      console.error('Error loading value-added-mains page:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  const resolveUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/api/')) return `${BACKEND_URL}${url}`;
    return `${BACKEND_URL}/${url.replace(/^\//, '')}`;
  };

  const downloadItems: DownloadItem[] = pageData?.downloadItems || [];

  const dynamicTypes = Array.from(new Set(
    downloadItems
      .map(i => i.type || i.examCategory)
      .filter((t): t is string => Boolean(t && t.trim()))
  )).sort();

  const filteredItems = downloadItems.filter(item => {
    if (selectedLanguage === 'English') {
      if (item.language && item.language !== 'English' && item.language !== 'Bilingual') return false;
    } else if (selectedLanguage === 'Hindi') {
      if (item.language && item.language !== 'Hindi' && item.language !== 'Bilingual') return false;
    }

    if (selectedType !== 'ALL') {
      const type = (item.type || item.examCategory || '').toLowerCase();
      if (type !== selectedType.toLowerCase()) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q)
      );
    }

    return true;
  });

  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 min-h-screen font-body">
      
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-semibold">
        <Link href="/" className="hover:text-cyan-500 flex items-center gap-1">
          <Home className="w-3.5 h-3.5" />
          <span>{t('nav.home', 'Home')}</span>
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-350" />
        <Link href="/downloads" className="hover:text-cyan-500">
          <span>{t('nav.downloads', 'Downloads Hub')}</span>
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-350" />
        <span className="text-slate-800 dark:text-slate-200 font-bold">{t('downloads.valueAddedTitle', 'Value Added Materials — Mains')}</span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
        <div>
          <h1 className="text-3xl sm:text-4xl font-heading font-black text-slate-900 dark:text-white tracking-tight">
            {t('downloads.valueAddedTitle', 'Value Added Materials — Mains')}
          </h1>
        </div>

        <div className="flex items-center gap-3 bg-cyan-500/10 border border-cyan-500/20 px-4 py-2.5 rounded-2xl shrink-0">
          <Scale className="w-5 h-5 text-cyan-500" />
          <div>
            <span className="text-xs font-black text-slate-900 dark:text-white block">{downloadItems.length} Mains Booklets</span>
            <span className="text-[10px] text-slate-500 font-bold uppercase">SC Judgments, Quotes &amp; Schemes</span>
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
            placeholder={t('downloads.searchPlaceholder', 'Search SC judgments, quotes, Bihar schemes...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/[0.06] rounded-2xl outline-none text-slate-900 dark:text-white font-medium"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          
          {/* Language Selector */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200 dark:border-white/10">
            <button
              onClick={() => setSelectedLanguage('ALL')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${selectedLanguage === 'ALL' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'}`}
            >
              All Languages
            </button>
            <button
              onClick={() => setSelectedLanguage('English')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${selectedLanguage === 'English' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'}`}
            >
              English
            </button>
            <button
              onClick={() => setSelectedLanguage('Hindi')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${selectedLanguage === 'Hindi' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'}`}
            >
              Hindi
            </button>
          </div>

          {/* Category Selector */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-250 dark:border-white/[0.06] rounded-2xl outline-none text-slate-800 dark:text-white font-bold cursor-pointer"
          >
            <option value="ALL">All Categories ({dynamicTypes.length})</option>
            {dynamicTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

        </div>
      </div>

      {/* Content Overview Notes (from CMS) */}
      {/* {pageData?.content && pageData.content.trim() !== '' && (
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/[0.08] rounded-3xl p-8 sm:p-10 shadow-xs space-y-4">
          
          <div
            className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: pageData.content }}
          />
        </div>
      )} */}

      {/* Value Addition Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-56 bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-white/10 rounded-3xl max-w-md mx-auto space-y-4 shadow-sm">
          <Scale className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="font-heading font-black text-base text-slate-950 dark:text-white">No Value Addition Materials Uploaded Yet</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 space-y-4 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
            >
              <div className="space-y-3">
                
                {/* Header Tags */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] font-black uppercase text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1">
                    <Scale className="w-3 h-3" />
                    <span>{item.type || item.examCategory || 'Mains Value Added'}</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    {item.size && (
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        {item.size}
                      </span>
                    )}
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {item.language || 'English'}
                    </span>
                  </div>
                </div>

                <h3 className="font-heading font-extrabold text-base text-slate-900 dark:text-white leading-snug line-clamp-2">
                  {item.title}
                </h3>

                {item.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-white/10">
                {item.url && (
                  <button
                    onClick={() => setActiveReaderModal({ title: item.title, url: item.url })}
                    className="flex-1 py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-200 dark:border-white/10"
                  >
                    <Eye className="w-3.5 h-3.5 text-cyan-500" />
                    <span>{t('downloads.viewPDF', 'Read Document')}</span>
                  </button>
                )}

                {item.url && (
                  <a
                    href={resolveUrl(item.url)}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2.5 px-3 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-black rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all text-center"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{t('downloads.downloadPDF', 'Download PDF')}</span>
                  </a>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

      {/* POPUP MODAL: IN-SITE DOCUMENT READER */}
      {activeReaderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl flex flex-col h-[90vh] overflow-hidden">
            <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-white/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 max-w-xl">
                <Scale className="w-5 h-5 text-cyan-500 shrink-0" />
                <h3 className="font-heading font-black text-sm sm:text-base text-slate-900 dark:text-white truncate">
                  Document Preview: {activeReaderModal.title}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={resolveUrl(activeReaderModal.url)}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white font-black text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t('downloads.download', 'Download Booklet')}</span>
                </a>
                <button
                  onClick={() => setActiveReaderModal(null)}
                  className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-900 p-2 overflow-hidden">
              <iframe
                src={resolveUrl(activeReaderModal.url)}
                className="w-full h-full rounded-2xl border-0"
                title={`Document Preview - ${activeReaderModal.title}`}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
