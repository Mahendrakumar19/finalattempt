import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('account_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.account_id) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    let query = supabase
      .from('ai_analytics_events')
      .select('*')
      .eq('account_id', profile.account_id)
      .order('created_at', { ascending: true });
      
    if (fromDate) {
      query = query.gte('created_at', fromDate);
    }
    if (toDate) {
      query = query.lte('created_at', toDate);
    }

    const { data: events, error } = await query;

    if (error) {
      console.error('Analytics fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }

    // Process events into meaningful metrics
    const totalConversations = new Set(events.map(e => e.conversation_id).filter(Boolean)).size;
    const totalReplies = events.length;
    const humanHandoffs = events.filter(e => e.is_handoff).length;
    const errors = events.filter(e => e.is_error).length;
    
    let totalTimeMs = 0;
    let totalTokens = 0;
    let totalCost = 0;
    const providerUsage: Record<string, number> = {};
    const modelUsage: Record<string, number> = {};
    const languageDistribution: Record<string, number> = {};
    const topQuestionsMap: Record<string, number> = {};
    
    const timeSeriesMap: Record<string, { date: string, replies: number, cost: number, handoffs: number }> = {};
    const aiConversationIds = new Set<string>();

    events.forEach(e => {
      totalTimeMs += e.response_time_ms || 0;
      totalTokens += e.total_tokens || 0;
      totalCost += e.estimated_cost || 0;
      
      if (e.provider) providerUsage[e.provider] = (providerUsage[e.provider] || 0) + 1;
      if (e.model) modelUsage[e.model] = (modelUsage[e.model] || 0) + 1;
      
      // New Analytics
      if (e.language) languageDistribution[e.language] = (languageDistribution[e.language] || 0) + 1;
      if (e.intent_category) topQuestionsMap[e.intent_category] = (topQuestionsMap[e.intent_category] || 0) + 1;
      if (e.conversation_id) aiConversationIds.add(e.conversation_id);
      
      // Time series grouping
      if (e.created_at) {
        const dateStr = new Date(e.created_at).toISOString().split('T')[0]; // YYYY-MM-DD
        if (!timeSeriesMap[dateStr]) {
          timeSeriesMap[dateStr] = { date: dateStr, replies: 0, cost: 0, handoffs: 0 };
        }
        timeSeriesMap[dateStr].replies += 1;
        timeSeriesMap[dateStr].cost += (e.estimated_cost || 0);
        if (e.is_handoff) timeSeriesMap[dateStr].handoffs += 1;
      }
    });

    const avgResponseTime = totalReplies > 0 ? Math.round(totalTimeMs / totalReplies) : 0;
    const avgTokens = totalReplies > 0 ? Math.round(totalTokens / totalReplies) : 0;
    
    const timeSeriesData = Object.values(timeSeriesMap).sort((a, b) => a.date.localeCompare(b.date));
    
    // Sort top questions
    const topQuestions = Object.entries(topQuestionsMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([intent, count]) => ({ intent, count }));

    // Revenue Attribution
    let revenueAttribution = 0;
    if (aiConversationIds.size > 0) {
      const { data: dealsData } = await supabase
        .from('deals')
        .select('value')
        .eq('status', 'won')
        .in('conversation_id', Array.from(aiConversationIds));
        
      if (dealsData) {
        revenueAttribution = dealsData.reduce((sum, deal) => sum + (Number(deal.value) || 0), 0);
      }
    }

    return NextResponse.json({
      metrics: {
        totalConversations,
        totalReplies,
        humanHandoffs,
        errors,
        avgResponseTime,
        avgTokens,
        totalCost,
        providerUsage,
        modelUsage,
        languageDistribution,
        topQuestions,
        revenueAttribution,
        timeSeriesData
      }
    });

  } catch (error: any) {
    console.error('Error in analytics GET:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
