"use client"

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/hooks/use-auth'
import { AgentScorecard } from '@/components/dashboard/agent-scorecard'

export default function TeamPerformancePage() {
  const t = useTranslations('Dashboard')
  const { accountRole } = useAuth()
  
  const [scorecard, setScorecard] = useState<any[] | null>(null)
  const [departmentMembers, setDepartmentMembers] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    setLoading(true)
    let url = '/api/analytics/scorecard?'
    if (startDate) url += `startDate=${startDate}&`
    if (endDate) url += `endDate=${endDate}&`
    
    async function load() {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        
        const [scorecardRes, deptMemRes, deptRes] = await Promise.all([
          fetch(url).then(res => res.json()),
          supabase.from('department_members').select('user_id, department_id, role'),
          supabase.from('departments').select('id, name')
        ])
        
        setScorecard(scorecardRes.leaderboard || [])
        if (deptMemRes.data) setDepartmentMembers(deptMemRes.data)
        if (deptRes.data) setDepartments(deptRes.data)
      } catch (err) {
        console.error('[team-performance] data load failed:', err)
      } finally {
        setLoading(false)
      }
    }
    
    load()
  }, [startDate, endDate])

  const title = accountRole === 'agent' ? 'My Performance' : 'Team Performance'
  const subtitle = accountRole === 'agent' 
    ? 'View your personal metrics and SLA compliance.'
    : 'Evaluate response times, resolution rates, and client satisfaction metrics across your entire team.'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {subtitle}
        </p>
      </div>

      <AgentScorecard 
        data={scorecard} 
        loading={loading} 
        startDate={startDate}
        endDate={endDate}
        departmentMembers={departmentMembers}
        departments={departments}
        onDateChange={(start, end) => {
          setStartDate(start)
          setEndDate(end)
        }}
      />
    </div>
  )
}
