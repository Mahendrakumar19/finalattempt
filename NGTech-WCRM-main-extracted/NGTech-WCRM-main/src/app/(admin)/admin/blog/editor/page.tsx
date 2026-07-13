'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Save, Upload, 
  Bold, Italic, Underline, Heading1, Heading2, Heading3, 
  List, ListOrdered, Quote, Link as LinkIcon, Sparkles, Paintbrush 
} from 'lucide-react'
import { uploadAccountMedia } from '@/lib/storage/upload-media'

// ─── Markdown-to-HTML parser solution to initialize existing markdown posts ───
function parseMarkdownToHtml(content: string): string {
  if (!content) return ''
  if (/<[a-z][\s\S]*>/i.test(content)) return content

  let html = content
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')
  html = html.replace(/_(.*?)_/g, '<em>$1</em>')
  html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>')
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')

  const lines = html.split('\n')
  const processedLines: string[] = []
  let inList = false
  let inOList = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    if (/^---$/.test(line)) {
      if (inList) { processedLines.push('</ul>'); inList = false }
      if (inOList) { processedLines.push('</ol>'); inOList = false }
      processedLines.push('<hr />')
      continue
    }

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

    if (/^>\s+(.*)$/.test(line)) {
      if (inList) { processedLines.push('</ul>'); inList = false }
      if (inOList) { processedLines.push('</ol>'); inOList = false }
      processedLines.push(`<blockquote>${line.replace(/^>\s+/, '')}</blockquote>`)
      continue
    }

    if (/^[-*]\s+(.*)$/.test(line)) {
      if (inOList) { processedLines.push('</ol>'); inOList = false }
      if (!inList) {
        processedLines.push('<ul>')
        inList = true
      }
      processedLines.push(`<li>${line.replace(/^[-*]\s+/, '')}</li>`)
      continue
    }

    if (/^\d+\.\s+(.*)$/.test(line)) {
      if (inList) { processedLines.push('</ul>'); inList = false }
      if (!inOList) {
        processedLines.push('<ol>')
        inOList = true
      }
      processedLines.push(`<li>${line.replace(/^\d+\.\s+/, '')}</li>`)
      continue
    }

    if (line === '') {
      if (inList) { processedLines.push('</ul>'); inList = false }
      if (inOList) { processedLines.push('</ol>'); inOList = false }
    } else {
      if (inList) { processedLines.push('</ul>'); inList = false }
      if (inOList) { processedLines.push('</ol>'); inOList = false }
      processedLines.push(`<p>${line}</p>`)
    }
  }

  if (inList) processedLines.push('</ul>')
  if (inOList) processedLines.push('</ol>')

  return processedLines.join('\n')
}

// ─── Custom Premium WYSIWYG Editor ───
interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
}

