'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { updateProfile } from '@/services/auth';
import { useAuthStore } from '@/stores/authStore';
import { User, Phone, Mail, Award, CheckCircle, ChevronLeft, Save, Pencil, Camera, Loader2 } from 'lucide-react';
import StudentPortalShell from '@/components/StudentPortalShell';

const EXAMS = ['BPSC Foundation Batch', 'BPSC Target Batch', 'Prelims Test Series', 'Mains Answer Writing', 'Interview Guidance'];

export default function StudentProfilePage() {
  const { user, accessToken, requireAuth, isLoading } = useAuth();
  const { setAuth } = useAuthStore();
  const router = useRouter();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [targetExam, setTargetExam] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [imageError, setImageError] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
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
      setAvatarUrl(user.avatarUrl || '');
      setImageError(false);
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

  // Handle avatar image file selection & upload
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image size exceeds 10MB limit.');
      return;
    }

    setError('');
    setUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const uploadRes = await fetch(`${BACKEND_URL}/api/upload`, {
        method: 'POST',
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
        },
        body: formData
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData.success) {
        throw new Error(uploadData.error || 'Failed to upload photo');
      }

      // Prefer direct backend accessible URL or local proxy route
      const newAvatarUrl = uploadData.url || uploadData.cdnUrl;
      setAvatarUrl(newAvatarUrl);
      setImageError(false);

      // Auto-save the new avatar to the user's profile
      const saveRes = await updateProfile(accessToken || '', {
        fullName: fullName || user.fullName,
        mobile,
        targetExam,
        avatarUrl: newAvatarUrl
      });

      if (saveRes.success) {
        setSuccess('Profile picture updated successfully!');
        const updatedUser = {
          ...user,
          avatarUrl: newAvatarUrl
        };
        setAuth(updatedUser, accessToken || '');
      }
    } catch (err: any) {
      console.error('Avatar upload error:', err);
      setError(err.message || 'Error uploading profile image. Please try again.');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

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
      targetExam,
      avatarUrl
    });

    setSaving(false);
    if (res.success) {
      setSuccess('Profile updated successfully.');
      // Update local Zustand store state so header/sidebar updates automatically
      const updatedUser = {
        ...user,
        fullName,
        mobile,
        targetExam,
        avatarUrl
      };
      setAuth(updatedUser, accessToken || '');
    } else {
      setError(res.error || 'Failed to update profile.');
    }
  };

  return (
    <StudentPortalShell>
      <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6">
        {/* Breadcrumb / Back Link */}
        <Link
          href="/student/dashboard"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        {/* Profile Card Container (Theme-aware: White in Light Mode, Slate-900 in Dark Mode) */}
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/[0.08] p-6 sm:p-10 rounded-3xl shadow-xl dark:shadow-2xl relative overflow-hidden transition-colors">
          {/* Header & Circular Avatar Profile Section */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-8 mb-8 border-b border-slate-100 dark:border-white/[0.08]">
            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarFileChange}
              accept="image/*"
              className="hidden"
            />

            {/* Circular Avatar Container with Pencil Button */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-blue-500/40 p-1 bg-gradient-to-tr from-blue-500/20 via-indigo-500/10 to-transparent shadow-md flex items-center justify-center overflow-hidden">
                <div className="w-full h-full rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center relative">
                  {avatarUrl && !imageError ? (
                    <img
                      src={avatarUrl}
                      alt={fullName || 'Student Avatar'}
                      className="w-full h-full object-cover"
                      onError={() => {
                        console.warn('[Avatar] Failed to load image from:', avatarUrl);
                        setImageError(true);
                      }}
                    />
                  ) : (
                    <span className="text-3xl sm:text-4xl font-black text-blue-600 dark:text-blue-400 select-none">
                      {fullName ? fullName.trim().charAt(0).toUpperCase() : (user.email?.charAt(0).toUpperCase() || 'S')}
                    </span>
                  )}

                  {/* Uploading overlay */}
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center text-white">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                      <span className="text-[9px] font-bold mt-1">Uploading</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Small Circular Pencil Edit Button */}
              <button
                type="button"
                disabled={uploadingAvatar}
                onClick={() => fileInputRef.current?.click()}
                title="Change profile picture"
                className="absolute bottom-0 right-0 w-8 h-8 sm:w-9 sm:h-9 bg-blue-600 hover:bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-900 transition-all transform hover:scale-110 active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </button>
            </div>

            {/* Student Info in Header */}
            <div className="text-center sm:text-left space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
                  {fullName || 'Student Profile'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20">
                  Student
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-xs truncate">{user.email}</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 pt-1">
                Click the <span className="text-blue-600 dark:text-blue-400 font-bold">pencil button</span> to upload a profile photo (JPG, PNG, WebP).
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl text-red-700 dark:text-red-300 border border-red-200 dark:border-red-500/20 text-xs font-medium bg-red-50 dark:bg-red-500/10">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-xl text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20 text-xs font-medium flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10">
              <CheckCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-6">
            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-600 rounded-xl outline-none focus:border-blue-500/50 transition-colors"
                  required
                />
              </div>
            </div>

            {/* Email (Read Only) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email Address</label>
                <span className="text-[9px] text-blue-600 dark:text-blue-400 font-extrabold uppercase tracking-wider bg-blue-50 border border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20 px-2 py-0.5 rounded-md">
                  Verified Account
                </span>
              </div>
              <div className="relative opacity-60">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 dark:text-slate-500" />
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-100 dark:bg-white/[0.01] border border-slate-200 dark:border-white/[0.04] text-slate-500 dark:text-slate-400 text-sm rounded-xl outline-none cursor-not-allowed"
                />
              </div>
            </div>

            {/* Mobile Number */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Mobile Number</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 dark:text-slate-500" />
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="Enter 10-digit mobile"
                  maxLength={10}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-600 rounded-xl outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>
            </div>

            {/* Target exam dropdown */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Target Examination / Program</label>
              <div className="relative">
                <Award className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 dark:text-slate-500" />
                <select
                  value={targetExam}
                  onChange={(e) => setTargetExam(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-slate-200 text-sm rounded-xl outline-none focus:border-blue-500/50 transition-colors appearance-none cursor-pointer"
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
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-sm transition-all hover:scale-[1.01] hover:shadow-lg hover:shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
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
    </StudentPortalShell>
  );
}

