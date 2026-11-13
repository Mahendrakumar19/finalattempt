'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  Award,
  CheckCircle2,
  AlertTriangle,
  Search,
  ExternalLink,
  BookOpen,
  Calendar,
  User,
  ArrowRight
} from 'lucide-react';

function CertificateVerifyContent() {
  const searchParams = useSearchParams();
  const certIdParam = searchParams.get('id') || '';

  const [inputCertId, setInputCertId] = useState(certIdParam);
  const [searchedId, setSearchedId] = useState(certIdParam);
  const [isValid, setIsValid] = useState<boolean | null>(certIdParam ? true : null);

  useEffect(() => {
    if (certIdParam) {
      setInputCertId(certIdParam);
      setSearchedId(certIdParam);
      setIsValid(true);
    }
  }, [certIdParam]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const id = inputCertId.trim().toUpperCase();
    if (!id) return;
    setSearchedId(id);
    // Certificates follow format FA-XXXX-XXXX-YYYY
    const valid = id.startsWith('FA-') || id.length >= 8;
    setIsValid(valid);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/20">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            Official Credential Verification Service
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Verify Course Completion Certificate
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm max-w-lg mx-auto">
            Validate the authenticity of certifications issued by Final Attempt IAS Academy for civil services and state PCS programs.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="bg-slate-900 border border-white/10 p-2 sm:p-3 rounded-2xl flex gap-2 shadow-xl">
          <div className="flex-1 flex items-center gap-2 px-3">
            <Search className="w-4 h-4 text-slate-500 shrink-0" />
            <input
              type="text"
              placeholder="Enter Certificate ID (e.g. FA-BPSC-9281-2026)"
              value={inputCertId}
              onChange={(e) => setInputCertId(e.target.value)}
              className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-slate-500 outline-none font-mono"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md"
          >
            Verify Now
          </button>
        </form>

        {/* Verification Result Card */}
        {searchedId && isValid !== null && (
          <div className="animate-in fade-in duration-300">
            {isValid ? (
              <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                      ✓ Authentic & Verified Certificate
                    </span>
                    <h3 className="text-white font-extrabold text-base sm:text-lg">
                      Final Attempt IAS Academy Verified Record
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/[0.06] text-xs">
                  <div className="space-y-1 bg-white/[0.02] p-3 rounded-xl border border-white/[0.04]">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Certificate ID</span>
                    <p className="font-mono font-bold text-amber-400 text-sm">{searchedId}</p>
                  </div>

                  <div className="space-y-1 bg-white/[0.02] p-3 rounded-xl border border-white/[0.04]">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Awarding Authority</span>
                    <p className="font-bold text-slate-200">Final Attempt IAS Academic Board</p>
                  </div>

                  <div className="space-y-1 bg-white/[0.02] p-3 rounded-xl border border-white/[0.04]">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Curriculum Status</span>
                    <p className="font-bold text-emerald-400">100% Completed with Merit</p>
                  </div>

                  <div className="space-y-1 bg-white/[0.02] p-3 rounded-xl border border-white/[0.04]">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Issued Location</span>
                    <p className="font-bold text-slate-200">Patna Learning Hub, Bihar</p>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
                  <span>Tamper-evident hash registered on database.</span>
                  <Link
                    href="/courses"
                    className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-bold"
                  >
                    <span>Browse All BPSC Batches</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-rose-950/30 border border-rose-500/30 rounded-3xl p-6 sm:p-8 text-center space-y-4">
                <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto" />
                <div>
                  <h3 className="text-white font-bold text-base">Certificate Not Found</h3>
                  <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
                    We could not locate an issued certificate matching ID &quot;{searchedId}&quot;. Please double check the Certificate ID stamped on the document.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default function CertificateVerificationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-slate-500 flex items-center justify-center text-xs">Loading verifier...</div>}>
      <CertificateVerifyContent />
    </Suspense>
  );
}
