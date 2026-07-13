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

const PLAN_KEYS = Object.keys(PLANS) as (keyof typeof PLANS)[]
const STATUS_KEYS = Object.keys(STATUS_META) as (keyof typeof STATUS_META)[]

export default function ClientsListPage() {
  const [accounts, setAccounts] = useState<AccountRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isProcessingBulk, setIsProcessingBulk] = useState(false)

  useEffect(() => {
    fetch('/api/admin/clients')
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); return }
        setAccounts(d.accounts ?? [])
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = accounts.filter((a) => {
    const q = search.toLowerCase()
    const matchSearch =
      !q ||
      a.name.toLowerCase().includes(q) ||
      a.owner.email.toLowerCase().includes(q) ||
      a.owner.full_name.toLowerCase().includes(q)
    const matchPlan = planFilter === 'all' || a.plan === planFilter
    const matchStatus = statusFilter === 'all' || a.status === statusFilter
    return matchSearch && matchPlan && matchStatus
  })

  // Selection handlers
  const allSelected = filtered.length > 0 && filtered.every((a) => selectedIds.has(a.id))
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      const newSet = new Set(selectedIds)
      filtered.forEach(a => newSet.add(a.id))
      setSelectedIds(newSet)
    }
  }

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setSelectedIds(newSet)
  }

  const handleBulkAction = async (action: string, plan?: string) => {
    if (selectedIds.size === 0) return
    setIsProcessingBulk(true)
    try {
      const res = await fetch('/api/admin/clients/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_ids: Array.from(selectedIds),
          action,
          plan
        })
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)
      
      // Update local state instead of full refetch to be snappy
      setAccounts(prev => prev.map(a => {
        if (selectedIds.has(a.id)) {
          if (action === 'suspend') return { ...a, status: 'suspended' }
          if (action === 'activate') return { ...a, status: 'active' }
          if (action === 'change_plan' && plan) return { ...a, plan }
        }
        return a
      }))
      setSelectedIds(new Set())
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsProcessingBulk(false)
    }
  }

  if (loading) return <Loader />
  if (error) return <ErrorState message={error} />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clients</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {accounts.length} registered {accounts.length === 1 ? 'client' : 'clients'}
          </p>
        </div>
        <Link
          href="/admin/create-client"
          id="btn-new-client"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary-hover active:scale-95"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Client
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          id="search-clients"
          type="search"
          placeholder="Search name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-64 rounded-lg border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <select
          id="filter-plan"
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="h-9 rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All Plans</option>
          {PLAN_KEYS.map((p) => <option key={p} value={p}>{PLANS[p].label}</option>)}
        </select>
        <select
          id="filter-status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All Statuses</option>
          {STATUS_KEYS.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
        </select>
        {(search || planFilter !== 'all' || statusFilter !== 'all') && (
          <button
            onClick={() => { setSearch(''); setPlanFilter('all'); setStatusFilter('all') }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Clear filters
          </button>
        )}
        <span className="ml-auto text-xs text-muted-foreground">{filtered.length} shown</span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-5 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                  />
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Client</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Plan</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Contacts</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Msgs / Mo</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Members</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Joined</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((acc) => {
                const planMeta = PLANS[acc.plan as keyof typeof PLANS]
                const statusMeta = STATUS_META[acc.status as keyof typeof STATUS_META]
                const cPct = usagePct(acc.usage.contacts, acc.max_contacts)
                const mPct = usagePct(acc.usage.messages_this_month, acc.max_messages_pm)
                return (
                  <tr key={acc.id} className="transition-colors hover:bg-muted/20">
                    <td className="px-5 py-3.5">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(acc.id)}
                        onChange={() => toggleSelect(acc.id)}
                        className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                      />
                    </td>
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="font-medium text-foreground">{acc.name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${planMeta?.badge ?? ''}`}>
                        {planMeta?.label ?? acc.plan}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusMeta?.badge ?? ''}`}>
                        {statusMeta?.label ?? acc.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <UsageBar used={acc.usage.contacts} max={acc.max_contacts} pct={cPct} />
                    </td>
                    <td className="px-5 py-3.5">
                      <UsageBar used={acc.usage.messages_this_month} max={acc.max_messages_pm} pct={mPct} />
                    </td>
                    <td className="px-5 py-3.5 text-xs tabular-nums text-muted-foreground">
                      {acc.usage.members}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground">
                      {new Date(acc.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/admin/clients/${acc.id}`}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-muted-foreground text-sm">No clients match your filters.</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full border border-border bg-background shadow-xl px-6 py-3 flex items-center gap-4 animate-in slide-in-from-bottom-10 z-50">
          <span className="text-sm font-medium">
            {selectedIds.size} {selectedIds.size === 1 ? 'client' : 'clients'} selected
          </span>
          <div className="h-4 w-px bg-border" />
          <div className="flex gap-2 items-center">
            <button
              disabled={isProcessingBulk}
              onClick={() => handleBulkAction('activate')}
              className="text-sm font-medium text-green-500 hover:text-green-600 disabled:opacity-50"
            >
              Activate
            </button>
            <button
              disabled={isProcessingBulk}
              onClick={() => handleBulkAction('suspend')}
              className="text-sm font-medium text-destructive hover:text-destructive/80 disabled:opacity-50"
            >
              Suspend
            </button>
            
            <select
              disabled={isProcessingBulk}
              onChange={(e) => {
                if (e.target.value) {
                  handleBulkAction('change_plan', e.target.value)
                  e.target.value = ''
                }
              }}
              className="text-sm rounded-md border border-input h-8 px-2 bg-transparent focus:ring-0 cursor-pointer"
            >
              <option value="">Change Plan...</option>
              {PLAN_KEYS.map((p) => <option key={p} value={p}>{PLANS[p].label}</option>)}
            </select>
          </div>
        </div>
      )}
    </div>
  )
}

function UsageBar({ used, max, pct }: { used: number; max: number; pct: number }) {
  const isUnlimited = max === -1 || max === 9999999
  return (
    <div className="space-y-1">
      <span className="text-xs tabular-nums text-foreground">
        {used.toLocaleString()} / {formatLimit(max)}
      </span>
      {!isUnlimited && (
        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${pct >= 90 ? 'bg-destructive' : pct >= 70 ? 'bg-amber-400' : 'bg-emerald-400'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  )
}

function Loader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6">
      <p className="text-sm text-destructive">{message}</p>
    </div>
  )
}
