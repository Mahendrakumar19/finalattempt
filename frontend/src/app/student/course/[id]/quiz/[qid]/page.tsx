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
    async function redirectTestSeriesQuiz() {
      try {
        const { db } = await import('@/services/db');
        const quiz = await db.getQuizById(qid);
        const seriesId = quiz?.courseId || id;
        if (seriesId && seriesId !== 'cbt') {
          const ts = await db.getTestSeriesById(seriesId);
          const slug = ts?.slug || seriesId;
          window.location.replace(`/test-series/program/${slug}/attempt?quiz=${qid}`);
          return;
        }
      } catch (_) {}
    }

    if (id && (id.startsWith('ts-') || id.includes('test-series') || id === 'cbt')) {
      redirectTestSeriesQuiz();
    }
  }, [id, qid]);

  return <QuizEngine quizId={qid} />;
}
