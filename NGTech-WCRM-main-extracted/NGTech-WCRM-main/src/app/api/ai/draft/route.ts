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
        { error: 'No messages to draft a reply for' },
        { status: 400 }
      )
    }

    // Reverse to get chronological order for context
    messages.reverse()

    const transcript = messages
      .map((m) => {
        const sender = m.sender_type === 'customer' ? 'Customer' : 'Agent'
        const content = m.content_type === 'text' ? m.content_text : `[${m.content_type}]`
        return `${sender}: ${content}`
      })
      .join('\n')

    // Fetch WhatsApp config to use the same system prompt and knowledge base
    const { data: config } = await supabase
      .from('whatsapp_config')
      .select('ai_auto_reply_prompt, ai_knowledge_base')
      .single()

    const systemPrompt = config?.ai_auto_reply_prompt || 'You are a helpful customer support agent for a business.'
    const knowledgeBase = config?.ai_knowledge_base || ''

    let prompt = `System: ${systemPrompt}\n\nBased on the following recent messages in the conversation thread, generate a polite, concise, and professional draft reply to the customer's last message. Do not include placeholders like "[Your Name]". Just write the exact text of the reply.\n\n`
    
    if (knowledgeBase.trim()) {
      prompt += `Knowledge Base (use this to inform your reply):\n${knowledgeBase}\n\n`
    }
    
    prompt += `Recent Conversation Transcript:\n${transcript}\n\nAgent Draft Reply:`

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
    console.error('Error in AI draft POST:', error)
    return NextResponse.json(
      { error: error.message || String(error) },
      { status: 500 }
    )
  }
}