function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const isFirstLoad = useRef(true)

  useEffect(() => {
    if (editorRef.current && isFirstLoad.current && value) {
      editorRef.current.innerHTML = parseMarkdownToHtml(value)
      isFirstLoad.current = false
    }
  }, [value])

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const execCmd = (command: string, val: string = '') => {
    document.execCommand(command, false, val)
    handleInput()
  }

  const insertLink = () => {
    const url = prompt('Enter link URL (e.g., https://example.com):')
    if (url) {
      execCmd('createLink', url)
    }
  }

  const colors = [
    { name: 'Default', value: 'inherit' },
    { name: 'Primary Blue', value: '#3b82f6' },
    { name: 'Emerald Green', value: '#10b981' },
    { name: 'Violet Purple', value: '#8b5cf6' },
    { name: 'Amber Yellow', value: '#f59e0b' },
    { name: 'Rose Red', value: '#f43f5e' }
  ]

  return (
    <div className="rounded-xl border border-border/40 bg-card overflow-hidden shadow-lg transition-all focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/40">
      {/* Premium Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-border/40 bg-muted/20 p-3">
        <button
          type="button"
          onClick={() => execCmd('bold')}
          className="rounded p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => execCmd('italic')}
          className="rounded p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => execCmd('underline')}
          className="rounded p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          title="Underline"
        >
          <Underline className="h-4 w-4" />
        </button>

        <div className="h-5 w-[1px] bg-border/50 mx-1" />

        <button
          type="button"
          onClick={() => execCmd('formatBlock', '<h1>')}
          className="rounded p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => execCmd('formatBlock', '<h2>')}
          className="rounded p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => execCmd('formatBlock', '<h3>')}
          className="rounded p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </button>

        <div className="h-5 w-[1px] bg-border/50 mx-1" />

        <button
          type="button"
          onClick={() => execCmd('insertUnorderedList')}
          className="rounded p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => execCmd('insertOrderedList')}
          className="rounded p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => execCmd('formatBlock', '<blockquote>')}
          className="rounded p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          title="Blockquote"
        >
          <Quote className="h-4 w-4" />
        </button>

        <div className="h-5 w-[1px] bg-border/50 mx-1" />

        <button
          type="button"
          onClick={insertLink}
          className="rounded p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          title="Insert Link"
        >
          <LinkIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => execCmd('removeFormat')}
          className="rounded p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          title="Clear Formatting"
        >
          <Sparkles className="h-4 w-4" />
        </button>

        <div className="h-5 w-[1px] bg-border/50 mx-1" />

        {/* Custom Text Color Picker */}
        <div className="flex items-center gap-1.5 rounded bg-background border border-border/40 px-2 py-1">
          <Paintbrush className="h-3.5 w-3.5 text-muted-foreground" />
          <select
            onChange={(e) => execCmd('foreColor', e.target.value)}
            className="bg-transparent text-xs text-muted-foreground outline-none cursor-pointer border-none"
            title="Text Color"
            defaultValue="inherit"
          >
            {colors.map((c) => (
              <option key={c.value} value={c.value} className="text-foreground bg-card" style={{ color: c.value === 'inherit' ? 'currentColor' : c.value }}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Editor Content Area utilizing the newly configured custom .prose rules */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="prose min-h-[500px] max-h-[700px] overflow-y-auto bg-background/50 p-6 outline-none focus:outline-none dark:prose-invert"
        placeholder="Write your article here..."
      />
    </div>
  )
}

function BlogEditorForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const postId = searchParams.get('id')

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(!!postId)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: 'WhatsApp Marketing',
    author_name: 'Admin',
    cover_image_url: '',
    status: 'draft',
    seo_title: '',
    seo_description: ''
  })

  useEffect(() => {
    if (postId) {
      fetch(`/api/admin/blog`)
        .then(res => res.json())
        .then(data => {
          if (data.posts) {
            const post = data.posts.find((p: any) => p.id === postId)
            if (post) setFormData(post)
          }
        })
        .finally(() => setFetching(false))
    }
  }, [postId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    if (name === 'title' && !formData.slug) {
      setFormData(prev => ({ 
        ...prev, 
        slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') 
      }))
    }
  }

  const handleWysiwygChange = (htmlContent: string) => {
    setFormData(prev => ({ ...prev, content: htmlContent }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)
    try {
      const { publicUrl } = await uploadAccountMedia('chat-media', file)
      setFormData(prev => ({ ...prev, cover_image_url: publicUrl }))
    } catch (err: any) {
      setError(`Upload failed: ${err.message}. Ensure 'chat-media' bucket exists and RLS allows uploads.`)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent, isPublishing: boolean = false) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const finalData = { ...formData, status: isPublishing ? 'published' : formData.status }
    
    try {
      const res = await fetch('/api/admin/blog', {
        method: postId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postId ? { id: postId, ...finalData } : finalData)
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save post')
      
      router.push('/admin/blog')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (fetching) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading post data...</div>

  return (
    <form className="max-w-6xl mx-auto space-y-8 pb-24 px-4 sm:px-6 lg:px-8">
      {/* Header bar with spacious styling */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/blog" className="rounded-xl border border-border/50 bg-background p-2.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-all">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{postId ? 'Edit Post' : 'New Post'}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{formData.status === 'published' ? '🟢 This post is live on the marketing site.' : '⚪ Saved as draft.'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {error && <span className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-1.5 font-medium">{error}</span>}
          <button 
            type="button" 
            onClick={(e) => handleSubmit(e, false)}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-all active:scale-[0.98] cursor-pointer"
          >
            <Save className="h-4 w-4" /> Save Draft
          </button>
          <button 
            type="button" 
            onClick={(e) => handleSubmit(e, true)}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover transition-all shadow-lg shadow-primary/25 active:scale-[0.98] cursor-pointer"
          >
            Publish
          </button>
        </div>
      </div>

      {/* Modern, Spacious 3-Column Grid utilizing empty space efficiently */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Main Content Area: Spans 8 Columns for wide reading view */}
        <div className="lg:col-span-8 space-y-6">
          <div className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-md p-6 space-y-6 shadow-xl shadow-primary/5">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Post Title</label>
              <input 
                name="title" 
                value={formData.title || ''} 
                onChange={handleChange} 
                placeholder="Enter a highly engaging, SEO-rich title..." 
                required
                className="w-full text-2xl sm:text-3xl font-extrabold rounded-xl border border-border/60 bg-background/50 px-5 py-4 text-foreground focus:border-primary focus:ring-1 focus:ring-primary/40 outline-none transition-all" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Content (Rich-Text WYSIWYG Editor)</label>
              <RichTextEditor 
                value={formData.content || ''} 
                onChange={handleWysiwygChange} 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Card Excerpt / Blurb</label>
              <textarea 
                name="excerpt" 
                value={formData.excerpt || ''} 
                onChange={handleChange} 
                placeholder="A compelling, short summary to show on the blog feed grid..." 
                className="w-full h-24 rounded-xl border border-border/60 bg-background/50 px-5 py-4 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary/40 outline-none resize-none transition-all leading-relaxed" 
              />
            </div>
          </div>
        </div>

        {/* Sidebar Settings Area: Spans 4 Columns */}
        <div className="lg:col-span-4 space-y-6">
          {/* Publishing Settings Card */}
          <div className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-md p-6 space-y-4 shadow-xl shadow-primary/5">
            <h3 className="font-bold text-lg text-foreground border-b border-border/40 pb-2">Publishing Settings</h3>
            
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">URL Slug</label>
              <input 
                name="slug" 
                value={formData.slug || ''} 
                onChange={handleChange} 
                className="w-full rounded-xl border border-border/60 bg-background/50 px-4 py-3 text-sm text-foreground focus:border-primary outline-none transition-all" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</label>
              <input 
                name="category" 
                value={formData.category || ''} 
                onChange={handleChange} 
                className="w-full rounded-xl border border-border/60 bg-background/50 px-4 py-3 text-sm text-foreground focus:border-primary outline-none transition-all" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Author Name</label>
              <input 
                name="author_name" 
                value={formData.author_name || ''} 
                onChange={handleChange} 
                className="w-full rounded-xl border border-border/60 bg-background/50 px-4 py-3 text-sm text-foreground focus:border-primary outline-none transition-all" 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cover Image</label>
              <div className="flex gap-2">
                <input 
                  name="cover_image_url" 
                  value={formData.cover_image_url || ''} 
                  onChange={handleChange} 
                  placeholder="https://..."
                  className="flex-1 rounded-xl border border-border/60 bg-background/50 px-4 py-3 text-sm text-foreground focus:border-primary outline-none transition-all" 
                />
                <label className={`flex cursor-pointer items-center justify-center rounded-xl border border-border/60 bg-muted px-4 transition-colors hover:bg-muted/80 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </label>
              </div>
              {uploading && <p className="text-xs text-primary animate-pulse">Uploading image...</p>}
              {formData.cover_image_url && (
                <div className="relative mt-3 rounded-xl overflow-hidden border border-border/60 aspect-video group">
                  <img src={formData.cover_image_url} alt="Cover Preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
              )}
            </div>
          </div>

          {/* SEO Meta Data Card */}
          <div className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-md p-6 space-y-4 shadow-xl shadow-primary/5">
            <h3 className="font-bold text-lg text-foreground border-b border-border/40 pb-2">SEO Optimization</h3>
            
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Meta Title</label>
              <input 
                name="seo_title" 
                value={formData.seo_title || ''} 
                onChange={handleChange} 
                placeholder="Title search engines display..."
                className="w-full rounded-xl border border-border/60 bg-background/50 px-4 py-3 text-sm text-foreground focus:border-primary outline-none transition-all" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Meta Description</label>
              <textarea 
                name="seo_description" 
                value={formData.seo_description || ''} 
                onChange={handleChange} 
                placeholder="Brief summary search engines list in results..."
                className="w-full h-24 rounded-xl border border-border/60 bg-background/50 px-4 py-3 text-sm text-foreground focus:border-primary outline-none resize-none transition-all leading-relaxed" 
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}

export default function BlogEditorPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading editor...</div>}>
      <BlogEditorForm />
    </Suspense>
  )
}
