import { NextResponse } from 'next/server';
import { generateText, tool } from 'ai';
import { z } from 'zod';
import { groq } from '@ai-sdk/groq';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { data: config } = await supabase.from('whatsapp_config').select('*').limit(1).single();
    
    const history = "Customer: What are your service?";
    
    let finalPrompt = `System: ${config.ai_auto_reply_prompt}\n\nIMPORTANT INSTRUCTIONS:\n1. Answer the user's question concisely using ONLY the Knowledge Base below.\n2. If the user explicitly asks to speak to a human, expresses extreme frustration, or asks a complex question entirely unrelated to the Knowledge Base, call the requestHumanHandoff tool.\n3. Do not offer a human specialist unless they ask for one or you absolutely cannot help them with the Knowledge Base.`;
    
    if (config.ai_knowledge_base) {
      finalPrompt += `\n\nKnowledge Base:\n${config.ai_knowledge_base}`;
    }
    
    finalPrompt += `\n\nRecent Conversation History:\n${history}\n\nAssistant:`;

    const result = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      prompt: finalPrompt,
      tools: {
        requestHumanHandoff: tool({
          description: 'Call this tool when the customer is frustrated, explicitly asks for a human, or asks a question that you cannot answer.',
          parameters: z.object({
            reason: z.string().describe('The reason for handing off to a human.'),
          }),
        }),
      },
    });
    
    return NextResponse.json({ 
      success: true, 
      text: result.text, 
      tools: result.toolCalls,
      prompt: finalPrompt
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message, stack: err.stack });
  }
}
