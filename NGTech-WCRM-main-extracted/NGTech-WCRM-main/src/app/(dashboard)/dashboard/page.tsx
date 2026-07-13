"use client"

import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { formatCurrency } from '@/lib/currency'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  MessageSquare,
  UserPlus,
  DollarSign,
  Send,
  Clock,
  ShieldCheck,
  Database
} from 'lucide-react'

import {
  loadActivity,
  loadConversationsSeries,
  loadMetrics,
  loadPipelineDonut,
  loadResponseTime,
  loadQuoteAnalytics,
} from '@/lib/dashboard/queries'
import type {
  ActivityItem,
  ConversationsSeriesPoint,
  MetricsBundle,
  PipelineDonutData,
  ResponseTimeSummary,
  QuoteAnalytics,
} from '@/lib/dashboard/types'

import { MetricCard } from '@/components/dashboard/metric-card'
import { SkeletonCard } from '@/components/dashboard/skeleton'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { ConversationsChart } from '@/components/dashboard/conversations-chart'
import { PipelineDonut } from '@/components/dashboard/pipeline-donut'
import { ResponseTimeChart } from '@/components/dashboard/response-time-chart'
import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { DashboardMeetings } from '@/components/dashboard/dashboard-meetings'
import { DashboardQuotes } from '@/components/dashboard/dashboard-quotes'
import { QuoteAnalyticsChart } from '@/components/dashboard/quote-analytics-chart'
import { AgentScorecard } from '@/components/dashboard/agent-scorecard'
import { AiIntelligence } from '@/components/dashboard/ai-intelligence'
import { UsageMetricCard } from '@/components/dashboard/usage-metric-card'
import { loadPlanUsageSummary, type PlanUsageSummaryData } from '@/lib/dashboard/plan-usage'
import type { Meeting, Quote } from '@/components/inbox/contact-sidebar'

type RangeDays = 7 | 30 | 90

