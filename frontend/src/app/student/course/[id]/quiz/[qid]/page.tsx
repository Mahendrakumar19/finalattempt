'use client';

import { use, useEffect } from 'react';
import QuizEngine from '@/components/lms/QuizEngine';

interface QuizPageProps {
  params: Promise<{ id: string; qid: string }>;
}

export default function StudentQuizPage({ params }: QuizPageProps) {
  const resolvedParams = use(params);
  const { id, qid } = resolvedParams;

  useEffect(() => {
    if (id && (id.startsWith('ts-') || id.includes('test-series'))) {
      async function redirectTestSeriesQuiz() {
        try {
          const { db } = await import('@/services/db');
          const ts = await db.getTestSeriesById(id);
          const slug = ts?.slug || id;
          window.location.replace(`/test-series/program/${slug}/attempt?quiz=${qid}`);
        } catch (_) {
          window.location.replace(`/test-series/program/${id}/attempt?quiz=${qid}`);
        }
      }
      redirectTestSeriesQuiz();
    }
  }, [id, qid]);

  return <QuizEngine quizId={qid} />;
}
