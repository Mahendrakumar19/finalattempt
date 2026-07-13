'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { PLANS, STATUS_META, formatLimit, usagePct, type Plan, type AccountStatus } from '@/lib/plan-limits'
import { AdminInvoicesPanel } from './invoices-panel'

interface AccountDetail {
  id: string
  name: string
  plan: Plan
  status: AccountStatus
  trial_ends_at: string | null
  notes: string | null
  max_contacts: number
  max_messages_pm: number
  created_at: string
  owner: { user_id: string; full_name: string; email: string; avatar_url: string | null }
  stats: { contacts: number; conversations: number; members: number }
  usage_history: { month: string; messages_sent: number; contacts_count: number }[]
  members: { id: string; full_name: string | null; email: string; account_role: string; avatar_url: string | null }[]
}

const PLAN_KEYS = Object.keys(PLANS) as Plan[]
const STATUS_KEYS = Object.keys(STATUS_META) as AccountStatus[]

export default function ClientDetailPage() {
  const { accountId } = useParams<{ accountId: string }>()
  const router = useRouter()
  const [account, setAccount] = useState<AccountDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  // Edit fields
  const [plan, setPlan] = useState<Plan>('free')
  const [status, setStatus] = useState<AccountStatus>('active')
  const [notes, setNotes] = useState('')
  const [maxContacts, setMaxContacts] = useState(500)
  const [maxMessagesPm, setMaxMessagesPm] = useState(1000)

  useEffect(() => {
    fetch(`/api/admin/clients/${accountId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); return }
        const a = d.account as AccountDetail
        setAccount(a)
        setPlan(a.plan)
        setStatus(a.status)
        setNotes(a.notes ?? '')
        setMaxContacts(a.max_contacts)
        setMaxMessagesPm(a.max_messages_pm)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [accountId])

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/clients/${accountId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, status, notes, max_contacts: maxContacts, max_messages_pm: maxMessagesPm }),
      })
      const data = await res.json()
      if (!res.ok) { showToast('error', data.error ?? 'Save failed'); return }
      showToast('success', 'Changes saved successfully')
      setAccount((prev) => prev ? { ...prev, plan, status, notes, max_contacts: maxContacts, max_messages_pm: maxMessagesPm } : prev)
    } catch (e: any) {
      showToast('error', e.message)
    } finally {
      setSaving(false)
    }
  }

  const quickStatus = async (newStatus: AccountStatus) => {
    setStatus(newStatus)
    const res = await fetch(`/api/admin/clients/${accountId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    const data = await res.json()
    if (!res.ok) { showToast('error', data.error ?? 'Failed'); setStatus(account?.status ?? 'active'); return }
    showToast('success', `Account ${newStatus}`)
    setAccount((prev) => prev ? { ...prev, status: newStatus } : prev)
  }

  if (loading) return <Loader />
  if (error || !account) return <ErrorState message={error ?? 'Account not found'} />

  const planMeta = PLANS[account.plan]
  const statusMeta = STATUS_META[account.status]
  const cPct = usagePct(account.stats.contacts, account.max_contacts)
  const mPct = usagePct(account.usage_history[0]?.messages_sent ?? 0, account.max_messages_pm)

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed right-6 top-6 z-50 flex items-center gap-3 rounded-xl px-5 py-3 text-sm font-medium shadow-xl transition-all ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-destructive text-white'}`}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.msg}
        </div>
      )}

      {/* Back */}
      <div className="flex items-center gap-2">
        <Link href="/admin/clients" className="text-xs text-muted-foreground hover:text-foreground">
          ← Clients
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-xs text-foreground">{account.name}</span>
      </div>

      {/* Account header */}
      <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-2xl font-bold text-primary uppercase">
            {account.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{account.name}</h1>
            <p className="text-sm text-muted-foreground">{account.owner.email}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${planMeta?.badge}`}>
                {planMeta?.label}
              </span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusMeta?.badge}`}>
                {statusMeta?.label}
              </span>
            </div>
          </div>
        </div>
        {/* Quick actions */}
        <div className="flex gap-2">
          {account.status !== 'active' && (
            <button
              id="btn-activate"
              onClick={() => quickStatus('active')}
              className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-medium text-emerald-400 transition-all hover:bg-emerald-500/20 active:scale-95"
            >
              ✓ Activate
            </button>
          )}
          {account.status === 'active' && (
            <button
              id="btn-suspend"
              onClick={() => quickStatus('suspended')}
              className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-xs font-medium text-orange-400 transition-all hover:bg-orange-500/20 active:scale-95"
            >
              🚫 Suspend
            </button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Contacts" value={account.stats.contacts} limit={account.max_contacts} pct={cPct} />
        <MetricCard
          label="Messages This Month"
          value={account.usage_history[0]?.messages_sent ?? 0}
          limit={account.max_messages_pm}
          pct={mPct}
        />
        <MetricCard label="Team Members" value={account.stats.members} limit={-1} pct={0} />
      </div>

      {/* Edit panel */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-5 text-sm font-semibold text-foreground">Plan & Limits</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          {/* Plan */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="select-plan">Plan</label>
            <select
              id="select-plan"
              value={plan}
              onChange={(e) => {
                const p = e.target.value as Plan
                setPlan(p)
                const meta = PLANS[p]
                setMaxContacts(meta.maxContacts === -1 ? 9999999 : meta.maxContacts)
                setMaxMessagesPm(meta.maxMessagesPm === -1 ? 9999999 : meta.maxMessagesPm)
              }}
              className="w-full rounded-lg border border-input bg-card-2 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {PLAN_KEYS.map((p) => <option key={p} value={p}>{PLANS[p].label}</option>)}
            </select>
            <p className="text-[11px] text-muted-foreground">{PLANS[plan]?.description}</p>
          </div>
          {/* Status */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="select-status">Status</label>
            <select
              id="select-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as AccountStatus)}
              className="w-full rounded-lg border border-input bg-card-2 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {STATUS_KEYS.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
            </select>
          </div>
          {/* Max contacts */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="input-max-contacts">
              Max Contacts (9999999 = unlimited)
            </label>
            <input
              id="input-max-contacts"
              type="number"
              min={1}
              value={maxContacts}
              onChange={(e) => setMaxContacts(Number(e.target.value))}
              className="w-full rounded-lg border border-input bg-card-2 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          {/* Max messages */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="input-max-msgs">
              Max Messages / Month (9999999 = unlimited)
            </label>
            <input
              id="input-max-msgs"
              type="number"
              min={1}
              value={maxMessagesPm}
              onChange={(e) => setMaxMessagesPm(Number(e.target.value))}
              className="w-full rounded-lg border border-input bg-card-2 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          {/* Notes */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="input-notes">
              Internal Notes (invoice refs, etc.)
            </label>
            <textarea
              id="input-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Invoice #1234, paid annually…"
              className="w-full resize-none rounded-lg border border-input bg-card-2 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <button
            id="btn-save-changes"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary-hover disabled:opacity-50 active:scale-95"
          >
            {saving && <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Team members */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-sm font-semibold text-foreground">Team Members ({account.members.length})</h2>
        </div>
        <div className="divide-y divide-border">
          {account.members.map((m) => (
            <div key={m.id} className="flex items-center justify-between px-6 py-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary uppercase">
                  {(m.full_name ?? m.email).charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{m.full_name ?? '—'}</p>
                  <p className="text-xs text-muted-foreground">{m.email}</p>
                </div>
              </div>
              <span className="rounded-full border border-border px-2.5 py-0.5 text-xs capitalize text-muted-foreground">
                {m.account_role}
              </span>
            </div>
          ))}
          {account.members.length === 0 && (
            <p className="px-6 py-4 text-sm text-muted-foreground">No members found.</p>
          )}
        </div>
      </div>

      {/* Usage history */}
      {account.usage_history.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Usage History (last 3 months)</h2>
          <div className="space-y-3">
            {account.usage_history.map((row) => (
              <div key={row.month} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{new Date(row.month).toLocaleDateString('default', { month: 'long', year: 'numeric' })}</span>
                <span className="text-xs tabular-nums text-foreground">{row.messages_sent.toLocaleString()} messages</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invoices */}
      <AdminInvoicesPanel accountId={accountId} />

      {/* Joined */}
      <p className="text-xs text-muted-foreground">
        Account created on {new Date(account.created_at).toLocaleDateString('default', { dateStyle: 'long' })}
      </p>
    </div>
  )
}

function MetricCard({ label, value, limit, pct }: { label: string; value: number; limit: number; pct: number }) {
  const isUnlimited = limit === -1 || limit === 9999999
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold text-foreground tabular-nums">{value.toLocaleString()}</p>
      {!isUnlimited && (
        <>
          <p className="mt-1 text-[11px] text-muted-foreground">of {formatLimit(limit)}</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all ${pct >= 90 ? 'bg-destructive' : pct >= 70 ? 'bg-amber-400' : 'bg-emerald-400'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </>
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
