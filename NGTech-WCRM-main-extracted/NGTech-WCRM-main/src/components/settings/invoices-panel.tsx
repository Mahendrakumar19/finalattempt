'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Receipt, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface Invoice {
  id: string
  amount: number
  status: 'unpaid' | 'paid' | 'overdue'
  issue_date: string
  due_date: string | null
  notes: string | null
}

export function InvoicesPanel() {
  const { accountId } = useAuth()
  const supabase = createClient()
  
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!accountId) return

    async function fetchInvoices() {
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
        console.error('Failed to load invoices:', err)
        setError('Failed to load invoices.')
      } finally {
        setLoading(false)
      }
    }

    fetchInvoices()
  }, [accountId, supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-foreground">Invoices & Billing</h3>
        <p className="text-sm text-muted-foreground">
          View your payment history and outstanding balances.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
          <CardDescription>A complete list of your generated invoices.</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="mb-4 rounded-full bg-muted p-3">
                <Receipt className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No invoices found for your account.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-muted-foreground text-xs font-medium">
                    <th className="px-4 py-3 text-left">Issue Date</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Amount</th>
                    <th className="px-4 py-3 text-left">Due Date</th>
                    <th className="px-4 py-3 text-left">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="transition-colors hover:bg-muted/20">
                      <td className="px-4 py-3 text-foreground whitespace-nowrap">
                        {new Date(inv.issue_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          inv.status === 'paid' ? 'bg-green-500/10 text-green-500' :
                          inv.status === 'overdue' ? 'bg-destructive/10 text-destructive' :
                          'bg-amber-500/10 text-amber-500'
                        }`}>
                          {inv.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                        ${Number(inv.amount).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                        {inv.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
