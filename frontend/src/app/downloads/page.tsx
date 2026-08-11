'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Download, FileText, ArrowRight, Search,
  BookOpen, Eye, Layers, Folder
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

interface PYQItem {
  id: string;
  paperName?: string;
  description?: string;
  stage?: string;
  year?: number | string;
  exam?: { name?: string };
  examId?: string;
  questionPaper?: any;
  answerKey?: any;
  solution?: any;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export default function DedicatedDownloadsPage() {
  const [downloadStates, setDownloadStates] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [resourcesList, setResourcesList] = useState<ResourceItem[]>([]);
  const [customDownloadPages, setCustomDownloadPages] = useState<CustomPage[]>([]);
  const [allPagesList, setAllPagesList] = useState<CustomPage[]>([]);
  const [pyqList, setPyqList] = useState<PYQItem[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [res, pages, pyqRes] = await Promise.all([
          db.getResources(),
          db.getCustomPages(true),
          fetch(`${BACKEND_URL}/api/pyqs?limit=500`).then(r => r.json()).catch(() => null)
        ]);
        if (res && res.length > 0) setResourcesList(res);
        if (pages && pages.length > 0) {
          const CORE_SLUGS = new Set([
            'downloads/fa-publication', 'fa-publication',
            'downloads/rapid-revision', 'rapid-revision',
            'downloads/value-added-mains', 'value-added-mains',
            'downloads/toppers-copies', 'toppers-copies',
            'downloads/ncert', 'ncert',
            'downloads/pyq', 'pyq'
          ]);
          const downloadPages = pages.filter(
            (p: any) => !CORE_SLUGS.has(p.slug) && (p.showLocation === 'DOWNLOADS_HUB' || p.slug.startsWith('downloads/') || (p.downloadItems && p.downloadItems.length > 0))
          );
          setCustomDownloadPages(downloadPages);
          setAllPagesList(pages);
        }
        if (pyqRes && pyqRes.success && Array.isArray(pyqRes.data)) {
          setPyqList(pyqRes.data);
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

  // Build category tabs from live data
  const categoryTabs = useMemo(() => {
    const cats = new Set<string>();
    resourcesList.forEach(res => {
      if (res.category && res.category !== 'General Downloads') cats.add(res.category);
    });
    return ['All', ...Array.from(cats)];
  }, [resourcesList]);

  // Universal search results across both Resources list AND Custom Download Pages & Embedded Files
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();

    const matches: Array<{
      id: string;
      title: string;
      description?: string;
      type: string;
      size?: string;
      url: string;
      pageTitle: string;
      pageSlug: string;
    }> = [];

    // Search inside resourcesList
    resourcesList.forEach(res => {
      if ((res.title || '').toLowerCase().includes(q) || (res.category || '').toLowerCase().includes(q)) {
        matches.push({
          id: res.id,
          title: res.title,
          type: res.type || 'PDF',
          size: res.size,
          url: res.url,
          pageTitle: res.category || 'General Resource',
          pageSlug: 'downloads'
        });
      }
    });

    // Search inside custom download pages & embedded downloadItems
    customDownloadPages.forEach(page => {
      const pageTitleMatch = (page.title || '').toLowerCase().includes(q) || (page.slug || '').toLowerCase().includes(q);
      const cleanSlug = page.slug.startsWith('downloads/') ? page.slug : `downloads/${page.slug}`;

      (page.downloadItems || []).forEach(item => {
        if (pageTitleMatch || (item.title || '').toLowerCase().includes(q) || (item.description || '').toLowerCase().includes(q)) {
          matches.push({
            id: item.id,
            title: item.title,
            description: item.description,
            type: item.type || 'PDF',
            size: item.size,
            url: item.url,
            pageTitle: page.title,
            pageSlug: cleanSlug
          });
        }
      });
    });

    // Universal Search inside PYQ Vault (Exams & Individual Question Papers / Answer Keys / Solutions)
    pyqList.forEach(pyq => {
      const examName = pyq.exam?.name || pyq.examId || 'BPSC Exam';
      const paperName = pyq.paperName || '';
      const description = pyq.description || '';
      const stage = pyq.stage || 'PYQ';
      const year = pyq.year || '';

      if (
        paperName.toLowerCase().includes(q) ||
        examName.toLowerCase().includes(q) ||
        description.toLowerCase().includes(q) ||
        String(year).includes(q) ||
        stage.toLowerCase().includes(q)
      ) {
        // Question Paper match
        if (pyq.questionPaper) {
          const paperPath = pyq.questionPaper.storagePath || pyq.questionPaper.url || pyq.questionPaper.path || (typeof pyq.questionPaper === 'string' ? pyq.questionPaper : '');
          matches.push({
            id: `pyq-qp-${pyq.id}`,
            title: `${paperName} (${year} ${stage})`,
            description: `Official ${examName} Question Paper - ${stage} Stage`,
            type: 'PYQ PDF',
            size: 'PDF',
            url: paperPath,
            pageTitle: `PYQ• ${examName}`,
            pageSlug: 'downloads/pyq'
          });
        }

        // Answer Key match
        if (pyq.answerKey) {
          const keyPath = pyq.answerKey.storagePath || pyq.answerKey.url || pyq.answerKey.path || (typeof pyq.answerKey === 'string' ? pyq.answerKey : '');
          matches.push({
            id: `pyq-ak-${pyq.id}`,
            title: `${paperName} Answer Key (${year})`,
            description: `Official Answer Key for ${examName} - ${paperName}`,
            type: 'ANSWER KEY',
            size: 'PDF',
            url: keyPath,
            pageTitle: `PYQ • ${examName}`,
            pageSlug: 'downloads/pyq'
          });
        }

        // Solution match
        if (pyq.solution) {
          const solPath = pyq.solution.storagePath || pyq.solution.url || pyq.solution.path || (typeof pyq.solution === 'string' ? pyq.solution : '');
          matches.push({
            id: `pyq-sol-${pyq.id}`,
            title: `${paperName} Solution (${year})`,
            description: `Detailed Solution & Explanation for ${examName} - ${paperName}`,
            type: 'SOLUTION',
            size: 'PDF',
            url: solPath,
            pageTitle: `PYQ • ${examName}`,
            pageSlug: 'downloads/pyq'
          });
        }
      }
    });

    return matches;
  }, [searchQuery, resourcesList, customDownloadPages, pyqList]);

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

        {/* ── Universal Search Results Overlay / Section ───────────── */}
        {searchResults !== null ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-black text-xl text-[var(--text-color)]">
                Search Results for &ldquo;{searchQuery}&rdquo; ({searchResults.length} Files Found)
              </h3>
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-amber-600 dark:text-amber-400 font-bold hover:underline cursor-pointer"
              >
                Clear Search
              </button>
            </div>

            {searchResults.length === 0 ? (
              <div className="p-12 text-center text-slate-400 font-semibold text-xs bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl space-y-2">
                <Layers className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
                <p>No matching study files or documents found for &ldquo;{searchQuery}&rdquo; across any download pages.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map((item) => (
                  <div
                    key={item.id}
                    className="bg-[var(--card-bg)] border border-[var(--card-border)] p-6 rounded-3xl shadow-xs hover:border-amber-500/50 hover:shadow-xl transition-all flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[9px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-lg uppercase tracking-wider truncate max-w-[180px]">
                          📍 {item.pageTitle}
                        </span>
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase">
                          {item.type} {item.size ? `• ${item.size}` : ''}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-heading font-black text-base text-[var(--text-color)] group-hover:text-amber-500 transition-colors leading-snug">
                          {item.title}
                        </h4>
                        {item.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[var(--card-border)] flex items-center gap-2">
                      <Link
                        href={`/${item.pageSlug}`}
                        className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 border border-[var(--card-border)] transition-all cursor-pointer"
                      >
                        <Eye className="w-4 h-4 text-amber-500" />
                        <span>Open Page</span>
                      </Link>

                      {item.url && (
                        <a
                          href={resolveUrl(item.url)}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md hover:scale-[1.02] transition-all cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Default Page Grid View */
          <div className="space-y-4 pt-4 border-t border-[var(--card-border)]">
            <div className="flex items-center justify-between">
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* Built-in PYQ Vault */}
              {(() => {
                const pyqPage = allPagesList.find(p => p.slug === 'downloads/pyq' || p.slug === 'pyq');
                const logoUrl = pyqPage?.logoUrl;
                return (
                  <Link
                    href="/downloads/pyq"
                    className="group p-5 bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-amber-500/50 rounded-2xl transition-all shadow-xs flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-white text-amber-500 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden p-1 shadow-2xs">
                      {logoUrl ? (
                        <img src={logoUrl} alt="PYQs" className="w-full h-full object-contain" />
                      ) : (
                        <FileText className="w-6 h-6 text-amber-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-heading font-extrabold text-base text-[var(--text-color)] group-hover:text-amber-500 transition-colors truncate">
                        PYQs
                      </h4>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-1 transition-all shrink-0" />
                  </Link>
                );
              })()}

              {/* Dynamic Hierarchical NCERT Repository */}
              {(() => {
                const ncertPage = allPagesList.find(p => p.slug === 'downloads/ncert' || p.slug === 'ncert');
                const logoUrl = ncertPage?.logoUrl;
                return (
                  <Link
                    href="/downloads/ncert"
                    className="group p-5 bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-amber-500/50 rounded-2xl transition-all shadow-xs flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-white text-emerald-500 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden p-1 shadow-2xs">
                      {logoUrl ? (
                        <img src={logoUrl} alt="NCERT" className="w-full h-full object-contain" />
                      ) : (
                        <BookOpen className="w-6 h-6 text-emerald-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-heading font-extrabold text-base text-[var(--text-color)] group-hover:text-amber-500 transition-colors truncate">
                        NCERT
                      </h4>
                      {/* <span className="text-[10px] text-slate-400 font-medium">History, Geography, Polity, Economics</span> */}
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-1 transition-all shrink-0" />
                  </Link>
                );
              })()}



              {/* 2. Rapid Revision Materials */}
              {(() => {
                const rrPage = allPagesList.find(p => p.slug === 'downloads/rapid-revision' || p.slug === 'rapid-revision');
                const logoUrl = rrPage?.logoUrl;
                return (
                  <Link
                    href="/downloads/rapid-revision"
                    className="group p-5 bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-amber-500/50 rounded-2xl transition-all shadow-xs flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-white text-rose-500 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden p-1 shadow-2xs">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Rapid Revision" className="w-full h-full object-contain" />
                      ) : (
                        <Layers className="w-6 h-6 text-rose-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-heading font-extrabold text-base text-[var(--text-color)] group-hover:text-amber-500 transition-colors truncate">
                        Rapid Revision Materials
                      </h4>
                      {/* <span className="text-[10px] text-slate-400 font-medium">Quick Revision Notes & Tables</span> */}
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-1 transition-all shrink-0" />
                  </Link>
                );
              })()}

              {/* 3. Value Added Materials Mains */}
              {(() => {
                const vaPage = allPagesList.find(p => p.slug === 'downloads/value-added-mains' || p.slug === 'value-added-mains');
                const logoUrl = vaPage?.logoUrl;
                return (
                  <Link
                    href="/downloads/value-added-mains"
                    className="group p-5 bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-amber-500/50 rounded-2xl transition-all shadow-xs flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-white text-cyan-500 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden p-1 shadow-2xs">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Value Added Materials" className="w-full h-full object-contain" />
                      ) : (
                        <FileText className="w-6 h-6 text-cyan-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-heading font-extrabold text-base text-[var(--text-color)] group-hover:text-amber-500 transition-colors truncate">
                        Value Added Materials — Mains
                      </h4>
                      {/* <span className="text-[10px] text-slate-400 font-medium">Mains Data, Quotes & Case Studies</span> */}
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-1 transition-all shrink-0" />
                  </Link>
                );
              })()}

              {/* 4. Toppers Copies */}
              {(() => {
                const tcPage = allPagesList.find(p => p.slug === 'downloads/toppers-copies' || p.slug === 'toppers-copies');
                const logoUrl = tcPage?.logoUrl;
                return (
                  <Link
                    href="/downloads/toppers-copies"
                    className="group p-5 bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-amber-500/50 rounded-2xl transition-all shadow-xs flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-white text-amber-500 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden p-1 shadow-2xs">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Toppers Copies" className="w-full h-full object-contain" />
                      ) : (
                        <FileText className="w-6 h-6 text-amber-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-heading font-extrabold text-base text-[var(--text-color)] group-hover:text-amber-500 transition-colors truncate">
                        Toppers&apos; Copies
                      </h4>
                      {/* <span className="text-[10px] text-slate-400 font-medium">Evaluated Copies of BPSC Toppers</span> */}
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-1 transition-all shrink-0" />
                  </Link>
                );
              })()}

              {/* 5. FA Publication */}
              {(() => {
                const faPage = allPagesList.find(p => p.slug === 'downloads/fa-publication' || p.slug === 'fa-publication');
                const logoUrl = faPage?.logoUrl;
                return (
                  <Link
                    href="/downloads/fa-publication"
                    className="group p-5 bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-amber-500/50 rounded-2xl transition-all shadow-xs flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-white text-blue-600 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden p-1 shadow-2xs">
                      {logoUrl ? (
                        <img src={logoUrl} alt="FA Publication" className="w-full h-full object-contain" />
                      ) : (
                        <BookOpen className="w-6 h-6 text-blue-600" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-heading font-extrabold text-base text-[var(--text-color)] group-hover:text-amber-500 transition-colors truncate">
                        Final Attempt Publication
                      </h4>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-1 transition-all shrink-0" />
                  </Link>
                );
              })()}

              {/* Custom Created Download Sub-Pages */}
              {customDownloadPages.map((pg: any) => {
                const cleanSlug = pg.slug.startsWith('downloads/') ? pg.slug : `downloads/${pg.slug}`;
                const logoUrl = pg.logoUrl;
                return (
                  <Link
                    key={pg.id}
                    href={`/${cleanSlug}`}
                    className="group p-5 bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-amber-500/50 rounded-2xl transition-all shadow-xs flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-white text-blue-500 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden p-1 shadow-2xs">
                      {logoUrl ? (
                        <img src={logoUrl} alt={pg.title} className="w-full h-full object-contain" />
                      ) : (
                        <Folder className="w-6 h-6 text-blue-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-heading font-extrabold text-base text-[var(--text-color)] group-hover:text-amber-500 transition-colors truncate">
                        {pg.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-medium">{pg.downloadItems?.length || 0} Files Package</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-1 transition-all shrink-0" />
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
