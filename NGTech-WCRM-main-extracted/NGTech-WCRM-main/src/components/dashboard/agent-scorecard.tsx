import { useState, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Trophy, Search, Star, MessageSquare, Timer, CheckCircle, Shield, Calendar, Users, Briefcase, CalendarDays, Bot, Sparkles } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRouter } from 'next/navigation'

const formatTime = (totalMinutes: number) => {
  const roundedMin = Math.round(totalMinutes);
  if (roundedMin < 60) return `${roundedMin}m`;
  const h = Math.floor(roundedMin / 60);
  const m = roundedMin % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

interface AgentPerformance {
  userId: string
  fullName: string
  email: string
  avatarUrl: string | null
  role: string
  conversationsHandled: number
  avgResponseTimeMin: number | null
  avgCsat: number | null
  resolutionRate: number
  slaComplianceRate?: number
  messagesSent: number
  botMessagesSent: number
  dealsWon: number
  meetingsCreated: number
  meetingsAttended: number
  uniqueLeads: number
  aiSummary: string
  score: number
}

interface AgentScorecardProps {
  data: AgentPerformance[] | null
  loading: boolean
  startDate?: string
  endDate?: string
  departmentMembers?: any[]
  departments?: any[]
  onDateChange?: (start: string, end: string) => void
}

type SortOption = 'score' | 'csat' | 'time' | 'resolution' | 'sla' | 'leads' | 'deals' | 'meetings' | 'bot'

export function AgentScorecard({ data, loading, startDate, endDate, departmentMembers = [], departments = [], onDateChange }: AgentScorecardProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [sortBy, setSortBy] = useState<SortOption>('score')
  const [sortDesc, setSortDesc] = useState(true)

  const sortedData = useMemo(() => {
    if (!data) return []
    let filtered = [...data].filter(
      (agent) =>
        agent.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
    
    if (selectedDepartment !== 'all') {
      filtered = filtered.filter((agent) => {
        return departmentMembers.some(dm => dm.user_id === agent.userId && dm.department_id === selectedDepartment)
      })
    }

    filtered.sort((a, b) => {
      let comparison = 0
      if (sortBy === 'score') comparison = a.score - b.score
      if (sortBy === 'csat') comparison = (a.avgCsat || 0) - (b.avgCsat || 0)
      if (sortBy === 'time') comparison = (b.avgResponseTimeMin || 9999) - (a.avgResponseTimeMin || 9999) // Inverted for time (lower is better)
      if (sortBy === 'resolution') comparison = a.resolutionRate - b.resolutionRate
      if (sortBy === 'sla') comparison = (a.slaComplianceRate ?? 100) - (b.slaComplianceRate ?? 100)
      if (sortBy === 'leads') comparison = a.uniqueLeads - b.uniqueLeads
      if (sortBy === 'deals') comparison = a.dealsWon - b.dealsWon
      if (sortBy === 'meetings') comparison = a.meetingsAttended - b.meetingsAttended
      if (sortBy === 'bot') comparison = a.botMessagesSent - b.botMessagesSent

      return sortDesc ? -comparison : comparison
    })

    return filtered
  }, [data, searchQuery, selectedDepartment, sortBy, sortDesc, departmentMembers])

  const toggleSort = (field: SortOption) => {
    if (sortBy === field) {
      setSortDesc(!sortDesc)
    } else {
      setSortBy(field)
      setSortDesc(true)
    }
  }

  const SortHeader = ({ field, label, minW }: { field: SortOption, label: string, minW?: string }) => (
    <th 
      className={`py-3 px-2 cursor-pointer hover:bg-muted/50 transition-colors ${minW ? minW : ''}`}
      onClick={() => toggleSort(field)}
    >
      <div className="flex items-center gap-1 text-muted-foreground font-medium">
        {label}
        {sortBy === field && (
          <span className="text-xs text-primary">{sortDesc ? '↓' : '↑'}</span>
        )}
      </div>
    </th>
  )

  const getCsatColor = (score: number | null) => {
    if (score === null) return 'text-muted-foreground'
    if (score >= 4.0) return 'text-green-500 fill-green-500'
    if (score >= 3.0) return 'text-amber-500 fill-amber-500'
    return 'text-red-500 fill-red-500'
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-amber-500'
    return 'bg-red-500'
  }

  return (
    <Card className="w-full border-border bg-card">
      <CardHeader className="space-y-4 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
              <Trophy className="h-5 w-5 text-amber-500" />
              Agent Performance Scorecard
            </CardTitle>
            <CardDescription>
              A complete evaluation across conversations, deals, meetings, and AI insights.
            </CardDescription>
          </div>
          {onDateChange && (
            <div className="shrink-0 flex items-center gap-2">
              <input
                type="date"
                value={startDate || ''}
                onChange={(e) => onDateChange(e.target.value, endDate || '')}
                className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <span className="text-muted-foreground text-sm">to</span>
              <input
                type="date"
                value={endDate || ''}
                onChange={(e) => onDateChange(startDate || '', e.target.value)}
                className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center pt-1">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          {departments.length > 0 && (
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="All Departments">
                  {selectedDepartment === 'all' 
                    ? 'All Departments' 
                    : departments.find(d => d.id === selectedDepartment)?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <div className="h-10 w-full animate-pulse rounded bg-muted" />
            <div className="h-10 w-full animate-pulse rounded bg-muted" />
            <div className="h-10 w-full animate-pulse rounded bg-muted" />
          </div>
        ) : sortedData.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            No agent data available for this period.
          </div>
        ) : (
          <div className="overflow-x-auto pb-4">
            <table className="w-full min-w-[1400px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-3 pl-2 min-w-[220px] text-muted-foreground font-medium sticky left-0 bg-card z-10 shadow-[1px_0_0_0_var(--border)]">Agent</th>
                  <SortHeader field="leads" label="Leads" minW="min-w-[90px]" />
                  <SortHeader field="deals" label="Deals Won" minW="min-w-[110px]" />
                  <SortHeader field="meetings" label="Meetings" minW="min-w-[110px]" />
                  <SortHeader field="bot" label="Bot Msgs" minW="min-w-[110px]" />
                  <SortHeader field="time" label="Avg Response" minW="min-w-[130px]" />
                  <SortHeader field="csat" label="CSAT" minW="min-w-[80px]" />
                  <SortHeader field="resolution" label="Resolution Rate" minW="min-w-[150px]" />
                  <th className="py-3 px-2 min-w-[280px] text-muted-foreground font-medium">AI Performance Summary</th>
                  <SortHeader field="score" label="Overall Score" minW="min-w-[140px]" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedData.map((agent, index) => {
                  const agentDepts = departmentMembers.filter(dm => dm.user_id === agent.userId);
                  
                  return (
                  <tr 
                    key={agent.userId} 
                    className="group hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/team-performance/${agent.userId}`)}
                  >
                    <td className="py-3 pl-2 sticky left-0 bg-card z-10 group-hover:bg-muted transition-colors shadow-[1px_0_0_0_var(--border)]">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-9 w-9 border border-border">
                            <AvatarImage src={agent.avatarUrl || undefined} />
                            <AvatarFallback className="bg-muted text-xs font-semibold">
                              {agent.fullName.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {index === 0 && searchQuery === '' && sortBy === 'score' && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-amber-950">
                              1
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground flex items-center gap-1.5">
                            {agent.fullName}
                            {agent.role === 'owner' || agent.role === 'admin' ? (
                              <span title={agent.role}>
                                <Shield className="h-3 w-3 text-primary fill-primary/20" />
                              </span>
                            ) : null}
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 mt-0.5">
                            <div className="text-[11px] text-muted-foreground">{agent.email}</div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 font-medium text-foreground tabular-nums">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        {agent.uniqueLeads}
                      </div>
                    </td>
                    <td className="py-3 px-2 font-medium text-foreground tabular-nums">
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                        {agent.dealsWon}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-foreground tabular-nums">
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                        {agent.meetingsAttended} / {agent.meetingsCreated}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-foreground tabular-nums">
                      <div className="flex items-center gap-1.5">
                        <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                        {agent.botMessagesSent}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-foreground tabular-nums">
                      {agent.avgResponseTimeMin !== null ? (
                        <span className="flex items-center gap-1">
                          <Timer className="h-3.5 w-3.5 text-muted-foreground" />
                          {formatTime(agent.avgResponseTimeMin)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      {agent.avgCsat !== null ? (
                        <span className="flex items-center gap-1 font-semibold text-foreground">
                          <Star className={`h-4 w-4 ${getCsatColor(agent.avgCsat)}`} />
                          {agent.avgCsat}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground font-medium">{agent.resolutionRate}%</span>
                        <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${agent.resolutionRate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 pr-4">
                      <div className="flex items-start gap-2 max-w-sm">
                        <Sparkles className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                        <span className="text-xs text-muted-foreground leading-snug line-clamp-3">
                          {agent.aiSummary || "No insights available for this period."}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="inline-flex flex-col items-start gap-1.5">
                        <span className="font-bold text-foreground tabular-nums">{agent.score}/100</span>
                        <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full ${getScoreColor(agent.score)}`}
                            style={{ width: `${agent.score}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
