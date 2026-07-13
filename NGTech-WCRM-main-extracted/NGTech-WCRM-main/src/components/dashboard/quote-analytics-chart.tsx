"use client"

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { SkeletonCard } from './skeleton'
import type { QuoteAnalytics } from '@/lib/dashboard/types'
import { formatCurrency } from '@/lib/currency'
import { useAuth } from '@/hooks/use-auth'
import { Receipt } from 'lucide-react'

interface QuoteAnalyticsChartProps {
  data: QuoteAnalytics | null
  loading: boolean
}

export function QuoteAnalyticsChart({ data, loading }: QuoteAnalyticsChartProps) {
  const { defaultCurrency } = useAuth()

  if (loading) {
    return <SkeletonCard className="h-full min-h-[300px]" />
  }

  if (!data || data.totalCount === 0) {
    return (
      <Card className="flex h-full min-h-[300px] flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Quote Analytics</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">No quote data available</p>
        </CardContent>
      </Card>
    )
  }

  const acceptedPct = data.totalValue > 0 ? (data.acceptedValue / data.totalValue) * 100 : 0
  const pendingPct = data.totalValue > 0 ? (data.pendingValue / data.totalValue) * 100 : 0
  const rejectedPct = data.totalValue > 0 ? (data.rejectedValue / data.totalValue) * 100 : 0

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium">Quote Analytics</CardTitle>
          <p className="text-xs text-muted-foreground">Revenue by Quote Status</p>
        </div>
        <Receipt className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="flex-1 space-y-6 pt-4">
        <div>
          <div className="text-2xl font-bold">
            {formatCurrency(data.totalValue, defaultCurrency)}
          </div>
          <p className="text-xs text-muted-foreground">
            Total Pipeline Value ({data.totalCount} Quotes)
          </p>
        </div>

        {/* Stacked Bar */}
        <div className="space-y-2">
          <div className="flex h-4 w-full overflow-hidden rounded-full bg-muted">
            <div
              style={{ width: `${acceptedPct}%` }}
              className="bg-green-500 transition-all duration-500"
            />
            <div
              style={{ width: `${pendingPct}%` }}
              className="bg-yellow-400 transition-all duration-500"
            />
            <div
              style={{ width: `${rejectedPct}%` }}
              className="bg-red-500 transition-all duration-500"
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              Accepted ({Math.round(acceptedPct)}%)
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-yellow-400" />
              Pending ({Math.round(pendingPct)}%)
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-red-500" />
              Rejected ({Math.round(rejectedPct)}%)
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 border-t border-border pt-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Accepted</p>
            <p className="text-sm font-semibold text-green-600">
              {formatCurrency(data.acceptedValue, defaultCurrency)}
            </p>
          </div>
          <div className="border-l border-r border-border">
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="text-sm font-semibold text-yellow-600">
              {formatCurrency(data.pendingValue, defaultCurrency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Rejected</p>
            <p className="text-sm font-semibold text-red-600">
              {formatCurrency(data.rejectedValue, defaultCurrency)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
