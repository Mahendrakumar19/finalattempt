import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const contactId = searchParams.get('contact_id')

    let query = supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (contactId) {
      query = query.eq('contact_id', contactId)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ tasks: data })
  } catch (error: any) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, contact_id, due_date } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    
    // Fetch account_id for RLS and data isolation
    const { data: profile } = await supabase
      .from('profiles')
      .select('account_id')
      .eq('user_id', user.id)
      .single()
      
    if (!profile?.account_id) {
      return NextResponse.json({ error: 'No account linked' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        account_id: profile.account_id,
        contact_id,
        title,
        description,
        due_date,
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, task: data })
  } catch (error: any) {
    console.error('Error creating task:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { task_id, status } = body

    if (!task_id || !status) {
      return NextResponse.json({ error: 'task_id and status are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('tasks')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', task_id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, task: data })
  } catch (error: any) {
    console.error('Error updating task:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
