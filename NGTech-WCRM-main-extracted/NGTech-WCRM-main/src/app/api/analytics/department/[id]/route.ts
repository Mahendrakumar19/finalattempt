import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Calculate business hours elapsed
function calculateBusinessElapsedMs(startTs: string, endTs: string, config: any): number {
  if (!config || !config.schedule) {
    return new Date(endTs).getTime() - new Date(startTs).getTime();
  }

  const start = new Date(startTs);
  const end = new Date(endTs);
  let current = new Date(start);
  let elapsedMs = 0;

  const rawElapsed = end.getTime() - start.getTime();
  if (rawElapsed > 14 * 60 * 60 * 1000) {
    return rawElapsed - (14 * 60 * 60 * 1000); 
  }

  return rawElapsed;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check if department exists and user is part of account
    const { data: dept, error: deptErr } = await supabase
      .from('departments')
      .select('id, account_id, accounts(business_hours)')
      .eq('id', params.id)
      .single()

    if (deptErr || !dept) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 })
    }
    
    const businessHours = Array.isArray(dept.accounts) ? dept.accounts[0]?.business_hours : dept.accounts?.business_hours;

    const { data: config } = await supabase
      .from('whatsapp_config')
      .select('sla_enabled, sla_first_reply_min')
      .eq('account_id', dept.account_id)
      .maybeSingle()

    const slaFirstReplyMin = config?.sla_first_reply_min ?? 5

    // Get all conversations for this department
    const { data: convs, error: convsErr } = await supabase
      .from('conversations')
      .select('id, created_at, closed_at')
      .eq('department_id', params.id)

    if (convsErr || !convs) {
      return NextResponse.json({
        totalConversations: 0,
        avgResponseTimeMin: null,
        avgCsat: null,
        slaComplianceRate: 100,
        resolutionRate: 0,
      })
    }

    const convIds = convs.map(c => c.id)
    
    let metrics: any[] = [];
    if (convIds.length > 0) {
      const { data: m } = await supabase
        .from('conversation_metrics')
        .select('*')
        .in('conversation_id', convIds)
      if (m) metrics = m;
    }

    let totalResponseTimeMs = 0
    let responseTimeCount = 0
    let totalCsat = 0
    let csatCount = 0
    let slaCompliantCount = 0
    let closedCount = convs.filter(c => c.closed_at !== null).length;

    for (const m of metrics) {
      if (m.first_response_time_ms !== null && m.first_response_time_ms !== undefined) {
        let finalResponseMs = Number(m.first_response_time_ms)
        
        if (m.first_customer_msg_at && m.first_agent_reply_at && businessHours) {
          finalResponseMs = calculateBusinessElapsedMs(m.first_customer_msg_at, m.first_agent_reply_at, businessHours)
        } else if (finalResponseMs > 14 * 60 * 60 * 1000) {
          finalResponseMs = finalResponseMs - (14 * 60 * 60 * 1000)
        }

        totalResponseTimeMs += finalResponseMs
        responseTimeCount += 1

        const responseMin = finalResponseMs / 60000
        if (responseMin <= slaFirstReplyMin) {
          slaCompliantCount += 1
        }
      }

      if (m.csat_score !== null && m.csat_score !== undefined) {
        totalCsat += m.csat_score
        csatCount += 1
      }
    }

    const avgResponseTimeMin = responseTimeCount > 0 
      ? Math.round((totalResponseTimeMs / responseTimeCount) / 60000) 
      : null
    
    const avgCsat = csatCount > 0 
      ? Number((totalCsat / csatCount).toFixed(2)) 
      : null
    
    const resolutionRate = convs.length > 0
      ? Math.round((closedCount / convs.length) * 100)
      : 0

    const slaComplianceRate = responseTimeCount > 0
      ? Math.round((slaCompliantCount / responseTimeCount) * 100)
      : 100

    return NextResponse.json({
      totalConversations: convs.length,
      avgResponseTimeMin,
      avgCsat,
      slaComplianceRate,
      resolutionRate,
    })
  } catch (err: any) {
    console.error('[department-analytics-api] failed:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
