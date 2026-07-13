"use client"

import { Clock, Pencil, Check } from 'lucide-react'
import { DOW_SHORT_MON_FIRST } from '@/lib/dashboard/date-utils'
import type { ResponseTimeSummary } from '@/lib/dashboard/types'
import { BarChart } from '@/components/tremor/bar-chart'
import { EmptyState } from './empty-state'
import { Skeleton } from './skeleton'
import { useState, useRef } from 'react'

interface ResponseTimeChartProps {
  data: ResponseTimeSummary | null
  loading: boolean
  /** Minutes. Surfaced as an editable "target" pill in the header. */
  thresholdMinutes?: number
}

const CATEGORY = 'Avg minutes'
const STORAGE_KEY = 'wacrm-response-target-minutes'

export function ResponseTimeChart({
  data,
  loading,
  thresholdMinutes = 5,
}: ResponseTimeChartProps) {
  const hasData = data?.buckets.some((b) => b.avgMinutes != null) ?? false

  // Load persisted target from localStorage (fallback to prop)
  const [target, setTarget] = useState<number>(() => {
    if (typeof window === 'undefined') return thresholdMinutes
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? parseInt(saved, 10) : thresholdMinutes
  })
  const [editing, setEditing] = useState(false)
  const [inputVal, setInputVal] = useState(String(target))
  const inputRef = useRef<HTMLInputElement>(null)

  const startEdit = () => {
    setInputVal(String(target))
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 50)
  }

  const confirmEdit = () => {
    const parsed = parseInt(inputVal, 10)
    if (!isNaN(parsed) && parsed > 0) {
      setTarget(parsed)
      localStorage.setItem(STORAGE_KEY, String(parsed))
    }
    setEditing(false)
  }

  const chartData =
    data?.buckets.map((b, i) => ({
      day: DOW_SHORT_MON_FIRST[i],
      [CATEGORY]: b.avgMinutes ?? 0,
      samples: b.samples,
    })) ?? []

  return (
    <section className="rounded-xl border border-border bg-card">
      <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">
            Average First Response Time
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Minutes to reply to a customer&apos;s first unreplied message, by weekday
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3 text-right text-xs">
          {target > 0 && (
            editing ? (
              <span className="flex items-center gap-1 rounded-full border border-rose-500/40 bg-rose-500/10 px-2 py-0.5">
                <input
                  ref={inputRef}
                  type="number"
                  min={1}
                  max={999}
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') confirmEdit()
                    if (e.key === 'Escape') setEditing(false)
                  }}
                  onBlur={confirmEdit}
                  className="w-10 bg-transparent text-center text-rose-300 font-medium tabular-nums outline-none"
                />
                <span className="text-rose-300 font-medium">m</span>
                <button onClick={confirmEdit} className="ml-1 text-rose-300 hover:text-rose-100">
                  <Check className="h-3 w-3" />
                </button>
              </span>
            ) : (
              <button
                onClick={startEdit}
                title="Click to change target"
                className="group flex items-center gap-1.5 whitespace-nowrap rounded-full border border-rose-500/40 bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-300 tabular-nums hover:bg-rose-500/20 transition-colors"
              >
                Target: {target}m
                <Pencil className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )
          )}
          {data && (data.thisWeekAvg != null || data.lastWeekAvg != null) && (
            <div>
              <div className="text-muted-foreground">
                This week:{' '}
                <span className="font-medium text-foreground tabular-nums">
                  {fmt(data.thisWeekAvg)}
                </span>
              </div>
              <div className="text-muted-foreground">
                Last week:{' '}
                <span className="tabular-nums">{fmt(data.lastWeekAvg)}</span>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="p-5">
        {loading || !data ? (
          <Skeleton className="h-[260px] w-full" />
        ) : !hasData ? (
          <EmptyState
            icon={Clock}
            title="No replies recorded yet"
            hint="This chart fills in as you reply to customer messages."
          />
        ) : (
          <BarChart
            data={chartData}
            index="day"
            categories={[CATEGORY]}
            colors={['violet']}
            valueFormatter={(value) => `${value.toFixed(1)}m`}
            showLegend={false}
            yAxisWidth={48}
            className="h-[260px]"
          />
        )}
      </div>
    </section>
  )
}

function fmt(mins: number | null): string {
  if (mins == null) return '—'
  if (mins < 1) return `${Math.max(1, Math.round(mins * 60))}s`
  if (mins < 60) return `${mins.toFixed(1)}m`
  return `${(mins / 60).toFixed(1)}h`
}
