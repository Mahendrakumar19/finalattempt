import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET all blog posts (Admin view)
export async function GET() {
  try {
    const supabase = await createClient()

    // 1. Verify Platform Admin
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_platform_admin')
      .eq('user_id', user.id)
      .single()

    if (!profile?.is_platform_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // 2. Fetch posts
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ posts })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

// POST new blog post
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { title, slug, excerpt, content, category, author_name, cover_image_url, status, seo_title, seo_description } = body

    const { data, error } = await supabase.from('blog_posts').insert([{
      title,
      slug,
      excerpt,
      content,
      category,
      author_name,
      cover_image_url,
      status,
      seo_title,
      seo_description,
      published_at: status === 'published' ? new Date().toISOString() : null
    }]).select().single()

    if (error) throw error
    return NextResponse.json({ post: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

// PUT (update) blog post
export async function PUT(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { id, title, slug, excerpt, content, category, author_name, cover_image_url, status, seo_title, seo_description } = body

    if (!id) return NextResponse.json({ error: 'Post ID is required' }, { status: 400 })

    const updateData: any = {
      title, slug, excerpt, content, category, author_name, cover_image_url, status, seo_title, seo_description,
      updated_at: new Date().toISOString()
    }
    
    // Auto-set published_at if publishing for the first time
    if (status === 'published') {
      const { data: existing } = await supabase.from('blog_posts').select('published_at').eq('id', id).single()
      if (!existing?.published_at) {
        updateData.published_at = new Date().toISOString()
      }
    }

    const { data, error } = await supabase.from('blog_posts').update(updateData).eq('id', id).select().single()

    if (error) throw error
    return NextResponse.json({ post: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

// DELETE blog post
export async function DELETE(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'Post ID is required' }, { status: 400 })

    const { error } = await supabase.from('blog_posts').delete().eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
