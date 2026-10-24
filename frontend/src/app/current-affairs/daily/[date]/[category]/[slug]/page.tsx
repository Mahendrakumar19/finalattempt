'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import NewsTodayLayout from '@/components/NewsTodayLayout';

export default function ArticleDetailViewer() {
  const params = useParams();
  const slug = params.slug as string;
  const dateStr = params.date as string;
  const categoryStr = params.category as string;

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
