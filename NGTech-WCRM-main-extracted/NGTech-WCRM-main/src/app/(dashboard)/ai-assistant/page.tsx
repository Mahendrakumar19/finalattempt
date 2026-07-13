'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Settings, UserSquare2, Code2, Database, ShieldAlert, Users, Clock, TestTube2, LineChart, Save } from 'lucide-react'
import { GeneralSettingsCard } from '@/components/ai-assistant/GeneralSettingsCard'
import { PersonalityCard } from '@/components/ai-assistant/PersonalityCard'
import { SystemPromptEditor } from '@/components/ai-assistant/SystemPromptEditor'
import { KnowledgeBaseManager } from '@/components/ai-assistant/KnowledgeBaseManager'
import { AIRulesCard } from '@/components/ai-assistant/AIRulesCard'
import { HumanHandoffCard } from '@/components/ai-assistant/HumanHandoffCard'
import { BusinessHoursCard } from '@/components/ai-assistant/BusinessHoursCard'
import { TestingPlayground } from '@/components/ai-assistant/TestingPlayground'
import { AnalyticsDashboard } from '@/components/ai-assistant/AnalyticsDashboard'
import { toast } from 'sonner'

function debounce<T extends (...args: any[]) => void>(func: T, wait: number): T {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return function(this: any, ...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  } as T;
}

const TABS = [
  { id: 'general', label: 'General Settings', icon: Settings },
  { id: 'personality', label: 'Personality', icon: UserSquare2 },
  { id: 'prompt', label: 'System Prompt', icon: Code2 },
  { id: 'knowledge', label: 'Knowledge Base', icon: Database },
  { id: 'rules', label: 'AI Rules', icon: ShieldAlert },
  { id: 'handoff', label: 'Human Handoff', icon: Users },
  { id: 'hours', label: 'Business Hours', icon: Clock },
  { id: 'testing', label: 'Playground', icon: TestTube2 },
  { id: 'analytics', label: 'Analytics', icon: LineChart },
]

export default function AIAssistantPage() {
  const [config, setConfig] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('general')

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/ai-assistant/config')
      if (res.ok) {
        const data = await res.json()
        if (data.config) {
          setConfig(data.config)
        }
      }
    } catch (e) {
      console.error('Failed to load AI config', e)
    } finally {
      setLoading(false)
    }
  }

  // Auto-save implementation
  const saveConfigToServer = useCallback(debounce(async (newConfig: any) => {
    setSaving(true)
    try {
      const res = await fetch('/api/ai-assistant/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      })
      if (!res.ok) throw new Error('Failed to save')
      toast.success('Settings auto-saved')
    } catch (e) {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }, 1000), [])

  const handleConfigChange = (field: string, value: any, category?: string) => {
    setConfig((prev: any) => {
      const next = { ...prev }
      if (category) {
        next[category] = { ...(next[category] || {}), [field]: value }
      } else {
        next[field] = value
      }
      saveConfigToServer(next)
      return next
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI Assistant</h1>
          <p className="mt-1 text-sm text-muted-foreground">Loading enterprise AI configuration...</p>
        </div>
        <div className="flex justify-center items-center h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'general': return <GeneralSettingsCard config={config || {}} onChange={handleConfigChange} />
      case 'personality': return <PersonalityCard config={config || {}} onChange={handleConfigChange} />
      case 'prompt': return <SystemPromptEditor config={config || {}} onChange={handleConfigChange} />
      case 'knowledge': return <KnowledgeBaseManager config={config || {}} onChange={handleConfigChange} />
      case 'rules': return <AIRulesCard config={config || {}} onChange={handleConfigChange} />
      case 'handoff': return <HumanHandoffCard config={config || {}} onChange={handleConfigChange} />
      case 'hours': return <BusinessHoursCard config={config || {}} onChange={handleConfigChange} />
      case 'testing': return <TestingPlayground config={config || {}} />
      case 'analytics': return <AnalyticsDashboard />
      default: return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI Assistant</h1>
          <p className="mt-1 text-sm text-muted-foreground">Enterprise-grade AI configuration and control center.</p>
        </div>
        <div className="flex items-center gap-4">
           {saving ? (
             <div className="flex items-center text-sm text-muted-foreground"><Loader2 className="w-4 h-4 mr-2 animate-spin"/> Saving...</div>
           ) : (
             <div className="flex items-center text-sm text-green-600"><Save className="w-4 h-4 mr-2"/> All changes saved</div>
           )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 pb-12">
        {/* Sidebar Nav */}
        <div className="w-full lg:w-64 shrink-0">
           <ScrollArea className="h-auto max-h-[80vh]">
             <nav className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0">
               {TABS.map((tab) => {
                 const Icon = tab.icon;
                 return (
                   <Button 
                     key={tab.id}
                     variant={activeTab === tab.id ? "default" : "ghost"} 
                     className="justify-start shrink-0" 
                     onClick={() => setActiveTab(tab.id)}
                   >
                     <Icon className="w-4 h-4 mr-3" />
                     {tab.label}
                   </Button>
                 )
               })}
             </nav>
           </ScrollArea>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  )
}
