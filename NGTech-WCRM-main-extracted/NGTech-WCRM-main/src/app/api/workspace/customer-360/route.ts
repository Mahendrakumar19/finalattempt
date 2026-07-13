import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get('contactId');

    if (!contactId) {
      return NextResponse.json({ error: 'contactId is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the account ID for the current user
    const { data: profile } = await supabase
      .from('profiles')
      .select('account_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.account_id) {
      return NextResponse.json({ error: 'No account associated with user' }, { status: 403 });
    }

    // Fetch the 360 data concurrently
    const [
      { data: contact },
      { data: deals },
      { data: quotes },
      { data: orders },
      { data: invoices },
      { data: tickets },
      { data: tasks },
      { data: projects },
      { data: appointments },
      { data: activities }
    ] = await Promise.all([
      supabase.from('contacts').select('*').eq('id', contactId).eq('account_id', profile.account_id).single(),
      supabase.from('deals').select('*').eq('contact_id', contactId).order('created_at', { ascending: false }),
      supabase.from('quotes').select('*').eq('contact_id', contactId).order('created_at', { ascending: false }),
      supabase.from('customer_orders').select('*').eq('contact_id', contactId).order('created_at', { ascending: false }),
      supabase.from('customer_invoices').select('*').eq('contact_id', contactId).order('created_at', { ascending: false }),
      supabase.from('support_tickets').select('*').eq('contact_id', contactId).order('created_at', { ascending: false }),
      supabase.from('tasks').select('*').eq('contact_id', contactId).order('created_at', { ascending: false }),
      supabase.from('customer_projects').select('*').eq('contact_id', contactId).order('created_at', { ascending: false }),
      supabase.from('appointments').select('*').eq('contact_id', contactId).order('scheduled_at', { ascending: false }),
      supabase.from('customer_activities').select('*').eq('contact_id', contactId).order('created_at', { ascending: false })
    ]);

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    return NextResponse.json({
      contact,
      deals: deals || [],
      quotes: quotes || [],
      orders: orders || [],
      invoices: invoices || [],
      tickets: tickets || [],
      tasks: tasks || [],
      projects: projects || [],
      appointments: appointments || [],
      activities: activities || [],
    });

  } catch (error) {
    console.error('Customer 360 API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
