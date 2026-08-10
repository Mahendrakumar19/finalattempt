'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, FileText, Download, BookOpen, Eye, Home, ChevronRight, X, Layers } from 'lucide-react';
import { db, CustomPage, DownloadItem } from '@/services/db';

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
  const [loading, setLoading] = useState(true);

  // Active Category Vault Modal state (Exact NCERT System)
  const [activeCategoryModal, setActiveCategoryModal] = useState<string | null>(null);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

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
  }, [loadPage]);

  const resolveUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/api/')) return `${BACKEND_URL}${url}`;
    return `${BACKEND_URL}/${url.replace(/^\//, '')}`;
  };

  const downloadItems: DownloadItem[] = pageData?.downloadItems || [];

  // Default Categories if page is fa-publications
  let defaultCategories: string[] = [];
  if (pageSlug === 'fa-publications') {
    defaultCategories = ['BPSC', 'Arunachal PCS (APPSC)', 'Arunachal Pradesh Staff Selection Board (APSSB)'];
  }

  // Group items into Subject/Category Vaults (Exact NCERT System)
  const uniqueTypes = Array.from(new Set([...defaultCategories, ...downloadItems.map(i => i.type || 'General Notes')])).sort();

  const categoryVaults = uniqueTypes.map(type => {
    const items = downloadItems.filter(i => (i.type || 'General Notes').toLowerCase() === type.toLowerCase());
    return {
      category: type,
      items
    };
  });

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

      {/* Page Header (NCERT System) */}
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
            <span className="text-xs font-black text-slate-900 dark:text-white block">{downloadItems.length} Materials Available</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{uniqueTypes.length} Material Vaults</span>
          </div>
        </div>
      </div>

      {/* Search & Category Filters Bar */}
      <div className="p-6 bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-white/[0.08] shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by booklet name or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/[0.06] rounded-2xl outline-none text-slate-900 dark:text-white font-medium"
          />
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto items-center">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-250 dark:border-white/[0.06] rounded-2xl outline-none text-slate-800 dark:text-white font-bold cursor-pointer"
          >
            <option value="ALL">All Categories ({uniqueTypes.length})</option>
            {uniqueTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Overview & Content Section (if present) */}
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

      {/* CATEGORY VAULT CARDS GRID (COLORFUL BOXES EXACT NCERT STYLE) */}
      {loading ? (
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

            return (
              <div
                key={category}
                onClick={() => setActiveCategoryModal(category)}
                className={`group bg-gradient-to-br ${theme.bg} bg-white dark:bg-slate-900 border ${theme.border} p-6 rounded-3xl space-y-5 shadow-xs hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden group-hover:-translate-y-1`}
              >
                <div className="space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-2xl ${theme.iconBg} flex items-center justify-center font-black text-sm shadow-md group-hover:scale-110 transition-transform`}>
                      <BookOpen className="w-6 h-6" />
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
      )}

      {/* POPUP MODAL: EXACT NCERT SYSTEM FOR CATEGORY MATERIALS */}
      {activeCategoryModal && (() => {
        const vaultItems = downloadItems.filter(i => (i.type || 'General Notes').toLowerCase() === activeCategoryModal.toLowerCase());

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-6xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
              
              {/* Modal Header */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-slate-100 dark:border-white/[0.08] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs shrink-0 shadow-md">
                    <BookOpen className="w-5 h-5" />
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

              {/* Items Grid Scrollable Content */}
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

                        {/* View & Download Buttons */}
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

    </div>
  );
}
