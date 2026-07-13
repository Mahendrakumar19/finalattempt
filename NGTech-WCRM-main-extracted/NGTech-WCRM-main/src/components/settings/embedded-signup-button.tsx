'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'

interface PhoneInfo {
  id: string
  display_phone_number: string
  verified_name: string
  quality_rating?: string
}

interface EmbeddedSignupButtonProps {
  onSuccess?: () => void
}

export function EmbeddedSignupButton({ onSuccess }: EmbeddedSignupButtonProps) {
  const [isSdkLoaded, setIsSdkLoaded] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const router = useRouter()

  const [session, setSession] = useState<{ id: string, has_existing: boolean, phone_numbers: PhoneInfo[] } | null>(null)
  const [selectedPhoneId, setSelectedPhoneId] = useState<string>('')
  const [isConfirming, setIsConfirming] = useState(false)

  useEffect(() => {
    // Load Facebook SDK
    if (window.FB) {
      setIsSdkLoaded(true)
      return
    }

    const loadFbSdk = () => {
      window.fbAsyncInit = function () {
        window.FB.init({
          appId: process.env.NEXT_PUBLIC_META_APP_ID || '', // Needs to be configured
          autoLogAppEvents: true,
          xfbml: true,
          version: 'v19.0',
        })
        setIsSdkLoaded(true)
      }

      const script = document.createElement('script')
      script.src = 'https://connect.facebook.net/en_US/sdk.js'
      script.async = true
      script.defer = true
      document.body.appendChild(script)
    }

    loadFbSdk()
  }, [])

  const handleConnect = () => {
    if (!process.env.NEXT_PUBLIC_META_APP_ID) {
      toast.error('Meta App ID is missing in environment variables (.env.local)')
      return
    }

    if (!window.FB) {
      toast.error('Facebook SDK failed to load. Check your network or adblocker.')
      return
    }

    setIsConnecting(true)

    window.FB.login(
      (response: any) => {
        if (response.authResponse && response.authResponse.code) {
          const code = response.authResponse.code
          
          fetch('/api/whatsapp/embedded-signup/callback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.error) {
                toast.error(`Connection failed: ${data.error}`)
                setIsConnecting(false)
              } else {
                // Backend created a session, now we must select phone number and confirm
                setSession({
                  id: data.session_id,
                  has_existing: data.has_existing,
                  phone_numbers: data.phone_numbers
                })
                
                if (data.phone_numbers.length === 1) {
                  setSelectedPhoneId(data.phone_numbers[0].id)
                }
                
                setIsConnecting(false)
              }
            })
            .catch(() => {
              toast.error('Failed to process connection on the server.')
              setIsConnecting(false)
            })
        } else {
          toast.error('User cancelled login or did not fully authorize.')
          setIsConnecting(false)
        }
      },
      {
        config_id: process.env.NEXT_PUBLIC_META_CONFIG_ID, // Optional: Facebook Configuration ID
        response_type: 'code',    // 'code' for Embedded Signup flow
        override_default_response_type: true,
        extras: {
          setup: {},
        },
      }
    )
  }

  const handleConfirm = () => {
    if (!session || !selectedPhoneId) return

    setIsConfirming(true)
    fetch('/api/whatsapp/embedded-signup/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: session.id,
        phone_number_id: selectedPhoneId,
        confirm_replace: session.has_existing
      })
    })
      .then(res => res.json())
      .then(data => {
        setIsConfirming(false)
        if (data.error) {
          toast.error(`Failed to confirm: ${data.error}`)
        } else {
          toast.success('WhatsApp connected successfully!')
          setSession(null)
          if (onSuccess) onSuccess()
          router.refresh()
        }
      })
      .catch(() => {
        toast.error('Failed to process confirmation.')
        setIsConfirming(false)
      })
  }

  return (
    <>
      <Button
        onClick={handleConnect}
        disabled={!isSdkLoaded || isConnecting}
        className="w-full bg-[#1877F2] text-white hover:bg-[#1877F2]/90 flex items-center justify-center gap-2"
      >
        {isConnecting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        )}
        Connect with Facebook
      </Button>

      <Dialog open={!!session} onOpenChange={(open) => !open && setSession(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete WhatsApp Setup</DialogTitle>
            <DialogDescription>
              {session?.has_existing 
                ? 'Your workspace already has a connected WhatsApp account. Continuing will replace it (old data is preserved, but new messages will route to this new number).' 
                : 'Select the phone number you want to connect.'}
            </DialogDescription>
          </DialogHeader>
          
          {session?.phone_numbers && session.phone_numbers.length > 1 && (
            <div className="py-4">
              <Label className="mb-3 block text-sm font-medium">Select Phone Number</Label>
              <RadioGroup value={selectedPhoneId} onValueChange={setSelectedPhoneId}>
                {session.phone_numbers.map((phone) => (
                  <div key={phone.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={phone.id} id={phone.id} />
                    <Label htmlFor={phone.id}>{phone.verified_name} ({phone.display_phone_number})</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSession(null)} disabled={isConfirming}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={!selectedPhoneId || isConfirming}>
              {isConfirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {session?.has_existing ? 'Replace Connection' : 'Confirm Connection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

declare global {
  interface Window {
    fbAsyncInit: () => void
    FB: any
  }
}
