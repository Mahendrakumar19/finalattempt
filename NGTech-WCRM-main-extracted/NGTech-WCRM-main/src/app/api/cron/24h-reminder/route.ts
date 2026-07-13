import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/flows/admin-client';
import { generateText } from 'ai';
import { groq } from '@ai-sdk/groq';
import { sendTextMessage } from '@/lib/whatsapp/meta-api';
import { decrypt } from '@/lib/whatsapp/encryption';
import { incrementMessageUsage } from '@/lib/usage-tracking';

export async function POST(req: Request) {
  try {
    // 1. Authenticate the cron request
    const authHeader = req.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Calculate the time window: exactly 23 hours to 23h 5m ago
    const now = new Date();
    const windowStart = new Date(now.getTime() - 23 * 60 * 60 * 1000 - 5 * 60 * 1000); // 23h 5m ago
    const windowEnd = new Date(now.getTime() - 23 * 60 * 60 * 1000); // exactly 23h ago

    // 3. Find open conversations within this exact time window
    const { data: conversations, error: convError } = await supabaseAdmin()
      .from('conversations')
      .select(`
        id, account_id, contact_id, last_message_text, last_message_at,
        contact:contacts(id, phone, name)
      `)
      .eq('status', 'open')
      .gte('last_message_at', windowStart.toISOString())
      .lte('last_message_at', windowEnd.toISOString());

    if (convError || !conversations) {
      console.error('[cron] 24h-reminder: Failed to fetch conversations', convError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    const processedIds: string[] = [];
    const errors: string[] = [];

    // 4. Process each conversation
    for (const conv of conversations) {
      try {
        // We only want to send this if the LAST message was from the customer.
        // Let's fetch the absolute latest message in this conversation.
        const { data: latestMsg } = await supabaseAdmin()
          .from('messages')
          .select('sender_type, content_text')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!latestMsg || latestMsg.sender_type !== 'customer') {
          // If the last message was from the bot or an agent, don't send the reminder.
          continue;
        }

        // Fetch WhatsApp config for this account to send the message
        const { data: config } = await supabaseAdmin()
          .from('whatsapp_config')
          .select('*')
          .eq('account_id', conv.account_id)
          .single();

        if (!config || !config.access_token) {
          errors.push(`Missing WhatsApp config for account ${conv.account_id}`);
          continue;
        }

        // Generate the emotional reminder using Groq
        const prompt = `
          You are an AI assistant for a WhatsApp customer support team. 
          The customer asked/stated: "${latestMsg.content_text || conv.last_message_text}" exactly 23 hours ago.
          Meta's 24-hour messaging window closes in 1 hour. We need them to reply so the chat stays open.
          
          Write a short, emotional, warm reminder message (in Hindi using English script or Devanagari script, mixed with English, "bhai" style).
          Express that we want to help them with their query, but our chat window is closing soon. 
          Ask them to reply with a "Yes" or any message to keep the conversation active.
          
          Tone: Very friendly, brotherly, slightly urgent but polite.
          Output ONLY the exact message text to send. No quotes, no markdown, no filler text.
        `;

        const { text: generatedMessage } = await generateText({
          model: groq('llama-3.1-8b-instant'),
          prompt,
        });

        // Send the message via Meta API
        const accessToken = decrypt(config.access_token);
        // @ts-expect-error Types for nested contact relation
        const phone = conv.contact?.phone;

        if (!phone) {
          errors.push(`Missing phone number for contact ${conv.contact_id}`);
          continue;
        }

        const result = await sendTextMessage({
          phoneNumberId: config.phone_number_id,
          accessToken,
          to: phone,
          text: generatedMessage.trim(),
        });

        // Insert into our DB
        await supabaseAdmin().from('messages').insert({
          conversation_id: conv.id,
          sender_type: 'bot',
          content_type: 'text',
          content_text: generatedMessage.trim(),
          message_id: result.messageId,
          status: 'sent',
        });

        // Track usage
        await incrementMessageUsage(conv.account_id);

        // Update conversation last message timestamp
        await supabaseAdmin()
          .from('conversations')
          .update({
            last_message_text: generatedMessage.trim(),
            last_message_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', conv.id);

        processedIds.push(conv.id);
      } catch (err) {
        console.error(`[cron] 24h-reminder failed for conversation ${conv.id}`, err);
        errors.push(`Conv ${conv.id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return NextResponse.json({
      success: true,
      processed: processedIds.length,
      processedIds,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('[cron] 24h-reminder fatal error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
