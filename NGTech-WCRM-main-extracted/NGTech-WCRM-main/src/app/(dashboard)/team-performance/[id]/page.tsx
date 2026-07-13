'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Briefcase, Calendar, CalendarDays, CheckCircle, Mail, Phone, Users, Shield, Clock, Trophy, Star, Timer, Bot, Sparkles, FileText, ChevronDown, Loader2, CheckSquare } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import Link from 'next/link'

import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface AgentProfile {
  user_id: string
  full_name: string
  email: string
  avatar_url: string | null
  role: string
  account_role: string
  created_at: string
}

interface Contact {
  id: string
  name: string
  email: string
  phone: string
  company: string
  created_at: string
}

interface Deal {
  id: string
  contact_id: string
  title: string
  value: number
  currency: string
  status: string
  expected_close_date: string
  created_at: string
}

interface Meeting {
  id: string
  contact_id: string
  title: string
  scheduled_at: string
  status: string
  created_at: string
}

interface Quote {
  id: string
  contact_id: string
  description: string
  amount: number
  currency: string
  status: string
  created_at: string
}

interface Note {
  id: string
  contact_id: string
  note_text: string
  created_at: string
}

interface Task {
  id: string
  contact_id: string
  title: string
  description: string
  due_date: string
  status: string
  created_at: string
  updated_at: string
}

interface Suspension {
  id: string
  suspended_at: string
  reason: string
  notes: string
}

interface AgentMetrics {
  score: number
  avgCsat: number | null
  avgResponseTimeMin: number | null
  resolutionRate: number
  botMessagesSent: number
  aiSummary: string
  uniqueLeads: number
  dealsWon: number
  meetingsAttended: number
  meetingsCreated: number
}

