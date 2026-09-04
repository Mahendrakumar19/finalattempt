'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  ArrowLeft, CheckCircle, BookOpen, Layers, 
  ChevronDown, ChevronUp, Sparkles, PhoneCall, HelpCircle,
  ShoppingBag, ShieldCheck, X, ArrowRight, RefreshCw
} from 'lucide-react';

import { db, TestSeriesItem } from '@/services/db';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/context/LocaleContext';

interface QuizItem {
  id: string;
  title: string;
  sequence_number?: number;
  is_standalone_purchasable?: boolean;
  individual_price?: number;
  timeLimitMins?: number;
  instructions?: string;
  isFree?: boolean;
}

interface TestSeriesPlan {
  id: string;
  series_id: string;
  plan_code: 'MINI' | 'HALF' | 'FULL' | 'COMPLETE';
  title: string;
  description?: string;
  sequence_start_number: number;
  sequence_end_number: number;
  price: number;
  discounted_price?: number;
  included_quiz_ids?: string;
  is_active: boolean;
}

interface UserEntitlement {
  id: string;
  series_id: string;
  entitlement_type: 'INDIVIDUAL_TEST' | 'MINI' | 'HALF' | 'FULL' | 'COMPLETE' | 'LEGACY_ENROLLMENT';
  quiz_id?: string;
  snapshot_max_sequence?: number;
  max_sequence_number?: number;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'SUPERSEDED';
}

interface CartPreviewResult {
  grossAmount: number;
  upgradeCreditAmount: number;
  discountAmount: number;
  netAmount: number;
  items: Array<{
    itemType: string;
    itemTitle: string;
    unitPrice: number;
    quizId?: string;
    planCode?: string;
  }>;
  redundantQuizIdsRemoved: string[];
  highestExistingPlan?: string;
}

