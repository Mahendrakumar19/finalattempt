import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { loadPlanUsageSummary, type PlanUsageSummaryData } from '@/lib/dashboard/plan-usage'
import { Progress } from '@/components/ui/progress'
import { AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/currency'

export function PlanUsageSummary() {
  const { account, defaultCurrency } = useAuth()
  const [data, setData] = useState<PlanUsageSummaryData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!account?.id) return
    const db = createClient()
    loadPlanUsageSummary(db, account.id).then((summary) => {
      setData(summary)
      setLoading(false)
    })
  }, [account?.id])

  if (loading) {
    return (
      <div className="h-28 w-full animate-pulse rounded-xl border border-border bg-card" />
    )
  }

  if (!data) return null

  const contactsPct = data.maxContacts > 0 ? (data.currentContacts / data.maxContacts) * 100 : 0
  const messagesPct = data.maxMessages > 0 ? (data.currentMessages / data.maxMessages) * 100 : 0

  return (
    <div className="flex flex-col gap-4">
      {data.unpaidInvoicesCount > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-destructive/20 bg-destructive/10 p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div>
              <p className="text-sm font-semibold text-destructive">Payment Required</p>
              <p className="text-xs text-destructive/90">
                You have {data.unpaidInvoicesCount} unpaid invoice(s) totaling {formatCurrency(data.unpaidInvoicesTotal, defaultCurrency)}.
              </p>
            </div>
          </div>
          <Link href="/settings?tab=invoices" className="flex items-center gap-1 text-sm font-medium text-destructive hover:underline">
            Pay Now <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-6 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-[200px] flex-col gap-1 sm:border-r sm:border-border sm:pr-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold text-foreground uppercase tracking-wide">
              {data.planName} Plan
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Status: <span className="capitalize font-medium text-foreground">{data.status}</span>
          </p>
          <Link href="/settings?tab=plan" className="mt-2 inline-flex items-center text-xs font-medium text-primary hover:underline">
            Manage Subscription <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </div>

        <div className="flex flex-1 flex-col gap-5 sm:px-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-muted-foreground">Contacts Used</span>
              <span className={contactsPct >= 100 ? "text-destructive" : contactsPct >= 80 ? "text-amber-500" : "text-foreground"}>
                {data.currentContacts.toLocaleString()} / {data.maxContacts > 0 ? data.maxContacts.toLocaleString() : 'Unlimited'}
              </span>
            </div>
            <Progress value={Math.min(contactsPct, 100)} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-muted-foreground">Messages Sent (This Month)</span>
              <span className={messagesPct >= 100 ? "text-destructive" : messagesPct >= 80 ? "text-amber-500" : "text-foreground"}>
                {data.currentMessages.toLocaleString()} / {data.maxMessages > 0 ? data.maxMessages.toLocaleString() : 'Unlimited'}
              </span>
            </div>
            <Progress value={Math.min(messagesPct, 100)} className="h-2" />
          </div>
        </div>
      </div>
    </div>
  )
}
