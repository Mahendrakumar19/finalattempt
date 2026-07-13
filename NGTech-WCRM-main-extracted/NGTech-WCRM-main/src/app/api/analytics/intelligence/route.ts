import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateObject } from 'ai'
import { groq } from '@ai-sdk/groq'
import { z } from 'zod'

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Fetch current user's profile to get account_id
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('account_id')
      .eq('user_id', user.id)
      .single()

    if (profileErr || !profile) {
      return NextResponse.json({ error: 'Account profile not found' }, { status: 404 })
    }

    const { account_id } = profile

    // 2. Fetch Topics Distribution
    const { data: topics, error: topicsErr } = await supabase
      .from('conversation_topics')
      .select('topic')
      .eq('account_id', account_id)

    const topicDistribution: Record<string, number> = {}
    if (!topicsErr && topics) {
      for (const t of topics) {
        if (!t.topic) continue
        const name = t.topic.charAt(0).toUpperCase() + t.topic.slice(1).toLowerCase()
        topicDistribution[name] = (topicDistribution[name] || 0) + 1
      }
    }

    // Convert topic distribution to UI format
    const topicData = Object.entries(topicDistribution).map(([name, value]) => ({
      name,
      value,
    }))

    // 3. Fetch Sentiment Distribution & Trends
    const { data: conversations, error: convsErr } = await supabase
      .from('conversations')
      .select('id, ai_sentiment, ai_lead_score, created_at, contacts(name, phone)')
      .eq('account_id', account_id)
      .order('created_at', { ascending: true })

    const sentimentCount = { positive: 0, neutral: 0, negative: 0 }
    const sentimentHistory: Record<string, typeof sentimentCount> = {}
    const churnAlerts: any[] = []

    if (!convsErr && conversations) {
      for (const c of conversations) {
        // Sentiment count
        const sentiment = (c.ai_sentiment || 'neutral') as 'positive' | 'neutral' | 'negative'
        sentimentCount[sentiment] += 1

        // Sentiment trend by day (last 30 days)
        const dayKey = new Date(c.created_at).toISOString().split('T')[0]
        if (!sentimentHistory[dayKey]) {
          sentimentHistory[dayKey] = { positive: 0, neutral: 0, negative: 0 }
        }
        sentimentHistory[dayKey][sentiment] += 1

        // Churn Risk: negative sentiment + hot/warm lead or general complaints
        if (sentiment === 'negative') {
          const contact = Array.isArray(c.contacts) ? c.contacts[0] : c.contacts
          churnAlerts.push({
            conversationId: c.id,
            contactName: contact?.name || contact?.phone || 'Unknown Contact',
            phone: contact?.phone || '',
            leadScore: c.ai_lead_score || 'cold',
            createdAt: c.created_at,
          })
        }
      }
    }

    // Format sentiment trend for charts
    const sentimentTrend = Object.entries(sentimentHistory)
      .map(([date, counts]) => ({
        date,
        positive: counts.positive,
        neutral: counts.neutral,
        negative: counts.negative,
      }))
      .slice(-30) // last 30 days

    // 4. FAQ Auto-Discovery
    // First check if we have cached FAQs in the database
    let { data: cachedFaqs, error: faqsErr } = await supabase
      .from('ai_insights')
      .select('*')
      .eq('account_id', account_id)
      .eq('insight_type', 'faq')
      .eq('is_dismissed', false)
      .order('created_at', { ascending: false })

    // If no FAQs found in database, trigger dynamic FAQ discovery
    if ((!cachedFaqs || cachedFaqs.length === 0) && process.env.GROQ_API_KEY) {
      try {
        // Retrieve last 50 customer messages for AI analysis
        const { data: messages } = await supabase
          .from('messages')
          .select('content_text')
          .eq('sender_type', 'customer')
          .order('created_at', { ascending: false })
          .limit(50)

        if (messages && messages.length > 5) {
          const messageTexts = messages.map(m => m.content_text).filter(Boolean).join('\n- ')
          
          const faqDiscoveryResult = await generateObject({
            model: groq('llama-3.3-70b-versatile'),
            schema: z.object({
              faqs: z.array(z.object({
                question: z.string().describe('Common customer question'),
                suggestedAnswer: z.string().describe('Suggested accurate answer draft'),
                frequency: z.number().describe('Estimated frequency or relevance count'),
              })),
            }),
            prompt: `Below is a list of recent customer messages. Analyze them to discover the top 5 most frequently asked questions or recurring topics that can be added to a business Knowledge Base.
Messages:
- ${messageTexts}`,
          })

          const newFaqs = faqDiscoveryResult.object.faqs
          if (newFaqs && newFaqs.length > 0) {
            // Write newly discovered FAQs to ai_insights table so they're cached
            const inserts = newFaqs.map(f => ({
              account_id,
              insight_type: 'faq',
              title: f.question,
              description: f.suggestedAnswer,
              metadata: { frequency: f.frequency },
            }))

            const { data: insertedFaqs } = await supabase
              .from('ai_insights')
              .insert(inserts)
              .select('*')

            if (insertedFaqs) {
              cachedFaqs = insertedFaqs
            }
          }
        }
      } catch (faqErr) {
        console.error('[faq-discovery] failed:', faqErr)
      }
    }

    const faqs = (cachedFaqs || []).map(f => ({
      id: f.id,
      question: f.title,
      answer: f.description,
      frequency: (f.metadata as any)?.frequency || 1,
      createdAt: f.created_at,
    }))

    return NextResponse.json({
      topics: topicData,
      sentiment: sentimentCount,
      sentimentTrend,
      faqs,
      churnAlerts: churnAlerts.slice(0, 5), // return top 5 churn risks
    })
  } catch (err: any) {
    console.error('[intelligence-api] failed:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