export default function AgentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  
  const [profile, setProfile] = useState<AgentProfile | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [suspensions, setSuspensions] = useState<Suspension[]>([])
  const [metrics, setMetrics] = useState<AgentMetrics | null>(null)
  const [departments, setDepartments] = useState<string[]>([])
  
  // AI Evaluation State
  const [evaluating, setEvaluating] = useState(false)
  const [evaluationResult, setEvaluationResult] = useState<string | null>(null)
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!params.id) return

    Promise.all([
      fetch(`/api/analytics/agent/${params.id}`).then(res => res.json()),
      fetch(`/api/analytics/scorecard`).then(res => res.json()),
      supabase.from('department_members').select('department_id, departments:department_id (name)').eq('user_id', params.id)
    ])
      .then(([agentData, scorecardData, deptRes]) => {
        if (agentData.error) {
          setError(agentData.error)
        } else {
          setProfile(agentData.profile)
          setContacts(agentData.contacts)
          setDeals(agentData.deals)
          setMeetings(agentData.meetings)
          setQuotes(agentData.quotes)
          setNotes(agentData.notes)
          setTasks(agentData.tasks || [])
          setSuspensions(agentData.suspensions)
          
          if (scorecardData.leaderboard) {
            const agentMetrics = scorecardData.leaderboard.find((l: any) => l.userId === params.id)
            if (agentMetrics) setMetrics(agentMetrics)
          }
          
          if (deptRes.data) {
            const deptNames = deptRes.data
              .map(d => (d.departments as any)?.name)
              .filter(Boolean) as string[];
            setDepartments(deptNames);
          }
        }
      })
      .catch((err) => setError("Failed to load agent data"))
      .finally(() => setLoading(false))
  }, [params.id, supabase])

  const handleAiEvaluation = async () => {
    if (!params.id) return
    setEvaluating(true)
    setEvaluationResult(null)
    
    try {
      const res = await fetch(`/api/analytics/agent/${params.id}/evaluate`, {
        method: 'POST'
      })
      const data = await res.json()
      if (data.error) {
        alert("Evaluation failed: " + data.error)
      } else {
        setEvaluationResult(data.evaluation)
      }
    } catch (err) {
      alert("Something went wrong.")
    } finally {
      setEvaluating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm">Loading agent details...</p>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.push('/team-performance')} className="mb-4 gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Team Performance
        </Button>
        <Card className="border-destructive/30 bg-destructive/10">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error || "Agent not found."}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.push('/team-performance')} className="gap-2 shrink-0">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        
        {/* Left Column - Profile & Quick Stats */}
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <Avatar className="h-24 w-24 border-4 border-background shadow-sm">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                    {profile.full_name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <h2 className="text-xl font-bold text-foreground flex items-center justify-center gap-2">
                    {profile.full_name}
                    {(profile.account_role === 'owner' || profile.account_role === 'admin') && (
                      <Shield className="h-4 w-4 text-primary fill-primary/20" title={profile.account_role} />
                    )}
                  </h2>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                </div>
                
                {/* AI Magic Button */}
                {(profile.account_role === 'agent' || true) && ( // Ensure it shows for testing
                  <Button 
                    onClick={handleAiEvaluation} 
                    disabled={evaluating}
                    className="w-full mt-2 bg-gradient-to-r from-primary to-blue-500 hover:opacity-90 text-primary-foreground shadow-md border-0 transition-all hover:shadow-lg hover:scale-[1.02]"
                  >
                    {evaluating ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing Agent...</>
                    ) : (
                      <><Sparkles className="mr-2 h-4 w-4" /> AI Reality Check</>
                    )}
                  </Button>
                )}

                <div className="w-full pt-4 border-t border-border mt-4">
                  <div className="flex items-center justify-between text-sm py-2">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" /> Joined
                    </span>
                    <span className="font-medium text-foreground">
                      {new Date(profile.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm py-2">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Shield className="h-4 w-4" /> Role
                    </span>
                    <span className="font-medium text-foreground capitalize">
                      {profile.account_role}
                    </span>
                  </div>
                  {departments.length > 0 && (
                    <div className="flex items-center justify-between text-sm py-2">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Briefcase className="h-4 w-4" /> Departments
                      </span>
                      <div className="flex flex-wrap items-center justify-end gap-1.5 max-w-[150px]">
                        {departments.map((dept, i) => (
                          <span key={i} className="text-[10px] uppercase font-semibold h-5 px-2 whitespace-nowrap bg-primary/10 text-primary border border-primary/20 rounded-full inline-flex items-center">
                            {dept}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm py-2">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4" /> Total Leave / Suspended
                    </span>
                    <span className="font-medium text-foreground">
                      {suspensions.length} time{suspensions.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metrics Quick Stats */}
          {metrics && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-2 text-muted-foreground"><Trophy className="h-3.5 w-3.5" /> Score</span>
                    <span className="font-bold">{metrics.score}/100</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-2 text-muted-foreground"><CheckCircle className="h-3.5 w-3.5" /> Resolution</span>
                    <span className="font-medium">{metrics.resolutionRate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-2 text-muted-foreground"><Star className="h-3.5 w-3.5" /> CSAT</span>
                    <span className="font-medium">{metrics.avgCsat !== null ? metrics.avgCsat : '-'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-2 text-muted-foreground"><Timer className="h-3.5 w-3.5" /> Avg Response</span>
                    <span className="font-medium">{metrics.avgResponseTimeMin !== null ? `${metrics.avgResponseTimeMin}m` : '-'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-2 text-muted-foreground"><Bot className="h-3.5 w-3.5" /> Bot Msgs</span>
                    <span className="font-medium">{metrics.botMessagesSent}</span>
                  </div>
                  <div className="pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground flex items-start gap-1.5 leading-relaxed">
                      <Sparkles className="h-3.5 w-3.5 text-purple-500 shrink-0 mt-0.5" />
                      {metrics.aiSummary || "No AI summary available."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Leave/Suspension History */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-amber-500" />
                Leave & Suspension History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {suspensions.length === 0 ? (
                <p className="text-xs text-muted-foreground">No leave or suspension records found.</p>
              ) : (
                <div className="space-y-4">
                  {suspensions.map((s) => (
                    <div key={s.id} className="text-sm border-l-2 border-amber-500 pl-3 py-1">
                      <div className="font-medium text-foreground capitalize">{s.reason.replace('_', ' ')}</div>
                      <div className="text-xs text-muted-foreground mb-1">
                        {new Date(s.suspended_at).toLocaleDateString()}
                      </div>
                      {s.notes && <p className="text-xs text-muted-foreground italic">"{s.notes}"</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Contacts & Interactions */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                Client Interactions ({contacts.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {contacts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No contacts assigned.</p>
              ) : (
                <Accordion className="w-full">
                  {contacts.map((contact) => {
                    const contactDeals = deals.filter(d => d.contact_id === contact.id)
                    const contactMeetings = meetings.filter(m => m.contact_id === contact.id)
                    const contactQuotes = quotes.filter(q => q.contact_id === contact.id)
                    const contactNotes = notes.filter(n => n.contact_id === contact.id)
                    const contactTasks = tasks.filter(t => t.contact_id === contact.id)
                    
                    return (
                      <AccordionItem key={contact.id} value={contact.id} className="border-border">
                        <AccordionTrigger className="hover:no-underline py-3 px-2 rounded-md hover:bg-muted/30 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-left">
                            <div className="min-w-[150px]">
                              <p className="font-semibold text-foreground">{contact.name || 'Unnamed'}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">{contact.company || 'No Company'}</p>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground font-normal">
                              {contact.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {contact.phone}</span>}
                              {contact.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {contact.email}</span>}
                            </div>
                            <div className="flex items-center gap-3 ml-auto text-xs font-medium">
                              {contactDeals.length > 0 && <span className="bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full">{contactDeals.length} Deals</span>}
                              {contactMeetings.length > 0 && <span className="bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-full">{contactMeetings.length} Meetings</span>}
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4 pb-6 px-2">
                          <Tabs defaultValue="notes" className="w-full">
                            <TabsList className="mb-4">
                              <TabsTrigger value="notes" className="text-xs">Notes ({contactNotes.length})</TabsTrigger>
                              <TabsTrigger value="deals" className="text-xs">Deals ({contactDeals.length})</TabsTrigger>
                              <TabsTrigger value="meetings" className="text-xs">Meetings ({contactMeetings.length})</TabsTrigger>
                              <TabsTrigger value="quotes" className="text-xs">Quotes ({contactQuotes.length})</TabsTrigger>
                              <TabsTrigger value="tasks" className="text-xs">Tasks ({contactTasks.length})</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="notes" className="space-y-3">
                              {contactNotes.length === 0 ? <p className="text-xs text-muted-foreground">No notes recorded.</p> : 
                                contactNotes.map(n => (
                                  <div key={n.id} className="text-sm bg-muted/30 p-3 rounded-md">
                                    <div className="text-xs text-muted-foreground mb-1 flex items-center justify-between">
                                      <span><FileText className="h-3 w-3 inline mr-1"/> Note</span>
                                      <span>{new Date(n.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-foreground">{n.note_text}</p>
                                  </div>
                                ))
                              }
                            </TabsContent>
                            
                            <TabsContent value="deals" className="space-y-3">
                              {contactDeals.length === 0 ? <p className="text-xs text-muted-foreground">No deals recorded.</p> : 
                                contactDeals.map(d => (
                                  <div key={d.id} className="text-sm border border-border p-3 rounded-md flex items-center justify-between">
                                    <div>
                                      <p className="font-semibold text-foreground">{d.title}</p>
                                      <p className="text-xs text-muted-foreground">Status: <span className="capitalize">{d.status}</span></p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-bold text-foreground">{d.currency} {d.value.toLocaleString()}</p>
                                      <p className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</p>
                                    </div>
                                  </div>
                                ))
                              }
                            </TabsContent>

                            <TabsContent value="meetings" className="space-y-3">
                              {contactMeetings.length === 0 ? <p className="text-xs text-muted-foreground">No meetings recorded.</p> : 
                                contactMeetings.map(m => (
                                  <div key={m.id} className="text-sm border border-border p-3 rounded-md flex items-center justify-between">
                                    <div>
                                      <p className="font-semibold text-foreground">{m.title}</p>
                                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                        <Calendar className="h-3 w-3"/> 
                                        {m.scheduled_at ? new Date(m.scheduled_at).toLocaleString() : 'Not scheduled'}
                                      </p>
                                    </div>
                                    <div>
                                      <span className={`text-xs px-2 py-1 rounded-full capitalize ${m.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600' : m.status === 'cancelled' ? 'bg-red-500/10 text-red-600' : 'bg-blue-500/10 text-blue-600'}`}>
                                        {m.status}
                                      </span>
                                    </div>
                                  </div>
                                ))
                              }
                            </TabsContent>

                            <TabsContent value="quotes" className="space-y-3">
                              {contactQuotes.length === 0 ? <p className="text-xs text-muted-foreground">No quotes recorded.</p> : 
                                contactQuotes.map(q => (
                                  <div key={q.id} className="text-sm border border-border p-3 rounded-md flex items-center justify-between">
                                    <div>
                                      <p className="font-semibold text-foreground">{q.description}</p>
                                      <p className="text-xs text-muted-foreground">Status: <span className="capitalize">{q.status}</span></p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-bold text-foreground">{q.currency} {q.amount.toLocaleString()}</p>
                                      <p className="text-xs text-muted-foreground">{new Date(q.created_at).toLocaleDateString()}</p>
                                    </div>
                                  </div>
                                ))
                              }
                            </TabsContent>

                            <TabsContent value="tasks" className="space-y-3">
                              {contactTasks.length === 0 ? <p className="text-xs text-muted-foreground">No tasks recorded.</p> : 
                                contactTasks.map(t => {
                                  const isCompleted = t.status === 'completed';
                                  return (
                                  <div key={t.id} className={cn("text-sm border border-border p-4 rounded-lg flex flex-col gap-2 transition-colors shadow-sm", isCompleted ? "opacity-60 bg-muted/20" : "")}>
                                    <div className="flex items-start gap-3">
                                      <div className="mt-0.5 shrink-0">
                                        {isCompleted ? (
                                          <CheckSquare className="h-4 w-4 text-emerald-500" />
                                        ) : (
                                          <div className="h-4 w-4 rounded border-2 border-muted-foreground/30" />
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                          <p className={cn("font-medium text-foreground text-sm", isCompleted && "line-through text-muted-foreground")}>
                                            {t.title}
                                          </p>
                                          <span className={cn("text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full shrink-0", isCompleted ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground')}>
                                            {isCompleted ? 'Done' : 'Pending'}
                                          </span>
                                        </div>
                                        
                                        {t.description && (
                                          <p className="text-[12px] text-muted-foreground mt-2 leading-relaxed whitespace-pre-wrap">
                                            {t.description}
                                          </p>
                                        )}
                                  
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 text-[11px] text-muted-foreground">
                                          <span className="flex items-center gap-1">
                                            <Clock className="h-3.5 w-3.5" /> Created {new Date(t.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                          </span>
                                          {isCompleted && (
                                            <span className="flex items-center gap-1 text-emerald-600">
                                              <CheckSquare className="h-3.5 w-3.5" /> Completed {new Date(t.updated_at || t.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )})
                              }
                            </TabsContent>

                          </Tabs>
                        </AccordionContent>
                      </AccordionItem>
                    )
                  })}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* AI Evaluation Modal */}
      <Dialog open={!!evaluationResult} onOpenChange={(open) => !open && setEvaluationResult(null)}>
        <DialogContent className="sm:max-w-[600px] border-purple-500/20 bg-background/95 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-fuchsia-500">
              <Sparkles className="h-5 w-5 text-fuchsia-500" />
              Agent Reality Check
            </DialogTitle>
            <DialogDescription>
              AI-generated managerial review based on overall activity, pipeline performance, and chat tone.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {evaluationResult?.split('\n\n').map((paragraph, i) => (
              <p key={i} className="text-sm leading-relaxed text-foreground">
                {paragraph}
              </p>
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <Button variant="outline" onClick={() => setEvaluationResult(null)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
