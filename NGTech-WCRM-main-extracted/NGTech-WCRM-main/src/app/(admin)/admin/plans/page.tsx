'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Check, X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export interface PricingPlan {
  id: string
  slug: string
  name: string
  description: string
  monthly_price: number
  annual_price: number
  discount_percent: number
  max_contacts: number
  max_messages_pm: number
  is_active: boolean
  sort_order: number
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<PricingPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const supabase = createClient()

  // Form State
  const [slug, setSlug] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [monthlyPrice, setMonthlyPrice] = useState(0)
  const [annualPrice, setAnnualPrice] = useState(0)
  const [discountPercent, setDiscountPercent] = useState(0)
  const [maxContacts, setMaxContacts] = useState(0)
  const [maxMessagesPm, setMaxMessagesPm] = useState(0)
  const [isActive, setIsActive] = useState(true)
  const [sortOrder, setSortOrder] = useState(0)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchPlans()
  }, [])

  async function fetchPlans() {
    setLoading(true)
    const { data, error } = await supabase
      .from('saas_pricing_plans')
      .select('*')
      .order('sort_order', { ascending: true })

    if (data && !error) {
      setPlans(data)
    }
    setLoading(false)
  }

  function startEdit(p: PricingPlan) {
    setEditingId(p.id)
    setShowAddForm(false)
    setSlug(p.slug)
    setName(p.name)
    setDescription(p.description || '')
    setMonthlyPrice(p.monthly_price)
    setAnnualPrice(p.annual_price)
    setDiscountPercent(p.discount_percent)
    setMaxContacts(p.max_contacts)
    setMaxMessagesPm(p.max_messages_pm)
    setIsActive(p.is_active)
    setSortOrder(p.sort_order)
  }

  function startAdd() {
    setEditingId(null)
    setShowAddForm(true)
    setSlug('')
    setName('')
    setDescription('')
    setMonthlyPrice(0)
    setAnnualPrice(0)
    setDiscountPercent(0)
    setMaxContacts(1000)
    setMaxMessagesPm(1000)
    setIsActive(true)
    setSortOrder(plans.length + 1)
  }

  function cancelEdit() {
    setEditingId(null)
    setShowAddForm(false)
  }

  async function handleSave() {
    if (!name || !slug) return
    setSaving(true)

    const payload = {
      slug,
      name,
      description,
      monthly_price: monthlyPrice,
      annual_price: annualPrice,
      discount_percent: discountPercent,
      max_contacts: maxContacts,
      max_messages_pm: maxMessagesPm,
      is_active: isActive,
      sort_order: sortOrder
    }

    if (editingId) {
      const { error } = await supabase.from('saas_pricing_plans').update(payload).eq('id', editingId)
      if (!error) {
        cancelEdit()
        await fetchPlans()
      } else {
        alert("Failed to update plan.")
      }
    } else {
      const { error } = await supabase.from('saas_pricing_plans').insert([payload])
      if (!error) {
        cancelEdit()
        await fetchPlans()
      } else {
        alert("Failed to create plan. Ensure slug is unique.")
      }
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (confirm('Are you sure you want to delete this plan?')) {
      await supabase.from('saas_pricing_plans').delete().eq('id', id)
      fetchPlans()
    }
  }

  async function toggleStatus(p: PricingPlan) {
    await supabase.from('saas_pricing_plans').update({ is_active: !p.is_active }).eq('id', p.id)
    fetchPlans()
  }

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pricing Plans</h1>
          <p className="text-sm text-muted-foreground">Manage SaaS pricing, discounts, and limits.</p>
        </div>
        {!showAddForm && !editingId && (
          <Button onClick={startAdd} className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="h-4 w-4" />
            Add Plan
          </Button>
        )}
      </div>

      {(showAddForm || editingId) && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm mb-6">
          <h3 className="font-semibold text-lg mb-4">{editingId ? 'Edit Plan' : 'Add New Plan'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Plan Name</label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Pro" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Slug (Unique identifier)</label>
              <Input value={slug} onChange={e => setSlug(e.target.value.toLowerCase())} placeholder="e.g. pro" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Sort Order</label>
              <Input type="number" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} />
            </div>
            
            <div className="md:col-span-2 lg:col-span-3">
              <label className="text-xs font-medium text-muted-foreground">Short Description</label>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. For growing teams" />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Monthly Price (₹/cents)</label>
              <Input type="number" value={monthlyPrice} onChange={e => setMonthlyPrice(Number(e.target.value))} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Annual Price (₹/cents)</label>
              <Input type="number" value={annualPrice} onChange={e => setAnnualPrice(Number(e.target.value))} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground text-primary">Discount / Offer %</label>
              <Input type="number" value={discountPercent} onChange={e => setDiscountPercent(Number(e.target.value))} />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Max Contacts (-1 for unlimited)</label>
              <Input type="number" value={maxContacts} onChange={e => setMaxContacts(Number(e.target.value))} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Max Messages/Mo (-1 for unlimited)</label>
              <Input type="number" value={maxMessagesPm} onChange={e => setMaxMessagesPm(Number(e.target.value))} />
            </div>
            
            <div className="flex items-center gap-2 mt-6">
              <input type="checkbox" id="isActive" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="rounded border-border" />
              <label htmlFor="isActive" className="text-sm font-medium">Plan is Active</label>
            </div>
          </div>
          
          <div className="mt-6 flex gap-3 justify-end">
            <Button variant="outline" onClick={cancelEdit}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="min-w-[100px]">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Plan'}
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Plan Details</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Pricing</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Discount</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Limits (C / M)</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-6 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {plans.map((plan) => (
                <tr key={plan.id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-foreground flex items-center gap-2">
                      {plan.name} <span className="text-[10px] bg-muted px-2 py-0.5 rounded-md font-mono text-muted-foreground">{plan.slug}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 max-w-[200px] truncate">{plan.description}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div><span className="text-muted-foreground text-xs">Mo:</span> {plan.monthly_price === 0 ? 'Free' : `₹${plan.monthly_price.toLocaleString()}`}</div>
                    <div><span className="text-muted-foreground text-xs">Yr:</span> {plan.annual_price === 0 ? 'Free' : `₹${plan.annual_price.toLocaleString()}`}</div>
                  </td>
                  <td className="px-6 py-4">
                    {plan.discount_percent > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-500">
                        {plan.discount_percent}% OFF
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs">
                    <div>{plan.max_contacts === -1 ? '∞' : plan.max_contacts.toLocaleString()} Contacts</div>
                    <div>{plan.max_messages_pm === -1 ? '∞' : plan.max_messages_pm.toLocaleString()} Msgs</div>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => toggleStatus(plan)}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${plan.is_active ? 'bg-blue-500/15 text-blue-500 hover:bg-blue-500/25' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                    >
                      {plan.is_active ? 'Active' : 'Draft'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => startEdit(plan)} className="rounded-md p-2 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(plan.id)} className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {plans.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No pricing plans found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
