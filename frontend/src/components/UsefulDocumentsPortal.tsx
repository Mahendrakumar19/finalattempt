'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Search, Download, Eye, Home, ChevronRight, X, FileText, CheckCircle, Sparkles, BookOpen, Layers } from 'lucide-react';
import { db, CustomPage, DownloadItem } from '@/services/db';
import { useTranslation } from '@/context/LocaleContext';
import ShareButton from '@/components/ShareButton';

// High-yield study documents for UPSC & State PCS so the vault is never empty
export const INITIAL_USEFUL_DOCUMENTS: DownloadItem[] = [
  {
    id: 'ud-01',
    title: 'Important Supreme Court Judgments for UPSC & State PCS (1950-2025)',
    description: 'Landmark judicial verdicts, basic structure doctrine, privacy, reservation guidelines and latest constitutional bench decisions.',
    type: 'Reference Documents',
    examCategory: 'BPSC & UPSC',
    language: 'English',
    editionYear: '2026',
    size: '4.2 MB',
    url: '/sample-resources/sc-judgments-reference.pdf'
  },
  {
    id: 'ud-02',
    title: 'Indian Freedom Struggle Timeline & Important Congress Sessions Chart',
    description: 'Chronological timeline of modern Indian history, major revolts, acts, round table conferences and session presidents.',
    type: 'Timelines & Charts',
    examCategory: 'General Studies',
    language: 'Hindi',
    editionYear: '2026',
    size: '3.6 MB',
    url: '/sample-resources/freedom-struggle-timeline-hi.pdf'
  },
  {
    id: 'ud-03',
    title: 'Union Budget & Economic Survey Key Conceptual Takeaways',
    description: 'Macroeconomic indicators, fiscal deficit trends, key government welfare schemes, Capex and sectoral allocations.',
    type: 'Subject Summaries',
    examCategory: 'BPSC & UPSC',
    language: 'English',
    editionYear: '2026',
    size: '2.8 MB',
    url: '/sample-resources/economic-survey-summary.pdf'
  },
  {
    id: 'ud-04',
    title: 'Indian Polity Articles, Schedules & Major Constitutional Amendments Guide',
    description: 'Complete high-yield table of fundamental rights, DPSP, emergency provisions, and 100th to 106th constitutional amendments.',
    type: 'Timelines & Charts',
    examCategory: 'General Studies',
    language: 'Hindi',
    editionYear: '2026',
    size: '3.1 MB',
    url: '/sample-resources/polity-articles-amendments.pdf'
  },
  {
    id: 'ud-05',
    title: 'Bihar Special: Census, Geography, Agro-Climatic Zones & State Schemes',
    description: 'Crucial BPSC Prelims & Mains data: districts, river systems, mineral deposits, caste survey insights & Saat Nischay-2.',
    type: 'High-Yield Notes',
    examCategory: 'BPSC (Bihar)',
    language: 'Hindi',
    editionYear: '2026',
    size: '4.5 MB',
    url: '/sample-resources/bihar-special-census-schemes.pdf'
  },
  {
    id: 'ud-06',
    title: 'Environment Conventions, Ramsar Sites & Tiger Reserves Compendium',
    description: 'UNFCCC COP decisions, Paris Agreement, Montreal Protocol, Ramsar wetlands directory and biodiversity hotspots in India.',
    type: 'Reference Documents',
    examCategory: 'BPSC & UPSC',
    language: 'English',
    editionYear: '2026',
    size: '3.9 MB',
    url: '/sample-resources/environment-conventions-compendium.pdf'
  }
];

