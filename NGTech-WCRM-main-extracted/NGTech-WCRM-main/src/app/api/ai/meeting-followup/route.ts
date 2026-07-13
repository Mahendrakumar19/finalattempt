import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { notes, contactName, meetingTitle, agentName } = await req.json();

    if (!notes) {
      return NextResponse.json({ error: "Notes are required to generate a follow-up." }, { status: 400 });
    }

    const prompt = `
      You are an AI assistant helping a sales agent draft a polite and professional WhatsApp follow-up message to a client after a meeting.
      
      Client Name: ${contactName || 'Client'}
      Meeting Topic: ${meetingTitle || 'Meeting'}
      Agent Name: ${agentName || 'Your Agent'}
      Agent Notes from the meeting:
      "${notes}"
      
      Draft a friendly, professional, and concise WhatsApp message to send to the client.
      - Start with a warm greeting (e.g., "Hi [Client Name], great speaking with you today!").
      - Summarize any key points or next steps mentioned in the agent's notes.
      - End with a polite sign-off using the agent's actual name: "Best regards, ${agentName || 'Your Agent'}".
      - Keep it short and suitable for WhatsApp (use some emojis where appropriate).
      - Do NOT use placeholder brackets like [Your Name] or [Agent Name]. Use the actual name provided.
      - Just output the exact message the agent should send, nothing else.
    `;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: "You are an expert sales assistant." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`Grok API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.choices[0].message.content.trim();

    return NextResponse.json({ message: text });
  } catch (error: any) {
    console.error("Meeting follow-up generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate follow-up message." },
      { status: 500 }
    );
  }
}
