'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, Sparkles, ArrowRight, Phone, BookOpen, GraduationCap, Trophy, Target, Star } from 'lucide-react';
import { loginUser, sendOTP, verifyOTP } from '@/services/auth';
import { useAuthStore } from '@/stores/authStore';

const LoginSchema = z.object({
  email:    z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

const OTPSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'OTP must be numeric')
});

type LoginForm = z.infer<typeof LoginSchema>;
type OTPForm   = z.infer<typeof OTPSchema>;
type LoginMode = 'password' | 'otp-send' | 'otp-verify';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/student/dashboard';
  const { setAuth } = useAuthStore();

  const [mode, setMode] = useState<LoginMode>('password');
  const [otpIdentifier, setOtpIdentifier] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(LoginSchema) });
  const otpForm   = useForm<OTPForm>({ resolver: zodResolver(OTPSchema) });

  const startCountdown = () => {
    setOtpCountdown(60);
    const interval = setInterval(() => {
      setOtpCountdown(prev => { if (prev <= 1) { clearInterval(interval); return 0; } return prev - 1; });
    }, 1000);
  };

  const handlePasswordLogin = async (data: LoginForm) => {
    setError('');
    setIsSubmitting(true);
    const res = await loginUser(data.email, data.password);
    setIsSubmitting(false);
    if (res.success && res.data) {
      setAuth(res.data.user, res.data.accessToken);
      const role = res.data.user.role;
      if (role === 'admin') router.push('/admin');
      else if (role === 'faculty') router.push('/faculty/dashboard');
      else router.push(redirectTo);
    } else {
      setError(res.error || 'Invalid email or password.');
    }
  };

  const handleSendOTP = async () => {
    const identifier = otpIdentifier.trim();
    if (!identifier) { setError('Enter your email or mobile number.'); return; }
    setError('');
    setIsSubmitting(true);
    const type = identifier.includes('@') ? 'email' : 'mobile';
    const res = await sendOTP(identifier, type, 'login');
    setIsSubmitting(false);
    if (res.success) {
      setMode('otp-verify');
      startCountdown();
    } else {
      setError(res.error || 'Failed to send OTP.');
    }
  };

  const handleVerifyOTP = async (data: OTPForm) => {
    setError('');
    setIsSubmitting(true);
    const type = otpIdentifier.includes('@') ? 'email' : 'mobile';
    const res = await verifyOTP(otpIdentifier, type, data.otp, 'login');
    setIsSubmitting(false);
    if (res.success && res.data) {
      setAuth(res.data.user, res.data.accessToken);
      const role = res.data.user.role;
      if (role === 'admin') router.push('/admin');
      else if (role === 'faculty') router.push('/faculty/dashboard');
      else router.push(redirectTo);
    } else {
      setError(res.error || 'Invalid or expired OTP.');
    }
  };

  return (
    <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative z-10"
      style={{ backdropFilter: 'blur(24px)' }}>

      {/* ── Left Panel ── */}
      <div className="hidden lg:flex flex-col justify-between relative overflow-hidden p-10"
        style={{ background: 'linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(23,37,84,0.92) 50%, rgba(15,23,42,0.95) 100%)' }}>

        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />

        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-amber-500/25 bg-amber-500/10">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-amber-200 font-extrabold uppercase tracking-widest">Aspirant Portal</span>
          </div>
          <h2 className="text-3xl font-heading font-black text-white leading-tight">
            One Mentor. One Strategy. One Final Attempt.
          </h2>
          <p className="text-slate-400 text-xs leading-relaxed">
            Welcome to the Student learning dashboard. Access assignments, syllabus, real-time feedback, and dynamic mentorship logs.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-10 h-10 text-amber-500 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">LMS Dashboard</h4>
              <p className="text-[10px] text-slate-400">Review syllabus, quizzes, and marks logs.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="flex flex-col justify-center p-8 sm:p-10"
        style={{ background: 'rgba(2, 6, 23, 0.88)', backdropFilter: 'blur(32px)' }}>

        <div className="flex lg:hidden items-center gap-2 mb-8">
          <span className="text-white font-bold tracking-tight">Final Attempt Student</span>
        </div>

        <h2 className="text-2xl font-bold text-white mb-1">Student Login</h2>
        <p className="text-slate-400 text-xs mb-6">Sign in to access your student space</p>

        {/* Mode toggle */}
        <div className="flex gap-1 p-1 rounded-xl mb-6 border border-white/[0.08]"
          style={{ background: 'rgba(255,255,255,0.04)' }}>
          <button
            onClick={() => { setMode('password'); setError(''); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === 'password' ? 'text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
            style={mode === 'password' ? { background: 'linear-gradient(135deg, #92400e, #D97706)' } : {}}
          >
            Password Login
          </button>
          <button
            onClick={() => { setMode('otp-send'); setError(''); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              mode !== 'password' ? 'text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
            style={mode !== 'password' ? { background: 'linear-gradient(135deg, #92400e, #D97706)' } : {}}
          >
            OTP Login
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 p-3 rounded-xl text-red-300 text-xs font-medium border border-red-500/20"
            style={{ background: 'rgba(239,68,68,0.08)' }}>
            {error}
          </div>
        )}

        {/* Password Login */}
        {mode === 'password' && (
          <form onSubmit={loginForm.handleSubmit(handlePasswordLogin)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  {...loginForm.register('email')}
                  type="email"
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-white text-sm placeholder:text-slate-600 focus:outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  onFocus={e => { e.currentTarget.style.border = '1px solid rgba(245,158,11,0.7)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.12)'; }}
                  onBlur={e => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>
              {loginForm.formState.errors.email && (
                <p className="text-red-400 text-[10px]">{loginForm.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
                <Link href="/auth/forgot-password" className="text-[10px] text-amber-500 hover:text-amber-400 font-medium transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  {...loginForm.register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-11 py-3 rounded-xl text-white text-sm placeholder:text-slate-600 focus:outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  onFocus={e => { e.currentTarget.style.border = '1px solid rgba(245,158,11,0.7)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.12)'; }}
                  onBlur={e => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {loginForm.formState.errors.password && (
                <p className="text-red-400 text-[10px]">{loginForm.formState.errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3.5 text-white font-bold rounded-xl text-sm transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)', boxShadow: '0 4px 24px rgba(217,119,6,0.35)' }}
            >
              {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        )}

        {/* OTP Send */}
        {mode === 'otp-send' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email or Mobile Number</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  value={otpIdentifier}
                  onChange={e => setOtpIdentifier(e.target.value)}
                  placeholder="email@example.com or 9876543210"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-white text-sm placeholder:text-slate-600 focus:outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  onFocus={e => { e.currentTarget.style.border = '1px solid rgba(99,102,241,0.6)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; }}
                  onBlur={e => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>
            </div>
            <button
              onClick={handleSendOTP}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3.5 text-white font-bold rounded-xl text-sm transition-all hover:-translate-y-0.5 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #D97706, #F59E0B)', boxShadow: '0 4px 24px rgba(217,119,6,0.35)' }}
            >
              {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><span>Send OTP</span><ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>
        )}

        {/* OTP Verify */}
        {mode === 'otp-verify' && (
          <form onSubmit={otpForm.handleSubmit(handleVerifyOTP)} className="space-y-4">
            <div className="p-3 rounded-xl text-blue-300 text-xs border border-blue-500/20"
              style={{ background: 'rgba(59,130,246,0.08)' }}>
              OTP sent to <span className="font-bold">{otpIdentifier}</span>. Check your inbox.
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Enter 6-Digit OTP</label>
              <input
                {...otpForm.register('otp')}
                placeholder="• • • • • •"
                maxLength={6}
                className="w-full text-center py-4 rounded-xl text-white text-2xl font-bold tracking-[0.5em] placeholder:text-slate-700 focus:outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                onFocus={e => { e.currentTarget.style.border = '1px solid rgba(99,102,241,0.6)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; }}
                onBlur={e => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
              />
              {otpForm.formState.errors.otp && <p className="text-red-400 text-[10px]">{otpForm.formState.errors.otp.message}</p>}
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 text-white font-bold rounded-xl text-sm transition-all hover:-translate-y-0.5 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #D97706, #F59E0B)', boxShadow: '0 4px 24px rgba(217,119,6,0.35)' }}
              >
                {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Verify OTP'}
              </button>
              <button
                type="button"
                onClick={handleSendOTP}
                disabled={otpCountdown > 0 || isSubmitting}
                className="px-4 py-3.5 text-slate-300 font-semibold rounded-xl text-xs disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:text-white"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                {otpCountdown > 0 ? `${otpCountdown}s` : 'Resend'}
              </button>
            </div>
          </form>
        )}

        <p className="mt-6 text-center text-slate-555 text-xs">
          Don't have an account?{' '}
          <Link href="/auth/register" className="text-amber-500 font-bold hover:text-amber-400 transition-colors">
            Create one free
          </Link>
        </p>
        <Link href="/" className="mt-4 text-center block text-slate-500 hover:text-slate-400 text-xs transition-colors">
          ← Back to main site
        </Link>
      </div>
    </div>
  );
}

export default function StudentLoginPage() {
  return (
    <>
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-18px) rotate(5deg); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(-4deg); }
        }
        @keyframes drift {
          0% { transform: translateX(0) translateY(0); }
          33% { transform: translateX(30px) translateY(-20px); }
          66% { transform: translateX(-20px) translateY(15px); }
          100% { transform: translateX(0) translateY(0); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.30; }
        }
        .animate-float-slow { animation: float-slow 7s ease-in-out infinite; }
        .animate-float-medium { animation: float-medium 5s ease-in-out infinite; }
        .animate-drift { animation: drift 18s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulse-glow 4s ease-in-out infinite; }
      `}</style>

      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #020617 0%, #0F172A 35%, #1a1000 65%, #0F172A 85%, #020617 100%)' }}>

        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute animate-pulse-glow"
            style={{
              top: '-10%', left: '-5%',
              width: '60vw', height: '60vw',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(217,119,6,0.18) 0%, rgba(245,158,11,0.06) 40%, transparent 70%)',
              filter: 'blur(40px)'
            }} />
        </div>

        <Suspense fallback={
          <div className="p-8 text-center text-white">
            <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            Loading student console...
          </div>
        }>
          <LoginFormContent />
        </Suspense>
      </div>
    </>
  );
}
