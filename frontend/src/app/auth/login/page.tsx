'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, Sparkles, ArrowRight, Phone } from 'lucide-react';
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

  const [loginRole, setLoginRole] = useState<'student' | 'faculty'>('student');
  const [mode, setMode] = useState<LoginMode>('password');
  const [otpIdentifier, setOtpIdentifier] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
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
      if (role === 'admin') {
        router.push('/admin');
      } else if (role === 'faculty') {
        router.push('/faculty/dashboard');
      } else {
        router.push(redirectTo);
      }
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
      setOtpSent(true);
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
      if (role === 'admin') {
        router.push('/admin');
      } else if (role === 'faculty') {
        router.push('/faculty/dashboard');
      } else {
        router.push(redirectTo);
      }
    } else {
      setError(res.error || 'Invalid or expired OTP.');
    }
  };

  return (
    <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-3xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10 relative z-10">
      
      {/* Left Panel — Brand */}
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-b from-blue-900/60 to-slate-900/80 backdrop-blur-2xl p-10 border-r border-white/10">
        <div>
          <div className="flex items-center gap-2.5 mb-12">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">Final Attempt IAS</span>
          </div>

          <h1 className="text-3xl font-bold text-white leading-snug mb-4">
            Your <span className="text-blue-400">BPSC Success</span><br />Journey Starts Here.
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Access your personalized study plan, mentor sessions, live classes, and performance tracking — all in one powerful dashboard.
          </p>
        </div>

        {/* Feature pills */}
        <div className="space-y-3">
          {[
            { label: 'Personalized 1-on-1 Mentorship', color: 'from-blue-600 to-blue-700' },
            { label: 'Live & Recorded Classes', color: 'from-indigo-600 to-indigo-700' },
            { label: 'Smart Progress Tracking', color: 'from-violet-600 to-violet-700' },
            { label: 'Bihar-Focused Current Affairs', color: 'from-cyan-600 to-cyan-700' }
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${f.color} shadow-lg`} />
              <span className="text-slate-350 text-xs font-medium">{f.label}</span>
            </div>
          ))}

          {/* Testimonial */}
          <div className="mt-8 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur">
            <p className="text-slate-350 text-xs leading-relaxed italic">
              "Final Attempt's structured approach and daily mentorship helped me clear BPSC 69th in my first attempt. The personalized schedule was a game-changer."
            </p>
            <div className="flex items-center gap-2 mt-3">
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold">AK</div>
              <div>
                <p className="text-white text-[11px] font-bold">Ankita Kumari</p>
                <p className="text-slate-400 text-[10px]">AIR 23 · BPSC 69th · Deputy Collector</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="bg-slate-900/90 backdrop-blur-2xl p-8 sm:p-10 flex flex-col justify-center">
        {/* Logo for mobile */}
        <div className="flex lg:hidden items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold tracking-tight">Final Attempt</span>
        </div>

        <h2 className="text-2xl font-bold text-white mb-1">Welcome back</h2>

        {/* Role Toggle Tab */}
        <div className="flex gap-1 bg-slate-800/40 p-1 rounded-xl mb-4 border border-white/5">
          <button
            type="button"
            onClick={() => setLoginRole('student')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${loginRole === 'student' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            Aspirant Login
          </button>
          <button
            type="button"
            onClick={() => setLoginRole('faculty')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${loginRole === 'faculty' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            Instructor Login
          </button>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-1 bg-slate-800/60 p-1 rounded-xl mb-6 border border-white/5">
          <button
            onClick={() => { setMode('password'); setError(''); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${mode === 'password' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            Password Login
          </button>
          <button
            onClick={() => { setMode('otp-send'); setError(''); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${mode !== 'password' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            OTP Login
          </button>
        </div>


        {/* Error banner */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-medium">
            {error}
          </div>
        )}

        {/* ── Password Login ── */}
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
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/60 border border-slate-700/60 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all"
                />
              </div>
              {loginForm.formState.errors.email && (
                <p className="text-red-400 text-[10px]">{loginForm.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
                <Link href="/auth/forgot-password" className="text-[10px] text-blue-400 hover:text-blue-300 font-medium transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  {...loginForm.register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-11 py-3 bg-slate-800/60 border border-slate-700/60 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all"
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
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-900/30 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ── OTP Send ── */}
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
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/60 border border-slate-700/60 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                />
              </div>
            </div>
            <button
              onClick={handleSendOTP}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-sm shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><span>Send OTP</span><ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>
        )}

        {/* ── OTP Verify ── */}
        {mode === 'otp-verify' && (
          <form onSubmit={otpForm.handleSubmit(handleVerifyOTP)} className="space-y-4">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-300 text-xs">
              OTP sent to <span className="font-bold">{otpIdentifier}</span>. Check your inbox.
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Enter 6-Digit OTP</label>
              <input
                {...otpForm.register('otp')}
                placeholder="• • • • • •"
                maxLength={6}
                className="w-full text-center py-4 bg-slate-800/60 border border-slate-700/60 rounded-xl text-white text-2xl font-bold tracking-[0.5em] placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
              />
              {otpForm.formState.errors.otp && <p className="text-red-400 text-[10px]">{otpForm.formState.errors.otp.message}</p>}
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-sm shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-60"
              >
                {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Verify OTP'}
              </button>
              <button
                type="button"
                onClick={handleSendOTP}
                disabled={otpCountdown > 0 || isSubmitting}
                className="px-4 py-3.5 bg-slate-800 border border-slate-700 text-slate-300 font-semibold rounded-xl text-xs hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {otpCountdown > 0 ? `${otpCountdown}s` : 'Resend'}
              </button>
            </div>
          </form>
        )}

        <p className="mt-6 text-center text-slate-500 text-xs">
          Don't have an account?{' '}
          <Link href="/auth/register" className="text-blue-400 font-semibold hover:text-blue-300 transition-colors">
            Create one free
          </Link>
        </p>

        <Link href="/" className="mt-4 text-center block text-slate-600 hover:text-slate-400 text-xs transition-colors">
          ← Back to main site
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-0 w-64 h-64 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Background grid */}
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
        <LoginFormContent />
      </Suspense>
    </div>
  );
}
