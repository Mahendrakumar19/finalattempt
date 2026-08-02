'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { db, CustomPage, DownloadItem } from '@/services/db';
import { Download, FileText, ArrowLeft, Calendar, AlertCircle, Eye, CheckCircle, ExternalLink, File, Film, Archive } from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

function getFileIcon(type: string = '') {
  const t = type.toUpperCase();
  if (t === 'PDF') return { icon: FileText, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/20' };
  if (['DOC', 'DOCX'].includes(t)) return { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/20' };
  if (['PPT', 'PPTX'].includes(t)) return { icon: File, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/20' };
  if (['XLS', 'XLSX'].includes(t)) return { icon: File, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950/20' };
  if (['MP4', 'WEBM', 'OGG'].includes(t)) return { icon: Film, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/20' };
  if (t === 'ZIP') return { icon: Archive, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/20' };
  return { icon: FileText, color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-900/40' };
}

export default function DynamicDownloadPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [page, setPage] = useState<CustomPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingIds, setDownloadingIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!slug) return;
    const loadPage = async () => {
      setLoading(true);
      try {
        // First try matching downloads/[slug] or plain [slug]
        let data = await db.getCustomPageBySlug(`downloads/${slug}`);
        if (!data) {
          data = await db.getCustomPageBySlug(slug);
        }
        setPage(data);
      } catch (err) {
        console.error('Failed loading download page:', err);
      } finally {
        setLoading(false);
      }
    };
    loadPage();
  }, [slug]);

  const resolveUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/api/')) return `${BACKEND_URL}${url}`;
    return `${BACKEND_URL}/${url.replace(/^\//, '')}`;
  };

  const handleDownload = (item: DownloadItem) => {
    setDownloadingIds(prev => ({ ...prev, [item.id]: true }));
    const url = resolveUrl(item.url);
    const a = document.createElement('a');
    a.href = url;
    const ext = item.url ? item.url.split('.').pop()?.split('?')[0] : '';
    a.download = ext ? `${item.title}.${ext}` : item.title || 'download';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => {
      setDownloadingIds(prev => ({ ...prev, [item.id]: false }));
    }, 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-color)] flex items-center justify-center p-6">
        <div className="space-y-4 text-center max-w-sm">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Loading Download Portal...</p>
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-[var(--bg-color)] flex items-center justify-center p-6">
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-10 max-w-md text-center space-y-4 shadow-xl">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-xl font-heading font-black text-[var(--text-color)]">Download Page Not Found</h2>
          <p className="text-xs text-slate-500">The requested download portal might have been moved or is undergoing updates.</p>
          <Link
            href="/downloads"
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-slate-950 font-bold rounded-2xl text-xs uppercase tracking-wider shadow-md hover:bg-amber-600 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Downloads Hub</span>
          </Link>
        </div>
      </div>
    );
  }

  const items = page.downloadItems || [];

  return (
    <main className="min-h-screen bg-[var(--bg-color)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/downloads"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-amber-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Downloads Hub</span>
          </Link>

          <span className="text-[10px] font-extrabold text-amber-600 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-xl uppercase tracking-widest">
            OFFICIAL DOWNLOAD PORTAL
          </span>
        </div>

        {/* Hero Header & Banner */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl overflow-hidden shadow-md">
          {page.bannerUrl && (
            <div className="w-full h-56 sm:h-72 bg-slate-900 relative">
              <img
                src={resolveUrl(page.bannerUrl)}
                alt={page.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--card-bg)] via-transparent to-transparent" />
            </div>
          )}

          <div className="p-8 sm:p-12 space-y-4 relative">
            <h1 className="text-3xl sm:text-5xl font-heading font-black text-[var(--text-color)] leading-tight tracking-tight">
              {page.title}
            </h1>

            {page.metaDescription && (
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-3xl leading-relaxed">
                {page.metaDescription}
              </p>
            )}

            {page.updatedAt && (
              <div className="pt-2 flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                <span>Updated: {new Date(page.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            )}
          </div>
        </div>

        {/* Rich Text Overview Content */}
        {page.content && page.content.trim() !== '' && (
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-8 sm:p-10 shadow-xs space-y-4">
            <h3 className="font-heading font-extrabold text-base text-[var(--text-color)] uppercase tracking-wider border-b border-[var(--card-border)] pb-3">
              Overview & Study Roadmap
            </h3>
            <div
              className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 text-sm sm:text-base leading-relaxed
                [&_h1]:text-2xl [&_h1]:font-black [&_h1]:font-heading [&_h1]:my-4
                [&_h2]:text-xl [&_h2]:font-bold [&_h2]:font-heading [&_h2]:my-3
                [&_h3]:text-lg [&_h3]:font-bold [&_h3]:my-2
                [&_table]:max-w-full [&_table]:border-collapse [&_table]:my-6 [&_table]:mx-auto
                [&_th]:bg-slate-100 [&_th]:dark:bg-slate-800 [&_th]:p-3 [&_th]:text-left [&_th]:font-bold [&_th]:whitespace-nowrap
                [&_td]:p-3 [&_td]:border [&_td]:border-slate-200 [&_td]:dark:border-white/10 [&_td]:whitespace-nowrap
                [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          </div>
        )}

        {/* Downloadable Files Collection */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-black text-xl text-[var(--text-color)]">
              Downloadable Files & PDF Packages ({items.length})
            </h3>
          </div>

          {items.length === 0 ? (
            <div className="p-12 text-center bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl text-slate-400 text-xs font-semibold">
              No files uploaded yet for this download page.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {items.map((item) => {
                const { icon: Icon, color, bg } = getFileIcon(item.type);
                const isDownloading = downloadingIds[item.id];

                return (
                  <div
                    key={item.id}
                    className="bg-[var(--card-bg)] border border-[var(--card-border)] p-6 rounded-3xl shadow-xs hover:border-amber-500/50 hover:shadow-md transition-all flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {item.thumbnailUrl ? (
                            <img
                              src={resolveUrl(item.thumbnailUrl)}
                              alt={item.title}
                              className="w-12 h-12 object-cover rounded-xl border border-[var(--card-border)] shrink-0"
                            />
                          ) : (
                            <div className={`w-12 h-12 rounded-xl ${bg} ${color} flex items-center justify-center shrink-0`}>
                              <Icon className="w-6 h-6" />
                            </div>
                          )}

                          <div className="space-y-0.5">
                            <span className="text-[9px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                              {item.type || 'DOCUMENT'} {item.size ? `• ${item.size}` : ''}
                            </span>
                            <h4 className="font-heading font-extrabold text-base text-[var(--text-color)] leading-snug">
                              {item.title}
                            </h4>
                          </div>
                        </div>
                      </div>

                      {item.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-4 border-t border-[var(--card-border)] flex items-center gap-3">
                      <a
                        href={resolveUrl(item.url)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 border border-[var(--card-border)] transition-all cursor-pointer"
                      >
                        <Eye className="w-4 h-4 text-amber-500" />
                        <span>View</span>
                      </a>

                      {isDownloading ? (
                        <span className="flex-1 py-2.5 px-4 bg-emerald-500/10 text-emerald-600 font-bold rounded-xl text-xs border border-emerald-500/20 flex items-center justify-center gap-1.5">
                          <CheckCircle className="w-4 h-4" />
                          <span>Downloading…</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleDownload(item)}
                          className="flex-1 py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] transition-all cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
