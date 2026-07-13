'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Receipt, Plus, Edit2, Trash2 } from 'lucide-react'

interface Invoice {
  id: string
  amount: number
  status: 'unpaid' | 'paid' | 'overdue'
  issue_date: string
  due_date: string | null
  notes: string | null
}

export function AdminInvoicesPanel({ accountId }: { accountId: string }) {
  const supabase = createClient()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  
  // Form state
  const [amount, setAmount] = useState<number | string>('')
  const [status, setStatus] = useState<Invoice['status']>('unpaid')
  const [issueDate, setIssueDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    fetchInvoices()
  }, [accountId])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const { data, error: fetchErr } = await supabase
        .from('invoices')
        .select('*')
        .eq('account_id', accountId)
        .order('issue_date', { ascending: false })

      if (fetchErr) throw fetchErr
      setInvoices(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const payload = {
        account_id: accountId,
        amount: Number(amount) || 0,
        status,
        issue_date: issueDate || new Date().toISOString().split('T')[0],
        due_date: dueDate || null,
        notes: notes || null,
        updated_at: new Date().toISOString()
      }

      if (isEditing) {
        const { error: updateErr } = await supabase
          .from('invoices')
          .update(payload)
          .eq('id', isEditing)
        if (updateErr) throw updateErr
      } else {
        const { error: insertErr } = await supabase
          .from('invoices')
          .insert(payload)
        if (insertErr) throw insertErr
      }
      
      resetForm()
      await fetchInvoices()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return
    try {
      const { error: delErr } = await supabase.from('invoices').delete().eq('id', id)
      if (delErr) throw delErr
      await fetchInvoices()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const resetForm = () => {
    setIsEditing(null)
    setIsCreating(false)
    setAmount('')
    setStatus('unpaid')
    setIssueDate(new Date().toISOString().split('T')[0])
    setDueDate('')
    setNotes('')
  }

  const openEdit = (inv: Invoice) => {
    setIsEditing(inv.id)
    setIsCreating(false)
    setAmount(inv.amount)
    setStatus(inv.status)
    setIssueDate(inv.issue_date)
    setDueDate(inv.due_date || '')
    setNotes(inv.notes || '')
  }

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading invoices...</div>
  if (error) return <div className="p-6 text-sm text-destructive">{error}</div>

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h2 className="text-sm font-semibold text-foreground">Invoices ({invoices.length})</h2>
        {!isCreating && !isEditing && (
          <button
            onClick={() => { resetForm(); setIsCreating(true) }}
            className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-muted"
          >
            <Plus className="h-3.5 w-3.5" /> Add Invoice
          </button>
        )}
      </div>

      {(isCreating || isEditing) && (
        <div className="border-b border-border bg-muted/10 p-6 space-y-4">
          <h3 className="text-sm font-medium">{isEditing ? 'Edit Invoice' : 'New Invoice'}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Amount ($)</label>
              <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="w-full rounded-md border bg-card px-3 py-1.5 text-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as any)} className="w-full rounded-md border bg-card px-3 py-1.5 text-sm">
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Issue Date</label>
              <input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} className="w-full rounded-md border bg-card px-3 py-1.5 text-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Due Date (Optional)</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full rounded-md border bg-card px-3 py-1.5 text-sm" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs text-muted-foreground">Notes / Ref</label>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Invoice #1001" className="w-full rounded-md border bg-card px-3 py-1.5 text-sm" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={resetForm} className="px-3 py-1.5 text-xs border rounded-md hover:bg-muted">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Invoice'}
            </button>
          </div>
        </div>
      )}

      <div className="divide-y divide-border">
        {invoices.length === 0 && !isCreating && !isEditing ? (
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">
            <Receipt className="mx-auto mb-2 h-6 w-6 opacity-20" />
            No invoices recorded yet.
          </div>
        ) : (
          invoices.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-muted/10">
              <div className="flex gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">${Number(inv.amount).toFixed(2)}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                      inv.status === 'paid' ? 'bg-green-500/10 text-green-500' :
                      inv.status === 'overdue' ? 'bg-destructive/10 text-destructive' :
                      'bg-amber-500/10 text-amber-500'
                    }`}>
                      {inv.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{inv.notes || 'No notes'}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right space-y-1">
                  <p className="text-xs text-muted-foreground">Issued: {new Date(inv.issue_date).toLocaleDateString()}</p>
                  {inv.due_date && <p className="text-xs text-muted-foreground">Due: {new Date(inv.due_date).toLocaleDateString()}</p>}
                </div>
                <div className="flex items-center gap-1 border-l pl-4">
                  <button onClick={() => openEdit(inv)} className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted" title="Edit">
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDelete(inv.id)} className="p-1.5 text-muted-foreground hover:text-destructive rounded-md hover:bg-destructive/10" title="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
