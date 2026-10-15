'use client';

import { useParams } from 'next/navigation';
import NewsTodayLayout from '@/components/NewsTodayLayout';

export default function DailyEditionViewerClient({ initialDate }: { initialDate?: string }) {
  const params = useParams();
  const dateStr = initialDate || (params?.date as string);

  return (
    <NewsTodayLayout currentDateStr={dateStr} />
  );
}
