'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Sparkles, ShieldCheck, GraduationCap, ArrowRight } from 'lucide-react';

function GatewayContent() {
  const searchParams = useSearchParams();
  const redirectVal = searchParams.get('redirect');
  const redirectQuery = redirectVal ? `?redirect=${encodeURIComponent(redirectVal)}` : '';

  return (
    <div className="w-full max-w-3xl space-y-8 z-10 text-center">
      <div className="space-y-3">
        <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-white/10 flex items-center justify-center mx-auto shadow-xl">
          <Sparkles className="w-8 h-8 text-amber-400" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-heading font-black text-white tracking-tight leading-tight">
          FINAL ATTEMPT PORTAL
        </h1>
        <p className="text-slate-400 text-xs max-w-md mx-auto">
          Select your dashboard gateway to proceed with your BPSC examination preparation or workspace management.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
        
        {/* Student Portal Card */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 p-8 rounded-3xl shadow-xl flex flex-col justify-between items-start text-left hover:border-amber-500/30 transition-all hover:scale-[1.02] group">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg text-white">Student Portal</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Access your test series, classroom study materials, quiz results, and personalized mentorship logs.
              </p>
            </div>
          </div>
          <Link
            href={`/auth/login/student${redirectQuery}`}
            className="w-full mt-8 py-3 bg-[#F59E0B] hover:bg-amber-600 text-slate-900 font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
          >
            <span>Aspirant Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Faculty Portal Card */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 p-8 rounded-3xl shadow-xl flex flex-col justify-between items-start text-left hover:border-emerald-500/30 transition-all hover:scale-[1.02] group">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg text-white">Faculty Portal</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Access the syllabus editor, evaluation workbench, lead directories, and site statistics console.
              </p>
            </div>
          </div>
          <Link
            href={`/auth/login/faculty${redirectQuery}`}
            className="w-full mt-8 py-3 bg-[#10B981] hover:bg-emerald-600 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
          >
            <span>Instructor Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>

      <div className="pt-6">
        <Link href="/" className="text-slate-500 hover:text-slate-350 text-xs font-semibold transition-colors">
          ← Return to Main Website
        </Link>
      </div>
    </div>
  );
}

export default function EntryGatewayPage() {
  return (
    <>
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(3deg); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(-2deg); }
        }
        .animate-float-slow { animation: float-slow 7s ease-in-out infinite; }
        .animate-float-medium { animation: float-medium 5s ease-in-out infinite; }
      `}</style>

      <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #020617 0%, #0F172A 50%, #1e1b4b 100%)' }}>
        
        {/* Decorative Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full opacity-[0.15] blur-[80px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, #F59E0B 0%, transparent 80%)' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full opacity-[0.2] blur-[80px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 80%)' }} />

        <Suspense fallback={
          <div className="p-8 text-center text-white">
            <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            Loading portal options...
          </div>
        }>
          <GatewayContent />
        </Suspense>
      </div>
    </>
  );
}