export default function TestSeriesDetailPage() {
  const { t } = useTranslation();
  const { user, accessToken } = useAuth();
  const params = useParams();
  const rawSlug = params.slug || params.seriesSlug || params.stageSlug || params.examSlug;
  const slug = Array.isArray(rawSlug) ? rawSlug[rawSlug.length - 1] : (rawSlug as string);

  const [series, setSeries] = useState<TestSeriesItem | null>(null);
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [plans, setPlans] = useState<TestSeriesPlan[]>([]);
  const [entitlements, setEntitlements] = useState<UserEntitlement[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  
  // Selection & Cart State
  const [selectedPackage, setSelectedPackage] = useState<'MINI' | 'HALF' | 'FULL' | 'COMPLETE' | null>(null);
  const [selectedQuizIds, setSelectedQuizIds] = useState<string[]>([]);
  const [cartPreview, setCartPreview] = useState<CartPreviewResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Modals & UI States
  const [paymentState, setPaymentState] = useState<'IDLE' | 'CREATING_ORDER' | 'RAZORPAY_OPEN' | 'VERIFYING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCheckoutDrawer, setShowCheckoutDrawer] = useState(false);

  // ── Load Series, Quizzes, Plans, and User Entitlements ────────────────────
  useEffect(() => {
    async function loadDetail() {
      setLoading(true);
      try {
        const item = await db.getTestSeriesBySlug(slug);
        setSeries(item);
        if (item && item.id) {
          // Fetch quizzes
          const quizList = await db.getTestSeriesQuizzes(item.id);
          const formattedQuizzes = (quizList || []).map((q: QuizItem, idx: number) => ({
            ...q,
            sequence_number: q.sequence_number || idx + 1,
            is_standalone_purchasable: q.is_standalone_purchasable !== false,
            individual_price: q.individual_price || 49
          })).sort((a: QuizItem, b: QuizItem) => (a.sequence_number || 0) - (b.sequence_number || 0));
          
          setQuizzes(formattedQuizzes);

          // Fetch Plans from backend Phase 3 API
          try {
            const planList = await db.getTestSeriesPurchasePlans(item.id);
            setPlans(planList || []);
          } catch (e) {
            console.warn('Failed loading purchase plans:', e);
          }

          // Fetch Entitlements from backend Phase 3 API if logged in
          if (accessToken) {
            try {
              const entList = await db.getStudentEntitlements(item.id, accessToken);
              setEntitlements(entList || []);
            } catch (e) {
              console.warn('Failed loading entitlements:', e);
            }
          }
        }
      } catch (err) {
        console.error('Error loading test series detail:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [slug, accessToken]);

  // ── Fetch Authoritative Server-Side Cart Preview on Selection Change ──────
  useEffect(() => {
    if (!series || !series.id) return;
    
    // Construct cart payload
    const itemsPayload: Array<{ itemType: string; planCode?: string; quizId?: string }> = [];
    
    if (selectedPackage) {
      // Check if user already owns a lower package tier -> mark as UPGRADE_PLAN
      const hasMini = entitlements.some(e => e.entitlement_type === 'MINI' && e.status === 'ACTIVE');
      const hasHalf = entitlements.some(e => e.entitlement_type === 'HALF' && e.status === 'ACTIVE');
      const hasFull = entitlements.some(e => e.entitlement_type === 'FULL' && e.status === 'ACTIVE');
      const isUpgrade = hasMini || hasHalf || hasFull;
      
      itemsPayload.push({
        itemType: isUpgrade ? 'UPGRADE_PLAN' : 'PACKAGE_PLAN',
        planCode: selectedPackage
      });
    }

    selectedQuizIds.forEach(qId => {
      itemsPayload.push({
        itemType: 'INDIVIDUAL_TEST',
        quizId: qId
      });
    });

    if (itemsPayload.length === 0) {
      const resetTimer = setTimeout(() => {
        setCartPreview(null);
      }, 0);
      return () => clearTimeout(resetTimer);
    }

    const timer = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const previewRes = await db.getCartPreview(series.id, itemsPayload, accessToken || undefined);
        if (previewRes && previewRes.success) {
          setCartPreview(previewRes.data);
        } else if (previewRes && previewRes.error) {
          console.warn('Cart preview backend notice:', previewRes.error);
        }
      } catch (err) {
        console.error('Cart preview error:', err);
      } finally {
        setPreviewLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [selectedPackage, selectedQuizIds, series, accessToken, entitlements]);

  // ── Helper: Evaluate Quiz Ownership & Access State ────────────────────────
  function getQuizAccessInfo(quiz: QuizItem) {
    const seq = quiz.sequence_number || 1;
    
    // 1. Check Active Entitlements
    for (const ent of entitlements) {
      if (ent.status !== 'ACTIVE') continue;
      
      if (ent.entitlement_type === 'LEGACY_ENROLLMENT' || ent.entitlement_type === 'COMPLETE') {
        return { isOwned: true, type: ent.entitlement_type, label: '✓ Complete Access', badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' };
      }
      if (ent.entitlement_type === 'FULL') {
        const plan = plans.find(p => p.plan_code === 'FULL');
        let inPlan = seq <= (ent.snapshot_max_sequence || plan?.sequence_end_number || 40);
        if (plan?.included_quiz_ids) {
          try {
            const ids: string[] = JSON.parse(plan.included_quiz_ids);
            if (ids.length > 0) inPlan = ids.includes(quiz.id);
          } catch {}
        }
        if (inPlan) return { isOwned: true, type: 'FULL', label: '✓ Included in FULL', badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' };
      }
      if (ent.entitlement_type === 'HALF') {
        const plan = plans.find(p => p.plan_code === 'HALF');
        let inPlan = seq <= (ent.snapshot_max_sequence || plan?.sequence_end_number || 28);
        if (plan?.included_quiz_ids) {
          try {
            const ids: string[] = JSON.parse(plan.included_quiz_ids);
            if (ids.length > 0) inPlan = ids.includes(quiz.id);
          } catch {}
        }
        if (inPlan) return { isOwned: true, type: 'HALF', label: '✓ Included in HALF', badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' };
      }
      if (ent.entitlement_type === 'MINI') {
        const plan = plans.find(p => p.plan_code === 'MINI');
        let inPlan = seq <= (ent.snapshot_max_sequence || plan?.sequence_end_number || 16);
        if (plan?.included_quiz_ids) {
          try {
            const ids: string[] = JSON.parse(plan.included_quiz_ids);
            if (ids.length > 0) inPlan = ids.includes(quiz.id);
          } catch {}
        }
        if (inPlan) return { isOwned: true, type: 'MINI', label: '✓ Included in MINI', badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' };
      }
      if (ent.entitlement_type === 'INDIVIDUAL_TEST' && ent.quiz_id === quiz.id) {
        return { isOwned: true, type: 'INDIVIDUAL', label: '✓ Purchased', badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' };
      }
    }

    // 2. Check Free Quiz
    if (quiz.isFree) {
      return { isOwned: true, type: 'FREE', label: '✓ Free Demo Test', badgeColor: 'bg-blue-500/10 text-blue-600 border-blue-500/20' };
    }

    // 3. Check Current Cart Selection
    if (selectedPackage) {
      const plan = plans.find(p => p.plan_code === selectedPackage);
      let isCovered = false;
      if (plan) {
        if (plan.included_quiz_ids) {
          try {
            const ids: string[] = JSON.parse(plan.included_quiz_ids);
            if (ids.length > 0) isCovered = ids.includes(quiz.id);
            else isCovered = seq >= plan.sequence_start_number && seq <= plan.sequence_end_number;
          } catch {
            isCovered = seq >= plan.sequence_start_number && seq <= plan.sequence_end_number;
          }
        } else {
          isCovered = seq >= plan.sequence_start_number && seq <= plan.sequence_end_number;
        }
      }
      if (isCovered) {
        return { isOwned: false, isCoveredByCartPackage: true, label: `✓ Included in ${selectedPackage}`, badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/20' };
      }
    }

    if (selectedQuizIds.includes(quiz.id)) {
      return { isOwned: false, isSelectedIndividual: true, label: '✓ Selected in Cart', badgeColor: 'bg-amber-500 text-slate-950 font-bold border-amber-500' };
    }

    // 4. Default Locked State
    return { isOwned: false, isLocked: true, label: `🔒 Locked (₹${quiz.individual_price || 49})`, badgeColor: 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700' };
  }

  // ── Determine Student's Highest Active Tier ───────────────────────────────
  const activePackageEntitlement = entitlements.find(e => e.status === 'ACTIVE' && ['MINI', 'HALF', 'FULL', 'COMPLETE', 'LEGACY_ENROLLMENT'].includes(e.entitlement_type));
  const highestTier = activePackageEntitlement ? activePackageEntitlement.entitlement_type : 'NONE';

  // ── Load Razorpay Script Dynamically ──────────────────────────────────────
  const loadRazorpaySDK = (): Promise<boolean> => {
    return new Promise((resolve) => {
      const win = window as unknown as Record<string, unknown>;
      if (win.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // ── Handle Checkout Trigger ────────────────────────────────────────────────
  const { refresh } = useAuth();
  const handleInitiateCheckout = async () => {
    let effectiveToken = accessToken;
    if (!effectiveToken && typeof window !== 'undefined') {
      effectiveToken = localStorage.getItem('access_token') || localStorage.getItem('token');
    }

    if (!effectiveToken) {
      effectiveToken = await refresh();
    }

    if (!user && !effectiveToken) {
      window.location.href = `/auth/login?redirect=/test-series/program/${slug}`;
      return;
    }

    if (!series || (!selectedPackage && selectedQuizIds.length === 0)) {
      alert('Please select a package or individual test to purchase.');
      return;
    }

    setPaymentState('CREATING_ORDER');
    setErrorMessage(null);

    try {
      // 1. Prepare items payload for backend checkout order creation
      const itemsPayload: Array<{ itemType: string; planCode?: string; quizId?: string }> = [];
      if (selectedPackage) {
        const isUpgrade = highestTier === 'MINI' || highestTier === 'HALF';
        itemsPayload.push({
          itemType: isUpgrade ? 'UPGRADE_PLAN' : 'PACKAGE_PLAN',
          planCode: selectedPackage
        });
      }
      selectedQuizIds.forEach(qId => {
        itemsPayload.push({ itemType: 'INDIVIDUAL_TEST', quizId: qId });
      });

      const userObj = user as Record<string, unknown> | null;
      const uId = (userObj?.id as string) || (userObj?.userId as string) || 'user';
      const idempotencyKey = `idemp_${uId}_${series.id}_${Date.now()}`;

      // 2. Call backend order creation API
      const orderRes = await db.createTestSeriesOrder(series.id, itemsPayload, idempotencyKey, effectiveToken || undefined);
      
      if (!orderRes || !orderRes.success) {
        throw new Error(orderRes?.error || 'Failed to create purchase order.');
      }

      const orderData = orderRes.data;

      // 3. Zero-Amount Order (Instant Free Fulfillment / 100% Upgrade Discount)
      if (orderRes.message?.includes('Zero payable amount') || orderData.isFreeFulfillment) {
        setPaymentState('SUCCESS');
        // Refresh entitlements
        const newEnts = await db.getStudentEntitlements(series.id, effectiveToken || undefined);
        setEntitlements(newEnts || []);
        setSelectedPackage(null);
        setSelectedQuizIds([]);
        setCartPreview(null);
        return;
      }

      // 4. Open Razorpay Checkout Popup for Paid Orders
      setPaymentState('RAZORPAY_OPEN');
      const sdkReady = await loadRazorpaySDK();
      
      if (!sdkReady) {
        // Dev Fallback Simulation if Razorpay SDK script fails to load locally
        console.warn('Razorpay SDK unavailable. Triggering dev simulation verification...');
        const verifyRes = await db.verifyTestSeriesOrder({
          orderId: orderData.orderId,
          razorpayPaymentId: `pay_sim_${Date.now()}`,
          razorpayOrderId: orderData.gatewayOrderId || `order_sim_${Date.now()}`
        }, effectiveToken || undefined);

        if (verifyRes && verifyRes.success) {
          setPaymentState('SUCCESS');
          const newEnts = await db.getStudentEntitlements(series.id, effectiveToken || undefined);
          setEntitlements(newEnts || []);
          setSelectedPackage(null);
          setSelectedQuizIds([]);
          setCartPreview(null);
        } else {
          throw new Error(verifyRes?.error || 'Simulated payment verification failed.');
        }
        return;
      }

      const currentUser = user as Record<string, unknown> | null;

      const options = {
        key: orderData.key || 'rzp_test_TTzBxGpMqc0rAD',
        amount: orderData.netAmount * 100,
        currency: orderData.currency || 'INR',
        name: 'FinalAttempt IAS',
        description: `Purchase for ${series.title}`,
        order_id: orderData.gatewayOrderId,
        prefill: {
          name: (currentUser?.fullName as string) || '',
          email: (currentUser?.email as string) || '',
          contact: (currentUser?.mobile as string) || ''
        },
        theme: { color: '#f59e0b' },
        handler: async function (response: Record<string, unknown>) {
          setPaymentState('VERIFYING');
          try {
            const verifyRes = await db.verifyTestSeriesOrder({
              orderId: orderData.orderId,
              razorpayPaymentId: response.razorpay_payment_id as string,
              razorpayOrderId: response.razorpay_order_id as string,
              razorpaySignature: response.razorpay_signature as string
            }, effectiveToken || undefined);

            if (verifyRes && verifyRes.success) {
              setPaymentState('SUCCESS');
              const newEnts = await db.getStudentEntitlements(series.id, effectiveToken || undefined);
              setEntitlements(newEnts || []);
              setSelectedPackage(null);
              setSelectedQuizIds([]);
              setCartPreview(null);
            } else {
              throw new Error(verifyRes?.error || 'Payment verification failed.');
            }
          } catch (err: unknown) {
            setPaymentState('ERROR');
            const errObj = err as Error;
            setErrorMessage(errObj.message || 'Payment verification failed.');
          }
        },
        modal: {
          ondismiss: function () {
            setPaymentState('IDLE');
          }
        }
      };

      const win = window as unknown as { Razorpay: new (opts: unknown) => { on: (event: string, cb: (res: Record<string, unknown>) => void) => void; open: () => void } };
      const rzp = new win.Razorpay(options);
      rzp.on('payment.failed', function (response: Record<string, unknown>) {
        setPaymentState('ERROR');
        const errDesc = (response.error as Record<string, unknown>)?.description as string;
        setErrorMessage(errDesc || 'Payment failed on Razorpay.');
      });
      rzp.open();

    } catch (err: unknown) {
      console.error('Checkout error:', err);
      setPaymentState('ERROR');
      const errObj = err as Error;
      setErrorMessage(errObj.message || 'Checkout failed. Please try again.');
    }
  };

  // ── Loading Skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 space-y-6">
        <div className="h-8 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
          <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
          <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!series) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <BookOpen className="w-16 h-16 text-slate-400 mx-auto" />
        <h2 className="text-2xl font-heading font-black text-[var(--text-color)]">Test Series Program Not Found</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          The requested test series is currently unavailable or archived.
        </p>
        <Link
          href="/test-series"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-amber-500 text-slate-950 font-bold rounded-2xl text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Test Series Portal</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-color)] pt-6 sm:pt-8 pb-32 px-4 sm:px-6 lg:px-8 font-body space-y-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Navigation Breadcrumb */}
        <Link
          href="/test-series"
          className="text-xs font-bold text-amber-500 hover:text-amber-600 transition-colors inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('testSeries.backToPrograms')}</span>
        </Link>

        {/* ── Compact Header Banner & Active Access Status ─────────────────── */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl overflow-hidden shadow-xs">
          {(series.bannerUrl || series.thumbnailUrl) && (
            <div className="w-full bg-slate-950 relative overflow-hidden flex items-center justify-center border-b border-[var(--card-border)] p-2 sm:p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={series.bannerUrl || series.thumbnailUrl}
                alt={series.title}
                className="w-full max-h-[550px] object-contain rounded-2xl"
                onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
              />
            </div>
          )}

          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-md">
                    {series.exam || 'BPSC'}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-0.5 rounded-md">
                    {series.language || 'Bilingual'} Medium
                  </span>
                  {series.category && (
                    <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-md">
                      {series.category}
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-heading font-black text-[var(--text-color)] leading-snug">
                  {series.title}
                </h1>
              </div>

              {/* Student Access Badge */}
              <div className="bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] px-4 py-3 rounded-2xl flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-amber-500 shrink-0" />
                <div>
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 block">{t('testSeries.myAccessStatus')}</span>
                  <span className="text-xs font-black text-[var(--text-color)]">
                    {highestTier === 'FULL' || highestTier === 'LEGACY_ENROLLMENT' ? t('testSeries.fullAccessUnlocked') :
                     highestTier === 'HALF' ? t('testSeries.halfPackageActive') :
                     highestTier === 'MINI' ? t('testSeries.miniPackageActive') :
                     entitlements.some(e => e.entitlement_type === 'INDIVIDUAL_TEST' && e.status === 'ACTIVE') ? t('testSeries.customIndividualAccess') :
                     t('testSeries.noActivePackage')}
                  </span>
                </div>
              </div>
            </div>

            {series.description && (
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-4xl space-y-3 whitespace-pre-line font-medium">
                {series.description.split(/\n+/).map((paragraph, idx) => {
                  if (paragraph.includes('✓')) {
                    const parts = paragraph.split('✓').map(s => s.trim()).filter(Boolean);
                    return (
                      <div key={idx} className="space-y-1.5 my-2">
                        {parts.map((item, i) => (
                          <div key={i} className="flex items-start gap-2 text-slate-700 dark:text-slate-200">
                            <span className="text-emerald-500 font-black shrink-0 mt-0.5">✓</span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return <p key={idx}>{paragraph}</p>;
                })}
              </div>
            )}

            {/* Quick Metrics Bar */}
            <div className="pt-4 border-t border-[var(--card-border)] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">{t('testSeries.totalMocksPool')}</span>
                <span className="font-bold text-[var(--text-color)]">{quizzes.length || series.totalTests || 40} CBT Tests</span>
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">{t('testSeries.individualTestRate')}</span>
                <span className="font-bold text-[var(--text-color)]">₹49 / Test Paper</span>
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">{t('testSeries.programValidity')}</span>
                <span className="font-bold text-[var(--text-color)]">{series.duration || 'Unlimited Attempts'}</span>
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">{t('testSeries.schedule')}</span>
                {series.schedulePdfUrl ? (
                  <a href={series.schedulePdfUrl} target="_blank" rel="noreferrer" className="text-amber-500 font-bold hover:underline">
                    {t('testSeries.downloadSchedulePdf')}
                  </a>
                ) : (
                  <span className="font-bold text-[var(--text-color)]">Official BPSC CBT Pattern</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION 1: PACKAGE OPTIONS (MINI, HALF, FULL) ───────────────── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-heading font-black text-[var(--text-color)] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>{t('testSeries.choosePackageTier')}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('testSeries.packageTierDesc')}
              </p>
            </div>

            {selectedPackage && (
              <button
                onClick={() => setSelectedPackage(null)}
                className="text-xs text-rose-500 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>{t('testSeries.clearPackage')}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* MINI Package Card */}
            {(() => {
              const planCode = 'MINI';
              const plan: TestSeriesPlan = plans.find(p => p.plan_code === planCode) || {
                id: 'mini-default',
                series_id: series.id,
                plan_code: 'MINI',
                title: 'MINI Package',
                sequence_start_number: 1,
                sequence_end_number: 16,
                price: 299,
                discounted_price: undefined,
                is_active: true
              };

              let customCount = 0;
              if (plan.included_quiz_ids) {
                try { customCount = JSON.parse(plan.included_quiz_ids).length; } catch {}
              }
              const testCount = customCount > 0 ? customCount : (plan.sequence_end_number - plan.sequence_start_number + 1);

              const isOwned = highestTier === 'MINI' || highestTier === 'HALF' || highestTier === 'FULL' || highestTier === 'COMPLETE' || highestTier === 'LEGACY_ENROLLMENT';
              const isSelected = selectedPackage === 'MINI';

              return (
                <div
                  className={`bg-[var(--card-bg)] border-2 rounded-3xl p-6 space-y-5 transition-all relative overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? 'border-amber-500 shadow-xl bg-amber-500/5'
                      : isOwned
                      ? 'border-emerald-500/40 opacity-90'
                      : 'border-[var(--card-border)] hover:border-amber-500/50'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/20">
                          {customCount > 0 ? `${customCount} Selected Tests` : `${t('testSeries.tests')} ${plan.sequence_start_number || 1}–${plan.sequence_end_number}`}
                        </span>
                        <h3 className="font-heading font-black text-xl text-[var(--text-color)] mt-2">
                          {plan.title}
                        </h3>
                      </div>
                      <span className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-black text-slate-500">
                        {testCount}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed">
                      {plan.description || `${t('testSeries.first')} ${plan.sequence_end_number} ${t('testSeries.sequentialTests')}`}
                    </p>

                    {(() => {
                      const p1 = Number(plan.price) || 0;
                      const p2 = plan.discounted_price !== undefined && plan.discounted_price !== null ? Number(plan.discounted_price) : null;
                      let sellingPrice = p1;
                      let originalMrp: number | null = null;
                      if (p2 !== null && p2 > 0) {
                        sellingPrice = Math.min(p1, p2);
                        originalMrp = Math.max(p1, p2);
                        if (sellingPrice === originalMrp) originalMrp = null;
                      }
                      return (
                        <div className="flex items-baseline gap-2 pt-2 border-t border-[var(--card-border)]">
                          <span className="text-2xl font-heading font-black text-[var(--text-color)]">
                            ₹{sellingPrice}
                          </span>
                          {originalMrp !== null && (
                            <span className="text-xs text-slate-400 line-through">₹{originalMrp}</span>
                          )}
                          <span className="text-[10px] text-slate-400 font-medium">{t('testSeries.cumulative')}</span>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="pt-4">
                    {isOwned ? (
                      <div className="w-full py-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold rounded-2xl text-xs text-center border border-emerald-500/20 flex items-center justify-center gap-1.5">
                        <CheckCircle className="w-4 h-4" />
                        <span>{t('testSeries.includedCurrentAccess')}</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedPackage(isSelected ? null : 'MINI')}
                        className={`w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 shadow-md'
                            : 'bg-slate-100 dark:bg-slate-800 text-[var(--text-color)] hover:bg-amber-500 hover:text-slate-950'
                        }`}
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>{isSelected ? t('testSeries.selectedClickRemove') : t('testSeries.selectMini').replace('{price}', plan.price.toString())}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* HALF Package Card */}
            {(() => {
              const planCode = 'HALF';
              const plan: TestSeriesPlan = plans.find(p => p.plan_code === planCode) || {
                id: 'half-default',
                series_id: series.id,
                plan_code: 'HALF',
                title: 'HALF Package',
                sequence_start_number: 1,
                sequence_end_number: 28,
                price: 499,
                discounted_price: undefined,
                is_active: true
              };

              let customCount = 0;
              if (plan.included_quiz_ids) {
                try { customCount = JSON.parse(plan.included_quiz_ids).length; } catch {}
              }
              const testCount = customCount > 0 ? customCount : (plan.sequence_end_number - plan.sequence_start_number + 1);

              const isOwned = highestTier === 'HALF' || highestTier === 'FULL' || highestTier === 'COMPLETE' || highestTier === 'LEGACY_ENROLLMENT';
              const isMiniOwned = highestTier === 'MINI';
              const isSelected = selectedPackage === 'HALF';

              return (
                <div
                  className={`bg-[var(--card-bg)] border-2 rounded-3xl p-6 space-y-5 transition-all relative overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? 'border-amber-500 shadow-xl bg-amber-500/5'
                      : isOwned
                      ? 'border-emerald-500/40 opacity-90'
                      : 'border-[var(--card-border)] hover:border-amber-500/50'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-md border border-indigo-500/20">
                          {customCount > 0 ? `${customCount} Selected Tests` : `${t('testSeries.tests')} ${plan.sequence_start_number || 17}–${plan.sequence_end_number}`}
                        </span>
                        <h3 className="font-heading font-black text-xl text-[var(--text-color)] mt-2">
                          {plan.title}
                        </h3>
                      </div>
                      <span className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-black text-slate-500">
                        {testCount}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed">
                      {plan.description || `${t('testSeries.first')} ${plan.sequence_end_number} ${t('testSeries.cumulatively')}`}
                    </p>

                    {(() => {
                      const p1 = Number(plan.price) || 0;
                      const p2 = plan.discounted_price !== undefined && plan.discounted_price !== null ? Number(plan.discounted_price) : null;
                      let sellingPrice = p1;
                      let originalMrp: number | null = null;
                      if (p2 !== null && p2 > 0) {
                        sellingPrice = Math.min(p1, p2);
                        originalMrp = Math.max(p1, p2);
                        if (sellingPrice === originalMrp) originalMrp = null;
                      }
                      return (
                        <div className="flex flex-col pt-2 border-t border-[var(--card-border)]">
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-heading font-black text-[var(--text-color)]">
                              ₹{sellingPrice}
                            </span>
                            {originalMrp !== null && (
                              <span className="text-xs text-slate-400 line-through">₹{originalMrp}</span>
                            )}
                            <span className="text-[10px] text-slate-400 font-medium">{t('testSeries.cumulative')}</span>
                          </div>

                          {isMiniOwned && (
                            <span className="text-[10px] font-extrabold text-amber-500 mt-1">
                              {t('testSeries.upgradeFromMini')}
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  <div className="pt-4">
                    {isOwned ? (
                      <div className="w-full py-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold rounded-2xl text-xs text-center border border-emerald-500/20 flex items-center justify-center gap-1.5">
                        <CheckCircle className="w-4 h-4" />
                        <span>{t('testSeries.includedCurrentAccess')}</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedPackage(isSelected ? null : 'HALF')}
                        className={`w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 shadow-md'
                            : 'bg-slate-100 dark:bg-slate-800 text-[var(--text-color)] hover:bg-amber-500 hover:text-slate-950'
                        }`}
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>
                          {isSelected
                            ? t('testSeries.selectedClickRemove')
                            : isMiniOwned
                            ? t('testSeries.upgradeToHalf')
                            : t('testSeries.selectHalf').replace('{price}', plan.price.toString())}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* FULL Package Card */}
            {(() => {
              const planCode = 'FULL';
              const plan: TestSeriesPlan = plans.find(p => p.plan_code === planCode) || {
                id: 'full-default',
                series_id: series.id,
                plan_code: 'FULL',
                title: 'FULL Package',
                sequence_start_number: 1,
                sequence_end_number: 40,
                price: 699,
                discounted_price: undefined,
                is_active: true
              };

              let customCount = 0;
              if (plan.included_quiz_ids) {
                try { customCount = JSON.parse(plan.included_quiz_ids).length; } catch {}
              }
              const testCount = customCount > 0 ? customCount : (plan.sequence_end_number - plan.sequence_start_number + 1);

              const isOwned = highestTier === 'FULL' || highestTier === 'COMPLETE' || highestTier === 'LEGACY_ENROLLMENT';
              const isUpgrade = highestTier === 'MINI' || highestTier === 'HALF';
              const isSelected = selectedPackage === 'FULL';

              return (
                <div
                  className={`bg-[var(--card-bg)] border-2 rounded-3xl p-6 space-y-5 transition-all relative overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? 'border-amber-500 shadow-xl bg-amber-500/5'
                      : isOwned
                      ? 'border-emerald-500/40 opacity-90'
                      : 'border-amber-500/40 hover:border-amber-500 shadow-md'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
                          {customCount > 0 ? `${customCount} Selected Tests` : `${t('testSeries.tests')} ${plan.sequence_start_number || 29}–${plan.sequence_end_number}`}
                        </span>
                        <h3 className="font-heading font-black text-xl text-[var(--text-color)] mt-2">
                          {plan.title}
                        </h3>
                      </div>
                      <span className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs font-black">
                        {testCount}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed">
                      {plan.description || `Full package covering tests 1 to ${plan.sequence_end_number}`}
                    </p>

                    {(() => {
                      const p1 = Number(plan.price) || 0;
                      const p2 = plan.discounted_price !== undefined && plan.discounted_price !== null ? Number(plan.discounted_price) : null;
                      let sellingPrice = p1;
                      let originalMrp: number | null = null;
                      if (p2 !== null && p2 > 0) {
                        sellingPrice = Math.min(p1, p2);
                        originalMrp = Math.max(p1, p2);
                        if (sellingPrice === originalMrp) originalMrp = null;
                      }
                      return (
                        <div className="flex flex-col pt-2 border-t border-[var(--card-border)]">
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-heading font-black text-[var(--text-color)]">
                              ₹{sellingPrice}
                            </span>
                            {originalMrp !== null && (
                              <span className="text-xs text-slate-400 line-through">₹{originalMrp}</span>
                            )}
                            <span className="text-[10px] text-slate-400 font-medium">{t('testSeries.allInclusive')}</span>
                          </div>

                          {isUpgrade && (
                            <span className="text-[10px] font-extrabold text-amber-500 mt-1">
                              {t('testSeries.upgradeFromTier').replace('{tier}', highestTier)}
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  <div className="pt-4">
                    {isOwned ? (
                      <div className="w-full py-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold rounded-2xl text-xs text-center border border-emerald-500/20 flex items-center justify-center gap-1.5">
                        <CheckCircle className="w-4 h-4" />
                        <span>{t('testSeries.includedCurrentAccess')}</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedPackage(isSelected ? null : 'FULL')}
                        className={`w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 shadow-md'
                            : 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black shadow-md'
                        }`}
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>
                          {isSelected
                            ? t('testSeries.selectedClickRemove')
                            : `Select Full (₹${plan.price})`}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* COMPLETE TEST SERIES Package Card */}
            {(() => {
              const planCode = 'COMPLETE';
              const plan: TestSeriesPlan = plans.find(p => p.plan_code === planCode) || {
                id: 'complete-default',
                series_id: series.id,
                plan_code: 'COMPLETE',
                title: 'COMPLETE Test Series',
                sequence_start_number: 1,
                sequence_end_number: quizzes.length || 40,
                price: 399,
                discounted_price: undefined,
                is_active: true
              };

              let customCount = 0;
              if (plan.included_quiz_ids) {
                try { customCount = JSON.parse(plan.included_quiz_ids).length; } catch {}
              }
              const testCount = customCount > 0 ? customCount : (quizzes.length || plan.sequence_end_number || 40);

              const isOwned = highestTier === 'COMPLETE' || highestTier === 'LEGACY_ENROLLMENT';
              const isUpgrade = highestTier === 'MINI' || highestTier === 'HALF' || highestTier === 'FULL';
              const isSelected = selectedPackage === 'COMPLETE';

              return (
                <div
                  className={`bg-[var(--card-bg)] border-2 rounded-3xl p-6 space-y-5 transition-all relative overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? 'border-emerald-500 shadow-xl bg-emerald-500/5'
                      : isOwned
                      ? 'border-emerald-500/40 opacity-90'
                      : 'border-emerald-500/40 hover:border-emerald-500 shadow-lg'
                  }`}
                >
                  {/* Recommended Badge */}
                  <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-wider">
                    BEST VALUE PASS
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
                          {customCount > 0 ? `${customCount} Selected Tests` : `All Tests (${plan.sequence_start_number || 1}–${testCount})`}
                        </span>
                        <h3 className="font-heading font-black text-xl text-[var(--text-color)] mt-2">
                          {plan.title}
                        </h3>
                      </div>
                      <span className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-black">
                        {testCount}
                      </span>
                    </div>

                    {(() => {
                      const p1 = Number(plan.price) || 0;
                      const p2 = plan.discounted_price !== undefined && plan.discounted_price !== null ? Number(plan.discounted_price) : null;
                      let sellingPrice = p1;
                      let originalMrp: number | null = null;
                      if (p2 !== null && p2 > 0) {
                        sellingPrice = Math.min(p1, p2);
                        originalMrp = Math.max(p1, p2);
                        if (sellingPrice === originalMrp) originalMrp = null;
                      }
                      return (
                        <div className="flex flex-col pt-2 border-t border-[var(--card-border)]">
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-heading font-black text-emerald-600 dark:text-emerald-400">
                              ₹{sellingPrice}
                            </span>
                            {originalMrp !== null && (
                              <span className="text-xs text-slate-400 line-through">₹{originalMrp}</span>
                            )}
                            <span className="text-[10px] text-slate-400 font-medium">All-Inclusive Pass</span>
                          </div>

                          {isUpgrade && (
                            <span className="text-[10px] font-extrabold text-amber-500 mt-1">
                              Upgrade from {highestTier} tier
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  <div className="pt-4">
                    {isOwned ? (
                      <div className="w-full py-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold rounded-2xl text-xs text-center border border-emerald-500/20 flex items-center justify-center gap-1.5">
                        <CheckCircle className="w-4 h-4" />
                        <span>{t('testSeries.fullPassActive')}</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedPackage(isSelected ? null : 'COMPLETE')}
                        className={`w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          isSelected
                            ? 'bg-emerald-500 text-white shadow-md'
                            : 'bg-emerald-500 hover:bg-emerald-600 text-white font-black shadow-md'
                        }`}
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>
                          {isSelected
                            ? t('testSeries.selectedClickRemove')
                            : `Get Complete Series (₹${plan.price})`}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* ── SECTION 2: INDIVIDUAL TEST SELECTION GRID ───────────────────── */}
        <div className="space-y-4 pt-4 border-t border-[var(--card-border)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-heading font-black text-[var(--text-color)] flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-500" />
                <span>{t('testSeries.chooseIndividualTests')}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('testSeries.individualTestsDesc')}
              </p>
            </div>

            {selectedQuizIds.length > 0 && (
              <button
                onClick={() => setSelectedQuizIds([])}
                className="text-xs text-rose-500 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Deselect All Tests ({selectedQuizIds.length})</span>
              </button>
            )}
          </div>

          {/* Test Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {quizzes.map((quiz, idx) => {
              const info = getQuizAccessInfo(quiz);
              const isSelected = selectedQuizIds.includes(quiz.id);

              return (
                <div
                  key={quiz.id || idx}
                  onClick={() => {
                    if (info.isOwned) {
                      const targetUrl = `/test-series/program/${slug}/attempt?quiz=${quiz.id}`;
                      let token = accessToken;
                      if (!token && typeof window !== 'undefined') {
                        token = localStorage.getItem('access_token') || localStorage.getItem('token');
                      }
                      if (!user && !token) {
                        window.location.href = `/auth/login?redirect=${encodeURIComponent(targetUrl)}`;
                        return;
                      }
                      // Navigate to attempt
                      window.location.href = targetUrl;
                    } else if (info.isCoveredByCartPackage) {
                      // Do nothing - already in selected package
                    } else {
                      // Toggle individual test selection or show modal
                      if (isSelected) {
                        setSelectedQuizIds(prev => prev.filter(id => id !== quiz.id));
                      } else {
                        setSelectedQuizIds(prev => [...prev, quiz.id]);
                      }
                    }
                  }}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                    info.isOwned
                      ? 'bg-emerald-500/5 border-emerald-500/30 hover:border-emerald-500/60'
                      : isSelected
                      ? 'bg-amber-500/10 border-amber-500 shadow-md'
                      : info.isCoveredByCartPackage
                      ? 'bg-amber-500/5 border-amber-500/30'
                      : 'bg-[var(--card-bg)] border-[var(--card-border)] hover:border-amber-500/50'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        TEST #{quiz.sequence_number || idx + 1}
                      </span>

                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md border ${info.badgeColor}`}>
                        {info.label}
                      </span>
                    </div>

                    <h4 className="font-heading font-extrabold text-sm text-[var(--text-color)] line-clamp-2 leading-snug">
                      {quiz.title}
                    </h4>
                  </div>

                  <div className="pt-2 border-t border-[var(--card-border)] flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-400 font-bold">
                      ⏱ {quiz.timeLimitMins || 120} Mins
                    </span>

                    {info.isOwned ? (
                      <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <span>Attempt</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    ) : info.isCoveredByCartPackage ? (
                      <span className="text-[10px] font-extrabold text-amber-500">
                        In Package
                      </span>
                    ) : (
                      <span className={`text-xs font-black px-2.5 py-1 rounded-xl transition-colors ${
                        isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 dark:bg-slate-800 text-[var(--text-color)]'
                      }`}>
                        {isSelected ? '✓ Added' : `+ Add (₹${quiz.individual_price || 49})`}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── SECTION 3: SYLLABUS & FAQS ACCORDION ───────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-6 border-t border-[var(--card-border)]">
          <div className="lg:col-span-8 space-y-8">
            {/* Highlights Box */}
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
              <h3 className="font-heading font-black text-lg text-[var(--text-color)] flex items-center gap-2 border-b border-[var(--card-border)] pb-3">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>{t('testSeries.programFeatures')}</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(series.highlights || [
                  t('testSeries.feature1'),
                  t('testSeries.feature2'),
                  t('testSeries.feature3'),
                  'All India Rank & State-level percentile benchmarking'
                ]).map((hl, idx) => (
                  <div key={idx} className="flex gap-3 items-start p-3 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-[var(--card-border)]">
                    <CheckCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span className="text-xs font-medium text-[var(--text-color)] leading-snug">{hl}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQs */}
            {series.faq && series.faq.length > 0 && (
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
                <h3 className="font-heading font-black text-lg text-[var(--text-color)] flex items-center gap-2 border-b border-[var(--card-border)] pb-3">
                  <HelpCircle className="w-5 h-5 text-amber-500" />
                  <span>{t('testSeries.faqTitle')}</span>
                </h3>

                <div className="space-y-3">
                  {series.faq.map((f, idx) => {
                    const isOpen = openFaq === idx;
                    return (
                      <div key={idx} className="border border-[var(--card-border)] rounded-2xl overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setOpenFaq(isOpen ? null : idx)}
                          className="w-full p-4 bg-slate-50 dark:bg-slate-900/40 hover:bg-amber-500/5 flex justify-between items-center text-left transition-colors cursor-pointer"
                        >
                          <span className="font-heading font-bold text-xs sm:text-sm text-[var(--text-color)]">
                            {f.q}
                          </span>
                          {isOpen ? <ChevronUp className="w-4 h-4 text-amber-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                        </button>
                        {isOpen && (
                          <div className="p-4 bg-[var(--card-bg)] border-t border-[var(--card-border)] text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            {f.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 space-y-4">
              <h4 className="font-heading font-extrabold text-sm text-[var(--text-color)] flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-amber-500" />
                <span>{t('testSeries.counselingSupport')}</span>
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t('testSeries.counselingDesc')}
              </p>
              <a
                href="tel:+919709992093"
                className="w-full py-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 border border-amber-500/20"
              >
                <span>{t('testSeries.callHelpline')}</span>
              </a>
            </div>
          </div>
        </div>

      </div>

      {/* ── FLOATING STICKY SELECTION CART BAR & CHECKOUT (MOBILE & DESKTOP) ─ */}
      {(selectedPackage || selectedQuizIds.length > 0) && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-slate-950/95 border-t border-amber-500/30 text-white p-4 sm:p-5 backdrop-blur-md shadow-2xl transition-transform">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* Cart Itemization Summary */}
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-6 h-6" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-heading font-black text-base text-amber-400">
                    {cartPreview ? `₹${cartPreview.netAmount}` : 'Calculating...'}
                  </span>
                  {cartPreview && cartPreview.upgradeCreditAmount > 0 && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                      ₹{cartPreview.upgradeCreditAmount} Credit Applied
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300">
                  {selectedPackage ? `Package: ${selectedPackage}` : ''}
                  {selectedPackage && selectedQuizIds.length > 0 ? ' + ' : ''}
                  {selectedQuizIds.length > 0 ? `${selectedQuizIds.length} Individual Test(s)` : ''}
                  {cartPreview?.redundantQuizIdsRemoved && cartPreview.redundantQuizIdsRemoved.length > 0 && (
                    <span className="text-amber-400 font-bold ml-1">
                      ({cartPreview.redundantQuizIdsRemoved.length} redundant test(s) stripped)
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => setShowCheckoutDrawer(!showCheckoutDrawer)}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl text-xs cursor-pointer border border-slate-700"
              >
                {showCheckoutDrawer ? 'Hide Details' : 'View Breakdown'}
              </button>

              <button
                onClick={handleInitiateCheckout}
                disabled={paymentState !== 'IDLE' || previewLoading}
                className="flex-1 sm:flex-none px-8 py-3.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider shadow-lg transition-transform hover:scale-105 cursor-pointer flex items-center justify-center gap-2"
              >
                {previewLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Calculating Total...</span>
                  </>
                ) : paymentState === 'CREATING_ORDER' ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Creating Order...</span>
                  </>
                ) : paymentState === 'RAZORPAY_OPEN' ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Opening Gateway...</span>
                  </>
                ) : (
                  <>
                    <span>Proceed to Pay {cartPreview ? `₹${cartPreview.netAmount}` : ''}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Expanded Checkout Drawer */}
          {showCheckoutDrawer && cartPreview && (
            <div className="max-w-7xl mx-auto pt-4 mt-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">Itemized Cart Breakdown:</span>
                {cartPreview.items.map((item, i) => (
                  <div key={i} className="flex justify-between py-1 border-b border-slate-800/60 text-slate-300">
                    <span>{item.itemTitle}</span>
                    <span className="font-bold">₹{item.unitPrice}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                <div className="flex justify-between text-slate-400">
                  <span>Gross Total:</span>
                  <span>₹{cartPreview.grossAmount}</span>
                </div>
                {cartPreview.upgradeCreditAmount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Previous Tier Upgrade Credit:</span>
                    <span>-₹{cartPreview.upgradeCreditAmount}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-amber-400 pt-2 border-t border-slate-800">
                  <span>Net Payable Amount:</span>
                  <span>₹{cartPreview.netAmount}</span>
                </div>
                <p className="text-[10px] text-slate-400 italic mt-1">
                  Authoritative server-side price computation. Protected against client-side tampering.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PAYMENT SUCCESS MODAL ────────────────────────────────────────── */}
      {paymentState === 'SUCCESS' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[var(--card-bg)] border-2 border-emerald-500 rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl relative">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h3 className="font-heading font-black text-2xl text-[var(--text-color)]">
                Payment Verified & Unlocked!
              </h3>
              <p className="text-xs text-slate-500">
                Your test series entitlements have been updated on our backend server. You now have full access to your purchased tests.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  setPaymentState('IDLE');
                  window.location.reload();
                }}
                className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider shadow-md cursor-pointer"
              >
                <span>Start Attempting Tests Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PAYMENT ERROR MODAL ─────────────────────────────────────────── */}
      {paymentState === 'ERROR' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-[var(--card-bg)] border-2 border-rose-500 rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl relative">
            <div className="w-16 h-16 bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto">
              <X className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h3 className="font-heading font-black text-xl text-[var(--text-color)]">
                Checkout / Payment Error
              </h3>
              <p className="text-xs text-rose-500 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 font-bold">
                {errorMessage || 'Unable to complete payment verification.'}
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setPaymentState('IDLE')}
                className="w-full py-3.5 bg-slate-800 text-white font-black rounded-2xl text-xs uppercase tracking-wider cursor-pointer"
              >
                <span>Close & Try Again</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
