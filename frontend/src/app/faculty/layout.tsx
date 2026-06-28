'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function FacultyLayout({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace('/auth/login?redirect=/faculty/dashboard');
      } else if (user && user.role !== 'faculty' && user.role !== 'admin') {
        // Redirection check for non-faculty members trying to access instructor endpoints
        router.replace('/student/dashboard');
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Loading instructor portal...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || (user && user.role !== 'faculty' && user.role !== 'admin')) {
    return null;
  }

  return <>{children}</>;
}
