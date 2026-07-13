import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateText } from 'ai'
import { groq } from '@ai-sdk/groq'

// Simple helper to parse time strings like "09:00" into minutes since midnight
function parseTimeStr(timeStr: string) {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

// Calculate business hours elapsed
function calculateBusinessElapsedMs(startTs: string, endTs: string, config: any): number {
  if (!config || !config.schedule) {
    return new Date(endTs).getTime() - new Date(startTs).getTime();
  }

  const start = new Date(startTs);
  const end = new Date(endTs);
  let current = new Date(start);
  let elapsedMs = 0;

  const dayMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  // A very rough 14-hour fallback if exact calculation gets too complex
  // If elapsed time > 14 hours (50400000 ms), subtract 14 hours
  const rawElapsed = end.getTime() - start.getTime();
  if (rawElapsed > 14 * 60 * 60 * 1000) {
    return rawElapsed - (14 * 60 * 60 * 1000); // 14 hours subtracted
  }

  return rawElapsed;
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // 1. Fetch all members/profiles in this account
    const { data: currentUserProfile, error: profileErr } = await supabase
      .from('profiles')
      .select('account_id, account_role, accounts(business_hours)')
      .eq('user_id', user.id)
      .single()

    if (profileErr || !currentUserProfile) {
      return NextResponse.json({ error: 'Account profile not found' }, { status: 404 })
    }

    const { account_id, account_role, accounts } = currentUserProfile
    const businessHours = Array.isArray(accounts) ? accounts[0]?.business_hours : accounts?.business_hours

    let profilesQuery = supabase
      .from('profiles')
      .select('id, user_id, full_name, email, avatar_url, account_role')
      .eq('account_id', account_id)
      
    if (account_role === 'agent') {
      profilesQuery = profilesQuery.eq('user_id', user.id)
    }

    const { data: profiles, error: profilesErr } = await profilesQuery

    if (profilesErr || !profiles) {
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 })
    }

    // Prepare date filters for queries
    let metricsQuery = supabase.from('conversation_metrics').select('*').eq('account_id', account_id)
    let dealsQuery = supabase.from('deals').select('user_id, status').eq('status', 'won').in('user_id', profiles.map(p => p.user_id))
    let meetingsQuery = supabase.from('meetings').select('user_id, status').in('user_id', profiles.map(p => p.user_id))
    let convsQuery = supabase.from('conversations').select('assigned_agent_id, contact_id').eq('account_id', account_id)

    if (startDate) {
      metricsQuery = metricsQuery.gte('created_at', startDate)
      dealsQuery = dealsQuery.gte('updated_at', startDate)
      meetingsQuery = meetingsQuery.gte('created_at', startDate)
      convsQuery = convsQuery.gte('created_at', startDate)
    }
    
    if (endDate) {
      // make it inclusive of the end date
      const inclusiveEnd = endDate.includes('T') ? endDate : endDate + 'T23:59:59.999Z'
      metricsQuery = metricsQuery.lte('created_at', inclusiveEnd)
      dealsQuery = dealsQuery.lte('updated_at', inclusiveEnd)
      meetingsQuery = meetingsQuery.lte('created_at', inclusiveEnd)
      convsQuery = convsQuery.lte('created_at', inclusiveEnd)
    }

    const [
      { data: metrics },
      { data: deals },
      { data: meetings },
      { data: convs },
      { data: config }
    ] = await Promise.all([
      metricsQuery,
      dealsQuery,
      meetingsQuery,
      convsQuery,
      supabase.from('whatsapp_config').select('sla_enabled, sla_first_reply_min').eq('account_id', account_id).maybeSingle()
    ])

    const slaFirstReplyMin = config?.sla_first_reply_min ?? 5

    const agentMetricsMap = new Map<string, any>()

    for (const p of profiles) {
      agentMetricsMap.set(p.user_id, {
        userId: p.user_id,
        fullName: p.full_name,
        email: p.email,
        avatarUrl: p.avatar_url,
        role: p.account_role,
        conversationsHandled: 0,
        totalResponseTimeMs: 0,
        responseTimeCount: 0,
        totalCsat: 0,
        csatCount: 0,
        totalMessagesSent: 0,
        botMessagesSent: 0,
        closedCount: 0,
        slaCompliantCount: 0,
        dealsWon: 0,
        meetingsCreated: 0,
        meetingsAttended: 0,
        uniqueLeads: new Set(),
      })
    }

    // Process Deals
    for (const d of (deals || [])) {
      if (agentMetricsMap.has(d.user_id)) {
        agentMetricsMap.get(d.user_id).dealsWon += 1
      }
    }

    // Process Meetings
    for (const m of (meetings || [])) {
      if (agentMetricsMap.has(m.user_id)) {
        agentMetricsMap.get(m.user_id).meetingsCreated += 1
        if (m.status === 'completed') {
          agentMetricsMap.get(m.user_id).meetingsAttended += 1
        }
      }
    }

    // Process Conversations (Leads)
    for (const c of (convs || [])) {
      if (c.assigned_agent_id && agentMetricsMap.has(c.assigned_agent_id)) {
        agentMetricsMap.get(c.assigned_agent_id).uniqueLeads.add(c.contact_id)
      }
    }

    // Process Metrics
    for (const m of (metrics || [])) {
      if (!m.assigned_agent_id) continue
      
      const stats = agentMetricsMap.get(m.assigned_agent_id)
      if (!stats) continue

      stats.conversationsHandled += 1
      stats.totalMessagesSent += (m.message_count_agent || 0)
      stats.botMessagesSent += (m.message_count_bot || 0)
      
      if (m.first_response_time_ms !== null && m.first_response_time_ms !== undefined) {
        let finalResponseMs = Number(m.first_response_time_ms)
        
        // Use exact business hours if the timestamps exist
        if (m.first_customer_msg_at && m.first_agent_reply_at && businessHours) {
          finalResponseMs = calculateBusinessElapsedMs(m.first_customer_msg_at, m.first_agent_reply_at, businessHours)
        } else if (finalResponseMs > 14 * 60 * 60 * 1000) {
          // Retroactive fallback for old rows without timestamps
          finalResponseMs = finalResponseMs - (14 * 60 * 60 * 1000)
        }

        stats.totalResponseTimeMs += finalResponseMs
        stats.responseTimeCount += 1

        const responseMin = finalResponseMs / 60000
        if (responseMin <= slaFirstReplyMin) {
          stats.slaCompliantCount += 1
        }
      }

      if (m.csat_score !== null && m.csat_score !== undefined) {
        stats.totalCsat += m.csat_score
        stats.csatCount += 1
      }

      if (m.closed_at !== null) {
        stats.closedCount += 1
      }
    }

    // Prepare leaderboard and run AI summary
    const leaderboardPromises = Array.from(agentMetricsMap.values()).map(async (stats) => {
      const avgResponseTimeMin = stats.responseTimeCount > 0 
        ? Math.round((stats.totalResponseTimeMs / stats.responseTimeCount) / 60000) 
        : null
      
      const avgCsat = stats.csatCount > 0 
        ? Number((stats.totalCsat / stats.csatCount).toFixed(2)) 
        : null
      
      const resolutionRate = stats.conversationsHandled > 0
        ? Math.round((stats.closedCount / stats.conversationsHandled) * 100)
        : 0

      const slaComplianceRate = stats.responseTimeCount > 0
        ? Math.round((stats.slaCompliantCount / stats.responseTimeCount) * 100)
        : 100 

      let compositeScore = 0
      
      if (avgCsat !== null) {
        compositeScore += ((avgCsat - 1) / 4) * 100 * 0.3
      } else {
        compositeScore += 70 * 0.3 
      }

      if (avgResponseTimeMin !== null) {
        const timeScore = Math.max(0, 100 - (avgResponseTimeMin / 1.2))
        compositeScore += timeScore * 0.2
      } else {
        compositeScore += 50 * 0.2 
      }

      compositeScore += resolutionRate * 0.2
      compositeScore += slaComplianceRate * 0.3

      const numLeads = stats.uniqueLeads.size

      // AI Summary Generation
      let aiSummary = "Data insufficient for AI evaluation."
      try {
        const prompt = `Evaluate the performance of CRM Agent "${stats.fullName}". 
Stats: Score ${Math.round(compositeScore)}/100, Leads Talked To: ${numLeads}, Deals Won: ${stats.dealsWon}, Meetings Attended: ${stats.meetingsAttended}/${stats.meetingsCreated}, SLA Compliance: ${slaComplianceRate}%, Avg Response: ${avgResponseTimeMin ?? 'N/A'} min, CSAT: ${avgCsat ?? 'N/A'}. 
Provide a very short, professional 1-2 sentence evaluation summarizing their performance, strengths, or areas for improvement. Do not use filler text. Speak directly about the agent in the third person.`
        
        const { text } = await generateText({
          model: groq('llama-3.3-70b-versatile'),
          prompt,
          maxTokens: 60,
        })
        aiSummary = text.trim()
      } catch (err) {
        console.error("AI Summary generation failed:", err)
      }

      return {
        userId: stats.userId,
        fullName: stats.fullName,
        email: stats.email,
        avatarUrl: stats.avatarUrl,
        role: stats.role,
        conversationsHandled: stats.conversationsHandled,
        avgResponseTimeMin,
        avgCsat,
        resolutionRate,
        slaComplianceRate,
        messagesSent: stats.totalMessagesSent,
        botMessagesSent: stats.botMessagesSent,
        dealsWon: stats.dealsWon,
        meetingsCreated: stats.meetingsCreated,
        meetingsAttended: stats.meetingsAttended,
        uniqueLeads: numLeads,
        aiSummary,
        score: Math.round(compositeScore),
      }
    })

    const leaderboard = await Promise.all(leaderboardPromises)
    leaderboard.sort((a, b) => b.score - a.score)

    // Calculate global SLA compliance rate for the summary
    let totalResponseTimeCount = 0
    let totalSlaCompliantCount = 0
    for (const stats of agentMetricsMap.values()) {
      totalResponseTimeCount += stats.responseTimeCount
      totalSlaCompliantCount += stats.slaCompliantCount
    }
    const globalSlaCompliance = totalResponseTimeCount > 0
      ? Math.round((totalSlaCompliantCount / totalResponseTimeCount) * 100)
      : 100

    return NextResponse.json({
      leaderboard,
      summary: {
        slaComplianceRate: globalSlaCompliance
      }
    })
  } catch (err: any) {
    console.error('[scorecard-api] failed:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
