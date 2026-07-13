import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateObject } from 'ai'
import { google } from '@ai-sdk/google'
import { z } from 'zod'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { id: conversationId } = await params
    
    // Ensure user has access to this conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .single()
      
    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json({ error: 'AI is not configured on this server.' }, { status: 500 })
    }

    // Fetch the last 30 messages
    const { data: messages } = await supabase
      .from('messages')
      .select('content_text, sender_type, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(30)
      
    if (!messages || messages.length === 0) {
      return NextResponse.json({ 
        summary: 'No messages in this conversation yet.',
        follow_up_recommendation: 'Reach out to start the conversation.'
      })
    }

    // Format for AI
    const history = messages
      .reverse()
      .map(m => `[${new Date(m.created_at).toLocaleString()}] ${m.sender_type === 'customer' ? 'Customer' : 'Agent'}: ${m.content_text || '(media/attachment)'}`)
      .join('\n')

    const { object } = await generateObject({
      model: google('gemini-flash-latest'),
      schema: z.object({
        summary: z.string().describe('A concise 2-3 sentence summary of the conversation history.'),
        follow_up_recommendation: z.string().describe('A specific, actionable recommendation for what the human agent should say or do next to advance the conversation.'),
      }),
      prompt: `Analyze the following customer service conversation and provide a summary and a follow-up recommendation.\n\nConversation History:\n${history}`,
    })

    return NextResponse.json(object)

  } catch (error) {
    console.error('[summarize-api] Error:', error)
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 })
  }
}