export default function UsefulDocumentsPortal() {
  const { t } = useTranslation();
  const [pageData, setPageData] = useState<CustomPage | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);

  // In-site Preview Modal State
  const [activePreviewModal, setActivePreviewModal] = useState<{ title: string; url: string } | null>(null);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  const loadPage = useCallback(async () => {
    try {
      let data = await db.getCustomPageBySlug('downloads/useful-documents');
      if (!data) {
        data = await db.getCustomPageBySlug('useful-documents');
      }
      if (data) {
        setPageData(data);
      }
    } catch (err) {
      console.error('Error loading useful-documents page:', err);
    }
  }, []);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  const resolveUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    if (url.startsWith('/api/')) return `${BACKEND_URL}${url}`;
    return `${BACKEND_URL}/${url.replace(/^\//, '')}`;
  };

  // Combine CMS download items with initial fallback items
  const downloadItems: DownloadItem[] = useMemo(() => {
    if (pageData?.downloadItems && pageData.downloadItems.length > 0) {
      return pageData.downloadItems;
    }
    return INITIAL_USEFUL_DOCUMENTS;
  }, [pageData]);

  const dynamicTypes = useMemo(() => {
    return Array.from(new Set(
      downloadItems
        .map(i => i.type || i.examCategory)
        .filter((t): t is string => Boolean(t && t.trim()))
    )).sort();
  }, [downloadItems]);

  const filteredItems = useMemo(() => {
    return downloadItems.filter(item => {
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
          (item.description || '').toLowerCase().includes(q) ||
          (item.type || '').toLowerCase().includes(q) ||
          (item.examCategory || '').toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [downloadItems, selectedLanguage, selectedType, searchQuery]);

  return (
    <div className="min-h-screen bg-[var(--bg-color)] text-[var(--text-color)] font-body py-10 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-semibold">
          <Link href="/" className="hover:text-rose-500 flex items-center gap-1 transition-colors">
            <Home className="w-3.5 h-3.5" />
            <span>{t('nav.home', 'Home')}</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link href="/downloads" className="hover:text-rose-500 transition-colors">
            <span>{t('nav.downloads', 'Downloads Hub')}</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-bold text-[var(--text-color)]">{t('downloads.usefulDocumentsTitle', 'Useful Documents')}</span>
        </div>

        {/* ── Page Top Image Banner (Hero Banner) ── */}
        {pageData?.bannerUrl ? (
          <div className="relative w-full h-52 sm:h-64 md:h-80 rounded-3xl overflow-hidden border border-[var(--card-border)] shadow-md bg-slate-950">
            <img
              src={resolveUrl(pageData.bannerUrl)}
              alt={pageData.title || 'Useful Documents'}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent flex flex-col justify-end p-6 sm:p-8">
              <span className="text-[11px] font-black text-rose-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>Useful Documents &amp; Reference Vault</span>
              </span>
              <h1 className="text-2xl sm:text-4xl font-heading font-black text-white tracking-tight">
                {pageData.title || t('downloads.usefulDocumentsTitle', 'Useful Documents')}
              </h1>
              <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-2xl line-clamp-2 font-medium">
                {pageData.metaDescription || t('downloads.usefulDocumentsDesc', 'Consolidated reference documents, notes, timelines, and essential study material.')}
              </p>
            </div>
          </div>
        ) : (
          /* Elegant Card Header Banner */
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold">
                <FileText className="w-3.5 h-3.5" />
                <span>Reference &amp; Study Vault</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-heading font-black text-[var(--text-color)] tracking-tight">
                {t('downloads.usefulDocumentsTitle', 'Useful Documents')}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm max-w-2xl font-medium">
                {pageData?.metaDescription || t('downloads.usefulDocumentsDesc', 'Consolidated reference documents, notes, timelines, and essential study material.')}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <ShareButton
                title={pageData?.title || t('downloads.usefulDocumentsTitle', 'Useful Documents')}
                text={pageData?.metaDescription || t('downloads.usefulDocumentsDesc', 'Consolidated reference documents, notes, timelines, and essential study material.')}
                url="/downloads/useful-documents"
                variant="compact"
              />
              <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 px-4 py-2.5 rounded-2xl shrink-0">
                <FileText className="w-5 h-5 text-rose-500" />
                <div>
                  <span className="text-xs font-black text-[var(--text-color)] block">{downloadItems.length} Useful Documents</span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Essential Resource Vault</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search & Dynamic Filter Control Panel */}
        <div className="p-5 sm:p-6 bg-[var(--card-bg)] rounded-3xl border border-[var(--card-border)] shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={t('downloads.searchPlaceholder', 'Search documents, reference notes, guides...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-[var(--bg-color)] border border-[var(--card-border)] rounded-2xl outline-none text-[var(--text-color)] font-medium focus:border-rose-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            
            {/* Language Selector */}
            <div className="flex items-center gap-1 bg-[var(--bg-color)] p-1 rounded-2xl border border-[var(--card-border)]">
              {(['ALL', 'English', 'Hindi'] as const).map(lang => (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    selectedLanguage === lang 
                      ? 'bg-rose-600 text-white shadow-xs' 
                      : 'text-slate-600 dark:text-slate-300 hover:text-rose-500'
                  }`}
                >
                  {lang === 'ALL' ? 'All Languages' : lang}
                </button>
              ))}
            </div>

            {/* Type Dropdown */}
            {dynamicTypes.length > 0 && (
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-2.5 text-xs bg-[var(--bg-color)] border border-[var(--card-border)] rounded-2xl outline-none text-[var(--text-color)] font-bold cursor-pointer"
              >
                <option value="ALL">All Categories ({dynamicTypes.length})</option>
                {dynamicTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            )}

          </div>
        </div>

        {/* Useful Documents Cards Grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl max-w-md mx-auto space-y-4 shadow-sm p-8">
            <FileText className="w-12 h-12 text-slate-400 mx-auto opacity-50" />
            <h3 className="font-heading font-black text-base text-[var(--text-color)]">No Useful Documents Found</h3>
            <p className="text-xs text-slate-500">
              {searchQuery ? `No files matching "${searchQuery}". Try a different keyword.` : 'New study documents will be available here soon.'}
            </p>
            {(searchQuery || selectedLanguage !== 'ALL' || selectedType !== 'ALL') && (
              <button
                onClick={() => { setSearchQuery(''); setSelectedLanguage('ALL'); setSelectedType('ALL'); }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map(item => {
              const resolvedFileUrl = resolveUrl(item.url);
              return (
                <div
                  key={item.id}
                  className="bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-rose-500/60 rounded-3xl p-6 space-y-4 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
                >
                  <div className="space-y-3">
                    
                    {/* Header Tags */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[10px] font-black uppercase text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1 shrink-0">
                        <FileText className="w-3 h-3 shrink-0" />
                        <span>{item.type || item.examCategory || 'Document'}</span>
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                        {item.size && (
                          <span className="text-[10px] font-mono font-bold text-slate-400">
                            {item.size}
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/[0.06] px-2 py-0.5 rounded">
                          {item.language || 'English'}
                        </span>
                      </div>
                    </div>

                    <h3 className="font-heading font-extrabold text-base text-[var(--text-color)] group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors leading-snug">
                      {item.title}
                    </h3>

                    {item.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-4 border-t border-[var(--card-border)]">
                    {resolvedFileUrl && (
                      <button
                        onClick={() => setActivePreviewModal({ title: item.title, url: resolvedFileUrl })}
                        className="flex-1 py-2.5 px-3 bg-[var(--bg-color)] hover:bg-rose-50 dark:hover:bg-rose-500/10 text-[var(--text-color)] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-[var(--card-border)]"
                      >
                        <Eye className="w-3.5 h-3.5 text-rose-500" />
                        <span>{t('downloads.viewPDF', 'Quick Preview')}</span>
                      </button>
                    )}

                    {resolvedFileUrl ? (
                      <a
                        href={resolvedFileUrl}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all text-center"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{t('downloads.downloadPDF', 'Download')}</span>
                      </a>
                    ) : (
                      <button
                        onClick={() => alert('Document file will be available shortly.')}
                        className="flex-1 py-2.5 px-3 bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-not-allowed"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Coming Soon</span>
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* POPUP MODAL: PREVIEW PDF READER */}
        {activePreviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-5xl bg-[var(--card-bg)] rounded-3xl border border-[var(--card-border)] shadow-2xl flex flex-col h-[90vh] overflow-hidden">
              <div className="p-4 sm:p-5 bg-[var(--bg-color)] border-b border-[var(--card-border)] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 max-w-xl">
                  <FileText className="w-5 h-5 text-rose-500 shrink-0" />
                  <h3 className="font-heading font-black text-sm sm:text-base text-[var(--text-color)] truncate">
                    Preview: {activePreviewModal.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={resolveUrl(activePreviewModal.url)}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{t('downloads.download', 'Download')}</span>
                  </a>
                  <button
                    onClick={() => setActivePreviewModal(null)}
                    className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="flex-1 bg-slate-900 p-2 overflow-hidden">
                <iframe
                  src={resolveUrl(activePreviewModal.url)}
                  className="w-full h-full rounded-2xl border-0"
                  title={`Preview - ${activePreviewModal.title}`}
                />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
