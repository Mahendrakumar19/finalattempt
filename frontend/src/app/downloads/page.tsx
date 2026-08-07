'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Download, FileText, ArrowRight, CheckCircle, Search, BookOpen, Eye, File, Film, Archive, Layers } from 'lucide-react';
import { db, CustomPage } from '@/services/db';

interface ResourceItem {
  id: string;
  title: string;
  size?: string;
  type: string;
  downloadCount: number;
  url: string;
  category?: string;
  subcategory?: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

function getFileIcon(type: string) {
  const t = (type || '').toUpperCase();
  if (t === 'PDF') return { icon: FileText, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/20' };
  if (['DOC', 'DOCX'].includes(t)) return { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/20' };
  if (['PPT', 'PPTX'].includes(t)) return { icon: File, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/20' };
  if (['XLS', 'XLSX'].includes(t)) return { icon: File, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950/20' };
  if (['MP4', 'WEBM', 'OGG'].includes(t)) return { icon: Film, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/20' };
  if (t === 'ZIP') return { icon: Archive, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/20' };
  return { icon: FileText, color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-900/40' };
}

export default function DedicatedDownloadsPage() {
  const [downloadStates, setDownloadStates] = useState<Record<string, boolean>>({});
  const [searchQuery,    setSearchQuery]    = useState('');
  const [resourcesList,  setResourcesList]  = useState<ResourceItem[]>([]);
  const [activeSection,  setActiveSection]  = useState<string>('All');
  const [previewItem,    setPreviewItem]    = useState<ResourceItem | null>(null);
  const [loading,        setLoading]        = useState(true);

  const [customDownloadPages, setCustomDownloadPages] = useState<CustomPage[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [res, pages] = await Promise.all([
          db.getResources(),
          db.getCustomPages(true)
        ]);
        if (res && res.length > 0) setResourcesList(res);
        if (pages && pages.length > 0) {
          const downloadPages = pages.filter(p => p.slug.startsWith('downloads/') || (p.downloadItems && p.downloadItems.length > 0));
          setCustomDownloadPages(downloadPages);
        }
      } catch (err) {
        console.error('Failed loading downloads hub:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const resolveUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/api/')) return `${BACKEND_URL}${url}`;
    return `${BACKEND_URL}/${url.replace(/^\//, '')}`;
  };

  const handleDownload = (res: ResourceItem) => {
    setDownloadStates(prev => ({ ...prev, [res.id]: true }));
    const url = resolveUrl(res.url);
    const a = document.createElement('a');
    a.href = url;
    const ext = res.url ? res.url.split('.').pop()?.split('?')[0] : '';
    a.download = ext ? `${res.title}.${ext}` : res.title || 'download';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => {
      setDownloadStates(prev => ({ ...prev, [res.id]: false }));
    }, 3000);
  };

  // ── Dynamic categories from real data ────────────────────────────────────
  const dynamicCategories: string[] = ['All'];
  resourcesList.forEach(res => {
    const cat = res.category;
    if (cat && cat !== 'General Downloads' && !dynamicCategories.includes(cat)) {
      dynamicCategories.push(cat);
    }
  });
  if (customDownloadPages.length > 0 && !dynamicCategories.includes('Custom Download Packages')) {
    dynamicCategories.push('Custom Download Packages');
  }

  const filteredResources = resourcesList.filter(res => {
    const title       = res.title    || '';
    const category    = res.category || '';
    const subcategory = res.subcategory || '';
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeSection === 'All') return matchesSearch;
    if (activeSection === 'NCERT Books')   return matchesSearch && (category.toLowerCase().includes('ncert') || subcategory.toLowerCase().includes('ncert') || title.toLowerCase().includes('ncert'));
    if (activeSection === 'Official PYQs') return matchesSearch && (category.toLowerCase().includes('pyq')  || subcategory.toLowerCase().includes('pyq')  || title.toLowerCase().includes('pyq')  || category === 'PYQ Solutions');
    return matchesSearch && category === activeSection;
  });

  const groupedResources: Record<string, ResourceItem[]> = {};
  filteredResources.forEach(res => {
    // Use actual category; fall back to empty string so no heading shows for uncategorised
    const cat = res.category && res.category !== 'General Downloads' ? res.category : '';
    if (!groupedResources[cat]) groupedResources[cat] = [];
    groupedResources[cat].push(res);
  });

  return (
    <div className="min-h-screen bg-[var(--bg-color)] py-12 px-4 sm:px-6 lg:px-8 space-y-12">
      
      {/* Hero Banner Header */}
      <div className="max-w-7xl mx-auto space-y-4 text-center">
        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3.5 py-1.5 rounded-xl uppercase tracking-widest inline-block">
          Downloads
        </span>
        <h1 className="text-4xl sm:text-5xl font-heading font-black text-[var(--text-color)] tracking-tight">
          Downloads Hub
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-3xl mx-auto leading-relaxed">
          Download question papers, NCERT books, notes, and study material.
        </p>
      </div>

      {/* Featured Download Vaults & NCERT Portals (DYNAMIC FEATURED ROW) */}
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-500" />
          <h3 className="font-heading font-black text-[var(--text-color)] text-base uppercase tracking-wider">
            Featured Download Vaults & NCERT Portals
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/downloads/pyq"
            className="group p-5 bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/30 rounded-3xl transition-all shadow-xs hover:border-amber-500 hover:shadow-md flex flex-col justify-between space-y-3"
          >
            <div className="space-y-1.5">
              <span className="text-[9px] font-black uppercase text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/20 w-fit block">
                OFFICIAL QUESTION BANK
              </span>
              <h4 className="font-heading font-extrabold text-base text-[var(--text-color)] group-hover:text-amber-500 transition-colors">
                📜 Official PYQs Vault (71st - 60th BPSC)
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Structured Question Papers, verified Answer Keys & detailed PDF Solutions.
              </p>
            </div>
            <div className="pt-2 border-t border-amber-500/20 flex items-center justify-between">
              <span className="text-xs font-black text-amber-600 dark:text-amber-400">Open PYQ Vault &rarr;</span>
              <ArrowRight className="w-4 h-4 text-amber-500 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>

          <Link
            href="/downloads/ncert"
            className="group p-5 bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-amber-500/50 rounded-3xl transition-all shadow-xs flex flex-col justify-between space-y-3"
          >
            <div className="space-y-1.5">
              <span className="text-[9px] font-black uppercase text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-md border border-blue-500/20 w-fit block">
                CORE SYLLABUS TEXTBOOKS
              </span>
              <h4 className="font-heading font-extrabold text-base text-[var(--text-color)] group-hover:text-amber-500 transition-colors">
                📚 NCERT Textbooks & Study Portal
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Class 6-12 NCERT books & syllabus worksheets for Prelims & Mains.
              </p>
            </div>
            <div className="pt-2 border-t border-[var(--card-border)] flex items-center justify-between">
              <span className="text-xs font-black text-slate-700 dark:text-slate-200 group-hover:text-amber-500 transition-colors">Explore NCERTs &rarr;</span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>

          <Link
            href="/downloads"
            className="group p-5 bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-amber-500/50 rounded-3xl transition-all shadow-xs flex flex-col justify-between space-y-3"
          >
            <div className="space-y-1.5">
              <span className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20 w-fit block">
                FREE STUDY REPOSITORY
              </span>
              <h4 className="font-heading font-extrabold text-base text-[var(--text-color)] group-hover:text-amber-500 transition-colors">
                🗺️ Core Notes & Study Worksheets
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                State Economic Survey, Budget breakdowns & Subject Worksheets.
              </p>
            </div>
            <div className="pt-2 border-t border-[var(--card-border)] flex items-center justify-between">
              <span className="text-xs font-black text-slate-700 dark:text-slate-200 group-hover:text-amber-500 transition-colors">Explore All Downloads &rarr;</span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        </div>
      </div>

      {/* Main Grid: Downloads Catalog & Admin Custom Portals */}
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Search + inline category filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={`Search in ${activeSection === 'All' ? 'all downloads' : activeSection}…`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 text-xs bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-[var(--text-color)] shadow-xs font-medium"
            />
          </div>

          {/* Dynamic category filter — only categories that exist in data */}
          {dynamicCategories.length > 1 && (
            <select
              value={activeSection}
              onChange={e => setActiveSection(e.target.value)}
              className="px-4 py-3.5 text-xs font-bold bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl outline-none text-[var(--text-color)] cursor-pointer shadow-xs shrink-0"
            >
              {dynamicCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          )}
        </div>


        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : activeSection === 'Custom Download Packages' ? (
          /* Dedicated view for custom download pages created via Admin CMS */
          <div className="space-y-4">
            <h3 className="font-heading font-black text-slate-900 dark:text-white text-base uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-500" />
              <span>Custom Created Download Portals ({customDownloadPages.length})</span>
            </h3>
            {customDownloadPages.length === 0 ? (
              <div className="p-10 text-center text-slate-400 font-semibold text-xs bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl">
                No custom download portals created yet. Admin can add new sections in Admin -&gt; Downloads Hub.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {customDownloadPages.map((pg) => {
                  const cleanSlug = pg.slug.startsWith('downloads/') ? pg.slug : `downloads/${pg.slug}`;
                  return (
                    <Link
                      key={pg.id}
                      href={`/${cleanSlug}`}
                      className="group p-5 bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-amber-500/60 rounded-3xl transition-all shadow-xs flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2">
                        <span className="text-[9px] font-black uppercase text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/20 w-fit block">
                          ADMIN CREATED PORTAL
                        </span>
                        <h4 className="font-heading font-extrabold text-base text-[var(--text-color)] group-hover:text-amber-500 transition-colors">
                          {pg.title}
                        </h4>
                        {pg.metaDescription && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                            {pg.metaDescription}
                          </p>
                        )}
                      </div>
                      <div className="pt-3 border-t border-[var(--card-border)] flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-slate-400">
                          {pg.downloadItems?.length || 0} Files Included
                        </span>
                        <span className="text-xs font-black text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                          Open Portal &rarr;
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ) : filteredResources.length > 0 ? (
          <div className="space-y-8">
            {Object.keys(groupedResources).map((catName) => (
              <div key={catName} className="space-y-3">
                {/* Show category heading only when browsing All and category is non-empty */}
                {activeSection === 'All' && catName && (
                  <h3 className="font-heading font-black text-slate-850 dark:text-slate-200 text-sm uppercase tracking-wider flex items-center gap-2 pl-1">
                    <Layers className="w-4 h-4 text-amber-500" />
                    <span>{catName}</span>
                  </h3>
                )}
                <div className="bg-[var(--card-bg)] rounded-3xl border border-[var(--card-border)] shadow-xs divide-y divide-[var(--card-border)] overflow-hidden">
                  {groupedResources[catName].map((res) => {
                    const { icon: Icon, color, bg } = getFileIcon(res.type);

                    return (
                      <div key={res.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--card-bg)] hover:bg-amber-500/5 transition-colors border-b border-[var(--card-border)] last:border-b-0">
                        <div className="flex gap-4 items-start min-w-0">
                          <div className={`w-11 h-11 rounded-2xl ${bg} ${color} flex items-center justify-center shrink-0`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="space-y-1 min-w-0">
                            <h4 className="font-heading font-extrabold text-sm text-[var(--text-color)] leading-snug break-words">
                              {res.title}
                            </h4>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded-md">
                                {res.type} {res.size ? `• ${res.size}` : ''}
                              </span>
                              {res.subcategory && (
                                <span className="text-[9px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[var(--text-color)] rounded-md font-bold uppercase">
                                  {res.subcategory}
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400 font-semibold">
                                • {res.downloadCount + (downloadStates[res.id] ? 1 : 0)} downloads
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0">
                          <a
                            href={resolveUrl(res.url)}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs shadow-xs hover:scale-[1.02] transition-all cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View</span>
                          </a>

                          {downloadStates[res.id] ? (
                            <span className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-emerald-600 text-xs font-bold bg-emerald-500/10 px-3.5 py-2 rounded-xl border border-emerald-500/20">
                              <CheckCircle className="w-4 h-4" />
                              <span>Downloading…</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => handleDownload(res)}
                              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[var(--card-bg)] hover:bg-amber-500/10 text-[var(--text-color)] font-bold rounded-xl text-xs border border-[var(--card-border)] transition-all cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 font-semibold text-xs bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl">
            No items found in section &quot;{activeSection}&quot; matching query.
          </div>
        )}

        {/* Custom Created Download Portals Section */}
        {customDownloadPages.length > 0 && activeSection !== 'Custom Download Packages' && (
          <div className="space-y-4 pt-6 border-t border-[var(--card-border)]">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-amber-500" />
              <h3 className="font-heading font-black text-[var(--text-color)] text-sm uppercase tracking-wider">
                Admin Created Download Sections & Portals
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {customDownloadPages.map((pg) => {
                const cleanSlug = pg.slug.startsWith('downloads/') ? pg.slug : `downloads/${pg.slug}`;
                return (
                  <Link
                    key={pg.id}
                    href={`/${cleanSlug}`}
                    className="group p-4.5 bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-amber-500/50 rounded-2xl transition-all shadow-xs flex items-center justify-between"
                  >
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-xs text-[var(--text-color)] group-hover:text-amber-500 transition-colors">
                        📁 {pg.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-medium block">
                        {pg.downloadItems?.length || 0} Files Included
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
