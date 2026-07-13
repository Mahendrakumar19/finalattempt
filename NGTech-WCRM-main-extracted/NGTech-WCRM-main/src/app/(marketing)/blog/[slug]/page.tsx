import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Calendar, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Metadata } from 'next'

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: post } = await supabase
    .from('blog_posts')
    .select('title, seo_title, seo_description, excerpt')
    .eq('slug', slug)
    .single()

  if (!post) {
    return { title: 'Post Not Found | NGTech WCRM' }
  }

  return {
    title: post.seo_title || `${post.title} | NGTech WCRM`,
    description: post.seo_description || post.excerpt,
  }
}

// Helper to assign consistent gradient colors based on category/index
const getGradient = (index: number) => {
  const gradients = [
    'from-blue-500/20 to-blue-500/5',
    'from-emerald-500/20 to-emerald-500/5',
    'from-violet-500/20 to-violet-500/5',
    'from-amber-500/20 to-amber-500/5',
    'from-rose-500/20 to-rose-500/5',
    'from-primary/20 to-primary/5',
  ]
  return gradients[index % gradients.length]
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()
  
  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!post) {
    notFound()
  }

  const { data: relatedPosts } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, cover_image_url, category, published_at, author_name')
    .eq('status', 'published')
    .eq('category', post.category)
    .neq('id', post.id)
    .order('published_at', { ascending: false })
    .limit(3)

  return (
    <article className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="pt-24 pb-12 lg:pt-32 lg:pb-16 bg-card border-b border-border">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6">
          <Link href="/blog" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Blog
          </Link>
          
          <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              {post.category}
            </span>
            <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {new Date(post.published_at).toLocaleDateString()}</span>
            <span className="flex items-center gap-1.5"><User className="h-4 w-4" /> {post.author_name}</span>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-extrabold text-foreground leading-tight mb-6">
            {post.title}
          </h1>
          
          {post.excerpt && (
            <p className="text-xl text-muted-foreground leading-relaxed">
              {post.excerpt}
            </p>
          )}
        </div>
      </header>

      {/* Cover Image */}
      {post.cover_image_url && (
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 -mt-8 relative z-10">
          <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl border border-border bg-muted">
            <img 
              src={post.cover_image_url} 
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className={`container mx-auto max-w-3xl px-4 sm:px-6 ${post.cover_image_url ? 'pt-16' : 'pt-12'}`}>
        <div className="prose prose-lg dark:prose-invert max-w-none">
          {/* Automatically parses Markdown to HTML, or leaves existing HTML intact */}
          <div dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(post.content) }} />
        </div>
        
        <hr className="my-12 border-border" />
        
        {/* CTA */}
        <div className="rounded-2xl bg-primary/5 border border-primary/20 p-8 text-center mb-16">
          <h3 className="text-2xl font-bold text-foreground mb-4">Ready to automate your business?</h3>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">Join thousands of businesses using NGTech WCRM to scale their sales and support on WhatsApp.</p>
          <Link href="/free-trial" className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 font-semibold text-primary-foreground hover:bg-primary-hover transition-colors">
            Start Your Free Trial
          </Link>
        </div>
      </div>
      
      {/* Related Posts */}
      {relatedPosts && relatedPosts.length > 0 && (
        <section className="border-t border-border bg-muted/20 py-16">
          <div className="container mx-auto max-w-5xl px-4 sm:px-6">
            <h2 className="text-2xl font-bold text-foreground mb-8">Related Articles</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              {relatedPosts.map((rPost, i) => (
                <Link key={rPost.id} href={`/blog/${rPost.slug}`} className="group flex flex-col rounded-xl border border-border bg-card overflow-hidden hover:shadow-md hover:shadow-primary/5 transition-all hover:-translate-y-1">
                  <div className={`aspect-[4/3] ${rPost.cover_image_url ? 'bg-muted' : `bg-gradient-to-tr ${getGradient(i+1)}`} relative flex items-center justify-center`}>
                    {rPost.cover_image_url ? (
                      <img src={rPost.cover_image_url} alt={rPost.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="bg-background/80 backdrop-blur-md border border-border rounded-md p-2 text-center shadow-sm transform transition-transform duration-500 group-hover:scale-105">
                        <span className="text-primary font-bold text-[10px] uppercase tracking-wider">{rPost.category}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                      <span>{new Date(rPost.published_at).toLocaleDateString()}</span>
                    </div>
                    
                    <h3 className="text-base font-bold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {rPost.title}
                    </h3>
                    
                    <p className="text-muted-foreground text-xs mb-4 line-clamp-2 flex-1">
                      {rPost.excerpt}
                    </p>
                    
                    <div className="mt-auto pt-3 border-t border-border flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground">{rPost.author_name}</span>
                      <span className="text-primary"><ArrowRight className="h-3 w-3" /></span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </article>
  )
}

// ─── Markdown-to-HTML parser solution for CMS and dynamic posts ───
function parseMarkdownToHtml(content: string): string {
  if (!content) return ''

  // If content contains standard HTML tags, treat it as HTML and skip parsing
  if (/<[a-z][\s\S]*>/i.test(content)) {
    return content
  }

  // Pre-process line breaks and double returns into paragraphs
  let html = content

  // Convert Bold markdown (**text**)
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

  // Convert Italic markdown (*text* or _text_)
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')
  html = html.replace(/_(.*?)_/g, '<em>$1</em>')

  // Convert inline code (`code`)
  html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>')

  // Convert markdown links [text](url)
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')

  // Split lines to handle structural blocks (headings, lists, blockquotes, paragraphs)
  const lines = html.split('\n')
  const processedLines: string[] = []
  let inList = false
  let inOList = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // 1. Horizontal Rule (---)
    if (/^---$/.test(line)) {
      if (inList) { processedLines.push('</ul>'); inList = false }
      if (inOList) { processedLines.push('</ol>'); inOList = false }
      processedLines.push('<hr />')
      continue
    }

    // 2. Headings (# h1, ## h2, ### h3)
    if (/^#\s+(.*)$/.test(line)) {
      if (inList) { processedLines.push('</ul>'); inList = false }
      if (inOList) { processedLines.push('</ol>'); inOList = false }
      processedLines.push(`<h1>${line.replace(/^#\s+/, '')}</h1>`)
      continue
    }
    if (/^##\s+(.*)$/.test(line)) {
      if (inList) { processedLines.push('</ul>'); inList = false }
      if (inOList) { processedLines.push('</ol>'); inOList = false }
      processedLines.push(`<h2>${line.replace(/^##\s+/, '')}</h2>`)
      continue
    }
    if (/^###\s+(.*)$/.test(line)) {
      if (inList) { processedLines.push('</ul>'); inList = false }
      if (inOList) { processedLines.push('</ol>'); inOList = false }
      processedLines.push(`<h3>${line.replace(/^###\s+/, '')}</h3>`)
      continue
    }

    // 3. Blockquotes (> citation)
    if (/^>\s+(.*)$/.test(line)) {
      if (inList) { processedLines.push('</ul>'); inList = false }
      if (inOList) { processedLines.push('</ol>'); inOList = false }
      processedLines.push(`<blockquote>${line.replace(/^>\s+/, '')}</blockquote>`)
      continue
    }

    // 4. Unordered Lists (- item or * item)
    if (/^[-*]\s+(.*)$/.test(line)) {
      if (inOList) { processedLines.push('</ol>'); inOList = false }
      if (!inList) {
        processedLines.push('<ul>')
        inList = true
      }
      processedLines.push(`<li>${line.replace(/^[-*]\s+/, '')}</li>`)
      continue
    }

    // 5. Ordered Lists (1. item)
    if (/^\d+\.\s+(.*)$/.test(line)) {
      if (inList) { processedLines.push('</ul>'); inList = false }
      if (!inOList) {
        processedLines.push('<ol>')
        inOList = true
      }
      processedLines.push(`<li>${line.replace(/^\d+\.\s+/, '')}</li>`)
      continue
    }

    // 6. Paragraphs and blank lines
    if (line === '') {
      if (inList) { processedLines.push('</ul>'); inList = false }
      if (inOList) { processedLines.push('</ol>'); inOList = false }
    } else {
      if (inList) { processedLines.push('</ul>'); inList = false }
      if (inOList) { processedLines.push('</ol>'); inOList = false }
      processedLines.push(`<p>${line}</p>`)
    }
  }

  // Close lists if they remain open at EOF
  if (inList) processedLines.push('</ul>')
  if (inOList) processedLines.push('</ol>')

  return processedLines.join('\n')
}
