import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Brain, Smile, Meh, Frown, AlertTriangle, HelpCircle, Check, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface TopicData {
  name: string
  value: number
}

interface SentimentData {
  positive: number
  neutral: number
  negative: number
}

interface ChurnAlert {
  conversationId: string
  contactName: string
  phone: string
  leadScore: string
  createdAt: string
}

interface FaqItem {
  id: string
  question: string
  answer: string
  frequency: number
}

interface AiIntelligenceProps {
  data: {
    topics: TopicData[]
    sentiment: SentimentData
    churnAlerts: ChurnAlert[]
    faqs: FaqItem[]
  } | null
  loading: boolean
}

const TOPIC_COLORS: Record<string, string> = {
  Pricing: '#3b82f6', // Blue
  Support: '#10b981', // Green
  Complaint: '#ef4444', // Red
  Product_inquiry: '#f59e0b', // Amber
  Appointment: '#8b5cf6', // Purple
  Feedback: '#ec4899', // Pink
  General: '#6b7280', // Gray
}

export function AiIntelligence({ data, loading }: AiIntelligenceProps) {
  const [activeTab, setActiveTab] = useState<'topics' | 'faqs' | 'sentiment'>('topics')
  const [addingFaqId, setAddingFaqId] = useState<string | null>(null)
  const [dismissingFaqId, setDismissingFaqId] = useState<string | null>(null)
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null)
  const [editingQuestion, setEditingQuestion] = useState('')
  const [editingAnswer, setEditingAnswer] = useState('')
  const [localFaqs, setLocalFaqs] = useState<FaqItem[]>([])

  useEffect(() => {
    if (data?.faqs) {
      setLocalFaqs(data.faqs)
    }
  }, [data])

  if (loading || !data) {
    return (
      <Card className="w-full border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Brain className="h-5 w-5 text-primary" />
            AI Conversation Intelligence
          </CardTitle>
          <CardDescription>Analyzing topic trends, satisfaction levels, and faq candidates.</CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  const { topics, sentiment, churnAlerts } = data

  const handleConfirmAddFaqToKb = async (faqId: string) => {
    setAddingFaqId(faqId)
    try {
      const supabase = createClient()
      
      // 1. Fetch current config
      const { data: config, error: configErr } = await supabase
        .from('whatsapp_config')
        .select('ai_knowledge_base, ai_auto_reply_enabled, ai_auto_reply_prompt')
        .single()

      if (configErr) throw configErr

      const existingKb = config?.ai_knowledge_base || ''
      const newKbEntry = `\n\nQ: ${editingQuestion}\nA: ${editingAnswer}`
      const updatedKb = (existingKb + newKbEntry).trim()

      // 2. PATCH WhatsApp config
      const patchRes = await fetch('/api/whatsapp/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ai_auto_reply_enabled: config?.ai_auto_reply_enabled,
          ai_auto_reply_prompt: config?.ai_auto_reply_prompt,
          ai_knowledge_base: updatedKb,
        }),
      })

      if (!patchRes.ok) {
        throw new Error('Failed to update WhatsApp knowledge base')
      }

      // 3. Mark the FAQ insight as dismissed/archived in db
      await supabase
        .from('ai_insights')
        .update({ is_dismissed: true })
        .eq('id', faqId)

      setLocalFaqs((prev) => prev.filter((f) => f.id !== faqId))
      toast.success('Successfully added to Knowledge Base!')
      setEditingFaqId(null)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Failed to add FAQ.')
    } finally {
      setAddingFaqId(null)
    }
  }

  const handleDismissFaq = async (faqId: string) => {
    setDismissingFaqId(faqId)
    try {
      const supabase = createClient()
      await supabase
        .from('ai_insights')
        .update({ is_dismissed: true })
        .eq('id', faqId)

      setLocalFaqs((prev) => prev.filter((f) => f.id !== faqId))
      toast.success('FAQ suggestion dismissed.')
    } catch (err) {
      toast.error('Failed to dismiss FAQ.')
    } finally {
      setDismissingFaqId(null)
    }
  }

  // Donut values
  const totalTopics = topics.reduce((sum, t) => sum + t.value, 0) || 1
  const size = 200
  const r = 80
  const ringWidth = 18
  const cx = size / 2
  const cy = size / 2

  const minFrac = 0.02
  const rawShares = topics.map((t) => t.value / totalTopics)
  const floored = rawShares.map((x) => Math.max(x, minFrac))
  const floorSum = floored.reduce((a, b) => a + b, 0) || 1
  const shares = floored.map((x) => x / floorSum)

  const offsets: number[] = [0]
  for (let i = 0; i < shares.length; i++) offsets.push(offsets[i] + shares[i])
  const segments = topics.map((t, i) => {
    const start = offsets[i] * Math.PI * 2 - Math.PI / 2
    const end = offsets[i + 1] * Math.PI * 2 - Math.PI / 2
    const color = TOPIC_COLORS[t.name] || '#6b7280'
    return {
      path: arcPath(cx, cy, r, start, end),
      color,
      name: t.name,
    }
  })

  function arcPath(cx: number, cy: number, r: number, startRad: number, endRad: number): string {
    const x1 = cx + r * Math.cos(startRad)
    const y1 = cy + r * Math.sin(startRad)
    const x2 = cx + r * Math.cos(endRad)
    const y2 = cy + r * Math.sin(endRad)
    const largeArc = endRad - startRad > Math.PI ? 1 : 0
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`
  }

  return (
    <Card className="w-full border-border bg-card">
      <CardHeader className="space-y-4 pb-2">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Brain className="h-5 w-5 text-primary" />
            AI Conversation Intelligence
          </CardTitle>
          <CardDescription>
            Topic clustering, real-time customer sentiment, and automated FAQ suggestions.
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-1 rounded-md border border-border bg-background p-0.5 self-start">
          <button
            onClick={() => setActiveTab('topics')}
            className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
              activeTab === 'topics' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Topic Distribution
          </button>
          <button
            onClick={() => setActiveTab('sentiment')}
            className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
              activeTab === 'sentiment' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Sentiment & Risk
          </button>
          <button
            onClick={() => setActiveTab('faqs')}
            className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
              activeTab === 'faqs' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            FAQ Candidates ({localFaqs.length})
          </button>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {activeTab === 'topics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {topics.length === 0 ? (
              <div className="col-span-2 flex items-center justify-center py-12 text-sm text-muted-foreground">
                No topic data analyzed yet. Topics are extracted from incoming client messages.
              </div>
            ) : (
              <>
                <div className="flex justify-center">
                  <div className="relative">
                    <svg viewBox={`0 0 ${size} ${size}`} className="h-44 w-44">
                      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--muted)" strokeWidth={ringWidth} />
                      {segments.map((seg, idx) => (
                        <path key={idx} d={seg.path} fill="none" stroke={seg.color} strokeWidth={ringWidth} />
                      ))}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[24px] font-bold text-foreground tabular-nums">
                        {topics.reduce((sum, t) => sum + t.value, 0)}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Total Chats
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Clustered Categories
                  </h4>
                  <ul className="space-y-2">
                    {topics.map((t) => {
                      const color = TOPIC_COLORS[t.name] || '#6b7280'
                      const pct = Math.round((t.value / totalTopics) * 100)
                      return (
                        <li key={t.name} className="flex items-center gap-3 text-sm">
                          <span
                            className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          <span className="flex-1 truncate text-foreground font-medium">{t.name}</span>
                          <span className="text-muted-foreground tabular-nums">{t.value} ({pct}%)</span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'sentiment' && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl border border-border bg-muted/20 p-4 text-center">
                <Smile className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground tabular-nums">{sentiment.positive}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Positive Chats</div>
              </div>
              <div className="rounded-xl border border-border bg-muted/20 p-4 text-center">
                <Meh className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground tabular-nums">{sentiment.neutral}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Neutral Chats</div>
              </div>
              <div className="rounded-xl border border-border bg-muted/20 p-4 text-center">
                <Frown className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground tabular-nums">{sentiment.negative}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Negative Chats</div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-red-400 flex items-center gap-1.5 uppercase tracking-wider">
                <AlertTriangle className="h-4 w-4" />
                Active Churn Risk Alerts
              </h4>
              {churnAlerts.length === 0 ? (
                <div className="rounded-lg border border-border p-4 text-center text-sm text-muted-foreground">
                  No churn risks detected. Great job keeping customers happy!
                </div>
              ) : (
                <div className="space-y-2">
                  {churnAlerts.map((alert) => (
                    <div
                      key={alert.conversationId}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-red-500/20 bg-red-500/5 p-3.5 hover:bg-red-500/10 transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-foreground text-sm flex items-center gap-2">
                          {alert.contactName}
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            alert.leadScore === 'hot' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {alert.leadScore} lead
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Phone: {alert.phone} • Flagged {new Date(alert.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <a
                        href={`/inbox?conversation=${alert.conversationId}`}
                        className="inline-flex h-8 items-center justify-center rounded-md bg-red-500 px-3 text-xs font-medium text-white hover:bg-red-600 self-start sm:self-center transition-colors"
                      >
                        Intervene Now
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'faqs' && (
          <div className="space-y-4">
            {localFaqs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <HelpCircle className="h-10 w-10 text-muted-foreground mb-3" />
                <h3 className="text-sm font-semibold text-foreground">No FAQ Candidates yet</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Our Llama 70B engine automatically discovers common inquiries and displays them here.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1">
                {localFaqs.map((faq) => (
                  <div
                    key={faq.id}
                    className="rounded-lg border border-border bg-muted/10 p-4 space-y-2 hover:bg-muted/20 transition-colors"
                  >
                    {editingFaqId === faq.id ? (
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-semibold text-muted-foreground uppercase">Edit Question</label>
                          <input
                            type="text"
                            value={editingQuestion}
                            onChange={(e) => setEditingQuestion(e.target.value)}
                            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-semibold text-muted-foreground uppercase">Edit Answer (Fill in placeholders)</label>
                          <textarea
                            value={editingAnswer}
                            onChange={(e) => setEditingAnswer(e.target.value)}
                            rows={3}
                            className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            onClick={() => setEditingFaqId(null)}
                            disabled={addingFaqId === faq.id}
                            className="inline-flex h-7 items-center justify-center rounded px-3 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleConfirmAddFaqToKb(faq.id)}
                            disabled={addingFaqId === faq.id || !editingQuestion.trim() || !editingAnswer.trim()}
                            className="inline-flex h-7 items-center justify-center gap-1 rounded bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition-colors disabled:opacity-50"
                          >
                            {addingFaqId === faq.id ? (
                              <><Loader2 className="h-3 w-3 animate-spin" /> Saving...</>
                            ) : (
                              <><Check className="h-3 w-3" /> Save to Knowledge Base</>
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-4">
                          <div className="font-semibold text-foreground text-sm flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-[11px] font-bold text-primary">
                              Q
                            </span>
                            {faq.question}
                          </div>
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase bg-muted px-2 py-0.5 rounded flex-shrink-0">
                            {faq.frequency} Ask{faq.frequency === 1 ? '' : 's'}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground leading-relaxed pl-7">
                          <strong className="text-foreground font-semibold">Suggested Answer: </strong>
                          {faq.answer}
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-2 pl-7">
                          <button
                            onClick={() => handleDismissFaq(faq.id)}
                            disabled={dismissingFaqId === faq.id || addingFaqId === faq.id}
                            className="inline-flex h-7 items-center justify-center rounded px-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          >
                            Dismiss
                          </button>
                          <button
                            onClick={() => {
                              setEditingFaqId(faq.id)
                              setEditingQuestion(faq.question)
                              setEditingAnswer(faq.answer)
                            }}
                            disabled={addingFaqId === faq.id || dismissingFaqId === faq.id}
                            className="inline-flex h-7 items-center justify-center gap-1 rounded bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition-colors disabled:opacity-50"
                          >
                            <Check className="h-3 w-3" />
                            Review & Add...
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
