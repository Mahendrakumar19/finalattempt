import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Calendar } from 'lucide-react'
import { format } from 'date-fns'
import type { Meeting } from '@/components/inbox/contact-sidebar'

interface DashboardMeetingsProps {
  items: (Meeting & { contacts?: { name: string; phone: string } })[] | null
  loading: boolean
}

export function DashboardMeetings({ items, loading }: DashboardMeetingsProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Upcoming Meetings</CardTitle>
        <Calendar className="h-4 w-4 text-muted-foreground" />
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
            No upcoming meetings
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            {items.map((meeting) => (
              <div key={meeting.id} className="flex flex-col space-y-1 rounded-md border border-border p-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">{meeting.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {meeting.scheduled_at ? format(new Date(meeting.scheduled_at), 'MMM d, h:mm a') : 'TBD'}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  with {meeting.contacts?.name || meeting.contacts?.phone || 'Unknown Client'}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
