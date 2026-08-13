'use client';

import { useState } from 'react';
import { X, CheckCircle2, MapPin, CreditCard, ArrowRight, BookOpen, AlertCircle, ShieldCheck, Truck } from 'lucide-react';
import { DownloadItem } from '@/services/db';

interface PublicationCheckoutModalProps {
  item: DownloadItem;
  onClose: () => void;
}

interface CompletedOrderData {
  orderId?: string;
  paymentId?: string;
  [key: string]: unknown;
}

export default function PublicationCheckoutModal({ item, onClose }: PublicationCheckoutModalProps) {
  const [step, setStep] = useState<'ADDRESS' | 'SUCCESS'>('ADDRESS');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Delivery Address State
  const [address, setAddress] = useState({
    fullName: '',
    mobile: '',
    email: '',
    pincode: '',
    fullAddress: '',
    landmark: '',
    city: '',
    state: 'Bihar'
  });

  const [completedOrder, setCompletedOrder] = useState<CompletedOrderData | null>(null);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  const sellingPrice = item.discountedPrice || item.price || 0;
  const mrp = item.price || sellingPrice;
  const discount = mrp > sellingPrice ? mrp - sellingPrice : 0;
  const deliveryFee = 0; // FREE Delivery

  const resolveUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${BACKEND_URL}/${url.replace(/^\//, '')}`;
  };

  // Dynamically load Razorpay SDK script
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!address.fullName.trim() || !address.mobile.trim() || !address.email.trim() || !address.fullAddress.trim() || !address.pincode.trim()) {
      setError('Please fill in all required shipping address fields (Name, Mobile, Email, Pincode, Address).');
      return;
    }

    if (address.mobile.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);

    try {
      // 1. Call Backend to create Razorpay Order
      const res = await fetch(`${BACKEND_URL}/api/payments/create-publication-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: item.id,
          bookTitle: item.title,
          price: sellingPrice,
          deliveryFee
        })
      });

      const orderData = await res.json();
      if (!orderData.success) {
        throw new Error(orderData.error || 'Failed to create order.');
      }

      const { id: razorpayOrderId, amount, currency, key } = orderData.data;

      // Load SDK
      const scriptLoaded = await loadRazorpayScript();

      // Helper to finalize order in database
      const finalizeOrder = async (payId: string, orderId: string, sig: string = '') => {
        const verifyRes = await fetch(`${BACKEND_URL}/api/payments/verify-publication-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpayPaymentId: payId,
            razorpayOrderId: orderId,
            razorpaySignature: sig,
            bookTitle: item.title,
            amount: sellingPrice,
            shippingAddress: address
          })
        });
        const verifyData = await verifyRes.json();
        if (verifyData.success) {
          setCompletedOrder(verifyData.data);
          setStep('SUCCESS');
        } else {
          setError(verifyData.error || 'Payment verification failed.');
        }
      };

      if (!scriptLoaded || key.startsWith('rzp_test_dev_dummy')) {
        // Fallback test mode
        console.warn('Razorpay SDK unavailable or test mode active. Simulating payment confirmation...');
        await finalizeOrder(`PAY_SIM_${Date.now()}`, razorpayOrderId);
        setLoading(false);
        return;
      }

      // Open Razorpay Standard Checkout Popup
      const options = {
        key,
        amount,
        currency,
        name: 'Final Attempt Publications',
        description: item.title,
        image: 'https://finalattemptias.com/logo.png',
        order_id: razorpayOrderId,
        prefill: {
          name: address.fullName,
          email: address.email,
          contact: address.mobile
        },
        theme: {
          color: '#f59e0b'
        },
        handler: async function (response: any) {
          await finalizeOrder(
            response.razorpay_payment_id,
            response.razorpay_order_id,
            response.razorpay_signature
          );
          setLoading(false);
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          }
        }
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();

    } catch (err: any) {
      console.error('Checkout failed:', err);
      setError(err.message || 'Payment process failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Modal Top Header */}
        <div className="p-5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-md">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-black text-base text-slate-900 dark:text-white leading-tight">
                {step === 'SUCCESS' ? 'Order Confirmation' : 'Checkout & Delivery'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                {step === 'SUCCESS' ? 'Thank you! Your order has been placed.' : 'Step 1 of 2: Shipping Address & Order Summary'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {step === 'ADDRESS' ? (
            <form onSubmit={handleInitiatePayment} className="space-y-6">
              
              {/* Item Card Summary Bar */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-white/10 flex items-center gap-4">
                <div className="w-14 h-18 bg-slate-200 dark:bg-slate-700 rounded-xl overflow-hidden shrink-0 border border-slate-300 dark:border-white/10 flex items-center justify-center">
                  {item.thumbnailUrl ? (
                    <img src={resolveUrl(item.thumbnailUrl)} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen className="w-6 h-6 text-slate-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {item.examCategory || item.type || 'Book'}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400">{item.language || 'English'}</span>
                  </div>
                  <h4 className="font-heading font-black text-sm text-slate-900 dark:text-white truncate mt-1">
                    {item.title}
                  </h4>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-base font-black text-slate-900 dark:text-white">₹{sellingPrice}</span>
                    {discount > 0 && (
                      <span className="text-xs font-bold text-slate-400 line-through">₹{mrp}</span>
                    )}
                    <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      FREE Shipping
                    </span>
                  </div>
                </div>
              </div>

              {/* Error Notice Banner */}
              {error && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-2.5 text-xs text-rose-600 dark:text-rose-400 font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Shipping Address Inputs */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-white/10 text-slate-900 dark:text-white font-heading font-black text-xs uppercase tracking-wider">
                  <MapPin className="w-4 h-4 text-amber-500" />
                  <span>Delivery Address</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={address.fullName}
                      onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none text-slate-900 dark:text-white font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400">Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit mobile number"
                      value={address.mobile}
                      onChange={(e) => setAddress({ ...address, mobile: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none text-slate-900 dark:text-white font-medium"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. ramesh@gmail.com"
                      value={address.email}
                      onChange={(e) => setAddress({ ...address, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none text-slate-900 dark:text-white font-medium"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400">Full Street Address / House No. / Landmark *</label>
                    <textarea
                      required
                      rows={2}
                      placeholder="House/Flat No., Colony, Street, Landmark"
                      value={address.fullAddress}
                      onChange={(e) => setAddress({ ...address, fullAddress: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none text-slate-900 dark:text-white font-medium resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400">Pincode *</label>
                    <input
                      type="text"
                      required
                      placeholder="6-digit Pincode"
                      value={address.pincode}
                      onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none text-slate-900 dark:text-white font-medium font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400">State / Region</label>
                    <input
                      type="text"
                      placeholder="e.g. Bihar"
                      value={address.state}
                      onChange={(e) => setAddress({ ...address, state: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none text-slate-900 dark:text-white font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Price Breakdown Footer */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Item Price (MRP)</span>
                  <span>₹{mrp}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                    <span>Publication Discount</span>
                    <span>- ₹{discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500">
                  <span>Delivery Charges</span>
                  <span className="text-emerald-600 font-bold">FREE</span>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex justify-between font-black text-sm text-slate-900 dark:text-white">
                  <span>Total Payable</span>
                  <span className="text-amber-500">₹{sellingPrice}</span>
                </div>
              </div>

              {/* Submit / Pay Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span>Initiating Razorpay Payment...</span>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Pay ₹{sellingPrice} via Razorpay</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>256-bit SSL Encrypted &amp; Secured by Razorpay</span>
              </div>

            </form>
          ) : (
            /* Order Success Receipt Step */
            <div className="text-center py-6 space-y-6">
              
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <h3 className="font-heading font-black text-xl text-slate-900 dark:text-white">
                  Order Successfully Placed!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Your book order has been confirmed and dispatched for processing.
                </p>
              </div>

              {/* Receipt Summary Box */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-white/10 text-left space-y-4">
                
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                  <div>
                    <span className="text-[9px] font-extrabold uppercase text-slate-400 block">Order ID</span>
                    <span className="font-mono text-xs font-black text-slate-900 dark:text-white">{completedOrder?.orderId || 'ORD-CONFIRMED'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-extrabold uppercase text-slate-400 block">Payment ID</span>
                    <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">{completedOrder?.paymentId || 'PAY-SUCCESS'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400">Book Ordered</span>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">{item.title}</div>
                  <div className="text-xs text-amber-500 font-extrabold">Amount Paid: ₹{sellingPrice}</div>
                </div>

                <div className="space-y-1 pt-2 border-t border-slate-200 dark:border-white/10">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 flex items-center gap-1">
                    <Truck className="w-3 h-3 text-amber-500" />
                    <span>Shipping Address</span>
                  </span>
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
                    <strong>{address.fullName}</strong> ({address.mobile})<br />
                    {address.fullAddress}, Pincode: {address.pincode}, {address.state}
                  </div>
                </div>

              </div>

              <button
                onClick={onClose}
                className="w-full py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-md hover:bg-slate-800 transition-all cursor-pointer"
              >
                Close &amp; Return to Storefront
              </button>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
