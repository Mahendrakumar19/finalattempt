'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Download, FileText, ArrowRight, CheckCircle, Search, Compass, BookOpen, ExternalLink, Eye, X, File, Film, Archive } from 'lucide-react';
import { db, fallbackResources } from '@/services/db';

type ResourceTab = 'notes' | 'downloads';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

// Returns icon + color based on file type
function getFileIcon(type: string) {
  const t = (type || '').toUpperCase();
  if (t === 'PDF')  return { icon: FileText, color: 'text-red-500',    bg: 'bg-red-50' };
  if (['DOC','DOCX'].includes(t)) return { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50' };
  if (['PPT','PPTX'].includes(t)) return { icon: File,     color: 'text-orange-500', bg: 'bg-orange-50' };
  if (['XLS','XLSX'].includes(t)) return { icon: File,     color: 'text-green-500', bg: 'bg-green-50' };
  if (['MP4','WEBM','OGG'].includes(t)) return { icon: Film, color: 'text-purple-500', bg: 'bg-purple-50' };
  if (t === 'ZIP')  return { icon: Archive, color: 'text-amber-600',   bg: 'bg-amber-50' };
  return { icon: FileText, color: 'text-slate-500', bg: 'bg-slate-50' };
}

// Check if a URL can be previewed inline
function canPreviewInline(url: string, type: string) {
  const t = (type || '').toUpperCase();
  if (!url) return false;
  if (t === 'PDF') return true;
  if (['MP4','WEBM','OGG'].includes(t)) return true;
  if (['JPG','JPEG','PNG','GIF','WEBP'].includes(t)) return true;
  return false;
}

export default function Resources() {
  const [downloadStates, setDownloadStates] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [resourcesList, setResourcesList] = useState<any[]>(fallbackResources);
  const [activeTab, setActiveTab] = useState<ResourceTab>('notes');
  const [previewItem, setPreviewItem] = useState<any | null>(null);

  useEffect(() => {
    const loadResources = async () => {
      try {
        const res = await db.getResources();
        if (res && res.length > 0) {
          setResourcesList(res);
        }
      } catch (err) {
        console.error('Failed loading resources:', err);
      }
    };
    loadResources();
  }, []);

  const handleDownload = (res: any) => {
    setDownloadStates(prev => ({ ...prev, [res.id]: true }));
    // Trigger actual download
    const url = res.url?.startsWith('/api/') ? `${BACKEND_URL}${res.url}` : res.url;
    const a = document.createElement('a');
    a.href = url;
    a.download = res.title || 'resource';
    a.target = '_blank';
    a.click();
    setTimeout(() => {
      setDownloadStates(prev => ({ ...prev, [res.id]: false }));
    }, 3000);
  };

  const resolveUrl = (url: string) =>
    url?.startsWith('/api/') ? `${BACKEND_URL}${url}` : url;

  const filteredResources = resourcesList.filter(res => {
    const title = res.title || '';
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());
    const isNotes = res.type?.toLowerCase().includes('note') || res.title?.toLowerCase().includes('note');
    if (activeTab === 'notes') return matchesSearch && isNotes;
    return matchesSearch && !isNotes;
  });

  return (
    <div className="min-h-screen bg-[var(--bg-color)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">

        {/* Header */}
        <div className="space-y-4 text-center max-w-3xl mx-auto">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Free Resources</span>
          <h1 className="text-4xl font-heading font-extrabold text-[var(--text-color)] tracking-tight">
            Aspirant Resources & Notes
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Access high-yield study notes, PDFs, mind maps, and BPSC exam preparation templates absolutely free.
          </p>
        </div>

        {/* Grid: Main Directory & Callout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Category Content (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Tab Switcher */}
            <div className="flex gap-2 p-1 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-sm max-w-md">
              <button
                onClick={() => setActiveTab('notes')}
                className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'notes'
                    ? 'bg-[#0F172A] text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Study Notes</span>
              </button>
              <button
                onClick={() => setActiveTab('downloads')}
                className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'downloads'
                    ? 'bg-[#0F172A] text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Download className="w-4 h-4" />
                <span>Download Content</span>
              </button>
            </div>

            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={`Search ${activeTab === 'notes' ? 'study notes' : 'download content'}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-xs bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-[var(--text-color)] shadow-sm"
              />
            </div>

            {/* List Wrapper */}
            <div className="bg-[var(--card-bg)] rounded-3xl border border-[var(--card-border)] shadow-sm divide-y divide-[var(--card-border)] overflow-hidden">
              {filteredResources.length > 0 ? (
                filteredResources.map((res) => {
                  const { icon: Icon, color, bg } = getFileIcon(res.type);
                  const canPreview = canPreviewInline(res.url, res.type);

                  return (
                    <div key={res.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                      <div className="flex gap-4 items-start">
                        <div className={`w-10 h-10 rounded-xl ${bg} ${color} flex items-center justify-center shrink-0`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-heading font-extrabold text-sm text-[var(--text-color)] leading-tight">
                            {res.title}
                          </h4>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            {res.type} {res.size ? `• ${res.size}` : ''} • {res.downloadCount + (downloadStates[res.id] ? 1 : 0)} downloads
                          </p>
                          {res.url && res.url.includes('/api/files/') && (
                            <p className="text-[9px] text-emerald-600 font-semibold">
                              ✓ Hosted on server
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {/* Preview button for PDFs/videos */}
                        {canPreview && (
                          <button
                            onClick={() => setPreviewItem(res)}
                            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Preview</span>
                          </button>
                        )}

                        {downloadStates[res.id] ? (
                          <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                            <CheckCircle className="w-4 h-4" />
                            <span>Opening…</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleDownload(res)}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-brand-primary hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-md hover:scale-[1.02] transition-all cursor-pointer"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-12 text-center text-slate-400 font-semibold text-xs">
                  No items found in this section matching your filters.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Special Subpages Callout (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-100/70 dark:border-amber-900/30 p-6 rounded-3xl shadow-sm space-y-4">
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-xl flex items-center justify-center">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-black text-[var(--text-color)] text-base">Bihar Special Section</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                  Access Bihar-specific economic survey notes, state budget digests, maps, historical archives, and demographic data.
                </p>
              </div>
              <Link
                href="/resources/bihar-special"
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#F59E0B] hover:bg-amber-600 text-slate-900 font-bold rounded-xl text-xs shadow-md transition-all hover:scale-[1.01]"
              >
                <span>Explore Bihar Special</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Inline Preview Modal ─────────────────────────────────────── */}
      {previewItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setPreviewItem(null)}>
          <div className="bg-[var(--card-bg)] rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
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
                  className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open
                </a>
                <button onClick={() => setPreviewItem(null)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Preview Content */}
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
                /* PDF — use iframe for inline rendering */
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
