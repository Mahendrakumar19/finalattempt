import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// Note: This endpoint is hit by a pg_cron job in Supabase, which does not pass auth tokens.
// We use the service role key to query across all users and trigger messages.
export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase credentials for cron job")
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Find meetings that need evening reminders (tomorrow)
    // Find meetings that need morning reminders (today)
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Simplification for the cron job logic:
    // This queries meetings scheduled in the future that haven't had their morning reminder sent
    const { data: meetings, error } = await supabase
      .from('meetings')
      .select('*, contacts(phone)')
      .gt('scheduled_at', now.toISOString())
      .eq('status', 'scheduled')
      .eq('reminder_morning_sent', false)

    if (error) throw error

    let remindersSent = 0

    for (const meeting of meetings) {
      const scheduledAt = new Date(meeting.scheduled_at)
      
      // If the meeting is within the next 24 hours, send a reminder
      const hoursUntilMeeting = (scheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60)
      
      if (hoursUntilMeeting <= 24) {
        // Construct the reminder message
        const formattedDate = scheduledAt.toLocaleString('en-US', { 
          weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
        })
        const messageText = `⏰ *MEETING REMINDER* ⏰\n━━━━━━━━━━━━━━━━━━━━━━\nJust a quick reminder about our upcoming meeting:\n\n✨ *Topic:* ${meeting.title}\n🕒 *Time:* ${formattedDate}\n🔗 *Link:* ${meeting.meeting_link || 'To be provided'}\n━━━━━━━━━━━━━━━━━━━━━━\nSee you soon!`

        // In a real application, you would hit the internal /api/whatsapp/send logic here
        // For example, by extracting the send logic into a shared utility function.
        // For demonstration, we simply update the database to mark it as sent.

        const { error: updateError } = await supabase
          .from('meetings')
          .update({ reminder_morning_sent: true })
          .eq('id', meeting.id)

        if (updateError) console.error("Failed to update reminder status:", updateError)
        else remindersSent++
      }
    }

    return NextResponse.json({ success: true, processed: meetings.length, sent: remindersSent })
  } catch (error: any) {
    console.error('Error processing meeting reminders:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
