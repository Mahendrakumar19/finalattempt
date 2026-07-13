"use client"

import { useAuth } from "@/hooks/use-auth"
import { AlertCircle, Clock } from "lucide-react"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { useEffect, useState } from "react"

export function TrialBanner() {
  const { account, loading, profileLoading } = useAuth()
  const [daysLeft, setDaysLeft] = useState<number | null>(null)
  const [isExpired, setIsExpired] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (account?.plan === 'free' && account.trial_ends_at) {
      const now = new Date()
      const end = new Date(account.trial_ends_at)
      const diffMs = end.getTime() - now.getTime()
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
      
      setDaysLeft(diffDays > 0 ? diffDays : 0)
      setIsExpired(diffDays <= 0)
    }
  }, [account])

  if (!mounted || loading || profileLoading || !account || account.plan !== 'free' || daysLeft === null) {
    return null
  }

  if (isExpired) {
    return (
      <div className="bg-destructive/10 border-b border-destructive/20 text-destructive px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">
            Your 7-day premium trial has expired. Advanced features (Chatbots, Automations, etc.) are now locked.
          </p>
        </div>
        <Link href="/pricing" className={buttonVariants({ variant: "destructive", size: "sm", className: "shrink-0" })}>
          Upgrade Plan
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-700 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5 shrink-0" />
        <p className="text-sm font-medium">
          You are on a 7-day trial of premium features. <strong className="font-bold">{daysLeft} days remaining</strong> before advanced features are deactivated.
        </p>
      </div>
      <Link href="/pricing" className={buttonVariants({ size: "sm", className: "shrink-0 bg-amber-600 hover:bg-amber-700 text-white" })}>
        View Plans
      </Link>
    </div>
  )
}
