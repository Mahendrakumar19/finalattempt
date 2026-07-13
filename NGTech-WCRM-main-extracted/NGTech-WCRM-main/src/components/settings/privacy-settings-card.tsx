"use client"

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { ShieldAlert } from 'lucide-react'

export function PrivacySettingsCard() {
  const { account, accountId, canManageMembers, refreshProfile } = useAuth()
  
  const [loading, setLoading] = useState(false)
  const [maskingEnabled, setMaskingEnabled] = useState(account?.mask_agent_phones ?? false)

  if (!canManageMembers) return null // Only admins/owners can see/edit this

  const handleToggle = async (checked: boolean) => {
    if (!accountId) return
    
    setLoading(true)
    // Optimistic UI
    setMaskingEnabled(checked)
    
    const supabase = createClient()
    const { error } = await supabase
      .from('accounts')
      .update({ mask_agent_phones: checked })
      .eq('id', accountId)
      
    if (error) {
      console.error('Failed to update masking setting', error)
      setMaskingEnabled(!checked) // Revert
      toast.error('Failed to update privacy settings')
    } else {
      await refreshProfile()
      toast.success(`Agent phone masking is now ${checked ? 'enabled' : 'disabled'}.`)
    }
    
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-primary" />
          <CardTitle>Workspace Privacy</CardTitle>
        </div>
        <CardDescription>
          Manage compliance and privacy settings for your workspace.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between space-x-2">
          <div className="space-y-0.5">
            <Label htmlFor="mask-phones">Mask Agent Phone Numbers</Label>
            <p className="text-sm text-muted-foreground max-w-sm">
              Hide contact phone numbers from Agents in the UI (e.g. +91 98*** **321) to prevent data theft. Admins will still see the full number.
            </p>
          </div>
          <Switch 
            id="mask-phones" 
            checked={maskingEnabled} 
            onCheckedChange={handleToggle} 
            disabled={loading}
          />
        </div>
      </CardContent>
    </Card>
  )
}
