'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PLANS, STATUS_META, formatLimit, usagePct } from '@/lib/plan-limits'

interface AccountRow {
  id: string
  name: string
  plan: string
  status: string
  created_at: string
  max_contacts: number
  max_messages_pm: number
  owner: { full_name: string; email: string }
  usage: { contacts: number; messages_this_month: number; members: number }
}

interface Stats {
  total: number
  active: number
  suspended: number
  thisMonth: number
  mrr: number
  totalMessagesPlatform: number
}

export default function AdminDashboardPage() {
  const [accounts, setAccounts] = useState<AccountRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [globalStats, setGlobalStats] = useState({ mrr: 0, total_messages_this_month: 0 })

  useEffect(() => {
    fetch('/api/admin/clients')
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); return }
        setAccounts(d.accounts ?? [])
        if (d.stats) setGlobalStats(d.stats)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const stats: Stats = {
    total: accounts.length,
    active: accounts.filter((a) => a.status === 'active').length,
    suspended: accounts.filter((a) => a.status === 'suspended').length,
    thisMonth: accounts.filter((a) => {
      const d = new Date(a.created_at)
      const now = new Date()
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }).length,
    mrr: globalStats.mrr,
    totalMessagesPlatform: globalStats.total_messages_this_month,
  }

  const planDistribution = Object.keys(PLANS).map((plan) => ({
    plan,
    count: accounts.filter((a) => a.plan === plan).length,
  }))

  if (loading) return <PageLoader />
  if (error) return <ErrorState message={error} />

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Platform Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor all registered clients and their usage across plans.
          </p>
        </div>
        <Link
          href="/admin/create-client"
          id="btn-add-client"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary-hover active:scale-95"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Client
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard label="Total Clients" value={stats.total} icon="👥" color="bg-primary/10 text-primary" />
        <StatCard label="Active" value={stats.active} icon="✅" color="bg-emerald-500/10 text-emerald-400" />
        <StatCard label="Suspended" value={stats.suspended} icon="🚫" color="bg-orange-500/10 text-orange-400" />
        <StatCard label="New This Month" value={stats.thisMonth} icon="🆕" color="bg-blue-500/10 text-blue-400" />
        <StatCard label="MRR" value={`₹${stats.mrr.toLocaleString()}`} icon="💸" color="bg-purple-500/10 text-purple-400" />
        <StatCard label="Messages (Month)" value={stats.totalMessagesPlatform} icon="💬" color="bg-pink-500/10 text-pink-400" />
      </div>

      {/* Plan distribution */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Plan Distribution</h2>
        <div className="grid gap-3 sm:grid-cols-4">
          {planDistribution.map(({ plan, count }) => {
            const meta = PLANS[plan as keyof typeof PLANS]
            const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
            return (
              <div key={plan} className="rounded-lg border border-border bg-card-2 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${meta.badge}`}>
                    {meta.label}
                  </span>
                  <span className="text-lg font-bold text-foreground">{count}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground">{pct}% of total</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent clients */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-sm font-semibold text-foreground">Recent Clients</h2>
          <Link href="/admin/clients" className="text-xs text-primary hover:underline">
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-border bg-muted/30">
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Contacts</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Joined</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {accounts.slice(0, 10).map((acc) => {
                const planMeta = PLANS[acc.plan as keyof typeof PLANS]
                const statusMeta = STATUS_META[acc.status as keyof typeof STATUS_META]
                const contactPct = usagePct(acc.usage.contacts, acc.max_contacts)
                return (
                  <tr key={acc.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-foreground">{acc.name}</p>
                        <p className="text-xs text-muted-foreground">{acc.owner.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${planMeta?.badge ?? ''}`}>
                        {planMeta?.label ?? acc.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusMeta?.badge ?? ''}`}>
                        {statusMeta?.label ?? acc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs tabular-nums text-foreground">
                          {acc.usage.contacts.toLocaleString()} / {formatLimit(acc.max_contacts)}
                        </span>
                        {acc.max_contacts !== -1 && acc.max_contacts !== 9999999 && (
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full rounded-full transition-all ${contactPct >= 90 ? 'bg-destructive' : contactPct >= 70 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                              style={{ width: `${contactPct}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {new Date(acc.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/clients/${acc.id}`}
                        className="text-xs text-primary hover:underline"
                      >
                        Manage →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {accounts.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-muted-foreground">No clients yet.</p>
              <Link href="/admin/create-client" className="mt-2 block text-sm text-primary hover:underline">
                Add your first client
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, color }: { label: string; value: number | string; icon: string; color: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-1.5 text-2xl font-bold text-foreground tabular-nums">{value}</p>
        </div>
        <div className={`rounded-xl p-2.5 text-xl ${color}`}>{icon}</div>
      </div>
    </div>
  )
}

function PageLoader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center">
      <p className="text-sm text-destructive">{message}</p>
    </div>
  )
}
