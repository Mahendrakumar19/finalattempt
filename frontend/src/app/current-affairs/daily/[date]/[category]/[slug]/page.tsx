'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Calendar, ArrowLeft, Clock, Award, Clipboard, Tag } from 'lucide-react';
import { db, DynamicCurrentAffairArticle } from '@/services/db';

export default function ArticleDetailViewer() {
  const params = useParams();
  const slug = params.slug as string;
  const dateStr = params.date as string;

  const [article, setArticle] = useState<DynamicCurrentAffairArticle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadArticle() {
      try {
        const art = await db.getDynamicCurrentAffairArticle(slug, false);
        setArticle(art);
      } catch (err) {
        console.error('Error loading article:', err);
      } finally {
        setLoading(false);
      }
    }
    loadArticle();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-slate-500 text-sm font-semibold">Loading article...</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-heading font-black text-slate-800 dark:text-white">Article Not Found</h2>
        <p className="text-xs text-slate-500">The requested article could not be located in our archives.</p>
        <Link
          href={`/current-affairs/daily/${dateStr}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-500 hover:text-amber-600 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Daily Edition</span>
        </Link>
      </div>
    );
  }

  const categoryColors: Record<string, string> = {
    NATIONAL: 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400',
    INTERNATIONAL: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400',
    BIHAR: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
  };
  const catBadge = categoryColors[article.category] || categoryColors.NATIONAL;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 font-body space-y-8">
      {/* Dynamic SEO JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'NewsArticle',
            'headline': article.title,
            'description': article.summary,
            'datePublished': article.publishedDate,
            'author': { '@type': 'Organization', 'name': 'Final Attempt' }
          })
        }}
      />

      {/* Back button */}
      <Link
        href={`/current-affairs/daily/${dateStr}`}
        className="text-xs font-bold text-amber-500 hover:text-amber-600 transition-colors flex items-center gap-1.5 w-fit"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to {dateStr} Daily Edition</span>
      </Link>

      {/* Article Header */}
      <div className="space-y-4 border-b border-slate-100 dark:border-white/[0.06] pb-6">
        <div className="flex flex-wrap gap-2">
          <span className={`px-2.5 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-widest ${catBadge}`}>
            {article.category}
          </span>
          <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[9px] font-bold text-slate-500 dark:text-slate-400">
            {article.importance} Importance
          </span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-heading font-black text-slate-900 dark:text-white leading-tight tracking-tight">
          {article.title}
        </h1>

        <div className="flex flex-wrap gap-4 text-[10px] text-slate-400 font-bold items-center pt-1">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>Published: {article.publishedDate}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{article.readingTime}</span>
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="p-6 bg-slate-50 dark:bg-slate-900/60 rounded-3xl border border-slate-100 dark:border-white/[0.04] space-y-2">
        <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Executive Summary</h2>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
          {article.summary}
        </p>
      </div>

      {/* Unified Rich-Text Content Block — same format as blog */}
      {article.content ? (
        <div className="p-6 sm:p-10 bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-100 dark:border-white/[0.06]">
          <div
            className="prose prose-sm dark:prose-invert max-w-none
              prose-headings:font-heading prose-headings:font-black
              prose-headings:text-slate-900 dark:prose-headings:text-white
              prose-h1:text-2xl prose-h2:text-xl prose-h3:text-base
              prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:leading-relaxed prose-p:my-3
              prose-li:text-slate-700 dark:prose-li:text-slate-300 prose-li:my-0.5
              prose-strong:text-slate-900 dark:prose-strong:text-white prose-strong:font-bold
              prose-blockquote:border-l-4 prose-blockquote:border-amber-500
              prose-blockquote:bg-amber-50 dark:prose-blockquote:bg-amber-500/10
              prose-blockquote:rounded-r-xl prose-blockquote:not-italic
              prose-a:text-amber-600 prose-a:no-underline hover:prose-a:underline
              prose-ul:list-disc prose-ul:pl-5 prose-ol:list-decimal prose-ol:pl-5"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </div>
      ) : (
        <div className="p-10 bg-slate-50 dark:bg-slate-900/20 rounded-3xl border border-dashed border-slate-200 dark:border-white/[0.06] text-center">
          <p className="text-xs text-slate-400 font-semibold">No detailed content published for this article yet.</p>
        </div>
      )}

      {/* Metadata — Subjects, Exams, Tags */}
      {((article.subjects && article.subjects.length > 0) ||
        (article.exams && article.exams.length > 0) ||
        (article.tags && article.tags.length > 0)) && (
          <div className="pt-6 border-t border-slate-100 dark:border-white/[0.06] grid grid-cols-1 sm:grid-cols-3 gap-6">
            {article.subjects && article.subjects.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                  <Clipboard className="w-3.5 h-3.5 text-amber-500" />
                  <span>GS Subjects</span>
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {article.subjects.map(sub => (
                    <span key={sub} className="px-2.5 py-1 rounded-lg bg-amber-500/5 border border-amber-500/10 text-[9px] font-bold text-amber-700 dark:text-amber-400">
                      {sub}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {article.exams && article.exams.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Target Exams</span>
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {article.exams.map(ex => (
                    <span key={ex} className="px-2.5 py-1 rounded-lg bg-indigo-500/5 border border-indigo-500/10 text-[9px] font-bold text-indigo-700 dark:text-indigo-400">
                      {ex}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {article.tags && article.tags.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Tags</span>
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {article.tags.map(t => (
                    <span key={t} className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-white/[0.04] text-[9px] font-semibold text-slate-600 dark:text-slate-400">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      {/* Return navigation */}
      <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06]">
        <Link
          href={`/current-affairs/daily/${dateStr}`}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-amber-500 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to {dateStr} Daily Edition</span>
        </Link>
      </div>
    </div>
  );
}
