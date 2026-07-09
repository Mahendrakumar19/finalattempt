'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, User, Phone, Sparkles, ArrowRight, CheckCircle, BookOpen, GraduationCap, Trophy } from 'lucide-react';
import { registerUser } from '@/services/auth';
import { useAuthStore } from '@/stores/authStore';

const RegisterSchema = z.object({
  fullName:   z.string().min(2, 'Name must be at least 2 characters').max(100),
  email:      z.string().email('Enter a valid email address'),
  mobile:     z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  password:   z.string().min(8, 'Password must be at least 8 characters'),
  targetExam: z.string().optional()
});

type RegisterForm = z.infer<typeof RegisterSchema>;

const EXAMS = ['BPSC Foundation Batch', 'BPSC Target Batch', 'Prelims Test Series', 'Mains Answer Writing', 'Interview Guidance'];

const inputBase = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
};
const focusStyle = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  e.currentTarget.style.border = '1px solid rgba(245,158,11,0.7)';
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.12)';
};
const blurStyle = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  e.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)';
  e.currentTarget.style.boxShadow = 'none';
};

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RegisterForm>({ resolver: zodResolver(RegisterSchema) });

  const onSubmit = async (data: RegisterForm) => {
    setError('');
    setIsSubmitting(true);
    const res = await registerUser(data);
    setIsSubmitting(false);

    if (res.success && res.data) {
      setAuth(res.data.user, res.data.accessToken);
      router.push(`/auth/verify-otp?email=${encodeURIComponent(data.email)}&redirect=/student/dashboard`);
    } else {
      setError(res.error || 'Registration failed. Please try again.');
    }
  };

  const benefits = [
    'Personalized BPSC study plan',
    'Access to live & recorded classes',
    'Mentor connect & doubt resolution',
    'Bihar-focused current affairs daily',
    'Performance analytics dashboard'
  ];

  return (
    <>
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-14px) rotate(4deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.12; }
          50% { opacity: 0.25; }
        }
        .animate-float-slow { animation: float-slow 7s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulse-glow 4s ease-in-out infinite; }
      `}</style>

      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #020617 0%, #0F172A 35%, #1a1000 65%, #0F172A 85%, #020617 100%)' }}>

        {/* Nebula orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute animate-pulse-glow"
            style={{ top: '-10%', right: '-5%', width: '55vw', height: '55vw', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(217,119,6,0.16) 0%, rgba(245,158,11,0.05) 40%, transparent 70%)',
              filter: 'blur(40px)' }} />
          <div className="absolute animate-pulse-glow"
            style={{ bottom: '-15%', left: '-10%', width: '50vw', height: '50vw', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(30,58,138,0.28) 0%, rgba(30,58,138,0.08) 40%, transparent 70%)',
              filter: 'blur(50px)', animationDelay: '2s' }} />
          <div className="absolute animate-pulse-glow"
            style={{ top: '40%', right: '20%', width: '25vw', height: '25vw', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(180,83,9,0.09) 0%, transparent 70%)',
              filter: 'blur(25px)', animationDelay: '1.5s' }} />
        </div>

        {/* Floating educational icons */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
          <div className="absolute animate-float-slow opacity-[0.05]" style={{ top: '10%', left: '4%' }}>
            <BookOpen className="w-20 h-20 text-amber-400" />
          </div>
          <div className="absolute animate-float-slow opacity-[0.04]" style={{ bottom: '15%', right: '5%', animationDelay: '2s' }}>
            <GraduationCap className="w-18 h-18 text-amber-300" />
          </div>
          <div className="absolute animate-float-slow opacity-[0.04]" style={{ top: '55%', left: '3%', animationDelay: '3.5s' }}>
            <Trophy className="w-14 h-14 text-amber-400" />
          </div>
          {/* Floating rings */}
          <div className="absolute rounded-full border border-amber-500/10"
            style={{ width: 100, height: 100, top: '20%', right: '10%' }} />
          <div className="absolute rounded-full border border-blue-800/20"
            style={{ width: 60, height: 60, bottom: '25%', left: '8%' }} />
        </div>

        {/* Fine grid */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{ backgroundImage: 'linear-gradient(rgba(148,163,184,1) 1px, transparent 1px), linear-gradient(to right, rgba(148,163,184,1) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

        {/* Card */}
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-5 gap-0 rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative z-10">

          {/* Left: Benefits Panel */}
          <div className="hidden lg:flex flex-col justify-center p-8 border-r lg:col-span-2"
            style={{ background: 'rgba(15,23,42,0.92)', backdropFilter: 'blur(24px)', borderColor: 'rgba(245,158,11,0.12)' }}>

            {/* Logo */}
            <div className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md"
                style={{ background: 'linear-gradient(135deg, #0F172A, #1E3A8A)', border: '1px solid rgba(245,158,11,0.4)' }}>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-white font-bold text-sm tracking-tight">Final Attempt <span className="text-amber-400">IAS</span></span>
            </div>

            <h2 className="text-xl font-bold text-white mb-2">Start Your Journey</h2>
            <p className="text-slate-400 text-xs leading-relaxed mb-8">
              Join thousands of BPSC aspirants who cleared with Final Attempt's structured mentorship.
            </p>

            <div className="space-y-3">
              {benefits.map(b => (
                <div key={b} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>
                    <CheckCircle className="w-3 h-3 text-amber-400" />
                  </div>
                  <span className="text-slate-300 text-xs">{b}</span>
                </div>
              ))}
            </div>

            {/* Platform stats */}
            <div className="mt-8 p-4 rounded-2xl border" style={{ background: 'rgba(245,158,11,0.04)', borderColor: 'rgba(245,158,11,0.15)' }}>
              <p className="text-amber-500/80 text-[10px] mb-3 uppercase tracking-wider font-bold">Platform Stats</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: '1,500+', label: 'Active Students' },
                  { value: '420+', label: 'Selections' },
                  { value: '95%', label: 'Satisfaction' },
                  { value: '4', label: 'Expert Faculty' }
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <p className="text-amber-400 font-bold text-base">{s.value}</p>
                    <p className="text-slate-500 text-[10px]">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Registration Form */}
          <div className="flex flex-col justify-center p-8 sm:p-10 lg:col-span-3"
            style={{ background: 'rgba(2,6,23,0.90)', backdropFilter: 'blur(32px)' }}>

            {/* Mobile logo */}
            <div className="flex lg:hidden items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #0F172A, #1E3A8A)', border: '1px solid rgba(245,158,11,0.4)' }}>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-white font-bold tracking-tight">Final Attempt <span className="text-amber-400">IAS</span></span>
            </div>

            <h2 className="text-2xl font-bold text-white mb-1">Create your account</h2>
            <p className="text-slate-400 text-sm mb-6">Free to join. Start your BPSC preparation today.</p>

            {error && (
              <div className="mb-4 p-3 rounded-xl text-red-300 text-xs font-medium border border-red-500/20"
                style={{ background: 'rgba(239,68,68,0.08)' }}>
                {error}
              </div>
            )}

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    {...form.register('fullName')}
                    placeholder="Your full name"
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-white text-sm placeholder:text-slate-600 focus:outline-none transition-all"
                    style={inputBase}
                    onFocus={focusStyle}
                    onBlur={blurStyle}
                  />
                </div>
                {form.formState.errors.fullName && <p className="text-red-400 text-[10px]">{form.formState.errors.fullName.message}</p>}
              </div>

              {/* Email + Mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      {...form.register('email')}
                      type="email"
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-white text-sm placeholder:text-slate-600 focus:outline-none transition-all"
                      style={inputBase}
                      onFocus={focusStyle}
                      onBlur={blurStyle}
                    />
                  </div>
                  {form.formState.errors.email && <p className="text-red-400 text-[10px]">{form.formState.errors.email.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mobile Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      {...form.register('mobile')}
                      type="tel"
                      placeholder="10-digit mobile"
                      maxLength={10}
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-white text-sm placeholder:text-slate-600 focus:outline-none transition-all"
                      style={inputBase}
                      onFocus={focusStyle}
                      onBlur={blurStyle}
                    />
                  </div>
                  {form.formState.errors.mobile && <p className="text-red-400 text-[10px]">{form.formState.errors.mobile.message}</p>}
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    {...form.register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    className="w-full pl-10 pr-11 py-3 rounded-xl text-white text-sm placeholder:text-slate-600 focus:outline-none transition-all"
                    style={inputBase}
                    onFocus={focusStyle}
                    onBlur={blurStyle}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {form.formState.errors.password && <p className="text-red-400 text-[10px]">{form.formState.errors.password.message}</p>}
              </div>

              {/* Target Exam */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Program (Optional)</label>
                <select
                  {...form.register('targetExam')}
                  className="w-full px-4 py-3 rounded-xl text-sm text-slate-300 focus:outline-none transition-all appearance-none cursor-pointer"
                  style={{ ...inputBase, background: 'rgba(255,255,255,0.05)' }}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                >
                  <option value="" style={{ background: '#0F172A' }}>Select a program...</option>
                  {EXAMS.map(e => <option key={e} value={e} style={{ background: '#0F172A' }}>{e}</option>)}
                </select>
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
                  <><span>Create Account</span><ArrowRight className="w-4 h-4" /></>
                )}
              </button>

              <p className="text-center text-slate-600 text-[10px]">
                By creating an account, you agree to our Terms of Service and Privacy Policy.
              </p>
            </form>

            <p className="mt-4 text-center text-slate-500 text-xs">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-amber-500 font-semibold hover:text-amber-400 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
