import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { contact_id, title, meeting_link, scheduled_at } = body

    if (!contact_id || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 1. Insert Meeting into Database
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .insert({
        user_id: user.id,
        contact_id,
        title,
        meeting_link,
        scheduled_at,
        status: 'scheduled'
      })
      .select()
      .single()

    if (meetingError) throw meetingError

    // 2. Generate WhatsApp formatted message
    const formattedDate = scheduled_at 
      ? new Date(scheduled_at).toLocaleString('en-US', { 
          weekday: 'long', 
          month: 'short', 
          day: 'numeric', 
          hour: 'numeric', 
          minute: '2-digit' 
        }) 
      : 'To Be Determined'
      
    const messageText = `📅 *MEETING INVITATION* 📅\n━━━━━━━━━━━━━━━━━━━━━━\n✨ *Topic:* ${title}\n🕒 *Time:* ${formattedDate}\n🔗 *Link:* ${meeting_link || 'To be provided'}\n━━━━━━━━━━━━━━━━━━━━━━\nWe look forward to speaking with you! Let us know if you need to reschedule.`

    // 3. Send WhatsApp Message
    // Similar to quotes, we return the formatted string so the client can trigger the send.
    return NextResponse.json({ success: true, meeting, messageText })
  } catch (error: any) {
    console.error('Error creating meeting:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
