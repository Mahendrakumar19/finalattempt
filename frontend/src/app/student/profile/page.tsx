'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { updateProfile } from '@/services/auth';
import { useAuthStore } from '@/stores/authStore';
import { User, Phone, Mail, Award, CheckCircle, ChevronLeft, Save } from 'lucide-react';

const EXAMS = ['BPSC Foundation Batch', 'BPSC Target Batch', 'Prelims Test Series', 'Mains Answer Writing', 'Interview Guidance'];

export default function StudentProfilePage() {
  const { user, accessToken, requireAuth, isLoading } = useAuth();
  const { setAuth } = useAuthStore();
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [targetExam, setTargetExam] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Authentication guard
  useEffect(() => {
    requireAuth('/auth/login/student');
  }, [requireAuth, isLoading]);

  // Sync profile state once user is loaded
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setMobile(user.mobile || '');
      setTargetExam(user.targetExam || '');
    }
  }, [user]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Verifying Session...</p>
        </div>
      </div>
    );
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    if (!fullName.trim()) {
      setError('Full name is required.');
      setSaving(false);
      return;
    }

    const res = await updateProfile(accessToken || '', {
      fullName,
      mobile,
      targetExam
    });

    setSaving(false);
    if (res.success) {
      setSuccess('Profile updated successfully.');
      // Update local Zustand store state so header/sidebar updates automatically
      const updatedUser = {
        ...user,
        fullName,
        mobile,
        targetExam
      };
      setAuth(updatedUser, accessToken || '');
    } else {
      setError(res.error || 'Failed to update profile.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex font-body text-slate-100 p-6 items-center justify-center">
      <div className="w-full max-w-2xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] p-8 sm:p-10 rounded-3xl shadow-2xl relative overflow-hidden">
        {/* Subtle top light flare */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />

        {/* Back Link */}
        <Link
          href="/student/dashboard"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors mb-8"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        <div className="space-y-2 mb-8">
          <h2 className="text-2xl font-black tracking-tight text-white">Profile Settings</h2>
          <p className="text-slate-400 text-xs leading-relaxed">
            Update your personal details, target examination, and contact preferences below.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl text-red-300 border border-red-500/20 text-xs font-medium" style={{ background: 'rgba(239, 68, 68, 0.08)' }}>
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl text-emerald-300 border border-emerald-500/20 text-xs font-medium flex items-center gap-2" style={{ background: 'rgba(16, 185, 129, 0.08)' }}>
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-6">
          {/* Full Name */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter full name"
                className="w-full pl-11 pr-4 py-3.5 bg-white/[0.03] border border-white/[0.08] text-white text-sm placeholder:text-slate-600 rounded-xl outline-none focus:border-blue-500/50 transition-colors"
                required
              />
            </div>
          </div>

          {/* Email (Read Only) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
              <span className="text-[9px] text-blue-400 font-extrabold uppercase tracking-wider bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md">
                Verified Account
              </span>
            </div>
            <div className="relative opacity-60">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full pl-11 pr-4 py-3.5 bg-white/[0.01] border border-white/[0.04] text-slate-400 text-sm rounded-xl outline-none cursor-not-allowed"
              />
            </div>
          </div>

          {/* Mobile Number */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mobile Number</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="Enter 10-digit mobile"
                maxLength={10}
                className="w-full pl-11 pr-4 py-3.5 bg-white/[0.03] border border-white/[0.08] text-white text-sm placeholder:text-slate-600 rounded-xl outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>
          </div>

          {/* Target exam dropdown */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Examination / Program</label>
            <div className="relative">
              <Award className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
              <select
                value={targetExam}
                onChange={(e) => setTargetExam(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-900 border border-white/[0.08] text-slate-200 text-sm rounded-xl outline-none focus:border-blue-500/50 transition-colors appearance-none cursor-pointer"
              >
                <option value="">Select program...</option>
                {EXAMS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl text-sm transition-all hover:scale-[1.01] hover:shadow-lg hover:shadow-blue-500/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
