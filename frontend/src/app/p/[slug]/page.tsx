'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { db, CustomPage } from '@/services/db';
import { Sparkles, Calendar, ArrowLeft, Share2, Tag, BookOpen, AlertCircle } from 'lucide-react';

export default function CustomDynamicPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [page, setPage] = useState<CustomPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    const loadPage = async () => {
      setLoading(true);
      try {
        const data = await db.getCustomPageBySlug(slug);
        setPage(data);
      } catch (err) {
        console.error('Failed loading custom page:', err);
      } finally {
        setLoading(false);
      }
    };
    loadPage();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-color)] flex items-center justify-center p-6">
        <div className="space-y-4 text-center max-w-sm">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Loading Content Page...</p>
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-[var(--bg-color)] flex items-center justify-center p-6">
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-10 max-w-md text-center space-y-4 shadow-xl">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-xl font-heading font-black text-[var(--text-color)]">Page Not Found</h2>
          <p className="text-xs text-slate-500">The requested page might have been removed or is undergoing updates.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-slate-950 font-bold rounded-2xl text-xs uppercase tracking-wider shadow-md hover:bg-amber-600 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--bg-color)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-amber-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Main Platform</span>
          </Link>

          <span className="text-[10px] font-extrabold text-amber-600 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-xl uppercase tracking-widest">
            {page.showLocation || 'CUSTOM PAGE'}
          </span>
        </div>

        {/* Page Hero Header */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-8 sm:p-12 shadow-md space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          
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
              <span>Last Updated: {new Date(page.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
          )}
        </div>

        {/* Main Dynamic HTML Article Body */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-8 sm:p-12 shadow-sm space-y-6">
          <div
            className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 text-sm sm:text-base leading-relaxed
              [&_h1]:text-2xl [&_h1]:font-black [&_h1]:font-heading [&_h1]:my-4
              [&_h2]:text-xl [&_h2]:font-bold [&_h2]:font-heading [&_h2]:my-3
              [&_h3]:text-lg [&_h3]:font-bold [&_h3]:my-2
              [&_table]:max-w-full [&_table]:border-collapse [&_table]:my-6 [&_table]:mx-auto
              [&_th]:bg-slate-100 [&_th]:dark:bg-slate-800 [&_th]:p-3 [&_th]:text-left [&_th]:font-bold [&_th]:whitespace-nowrap
              [&_td]:p-3 [&_td]:border [&_td]:border-slate-200 [&_td]:dark:border-white/10 [&_td]:whitespace-nowrap
              [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6
              [&_blockquote]:border-l-4 [&_blockquote]:border-amber-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-4"
            dangerouslySetInnerHTML={{ __html: page.content || '<p>No content provided yet for this page.</p>' }}
          />
        </div>

      </div>
    </main>
  );
}
