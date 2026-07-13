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
    const { contact_id, conversation_id, description, amount, currency = 'USD', valid_until, deal_id } = body

    if (!contact_id || !description || amount === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    let finalDealId = deal_id === 'auto' ? null : deal_id;

    // Smart Auto-Link / Auto-Create Logic
    if (deal_id === 'auto' || !deal_id) {
      const { data: activeDeals } = await supabase
        .from('deals')
        .select('id, value')
        .eq('contact_id', contact_id)
        .neq('status', 'won')
        .neq('status', 'lost')
        .order('updated_at', { ascending: false });

      if (activeDeals && activeDeals.length > 0) {
        // Auto-Link to the most recent active deal
        finalDealId = activeDeals[0].id;
        
        // Update deal value
        await supabase
          .from('deals')
          .update({ value: Number(activeDeals[0].value || 0) + Number(amount) })
          .eq('id', finalDealId);
          
      } else {
        // Auto-Create a new deal
        const { data: pipelines } = await supabase
          .from('pipelines')
          .select('id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
          .limit(1);

        if (pipelines && pipelines.length > 0) {
          const { data: stages } = await supabase
            .from('pipeline_stages')
            .select('id')
            .eq('pipeline_id', pipelines[0].id)
            .order('position', { ascending: true })
            .limit(1);

          if (stages && stages.length > 0) {
            const { data: newDeal } = await supabase
              .from('deals')
              .insert({
                user_id: user.id,
                pipeline_id: pipelines[0].id,
                stage_id: stages[0].id,
                contact_id: contact_id,
                conversation_id: conversation_id || null,
                title: `Quote: ${description}`,
                value: amount,
                currency: currency,
                status: 'active'
              })
              .select('id')
              .single();

            if (newDeal) {
              finalDealId = newDeal.id;
            }
          }
        }
      }
    } else if (finalDealId && finalDealId !== 'none') {
       // Manual override: update the selected deal's value
       const { data: currentDeal } = await supabase.from('deals').select('value').eq('id', finalDealId).single();
       if (currentDeal) {
         await supabase.from('deals').update({ value: Number(currentDeal.value || 0) + Number(amount) }).eq('id', finalDealId);
       }
    }

    if (finalDealId === 'none') finalDealId = null;

    // 1. Insert Quote into Database
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .insert({
        user_id: user.id,
        contact_id,
        deal_id: finalDealId,
        description,
        amount,
        currency,
        valid_until,
        status: 'pending'
      })
      .select()
      .single()

    if (quoteError) throw quoteError

    // 2. Generate WhatsApp formatted message
    const formattedDate = valid_until 
      ? new Date(valid_until).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }) 
      : 'No Expiry'
      
    const amountFormatted = new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency 
    }).format(amount)

    const messageText = `🧾 *OFFICIAL QUOTE* 🧾\n━━━━━━━━━━━━━━━━━━━━━━\n🔹 *Service:* ${description}\n💰 *Total Amount:* ${amountFormatted}\n⏳ *Valid Until:* ${formattedDate}\n━━━━━━━━━━━━━━━━━━━━━━\n✅ _Please reply with *"ACCEPT"* to proceed with this quote._`

    // 3. Send WhatsApp Message (internal call to our send endpoint)
    // Note: In a real app we'd construct a full fetch to our own absolute URL, or import the send logic directly.
    // For simplicity, we just return the formatted message and let the client hit the `/api/whatsapp/send` endpoint.

    return NextResponse.json({ success: true, quote, messageText })
  } catch (error: any) {
    console.error('Error creating quote:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
