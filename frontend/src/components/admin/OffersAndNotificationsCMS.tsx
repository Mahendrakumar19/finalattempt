'use client';

import React, { useState, useEffect, useRef } from 'react';
import { db, AppNotification, OfferPromo } from '@/services/db';
import {
  Bell,
  Tag,
  Plus,
  Trash2,
  Send,
  CheckCircle2,
  ExternalLink,
  AlertCircle,
  Smartphone,
  ShieldCheck,
  Activity,
  RefreshCw,
  Clock,
  Users,
  Zap,
  XCircle,
  Info,
  Eye,
  ChevronDown,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface AuditEvent {
  id: string;
  timestamp: string;
  type: 'SENT' | 'DELIVERED' | 'FAILED' | 'FETCH' | 'INFO';
  title: string;
  detail: string;
  audience?: string;
  deliveredCount?: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtTime(iso: string) {
  try { return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
  catch { return iso; }
}
function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return iso; }
}

const audienceColor: Record<string, string> = {
  ALL: 'bg-blue-100 text-blue-800 border-blue-200',
  STUDENTS: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  FACULTY: 'bg-purple-100 text-purple-800 border-purple-200',
  SPECIFIC_COURSE: 'bg-amber-100 text-amber-800 border-amber-200',
};

// ══════════════════════════════════════════════════════════════════════════════
export default function OffersAndNotificationsCMS() {
  const [activeSubTab, setActiveSubTab] = useState<'notifications' | 'audit' | 'offers'>('notifications');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [offers, setOffers] = useState<OfferPromo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Broadcast form
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifAudience, setNotifAudience] = useState<'ALL' | 'STUDENTS' | 'FACULTY' | 'SPECIFIC_COURSE'>('ALL');
  const [notifImageUrl, setNotifImageUrl] = useState('');
  const [notifActionUrl, setNotifActionUrl] = useState('');
  const [notifCourseId, setNotifCourseId] = useState('');
  const [notifIsOffer, setNotifIsOffer] = useState(false);
  const [notifOfferCode, setNotifOfferCode] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Audit / validation panel
  const [auditLog, setAuditLog] = useState<AuditEvent[]>([]);
  const [testTitle, setTestTitle] = useState('🔔 Test Push from Admin');
  const [testMessage, setTestMessage] = useState('This is a test notification to verify mobile push delivery.');
  const [isTesting, setIsTesting] = useState(false);
  const [auditStats, setAuditStats] = useState({ sent: 0, failed: 0, fetched: 0 });
  const logEndRef = useRef<HTMLDivElement>(null);

  // Offer form
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

  useEffect(() => { loadData(); }, []);
  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [auditLog]);

  // Auto-clear success/error after 5s
  useEffect(() => {
    if (successMsg) { const t = setTimeout(() => setSuccessMsg(null), 5000); return () => clearTimeout(t); }
  }, [successMsg]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [notifsData, offersData] = await Promise.all([db.getNotifications(), db.getOffers()]);
      setNotifications(notifsData || []);
      setOffers(offersData || []);
    } catch (err: unknown) {
      setError('Failed to load data. Check network connection.');
    } finally {
      setLoading(false);
    }
  };

  // ── Push a line to audit log ────────────────────────────────────────────────
  const pushAudit = (event: Omit<AuditEvent, 'id' | 'timestamp'>) => {
    const entry: AuditEvent = {
      ...event,
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: new Date().toISOString(),
    };
    setAuditLog(prev => [entry, ...prev].slice(0, 200));
    setAuditStats(prev => ({
      sent: prev.sent + (event.type === 'SENT' ? 1 : 0),
      failed: prev.failed + (event.type === 'FAILED' ? 1 : 0),
      fetched: prev.fetched + (event.type === 'FETCH' ? 1 : 0),
    }));
  };

  // ── Test Push: send + verify fetch ────────────────────────────────────────────
  const handleTestPush = async () => {
    if (!testTitle.trim() || !testMessage.trim()) return;
    setIsTesting(true);
    pushAudit({ type: 'INFO', title: 'Test initiated', detail: `Sending to ALL users: "${testTitle}"` });

    try {
      const startMs = Date.now();
      const created = await db.createNotification({
        title: testTitle,
        message: testMessage,
        targetAudience: 'ALL',
      });
      const sendMs = Date.now() - startMs;

      if (!created) throw new Error('createNotification returned null — check backend.');

      pushAudit({
        type: 'SENT',
        title: `✅ Notification created in ${sendMs}ms`,
        detail: `ID: ${(created as AppNotification).id || 'unknown'} | Audience: ALL | Title: "${testTitle}"`,
        audience: 'ALL',
      });

      // Now validate: fetch notifications back and check it appears
      pushAudit({ type: 'INFO', title: 'Validating delivery…', detail: 'Fetching /api/notifications to confirm persistence.' });
      const fetchStart = Date.now();
      const list = await db.getNotifications();
      const fetchMs = Date.now() - fetchStart;
      const found = (list || []).find((n: AppNotification) =>
        n.title === testTitle && n.message === testMessage
      );

      if (found) {
        pushAudit({
          type: 'DELIVERED',
          title: `✅ Delivery Confirmed in ${fetchMs}ms`,
          detail: `Notification ID ${found.id} is visible to mobile app polling at /api/notifications. App will display it on next poll or open.`,
          deliveredCount: list.length,
        });
        setSuccessMsg(`✅ Push validated! Notification "${testTitle}" is live and fetched by mobile app API.`);
        setNotifications(list);
      } else {
        pushAudit({
          type: 'FAILED',
          title: '⚠️ Not found in API response',
          detail: 'Notification was created but not returned by GET /api/notifications. Check backend save logic.',
        });
        setError('Notification created but not retrievable. Check /api/notifications endpoint.');
      }

      // Cleanup test notification from history
      if (found && (found as AppNotification).id) {
        setTimeout(async () => {
          try {
            await db.deleteNotification((found as AppNotification).id);
            setNotifications(prev => prev.filter(n => n.id !== (found as AppNotification).id));
            pushAudit({ type: 'INFO', title: 'Test notification cleaned up', detail: `ID ${(found as AppNotification).id} removed from history.` });
          } catch (_) {}
        }, 3000);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      pushAudit({ type: 'FAILED', title: '❌ Push failed', detail: msg });
      setError(`Test push failed: ${msg}`);
    } finally {
      setIsTesting(false);
    }
  };

  // ── Send Real Broadcast ─────────────────────────────────────────────────────
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) { setError('Please enter title and message.'); return; }
    try {
      setIsSending(true);
      setError(null);
      await db.createNotification({
        title: notifTitle,
        message: notifMessage,
        targetAudience: notifAudience,
        imageUrl: notifImageUrl || undefined,
        actionUrl: notifActionUrl || undefined,
        courseId: notifCourseId || undefined,
        isOfferNotification: notifIsOffer,
        offerCode: notifIsOffer && notifOfferCode ? notifOfferCode.toUpperCase() : undefined,
      } as Partial<AppNotification>);
      setSuccessMsg(`📤 Broadcast sent to ${notifAudience} users!`);
      setNotifTitle(''); setNotifMessage(''); setNotifImageUrl(''); setNotifActionUrl(''); setNotifOfferCode(''); setNotifIsOffer(false);
      pushAudit({ type: 'SENT', title: `Broadcast: "${notifTitle}"`, detail: `Audience: ${notifAudience}`, audience: notifAudience });
      await loadData();
    } catch (err) {
      setError('Failed to send notification. Check backend.');
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    if (!confirm('Delete this notification from history?')) return;
    try {
      await db.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch { setError('Delete failed.'); }
  };

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerCode.trim() || !offerTitle.trim() || discountValue <= 0) { setError('Fill all required offer fields.'); return; }
    try {
      setLoading(true);
      setError(null);
      await db.createOffer({
        code: offerCode.toUpperCase().trim(), title: offerTitle, description: offerDescription || undefined,
        discountType, discountValue: Number(discountValue), minOrderAmount: Number(minOrderAmount) || 0,
        maxDiscountAmount: discountType === 'PERCENTAGE' && maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
        applicableTo, expiryDate: expiryDate ? new Date(expiryDate).toISOString() : new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
        usageLimit: Number(usageLimit) || 100, isActive: true,
      });
      setSuccessMsg('Offer coupon activated!');
      setOfferCode(''); setOfferTitle(''); setOfferDescription(''); setDiscountValue(10); setMinOrderAmount(0); setMaxDiscountAmount(0); setExpiryDate('');
      await loadData();
    } catch { setError('Failed to create offer.'); }
    finally { setLoading(false); }
  };

  const handleToggleOfferStatus = async (offer: OfferPromo) => {
    try {
      await db.updateOffer(offer.id, { isActive: !offer.isActive });
      setOffers(prev => prev.map(o => o.id === offer.id ? { ...o, isActive: !o.isActive } : o));
    } catch { setError('Status update failed.'); }
  };

  const handleDeleteOffer = async (id: string) => {
    if (!confirm('Delete this offer permanently?')) return;
    try { await db.deleteOffer(id); setOffers(prev => prev.filter(o => o.id !== id)); }
    catch { setError('Delete failed.'); }
  };

  const TABS = [
    { id: 'notifications' as const, label: `Broadcast (${notifications.length})`, icon: Bell },
    { id: 'audit' as const, label: 'Push Audit & Test', icon: ShieldCheck, badge: auditLog.length > 0 ? String(auditLog.length) : undefined },
    { id: 'offers' as const, label: `Offers (${offers.length})`, icon: Tag },
  ];

  return (
    <div className="space-y-5">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Mobile Notifications & Offers</h2>
              <p className="text-xs text-slate-500 mt-0.5">Broadcast push alerts · Audit delivery · Manage discount coupons</p>
            </div>
          </div>

          <button onClick={loadData} disabled={loading} className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-700 transition-colors px-3 py-1.5 border border-slate-200 rounded-lg hover:border-blue-300">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Tab Nav */}
        <div className="flex items-center gap-1 mt-5 bg-slate-100 p-1 rounded-xl border border-slate-200 w-full sm:w-auto">
          {TABS.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => { setActiveSubTab(id); setError(null); setSuccessMsg(null); }}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all flex-1 sm:flex-initial justify-center ${activeSubTab === id ? 'bg-white shadow text-blue-700 border border-slate-200' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{id === 'notifications' ? 'Broadcast' : id === 'audit' ? 'Audit' : 'Offers'}</span>
              {badge && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-600 text-white rounded-full text-[10px] font-black flex items-center justify-center">
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Alerts */}
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto"><XCircle className="w-4 h-4" /></button>
          </div>
        )}
        {successMsg && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" /><span>{successMsg}</span>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SUBTAB 1: BROADCAST NOTIFICATIONS
      ══════════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'notifications' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* Send Form */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Send className="w-5 h-5 text-blue-600" />
              <h3 className="font-extrabold text-slate-900 text-base">New Broadcast</h3>
            </div>

            <form onSubmit={handleSendNotification} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Audience</label>
                <select value={notifAudience} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNotifAudience(e.target.value as typeof notifAudience)}
                  className="w-full text-sm border border-slate-300 rounded-xl p-2.5 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-400">
                  <option value="ALL">All App Users</option>
                  <option value="STUDENTS">Enrolled Students Only</option>
                  <option value="FACULTY">Faculties & Mentors</option>
                  <option value="SPECIFIC_COURSE">Specific Course Batch</option>
                </select>
              </div>
              {notifAudience === 'SPECIFIC_COURSE' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Course ID / Slug</label>
                  <input type="text" value={notifCourseId} onChange={e => setNotifCourseId(e.target.value)}
                    placeholder="e.g. bpsc-prelims-2025" className="w-full text-sm border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500" />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notification Title *</label>
                <input type="text" value={notifTitle} onChange={e => setNotifTitle(e.target.value)}
                  placeholder="e.g. Live Session Today at 6 PM!" className="w-full text-sm border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Message *</label>
                <textarea value={notifMessage} onChange={e => setNotifMessage(e.target.value)} rows={3}
                  placeholder="Write concise push message for mobile…" className="w-full text-sm border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 resize-none" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Banner Image URL (Optional)</label>
                <input type="url" value={notifImageUrl} onChange={e => setNotifImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg" className="w-full text-sm border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deep Link / Action URL</label>
                <input type="text" value={notifActionUrl} onChange={e => setNotifActionUrl(e.target.value)}
                  placeholder="/test-series or /courses" className="w-full text-sm border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <input type="checkbox" id="link-offer" checked={notifIsOffer} onChange={e => setNotifIsOffer(e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                <label htmlFor="link-offer" className="text-sm font-semibold text-slate-700 cursor-pointer">Attach Offer Coupon</label>
              </div>
              {notifIsOffer && (
                <input type="text" value={notifOfferCode} onChange={e => setNotifOfferCode(e.target.value.toUpperCase())}
                  placeholder="COUPON CODE (e.g. DIWALI50)" className="w-full text-sm font-mono font-bold uppercase tracking-wider border border-blue-300 rounded-xl p-2.5 bg-blue-50 text-blue-900 focus:ring-2 focus:ring-blue-500" />
              )}
              <button type="submit" disabled={isSending}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow disabled:opacity-60">
                {isSending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {isSending ? 'Sending…' : 'Send Broadcast'}
              </button>
            </form>
          </div>

          {/* History */}
          <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-slate-900">Broadcast History</h3>
              </div>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{notifications.length} sent</span>
            </div>
            {notifications.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No notifications sent yet.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                {notifications.map((n) => (
                  <div key={n.id} className="p-4 rounded-xl border border-slate-200 hover:border-blue-200 hover:bg-blue-50/30 transition-all flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h4 className="font-bold text-slate-900 text-sm">{n.title}</h4>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${audienceColor[n.targetAudience] || 'bg-slate-100 text-slate-700'}`}>
                          {n.targetAudience}
                        </span>
                        {n.isOfferNotification && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-0.5">
                            <Tag className="w-3 h-3" />{n.offerCode || 'PROMO'}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 text-xs leading-relaxed">{n.message}</p>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{fmtDate((n as AppNotification & { sentAt?: string }).sentAt || n.createdAt)}</span>
                        {n.actionUrl && <span className="flex items-center gap-1 text-blue-500 font-semibold"><ExternalLink className="w-3 h-3" />{n.actionUrl}</span>}
                      </div>
                    </div>
                    <button onClick={() => handleDeleteNotification(n.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SUBTAB 2: PUSH AUDIT & VALIDATION
      ══════════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'audit' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* Test Push Form */}
          <div className="lg:col-span-2 space-y-4">

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Sent', value: auditStats.sent, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', icon: Send },
                { label: 'Delivered', value: auditStats.fetched, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
                { label: 'Failed', value: auditStats.failed, color: 'text-red-600', bg: 'bg-red-50 border-red-200', icon: XCircle },
              ].map(({ label, value, color, bg, icon: Icon }) => (
                <div key={label} className={`rounded-xl border p-3 text-center ${bg}`}>
                  <Icon className={`w-5 h-5 mx-auto mb-1 ${color}`} />
                  <div className={`text-xl font-black ${color}`}>{value}</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</div>
                </div>
              ))}
            </div>

            {/* Test Form */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Zap className="w-5 h-5 text-amber-500" />
                <h3 className="font-extrabold text-slate-900">Send Test Push</h3>
                <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200 ml-auto">AUDIT MODE</span>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700 flex gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>This sends a real notification to the backend and immediately verifies it appears in the mobile API response. The test notification is auto-cleaned after 3 seconds.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Test Title</label>
                <input type="text" value={testTitle} onChange={e => setTestTitle(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Test Message</label>
                <textarea value={testMessage} onChange={e => setTestMessage(e.target.value)} rows={3}
                  className="w-full text-sm border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-amber-400 resize-none" />
              </div>

              <button onClick={handleTestPush} disabled={isTesting}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-3 rounded-xl transition-all shadow disabled:opacity-60">
                {isTesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                {isTesting ? 'Running Audit…' : 'Run Push Audit Test'}
              </button>

              <button onClick={() => setAuditLog([])}
                className="w-full text-xs font-semibold text-slate-500 hover:text-red-600 transition-colors py-1">
                Clear Audit Log
              </button>
            </div>

            {/* How It Works */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-2"><Eye className="w-4 h-4 text-blue-500" />How the audit works</h4>
              {[
                ['1', 'POST /api/notifications', 'Creates notification in DB'],
                ['2', 'GET /api/notifications', 'Fetches all notifications (mobile polls this)'],
                ['3', 'ID Match Check', 'Confirms new notification appears in list'],
                ['4', 'Auto Cleanup', 'Deletes the test notification after 3s'],
              ].map(([num, step, desc]) => (
                <div key={step} className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">{num}</span>
                  <div>
                    <div className="text-xs font-bold text-slate-800 font-mono">{step}</div>
                    <div className="text-[11px] text-slate-500">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Audit Log */}
          <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-slate-900">Live Audit Log</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                  LIVE
                </span>
                <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{auditLog.length} events</span>
              </div>
            </div>

            {auditLog.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Activity className="w-14 h-14 mb-4 opacity-20" />
                <p className="text-sm font-semibold">No audit events yet.</p>
                <p className="text-xs mt-1">Click &ldquo;Run Push Audit Test&rdquo; to begin validation.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto font-mono text-xs pr-1">
                {auditLog.map((evt) => {
                  const colors: Record<AuditEvent['type'], string> = {
                    SENT: 'border-l-blue-500 bg-blue-50/50',
                    DELIVERED: 'border-l-emerald-500 bg-emerald-50/50',
                    FAILED: 'border-l-red-500 bg-red-50/50',
                    FETCH: 'border-l-indigo-400 bg-indigo-50/30',
                    INFO: 'border-l-slate-400 bg-slate-50',
                  };
                  const icons: Record<AuditEvent['type'], React.ReactNode> = {
                    SENT: <Send className="w-3.5 h-3.5 text-blue-600" />,
                    DELIVERED: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
                    FAILED: <XCircle className="w-3.5 h-3.5 text-red-600" />,
                    FETCH: <Users className="w-3.5 h-3.5 text-indigo-600" />,
                    INFO: <Info className="w-3.5 h-3.5 text-slate-500" />,
                  };
                  return (
                    <div key={evt.id} className={`border-l-4 pl-3 py-2 pr-2 rounded-r-lg ${colors[evt.type]}`}>
                      <div className="flex items-center gap-2 mb-0.5">
                        {icons[evt.type]}
                        <span className="font-bold text-slate-800 text-[11px] not-italic">{evt.title}</span>
                        <span className="ml-auto text-[10px] text-slate-400">{fmtTime(evt.timestamp)}</span>
                      </div>
                      <p className="text-[10px] text-slate-600 leading-relaxed font-sans">{evt.detail}</p>
                      {evt.deliveredCount !== undefined && (
                        <span className="text-[10px] text-emerald-700 font-bold">{evt.deliveredCount} notifications in API response</span>
                      )}
                    </div>
                  );
                })}
                <div ref={logEndRef} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SUBTAB 3: OFFERS & COUPONS
      ══════════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'offers' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* Create Form */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Tag className="w-5 h-5 text-blue-600" />
              <h3 className="font-extrabold text-slate-900">New Offer Coupon</h3>
            </div>
            <form onSubmit={handleCreateOffer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Coupon Code *</label>
                <input type="text" value={offerCode} onChange={e => setOfferCode(e.target.value.toUpperCase())}
                  placeholder="UPSC2025" className="w-full text-sm font-mono font-bold uppercase tracking-widest border border-slate-300 rounded-xl p-2.5 bg-blue-50 text-blue-900 focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Offer Title *</label>
                <input type="text" value={offerTitle} onChange={e => setOfferTitle(e.target.value)}
                  placeholder="20% Off Prelims Test Series" className="w-full text-sm border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea value={offerDescription} onChange={e => setOfferDescription(e.target.value)} rows={2}
                  placeholder="Terms and conditions…" className="w-full text-sm border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Discount Type</label>
                  <select value={discountType} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDiscountType(e.target.value as typeof discountType)}
                    className="w-full text-sm border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500">
                    <option value="PERCENTAGE">% Percentage</option>
                    <option value="FLAT">₹ Flat Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{discountType === 'PERCENTAGE' ? 'Discount %' : 'Amount ₹'} *</label>
                  <input type="number" min="1" value={discountValue} onChange={e => setDiscountValue(Number(e.target.value))}
                    className="w-full text-sm font-bold border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Min Cart (₹)</label>
                  <input type="number" min="0" value={minOrderAmount} onChange={e => setMinOrderAmount(Number(e.target.value))}
                    className="w-full text-sm border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500" />
                </div>
                {discountType === 'PERCENTAGE' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Max Discount (₹)</label>
                    <input type="number" min="0" value={maxDiscountAmount} onChange={e => setMaxDiscountAmount(Number(e.target.value))}
                      className="w-full text-sm border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500" />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Applicable To</label>
                  <select value={applicableTo} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setApplicableTo(e.target.value as typeof applicableTo)}
                    className="w-full text-sm border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500">
                    <option value="ALL">All Products</option>
                    <option value="COURSES">Live Courses</option>
                    <option value="TEST_SERIES">Test Series</option>
                    <option value="BOOKS">Books Store</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Usage Limit</label>
                  <input type="number" min="1" value={usageLimit} onChange={e => setUsageLimit(Number(e.target.value))}
                    className="w-full text-sm border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Expiry Date</label>
                <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow disabled:opacity-60">
                <Plus className="w-4 h-4" />
                Activate Coupon
              </button>
            </form>
          </div>

          {/* Offers List */}
          <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-slate-900">Active Coupons</h3>
              </div>
              <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{offers.length} total</span>
            </div>
            {offers.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Tag className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No offers yet. Create one using the form.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                {offers.map((o) => (
                  <div key={o.id}
                    className={`p-4 rounded-xl border flex items-start justify-between gap-3 transition-all ${o.isActive ? 'border-slate-200 bg-white hover:border-blue-200' : 'border-slate-100 bg-slate-50 opacity-60'}`}>
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2.5 py-1 text-sm font-mono font-black rounded-lg bg-blue-50 text-blue-700 border border-blue-200 tracking-wider">{o.code}</span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${o.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                          {o.isActive ? '● Active' : '○ Paused'}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          {o.discountType === 'PERCENTAGE' ? `${o.discountValue}% OFF` : `₹${o.discountValue} OFF`}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-slate-100 text-slate-500">{o.applicableTo}</span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">{o.title}</h4>
                      {o.description && <p className="text-slate-500 text-xs">{o.description}</p>}
                      <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400">
                        <span>Min: ₹{o.minOrderAmount || 0}</span>
                        {o.maxDiscountAmount ? <span>Cap: ₹{o.maxDiscountAmount}</span> : null}
                        <span>Used: {o.usedCount || o.usageCount || 0}/{o.usageLimit || '∞'}</span>
                        {(o.expiryDate || o.endDate) && (
                          <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />Exp: {new Date((o.expiryDate || o.endDate) as string).toLocaleDateString('en-IN')}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => handleToggleOfferStatus(o)}
                        className={`px-2.5 py-1.5 text-[11px] font-bold rounded-lg border transition-colors ${o.isActive ? 'border-amber-300 text-amber-700 hover:bg-amber-50' : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'}`}>
                        {o.isActive ? 'Pause' : 'Activate'}
                      </button>
                      <button onClick={() => handleDeleteOffer(o.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
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