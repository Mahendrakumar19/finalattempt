'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Sparkles, ArrowRight, Lock, Key } from 'lucide-react';
import { forgotPassword, resetPassword } from '@/services/auth';

const ForgotSchema = z.object({
  email: z.string().email('Enter a valid email address')
});

const ResetSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters')
});

type ForgotForm = z.infer<typeof ForgotSchema>;
type ResetForm = z.infer<typeof ResetSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'forgot' | 'reset'>('forgot');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const forgotForm = useForm<ForgotForm>({ resolver: zodResolver(ForgotSchema) });
  const resetForm = useForm<ResetForm>({ resolver: zodResolver(ResetSchema) });

  const handleForgotSubmit = async (data: ForgotForm) => {
    setError('');
    setIsSubmitting(true);
    const res = await forgotPassword(data.email);
    setIsSubmitting(false);
    if (res.success) {
      setEmail(data.email);
      setSuccessMessage(res.message || 'OTP sent successfully.');
      setStep('reset');
    } else {
      setError(res.error || 'Failed to request reset OTP.');
    }
  };

  const handleResetSubmit = async (data: ResetForm) => {
    setError('');
    setIsSubmitting(true);
    const res = await resetPassword(email, data.otp, data.newPassword);
    setIsSubmitting(false);
    if (res.success) {
      setSuccessMessage('Password reset successfully! Redirecting...');
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } else {
      setError(res.error || 'Failed to reset password.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 antialiased font-body relative overflow-hidden">
      {/* Decorative gradients */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-2xl p-8 border border-white/10 rounded-3xl shadow-2xl relative z-10 space-y-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg mb-4">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {step === 'forgot' ? 'Forgot Password?' : 'Reset Password'}
          </h2>
          <p className="text-slate-400 text-xs mt-1.5 max-w-xs">
            {step === 'forgot'
              ? 'Enter your registered email below to receive a password reset OTP verification code.'
              : `Enter the 6-digit OTP code sent to ${email} and define your new password.`}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-center font-medium">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs text-center font-medium">
            {successMessage}
          </div>
        )}

        {step === 'forgot' ? (
          <form onSubmit={forgotForm.handleSubmit(handleForgotSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  {...forgotForm.register('email')}
                  type="email"
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/60 border border-slate-700/60 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all"
                />
              </div>
              {forgotForm.formState.errors.email && (
                <p className="text-red-400 text-[10px]">{forgotForm.formState.errors.email.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg"
            >
              <span>{isSubmitting ? 'Sending OTP...' : 'Send Reset OTP'}</span>
              {!isSubmitting && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        ) : (
          <form onSubmit={resetForm.handleSubmit(handleResetSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Verification OTP</label>
              <div className="relative">
                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  {...resetForm.register('otp')}
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/60 border border-slate-700/60 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all text-center tracking-widest font-mono"
                />
              </div>
              {resetForm.formState.errors.otp && (
                <p className="text-red-400 text-[10px]">{resetForm.formState.errors.otp.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  {...resetForm.register('newPassword')}
                  type="password"
                  placeholder="Minimum 8 characters"
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/60 border border-slate-700/60 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all"
                />
              </div>
              {resetForm.formState.errors.newPassword && (
                <p className="text-red-400 text-[10px]">{resetForm.formState.errors.newPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-650 hover:bg-blue-600 text-white font-bold rounded-xl text-xs transition-all shadow-lg"
            >
              <span>{isSubmitting ? 'Resetting Password...' : 'Reset Password'}</span>
              {!isSubmitting && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        )}

        <div className="text-center pt-2">
          <Link href="/auth/login" className="text-xs text-slate-450 hover:text-slate-300 font-semibold transition-all">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
