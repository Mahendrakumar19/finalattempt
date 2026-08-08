'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Download, FileText, ArrowRight, CheckCircle, Search,
  BookOpen, Eye, File, Film, Archive, Layers, Filter, Folder, Sparkles
} from 'lucide-react';
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
  if (t === 'PDF') return { icon: FileText, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/30' };
  if (['DOC', 'DOCX'].includes(t)) return { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30' };
  if (['PPT', 'PPTX'].includes(t)) return { icon: File, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/30' };
  if (['XLS', 'XLSX'].includes(t)) return { icon: File, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950/30' };
  if (['MP4', 'WEBM', 'OGG'].includes(t)) return { icon: Film, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/30' };
  if (t === 'ZIP') return { icon: Archive, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' };
  return { icon: FileText, color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-900/40' };
}

export default function DedicatedDownloadsPage() {
  const [downloadStates, setDownloadStates] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [resourcesList, setResourcesList] = useState<ResourceItem[]>([]);
  const [activeSection, setActiveSection] = useState<string>('All');
  const [loading, setLoading] = useState(true);
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
          const downloadPages = pages.filter(
            (p: any) => p.showLocation === 'DOWNLOADS_HUB' || p.slug.startsWith('downloads/') || (p.downloadItems && p.downloadItems.length > 0)
          );
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

  // Build category tabs from live data + fixed vaults
  const categoryTabs = useMemo(() => {
    const cats = new Set<string>();
    resourcesList.forEach(res => {
      if (res.category && res.category !== 'General Downloads') cats.add(res.category);
    });
    const tabs = ['All', ...Array.from(cats)];
    if (customDownloadPages.length > 0) tabs.push('Portals');
    return tabs;
  }, [resourcesList, customDownloadPages]);

  const filteredResources = useMemo(() => {
    return resourcesList.filter(res => {
      const title = res.title || '';
      const category = res.category || '';
      const subcategory = res.subcategory || '';
      const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());
      if (activeSection === 'All') return matchesSearch;
      if (activeSection === 'Portals') return false;
      return matchesSearch && category === activeSection;
    });
  }, [resourcesList, activeSection, searchQuery]);

  const groupedResources = useMemo(() => {
    const g: Record<string, ResourceItem[]> = {};
    filteredResources.forEach(res => {
      const cat = res.category && res.category !== 'General Downloads' ? res.category : '';
      if (!g[cat]) g[cat] = [];
      g[cat].push(res);
    });
    return g;
  }, [filteredResources]);

  return (
    <div className="min-h-screen bg-[var(--bg-color)]">

      {/* ── Hero Search Banner ─────────────────────────────────────── */}
      <div className="border-b border-[var(--card-border)]" style={{ background: 'var(--card-bg)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-5">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
              Resource Library
            </span>
            <h1 className="text-2xl sm:text-3xl font-heading font-black text-[var(--text-color)] tracking-tight">
              Study Material Downloads
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl">
              Free books, question papers, notes &amp; NCERT material for BPSC preparation.
            </p>
          </div>

          {/* Search */}
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              id="downloads-search"
              placeholder="Search books, notes, PYQs…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 text-sm bg-[var(--bg-color)] border border-[var(--card-border)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-[var(--text-color)] font-medium shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ── Featured Vaults Row ───────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/downloads/pyq"
            className="group p-5 bg-gradient-to-br from-amber-500/12 via-amber-500/5 to-transparent border border-amber-500/30 rounded-2xl transition-all hover:border-amber-500 hover:shadow-lg flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-500">
              <FileText className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider block">Official Question Bank</span>
              <h4 className="font-heading font-extrabold text-sm text-[var(--text-color)] group-hover:text-amber-500 transition-colors leading-snug">
                PYQ
              </h4>
            </div>
            <ArrowRight className="w-4 h-4 text-amber-500 group-hover:translate-x-1 transition-transform ml-auto shrink-0" />
          </Link>

          <Link
            href="/downloads/ncert"
            className="group p-5 bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-blue-500/40 rounded-2xl transition-all hover:shadow-lg flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 text-blue-500">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider block">Core Syllabus Books</span>
              <h4 className="font-heading font-extrabold text-sm text-[var(--text-color)] group-hover:text-amber-500 transition-colors leading-snug">
                NCERT
              </h4>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-1 transition-all ml-auto shrink-0" />
          </Link>
        </div>

        {/* ── Category Pill Tabs ────────────────────────────────────── */}
        {categoryTabs.length > 1 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            {categoryTabs.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => { setActiveSection(cat); setSearchQuery(''); }}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${activeSection === cat
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-[var(--card-bg)] border border-[var(--card-border)] text-slate-600 dark:text-slate-300 hover:border-amber-500/40 hover:text-amber-600 dark:hover:text-amber-400'
                  }`}
              >
                {cat === 'All' ? 'All Downloads' : cat}
              </button>
            ))}
          </div>
        )}

        {/* ── Content Area ─────────────────────────────────────────── */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : activeSection === 'Portals' ? (
          /* Custom Admin Portals view */
          <div className="space-y-4">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Admin Created Portals</p>
            {customDownloadPages.length === 0 ? (
              <div className="p-10 text-center text-slate-400 font-semibold text-xs bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl">
                No download portals created yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {customDownloadPages.map((pg: any) => {
                  const cleanSlug = pg.slug.startsWith('downloads/') ? pg.slug : `downloads/${pg.slug}`;
                  return (
                    <Link
                      key={pg.id}
                      href={`/${cleanSlug}`}
                      className="group p-5 bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-amber-500/50 rounded-2xl transition-all flex items-center gap-4"
                    >
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 text-amber-500">
                        <Folder className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-sm text-[var(--text-color)] group-hover:text-amber-500 transition-colors truncate">{pg.title}</h4>
                        <span className="text-[10px] text-slate-400 font-medium">{pg.downloadItems?.length || 0} files</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-1 transition-all shrink-0" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-semibold text-sm bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl space-y-2">
            <Layers className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
            <p>No downloads found{searchQuery ? ` for "${searchQuery}"` : ` in "${activeSection}"`}.</p>
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-xs text-amber-600 dark:text-amber-400 font-bold hover:underline cursor-pointer">
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {Object.keys(groupedResources).map(catName => (
              <div key={catName} className="space-y-3">
                {activeSection === 'All' && catName && (
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-500" />
                    <h3 className="font-heading font-extrabold text-sm text-[var(--text-color)] uppercase tracking-wider">{catName}</h3>
                  </div>
                )}


              </div>
            ))}

            {/* Inline custom portals when browsing All */}
            {activeSection === 'All' && customDownloadPages.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-[var(--card-border)]">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Download Portals</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {customDownloadPages.map((pg: any) => {
                    const cleanSlug = pg.slug.startsWith('downloads/') ? pg.slug : `downloads/${pg.slug}`;
                    return (
                      <Link
                        key={pg.id}
                        href={`/${cleanSlug}`}
                        className="group p-4 bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-amber-500/50 rounded-2xl transition-all flex items-center gap-3"
                      >
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 text-amber-500">
                          <Folder className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-xs text-[var(--text-color)] group-hover:text-amber-500 transition-colors truncate">{pg.title}</h4>
                          <span className="text-[10px] text-slate-400">{pg.downloadItems?.length || 0} files</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-1 transition-all shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
