'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles, ShieldCheck, RotateCcw } from 'lucide-react';
import { verifyOTP, sendOTP } from '@/services/auth';
import { useAuthStore } from '@/stores/authStore';

function VerifyOTPContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email     = searchParams.get('email') || '';
  const redirectTo = searchParams.get('redirect') || '/student/dashboard';
  const { setAuth } = useAuthStore();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Start countdown timer on mount
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => { if (prev <= 1) { clearInterval(interval); return 0; } return prev - 1; });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleOTPInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-advance
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    // Auto-submit when all filled
    if (newOtp.every(d => d !== '') && value) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const newOtp = pasted.split('');
      setOtp(newOtp);
      handleVerify(pasted);
    }
  };

  const handleVerify = async (code: string) => {
    if (code.length !== 6) return;
    setError('');
    setIsSubmitting(true);
    const res = await verifyOTP(email, 'email', code, 'verify');
    setIsSubmitting(false);

    if (res.success && res.data) {
      setSuccess(true);
      setAuth(res.data.user, res.data.accessToken);
      setTimeout(() => router.push(redirectTo), 1200);
    } else {
      setError(res.error || 'Invalid or expired OTP. Please try again.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setError('');
    const res = await sendOTP(email, 'email', 'verify');
    if (res.success) {
      setCountdown(60);
      const interval = setInterval(() => {
        setCountdown(prev => { if (prev <= 1) { clearInterval(interval); return 0; } return prev - 1; });
      }, 1000);
    } else {
      setError(res.error || 'Failed to resend OTP.');
    }
  };

  return (
    <div className="w-full max-w-md relative z-10">
      {/* Card */}
      <div className="bg-slate-900/90 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 sm:p-10 shadow-2xl shadow-black/50">
        
        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-6">
          {success ? (
            <ShieldCheck className="w-7 h-7 text-emerald-400" />
          ) : (
            <Sparkles className="w-7 h-7 text-blue-400" />
          )}
        </div>

        {success ? (
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-2">Email Verified!</h2>
            <p className="text-slate-400 text-sm">Redirecting to your dashboard...</p>
            <div className="mt-4 w-8 h-8 border-2 border-blue-500/30 border-t-blue-400 rounded-full animate-spin mx-auto" />
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold text-white text-center mb-1">Verify Your Email</h2>
            <p className="text-slate-400 text-sm text-center mb-2">
              We sent a 6-digit code to
            </p>
            <p className="text-blue-400 text-sm font-semibold text-center mb-6">{email}</p>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-medium text-center">
                {error}
              </div>
            )}

            {/* OTP Input boxes */}
            <div className="flex justify-center gap-2.5 mb-6" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={el => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOTPInput(index, e.target.value)}
                  onKeyDown={e => handleKeyDown(index, e)}
                  className={`w-11 h-14 text-center text-xl font-bold rounded-xl border transition-all text-white bg-slate-800/60 focus:outline-none focus:scale-105
                    ${digit ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700/60'}
                    ${isSubmitting ? 'opacity-50' : ''}
                  `}
                  disabled={isSubmitting}
                />
              ))}
            </div>

            {/* Loading indicator */}
            {isSubmitting && (
              <div className="flex items-center justify-center gap-2 mb-4 text-slate-400 text-xs">
                <div className="w-4 h-4 border-2 border-slate-600 border-t-blue-400 rounded-full animate-spin" />
                Verifying...
              </div>
            )}

            {/* Resend */}
            <div className="flex items-center justify-center gap-1 text-xs">
              <span className="text-slate-500">Didn't receive it?</span>
              <button
                onClick={handleResend}
                disabled={countdown > 0}
                className="flex items-center gap-1 text-blue-400 hover:text-blue-300 font-semibold disabled:text-slate-600 disabled:cursor-not-allowed transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
              </button>
            </div>

            <p className="mt-6 text-center text-slate-500 text-[10px]">
              The OTP expires in 10 minutes for security.
            </p>
          </>
        )}
      </div>

      <p className="mt-4 text-center text-slate-600 text-xs">
        Wrong email?{' '}
        <a href="/auth/register" className="text-blue-400 hover:text-blue-300 font-medium">Register again</a>
      </p>
    </div>
  );
}

export default function VerifyOTPPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: 'linear-gradient(rgba(148,163,184,1) 1px, transparent 1px), linear-gradient(to right, rgba(148,163,184,1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      />
      <Suspense fallback={
        <div className="p-8 text-center text-white">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          Loading secure page...
        </div>
      }>
        <VerifyOTPContent />
      </Suspense>
    </div>
  );
}

