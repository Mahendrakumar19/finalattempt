import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateText } from 'ai'
import { groq } from '@ai-sdk/groq'

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

    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (msgError || !messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'No messages to generate a follow-up for' },
        { status: 400 }
      )
    }

    // Reverse to get chronological order for context
    messages.reverse()

    const transcript = messages
      .map((m) => {
        const sender = m.sender_type === 'customer' ? 'Customer' : m.sender_type === 'bot' ? 'AI Bot' : 'Agent'
        const content = m.content_type === 'text' ? m.content_text : `[${m.content_type}]`
        return `${sender}: ${content}`
      })
      .join('\n')

    // Fetch WhatsApp config to check if there is a custom prompt or knowledge base we could use
    const { data: config } = await supabase
      .from('whatsapp_config')
      .select('ai_auto_reply_prompt, ai_knowledge_base')
      .single()

    const knowledgeBase = config?.ai_knowledge_base || ''

    let prompt = `You are a professional support and sales agent. The customer was chatting with you but went silent. Based on the following recent conversation transcript, write a natural, friendly, and highly contextual follow-up message to re-engage the customer. Keep it short, helpful, and free of placeholders like "[Your Name]". Just output the draft message text directly.\n\n`
    
    if (knowledgeBase.trim()) {
      prompt += `Knowledge Base context if helpful:\n${knowledgeBase}\n\n`
    }
    
    prompt += `Recent Conversation Transcript:\n${transcript}\n\nContextual Agent Follow-up Draft:`

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Groq API key is not configured' },
        { status: 500 }
      )
    }

    const { text: draft } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      prompt,
    })

    return NextResponse.json({ success: true, draft: draft.trim() })
  } catch (error: any) {
    console.error('Error in AI follow-up POST:', error)
    return NextResponse.json(
      { error: error.message || String(error) },
      { status: 500 }
    )
  }
}
