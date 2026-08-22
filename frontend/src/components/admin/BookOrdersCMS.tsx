'use client';

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Download,
  Truck,
  CheckCircle2,
  Clock,
  User,
  Phone,
  MapPin,
  Edit3,
  Trash2,
  X,
  RefreshCw,
  Mail,
  Send
} from 'lucide-react';
import { db, BookOrder } from '@/services/db';

export default function BookOrdersCMS() {
  const [orders, setOrders] = useState<BookOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Shipping / Full Edit Order Modal state
  const [selectedOrder, setSelectedOrder] = useState<BookOrder | null>(null);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerMobile, setCustomerMobile] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [state, setState] = useState<string>('');
  const [pincode, setPincode] = useState<string>('');
  const [bookTitle, setBookTitle] = useState<string>('');
  const [language, setLanguage] = useState<string>('');
  const [price, setPrice] = useState<number>(0);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [paymentStatus, setPaymentStatus] = useState<string>('PAID');
  const [deliveryStatus, setDeliveryStatus] = useState<string>('PROCESSING');
  const [courierName, setCourierName] = useState<string>('');
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [updating, setUpdating] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await db.getBookOrders(statusFilter);
      setOrders(data);
    } catch (err) {
      console.error('Error fetching book orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleOpenEditModal = (ord: BookOrder) => {
    setSelectedOrder(ord);
    setCustomerName(ord.customerName || '');
    setCustomerMobile(ord.customerMobile || '');
    setCustomerEmail(ord.customerEmail || '');
    setAddress(ord.address || '');
    setCity(ord.city || '');
    setState(ord.state || '');
    setPincode(ord.pincode || '');
    setBookTitle(ord.bookTitle || '');
    setLanguage(ord.language || 'Bilingual');
    setPrice(ord.price || 0);
    setDeliveryFee(ord.deliveryFee || 0);
    setTotalAmount(ord.totalAmount || 0);
    setPaymentStatus(ord.paymentStatus || 'PAID');
    setDeliveryStatus(ord.deliveryStatus || 'PROCESSING');
    setCourierName(ord.courierName || 'India Post Speed Post');
    setTrackingNumber(ord.trackingNumber || '');
    setNotes(ord.notes || '');
  };

  const handleSaveOrderUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setUpdating(true);
    try {
      const updates = {
        customerName,
        customerMobile,
        customerEmail,
        address,
        city,
        state,
        pincode,
        bookTitle,
        language,
        price,
        deliveryFee,
        totalAmount,
        paymentStatus: paymentStatus as any,
        deliveryStatus: deliveryStatus as any,
        courierName,
        trackingNumber,
        notes
      };

      const ok = await db.updateBookOrder(selectedOrder.id || selectedOrder.orderId, updates);

      if (ok) {
        alert('Book Order details updated successfully! Status notification sent.');
        setSelectedOrder(null);
        fetchOrders();
      } else {
        alert('Failed to update order details.');
      }
    } catch (err) {
      console.error('Update order error:', err);
      alert('Network error while updating order.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteOrder = async (ord: BookOrder) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete order "${ord.orderId}" for ${ord.customerName}?`);
    if (!confirmDelete) return;

    try {
      const ok = await db.deleteBookOrder(ord.id || ord.orderId);
      if (ok) {
        alert(`Order ${ord.orderId} deleted successfully.`);
        fetchOrders();
      } else {
        alert('Failed to delete order.');
      }
    } catch (err) {
      console.error('Delete order error:', err);
      alert('Error deleting order.');
    }
  };

  const handleExportCSV = () => {
    if (orders.length === 0) {
      alert('No orders available to export.');
      return;
    }

    const headers = [
      'Order Date',
      'Order ID',
      'Payment ID',
      'Book Title',
      'Language',
      'Price (₹)',
      'Delivery Fee (₹)',
      'Total Paid (₹)',
      'Customer Name',
      'Mobile Number',
      'Email',
      'Street Address',
      'City',
      'State',
      'Pincode',
      'Payment Status',
      'Delivery Status',
      'Courier Partner',
      'Tracking Number'
    ];

    const rows = filteredOrders.map(o => [
      `"${new Date(o.createdAt).toLocaleString('en-IN')}"`,
      `"${o.orderId}"`,
      `"${o.paymentId || ''}"`,
      `"${o.bookTitle.replace(/"/g, '""')}"`,
      `"${o.language || 'Bilingual'}"`,
      o.price,
      o.deliveryFee,
      o.totalAmount,
      `"${o.customerName.replace(/"/g, '""')}"`,
      `"${o.customerMobile}"`,
      `"${o.customerEmail || ''}"`,
      `"${o.address.replace(/"/g, '""')}"`,
      `"${o.city}"`,
      `"${o.state}"`,
      `"${o.pincode}"`,
      `"${o.paymentStatus}"`,
      `"${o.deliveryStatus}"`,
      `"${o.courierName || ''}"`,
      `"${o.trackingNumber || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FA_Publications_Book_Orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const filteredOrders = orders.filter(o => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.customerName.toLowerCase().includes(q) ||
      o.customerMobile.toLowerCase().includes(q) ||
      o.orderId.toLowerCase().includes(q) ||
      (o.paymentId && o.paymentId.toLowerCase().includes(q)) ||
      o.bookTitle.toLowerCase().includes(q) ||
      o.city.toLowerCase().includes(q) ||
      o.pincode.toLowerCase().includes(q)
    );
  });

  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const processingCount = orders.filter(o => o.deliveryStatus === 'PROCESSING').length;
  const shippedCount = orders.filter(o => o.deliveryStatus === 'SHIPPED' || o.deliveryStatus === 'OUT_FOR_DELIVERY').length;
  const deliveredCount = orders.filter(o => o.deliveryStatus === 'DELIVERED').length;

  return (
    <div className="space-y-6 font-sans">

      {/* Top Title & Header Card */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5" /> Book Orders & Logistics
          </span>
          <h2 className="text-xl font-heading font-black text-slate-900 dark:text-white mt-0.5">
            FA Publications Sales Manager
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track book purchases, delivery addresses, Razorpay verification, and automated email dispatch notifications.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchOrders}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export Shipping CSV ({filteredOrders.length})</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Total Book Sales</span>
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{orders.length}</p>
          <p className="text-xs text-amber-600 dark:text-amber-400 font-bold">Revenue: ₹{totalRevenue.toLocaleString('en-IN')}</p>
        </div>

        <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">To Dispatch</span>
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{processingCount}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Orders awaiting courier packing</p>
        </div>

        <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">In Transit</span>
            <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-500">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-sky-600 dark:text-sky-400">{shippedCount}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Dispatched via Speed Post/Courier</p>
        </div>

        <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Delivered</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{deliveredCount}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Fulfilled &amp; delivered orders</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-4 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search Name, Mobile, Pincode, Order ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 pl-10 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-amber-500 focus:outline-none font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto py-1">
          {['ALL', 'PROCESSING', 'SHIPPED', 'DELIVERED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                statusFilter === st
                  ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {st === 'ALL' ? 'All Orders' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Book Orders Table */}
      <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/10">
              <tr>
                <th className="px-5 py-4 font-black">Order Details</th>
                <th className="px-5 py-4 font-black">Book Purchased</th>
                <th className="px-5 py-4 font-black">Amount</th>
                <th className="px-5 py-4 font-black">Aspirant / Shipping Address</th>
                <th className="px-5 py-4 font-black">Status</th>
                <th className="px-5 py-4 font-black text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/10 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    Loading book orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    No book orders found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(ord => (
                  <tr key={ord.id || ord.orderId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    
                    {/* Order Details */}
                    <td className="px-5 py-4">
                      <div className="font-mono font-bold text-amber-600 dark:text-amber-400">{ord.orderId}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">Pay ID: {ord.paymentId || 'N/A'}</div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        {new Date(ord.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </td>

                    {/* Book Purchased */}
                    <td className="px-5 py-4 max-w-[220px]">
                      <div className="font-bold text-slate-900 dark:text-white line-clamp-1">{ord.bookTitle}</div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                          {ord.language || 'Bilingual'}
                        </span>
                        <span>•</span>
                        <span>{ord.editionYear || '2025-26'}</span>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="px-5 py-4">
                      <div className="font-black text-slate-900 dark:text-white text-sm">₹{ord.totalAmount}</div>
                      <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                        {ord.paymentStatus}
                      </span>
                    </td>

                    {/* Aspirant & Address */}
                    <td className="px-5 py-4 max-w-[280px]">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>{ord.customerName}</span>
                      </div>
                      <div className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5 mt-0.5 font-mono text-[11px]">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{ord.customerMobile}</span>
                        {ord.customerEmail && (
                          <span className="text-[10px] text-slate-400 truncate max-w-[120px]">({ord.customerEmail})</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        <MapPin className="w-3 h-3 text-amber-500 inline mr-1 shrink-0" />
                        {ord.address}, {ord.city}, {ord.state} – <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{ord.pincode}</span>
                      </div>
                    </td>

                    {/* Status & Courier */}
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        ord.deliveryStatus === 'DELIVERED'
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                          : ord.deliveryStatus === 'SHIPPED' || ord.deliveryStatus === 'OUT_FOR_DELIVERY'
                          ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30'
                          : 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30'
                      }`}>
                        {ord.deliveryStatus}
                      </span>

                      {ord.trackingNumber && (
                        <div className="mt-1.5 text-[10px] text-slate-500">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{ord.courierName}:</span>{' '}
                          <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{ord.trackingNumber}</span>
                        </div>
                      )}
                    </td>

                    {/* Action */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(ord)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 font-bold text-xs transition-colors"
                          title="Edit order details & dispatch status"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-500" />
                          <span>Edit / Track</span>
                        </button>

                        <button
                          onClick={() => handleDeleteOrder(ord)}
                          className="inline-flex items-center justify-center p-1.5 rounded-xl border border-red-500/20 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 transition-colors"
                          title="Delete this order"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit & Update Order Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="w-full max-w-2xl my-8 rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 text-slate-900 dark:text-slate-100 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4 sticky top-0 bg-white dark:bg-slate-900 z-10">
              <div>
                <h3 className="font-heading font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-amber-500" />
                  Edit &amp; Update Book Order
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">Order ID: {selectedOrder.orderId}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOrderUpdate} className="space-y-5">
              
              {/* Section 1: Customer Information */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Customer Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Customer Name</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white font-medium focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Mobile Number</label>
                    <input
                      type="text"
                      value={customerMobile}
                      onChange={e => setCustomerMobile(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white font-mono font-medium focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={e => setCustomerEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white font-medium focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Delivery Address */}
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-white/10">
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Delivery Shipping Address
                </h4>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Street Address / House No.</label>
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white font-medium focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white font-medium focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">State</label>
                    <input
                      type="text"
                      value={state}
                      onChange={e => setState(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white font-medium focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Pincode</label>
                    <input
                      type="text"
                      value={pincode}
                      onChange={e => setPincode(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white font-mono font-bold focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Book & Payment Info */}
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-white/10">
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" /> Book Item &amp; Payment Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Book Title</label>
                    <input
                      type="text"
                      value={bookTitle}
                      onChange={e => setBookTitle(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white font-bold focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Medium / Language</label>
                    <input
                      type="text"
                      value={language}
                      onChange={e => setLanguage(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white font-medium focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Book Price (₹)</label>
                    <input
                      type="number"
                      value={price}
                      onChange={e => setPrice(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white font-bold focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Total Paid (₹)</label>
                    <input
                      type="number"
                      value={totalAmount}
                      onChange={e => setTotalAmount(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white font-extrabold text-emerald-600 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Payment Status</label>
                    <select
                      value={paymentStatus}
                      onChange={e => setPaymentStatus(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 p-2 text-xs text-slate-900 dark:text-white font-bold focus:border-amber-500 focus:outline-none"
                    >
                      <option value="PAID">PAID</option>
                      <option value="PENDING">PENDING</option>
                      <option value="FAILED">FAILED</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 4: Dispatch & Tracking Info */}
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-white/10">
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5" /> Dispatch &amp; Logistics Tracking
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Delivery Status</label>
                    <select
                      value={deliveryStatus}
                      onChange={e => setDeliveryStatus(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 p-2 text-xs text-slate-900 dark:text-white font-extrabold focus:border-amber-500 focus:outline-none"
                    >
                      <option value="PROCESSING">PROCESSING (Awaiting Dispatch)</option>
                      <option value="SHIPPED">SHIPPED (Handed to Courier)</option>
                      <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
                      <option value="DELIVERED">DELIVERED (Completed)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Courier Partner Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Speed Post / DTDC"
                      value={courierName}
                      onChange={e => setCourierName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white font-medium focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Tracking Number / AWB</label>
                    <input
                      type="text"
                      placeholder="e.g. EM123456789IN"
                      value={trackingNumber}
                      onChange={e => setTrackingNumber(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white font-mono font-bold focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Internal Notes</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Packed in hardcover bubble mailer."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs text-slate-900 dark:text-white focus:border-amber-500 focus:outline-none resize-none font-medium"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300 font-semibold">
                <Send className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Saving changes will automatically trigger an email notification to <strong>{customerEmail || customerName}</strong>.</span>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-white/10 sticky bottom-0 bg-white dark:bg-slate-900 z-10">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={updating}
                  className="px-6 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black transition-all shadow-md disabled:opacity-50 flex items-center gap-1.5"
                >
                  {updating ? 'Saving Changes...' : 'Save Order Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
