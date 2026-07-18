'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ResultsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/achievers');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-color)]">
      <p className="text-slate-500 text-sm">Redirecting to achievers...</p>
    </div>
  );
}
