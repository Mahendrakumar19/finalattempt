'use client';

import { Suspense } from 'react';
import NewsTodayLayout from '@/components/NewsTodayLayout';

export default function DailyEditionsList() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-400">Loading...</div>}>
      <NewsTodayLayout />
    </Suspense>
  );
}
