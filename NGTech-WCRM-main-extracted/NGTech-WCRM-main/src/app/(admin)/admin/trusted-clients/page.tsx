'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Edit2, Trash2, Check, X, Loader2 } from 'lucide-react'

interface TrustedClient {
  id: string
  name: string
  url: string | null
  is_active: boolean
  order_index: number
  testimonial_text: string | null
  author_name: string | null
  author_role: string | null
}

export default function TrustedClientsPage() {
  const [clients, setClients] = useState<TrustedClient[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Form State
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [orderIndex, setOrderIndex] = useState(0)
  const [testimonial, setTestimonial] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [authorRole, setAuthorRole] = useState('')
  
  const supabase = createClient()

  useEffect(() => {
    fetchClients()
  }, [])

  async function fetchClients() {
    setLoading(true)
    const { data, error } = await supabase
      .from('saas_trusted_clients')
      .select('*')
      .order('order_index', { ascending: true })
      
    if (data) {
      setClients(data)
    }
    setLoading(false)
  }

  function startEdit(c: TrustedClient) {
    setEditingId(c.id)
    setName(c.name)
    setUrl(c.url || '')
    setOrderIndex(c.order_index)
    setTestimonial(c.testimonial_text || '')
    setAuthorName(c.author_name || '')
    setAuthorRole(c.author_role || '')
  }

  function cancelEdit() {
    setEditingId(null)
    setName('')
    setUrl('')
    setOrderIndex(0)
    setTestimonial('')
    setAuthorName('')
    setAuthorRole('')
  }

  async function handleSave() {
    if (!name.trim()) return

    const payload = {
      name, 
      url: url || null, 
      order_index: orderIndex,
      testimonial_text: testimonial || null,
      author_name: authorName || null,
      author_role: authorRole || null
    }

    if (editingId) {
      const { error } = await supabase
        .from('saas_trusted_clients')
        .update(payload)
        .eq('id', editingId)
        
      if (!error) {
        cancelEdit()
        fetchClients()
      }
    } else {
      const { error } = await supabase
        .from('saas_trusted_clients')
        .insert([payload])
        
      if (!error) {
        cancelEdit()
        fetchClients()
      }
    }
  }

  async function toggleActive(id: string, currentStatus: boolean) {
    await supabase
      .from('saas_trusted_clients')
      .update({ is_active: !currentStatus })
      .eq('id', id)
    fetchClients()
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this trusted client?')) return
    await supabase.from('saas_trusted_clients').delete().eq('id', id)
    fetchClients()
  }

  return (
    <div className="flex-1 space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Trusted Clients</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage the "Trusted By" logos/names on the global marketing landing page.
        </p>
      </div>

      <div className="border border-border rounded-lg bg-card overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/20">
          <h2 className="text-lg font-semibold">{editingId ? 'Edit Client' : 'Add New Client'}</h2>
          <div className="mt-4 flex flex-col gap-4">
            <div className="flex gap-4 flex-wrap sm:flex-nowrap items-end">
              <div className="w-full sm:w-1/3">
                <label className="text-xs font-medium mb-1 block">Company Name *</label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Acme Corp" />
              </div>
              <div className="w-full sm:w-1/3">
                <label className="text-xs font-medium mb-1 block">Website URL (Optional)</label>
                <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://acme.com" />
              </div>
              <div className="w-24 shrink-0">
                <label className="text-xs font-medium mb-1 block">Order</label>
                <Input type="number" value={orderIndex} onChange={e => setOrderIndex(Number(e.target.value))} />
              </div>
            </div>

            <div className="bg-background rounded p-3 border border-border">
              <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Testimonial Data (Optional)</h3>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block">Testimonial Quote</label>
                  <textarea 
                    value={testimonial} 
                    onChange={e => setTestimonial(e.target.value)} 
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="We increased our sales by 50% using NGTech WCRM!"
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-xs font-medium mb-1 block">Author Name</label>
                    <Input value={authorName} onChange={e => setAuthorName(e.target.value)} placeholder="Jane Doe" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-medium mb-1 block">Author Role</label>
                    <Input value={authorRole} onChange={e => setAuthorRole(e.target.value)} placeholder="CEO, Acme Corp" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <Button onClick={handleSave} disabled={!name.trim()}>
                {editingId ? <Check className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                {editingId ? 'Save Client' : 'Add Client'}
              </Button>
              {editingId && (
                <Button variant="outline" onClick={cancelEdit}>
                  <X className="h-4 w-4 mr-2" /> Cancel
                </Button>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 flex justify-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : clients.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No trusted clients configured yet. Add one above.
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-medium">Order</th>
                <th className="px-6 py-3 font-medium">Client Name</th>
                <th className="px-6 py-3 font-medium">Website Link</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {clients.map((c) => (
                <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4">{c.order_index}</td>
                  <td className="px-6 py-4 font-medium text-foreground">{c.name}</td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {c.url ? (
                      <a href={c.url} target="_blank" rel="noreferrer" className="hover:underline text-primary">
                        {c.url}
                      </a>
                    ) : (
                      <span className="italic">No Link</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span 
                      onClick={() => toggleActive(c.id, c.is_active)}
                      className={`cursor-pointer inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                        c.is_active 
                          ? 'bg-green-500/10 text-green-500 ring-green-500/20' 
                          : 'bg-red-500/10 text-red-500 ring-red-500/20'
                      }`}
                    >
                      {c.is_active ? 'Active' : 'Hidden'}
                    </span>
                    {c.testimonial_text && (
                      <span className="ml-2 inline-flex items-center rounded-full px-2 py-1 text-[10px] font-medium bg-blue-500/10 text-blue-500 ring-1 ring-inset ring-blue-500/20">
                        Has Testimonial
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => startEdit(c)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
