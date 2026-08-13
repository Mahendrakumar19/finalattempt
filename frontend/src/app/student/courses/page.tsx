'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StudentCoursesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/student/dashboard?tab=My+Courses');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
