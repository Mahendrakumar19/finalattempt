import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase credentials missing' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    })

    const { data: conversations, error: fetchErr } = await supabase.from('conversations').select('id')
    
    if (fetchErr || !conversations) {
      return NextResponse.json({ error: 'No conversations found' }, { status: 500 })
    }

    const sentiments = ['positive', 'neutral', 'negative']
    const scores = ['hot', 'warm', 'cold']

    for (const conv of conversations) {
      const randomSentiment = sentiments[Math.floor(Math.random() * sentiments.length)]
      const randomScore = scores[Math.floor(Math.random() * scores.length)]

      await supabase
        .from('conversations')
        .update({ 
          ai_sentiment: randomSentiment,
          ai_lead_score: randomScore
        })
        .eq('id', conv.id)
    }

    return NextResponse.json({ success: true, message: `Successfully seeded AI badges on ${conversations.length} conversations! Check your Inbox.` })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
