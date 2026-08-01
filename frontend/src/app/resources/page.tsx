'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Download, FileText, ArrowRight, CheckCircle, Search, BookOpen, ExternalLink, Eye, X, File, Film, Archive, Layers } from 'lucide-react';
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

const CATEGORIES = [
  'All',
  'NCERT Books',
  'Official PYQs',
  'Syllabus',
  'Prelims',
  'Mains',
  'Infographics',
  'Rapid Revision Material',
  'Value Added Materials',
  'FA Publications'
];

function getFileIcon(type: string) {
  const t = (type || '').toUpperCase();
  if (t === 'PDF')  return { icon: FileText, color: 'text-red-500',    bg: 'bg-red-50 dark:bg-red-950/20' };
  if (['DOC','DOCX'].includes(t)) return { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/20' };
  if (['PPT','PPTX'].includes(t)) return { icon: File,     color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/20' };
  if (['XLS','XLSX'].includes(t)) return { icon: File,     color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950/20' };
  if (['MP4','WEBM','OGG'].includes(t)) return { icon: Film, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/20' };
  if (t === 'ZIP')  return { icon: Archive, color: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-950/20' };
  return { icon: FileText, color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-900/40' };
}



export default function Resources() {
  const [downloadStates, setDownloadStates] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [resourcesList, setResourcesList] = useState<ResourceItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [previewItem, setPreviewItem] = useState<ResourceItem | null>(null);
  const [loading, setLoading] = useState(true);

  const [customDownloadPages, setCustomDownloadPages] = useState<CustomPage[]>([]);

  useEffect(() => {
    const loadResources = async () => {
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
        console.error('Failed loading resources:', err);
      } finally {
        setLoading(false);
      }
    };
    loadResources();
  }, []);

  const handleDownload = (res: ResourceItem) => {
    setDownloadStates(prev => ({ ...prev, [res.id]: true }));
    const url = resolveUrl(res.url);
    const a = document.createElement('a');
    a.href = url;
    // Use original title as download name (keep extension from URL)
    const ext = res.url ? res.url.split('.').pop()?.split('?')[0] : '';
    a.download = ext ? `${res.title}.${ext}` : res.title || 'resource';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => {
      setDownloadStates(prev => ({ ...prev, [res.id]: false }));
    }, 3000);
  };

  const resolveUrl = (url: string) => {
    if (!url) return '';
    // Already a full URL
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    // /api/ prefixed path
    if (url.startsWith('/api/')) return `${BACKEND_URL}${url}`;
    // Relative path like uploads/documents/file.pdf
    return `${BACKEND_URL}/${url.replace(/^\//, '')}`;
  };

  // Filter resources based on selected category & search query
  const filteredResources = resourcesList.filter(res => {
    const title = res.title || '';
    const category = res.category || '';
    const subcategory = res.subcategory || '';
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeCategory === 'All') return matchesSearch;
    if (activeCategory === 'NCERT Books') {
      return matchesSearch && (category.toLowerCase().includes('ncert') || subcategory.toLowerCase().includes('ncert') || title.toLowerCase().includes('ncert'));
    }
    if (activeCategory === 'Official PYQs') {
      return matchesSearch && (category.toLowerCase().includes('pyq') || subcategory.toLowerCase().includes('pyq') || title.toLowerCase().includes('pyq') || category === 'PYQ Solutions');
    }
    return matchesSearch && category === activeCategory;
  });

  // Group filtered resources by category for subheaders if 'All' is selected
  const groupedResources: Record<string, ResourceItem[]> = {};
  filteredResources.forEach(res => {
    const cat = res.category || 'Other Notes';
    if (!groupedResources[cat]) {
      groupedResources[cat] = [];
    }
    groupedResources[cat].push(res);
  });

  return (
    <div className="min-h-screen bg-[var(--bg-color)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">

        {/* Header */}
        <div className="space-y-4 text-center max-w-3xl mx-auto">
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl uppercase tracking-widest inline-block">
            Study Portal
          </span>
          <h1 className="text-4xl font-heading font-extrabold text-[var(--text-color)] tracking-tight">
            Aspirants Resources & Study Materials
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Access BPSC and UPSC syllabus-aligned premium study notes, budget breakdowns, infographics, and previous year solution booklets absolutely free.
          </p>
        </div>

        {/* Categories Tabs Selector */}
        <div className="flex flex-wrap justify-center gap-2 max-w-5xl mx-auto border-b border-[var(--card-border)] pb-6">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeCategory === cat
                  ? 'bg-amber-500 text-slate-950 shadow-md scale-[1.02]'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-[var(--card-bg)] border border-[var(--card-border)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid: Main Directory & Special Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Resources Listing */}
          <div className="lg:col-span-8 space-y-6">
            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={`Search resources in ${activeCategory === 'All' ? 'all categories' : activeCategory}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3.5 text-xs bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-[var(--text-color)] shadow-3xs"
              />
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl animate-pulse" />
                ))}
              </div>
            ) : filteredResources.length > 0 ? (
              <div className="space-y-8">
                {Object.keys(groupedResources).map((catName) => (
                  <div key={catName} className="space-y-3">
                    {activeCategory === 'All' && (
                      <h3 className="font-heading font-black text-slate-850 dark:text-slate-200 text-sm uppercase tracking-wider flex items-center gap-2 pl-1">
                        <Layers className="w-4 h-4 text-amber-500" />
                        <span>{catName}</span>
                      </h3>
                    )}
                    <div className="bg-[var(--card-bg)] rounded-3xl border border-[var(--card-border)] shadow-3xs divide-y divide-[var(--card-border)] overflow-hidden">
                      {groupedResources[catName].map((res) => {
                        const { icon: Icon, color, bg } = getFileIcon(res.type);

                        return (
                          <div key={res.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--card-bg)] hover:bg-amber-500/5 transition-colors border-b border-[var(--card-border)] last:border-b-0">
                            <div className="flex gap-4 items-start min-w-0">
                              <div className={`w-10 h-10 rounded-xl ${bg} ${color} flex items-center justify-center shrink-0`}>
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
                                    <span className="text-[8px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[var(--text-color)] rounded-md font-bold uppercase">
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
                              {/* Primary View / Open in New Tab Button */}
                              <a
                                href={resolveUrl(res.url)}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs shadow-sm hover:scale-[1.02] transition-all cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                                <span>View File</span>
                              </a>

                              {/* Download Button */}
                              {downloadStates[res.id] ? (
                                <span className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-emerald-600 text-xs font-bold bg-emerald-500/10 px-3.5 py-2 rounded-xl border border-emerald-500/20">
                                  <CheckCircle className="w-4 h-4" />
                                  <span>Downloading…</span>
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleDownload(res)}
                                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[var(--card-bg)] hover:bg-amber-500/10 text-[var(--text-color)] font-bold rounded-xl text-xs border border-[var(--card-border)] transition-all cursor-pointer"
                                  title="Download File"
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
                No items found in this section matching your filters.
              </div>
            )}
          </div>

          {/* Right Column: Special Subpages & Dynamic Download Portals */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Quick Portals Navigation (PYQs, NCERT, Bihar Special) */}
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-6 rounded-3xl space-y-4 shadow-3xs">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-500" />
                <h3 className="font-heading font-black text-[var(--text-color)] text-sm uppercase tracking-wider">
                  Core Study Portals
                </h3>
              </div>
              <div className="space-y-2.5">
                <Link
                  href="/downloads/pyq"
                  className="group flex items-center justify-between p-3.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-2xl transition-all"
                >
                  <div className="space-y-0.5">
                    <h4 className="font-black text-xs text-amber-600 dark:text-amber-400">
                      📜 Official PYQs Library (71st - 60th BPSC)
                    </h4>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block">
                      Explore 71st, 70th, 69th BPSC Prelims & Mains Booklets
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-amber-500 group-hover:translate-x-1 transition-all" />
                </Link>

                <Link
                  href="/resources/bihar-special"
                  className="group flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/40 hover:bg-amber-500/10 border border-slate-200/80 dark:border-white/10 rounded-2xl transition-all"
                >
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-xs text-[var(--text-color)] group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      🗺️ Bihar Special Geography & Budget
                    </h4>
                    <span className="text-[10px] text-slate-400 font-medium block">
                      State Economic Survey & District Digests
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
                </Link>

                <Link
                  href="/syllabus-strategy"
                  className="group flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/40 hover:bg-amber-500/10 border border-slate-200/80 dark:border-white/10 rounded-2xl transition-all"
                >
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-xs text-[var(--text-color)] group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      📋 Micro-Syllabus & Strategy Worksheets
                    </h4>
                    <span className="text-[10px] text-slate-400 font-medium block">
                      Subject-wise Trend Analysis & Booklists
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
                </Link>
              </div>
            </div>

            {/* CMS Dynamic Download Portals (NCERT, PYQs, Budget, Economic Survey, etc.) */}
            {customDownloadPages.length > 0 && (
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-6 rounded-3xl space-y-4 shadow-3xs">
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-amber-500" />
                  <h3 className="font-heading font-black text-[var(--text-color)] text-sm uppercase tracking-wider">
                    NCERT & Specialized Download Pages
                  </h3>
                </div>
                <div className="space-y-2.5">
                  {customDownloadPages.map((pg) => {
                    const cleanSlug = pg.slug.startsWith('downloads/') ? pg.slug : `downloads/${pg.slug}`;
                    return (
                      <Link
                        key={pg.id}
                        href={`/${cleanSlug}`}
                        className="group flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/40 hover:bg-amber-500/10 border border-slate-200/80 dark:border-white/10 rounded-2xl transition-all"
                      >
                        <div className="space-y-0.5">
                          <h4 className="font-bold text-xs text-[var(--text-color)] group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                            📚 {pg.title}
                          </h4>
                          {pg.downloadItems && (
                            <span className="text-[10px] text-slate-400 font-medium block">
                              {pg.downloadItems.length} File Package{pg.downloadItems.length !== 1 ? 's' : ''}
                            </span>
                          )}
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
      </div>

      {/* Inline Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={() => setPreviewItem(null)}>
          <div className="bg-[var(--card-bg)] rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-[var(--card-border)]">
              <div>
                <h3 className="font-bold text-sm text-[var(--text-color)]">{previewItem.title}</h3>
                <p className="text-[10px] text-slate-400 uppercase font-bold">{previewItem.type} {previewItem.size ? `• ${previewItem.size}` : ''}</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={resolveUrl(previewItem.url)}
                  download
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </a>
                <a
                  href={resolveUrl(previewItem.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 border border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text-color)] font-bold rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open
                </a>
                <button onClick={() => setPreviewItem(null)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden bg-slate-900 relative">
              {['MP4','WEBM','OGG'].includes((previewItem.type || '').toUpperCase()) ? (
                <video
                  src={resolveUrl(previewItem.url)}
                  controls
                  autoPlay
                  className="w-full h-full max-h-[75vh] object-contain"
                />
              ) : ['JPG','JPEG','PNG','GIF','WEBP'].includes((previewItem.type || '').toUpperCase()) ? (
                <img
                  src={resolveUrl(previewItem.url)}
                  alt={previewItem.title}
                  className="w-full h-full max-h-[75vh] object-contain"
                />
              ) : (
                <iframe
                  src={resolveUrl(previewItem.url)}
                  title={previewItem.title}
                  className="w-full h-full min-h-[65vh]"
                  style={{ border: 'none' }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
