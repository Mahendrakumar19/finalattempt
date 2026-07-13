import Link from 'next/link'
import { ArrowRight, Calendar, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: "Blog | NGTech WCRM",
  description: "Insights, guides, and best practices for WhatsApp marketing, sales automation, and customer support.",
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

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function BlogIndexPage({ searchParams }: PageProps) {
  const { category: activeCategory } = await searchParams
  const supabase = await createClient()
  
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  let allPosts = posts || []
  
  // Extract unique categories
  const categories = Array.from(new Set(allPosts.map(p => p.category).filter(Boolean)))
  
  // Filter by category if selected
  if (activeCategory && typeof activeCategory === 'string') {
    allPosts = allPosts.filter(p => p.category === activeCategory)
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header Section */}
      <section className="pt-24 pb-16 bg-card border-b border-border">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-6">
            The <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">NGTech WCRM Blog</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Actionable strategies, expert insights, and product updates to help you win on WhatsApp.
          </p>
        </div>
      </section>

      {/* All Posts Grid */}
      <section className="py-16 bg-muted/20 border-t border-border flex-1">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <h2 className="text-2xl font-bold text-foreground">
              {activeCategory ? `${activeCategory} Articles` : 'All Articles'}
            </h2>
            <div className="flex flex-wrap gap-2">
              <Link 
                href="/blog" 
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  !activeCategory ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-foreground hover:bg-muted'
                }`}
              >
                All
              </Link>
              {categories.map((cat) => (
                <Link 
                  key={cat}
                  href={`/blog?category=${encodeURIComponent(cat)}`} 
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-foreground hover:bg-muted'
                  }`}
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>
          
          {allPosts.length === 0 ? (
            <div className="text-center py-24 text-muted-foreground">
              No articles found in this category.
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {allPosts.map((post, i) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group flex flex-col rounded-xl border border-border bg-card overflow-hidden hover:shadow-md hover:shadow-primary/5 transition-all hover:-translate-y-1">
                <div className={`aspect-[4/3] ${post.cover_image_url ? 'bg-muted' : `bg-gradient-to-tr ${getGradient(i+1)}`} relative flex items-center justify-center`}>
                  {post.cover_image_url ? (
                    <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="bg-background/80 backdrop-blur-md border border-border rounded-md p-2 text-center shadow-sm transform transition-transform duration-500 group-hover:scale-105">
                      <span className="text-primary font-bold text-[10px] uppercase tracking-wider">{post.category}</span>
                    </div>
                  )}
                </div>
                
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                    <span>{new Date(post.published_at).toLocaleDateString()}</span>
                  </div>
                  
                  <h3 className="text-base font-bold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  
                  <p className="text-muted-foreground text-xs mb-4 line-clamp-2 flex-1">
                    {post.excerpt}
                  </p>
                  
                  <div className="mt-auto pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground">{post.author_name}</span>
                    <span className="text-primary"><ArrowRight className="h-3 w-3" /></span>
                  </div>
                </div>
              </Link>
              ))}
            </div>
            
            <div className="mt-16 text-center">
              <button className="inline-flex h-12 items-center justify-center rounded-lg border border-border bg-card px-8 font-semibold text-foreground transition-all hover:bg-muted">
                Load More Articles
              </button>
            </div>
          </>
          )}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-24 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
        <div className="container mx-auto max-w-4xl px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">Subscribe to our newsletter</h2>
          <p className="text-primary-foreground/80 text-lg mb-10 max-w-2xl mx-auto">
            Get the latest WhatsApp marketing strategies and product updates delivered straight to your inbox once a week.
          </p>
          
          <form className="flex flex-col sm:flex-row max-w-md mx-auto gap-3" action="/api/newsletter" method="POST">
            <input 
              type="email" 
              name="email"
              placeholder="Enter your work email" 
              required
              className="flex-1 rounded-lg border-0 bg-background px-4 py-3 text-foreground focus:ring-2 focus:ring-primary-foreground focus:outline-none"
            />
            <button type="submit" className="rounded-lg bg-foreground px-6 py-3 font-semibold text-background transition-colors hover:bg-foreground/90">
              Subscribe
            </button>
          </form>
          <p className="text-xs text-primary-foreground/60 mt-4">We care about your data. See our Privacy Policy.</p>
        </div>
      </section>
    </div>
  )
}
