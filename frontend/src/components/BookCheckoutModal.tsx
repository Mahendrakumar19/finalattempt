'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  MapPin,
  Phone,
  User,
  Mail,
  Building,
  CheckCircle2,
  Lock,
  ArrowRight,
  Truck,
  ShieldCheck,
  CreditCard,
  Sparkles
} from 'lucide-react';
import { db, DownloadItem, BookOrder } from '@/services/db';

interface BookCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: DownloadItem | null;
}

export default function BookCheckoutModal({ isOpen, onClose, book }: BookCheckoutModalProps) {
  const [step, setStep] = useState<'address' | 'paying' | 'success'>('address');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [completedOrder, setCompletedOrder] = useState<BookOrder | null>(null);

  // Address form fields
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('Bihar');
  const [pincode, setPincode] = useState('');

  // Load saved user info from localStorage if available
  useEffect(() => {
    if (isOpen) {
      setStep('address');
      setError('');
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const u = JSON.parse(userStr);
          if (u.fullName) setFullName(u.fullName);
          if (u.email) setEmail(u.email);
          if (u.mobile) setMobile(u.mobile);
        }
      } catch (_) {}
    }
  }, [isOpen]);

  if (!isOpen || !book) return null;

  const price = book.discountedPrice || book.price || 299;
  const deliveryFee = 0; // Free shipping promo
  const totalAmount = price + deliveryFee;

  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!fullName.trim() || !mobile.trim() || !address.trim() || !city.trim() || !pincode.trim()) {
      setError('Please fill in all mandatory delivery address fields (*)');
      return;
    }

    if (mobile.replace(/[^0-9]/g, '').length < 10) {
      setError('Please enter a valid 10-digit mobile number for courier notifications.');
      return;
    }

    if (pincode.replace(/[^0-9]/g, '').length < 6) {
      setError('Please enter a valid 6-digit PIN code.');
      return;
    }

    setLoading(true);

    try {
      // 1. Create Order on Backend
      const orderRes = await db.createPublicationOrder(book.title, price, deliveryFee);
      
      if (!orderRes || !orderRes.success || !orderRes.data) {
        throw new Error(orderRes?.error || 'Failed to initiate publication payment gateway.');
      }

      const orderData = orderRes.data;

      // 2. Setup Razorpay Options
      const options = {
        key: orderData.key || 'rzp_test_dev_dummy_key_id_123456',
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Final Attempt Publications',
        description: `Purchase: ${book.title}`,
        image: '/darklogofull.png',
        order_id: orderData.id.startsWith('order_sim_') ? undefined : orderData.id,
        prefill: {
          name: fullName,
          email: email || 'aspirant@finalattemptias.com',
          contact: mobile,
        },
        theme: {
          color: '#F59E0B',
        },
        handler: async function (response: any) {
          try {
            setLoading(true);
            // 3. Verify Payment & Save Book Order on Backend
            const verifyRes = await db.verifyPublicationOrder({
              razorpayOrderId: response.razorpay_order_id || orderData.id,
              razorpayPaymentId: response.razorpay_payment_id || `pay_${Date.now()}`,
              razorpaySignature: response.razorpay_signature || 'simulated_sig',
              bookTitle: book.title,
              bookId: book.id,
              editionYear: book.editionYear || '2025-26',
              language: book.language || 'Bilingual',
              price,
              deliveryFee,
              amount: totalAmount,
              shippingAddress: {
                fullName,
                mobile,
                email,
                address,
                city,
                state: stateName,
                pincode,
              }
            });

            if (verifyRes && verifyRes.success && verifyRes.data) {
              setCompletedOrder(verifyRes.data);
              setStep('success');
            } else {
              throw new Error(verifyRes?.error || 'Payment verification failed.');
            }
          } catch (err: any) {
            setError(err.message || 'Payment verification failed. Please contact support.');
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          }
        }
      };

      // 4. Open Razorpay Gateway
      if (typeof window !== 'undefined' && (window as any).Razorpay) {
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        // Fallback for simulated dev environment without Razorpay SDK script
        const mockResponse = {
          razorpay_order_id: orderData.id,
          razorpay_payment_id: `pay_sim_${Date.now()}`,
          razorpay_signature: 'simulated_signature'
        };
        options.handler(mockResponse);
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Failed to connect to payment server. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-800 bg-[#0F172A] text-slate-100 shadow-2xl">

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-black tracking-tight text-white">
                FA Publications Order Checkout
              </h3>
              <p className="text-xs font-semibold text-slate-400">
                Official Hardcopy Delivery to Doorstep
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-slate-800 p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">

          {/* Book Summary Badge */}
          <div className="mb-6 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {book.thumbnailUrl ? (
                  <img
                    src={book.thumbnailUrl}
                    alt={book.title}
                    className="h-16 w-12 rounded-lg object-cover border border-slate-700 shadow-md shrink-0"
                  />
                ) : (
                  <div className="flex h-16 w-12 items-center justify-center rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 shrink-0 font-bold text-xs">
                    BOOK
                  </div>
                )}
                <div>
                  <span className="inline-block px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-wider mb-1">
                    {book.language || 'Bilingual Edition'} • {book.editionYear || '2025-26'}
                  </span>
                  <h4 className="font-heading font-extrabold text-sm text-white line-clamp-1">
                    {book.title}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                    {book.description || 'Comprehensive Study Edition for UPSC & State PCS Aspirants'}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0 border-t sm:border-t-0 border-slate-800 pt-2 sm:pt-0 w-full sm:w-auto flex sm:flex-col justify-between items-center sm:items-end">
                <span className="text-xs text-slate-400 font-semibold">Total Price:</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs text-slate-500 line-through">₹{book.price || 450}</span>
                  <span className="text-xl font-black text-amber-400">₹{totalAmount}</span>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs font-bold text-red-400">
              ⚠️ {error}
            </div>
          )}

          {step === 'address' && (
            <form onSubmit={handleInitiatePayment} className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> 1. Shipping Address & Aspirant Details
                </span>
                <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                  <Truck className="w-3 h-3 text-emerald-400" /> Free All-India Express Courier
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Kumar"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900/90 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Mobile Number (for Courier Updates) <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="tel"
                      required
                      placeholder="10-digit Mobile Number"
                      value={mobile}
                      onChange={e => setMobile(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900/90 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Email Address (Optional)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="email"
                      placeholder="aspirant@gmail.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900/90 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    PIN Code <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="e.g. 800001"
                    value={pincode}
                    onChange={e => setPincode(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Street Address & Landmark <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder="House/Flat No., Street Name, Landmark (e.g. Near Boring Road Crossing)"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/90 p-3 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    City / District <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Patna"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900/90 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    State <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bihar"
                    value={stateName}
                    onChange={e => setStateName(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-slate-800">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>256-bit Encrypted SSL Gateway</span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 font-extrabold text-slate-950 transition-all hover:bg-amber-400 hover:scale-[1.02] active:scale-100 disabled:opacity-50 text-sm shadow-lg shadow-amber-500/20"
                >
                  {loading ? (
                    <span>Processing Order...</span>
                  ) : (
                    <>
                      <span>Pay ₹{totalAmount} & Confirm Order</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {step === 'success' && completedOrder && (
            <div className="py-6 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-extrabold tracking-widest uppercase mb-2">
                  Order Successfully Placed
                </span>
                <h3 className="font-heading text-2xl font-black text-white">
                  Thank You for Your Order!
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Your book order has been recorded. Our dispatch team is preparing your package.
                </p>
              </div>

              {/* Order Receipt Details Card */}
              <div className="mx-auto max-w-md rounded-2xl border border-slate-800 bg-slate-900/90 p-4 text-left space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Order ID:</span>
                  <span className="font-mono font-bold text-amber-400">{completedOrder.orderId}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Payment ID:</span>
                  <span className="font-mono font-semibold text-slate-300">{completedOrder.paymentId}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Deliver To:</span>
                  <span className="font-bold text-white text-right">{completedOrder.customerName} ({completedOrder.customerMobile})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Delivery Address:</span>
                  <span className="font-medium text-slate-300 text-right max-w-[220px]">
                    {completedOrder.address}, {completedOrder.city}, {completedOrder.state} – {completedOrder.pincode}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="rounded-xl bg-slate-800 hover:bg-slate-700 px-6 py-2.5 text-xs font-bold text-white transition-colors"
                >
                  Close & Return to Publications
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
