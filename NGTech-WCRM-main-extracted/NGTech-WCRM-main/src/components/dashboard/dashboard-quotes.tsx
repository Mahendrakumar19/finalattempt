import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Receipt } from 'lucide-react'
import type { Quote } from '@/components/inbox/contact-sidebar'
import { cn } from '@/lib/utils'

interface DashboardQuotesProps {
  items: (Quote & { contacts?: { name: string; phone: string } })[] | null
  loading: boolean
}

export function DashboardQuotes({ items, loading }: DashboardQuotesProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Recent Quotes</CardTitle>
        <Receipt className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="overflow-auto pb-4">
        {loading ? (
          <div className="space-y-3">
            <div className="h-10 w-full animate-pulse rounded bg-muted" />
            <div className="h-10 w-full animate-pulse rounded bg-muted" />
            <div className="h-10 w-full animate-pulse rounded bg-muted" />
          </div>
        ) : !items || items.length === 0 ? (
          <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
            No recent quotes
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            {items.map((quote) => (
              <div key={quote.id} className="flex flex-col space-y-1 rounded-md border border-border p-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">{quote.description}</span>
                  <span className="font-medium text-sm">
                    {quote.currency} {quote.amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>to {quote.contacts?.name || quote.contacts?.phone || 'Unknown Client'}</span>
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px]", 
                    quote.status === 'accepted' ? "bg-green-100 text-green-700" :
                    quote.status === 'rejected' ? "bg-red-100 text-red-700" :
                    "bg-yellow-100 text-yellow-700"
                  )}>
                    {quote.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
