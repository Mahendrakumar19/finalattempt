'use client';

import { useParams } from 'next/navigation';
import NewsTodayLayout from '@/components/NewsTodayLayout';

export default function DailyEditionViewer() {
  const params = useParams();
  const dateStr = params.date as string; // YYYY-MM-DD

  return (
    <NewsTodayLayout currentDateStr={dateStr} />
  );
}
