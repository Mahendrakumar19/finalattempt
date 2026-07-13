import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateObject } from 'ai'
import { groq } from '@ai-sdk/groq'
import { z } from 'zod'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { conversation_id } = body

    if (!conversation_id) {
      return NextResponse.json(
        { error: 'conversation_id is required' },
        { status: 400 }
      )
    }

    // Fetch conversation and messages
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*, contact:contacts(*)')
      .eq('id', conversation_id)
      .single()

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: true })

    if (msgError || !messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'No messages to summarize' },
        { status: 400 }
      )
    }

    // Format messages for the prompt
    const transcript = messages
      .map((m) => {
        const sender = m.sender_type === 'customer' ? 'Customer' : 'Agent'
        const content = m.content_type === 'text' ? m.content_text : `[${m.content_type}]`
        return `${sender}: ${content}`
      })
      .join('\n')

    const { object } = await generateObject({
      model: groq('llama-3.1-8b-instant'),
      schema: z.object({
        summary: z.string().describe('A very concise 1-2 sentence overall summary of the conversation.'),
        points: z.array(z.string()).describe('List of 3-5 key bullet points extracting core intent, budget, timeline, or requests (e.g. Customer wants an ERP Integration, Budget is ₹10 Lakhs).'),
        last_objection: z.string().nullable().describe('The primary objection or concern raised by the customer, if any (e.g. Implementation Cost and timeline). Null if none.'),
        action: z.string().describe('A very short, 1-sentence recommended action for the human agent.'),
        lead_score: z.string().describe('Evaluate the customer lead status. MUST be exactly one of: hot, warm, cold'),
        sentiment: z.string().describe('Overall sentiment. MUST be exactly one of: positive, neutral, negative'),
        priority: z.string().describe('Priority level. MUST be exactly one of: high, medium, low'),
        confidence: z.number().min(0).max(100).describe('Confidence score (0-100) of your evaluation.')
      }),
      prompt: `Analyze the following conversation between a Customer and an Agent to extract key intelligence points and health metrics.\n\nConversation Transcript:\n${transcript}`
    })

    const finalSummary = JSON.stringify({
      summary: object.summary,
      points: object.points,
      last_objection: object.last_objection,
      action: object.action
    });

    // Safely parse the enum fields to prevent database constraint errors
    const safeLeadScore = ['hot', 'warm', 'cold'].includes(object.lead_score?.toLowerCase()) ? object.lead_score.toLowerCase() : 'warm';
    const safeSentiment = ['positive', 'neutral', 'negative'].includes(object.sentiment?.toLowerCase()) ? object.sentiment.toLowerCase() : 'neutral';
    const safePriority = ['high', 'medium', 'low'].includes(object.priority?.toLowerCase()) ? object.priority.toLowerCase() : 'medium';
    const safeConfidence = typeof object.confidence === 'number' ? Math.round(object.confidence) : 80;

    // Save summary and health metrics to the database
    await supabase
      .from('conversations')
      .update({ 
        ai_summary: finalSummary,
        ai_lead_score: safeLeadScore,
        ai_sentiment: safeSentiment,
        priority: safePriority,
        ai_confidence: safeConfidence
      })
      .eq('id', conversation_id)

    return NextResponse.json({ 
      success: true, 
      summary: finalSummary,
      lead_score: safeLeadScore,
      sentiment: safeSentiment,
      priority: safePriority,
      confidence: safeConfidence
    })
  } catch (error: any) {
    console.error('Error in AI summarize POST:', error)
    return NextResponse.json(
      { error: error.message || String(error) },
      { status: 500 }
    )
  }
}
