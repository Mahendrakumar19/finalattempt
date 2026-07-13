import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  // Lazy-init inside handler — env vars aren't available at build time on Vercel
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
  try {
    const body = await req.json()
    
    // 1. Find the Platform Admin User (NGTech internal account)
    const { data: adminProfile, error: adminError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('is_platform_admin', true)
      .limit(1)
      .single()
      
    if (adminError || !adminProfile) {
      console.error("Platform Admin not found:", adminError)
      return NextResponse.json({ error: 'System configuration error' }, { status: 500 })
    }

    const adminUserId = adminProfile.user_id

    // 2. Insert Lead into CRM Contacts table
    const { data, error } = await supabase
      .from('contacts')
      .insert({
        user_id: adminUserId, // Assign to NGTech Admin
        name: body.name || null,
        email: body.email || null,
        phone: body.phone || null,
        company: body.company || null,
        industry: body.industry || null,
        monthly_message_volume: body.volume || null,
        
        // UTMs & Tracking
        lead_source: body.leadSource || 'Website',
        landing_page_url: body.landingPageUrl || null,
        utm_source: body.utm_source || null,
        utm_medium: body.utm_medium || null,
        utm_campaign: body.utm_campaign || null,
        utm_term: body.utm_term || null,
        utm_content: body.utm_content || null,
        
        // Let's add a default tag or note if we can't do it here easily, 
        // we'll just rely on the contact record.
      })
      .select()
      .single()

    if (error) {
      console.error("Failed to insert lead:", error)
      return NextResponse.json({ error: 'Failed to capture lead' }, { status: 500 })
    }

    // (Optional) Trigger an email to the sales team here using Resend/SendGrid
    
    return NextResponse.json({ success: true, lead: data }, { status: 201 })
    
  } catch (err: any) {
    console.error("API Error in Lead Capture:", err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
