'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import QuizEngine from '@/components/lms/QuizEngine';

function TestAttemptContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const quizIdParam = searchParams.get('quiz');
  const { user, accessToken } = useAuth();
  
  const quizId = quizIdParam;
  const error = !quizId ? 'A specific quiz paper parameter (?quiz=id) is required to enter CBT exam mode.' : null;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = accessToken || localStorage.getItem('access_token') || localStorage.getItem('token');
      if (!user && !token) {
        const currentUrl = window.location.pathname + window.location.search;
        window.location.href = `/auth/login/student?redirect=${encodeURIComponent(currentUrl)}`;
      }
    }
  }, [user, accessToken]);

  if (error || !quizId) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 bg-[#111111] border border-white/10 rounded-3xl text-center space-y-6 shadow-2xl">
          <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto text-amber-500">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-heading font-black text-white">Mock Quiz Unavailable</h2>
            <p className="text-xs text-white/60 leading-relaxed">
              {error || 'No mock test paper has been selected or linked to this exam program yet.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.back()}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-black font-black text-xs rounded-2xl transition-all cursor-pointer inline-flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Test Series Portal</span>
          </button>
        </div>
      </div>
    );
  }

  return <QuizEngine quizId={quizId} />;
}

export default function TestAttemptPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <TestAttemptContent />
    </Suspense>
  );
}
