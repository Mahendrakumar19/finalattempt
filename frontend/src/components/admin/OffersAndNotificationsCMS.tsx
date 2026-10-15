'use client';

import React, { useState, useEffect } from 'react';
import { db, AppNotification, OfferPromo } from '@/services/db';
import {
  Bell,
  Tag,
  Plus,
  Trash2,
  Send,
  Calendar,
  CheckCircle2,
  ExternalLink,
  AlertCircle,
  Smartphone
} from 'lucide-react';

export default function OffersAndNotificationsCMS() {
  const [activeSubTab, setActiveSubTab] = useState<'notifications' | 'offers'>('notifications');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [offers, setOffers] = useState<OfferPromo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Notification form state
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifAudience, setNotifAudience] = useState<'ALL' | 'STUDENTS' | 'FACULTY' | 'SPECIFIC_COURSE'>('ALL');
  const [notifImageUrl, setNotifImageUrl] = useState('');
  const [notifActionUrl, setNotifActionUrl] = useState('');
  const [notifCourseId, setNotifCourseId] = useState('');
  const [notifIsOffer, setNotifIsOffer] = useState(false);
  const [notifOfferCode, setNotifOfferCode] = useState('');

  // Offer form state
  const [offerCode, setOfferCode] = useState('');
  const [offerTitle, setOfferTitle] = useState('');
  const [offerDescription, setOfferDescription] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FLAT'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [minOrderAmount, setMinOrderAmount] = useState<number>(0);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<number>(0);
  const [applicableTo, setApplicableTo] = useState<'ALL' | 'COURSES' | 'TEST_SERIES' | 'BOOKS'>('ALL');
  const [expiryDate, setExpiryDate] = useState('');
  const [usageLimit, setUsageLimit] = useState<number>(100);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [notifsData, offersData] = await Promise.all([
        db.getNotifications(),
        db.getOffers()
      ]);
      setNotifications(notifsData || []);
      setOffers(offersData || []);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError('Data load karne me samasya aayi.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) {
      setError('Kripya notification title aur message bharein.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await db.createNotification({
        title: notifTitle,
        message: notifMessage,
        targetAudience: notifAudience,
        imageUrl: notifImageUrl || undefined,
        actionUrl: notifActionUrl || undefined,
        courseId: notifCourseId || undefined,
        isOfferNotification: notifIsOffer,
        offerCode: notifIsOffer && notifOfferCode ? notifOfferCode.toUpperCase() : undefined
      });

      setSuccessMsg('Notification successfully broadcast ho gaya!');
      setNotifTitle('');
      setNotifMessage('');
      setNotifImageUrl('');
      setNotifActionUrl('');
      setNotifOfferCode('');
      setNotifIsOffer(false);
      await loadData();
    } catch (err: any) {
      setError('Notification send karne me issue aaya.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    if (!confirm('Kya aap is notification ko delete karna chahte hain?')) return;
    try {
      await db.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setSuccessMsg('Notification delete ho gaya.');
    } catch (err: any) {
      setError('Notification delete nahi ho paya.');
    }
  };

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerCode.trim() || !offerTitle.trim() || discountValue <= 0) {
      setError('Kripya Coupon Code, Title aur Discount Value sahi bharein.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await db.createOffer({
        code: offerCode.toUpperCase().trim(),
        title: offerTitle,
        description: offerDescription || undefined,
        discountType,
        discountValue: Number(discountValue),
        minOrderAmount: Number(minOrderAmount) || 0,
        maxDiscountAmount: discountType === 'PERCENTAGE' && maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
        applicableTo,
        expiryDate: expiryDate ? new Date(expiryDate).toISOString() : new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
        usageLimit: Number(usageLimit) || 100,
        isActive: true
      });

      setSuccessMsg('Naya offer coupon successfully activate ho gaya!');
      setOfferCode('');
      setOfferTitle('');
      setOfferDescription('');
      setDiscountValue(10);
      setMinOrderAmount(0);
      setMaxDiscountAmount(0);
      setExpiryDate('');
      await loadData();
    } catch (err: any) {
      setError('Offer create karne me issue aaya.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleOfferStatus = async (offer: OfferPromo) => {
    try {
      await db.updateOffer(offer.id, { isActive: !offer.isActive });
      setOffers(prev => prev.map(o => o.id === offer.id ? { ...o, isActive: !o.isActive } : o));
    } catch (err) {
      setError('Status update nahi ho paya.');
    }
  };

  const handleDeleteOffer = async (id: string) => {
    if (!confirm('Kya aap is offer ko permanently delete karna chahte hain?')) return;
    try {
      await db.deleteOffer(id);
      setOffers(prev => prev.filter(o => o.id !== id));
      setSuccessMsg('Offer coupon delete ho gaya.');
    } catch (err: any) {
      setError('Offer delete nahi ho paya.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                <Smartphone className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Mobile App Push Notifications & Offers CMS</h2>
            </div>
            <p className="text-slate-600 mt-1 text-sm">
              Manage direct push broadcasts to mobile app students, course coupon codes, seasonal discounts, and instant alerts.
            </p>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => { setActiveSubTab('notifications'); setError(null); setSuccessMsg(null); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${activeSubTab === 'notifications' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-700 hover:text-slate-900'}`}
            >
              <Bell className="w-4 h-4" />
              Push Notifications ({notifications.length})
            </button>
            <button
              onClick={() => { setActiveSubTab('offers'); setError(null); setSuccessMsg(null); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${activeSubTab === 'offers' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-700 hover:text-slate-900'}`}
            >
              <Tag className="w-4 h-4" />
              Offers & Coupons ({offers.length})
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      {/* SUBTAB 1: Push Notifications */}
      {activeSubTab === 'notifications' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Send Broadcast Form */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <Send className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-900">Broadcast Notification</h3>
            </div>

            <form onSubmit={handleSendNotification} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Audience</label>
                <select
                  value={notifAudience}
                  onChange={(e: any) => setNotifAudience(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All App Users (Everyone)</option>
                  <option value="STUDENTS">Enrolled Students Only</option>
                  <option value="FACULTY">Faculties & Mentors</option>
                  <option value="SPECIFIC_COURSE">Specific Course Batch</option>
                </select>
              </div>

              {notifAudience === 'SPECIFIC_COURSE' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Course ID</label>
                  <input
                    type="text"
                    value={notifCourseId}
                    onChange={(e) => setNotifCourseId(e.target.value)}
                    placeholder="e.g. course-upsc-prelims-2025"
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  placeholder="e.g. Special Live Session Alert!"
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Message / Details *</label>
                <textarea
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  rows={3}
                  placeholder="Write concise alert for mobile push banner..."
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Banner / Thumbnail Image URL (Optional)</label>
                <input
                  type="url"
                  value={notifImageUrl}
                  onChange={(e) => setNotifImageUrl(e.target.value)}
                  placeholder="https://example.com/banner.jpg"
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Deep Link / Action URL (Optional)</label>
                <input
                  type="text"
                  value={notifActionUrl}
                  onChange={(e) => setNotifActionUrl(e.target.value)}
                  placeholder="/live-classes or /courses/upsc"
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifIsOffer}
                    onChange={(e) => setNotifIsOffer(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm font-medium text-slate-800">Link an Active Offer/Discount Coupon</span>
                </label>
              </div>

              {notifIsOffer && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Select / Enter Coupon Code</label>
                  <input
                    type="text"
                    value={notifOfferCode}
                    onChange={(e) => setNotifOfferCode(e.target.value.toUpperCase())}
                    placeholder="e.g. DIWALI50, UPSC2025"
                    className="w-full text-sm font-mono uppercase tracking-wider border border-blue-300 rounded-lg p-2.5 bg-blue-50 text-blue-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                Send Push Notification
              </button>
            </form>
          </div>

          {/* Broadcast History List */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900">Broadcast History</h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">Total: {notifications.length} notifications</span>
            </div>

            {notifications.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No notifications sent yet. Use the form to broadcast to mobile apps.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-blue-200 hover:bg-blue-50/20 transition-all flex items-start justify-between gap-4"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-slate-900 text-base">{n.title}</h4>
                        <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {n.targetAudience}
                        </span>
                        {n.isOfferNotification && (
                          <span className="px-2 py-0.5 text-xs font-bold rounded bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {n.offerCode || 'PROMO'}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 text-sm leading-relaxed">{n.message}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                        <span>Sent: {new Date(n.sentAt || n.createdAt).toLocaleString()}</span>
                        {n.actionUrl && (
                          <span className="flex items-center gap-1 text-blue-600 font-medium">
                            <ExternalLink className="w-3 h-3" />
                            {n.actionUrl}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteNotification(n.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 2: Offers & Coupons */}
      {activeSubTab === 'offers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Coupon Form */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <Tag className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-900">Create Offer / Promo Code</h3>
            </div>

            <form onSubmit={handleCreateOffer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Coupon Code *</label>
                <input
                  type="text"
                  value={offerCode}
                  onChange={(e) => setOfferCode(e.target.value.toUpperCase())}
                  placeholder="e.g. UPSC2025, FESTIVE40"
                  className="w-full text-sm font-mono font-bold uppercase tracking-wider border border-slate-300 rounded-lg p-2.5 bg-white text-blue-900 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Offer Title *</label>
                <input
                  type="text"
                  value={offerTitle}
                  onChange={(e) => setOfferTitle(e.target.value)}
                  placeholder="e.g. 20% Special Discount on Prelims Course"
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Terms</label>
                <textarea
                  value={offerDescription}
                  onChange={(e) => setOfferDescription(e.target.value)}
                  rows={2}
                  placeholder="Valid for first 500 applicants on live course admissions."
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Type</label>
                  <select
                    value={discountType}
                    onChange={(e: any) => setDiscountType(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT">Flat Amount (Rs.)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {discountType === 'PERCENTAGE' ? 'Discount (%)' : 'Amount (Rs.)'} *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full text-sm font-bold border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Min Cart (Rs.)</label>
                  <input
                    type="number"
                    min="0"
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(Number(e.target.value))}
                    placeholder="0"
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {discountType === 'PERCENTAGE' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Max Discount (Rs.)</label>
                    <input
                      type="number"
                      min="0"
                      value={maxDiscountAmount}
                      onChange={(e) => setMaxDiscountAmount(Number(e.target.value))}
                      placeholder="Optional cap"
                      className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Applicable For</label>
                  <select
                    value={applicableTo}
                    onChange={(e: any) => setApplicableTo(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALL">Entire Platform</option>
                    <option value="COURSES">Live Courses</option>
                    <option value="TEST_SERIES">Test Series</option>
                    <option value="BOOKS">Books Store</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Usage Limit</label>
                  <input
                    type="number"
                    min="1"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(Number(e.target.value))}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                Publish & Activate Coupon
              </button>
            </form>
          </div>

          {/* Active Offers List */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900">Active Offers & Coupons</h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">Total: {offers.length} active/scheduled</span>
            </div>

            {offers.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Tag className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No offers created yet. Add new promo coupons using the form on the left.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {offers.map((o) => (
                  <div
                    key={o.id}
                    className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${o.isActive ? 'border-slate-200 bg-white hover:border-blue-200' : 'border-slate-200 bg-slate-50 opacity-60'}`}
                  >
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-1 text-sm font-mono font-bold rounded-md bg-blue-50 text-blue-700 border border-blue-200 tracking-wider">
                          {o.code}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded ${o.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                          {o.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-50 text-amber-800 border border-amber-200">
                          {o.discountType === 'PERCENTAGE' ? `${o.discountValue}% OFF` : `Flat Rs. ${o.discountValue} OFF`}
                        </span>
                        <span className="px-2 py-0.5 text-xs font-medium rounded bg-slate-100 text-slate-600">
                          Applies to: {o.applicableTo}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-900 text-base">{o.title}</h4>
                      {o.description && <p className="text-slate-600 text-sm">{o.description}</p>}

                      <div className="flex items-center gap-4 text-xs text-slate-500 pt-1 flex-wrap">
                        <span>Min Cart: Rs. {o.minOrderAmount || 0}</span>
                        {o.maxDiscountAmount ? <span>Max Cap: Rs. {o.maxDiscountAmount}</span> : null}
                        <span>Used: {o.usedCount || o.usageCount || 0} / {o.usageLimit || '∞'}</span>
                        {(o.expiryDate || o.endDate) && (
                          <span>Expires: {new Date(o.expiryDate || o.endDate || '').toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleOfferStatus(o)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${o.isActive ? 'border-amber-300 text-amber-700 hover:bg-amber-50' : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'}`}
                      >
                        {o.isActive ? 'Pause' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteOffer(o.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Offer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}