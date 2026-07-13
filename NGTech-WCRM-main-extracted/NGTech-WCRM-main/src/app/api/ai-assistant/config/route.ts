import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('account_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!profile?.account_id) {
      return NextResponse.json(
        { error: 'Profile not found or no account linked' },
        { status: 404 }
      )
    }

    const { data: config, error: configError } = await supabase
      .from('ai_assistant_settings')
      .select('*')
      .eq('account_id', profile.account_id)
      .maybeSingle()

    if (configError) {
      console.error('Error fetching ai_assistant_settings:', configError)
      return NextResponse.json(
        { error: 'Failed to fetch AI configuration' },
        { status: 500 }
      )
    }

    return NextResponse.json({ config: config || null })
  } catch (error) {
    console.error('Error in AI config GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('account_id')
      .eq('user_id', user.id)
      .single()

    if (!profile?.account_id) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      enabled,
      provider,
      model,
      system_prompt,
      knowledge_base,
      personality,
      allowed_topics,
      restricted_topics,
      human_handoff_rules,
      respect_business_hours,
      advanced_settings,
      knowledge_base_structured,
      ai_rules,
      handoff_rules
    } = body

    const updateFields: Record<string, any> = {
      updated_at: new Date().toISOString()
    }

    if (enabled !== undefined) updateFields.enabled = enabled
    if (provider !== undefined) updateFields.provider = provider
    if (model !== undefined) updateFields.model = model
    if (system_prompt !== undefined) updateFields.system_prompt = system_prompt
    if (knowledge_base !== undefined) updateFields.knowledge_base = knowledge_base
    if (personality !== undefined) updateFields.personality = personality
    if (allowed_topics !== undefined) updateFields.allowed_topics = allowed_topics
    if (restricted_topics !== undefined) updateFields.restricted_topics = restricted_topics
    if (human_handoff_rules !== undefined) updateFields.human_handoff_rules = human_handoff_rules
    if (respect_business_hours !== undefined) updateFields.respect_business_hours = respect_business_hours
    if (advanced_settings !== undefined) updateFields.advanced_settings = advanced_settings
    if (knowledge_base_structured !== undefined) updateFields.knowledge_base_structured = knowledge_base_structured
    if (ai_rules !== undefined) updateFields.ai_rules = ai_rules
    if (handoff_rules !== undefined) updateFields.handoff_rules = handoff_rules

    // Upsert the row since it might not exist if they never enabled AI
    const { data: config, error: configError } = await supabase
      .from('ai_assistant_settings')
      .upsert({
        account_id: profile.account_id,
        ...updateFields
      }, { onConflict: 'account_id' })
      .select()
      .single()

    if (configError) {
      console.error('Error updating AI config:', configError)
      return NextResponse.json(
        { error: 'Failed to update AI settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({ config })
  } catch (error) {
    console.error('Error in AI config PATCH:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
