import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const meetingId = params.id
    if (!meetingId) {
      return NextResponse.json({ error: 'Missing meeting ID' }, { status: 400 })
    }

    const body = await request.json()
    const { notes } = body

    if (notes === undefined) {
      return NextResponse.json({ error: 'Notes content is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('meetings')
      .update({ notes })
      .eq('id', meetingId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, meeting: data })
  } catch (error: any) {
    console.error('Error updating meeting notes:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
