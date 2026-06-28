'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, User, Phone, Sparkles, ArrowRight, CheckCircle } from 'lucide-react';
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
      // Redirect to OTP verification
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative orbs */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: 'linear-gradient(rgba(148,163,184,1) 1px, transparent 1px), linear-gradient(to right, rgba(148,163,184,1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      />

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-5 gap-0 rounded-3xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10 relative z-10">
        
        {/* Right: Benefits Panel (narrower) */}
        <div className="hidden lg:flex flex-col justify-center bg-gradient-to-b from-indigo-900/50 to-slate-900/80 backdrop-blur-2xl p-8 border-r border-white/10 lg:col-span-2">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-sm tracking-tight">Final Attempt IAS</span>
          </div>
          
          <h2 className="text-xl font-bold text-white mb-2">Start Your Journey</h2>
          <p className="text-slate-400 text-xs leading-relaxed mb-8">Join thousands of BPSC aspirants who cleared with Final Attempt's structured mentorship.</p>
          
          <div className="space-y-3">
            {benefits.map(b => (
              <div key={b} className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-slate-300 text-xs">{b}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-slate-400 text-[10px] mb-2 uppercase tracking-wider font-bold">Platform Stats</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: '1,500+', label: 'Active Students' },
                { value: '420+', label: 'Selections' },
                { value: '95%', label: 'Satisfaction' },
                { value: '4', label: 'Expert Faculty' }
              ].map(s => (
                <div key={s.label} className="text-center">
                  <p className="text-white font-bold text-base">{s.value}</p>
                  <p className="text-slate-500 text-[10px]">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Left: Registration Form */}
        <div className="bg-slate-900/90 backdrop-blur-2xl p-8 sm:p-10 flex flex-col justify-center lg:col-span-3">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold tracking-tight">Final Attempt IAS</span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">Create your account</h2>
          <p className="text-slate-400 text-sm mb-6">Free to join. Start learning today.</p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-medium">
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
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/60 border border-slate-700/60 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                />
              </div>
              {form.formState.errors.fullName && <p className="text-red-400 text-[10px]">{form.formState.errors.fullName.message}</p>}
            </div>

            {/* Email + Mobile grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    {...form.register('email')}
                    type="email"
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/60 border border-slate-700/60 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
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
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/60 border border-slate-700/60 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
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
                  className="w-full pl-10 pr-11 py-3 bg-slate-800/60 border border-slate-700/60 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
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
                className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/60 rounded-xl text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all appearance-none cursor-pointer"
              >
                <option value="">Select a program...</option>
                {EXAMS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-900/30 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed"
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
            <Link href="/auth/login" className="text-blue-400 font-semibold hover:text-blue-300 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
