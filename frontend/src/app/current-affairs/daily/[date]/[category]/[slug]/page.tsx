'use client';

import { useParams } from 'next/navigation';
import NewsTodayLayout from '@/components/NewsTodayLayout';

export default function ArticleDetailViewer() {
  const params = useParams();
  const slug = params.slug as string;
  const dateStr = params.date as string;
  const categoryStr = params.category as string;

  return (
    <NewsTodayLayout
      currentDateStr={dateStr}
      currentArticleSlug={slug}
      categorySlug={categoryStr}
    />
  );
}
