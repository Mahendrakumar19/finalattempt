'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function CreateClientForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [plan, setPlan] = useState<string>('free')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const [plans, setPlans] = useState<any[]>([])
  const [loadingPlans, setLoadingPlans] = useState(true)

  useEffect(() => {
    async function fetchPlans() {
      const supabase = createClient()
      const { data } = await supabase
        .from('saas_pricing_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
      
      if (data) {
        setPlans(data)
        if (data.length > 0) setPlan(data[0].slug)
      }
      setLoadingPlans(false)
    }
    fetchPlans()
  }, [])

  useEffect(() => {
    const queryEmail = searchParams.get('email')
    const queryName = searchParams.get('name')
    if (queryEmail) setEmail(queryEmail)
    if (queryName) setFullName(queryName)
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, full_name: fullName, plan, notes }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to create client'); return }
      setSuccess(true)
      setTimeout(() => router.push('/admin/clients'), 2000)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
          <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">Client created!</p>
          <p className="mt-1 text-sm text-muted-foreground">
            An invite email has been sent to <strong>{email}</strong>. Redirecting to clients list…
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link href="/admin/clients" className="text-xs text-muted-foreground hover:text-foreground">
          ← Clients
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-xs text-foreground">Add Client</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Add New Client</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          We'll create the account and send an invite email so the client can set their password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-border bg-card p-6">
        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="input-email" className="text-xs font-medium text-muted-foreground">
            Client Email <span className="text-destructive">*</span>
          </label>
          <input
            id="input-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="client@company.com"
            className="w-full rounded-lg border border-input bg-card-2 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Full name */}
        <div className="space-y-1.5">
          <label htmlFor="input-full-name" className="text-xs font-medium text-muted-foreground">
            Full Name / Company Name <span className="text-destructive">*</span>
          </label>
          <input
            id="input-full-name"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Acme Corp"
            className="w-full rounded-lg border border-input bg-card-2 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Plan picker */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Plan</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {loadingPlans ? (
              <div className="col-span-2 text-sm text-muted-foreground py-4">Loading plans...</div>
            ) : plans.map((p) => {
              return (
                <button
                  key={p.slug}
                  type="button"
                  onClick={() => setPlan(p.slug)}
                  className={`flex flex-col items-start rounded-xl border p-4 text-left transition-all ${
                    plan === p.slug
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card-2 hover:border-primary/40 hover:bg-muted'
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary`}>
                      {p.name}
                    </span>
                    {plan === p.slug && (
                      <div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                        <svg className="h-2.5 w-2.5 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{p.description}</p>
                  <div className="mt-2 space-y-0.5 text-[11px] text-muted-foreground">
                    <p>👥 {p.max_contacts === -1 ? 'Unlimited' : p.max_contacts.toLocaleString()} contacts</p>
                    <p>💬 {p.max_messages_pm === -1 ? 'Unlimited' : p.max_messages_pm.toLocaleString()} msgs/month</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label htmlFor="input-notes" className="text-xs font-medium text-muted-foreground">
            Internal Notes (optional)
          </label>
          <textarea
            id="input-notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Invoice ref, contract date, etc."
            className="w-full resize-none rounded-lg border border-input bg-card-2 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Link
            href="/admin/clients"
            className="flex-1 rounded-lg border border-border py-2 text-center text-sm text-foreground transition-colors hover:bg-muted"
          >
            Cancel
          </Link>
          <button
            id="btn-create-client"
            type="submit"
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary-hover disabled:opacity-50 active:scale-95"
          >
            {loading && <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />}
            {loading ? 'Creating…' : 'Create & Send Invite'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function CreateClientPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading form...</div>}>
      <CreateClientForm />
    </Suspense>
  )
}
