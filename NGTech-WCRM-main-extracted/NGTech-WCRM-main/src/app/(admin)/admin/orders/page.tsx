'use client'

import { useState, useEffect } from 'react'
import { ShoppingCart, Mail, Phone, Building2, CheckCircle2, XCircle } from 'lucide-react'
import Link from 'next/link'

interface Order {
  id: string
  full_name: string
  email: string
  phone: string
  company_name: string
  plan: string
  billing_cycle: string
  price: number
  status: string // 'pending_transfer', 'completed', 'cancelled'
  created_at: string
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOrders = () => {
    fetch('/api/admin/orders')
      .then((res) => res.json())
      .then((data) => {
        if (data.orders) {
          setOrders(data.orders)
        }
      })
      .catch((err) => console.error("Error fetching orders:", err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      })
      
      if (res.ok) {
        setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o))
      }
    } catch (err) {
      console.error("Error updating status", err)
    }
  }

  if (loading) return <div className="p-8">Loading checkout orders...</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Checkout Orders</h1>
          <p className="text-sm text-muted-foreground">Manage pending bank transfers and manual checkouts.</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Customer</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Contact</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Plan Details</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Price</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-6 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    <ShoppingCart className="mx-auto h-8 w-8 text-muted-foreground/50 mb-3" />
                    No manual checkout orders found yet.
                  </td>
                </tr>
              ) : orders.map((order) => (
                <tr key={order.id} className="hover:bg-muted/20">
                  <td className="px-6 py-4">
                    <p className="font-medium text-foreground">{order.full_name}</p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Building2 className="h-3 w-3" /> {order.company_name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-3 w-3" /> <span className="text-xs">{order.email}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                      <Phone className="h-3 w-3" /> <span className="text-xs">{order.phone || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="capitalize font-medium text-foreground">{order.plan}</div>
                    <div className="text-xs text-muted-foreground capitalize">{order.billing_cycle}</div>
                  </td>
                  <td className="px-6 py-4 font-medium text-foreground">
                    ₹{order.price.toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-4">
                    <select 
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold appearance-none cursor-pointer outline-none border border-transparent hover:border-border transition-colors ${
                        order.status === 'pending_transfer' ? 'bg-amber-500/15 text-amber-500' :
                        order.status === 'completed' ? 'bg-emerald-500/15 text-emerald-500' :
                        'bg-red-500/15 text-red-500'
                      }`}
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                    >
                      <option value="pending_transfer">Pending Transfer</option>
                      <option value="completed">Completed (Paid)</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      href={`/admin/create-client?name=${encodeURIComponent(order.company_name || order.full_name)}&email=${encodeURIComponent(order.email)}`}
                      className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Create Account
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
