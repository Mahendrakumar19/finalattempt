import type { ComponentType } from 'react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface UsageMetricCardProps {
  title: string
  icon: ComponentType<{ className?: string }>
  bars: {
    label: string
    current: number
    max: number
    warningThreshold?: number
  }[]
}

export function UsageMetricCard({ title, icon: Icon, bars }: UsageMetricCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-card/80 to-card/40 p-5 backdrop-blur-xl transition-all duration-300 hover:border-border hover:shadow-lg hover:shadow-primary/5">
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/5 blur-2xl transition-all duration-500 group-hover:bg-primary/10" />
      <div className="relative z-10 flex items-start justify-between mb-4">
        <p className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground/80">{title}</p>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/50 bg-background/50 text-muted-foreground shadow-sm transition-all duration-300 group-hover:border-primary/20 group-hover:bg-primary/10 group-hover:text-primary">
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="relative z-10 flex flex-col gap-3">
        {bars.map((bar, i) => {
          const isUnlimited = bar.max <= 0
          const pct = isUnlimited ? 0 : (bar.current / bar.max) * 100
          const threshold = bar.warningThreshold ?? 80
          const isWarning = pct >= threshold && pct < 100
          const isDanger = pct >= 100

          return (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-muted-foreground">{bar.label}</span>
                <span className={cn(
                  "tabular-nums",
                  isDanger ? "text-destructive" : isWarning ? "text-amber-500" : "text-foreground"
                )}>
                  {bar.current.toLocaleString()} / {isUnlimited ? 'Unlimited' : bar.max.toLocaleString()}
                </span>
              </div>
              <Progress
                value={Math.min(pct, 100)}
                className={cn(
                  "h-1.5 transition-colors",
                  isDanger && "[&>div]:bg-destructive"
                )}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
