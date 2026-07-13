import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/admin-supabase'
import { generateText } from 'ai'
import { groq } from '@ai-sdk/groq'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is platform admin or owner/admin in the same account
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('account_id, account_role, is_platform_admin')
      .eq('user_id', user.id)
      .single()

    const { id: agentId } = await context.params
    const admin = getAdminClient()
    
    const { data: agentProfile, error: profileErr } = await admin
      .from('profiles')
      .select('user_id, full_name, email, role, account_role, created_at, account_id')
      .eq('user_id', agentId)
      .single()

    if (profileErr || !agentProfile) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    if (!currentProfile?.is_platform_admin && currentProfile?.account_id !== agentProfile.account_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!currentProfile?.is_platform_admin && currentProfile?.account_role !== 'owner' && currentProfile?.account_role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Only Admins can run evaluations' }, { status: 403 })
    }

    // 1. Fetch Deals
    const { data: deals } = await admin.from('deals').select('status, value').eq('user_id', agentId)
    const wonDeals = deals?.filter(d => d.status === 'won').length || 0
    const totalDeals = deals?.length || 0

    // 2. Fetch Meetings
    const { data: meetings } = await admin.from('meetings').select('status').eq('user_id', agentId)
    const completedMeetings = meetings?.filter(m => m.status === 'completed').length || 0

    // 3. Fetch Suspensions
    const { data: suspensions } = await admin.from('suspensions').select('id').eq('user_id', agentId)
    const suspensionCount = suspensions?.length || 0

    // 4. Fetch Scorecard Metrics (Conversations, CSAT, Time)
    const { data: metrics } = await admin
      .from('conversation_metrics')
      .select('csat_score, message_count_agent, closed_at')
      .eq('assigned_agent_id', agentId)
    
    let totalCsat = 0, csatCount = 0, totalMsgs = 0, resolved = 0
    metrics?.forEach(m => {
      totalMsgs += m.message_count_agent || 0
      if (m.csat_score !== null) { totalCsat += m.csat_score; csatCount++ }
      if (m.closed_at) resolved++
    })
    const avgCsat = csatCount > 0 ? (totalCsat / csatCount).toFixed(1) : 'N/A'
    const resolutionRate = metrics?.length ? Math.round((resolved / metrics.length) * 100) : 0

    // 5. Fetch Chat History Sample for Tone Analysis (Last 7 Days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const { data: recentMessages } = await admin
      .from('messages')
      .select('content_text')
      .eq('sender_id', agentId)
      .eq('sender_type', 'agent')
      .eq('content_type', 'text')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(100) // generous limit to give a great picture without crashing the AI model

    const chatSample = (recentMessages || []).map(m => m.content_text).filter(Boolean).join('\n- ') || "No chat history available."

    // Construct the blunt, comprehensive prompt
    const prompt = `You are an executive CRM AI manager providing a strict, blunt, and comprehensive "reality check" performance evaluation for an employee named "${agentProfile.full_name}".
Your goal is to show them exactly where they stand in the company, highlighting their worth, their achievements, and aggressively pointing out their failures and areas that need improvement.

Here are their precise metrics:
- Deals Won: ${wonDeals} out of ${totalDeals} total deals.
- Meetings Completed: ${completedMeetings}
- Resolution Rate: ${resolutionRate}% of assigned conversations.
- Average CSAT Score: ${avgCsat}/5
- Total Leave/Suspension Instances: ${suspensionCount}

Here is a sample of their recent chat messages sent to clients (Analyze their tone, professionalism, and sales ability):
- ${chatSample}

Instructions:
1. Provide a brutally honest evaluation of their overall activity and worth to the company based on these stats and their chat tone.
2. If they are underperforming (e.g. low resolution, 0 deals), call it out strictly and tell them they need to step up. If they are doing great, praise them but maintain a demanding managerial tone.
3. Be sure to analyze their chat history tone. Are they polite? Too brief? Unprofessional?
4. Format the output in EXACTLY 2 to 3 paragraphs. No more, no less.
5. Do not use filler or robotic phrasing like "As an AI". Speak directly as the Manager. Speak about the employee in the third person (e.g., "Sandeep is struggling with...").`

    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      prompt,
      maxTokens: 500,
      temperature: 0.7
    })

    return NextResponse.json({ evaluation: text.trim() })

  } catch (error: any) {
    console.error('[agent evaluate POST]', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
