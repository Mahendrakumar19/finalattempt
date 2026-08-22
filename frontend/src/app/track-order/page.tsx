'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Truck,
  Search,
  PackageCheck,
  Clock,
  CheckCircle2,
  MapPin,
  PhoneCall,
  Mail,
  ChevronRight,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { db, BookOrder } from '@/services/db';

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('orderId') || searchParams.get('mobile') || '';

  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [orders, setOrders] = useState<BookOrder[]>([]);
  const [error, setError] = useState('');

  const handleTrack = async (searchVal?: string) => {
    const q = (searchVal !== undefined ? searchVal : query).trim();
    if (!q) {
      setError('Please enter your Order ID or registered 10-digit Mobile Number.');
      return;
    }

    setError('');
    setLoading(true);
    setSearched(true);

    try {
      const results = await db.trackBookOrder(q);
      setOrders(results);
      if (results.length === 0) {
        setError('No book orders found matching your search. Please check your Order ID or Mobile Number.');
      }
    } catch (err: any) {
      setError('Error retrieving order details. Please check your connection.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      handleTrack(initialQuery);
    }
  }, [initialQuery]);

  const getStepProgress = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 4;
      case 'OUT_FOR_DELIVERY':
      case 'SHIPPED':
        return 3;
      case 'PROCESSING':
        return 2;
      case 'PAID':
      default:
        return 1;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-color)] text-[var(--text-color)] flex flex-col font-sans">
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-12 space-y-10">

        {/* Top Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-semibold">
          <Link href="/" className="hover:text-amber-500 transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link href="/downloads/fa-publication" className="hover:text-amber-500 transition-colors">FA Publications</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-amber-500 font-bold">Track Order</span>
        </div>

        {/* Hero Section */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-black uppercase tracking-widest">
            <Truck className="w-3.5 h-3.5" /> FA Logistics & Delivery Tracking
          </span>
          <h1 className="text-3xl sm:text-4xl font-heading font-black text-slate-900 dark:text-white tracking-tight">
            Track Your Book Delivery
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Enter your Order ID (e.g. <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">ORD-PUB-...</span>) or your registered mobile number to check real-time dispatch status.
          </p>
        </div>

        {/* Search Input Box */}
        <div className="max-w-xl mx-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleTrack();
            }}
            className="flex flex-col sm:flex-row gap-3 p-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl shadow-xl"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Enter Order ID or Mobile Number..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent pl-10 pr-4 py-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md shadow-amber-500/20 shrink-0 disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Track Order ↗'}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-xs text-red-600 dark:text-red-400 font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Tracked Results List */}
        {searched && orders.length > 0 && (
          <div className="space-y-8 animate-fadeIn">
            {orders.map((ord) => {
              const currentStep = getStepProgress(ord.deliveryStatus);

              return (
                <div key={ord.id || ord.orderId} className="rounded-3xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 sm:p-8 space-y-8 shadow-xl">
                  
                  {/* Order Overview Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-6">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Order Reference</span>
                      <h3 className="font-mono text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">{ord.orderId}</h3>
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold mt-1">
                        Book: <strong className="text-slate-900 dark:text-white">{ord.bookTitle}</strong> ({ord.language || 'Bilingual'})
                      </p>
                    </div>

                    <div className="text-left sm:text-right border-t sm:border-t-0 border-slate-200 dark:border-white/10 pt-3 sm:pt-0 w-full sm:w-auto">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block">Total Amount Paid</span>
                      <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">₹{ord.totalAmount}</span>
                      <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Paid on {new Date(ord.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  {/* Visual Step-by-Step Delivery Progress Tracker */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Delivery Status Timeline</h4>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 relative">
                      
                      {/* Step 1 */}
                      <div className={`p-4 rounded-2xl border transition-all ${
                        currentStep >= 1
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                          : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] text-slate-400'
                      }`}>
                        <div className="flex items-center gap-2 font-bold text-xs">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>1. Order Placed</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Payment verified via Razorpay</p>
                      </div>

                      {/* Step 2 */}
                      <div className={`p-4 rounded-2xl border transition-all ${
                        currentStep >= 2
                          ? 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                          : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] text-slate-400'
                      }`}>
                        <div className="flex items-center gap-2 font-bold text-xs">
                          <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                          <span>2. Packing &amp; Dispatch</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Prepared at FA warehouse</p>
                      </div>

                      {/* Step 3 */}
                      <div className={`p-4 rounded-2xl border transition-all ${
                        currentStep >= 3
                          ? 'border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300'
                          : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] text-slate-400'
                      }`}>
                        <div className="flex items-center gap-2 font-bold text-xs">
                          <Truck className="w-4 h-4 text-sky-500 shrink-0" />
                          <span>3. In Transit</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Handed to Speed Post/Courier</p>
                      </div>

                      {/* Step 4 */}
                      <div className={`p-4 rounded-2xl border transition-all ${
                        currentStep >= 4
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                          : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] text-slate-400'
                      }`}>
                        <div className="flex items-center gap-2 font-bold text-xs">
                          <PackageCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>4. Delivered</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Handed over to Aspirant</p>
                      </div>

                    </div>
                  </div>

                  {/* Logistics Tracking Number Callout Card (if dispatched) */}
                  {ord.trackingNumber && (
                    <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 block">Express Courier Partner</span>
                        <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                          {ord.courierName || 'Speed Post (India Post)'} — AWB Track No:{' '}
                          <span className="font-mono text-amber-600 dark:text-amber-400 font-extrabold">{ord.trackingNumber}</span>
                        </div>
                      </div>

                      <a
                        href={`https://www.google.com/search?q=${encodeURIComponent(`${ord.courierName || 'Speed Post'} tracking ${ord.trackingNumber}`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md shrink-0 flex items-center gap-1.5"
                      >
                        <span>Open Courier Tracking</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}

                  {/* Delivery Address Card */}
                  <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-5 space-y-2 text-xs">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-500" /> Destination Delivery Address
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">{ord.customerName} ({ord.customerMobile})</div>
                    <div className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                      {ord.address}, {ord.city}, {ord.state} – <strong className="text-amber-600 dark:text-amber-400 font-mono">{ord.pincode}</strong>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* Support Section */}
        <div className="rounded-3xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 sm:p-8 text-center space-y-3 shadow-lg">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Need Delivery Support?</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
            Our Publications dispatch desk is active Monday to Saturday (10:00 AM – 7:00 PM). If you have any shipping updates or address change requests, reach out directly:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <a
              href="tel:+919709992093"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/10 text-slate-900 dark:text-white font-bold text-xs transition-colors"
            >
              <PhoneCall className="w-4 h-4 text-amber-500" />
              <span>Helpline: +91 97099 92093</span>
            </a>

            <a
              href="mailto:enquiry@finalattemptias.com"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/10 text-slate-900 dark:text-white font-bold text-xs transition-colors"
            >
              <Mail className="w-4 h-4 text-amber-500" />
              <span>enquiry@finalattemptias.com</span>
            </a>
          </div>
        </div>

      </main>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg-color)] text-slate-400 flex items-center justify-center text-xs">Loading Order Tracker...</div>}>
      <TrackOrderContent />
    </Suspense>
  );
}
