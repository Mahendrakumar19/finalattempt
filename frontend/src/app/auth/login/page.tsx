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

  const [loginRole, setLoginRole] = useState<'student' | 'faculty'>('student');
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

      {/* ── Left Panel — Brand & Educational Info ── */}
      <div className="hidden lg:flex flex-col justify-between relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(23,37,84,0.92) 50%, rgba(15,23,42,0.95) 100%)' }}>

        {/* Decorative inner glows */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full opacity-15 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #818cf8 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />

        {/* Floating educational icons */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Book icon top-right area */}
          <div className="absolute top-16 right-8 opacity-10 animate-float-slow">
            <BookOpen className="w-12 h-12 text-blue-300" />
          </div>
          {/* Star bottom-right */}
          <div className="absolute bottom-32 right-12 opacity-10 animate-float-medium">
            <Star className="w-8 h-8 text-indigo-300" />
          </div>
          {/* Trophy mid-left */}
          <div className="absolute top-1/2 left-6 opacity-8 animate-float-slow" style={{ animationDelay: '1s' }}>
            <Trophy className="w-10 h-10 text-amber-300" />
          </div>
          {/* Target icon */}
          <div className="absolute top-1/3 right-4 opacity-8 animate-float-medium" style={{ animationDelay: '2s' }}>
            <Target className="w-7 h-7 text-cyan-300" />
          </div>

          {/* Horizontal lines simulating ruled notebook paper */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
            {Array.from({ length: 20 }).map((_, i) => (
              <line key={i} x1="0" y1={40 + i * 32} x2="100%" y2={40 + i * 32} stroke="#94a3b8" strokeWidth="1" />
            ))}
            {/* Vertical margin line */}
            <line x1="48" y1="0" x2="48" y2="100%" stroke="#f472b6" strokeWidth="1.5" />
          </svg>

          {/* Dotted grid overlay */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
            <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="#94a3b8" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10 p-10">
          <div className="flex items-center gap-2.5 mb-12">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">Final Attempt IAS</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 mb-4">
            <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-blue-400 text-[10px] font-bold uppercase tracking-wider">Bihar's #1 BPSC Academy</span>
          </div>

          <h1 className="text-3xl font-bold text-white leading-snug mb-4">
            Your <span className="text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(135deg, #60a5fa, #a78bfa)' }}>BPSC Success</span>
            <br />Journey Starts Here.
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
            Access your personalized study plan, mentor sessions, live classes, and performance tracking — all in one powerful dashboard.
          </p>
        </div>

        {/* Feature pills & testimonial */}
        <div className="relative z-10 p-10 space-y-3">
          {[
            { label: 'Personalized 1-on-1 Mentorship', color: '#3b82f6' },
            { label: 'Live & Recorded Classes', color: '#6366f1' },
            { label: 'Smart Progress Tracking', color: '#8b5cf6' },
            { label: 'Bihar-Focused Current Affairs', color: '#06b6d4' }
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full shadow-lg shrink-0" style={{ backgroundColor: f.color, boxShadow: `0 0 8px ${f.color}80` }} />
              <span className="text-slate-300 text-xs font-medium">{f.label}</span>
            </div>
          ))}

          <div className="mt-8 p-4 rounded-2xl border border-white/10"
            style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(8px)' }}>
            <p className="text-slate-300 text-xs leading-relaxed italic">
              "Final Attempt's structured approach and daily mentorship helped me clear BPSC 69th in my first attempt."
            </p>
            <div className="flex items-center gap-2 mt-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>AK</div>
              <div>
                <p className="text-white text-[11px] font-bold">Ankita Kumari</p>
                <p className="text-slate-400 text-[10px]">AIR 23 · BPSC 69th · Deputy Collector</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Panel — Login Form ── */}
      <div className="flex flex-col justify-center p-8 sm:p-10"
        style={{ background: 'rgba(2, 6, 23, 0.88)', backdropFilter: 'blur(32px)' }}>

        {/* Logo for mobile */}
        <div className="flex lg:hidden items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold tracking-tight">Final Attempt IAS</span>
        </div>

        <h2 className="text-2xl font-bold text-white mb-1">Welcome back</h2>
        <p className="text-slate-400 text-xs mb-6">Sign in to continue your BPSC preparation</p>

        {/* Role Toggle Tab */}
        <div className="flex gap-1 p-1 rounded-xl mb-4 border border-white/[0.08]"
          style={{ background: 'rgba(255,255,255,0.04)' }}>
          <button
            type="button"
            onClick={() => setLoginRole('student')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              loginRole === 'student'
                ? 'text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            style={loginRole === 'student' ? { background: 'linear-gradient(135deg, #92400e, #D97706)' } : {}}
          >
            Aspirant Login
          </button>
          <button
            type="button"
            onClick={() => setLoginRole('faculty')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              loginRole === 'faculty'
                ? 'text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            style={loginRole === 'faculty' ? { background: 'linear-gradient(135deg, #92400e, #D97706)' } : {}}
          >
            Instructor Login
          </button>
        </div>

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
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-white text-sm placeholder:text-slate-600 focus:outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
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
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
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
              className="w-full flex items-center justify-center gap-2 py-3.5 text-white font-bold rounded-xl text-sm transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              style={{
                background: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)',
                boxShadow: '0 4px 24px rgba(217,119,6,0.35)',
              }}
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
              className="w-full flex items-center justify-center gap-2 py-3.5 text-white font-bold rounded-xl text-sm transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #D97706, #F59E0B)', boxShadow: '0 4px 24px rgba(217,119,6,0.35)' }}
            >
              {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><span>Send OTP</span><ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>
        )}

        {/* ── OTP Verify ── */}
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

        <p className="mt-6 text-center text-slate-500 text-xs">
          Don't have an account?{' '}
          <Link href="/auth/register" className="text-amber-500 font-semibold hover:text-amber-400 transition-colors">
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
    <>
      {/* Keyframe animations */}
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

        {/* ── Deep background layer: large soft orbs ── */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Primary gold nebula top-left */}
          <div className="absolute animate-pulse-glow"
            style={{
              top: '-10%', left: '-5%',
              width: '60vw', height: '60vw',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(217,119,6,0.18) 0%, rgba(245,158,11,0.06) 40%, transparent 70%)',
              filter: 'blur(40px)'
            }} />
          {/* Deep navy blue nebula right */}
          <div className="absolute animate-pulse-glow"
            style={{
              bottom: '-15%', right: '-10%',
              width: '55vw', height: '55vw',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(30,58,138,0.30) 0%, rgba(30,58,138,0.10) 40%, transparent 70%)',
              filter: 'blur(50px)',
              animationDelay: '2s'
            }} />
          {/* Amber accent center */}
          <div className="absolute animate-pulse-glow"
            style={{
              top: '40%', left: '20%',
              width: '30vw', height: '30vw',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)',
              filter: 'blur(30px)',
              animationDelay: '1s'
            }} />
          {/* Warm orange bottom-center */}
          <div className="absolute animate-pulse-glow"
            style={{
              bottom: '10%', left: '40%',
              width: '25vw', height: '25vw',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(180,83,9,0.10) 0%, transparent 70%)',
              filter: 'blur(25px)',
              animationDelay: '3s'
            }} />
        </div>

        {/* ── Mid layer: floating educational symbols ── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">

          {/* Large transparent book silhouettes */}
          <div className="absolute animate-float-slow opacity-[0.06]"
            style={{ top: '8%', left: '5%', animationDelay: '0s' }}>
            <BookOpen className="w-24 h-24 text-amber-400" />
          </div>
          <div className="absolute animate-float-medium opacity-[0.05]"
            style={{ top: '12%', right: '8%', animationDelay: '1.5s' }}>
            <GraduationCap className="w-20 h-20 text-indigo-300" />
          </div>
          <div className="absolute animate-float-slow opacity-[0.05]"
            style={{ bottom: '15%', left: '8%', animationDelay: '2s' }}>
            <Trophy className="w-16 h-16 text-amber-300" />
          </div>
          <div className="absolute animate-float-medium opacity-[0.06]"
            style={{ bottom: '20%', right: '6%', animationDelay: '0.5s' }}>
            <Target className="w-20 h-20 text-cyan-300" />
          </div>
          <div className="absolute animate-float-slow opacity-[0.04]"
            style={{ top: '45%', left: '3%', animationDelay: '3s' }}>
            <Star className="w-14 h-14 text-violet-300" />
          </div>
          <div className="absolute animate-float-medium opacity-[0.04]"
            style={{ top: '60%', right: '3%', animationDelay: '1s' }}>
            <BookOpen className="w-12 h-12 text-blue-200" />
          </div>

          {/* Floating text elements (UPSC/BPSC keywords) */}
          {[
            { text: 'BPSC', top: '15%', left: '15%', delay: '0s', size: '3rem', opacity: 0.04 },
            { text: 'UPSC', top: '70%', right: '15%', delay: '1.5s', size: '2.5rem', opacity: 0.04 },
            { text: 'IAS', top: '35%', right: '18%', delay: '2.5s', size: '4rem', opacity: 0.03 },
            { text: 'GS', bottom: '35%', left: '12%', delay: '1s', size: '3.5rem', opacity: 0.03 },
            { text: 'PCS', top: '80%', left: '30%', delay: '3s', size: '2rem', opacity: 0.03 },
          ].map((item, i) => (
            <div
              key={i}
              className="absolute animate-float-medium font-black tracking-wider text-slate-300"
              style={{
                top: item.top,
                bottom: (item as any).bottom,
                left: item.left,
                right: item.right,
                fontSize: item.size,
                opacity: item.opacity,
                animationDelay: item.delay,
                fontFamily: 'serif',
                letterSpacing: '0.1em'
              }}
            >
              {item.text}
            </div>
          ))}

          {/* Geometric shapes: circles and rings */}
          <div className="absolute animate-drift opacity-[0.06] rounded-full border-2 border-blue-400"
            style={{ width: 120, height: 120, top: '25%', left: '12%' }} />
          <div className="absolute animate-drift opacity-[0.05] rounded-full border border-indigo-400"
            style={{ width: 80, height: 80, bottom: '30%', right: '14%', animationDelay: '4s' }} />
          <div className="absolute animate-drift opacity-[0.04] rounded-full border border-cyan-400"
            style={{ width: 50, height: 50, top: '55%', right: '25%', animationDelay: '8s' }} />
          <div className="absolute animate-float-slow opacity-[0.06] rounded-full"
            style={{
              width: 200, height: 200, top: '5%', right: '25%',
              background: 'rgba(99,102,241,0.08)',
              backdropFilter: 'blur(2px)',
              border: '1px solid rgba(99,102,241,0.15)'
            }} />
        </div>

        {/* ── Fine grid overlay ── */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{
            backgroundImage: 'linear-gradient(rgba(148,163,184,1) 1px, transparent 1px), linear-gradient(to right, rgba(148,163,184,1) 1px, transparent 1px)',
            backgroundSize: '48px 48px'
          }} />

        {/* ── Top scanline shimmer (very subtle) ── */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

        {/* ── Form card ── */}
        <Suspense fallback={
          <div className="p-8 text-center text-white">
            <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            Loading secure page...
          </div>
        }>
          <LoginFormContent />
        </Suspense>
      </div>
    </>
  );
}
