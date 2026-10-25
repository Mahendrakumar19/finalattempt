'use client';

import { Suspense } from 'react';
import NewsTodayLayout from '@/components/NewsTodayLayout';

interface ArticleDetailClientProps {
  slug: string;
  dateStr: string;
  categoryStr: string;
}

export default function ArticleDetailClient({ slug, dateStr, categoryStr }: ArticleDetailClientProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-400">Loading...</div>}>
      <NewsTodayLayout
        currentDateStr={dateStr}
        currentArticleSlug={slug}
        categorySlug={categoryStr}
      />
    </Suspense>
  );
}
