import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AIProviderService } from '@/lib/services/ai/provider.service';
import { generateText, generateObject } from 'ai';
import { z } from 'zod';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('account_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.account_id) {
      return NextResponse.json({ error: 'No account associated with user' }, { status: 403 });
    }

    const body = await request.json();
    const { action, conversationId, context, query } = body;
    // action: 'draft_reply', 'summarize', 'extract_intent', 'recommend_action'

    if (!action || !conversationId) {
      return NextResponse.json({ error: 'Action and conversationId are required' }, { status: 400 });
    }

    // Fetch conversation history
    const { data: messages } = await supabase
      .from('messages')
      .select('content_text, sender_type, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(50);

    const transcript = (messages || [])
      .filter(m => m.content_text)
      .map(m => `[${m.sender_type}] ${m.content_text}`)
      .join('\n');

    // Fetch AI Settings
    const { data: aiSettings } = await supabase
      .from('ai_assistant_settings')
      .select('*')
      .eq('account_id', profile.account_id)
      .single();

    const providerName = aiSettings?.provider || 'groq';
    const modelName = aiSettings?.model || 'llama-3.3-70b-versatile';
    
    // Some accounts might not have api keys set up properly yet, so handle fallback gracefully.
    let aiModel;
    try {
       aiModel = AIProviderService.getModel(providerName, modelName);
    } catch (err) {
       console.error("AI Provider Init Error:", err);
       return NextResponse.json({ error: 'AI Provider is not properly configured.' }, { status: 500 });
    }

    switch (action) {
      case 'draft_reply':
        const { text: replyText } = await generateText({
          model: aiModel,
          system: `You are an expert customer support agent. Draft a professional, empathetic, and concise reply to the customer based on the conversation history. Do not include placeholders. Additional instructions: ${query || 'None'}`,
          prompt: `Conversation:\n${transcript}`,
        });
        return NextResponse.json({ result: replyText });

      case 'summarize':
        const { text: summaryText } = await generateText({
          model: aiModel,
          system: `Summarize the following customer service conversation in 3-4 bullet points. Focus on the core issue and current status.`,
          prompt: `Conversation:\n${transcript}`,
        });
        return NextResponse.json({ result: summaryText });

      case 'extract_intent':
        const { object: intentObj } = await generateObject({
          model: aiModel,
          system: `Analyze the latest messages in the conversation and extract the customer's intent, sentiment, and escalation risk.`,
          prompt: `Conversation:\n${transcript}`,
          schema: z.object({
            intent: z.string().describe("The primary intent of the customer (e.g. Refund Request, Technical Issue, Pricing Question)"),
            sentiment: z.string().describe("Positive, Neutral, Negative, or Frustrated"),
            escalation_risk: z.enum(['low', 'medium', 'high']).describe("Risk of customer churning or escalating to management"),
            summary: z.string().describe("A brief 1-sentence summary of the current state")
          })
        });
        return NextResponse.json({ result: intentObj });
        
      case 'recommend_action':
         const { object: actionObj } = await generateObject({
          model: aiModel,
          system: `Analyze the conversation and recommend the "Next Best Action" the agent should take in the CRM workspace (e.g., Create Quote, Send Payment Link, Close Ticket, Schedule Call).`,
          prompt: `Conversation:\n${transcript}\n\nCRM Context:\n${JSON.stringify(context || {})}`,
          schema: z.object({
            action: z.string().describe("The exact action to take"),
            reason: z.string().describe("Why this action is recommended"),
            requires_entity_creation: z.boolean().describe("True if this action involves creating a ticket, quote, deal, or order")
          })
        });
        return NextResponse.json({ result: actionObj });

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Copilot API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
