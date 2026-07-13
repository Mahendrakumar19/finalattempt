'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { AlertCircle, Loader2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface PlanInfo {
  plan: 'free' | 'starter' | 'pro' | 'enterprise'
  status: 'active' | 'suspended' | 'cancelled'
  maxContacts: number
  maxMessagesPm: number
  trialEndsAt: string | null
}

interface UsageInfo {
  contacts: number
  messagesSent: number
}

export function PlanPanel() {
  const { accountId } = useAuth()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null)
  const [usageInfo, setUsageInfo] = useState<UsageInfo>({ contacts: 0, messagesSent: 0 })

  useEffect(() => {
    if (!accountId) return

    async function fetchData() {
      try {
        setLoading(true)
        // Fetch account info
        const { data: acct, error: acctErr } = await supabase
          .from('accounts')
          .select('plan, status, max_contacts, max_messages_pm, trial_ends_at')
          .eq('id', accountId)
          .single()
          
        if (acctErr) throw acctErr

        setPlanInfo({
          plan: acct.plan as PlanInfo['plan'],
          status: acct.status as PlanInfo['status'],
          maxContacts: acct.max_contacts,
          maxMessagesPm: acct.max_messages_pm,
          trialEndsAt: acct.trial_ends_at,
        })

        // Fetch contact count
        const { count: contactsCount } = await supabase
          .from('contacts')
          .select('id', { count: 'exact', head: true })
          .eq('account_id', accountId)

        // Fetch message usage for current month
        const now = new Date()
        const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
        const { data: usage } = await supabase
          .from('account_usage')
          .select('messages_sent')
          .eq('account_id', accountId)
          .eq('month', monthStart)
          .maybeSingle()

        setUsageInfo({
          contacts: contactsCount ?? 0,
          messagesSent: usage?.messages_sent ?? 0,
        })
      } catch (err: any) {
        console.error('Failed to load plan info:', err)
        setError('Failed to load plan details.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [accountId, supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !planInfo) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error ?? 'Plan information not available.'}</AlertDescription>
      </Alert>
    )
  }

  const contactsPercent = Math.min(100, Math.round((usageInfo.contacts / planInfo.maxContacts) * 100))
  // Unlimited (-1) means no cap, so we just show 0% progress
  const messagesPercent = planInfo.maxMessagesPm === -1 
    ? 0 
    : Math.min(100, Math.round((usageInfo.messagesSent / planInfo.maxMessagesPm) * 100))

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-foreground">Plan & Usage</h3>
        <p className="text-sm text-muted-foreground">
          View your current subscription plan and track your usage limits.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Plan Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>Your account is currently on the {planInfo.plan.toUpperCase()} plan.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold capitalize text-primary mb-2">
              {planInfo.plan}
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                planInfo.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-destructive/10 text-destructive'
              }`}>
                {planInfo.status.toUpperCase()}
              </span>
              {planInfo.trialEndsAt && (
                <span className="text-xs text-muted-foreground">
                  Trial ends {new Date(planInfo.trialEndsAt).toLocaleDateString()}
                </span>
              )}
            </div>
            
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-muted-foreground mb-4">
                To upgrade your plan or purchase more usage capacity, please contact your account manager.
              </p>
              <a 
                href="mailto:support@wacrm.com" 
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
              >
                Contact Support
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Usage Limits Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Usage Limits</CardTitle>
            <CardDescription>Your current usage for this billing period.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Contacts Limit */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">Contacts</span>
                <span className="text-muted-foreground">
                  {usageInfo.contacts.toLocaleString()} / {planInfo.maxContacts.toLocaleString()}
                </span>
              </div>
              <Progress value={contactsPercent} className="h-2" />
              <p className="text-xs text-muted-foreground">
                You have used {contactsPercent}% of your contact limit.
              </p>
            </div>

            {/* Messages Limit */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">Monthly Messages</span>
                <span className="text-muted-foreground">
                  {usageInfo.messagesSent.toLocaleString()} / {planInfo.maxMessagesPm === -1 ? 'Unlimited' : planInfo.maxMessagesPm.toLocaleString()}
                </span>
              </div>
              <Progress value={messagesPercent} className="h-2" />
              <p className="text-xs text-muted-foreground">
                You have sent {usageInfo.messagesSent.toLocaleString()} messages this month.
              </p>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  )
}
