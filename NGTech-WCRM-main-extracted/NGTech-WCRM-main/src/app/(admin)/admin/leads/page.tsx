'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Mail, Phone, ExternalLink, Calendar, CheckCircle2 } from 'lucide-react'

// Mock Data structure for Leads
interface Lead {
  id: string
  name: string
  email: string
  phone: string
  company_name: string
  lead_source: string
  status: string // 'new', 'contacted', 'demo_scheduled', 'converted', 'lost'
  created_at: string
}

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/leads')
      .then((res) => res.json())
      .then((data) => {
        if (data.leads) {
          setLeads(data.leads)
        }
      })
      .catch((err) => console.error("Error fetching leads:", err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8">Loading leads...</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Platform Leads</h1>
          <p className="text-sm text-muted-foreground">Manage inbound leads from Free Trials and Demo requests.</p>
        </div>
        
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search name or company..."
            className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Prospect</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Contact</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Source</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Date</th>
                <th className="px-6 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-muted/20">
                  <td className="px-6 py-4">
                    <p className="font-medium text-foreground">{lead.name}</p>
                    <p className="text-xs text-muted-foreground">{lead.company_name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-3 w-3" /> <span className="text-xs">{lead.email}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                      <Phone className="h-3 w-3" /> <span className="text-xs">{lead.phone}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                      {lead.lead_source}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <select 
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold appearance-none cursor-pointer outline-none border border-transparent hover:border-border transition-colors ${
                        lead.status === 'new' ? 'bg-blue-500/15 text-blue-500' :
                        lead.status === 'demo_scheduled' ? 'bg-amber-500/15 text-amber-500' :
                        lead.status === 'contacted' ? 'bg-violet-500/15 text-violet-500' :
                        'bg-emerald-500/15 text-emerald-500'
                      }`}
                      defaultValue={lead.status}
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="demo_scheduled">Demo Scheduled</option>
                      <option value="converted">Converted</option>
                      <option value="lost">Lost</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-xs text-muted-foreground">
                    {new Date(lead.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground" title="View Details">
                        <ExternalLink className="h-4 w-4" />
                      </button>
                      <Link 
                        href={`/admin/create-client?name=${encodeURIComponent(lead.company_name || lead.name)}&email=${encodeURIComponent(lead.email)}`}
                        className="rounded-md p-2 text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-500" 
                        title="Convert to Account"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
