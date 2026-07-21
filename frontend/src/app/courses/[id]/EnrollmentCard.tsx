'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { checkEnrollment, createRazorpayOrder, verifyRazorpayPayment } from '@/services/auth';

interface EnrollmentCardProps {
  courseId: string;
  fee: string;
}

export default function EnrollmentCard({ courseId, fee }: EnrollmentCardProps) {
  const { user, accessToken, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      setLoading(false);
      return;
    }

    const check = async () => {
      try {
        const res = await checkEnrollment(courseId, accessToken);
        if (res.success && res.data) {
          setIsEnrolled(res.data.enrolled);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    check();
  }, [courseId, isAuthenticated, accessToken]);

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleEnrollment = async () => {
    if (!isAuthenticated || !accessToken) {
      // Redirect to login page and redirect back after login
      router.push(`/auth/login/student?redirect=/courses/${courseId}`);
      return;
    }

    setError('');
    setBuying(true);

    try {
      // 1. Create order on backend
      const res = await createRazorpayOrder(courseId, accessToken);
      if (!res.success || !res.data) {
        throw new Error(res.error || 'Failed to initiate purchase.');
      }

      const orderData = res.data;

      // 2. Load SDK script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Razorpay SDK failed to load. Are you connected to the internet?');
      }

      // 3. Open Razorpay payment gateway
      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Final Attempt',
        description: 'BPSC Course Enrollment Payment',
        image: '/favicon.ico',
        order_id: orderData.id,
        handler: async (response: any) => {
          try {
            setBuying(true);
            const verificationPayload = {
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
              courseId,
            };

            const verificationRes = await verifyRazorpayPayment(verificationPayload, accessToken);
            if (verificationRes.success) {
              setIsEnrolled(true);
              router.push(`/student/course/${courseId}`);
            } else {
              setError(verificationRes.error || 'Payment validation failed.');
            }
          } catch (err: any) {
            setError(err.message || 'Signature verification process failed.');
          } finally {
            setBuying(false);
          }
        },
        prefill: {
          name: user?.fullName || '',
          email: user?.email || '',
          contact: user?.mobile || '',
        },
        theme: {
          color: '#1e3a8a',
        },
        modal: {
          ondismiss: () => {
            setBuying(false);
          }
        }
      };

      const razorpayInstance = new (window as any).Razorpay(options);
      razorpayInstance.open();

    } catch (err: any) {
      setError(err.message || 'Payment flow crashed.');
      setBuying(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center p-6 bg-slate-50 border border-slate-100 rounded-3xl animate-pulse">
        <div className="h-6 w-32 bg-slate-200 rounded"></div>
      </div>
    );
  }

  if (isEnrolled) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex gap-3 text-emerald-800 text-xs font-semibold">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p>Enrolled Successfully</p>
            <p className="text-[10px] text-emerald-600 mt-0.5 font-medium">You have lifetime access to this batch.</p>
          </div>
        </div>
        <Link
          href={`/student/course/${courseId}`}
          className="w-full inline-flex items-center justify-center px-4 py-3 bg-brand-primary text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition-colors shadow-md text-center"
        >
          Go to Student Portal
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Course Fees</span>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-brand-primary">{fee}</span>
          <span className="text-xs text-slate-400 font-medium">Bilingual material included</span>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50/90 border border-red-200 rounded-2xl flex gap-2 text-red-700 text-xs">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-3">
        <button
          onClick={handleEnrollment}
          disabled={buying}
          className="w-full inline-flex items-center justify-center px-4 py-3 bg-brand-secondary text-white font-bold rounded-xl text-xs hover:bg-blue-800 transition-colors shadow-md shadow-blue-500/10 text-center disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {buying ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : isAuthenticated ? (
            'Enroll Now via UPI / Card'
          ) : (
            'Login to Enroll'
          )}
        </button>
        <Link
          href="/contact?enquiry=general"
          className="w-full inline-flex items-center justify-center px-4 py-3 bg-slate-50 text-slate-700 font-bold border border-slate-200 rounded-xl text-xs hover:bg-slate-100 transition-colors text-center"
        >
          Request Call Back
        </Link>
      </div>
    </div>
  );
}
