'use client';

import { use } from 'react';
import QuizEngine from '@/components/lms/QuizEngine';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface QuizPageProps {
  params: Promise<{ id: string; qid: string }>;
}

export default function StudentQuizPage({ params }: QuizPageProps) {
  const resolvedParams = use(params);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 font-body">
      <div className="max-w-3xl mx-auto mb-6">
        <Link
          href="/student/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Test to Portal</span>
        </Link>
      </div>

      <QuizEngine quizId={resolvedParams.qid} />
    </div>
  );
}
