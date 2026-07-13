'use client'

import { useState, useEffect } from 'react'
import { Search, Eye, Ban, RefreshCcw } from 'lucide-react'

// Mock data
interface Subscription {
  id: string
  clientName: string
  planName: string
  status: string
  billingCycle: string
  amount: number
  nextBillingDate: string
}

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setTimeout(() => {
      setSubscriptions([
        { id: '1', clientName: 'Acme Corp', planName: 'Pro', status: 'active', billingCycle: 'monthly', amount: 99, nextBillingDate: '2026-08-01' },
        { id: '2', clientName: 'Global Tech', planName: 'Enterprise', status: 'active', billingCycle: 'annual', amount: 4990, nextBillingDate: '2027-01-15' },
        { id: '3', clientName: 'Local Shop', planName: 'Starter', status: 'past_due', billingCycle: 'monthly', amount: 29, nextBillingDate: '2026-07-01' },
      ])
      setLoading(false)
    }, 500)
  }, [])

  if (loading) return <div className="p-8">Loading subscriptions...</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Subscriptions & Billing</h1>
          <p className="text-sm text-muted-foreground">Manage active client subscriptions, invoices, and billing issues.</p>
        </div>
        
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search client..."
            className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Client</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Plan</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Amount</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Next Billing</th>
                <th className="px-6 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {subscriptions.map((sub) => (
                <tr key={sub.id} className="hover:bg-muted/20">
                  <td className="px-6 py-4 font-medium text-foreground">{sub.clientName}</td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {sub.planName} <span className="text-xs uppercase">({sub.billingCycle})</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      sub.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-orange-500/15 text-orange-400'
                    }`}>
                      {sub.status === 'active' ? 'Active' : 'Past Due'}
                    </span>
                  </td>
                  <td className="px-6 py-4 tabular-nums">${sub.amount}</td>
                  <td className="px-6 py-4 text-muted-foreground">{new Date(sub.nextBillingDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground" title="View Details">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground" title="Sync Payment">
                        <RefreshCcw className="h-4 w-4" />
                      </button>
                      <button className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Cancel/Suspend">
                        <Ban className="h-4 w-4" />
                      </button>
                    </div>
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