export default function DashboardPage() {
  const t = useTranslations('Dashboard')
  const { defaultCurrency, account } = useAuth()
  const [metrics, setMetrics] = useState<MetricsBundle | null>(null)
  const [metricsLoading, setMetricsLoading] = useState(true)

  const [planUsage, setPlanUsage] = useState<PlanUsageSummaryData | null>(null)

  const [range, setRange] = useState<RangeDays>(30)
  // Keep a cache per range so switching tabs doesn't re-fetch what we
  // already have. Ranges the user hasn't opened yet stay null and
  // trigger a fetch on first view.
  const [series, setSeries] = useState<Record<RangeDays, ConversationsSeriesPoint[] | null>>({
    7: null,
    30: null,
    90: null,
  })
  const [seriesLoading, setSeriesLoading] = useState(true)

  const [pipeline, setPipeline] = useState<PipelineDonutData | null>(null)
  const [pipelineLoading, setPipelineLoading] = useState(true)

  const [responseTime, setResponseTime] = useState<ResponseTimeSummary | null>(null)
  const [responseTimeLoading, setResponseTimeLoading] = useState(true)

  const [activity, setActivity] = useState<ActivityItem[] | null>(null)
  const [activityLoading, setActivityLoading] = useState(true)

  const [meetings, setMeetings] = useState<Meeting[] | null>(null)
  const [meetingsLoading, setMeetingsLoading] = useState(true)

  const [quotes, setQuotes] = useState<Quote[] | null>(null)
  const [quotesLoading, setQuotesLoading] = useState(true)

  const [quoteAnalytics, setQuoteAnalytics] = useState<QuoteAnalytics | null>(null)
  const [quoteAnalyticsLoading, setQuoteAnalyticsLoading] = useState(true)

  const [scorecard, setScorecard] = useState<any[] | null>(null)
  const [scorecardSummary, setScorecardSummary] = useState<any | null>(null)
  const [scorecardLoading, setScorecardLoading] = useState(true)

  const [intelligence, setIntelligence] = useState<any | null>(null)
  const [intelligenceLoading, setIntelligenceLoading] = useState(true)

  const [selectedAgent, setSelectedAgent] = useState<string | 'all'>('all')
  const [agents, setAgents] = useState<{ user_id: string, full_name: string }[]>([])

  const loadAll = useCallback(() => {
    const db = createClient()
    const agentId = selectedAgent === 'all' ? undefined : selectedAgent;

    // Kick everything off in parallel. Each block has its own
    // setState + finally so a slow query doesn't hold up faster
    // sections — each widget shows its own skeleton independently.
    void loadMetrics(db, agentId)
      .then((m) => setMetrics(m))
      .catch((err) => console.error('[dashboard] metrics failed:', err))
      .finally(() => setMetricsLoading(false))

    void loadConversationsSeries(db, 30, agentId)
      .then((s) => setSeries((prev) => ({ ...prev, 30: s })))
      .catch((err) => console.error('[dashboard] series failed:', err))
      .finally(() => setSeriesLoading(false))

    void loadPipelineDonut(db)
      .then((p) => setPipeline(p))
      .catch((err) => console.error('[dashboard] pipeline failed:', err))
      .finally(() => setPipelineLoading(false))

    void loadResponseTime(db)
      .then((r) => setResponseTime(r))
      .catch((err) => console.error('[dashboard] response time failed:', err))
      .finally(() => setResponseTimeLoading(false))

    void loadQuoteAnalytics(db)
      .then((qa) => setQuoteAnalytics(qa))
      .catch((err) => console.error('[dashboard] quote analytics failed:', err))
      .finally(() => setQuoteAnalyticsLoading(false))

    fetch('/api/analytics/scorecard')
      .then((res) => res.json())
      .then((data) => {
        setScorecard(data.leaderboard)
        setScorecardSummary(data.summary)
      })
      .catch((err) => console.error('[dashboard] scorecard failed:', err))
      .finally(() => setScorecardLoading(false))

    fetch('/api/analytics/intelligence')
      .then((res) => res.json())
      .then((data) => setIntelligence(data))
      .catch((err) => console.error('[dashboard] intelligence failed:', err))
      .finally(() => setIntelligenceLoading(false))

    // Fetch up to 50 so the biggest page-size option in the feed
    // (50 rows) is already in memory — switching sizes then becomes
    // a pure client-side slice with no extra round trip.
    void loadActivity(db, 50)
      .then((a) => setActivity(a))
      .catch((err) => console.error('[dashboard] activity failed:', err))
      .finally(() => setActivityLoading(false))

    void Promise.resolve(
      db
        .from('meetings')
        .select('*, contacts(name, phone)')
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(5)
    )
      .then(({ data }) => setMeetings(data))
      .catch((err) => console.error(err))
      .finally(() => setMeetingsLoading(false))

    void Promise.resolve(
      db
        .from('quotes')
        .select('*, contacts(name, phone)')
        .order('created_at', { ascending: false })
        .limit(5)
    )
      .then(({ data }) => setQuotes(data))
      .catch((err) => console.error(err))
      .finally(() => setQuotesLoading(false))
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll, selectedAgent])

  useEffect(() => {
    if (!account?.id) return
    const db = createClient()
    db.from('account_members').select('user_id').eq('account_id', account.id).then(({ data: members }) => {
      if (members) {
        const ids = members.map((m: any) => m.user_id);
        db.from('profiles').select('user_id, full_name').in('user_id', ids).then(({ data: profiles }) => {
          if (profiles) setAgents(profiles as any);
        });
      }
    });
  }, [account?.id])

  useEffect(() => {
    if (!account?.id) return
    const db = createClient()
    loadPlanUsageSummary(db, account.id)
      .then(setPlanUsage)
      .catch((err) => console.error('[dashboard] plan usage failed:', err))
  }, [account?.id])

  // Range switch handler — kept in an event callback (not an effect)
  // so the setState calls stay out of the react-hooks/set-state-in-effect
  // rule's way. The cached bucket check means switching back to a
  // previously-viewed range is instant and doesn't re-fetch.
  const handleRangeChange = useCallback(
    (r: RangeDays) => {
      setRange(r)
      // cache removed for agent switching
      setSeriesLoading(true)
      const db = createClient()
      const agentId = selectedAgent === 'all' ? undefined : selectedAgent;
      loadConversationsSeries(db, r, agentId)
        .then((s) => setSeries((prev) => ({ ...prev, [r]: s })))
        .catch((err) => console.error('[dashboard] series failed:', err))
        .finally(() => setSeriesLoading(false))
    },
    [series],
  )

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('Title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('Subtitle')}
          </p>
        </div>
        {(account?.role === 'admin' || account?.role === 'owner') && (
          <Select value={selectedAgent} onValueChange={(v) => { setSelectedAgent(v); setSeries({ 7: null, 30: null, 90: null }) }}>
            <SelectTrigger className="w-[200px] bg-muted border-border">
              <SelectValue placeholder="Filter by Agent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agents</SelectItem>
              {agents.map(a => (
                <SelectItem key={a.user_id} value={a.user_id}>{a.full_name || 'Unnamed Agent'}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {planUsage && planUsage.unpaidInvoicesCount > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-destructive/20 bg-destructive/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/20 text-destructive">
              <DollarSign className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-destructive">Payment Required</p>
              <p className="text-xs text-destructive/90">
                You have {planUsage.unpaidInvoicesCount} unpaid invoice(s) totaling {formatCurrency(planUsage.unpaidInvoicesTotal, defaultCurrency)}.
              </p>
            </div>
          </div>
          <a href="/settings?tab=invoices" className="text-sm font-medium text-destructive hover:underline">
            Pay Now &rarr;
          </a>
        </div>
      )}

      {/* Metric cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metricsLoading || !metrics || !planUsage ? (
          Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <MetricCard
              title={t('CurrentPlan')}
              value={planUsage.planName}
              icon={ShieldCheck}
              subtitle={t('PlanStatus', { status: planUsage.status.charAt(0).toUpperCase() + planUsage.status.slice(1) })}
            />
            <UsageMetricCard
              title={t('PlanUsage')}
              icon={Database}
              bars={[
                { label: 'Contacts', current: planUsage.currentContacts, max: planUsage.maxContacts },
                { label: 'Messages', current: planUsage.currentMessages, max: planUsage.maxMessages }
              ]}
            />
            <MetricCard
              title={t('ActiveConversations')}
              value={metrics.activeConversations.current.toLocaleString()}
              icon={MessageSquare}
              delta={{
                sign: metrics.activeConversations.previous,
                label: deltaLabel(metrics.activeConversations.previous, 'new today vs yesterday'),
              }}
            />
            <MetricCard
              title={t('NewContactsToday')}
              value={metrics.newContactsToday.current.toLocaleString()}
              icon={UserPlus}
              delta={{
                sign:
                  metrics.newContactsToday.current - metrics.newContactsToday.previous,
                label: deltaLabel(
                  metrics.newContactsToday.current - metrics.newContactsToday.previous,
                  'vs yesterday',
                ),
              }}
            />
            <MetricCard
              title={t('OpenDealsValue')}
              value={formatCurrency(metrics.openDealsValue, defaultCurrency)}
              icon={DollarSign}
              subtitle={`${metrics.openDealsCount} open deal${metrics.openDealsCount === 1 ? '' : 's'}`}
            />
            <MetricCard
              title={t('TotalMessagesSent')}
              value={metrics.messagesSentToday.current.toLocaleString()}
              icon={Send}
              delta={{
                sign:
                  metrics.messagesSentToday.current - metrics.messagesSentToday.previous,
                label: deltaLabel(
                  metrics.messagesSentToday.current - metrics.messagesSentToday.previous,
                  'vs yesterday',
                ),
              }}
            />
            <MetricCard
              title={t('AgentMessagesSent')}
              value={metrics.messagesSentByAgentToday.current.toLocaleString()}
              icon={Send}
              delta={{
                sign:
                  metrics.messagesSentByAgentToday.current - metrics.messagesSentByAgentToday.previous,
                label: deltaLabel(
                  metrics.messagesSentByAgentToday.current - metrics.messagesSentByAgentToday.previous,
                  'vs yesterday',
                ),
              }}
            />
            <MetricCard
              title={t('BotMessagesSent')}
              value={metrics.messagesSentByBotToday.current.toLocaleString()}
              icon={Send}
              delta={{
                sign:
                  metrics.messagesSentByBotToday.current - metrics.messagesSentByBotToday.previous,
                label: deltaLabel(
                  metrics.messagesSentByBotToday.current - metrics.messagesSentByBotToday.previous,
                  'vs yesterday',
                ),
              }}
            />
            {scorecardSummary && scorecardSummary.slaComplianceRate !== undefined && (
              <MetricCard
                title={t('SLAComplianceRate')}
                value={`${scorecardSummary.slaComplianceRate}%`}
                icon={Clock}
                subtitle={`Target: >= 90% SLA compliance`}
              />
            )}
          </>
        )}
      </div>
      {/* Sales Overview row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DashboardMeetings items={meetings} loading={meetingsLoading} />
        <DashboardQuotes items={quotes} loading={quotesLoading} />
      </div>

      {/* Quick actions */}
      <QuickActions />

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="h-full lg:col-span-3">
          <ConversationsChart
            series={series}
            loading={seriesLoading}
            range={range}
            onRangeChange={handleRangeChange}
          />
        </div>
        <div className="h-full lg:col-span-2">
          <PipelineDonut
            data={pipeline}
            loading={pipelineLoading}
            currency={defaultCurrency}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ResponseTimeChart data={responseTime} loading={responseTimeLoading} />
        <QuoteAnalyticsChart data={quoteAnalytics} loading={quoteAnalyticsLoading} />
      </div>
      {/* AI Intelligence & Scorecard row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AiIntelligence data={intelligence} loading={intelligenceLoading} />
        <AgentScorecard data={scorecard} loading={scorecardLoading} />
      </div>

      {/* Activity feed */}
      <ActivityFeed items={activity} loading={activityLoading} />
    </div>
  )
}

// ------------------------------------------------------------

function deltaLabel(delta: number, suffix: string): string {
  if (delta === 0) return `No change ${suffix}`
  const sign = delta > 0 ? '+' : ''
  return `${sign}${delta.toLocaleString()} ${suffix}`
}
